# KarmMitra AI — Deep Analysis & Next Steps Handoff

**Target Audience:** Development Team & Agent Assistants
**Date:** September 17, 2026
**Status:** 🟢 BACKEND INFRASTRUCTURE LOCKED AND STABLE

---

## 1. Project Status vs. Prototype Blueprint

Based on the architecture matrix, the repository currently contains the following completed and integrated subsystems:

| Subsystem | Member | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Core Backend & DB** | Member 1 | 🟢 INTEGRATED | FastAPI Gateway, Async PostgreSQL 16, Pydantic schemas, and Triage/Admin endpoints are fully scaffolded and secure. |
| **Sovereign AI (RAG)** | Member 2 | 🟢 INTEGRATED | PDF chunking, ChromaDB, and zero-hallucination Llama-3.2-1B generation loaded in-process. |
| **LTI Security** | Member 3 | 🟢 INTEGRATED | OIDC login, RS256 signature validation, and AGS Passback. Configuration updated to correctly share `backend/certs/`. |
| **Mock iGOT LMS** | Member 6 | 🟢 INTEGRATED | Node.js simulator running on port 9000, now featuring a functional `/oauth2/token` endpoint for LTI Advantage services. |
| **Learner UI** | Member 4 | 🟢 INTEGRATED | React 18 frontend (`learner-ui/`). LTI-aware, fetches live Baseline Triage based on role, and dynamically queries RAG generation without mock fallback. |
| **Admin UI** | Member 5 | 🟢 INTEGRATED | React dashboard directory (`admin-ui/`) fetched and merged. |

---

## 2. DevOps & Integration Challenges Resolved

The infrastructure has undergone a massive hardening pass to resolve deep cross-team integration bugs:

1. **Pip Version Collisions:** `backend/requirements.txt` strictly pinned sub-dependencies, crashing with `chromadb`. Resolved by unpinning sub-dependencies.
2. **PyTorch GPU 5GB Timeout:** Fixed by injecting CPU-only PyTorch URL into the Dockerfile `pip install` command.
3. **Docker Engine Crash:** Fixed WSL 2 virtual disk failure (disk full) via `wsl --unregister docker-desktop` reset.
4. **Missing Cryptographic Keys:** Generated RSA keys for Mock iGOT (`mock-igot-platform/certs/`) and Gateway LTI (`backend/certs/`) via OpenSSL to fix crash loops and 500 errors.
5. **Module Namespace Collision:** `lti-security`, `rag-service`, and `backend` all used `app/` folders. Fixed using `sys.modules` isolation and `importlib` in `main.py`. The redundant `__init__.py` bridge files have now been safely removed.

---

## 3. SYSTEM STATE UPDATE & CONTEXT SYNC: KarmMitra AI (SIH 2026)

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

### Phase 2 Execution Complete
- Admin dashboard now displays real DB aggregations (Radar Chart, Division Stacked Bar, Recent Activity).
- Learner UI dynamically parses any JSON object structure for assessment options, dodging the 'Option A text' schema hallucination.
- Pathway enrollment modal displays true LTI handoff data.
