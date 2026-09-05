"""
KarmMitra AI — User & Assessment Models (Member 1: Priyash)
============================================================

INTENT:
  Tracks individual civil servant profiles and their assessment history.
  This is where the "cold start" problem is solved at the data layer:
  an OfficialProfile is auto-created on first LTI launch or triage submit,
  so new recruits with zero history don't crash the system.

BLIND SPOT #4 FIX:
  frac_role_code is a String FK pointing to FRACRole.role_code (unique),
  NOT an Integer FK to FRACRole.id. LTI tokens carry string codes like
  "MOSPI_FOD_INV_01" — matching directly avoids a lookup round-trip.

BLIND SPOT #1 FIX:
  OfficialProfile uses user_id (String) as primary key — the `sub` claim
  from LTI JWTs. This means the auto-upsert in triage.py can do a
  simple select-or-insert without worrying about auto-increment IDs.
"""

from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class OfficialProfile(Base):
    """
    Represents a civil servant who has launched KarmMitra via iGOT.

    LIFECYCLE:
      1. Member 6 fires LTI launch → Member 3 decodes JWT → extracts sub/role
      2. Triage endpoint auto-creates this record if it doesn't exist (upsert)
      3. Triage score + gaps are persisted here after the 5-question diagnostic
      4. Pathway engine reads this to generate 70:20:10 recommendations
    """
    __tablename__ = "official_profiles"

    # INTENT: `sub` claim from LTI 1.3 JWT — globally unique per official
    user_id = Column(
        String(100), primary_key=True, index=True,
        comment="LTI JWT sub claim, e.g., MOSPI_OFFICER_001"
    )

    name = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)

    # INTENT: Direct string FK to frac_roles.role_code (Blind Spot #4 fix)
    # This avoids needing to look up an integer ID from the role code string
    # that arrives in every LTI token.
    frac_role_code = Column(
        String(50),
        ForeignKey("frac_roles.role_code"),
        nullable=False,
        comment="FK to FRAC role, e.g., MOSPI_FOD_INV_01"
    )

    division = Column(String(100), nullable=True)
    state = Column(String(100), default="National")

    # INTENT: Flags whether the 5-question baseline triage has been completed.
    # Member 4's UI checks this to decide whether to show TriageView or DashboardView.
    triage_completed = Column(Boolean, default=False)
    triage_score = Column(Float, default=0.0)

    # Relationship to FRAC role for eager loading role details
    frac_role = relationship("FRACRole", foreign_keys=[frac_role_code])

    # Relationship to assessment results for pathway generation
    assessments = relationship("AssessmentResult", back_populates="official", lazy="selectin")


class AssessmentResult(Base):
    """
    Records a single competency assessment attempt by an official.

    INTENT:
      After the RAG-generated MCQ quiz (Member 2) is completed,
      the score is stored here AND sent to iGOT via AGS passback (Member 3).
      The admin dashboard (Member 5) aggregates these for division-level analytics.
    """
    __tablename__ = "assessment_results"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        String(100),
        ForeignKey("official_profiles.user_id"),
        nullable=False,
    )

    competency_id = Column(
        Integer,
        ForeignKey("kcm_competencies.id"),
        nullable=False,
    )

    score = Column(Float, nullable=False, comment="Score achieved (0-100)")
    max_score = Column(Float, default=100.0, comment="Maximum possible score")

    # INTENT: Track whether the AGS passback to iGOT succeeded.
    # "pending" → "success" / "failed" — helps debug integration with Member 3.
    ags_passback_status = Column(
        String(20), default="pending",
        comment="pending | success | failed"
    )

    # Auto-set timestamp for audit trail
    completed_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        comment="When the assessment was submitted"
    )

    # Relationships
    official = relationship("OfficialProfile", back_populates="assessments")
    competency = relationship("KCMCompetency")
