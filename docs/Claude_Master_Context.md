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
* **`rag-service/`** (Member 2): PDF ingestion, ChromaDB vectors, zero-hallucination Llama-3-8B MCQ generation.
* **`lti-security/`** (Member 3): OIDC login, RS256 JWT validation, AGS grade passback, Bhashini NMT translation.
* **`mock-igot-platform/`** (Member 6): Express.js iGOT simulator with synthetic MoSPI personas and AGS receiver.

---

## 5. Next Steps (Frontend Priority)

The backend infrastructure is now **Locked and Stable**. DevOps blockers including PyTorch timeout, pip conflicts, WSL 2 crashes, and namespace collisions have all been resolved. Both Learner UI and Admin UI have been successfully merged into the monorepo.

1. **E2E Testing**: Run both `learner-ui` and `admin-ui` locally to verify they interface correctly with the Dockerized gateway.
2. **Server-Side RAG Answer Caching**: `assessment.py` (`POST /submit`) still trusts the client's `correct_answers`. The backend must cache the AI-generated answer key during `/generate` and grade against that server-side state during `/submit`.
3. **PDF Ingestion**: Member 2's RAG service needs MoSPI/NSSTA PDFs dropped into `rag-service/data/raw_pdfs/` and the ingestion script run.

---

*Pass this context to any AI assistant to ensure generated code aligns with the async architecture, unified PYTHONPATH, sys.path isolation pattern, and all critical blind spot fixes.*
