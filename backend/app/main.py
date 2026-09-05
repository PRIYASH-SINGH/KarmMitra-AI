"""
KarmMitra AI — FastAPI Gateway Entry Point (Member 1: Priyash)
==============================================================

INTENT:
  This is the single entry point for the entire backend. Every HTTP request
  from Members 3 (LTI), 4 (Learner UI), 5 (Admin UI), and 6 (Mock iGOT)
  flows through this gateway on port 8000.

ARCHITECTURAL DECISION:
  Using FastAPI's `lifespan` context manager (not deprecated @app.on_event)
  for startup/shutdown. This ensures async DB table creation works correctly
  with asyncpg — directly calling Base.metadata.create_all() on an async
  engine would crash (Blind Spot #2 fix).

EXECUTION FLOW:
  1. Lifespan startup → create all tables async → seed FRAC/KCM data
  2. Mount /api/v1 router (triage, pathways, assessment, admin)
  3. Mount /lti router (Member 3's LTI security routes, when integrated)
  4. Serve /health for preflight checks (Member 6's test_runner.py)
  5. Lifespan shutdown → dispose engine connections cleanly
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1.api import api_router
from app.seed import seed_initial_data

# Import all models so Base.metadata knows about every table before create_all.
# Without this import, create_all would create zero tables — a silent, brutal bug.
import app.models  # noqa: F401


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
    title="KarmMitra AI Core Gateway",
    description=(
        "Sovereign Competency-Gap Engine for MoSPI & iGOT Karmayogi. "
        "Central API gateway connecting LTI 1.3 auth, RAG assessment, "
        "baseline triage, and admin analytics subsystems."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ─── CORS Middleware ───────────────────────────────────────────────────────
# WHY allow_origins=["*"] for prototype:
#   During SIH hackathon, Members 4 and 5 run React dev servers on varying
#   ports (3000, 5173). Restricting origins would block their Axios calls.
#   In production, constrain to actual frontend origins via CORS_ORIGINS env.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Router Mounts ────────────────────────────────────────────────────────
# All v1 API routes: /api/v1/triage, /api/v1/pathways, /api/v1/assessment, /api/v1/admin
app.include_router(api_router, prefix="/api/v1")

# NOTE FOR MEMBER 3: When your LTI security router is ready, mount it here:
#   from app.lti.router import lti_router
#   app.include_router(lti_router)


@app.get("/health", tags=["System"])
async def health_check():
    """
    INTENT: Simplest possible liveness probe.
    Member 6's test_runner.py hits this endpoint first to verify the
    gateway is responsive before checking other subsystems.
    """
    return {
        "status": "online",
        "service": "KarmMitra AI Core Gateway",
        "compliance": "LTI 1.3 / Data Sovereign",
    }
