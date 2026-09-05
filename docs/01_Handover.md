# 01 Handover — Where Things Stand

**Role:** Member 1 (Priyash) - Core Backend Architecture & Orchestration
**Project:** KarmMitra AI (SIH26101)
**Date:** Current Build Status

## Current Status: 🟡 IN PROGRESS (Core Scaffolded)

### Completed Components
1. **Infrastructure:** 
   - `docker-compose.yml` configured for FastAPI and PostgreSQL (`postgres:16-alpine`).
   - `Dockerfile` using `python:3.11-slim` for optimal caching and size.
   - `.env.example` defining environment variables and Docker networking overrides.
2. **Database & Core:**
   - Asynchronous SQLAlchemy (`asyncpg`) initialized in `app/core/database.py`.
   - Lifespan context manager in `app/main.py` properly executing async table creation (`conn.run_sync(Base.metadata.create_all)`).
   - Configuration via Pydantic (`app/core/config.py`).
3. **Data Models:**
   - FRAC Roles (`app/models/frac.py`) utilizing `role_code` as unique string constraint.
   - KCM Competencies (`app/models/kcm.py`) mapped to domains.
   - User Profiles & Assessments (`app/models/user.py`), supporting dynamic auto-upsert on first launch.
4. **API Contracts (Schemas):**
   - Exact matching Pydantic schemas built for Triage, Pathways, Assessment, and Admin UI to prevent frontend integration friction.

### Pending Next Steps (Immediate Action Required)
1. **Implement API Endpoints (`app/api/v1/endpoints/`):**
   - **ALL ENDPOINTS COMPLETED:** `triage.py`, `pathways.py`, `assessment.py`, `admin.py`, and `lti_passback.py` are fully implemented and wired into `api.py`.
2. **Seed Data Script (`app/seed.py`):**
   - **COMPLETED:** Automatically populates FRAC roles, KCM competencies, mappings, and mock users during the async lifespan startup.
3. **Link routers in `app/api/v1/api.py`:**
   - **COMPLETED:** `api_router` aggregates all prefixes and is mounted in `main.py`.

### Handoff Notes for Teammates
- **Member 2 (Vedansh):** Your RAG endpoint is expected at `http://host.docker.internal:11434` for local dev. Ensure your JSON schema strictly matches `GeneratedQuestionOut`.
- **Member 4 (Learner UI):** The Triage and Assessment endpoints use camelCase where necessary for your JS models, but mostly stick to `snake_case`. Check `app/schemas/assessment.py` for exact keys.
- **Member 5 (Admin UI):** Your charts will read from `/api/v1/admin/metrics`. The response JSON is guaranteed to match `AdminMetricsOut`.
