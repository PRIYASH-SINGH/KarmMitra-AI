# KarmMitra AI — Master Context Document

**Purpose:** This document contains the complete context of the KarmMitra AI project (SIH26101), the tech stack, the architectural topology, and exactly what has been built so far for the Core Backend (Member 1). Use this to double-check architecture, provide code reviews, or generate next steps without losing context.

---

## 1. Project Overview: What We Are Building
**KarmMitra AI** is a Sovereign AI and LTI 1.3-Compliant Competency Engine designed for Mission Karmayogi and MoSPI (Ministry of Statistics and Programme Implementation). 

**Key Problems Solved:**
1. **The "Cold Start" Gap:** New officials have no data. We solve this with a 5-question Baseline Diagnostic Triage.
2. **Data Sovereignty Risks:** Government data cannot be sent to OpenAI. We use a local Sovereign AI (vLLM/ChromaDB) running on internal networks.
3. **External DB Write Security:** iGOT (the government LMS) audits will reject external database writes. We use LTI 1.3 Assignment and Grade Services (AGS) to securely pass back signed JWT grades without direct DB access.
4. **Generic Recommendations:** We specifically implement the Capacity Building Commission's **70:20:10 Pathway** (70% Experiential, 20% Collaborative, 10% Formal).

---

## 2. Team Topology & Responsibilities
The project is built as a microservices/monorepo ecosystem divided among 6 members:
* **Member 1 (Priyash - Core Backend):** FastAPI Gateway, PostgreSQL Database, Docker Compose orchestration. Acts as the central hub connecting all other members.
* **Member 2 (Vedansh - Sovereign AI):** Local RAG pipeline (Llama-3-8b via Ollama/vLLM + ChromaDB + SentenceTransformers).
* **Member 3 (LTI Security):** OIDC handshake, JWT validation, AGS Passback, Bhashini DPI Translation integration.
* **Member 4 (Learner UI):** React 18 frontend for officials taking the triage and assessments.
* **Member 5 (Admin UI):** React 18 dashboard for MoSPI institutional leaders (using Recharts).
* **Member 6 (Mock iGOT):** Express.js server simulating the government LMS to initiate LTI launches and receive AGS grades.

---

## 3. Technology Stack (Member 1 - Backend)
* **Framework:** FastAPI
* **Runtime:** Python 3.11-slim (Dockerized)
* **Database:** PostgreSQL 16 (Alpine)
* **ORM & Driver:** SQLAlchemy 2.0 (Asyncio) + `asyncpg`
* **Validation:** Pydantic v2 + Pydantic Settings
* **Networking:** Docker Compose (`karmmitra_net`)

---

## 4. What Has Been Built So Far (Backend Scaffold)

As Member 1, the foundational infrastructure, models, schemas, and configurations have been completely written. The endpoints themselves just need their internal logic populated.

### A. Infrastructure & DevOps
* **`docker-compose.yml`**: Spins up `db` (Postgres) and `api` (FastAPI) on a shared bridge network.
* **`Dockerfile`**: Caches requirements, runs `uvicorn` on port 8000.
* **`.env.example`**: Defines `DATABASE_URL` and `RAG_SERVICE_URL`. **Critical Fix:** Uses `host.docker.internal:11434` so the Dockerized FastAPI app can communicate with Member 2's local host-level AI engine.

### B. Core Gateway
* **`app/main.py`**: Configures CORS (allowing Member 4 and 5's React ports). Uses an `asynccontextmanager` lifespan hook. **Critical Fix:** Wraps synchronous table creation in `conn.run_sync(Base.metadata.create_all)` to prevent asyncpg crashes.
* **`app/core/database.py`**: Configures the async engine, `AsyncSessionLocal`, and the `get_db` FastAPI dependency to prevent connection pooling exhaustion.
* **`app/core/config.py`**: Uses Pydantic `BaseSettings` for type-safe env variable loading.

### C. Data Models (`app/models/`)
* **`frac.py`**: `FRACRole` and `RoleCompetencyMapping`. 
  * *Critical Fix:* `role_code` is a unique String used as the primary lookup, rather than an integer ID, because LTI 1.3 claims transmit string codes (e.g., `MOSPI_FOD_INV_01`).
* **`kcm.py`**: `KCMCompetency`. Includes a `baseline_threshold` float for calculating assessment gaps.
* **`user.py`**: `OfficialProfile` and `AssessmentResult`.
  * *Critical Fix:* `OfficialProfile` uses the LTI `sub` string claim as `user_id` (PK). It is designed to be "Auto-Upserted" on triage submission to gracefully handle brand new users hitting the platform via LTI launch.

### D. API Contracts / Schemas (`app/schemas/`)
* **`assessment.py`**: `TriageSubmitIn`, `TriageResultOut`, `AssessmentRequestIn`, `GeneratedQuestionOut`.
* **`pathway.py`**: `PathwayItem`, `PathwayResponse`. Maps strictly to the 70:20:10 taxonomy (`70_EXPERIENTIAL`, etc.) expected by React.
* **`admin.py`**: `AdminMetricsOut`. Enforces strict keys (`kpi`, `kcmRadar`, `divisionData`, `stateRankings`) to guarantee Member 5's dashboard charts render without undefined property errors.

### E. Documentation (`docs/`)
Created standard docs for the team: `01_Handover.md`, `02_Decisions.md`, `03_Explicit_comments.md`, `04_Flow.md`, `05_Bug_Feature.md`, `06_Architecture.md`.

---

## 5. What Remains to be Built (Next Steps)
The endpoint logics for `triage.py`, `assessment.py`, `pathways.py`, `admin.py`, and the database population script `seed.py` have been successfully implemented. The immediate next steps focus on cross-team integration:

1. **Member 2 (Sovereign AI) Integration**: Replace the fallback/stub logic in `assessment.py` (`POST /generate`) with the actual `httpx` proxy call to Member 2's AI service.
2. **Member 3 (LTI Security) Integration**: 
   - Inject Member 3's LTI 1.3 AGS webhooks and tools into `lti_passback.py` (currently a placeholder).
   - Mount Member 3's LTI router in `app/main.py`.
   - Update `assessment.py` (`POST /submit`) to call Member 3's actual AGS passback function instead of simulating success.
3. **Frontend Integration**: Members 4 (Learner UI) and 5 (Admin UI) need to consume these backend APIs. CORS is currently permissive to allow local development.
4. **Mock iGOT Integration**: Member 6 will write tests targeting the gateway `/health` and these API routes to verify full-loop functionality.

### Recent Architecture Refinements
- **Security & EnvVars**: All hardcoded secrets have been extracted from `config.py` and `docker-compose.yml`, utilizing `.env` variables for injection.
- **Triage Hardening**: `GET /triage/questions` now returns a secure `TriageQuestionPublicOut` schema omitting the answer key. Scoring in `POST /triage/submit` is strictly server-side.
- **Type Safety**: `Literal` typing has been strictly applied to enum-like string fields across `pathway.py` and `admin.py`.
- **Atomic Seeding**: `seed.py` utilizes `await db.flush()` to execute in a single atomic database transaction, fully mapping competencies for all default FRAC roles.
---

*Pass this context to Claude to ensure any code generated perfectly aligns with the async architecture, the Pydantic schemas, and the 4 critical blind spot fixes already implemented.*
