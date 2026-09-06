"""
KarmMitra AI — Unified FastAPI Gateway Entry Point (Member 1: Priyash)
======================================================================

INTENT:
  Single entry point for the entire backend. Mounts:
    - Member 1: Core API (triage, pathways, assessment, admin)
    - Member 3: LTI 1.3 Security (OIDC, launch, AGS, Bhashini)
    - Member 2: RAG Assessment Service (in-process bridge)
  Every HTTP request from Members 3, 4, 5, and 6 flows through port 8000.

ARCHITECTURAL DECISION:
  Using FastAPI's `lifespan` context manager (not deprecated @app.on_event)
  for startup/shutdown. This ensures async DB table creation works correctly
  with asyncpg — directly calling Base.metadata.create_all() on an async
  engine would crash (Blind Spot #2 fix).

CROSS-TEAM INTEGRATION:
  The LTI and RAG subsystems live in separate directories (lti-security/,
  rag-service/) with their own internal `from app.xxx` import conventions.
  To avoid namespace collisions with backend/app/, we inject their root
  directories into sys.path only when their router/service is being loaded,
  then restore the path. Both imports are wrapped in try/except for graceful
  degradation if a teammate's code is unavailable.
"""

import sys
import logging
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1.api import api_router
from app.seed import seed_initial_data

# Import all models so Base.metadata knows about every table before create_all.
# Without this import, create_all would create zero tables — a silent, brutal bug.
import app.models  # noqa: F401

logger = logging.getLogger("karmmitra.gateway")

# ─── Cross-Team Module Resolution ─────────────────────────────────────────
# The workspace root is two levels up from this file (backend/app/main.py → workspace/)
_workspace_root = Path(__file__).resolve().parent.parent.parent

# ─── Member 3: LTI Security Router ────────────────────────────────────────
# lti-security/app/ uses `from app.core.config import settings` internally.
# We temporarily prepend lti-security/ to sys.path so its `app` resolves
# to lti-security/app/ (not backend/app/), then import and restore.
_lti_router = None
try:
    _lti_root = str(_workspace_root / "lti-security")
    sys.path.insert(0, _lti_root)
    from app.router import lti_router as _lti_router  # noqa: E402
    sys.path.remove(_lti_root)
    logger.info("Member 3 LTI router loaded successfully")
except Exception as e:
    # Remove from path even on failure
    _lti_root_str = str(_workspace_root / "lti-security")
    if _lti_root_str in sys.path:
        sys.path.remove(_lti_root_str)
    logger.warning("Member 3 LTI router unavailable, skipping: %s", e)

# ─── Member 2: RAG Assessment Service ─────────────────────────────────────
_rag_service = None
_AssessmentPayload = None
try:
    _rag_root = str(_workspace_root / "rag-service")
    sys.path.insert(0, _rag_root)
    from app.service import RAGAssessmentService  # noqa: E402
    from app.generator import AssessmentPayload as _AssessmentPayload  # noqa: E402
    sys.path.remove(_rag_root)
    _rag_service = RAGAssessmentService()
    logger.info("Member 2 RAG service loaded successfully")
except Exception as e:
    _rag_root_str = str(_workspace_root / "rag-service")
    if _rag_root_str in sys.path:
        sys.path.remove(_rag_root_str)
    logger.warning("Member 2 RAG service unavailable, skipping: %s", e)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    INTENT: Manage the full application lifecycle.

    FIX (Blind Spot #2): We use `conn.run_sync()` because SQLAlchemy's
    `Base.metadata.create_all()` is synchronous, but our engine is async.
    Calling it directly would raise:
      "AsyncEngine cannot execute sync methods"
    `run_sync` bridges the gap by running the sync callable inside the
    async connection's thread executor.
    """
    # --- STARTUP ---
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Auto-seed FRAC roles, KCM competencies, and sample profiles
    # so the system is demo-ready without manual SQL inserts
    await seed_initial_data()

    yield  # Application runs here, serving requests

    # --- SHUTDOWN ---
    # Dispose releases the connection pool back to the OS
    await engine.dispose()


app = FastAPI(
    title="KarmMitra AI Unified Gateway",
    description=(
        "Sovereign Competency-Gap Engine for MoSPI & iGOT Karmayogi. "
        "Central API gateway connecting LTI 1.3 auth, RAG assessment, "
        "baseline triage, and admin analytics subsystems."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ─── CORS Middleware ───────────────────────────────────────────────────────
# WHY allow_origins from settings for prototype:
#   During SIH hackathon, Members 4 and 5 run React dev servers on varying
#   ports (3000, 5173). In production, constrain via CORS_ORIGINS env.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Router Mounts ────────────────────────────────────────────────────────
# 1. Core API: /api/v1/triage, /api/v1/pathways, /api/v1/assessment, /api/v1/admin
app.include_router(api_router, prefix="/api/v1")

# 2. Member 3: LTI 1.3 Handshake & Passback (/lti/login, /lti/launch, /lti/jwks.json, /lti/grade)
if _lti_router is not None:
    app.include_router(_lti_router)

# ─── Member 2: RAG Integration Bridge ─────────────────────────────────────
if _rag_service is not None and _AssessmentPayload is not None:
    @app.post("/api/v1/rag/generate", tags=["RAG Assessment"])
    async def generate_rag_assessment(
        competency_name: str,
        competency_code: str,
        question_count: int = 3,
        domain: str = None,
    ):
        """
        Direct in-process bridge calling Member 2's local Sovereign RAG engine.
        Bypasses network overhead — the RAG service runs in the same Python process.
        """
        try:
            assessment = await _rag_service.create_competency_assessment(
                competency_name=competency_name,
                competency_code=competency_code,
                question_count=question_count,
                domain=domain,
            )
            return assessment.model_dump()
        except ValueError as ve:
            raise HTTPException(status_code=404, detail=str(ve))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"RAG generation failed: {str(e)}")


@app.get("/health", tags=["System"])
async def health_check():
    """
    INTENT: Liveness probe + integration status.
    Member 6's test_runner.py hits this endpoint first to verify the
    gateway is responsive before checking other subsystems.
    """
    return {
        "status": "online",
        "service": "KarmMitra AI Unified Gateway",
        "compliance": "LTI 1.3 / Data Sovereign",
        "integrated": {
            "member_2_rag": _rag_service is not None,
            "member_3_lti": _lti_router is not None,
        },
    }
