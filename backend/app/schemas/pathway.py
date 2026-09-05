"""
KarmMitra AI — Pathway Schemas (Member 1: Priyash)
====================================================

INTENT:
  Data contracts for the 70:20:10 learning pathway recommendations.
  After triage identifies competency gaps, the pathway engine recommends
  a mix of:
    - 70% Experiential: On-job field survey tasks (e.g., CAPI data collection)
    - 20% Collaborative: NSSTA peer workshops
    - 10% Formal: iGOT online courses

CONTRACT ALIGNMENT:
  PathwayItem matches exactly what Member 4's PathwayCard.jsx expects:
    { type, title, competency, duration }
  The `type` field uses the enum values that PathwayCard's getTypeBadge()
  switch statement handles: '10_FORMAL', '20_COLLABORATIVE', '70_EXPERIENTIAL'
"""

from pydantic import BaseModel, Field
from typing import List, Literal


class PathwayItem(BaseModel):
    """
    INTENT: A single learning activity recommendation.
    Matches the `item` prop destructured in PathwayCard.jsx:
      {getTypeBadge(item.type)} → {item.title} → {item.competency} → {item.duration}
    """
    type: Literal["70_EXPERIENTIAL", "20_COLLABORATIVE", "10_FORMAL"] = Field(
        description="70_EXPERIENTIAL | 20_COLLABORATIVE | 10_FORMAL — "
                    "drives the Chip/badge in PathwayCard.jsx"
    )
    title: str = Field(description="Activity title, e.g., 'CAPI Field Data Collection Exercise'")
    competency: str = Field(description="KCM competency name this activity addresses")
    duration: str = Field(description="Estimated time, e.g., '2 hours' or '1 day field work'")


class PathwayResponse(BaseModel):
    """
    INTENT: Full pathway response for a user, returned by GET /api/v1/pathways/{user_id}.
    Member 4's DashboardView maps over `items` to render PathwayCard components.
    """
    user_id: str
    triage_score: float
    items: List[PathwayItem] = Field(
        default_factory=list,
        description="Ordered list of 70:20:10 learning activities"
    )
