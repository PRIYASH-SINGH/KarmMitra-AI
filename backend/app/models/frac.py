"""
KarmMitra AI — FRAC Role Models (Member 1: Priyash)
====================================================

INTENT:
  Models the Functional Roles Activity & Competency (FRAC) framework
  used by iGOT Karmayogi to categorize civil servant positions.

  In the MoSPI context, roles map to operational divisions:
    - FOD (Field Operations Division) — field investigators
    - SDRD (Survey Design & Research Division) — survey methodologists
    - NAD (National Accounts Division) — GDP/CPI/IIP economists
    - NSSTA (National Statistical Systems Training Academy) — trainers

WHY role_code is unique + indexed (Blind Spot #4 Fix):
  LTI 1.3 JWT tokens carry string codes like "MOSPI_FOD_INV_01",
  not integer IDs. OfficialProfile.frac_role_code foreign-keys to
  this string column directly, avoiding a lossy int-to-string
  translation layer that would break Member 3's handshake.

WHY RoleCompetencyMapping is a separate join table:
  A single FRAC role may require mastery of multiple KCM competencies
  (many-to-many). The `required_proficiency` field (1-5 scale) lets
  the triage engine calculate gap severity, not just presence/absence.
"""

from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class FRACRole(Base):
    """
    Represents a government position within MoSPI's organizational hierarchy.
    Each role has a unique string code that LTI tokens reference directly.
    """
    __tablename__ = "frac_roles"

    id = Column(Integer, primary_key=True, index=True)

    # INTENT: This is the canonical identifier carried in LTI JWTs.
    # Must be unique so OfficialProfile can FK to it reliably.
    role_code = Column(
        String(50), unique=True, index=True, nullable=False,
        comment="e.g., MOSPI_FOD_INV_01 — matches LTI custom claim"
    )

    role_title = Column(
        String(255), nullable=False,
        comment="e.g., Statistical Field Investigator"
    )

    # INTENT: Division determines which KCM competency cluster applies.
    # FOD roles need CAPI skills; NAD roles need index theory skills.
    division = Column(
        String(100), nullable=False,
        comment="e.g., Field Operations Division (FOD)"
    )

    description = Column(Text, nullable=True)

    # Backref: which competencies does this role require?
    required_competencies = relationship(
        "RoleCompetencyMapping", back_populates="role", lazy="selectin"
    )


class RoleCompetencyMapping(Base):
    """
    Join table: maps FRAC roles to KCM competencies with a required
    proficiency level. This drives the triage gap calculation.

    EXAMPLE:
      MOSPI_FOD_INV_01 requires KCM_FUNC_STAT_04 (CAPI Data Collection)
      at proficiency level 3 out of 5.
    """
    __tablename__ = "role_competency_mappings"

    id = Column(Integer, primary_key=True, index=True)

    role_id = Column(
        Integer, ForeignKey("frac_roles.id"), nullable=False
    )

    competency_id = Column(
        Integer, ForeignKey("kcm_competencies.id"), nullable=False
    )

    # INTENT: 1=Awareness, 2=Basic, 3=Intermediate, 4=Advanced, 5=Expert
    # The triage compares user score against this threshold.
    required_proficiency = Column(Integer, default=3)

    role = relationship("FRACRole", back_populates="required_competencies")
    competency = relationship("KCMCompetency")
