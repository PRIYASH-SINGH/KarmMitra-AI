from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.user import OfficialProfile
from app.models.triage import TriageQuestion
from app.models.kcm import KCMCompetency
from app.schemas.assessment import (
    TriageSubmitIn, 
    TriageResultOut, 
    TriageQuestionPublicOut, 
    TriageOption,
    CompetencyGapOut
)

router = APIRouter()


@router.get("/questions", response_model=list[TriageQuestionPublicOut])
async def get_triage_questions(
    role: str = Query(..., description="FRAC role code from LTI launch"),
    db: AsyncSession = Depends(get_db)
):
    """
    INTENT: Provide the 5-question Baseline Diagnostic Triage.
    This solves the 'Cold Start' problem by establishing immediate KCM baseline
    metrics for brand new junior statistical investigators on day one.
    """
    # Fetch questions from DB instead of using static mocks
    query = select(TriageQuestion).where(TriageQuestion.role_code == role)
    result = await db.execute(query)
    questions = result.scalars().all()
    
    if not questions:
        # Fallback to a default role if no questions exist yet
        query = select(TriageQuestion).where(TriageQuestion.role_code == "MOSPI_FOD_INV_01")
        result = await db.execute(query)
        questions = result.scalars().all()

    return [
        TriageQuestionPublicOut(
            id=str(q.id),
            competency_code=q.competency_code,
            questionText=q.question_text,
            options=[TriageOption(key=opt["key"], text=opt["text"]) for opt in q.options]
        )
        for q in questions
    ]


@router.post("/submit", response_model=TriageResultOut)
async def submit_triage(payload: TriageSubmitIn, db: AsyncSession = Depends(get_db)):
    """
    INTENT: Process the triage submission and handle the Cold Start Auto-Upsert.
    When an official finishes the triage, their score is saved. If they don't exist
    in the database (because they just logged in via LTI for the first time), 
    we create their profile on the fly.
    """
    
    if not payload.answers:
        raise HTTPException(status_code=400, detail="No answers provided.")
        
    # Fetch questions to grade
    query = select(TriageQuestion).where(TriageQuestion.role_code == payload.role_code)
    result = await db.execute(query)
    questions = result.scalars().all()
    
    if not questions:
        # Fallback
        query = select(TriageQuestion).where(TriageQuestion.role_code == "MOSPI_FOD_INV_01")
        result = await db.execute(query)
        questions = result.scalars().all()
        
    correct_count = 0
    total_questions = len(questions)
    gap_codes_set = set()
    
    for q in questions:
        q_id_str = str(q.id)
        if payload.answers.get(q_id_str) == q.correct_option:
            correct_count += 1
        else:
            gap_codes_set.add(q.competency_code)
            
    computed_score = (correct_count / total_questions) * 100.0 if total_questions > 0 else 0

    # INTENT: Fetch user or auto-create if launched via LTI without pre-seeding (Cold Start).
    query = select(OfficialProfile).where(OfficialProfile.user_id == payload.user_id)
    result = await db.execute(query)
    user = result.scalars().first()

    if not user:
        # FIX (Blind Spot #1): Graceful handling of dynamic LTI identities.
        # We use the role_code provided by Member 4 (which got it from Member 3's JWT).
        user = OfficialProfile(
            user_id=payload.user_id,
            frac_role_code=payload.role_code,
            triage_completed=True,
            triage_score=computed_score
        )
        db.add(user)
    else:
        user.triage_completed = True
        user.triage_score = computed_score

    await db.commit()
    await db.refresh(user)

    # Fetch competency names for identified gaps
    identified_gaps_out = []
    if gap_codes_set:
        comp_query = select(KCMCompetency).where(KCMCompetency.competency_code.in_(gap_codes_set))
        comp_result = await db.execute(comp_query)
        competencies = comp_result.scalars().all()
        for comp in competencies:
            identified_gaps_out.append(
                CompetencyGapOut(
                    competency_code=comp.competency_code,
                    competency_name=comp.name
                )
            )

    # INTENT: Return gap analysis payload matching Member 4's expected callback contract.
    return TriageResultOut(
        user_id=user.user_id,
        score=user.triage_score,
        status="completed",
        identified_gaps=identified_gaps_out
    )
