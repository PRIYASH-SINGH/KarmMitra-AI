"""
KarmMitra AI — KCM Competency Models (Member 1: Priyash)
=========================================================

INTENT:
  Models the 34 competencies from the Karmayogi Competency Model (KCM)
  defined by the Capacity Building Commission (CBC).

  These competencies are grouped into three domains:
    - Functional: role-specific technical skills (CAPI, survey sampling)
    - Behavioural: soft skills (communication, ethical governance)
    - Domain: cross-cutting knowledge (data cleaning, index theory)

WHY baseline_threshold as Float:
  Different competencies have different passing bars. CAPI Data Entry
  might require 85% proficiency while Ethical Governance only needs 70%.
  This lets the triage engine calculate per-competency gap severity
  rather than using a single global pass/fail cutoff.
"""

from sqlalchemy import Column, Integer, String, Float

from app.core.database import Base


class KCMCompetency(Base):
    """
    A single competency from the Karmayogi Competency Model catalog.

    The competency_code is the stable identifier used across:
    - Triage question tagging
    - RAG assessment generation (sent to Member 2's generator)
    - AGS grade passback to iGOT (via Member 3)
    - Admin dashboard radar chart labels (Member 5)
    """
    __tablename__ = "kcm_competencies"

    id = Column(Integer, primary_key=True, index=True)

    # INTENT: Stable code that persists across schema changes.
    # "KCM_FUNC_STAT_04" is referenced in prompts, seed data, and LTI claims.
    competency_code = Column(
        String(50), unique=True, index=True, nullable=False,
        comment="e.g., KCM_FUNC_STAT_04"
    )

    name = Column(
        String(255), nullable=False,
        comment="e.g., CAPI Data Collection"
    )

    # INTENT: Domain classification determines the 70:20:10 pathway bucket.
    # Functional → 70% experiential tasks
    # Behavioural → 20% collaborative workshops
    # Domain → 10% formal iGOT courses
    domain = Column(
        String(50), nullable=False,
        comment="Functional | Behavioural | Domain"
    )

    # INTENT: The minimum score percentage an official must achieve.
    # Used by triage.py to determine if a competency is a "gap".
    baseline_threshold = Column(
        Float, default=70.0,
        comment="Passing percentage for this competency"
    )
