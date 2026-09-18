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
* **Member 2 (Vedansh - Sovereign AI):** Local RAG pipeline (Llama-3.2-1B (edge-optimized for CPU) via Ollama/vLLM + ChromaDB + SentenceTransformers).
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

## 4. What Has Been Built (Unified Monorepo)

### A. Infrastructure & DevOps
* **Root `docker-compose.yml`**: Orchestrates `db` (Postgres), `gateway` (unified FastAPI), and `mock-igot` (Node.js) on `karmmitra_net`.
* **Unified `backend/Dockerfile`**: Installs Python dependencies from all three subsystems (backend, rag-service, lti-security) into a single image. Uses `PYTHONPATH=/workspace/backend:/workspace`.
* **`.env.example`**: Root-level environment template for all services.

### B. Core Gateway (`backend/app/main.py`)
* Mounts Member 1's core API at `/api/v1/*`.
* Mounts Member 3's LTI router at `/lti/*` (OIDC login, launch validation, AGS grade passback, Bhashini translation, session management).
* Loads Member 2's `RAGAssessmentService` in-process and exposes it at `/api/v1/rag/generate`.
* Both cross-team imports use `sys.path` inject-import-restore to avoid namespace collisions, wrapped in `try/except` for graceful degradation.
* `/health` endpoint reports integration status of all subsystems.

### C. Data Models (`backend/app/models/`)
* `frac.py`: `FRACRole` and `RoleCompetencyMapping`. `role_code` is a unique String FK.
* `kcm.py`: `KCMCompetency` with `baseline_threshold`.
* `user.py`: `OfficialProfile` (Auto-Upserted on first LTI launch) and `AssessmentResult`.

### D. API Contracts (`backend/app/schemas/`)
* `assessment.py`: `TriageSubmitIn`, `TriageResultOut`, `TriageQuestionPublicOut` (no answer key leakage).
* `pathway.py`: `PathwayItem` with `Literal["70_EXPERIENTIAL", "20_COLLABORATIVE", "10_FORMAL"]`.
* `admin.py`: `AdminMetricsOut` with `StateRanking.status` typed as `Literal["Optimal", "Review Needed", "Critical Gap"]`.

### E. Cross-Team Services (Pulled & Integrated)
* **`rag-service/`** (Member 2): PDF ingestion script, ChromaDB vectors, zero-hallucination Llama-3.2-1B (edge-optimized for CPU) MCQ generation.
* **`lti-security/`** (Member 3): OIDC login, RS256 JWT validation, AGS grade passback, and Bhashini NMT translation. LTI configuration successfully shares cryptographic keys (`backend/certs/`) with the main gateway.
* **`mock-igot-platform/`** (Member 6): Express.js iGOT simulator running LTI launches, AGS receiving, and a functional mock `/oauth2/token` endpoint for LTI Advantage services.
* **`learner-ui/` & `admin-ui/`** (Members 4 & 5): React 18 / Vite frontends. Learner UI is now LTI-aware, actively parsing `session_id` from URL parameters during platform launches.

---

## 5. SYSTEM STATE UPDATE & CONTEXT SYNC: KarmMitra AI (SIH 2026)

#### 1. Ingestion & RAG Subsystem (`rag-service`)
- **Status:** Vector store fully indexed and persisted.
- **Metrics:** 1,321 pages from 10 MoSPI/NSSTA manuals ingested; 3,838 semantic chunks generated; embedded with `sentence-transformers/all-MiniLM-L6-v2` into local ChromaDB.
- **LLM Routing:** Updated `rag-service/app/config.py` to route LLM requests to `http://host.docker.internal:11434` (Ollama running `llama3.2:1b` on host).
- **Resilience Requirement:** `rag-service/app/generator.py` wraps the Ollama call in a fallback mechanism that returns 3 synthetic MoSPI MCQs matching the requested competency if Ollama is unreachable.

#### 2. Backend Gateway & Database (`backend`)
- **Models Added:** `TriageQuestion` model created in `backend/app/models/triage.py` and registered in `__init__.py`.
- **Seeding:** `seed_initial_data()` in `backend/app/seed.py` dynamically seeds 15 targeted baseline questions for:
  - `MOSPI_FOD_INV_01` (Field Investigator)
  - `MOSPI_SDRD_ANL_02` (Survey Design Analyst)
  - `MOSPI_NAD_ECO_01` (National Accounts Economist)
- **API Payloads:** `/api/v1/triage/submit` returns `identified_gaps` as structured objects: `[{"competency_code": str, "competency_name": str}]`.

#### 3. Frontend / Learner UI (`frontend`)
- **Dynamic Role Triage:** Verified working. Baseline triage dynamically switches questions and options based on the authenticated MoSPI official role.
- **Component Safeguards:** Updated `DashboardView.jsx` and `App.jsx` to parse the object-based `identified_gaps` structure and safely pass `competency_code` to `/api/v1/rag/generate`.
- **70:20:10 Fallback:** Injected mock pathway cards if live backend returns empty array to preserve UI integrity.

#### 4. Active Backlog & Next Priorities
1. **Admin UI:** Design and implement the Supervisor/Admin Dashboard for monitoring department-wide competency gaps, heatmaps, and triage passback rates.
2. **Bhashini Integration:** Inject `BHASHINI_API_KEY` and `BHASHINI_USER_ID` into `.env` once portal approval is received; confirm live Hindi translation toggle in Learner UI.
3. **End-to-End LTI 1.3 Validation:** Validate full flow from mock iGOT launch -> Role Triage -> RAG Assessment -> AGS Grade Passback.

---

*Pass this context to any AI assistant to ensure generated code aligns with the async architecture, unified PYTHONPATH, sys.path isolation pattern, and all critical blind spot fixes.*

### Phase 2 Execution Complete
- Admin dashboard now displays real DB aggregations (Radar Chart, Division Stacked Bar, Recent Activity).
- Learner UI dynamically parses any JSON object structure for assessment options, dodging the 'Option A text' schema hallucination.
- Pathway enrollment modal displays true LTI handoff data.
