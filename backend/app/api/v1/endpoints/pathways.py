from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.models.user import OfficialProfile
from app.schemas.pathway import PathwayResponse, PathwayItem

router = APIRouter()

@router.get("/{user_id}", response_model=PathwayResponse)
async def get_learning_pathway(user_id: str, db: AsyncSession = Depends(get_db)):
    """
    INTENT: Generate the 70:20:10 Capacity Building Commission (CBC) pathway.
    Based on the official's triage score and identified gaps, we dynamically
    recommend a mix of Experiential, Collaborative, and Formal training modules.
    """
    
    query = select(OfficialProfile).where(OfficialProfile.user_id == user_id)
    result = await db.execute(query)
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="Official profile not found. Complete triage first.")

    # Base score determines the intensity of the pathway
    score = user.triage_score
    items = []

    # INTENT: 70% Experiential (On-the-job tasks)
    # Applied to all field officers regardless of score, but intensity changes.
    items.append(
        PathwayItem(
            type="70_EXPERIENTIAL",
            title="Supervised CAPI Block Survey",
            competency="KCM_FUNC_STAT_04 (CAPI Data Collection)",
            duration="3 Days (Field)"
        )
    )

    # INTENT: 20% Collaborative (Workshops/Peer learning)
    # Triggered heavily if scores are below 75 (needs peer intervention)
    if score < 75.0:
        items.append(
            PathwayItem(
                type="20_COLLABORATIVE",
                title="NSSTA Regional Workshop: Handling Survey Non-Response",
                competency="KCM_BEH_ETHICS_03 (Ethical Governance)",
                duration="Half-Day (Virtual)"
            )
        )

    # INTENT: 10% Formal (iGOT / LMS standard courses)
    # Foundational theory courses triggered if score is critically low (< 50)
    if score < 50.0:
        items.append(
            PathwayItem(
                type="10_FORMAL",
                title="Introduction to Urban Frame Survey (UFS) Methods",
                competency="KCM_FUNC_SURVEY_02 (Survey Sampling)",
                duration="2 Hours (iGOT LMS)"
            )
        )
    else:
        # Standard formal course for proficient users
        items.append(
            PathwayItem(
                type="10_FORMAL",
                title="Advanced Index Theory Refresher",
                competency="KCM_DOM_INDEX_01 (Index Theory)",
                duration="1 Hour (iGOT LMS)"
            )
        )

    return PathwayResponse(
        user_id=user.user_id,
        triage_score=score,
        items=items
    )
