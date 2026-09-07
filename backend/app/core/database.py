"""
KarmMitra AI — Async Database Engine & Session (Member 1: Priyash)
==================================================================

INTENT:
  Provides the async SQLAlchemy engine, session factory, and Base class
  used by every model and endpoint in the application.

WHY async (not sync SQLAlchemy):
  FastAPI is async-native. Using a synchronous engine would block the
  event loop during every DB query, destroying concurrent throughput
  when multiple officials submit triage answers simultaneously.

WHY a single Base:
  All models (FRAC, KCM, User) inherit from this Base. When main.py
  calls `Base.metadata.create_all`, it discovers every table from every
  model file — but ONLY if those model files are imported first.
  That's why app/models/__init__.py re-exports everything.

WHY get_db as a FastAPI dependency:
  Each request gets its own session. The `yield` ensures the session
  is closed even if the endpoint raises an exception. This prevents
  connection pool exhaustion under load.
"""

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base

from app.core.config import settings

# ─── Engine ────────────────────────────────────────────────────────────────
# echo=False in production; set True temporarily to debug SQL queries
engine = create_async_engine(
    settings.database_url,
    echo=False,
    # Pool size tuned for hackathon demo (6 concurrent services max)
    pool_size=10,
    max_overflow=20,
)

# ─── Session Factory ──────────────────────────────────────────────────────
# expire_on_commit=False: After commit, ORM objects remain usable without
# triggering a lazy-load (which would fail outside the session context).
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# ─── Declarative Base ─────────────────────────────────────────────────────
# Every SQLAlchemy model (FRACRole, KCMCompetency, OfficialProfile, etc.)
# inherits from this Base to register in metadata.
Base = declarative_base()


async def get_db() -> AsyncSession:
    """
    FastAPI dependency that yields a database session per request.

    INTENT: Ensures every endpoint gets a fresh session and that the
    session is properly closed after the response is sent, even on errors.

    USAGE in endpoints:
        async def my_endpoint(db: AsyncSession = Depends(get_db)):
            result = await db.execute(select(MyModel))
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
