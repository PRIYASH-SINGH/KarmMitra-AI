import httpx
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

@router.post("/generate", response_model=AssessmentGenerateOut)
async def generate_assessment(payload: AssessmentRequestIn):
    """
    INTENT: Proxy request to Member 2's local Sovereign AI (vLLM/ChromaDB).
    This keeps the React frontend completely unaware of AI internals and 
    avoids browser CORS issues by keeping the LLM call strictly server-to-server.
    """
    
    # Member 2's endpoint is configured via RAG_SERVICE_URL in .env
    # e.g., http://host.docker.internal:11434 (or wherever the RAG API is exposed)
    rag_api = f"{settings.rag_service_url}/api/v1/rag/generate"
    
    # In a full production implementation, we would POST to Member 2.
    # For the gateway mock/stub during concurrent team dev, we can return 
    # a verified synthetic payload matching Member 2's strict Pydantic JSON schema.
    try:
        # Example of the actual call (timeout 30s as LLM generation takes time):
        # async with httpx.AsyncClient(timeout=30.0) as client:
        #     res = await client.post(rag_api, json=payload.model_dump())
        #     res.raise_for_status()
        #     return AssessmentGenerateOut.model_validate(res.json())
        pass
    except Exception as e:
        print(f"RAG service unavailable, falling back to cached response: {e}")

    # Fallback/Stub so Member 4 can continue building the UI 
    # even if Member 2's Docker container is currently offline.
    return AssessmentGenerateOut(
        questions=[
            {
                "competency_code": payload.competency_code,
                "question_text": f"According to the MoSPI manual, what is the core procedure for {payload.competency_name}?",
                "options": [
                    {"key": "A", "text": "Record data only during office hours."},
                    {"key": "B", "text": "Use the authorized digital schedule (CAPI)."},
                    {"key": "C", "text": "Consult external databases without verification."},
                    {"key": "D", "text": "Estimate the figures visually."}
                ],
                "correct_option": "B",
                "justification": "MoSPI Field Manual Chapter 4 explicitly mandates CAPI usage for primary data collection."
            }
        ]
    )

@router.post("/submit", response_model=AssessmentSubmitOut)
async def submit_assessment(payload: AssessmentSubmitIn, db: AsyncSession = Depends(get_db)):
    """
    INTENT: Grade the assessment, save the result, and trigger Member 3's AGS passback.
    """
    
    # 1. Calculate Score
    total_questions = len(payload.correct_answers)
    if total_questions == 0:
        raise HTTPException(status_code=400, detail="No answers provided.")
        
    correct_count = 0
    for q_idx, correct_key in payload.correct_answers.items():
        if payload.answers.get(q_idx) == correct_key:
            correct_count += 1
            
    score = (correct_count / total_questions) * 100.0

    # 2. Look up Competency ID (needed for FK constraint)
    comp_query = select(KCMCompetency).where(KCMCompetency.competency_code == payload.competency_code)
    comp_result = await db.execute(comp_query)
    competency = comp_result.scalars().first()
    
    # If competency not found in DB, use a fallback ID or raise (using 1 for prototype robustness)
    comp_id = competency.id if competency else 1

    # 3. Save to Database
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

    # 4. Trigger AGS Passback (Member 3's domain)
    # If the user launched via LTI, we have a lineitem URL to send the grade to.
    ags_status = "pending"
    if payload.lineitem_url:
        try:
            # Here we would call Member 3's internal passback function/service
            # e.g., await lti_client.submit_score(...)
            # For now, simulate success:
            ags_status = "success"
            result_record.ags_passback_status = "success"
            await db.commit()
        except Exception:
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
