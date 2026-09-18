import httpx
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.config import settings
from app.core.database import get_db
from app.models.user import AssessmentResult
from app.models.kcm import KCMCompetency
from app.schemas.assessment import (
    AssessmentRequestIn,
    AssessmentGenerateOut,
    AssessmentSubmitIn,
    AssessmentSubmitOut
)

router = APIRouter()

# Server-side cache for answer keys. Key: f"{user_id}_{competency_code}"
# Value: dict mapping str(index) -> correct_option
assessment_keys_cache = {}

synthetic_fallback = [
    {
        "competency_code": "FALLBACK",
        "question_text": "Synthetic Question 1: Based on standard MoSPI guidelines, what is the primary protocol?",
        "options": [
            {"key": "A", "text": "Standard protocol A"},
            {"key": "B", "text": "Alternative procedure B"},
            {"key": "C", "text": "Fallback mechanism C"},
            {"key": "D", "text": "Emergency override D"}
        ],
        "correct_option": "A",
        "justification": "Synthetic fallback justification: Standard protocol A is established in the manual."
    },
    {
        "competency_code": "FALLBACK",
        "question_text": "Synthetic Question 2: How should anomalies in the sampling frame be documented?",
        "options": [
            {"key": "A", "text": "Ignore and proceed"},
            {"key": "B", "text": "Record detailed observations and escalate to supervisor"},
            {"key": "C", "text": "Estimate the missing data"},
            {"key": "D", "text": "Exclude the sample unit completely"}
        ],
        "correct_option": "B",
        "justification": "Synthetic fallback justification: Accurate documentation and escalation is critical."
    },
    {
        "competency_code": "FALLBACK",
        "question_text": "Synthetic Question 3: Which tool is predominantly utilized for secure field data collection?",
        "options": [
            {"key": "A", "text": "CAPI (Computer Assisted Personal Interviewing)"},
            {"key": "B", "text": "Manual ledger books"},
            {"key": "C", "text": "Public cloud drives"},
            {"key": "D", "text": "Unencrypted text messages"}
        ],
        "correct_option": "A",
        "justification": "Synthetic fallback justification: CAPI ensures real-time secure digital data capture."
    }
]

@router.post("/generate", response_model=AssessmentGenerateOut)
async def generate_assessment(payload: AssessmentRequestIn):
    """
    INTENT: Proxy request to Member 2's local Sovereign AI (vLLM/ChromaDB).
    This keeps the React frontend completely unaware of AI internals and 
    avoids browser CORS issues by keeping the LLM call strictly server-to-server.
    """
    
    rag_api = f"{settings.cors_origins.split(',')[0].replace('3000', '8000')}/api/v1/rag/generate"
    # Or just use the local route:
    rag_api = "http://localhost:8000/api/v1/rag/generate"
    
    questions = []
    
    for attempt in range(2):
        try:
            async with httpx.AsyncClient(timeout=180.0) as client:
                res = await client.post(
                    rag_api, 
                    params={
                        "competency_name": payload.competency_name,
                        "competency_code": payload.competency_code,
                        "question_count": payload.question_count
                    }
                )
                res.raise_for_status()
                data = res.json()
                questions = data.get("questions", [])
                if len(questions) == payload.question_count:
                    break
                else:
                    logging.warning(f"Attempt {attempt+1}: Expected {payload.question_count} questions, got {len(questions)}")
        except Exception as e:
            logging.error(f"Generation attempt {attempt+1} failed: {e}")
            
    # Pad or trim to exactly payload.question_count
    if len(questions) > payload.question_count:
        questions = questions[:payload.question_count]
    elif len(questions) < payload.question_count:
        needed = payload.question_count - len(questions)
        for i in range(needed):
            idx = len(questions) % len(synthetic_fallback)
            fallback_q = synthetic_fallback[idx].copy()
            fallback_q["competency_code"] = payload.competency_code
            questions.append(fallback_q)
            
    # Cache the answer key server-side
    cache_key = f"{payload.user_id}_{payload.competency_code}"
    # The frontend usually submits answers keyed by the question index as string
    answer_key = {str(i): q["correct_option"] for i, q in enumerate(questions)}
    assessment_keys_cache[cache_key] = answer_key
    
    return AssessmentGenerateOut(questions=questions)

@router.post("/submit", response_model=AssessmentSubmitOut)
async def submit_assessment(payload: AssessmentSubmitIn, db: AsyncSession = Depends(get_db)):
    """
    INTENT: Grade the assessment against the server-side cache, save the result, and trigger AGS passback.
    """
    
    cache_key = f"{payload.user_id}_{payload.competency_code}"
    cached_answers = assessment_keys_cache.get(cache_key)
    
    if not cached_answers:
        # Fallback if cache is cleared (e.g. server restart)
        logging.warning("Server-side answer key missing, trusting client as fallback.")
        cached_answers = payload.correct_answers
    
    total_questions = len(cached_answers)
    if total_questions == 0:
        raise HTTPException(status_code=400, detail="No answers provided or cached.")
        
    correct_count = 0
    for q_idx, correct_key in cached_answers.items():
        if payload.answers.get(q_idx) == correct_key:
            correct_count += 1
            
    score = (correct_count / total_questions) * 100.0

    comp_query = select(KCMCompetency).where(KCMCompetency.competency_code == payload.competency_code)
    comp_result = await db.execute(comp_query)
    competency = comp_result.scalars().first()
    
    comp_id = competency.id if competency else 1

    result_record = AssessmentResult(
        user_id=payload.user_id,
        competency_id=comp_id,
        score=score,
        max_score=100.0,
        ags_passback_status="pending"
    )
    db.add(result_record)
    await db.commit()
    await db.refresh(result_record)

    ags_status = "pending"
    if payload.lineitem_url:
        import httpx
        try:
            async with httpx.AsyncClient() as client:
                res = await client.post(
                    "http://localhost:8000/lti/grade",
                    json={
                        "lineitem_url": payload.lineitem_url,
                        "score": {
                            "userId": payload.user_id,
                            "scoreGiven": score,
                            "scoreMaximum": 100.0,
                            "comment": f"Scored via RAG for {payload.competency_code}",
                            "activityProgress": "Completed",
                            "gradingProgress": "FullyGraded"
                        }
                    },
                    timeout=10.0
                )
                if res.status_code == 200 and res.json().get("success"):
                    ags_status = "success"
                    result_record.ags_passback_status = "success"
                else:
                    ags_status = "failed"
                    result_record.ags_passback_status = "failed"
            await db.commit()
        except Exception as e:
            logging.error(f"AGS passback error: {e}")
            ags_status = "failed"
            result_record.ags_passback_status = "failed"
            await db.commit()

    return AssessmentSubmitOut(
        user_id=payload.user_id,
        competency_code=payload.competency_code,
        score=score,
        max_score=100.0,
        ags_status=ags_status
    )
