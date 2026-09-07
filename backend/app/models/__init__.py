"""
KarmMitra AI — Models Package Init (Member 1: Priyash)
======================================================

INTENT:
  Importing all models here ensures that when main.py does
  `import app.models`, every SQLAlchemy model class is registered
  with Base.metadata BEFORE `create_all()` runs.

  Without these imports, Base.metadata.create_all() would silently
  create zero tables — the most insidious silent failure in SQLAlchemy.
"""

from app.models.frac import FRACRole, RoleCompetencyMapping  # noqa: F401
from app.models.kcm import KCMCompetency  # noqa: F401
from app.models.user import OfficialProfile, AssessmentResult  # noqa: F401
