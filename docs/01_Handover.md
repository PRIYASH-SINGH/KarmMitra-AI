# 01 Handover — Where Things Stand

**Role:** Member 1 (Priyash) - Core Backend Architecture & Orchestration
**Project:** KarmMitra AI (SIH26101)
**Date:** Current Build Status

## Current Status: 🟢 INFRASTRUCTURE LOCKED (Backend DevOps Completed)

Backend (Member 1), RAG (Member 2), LTI (Member 3), Learner UI (Member 4), Admin UI (Member 5), and Mock iGOT (Member 6) are successfully integrated into the monorepo and running stably.

**Pending Next Step:** Ensure RAG assessment securely caches answer keys server-side (currently trusts client).

### Completed Components
1. **Infrastructure (Unified):**
   - Root-level `docker-compose.yml` orchestrating DB, Gateway, and Mock iGOT on `karmmitra_net`.
   - Unified `backend/Dockerfile` installing dependencies for backend (M1), RAG (M2), and LTI (M3) in a single image. Fixed pip resolution conflicts and forced PyTorch CPU-only installation to resolve build timeouts.
   - `.env.example` at repo root defining all environment variables across all subsystems.
2. **Database & Core:**
   - Asynchronous SQLAlchemy (`asyncpg`) initialized in `app/core/database.py`.
   - Lifespan context manager in `app/main.py` properly executing async table creation.
   - Configuration via Pydantic `SettingsConfigDict(extra="ignore")` for shared `.env` resilience.
3. **Data Models:**
   - FRAC Roles (`app/models/frac.py`) utilizing `role_code` as unique string constraint.
   - KCM Competencies (`app/models/kcm.py`) mapped to domains.
   - User Profiles & Assessments (`app/models/user.py`), supporting dynamic auto-upsert on first launch.
4. **API Contracts (Schemas):**
   - Strict Pydantic schemas with `Literal` typing for Triage, Pathways, Assessment, and Admin UI.
5. **All API Endpoints:**
   - `triage.py` — Server-side grading with `TriageQuestionPublicOut` (no answer key leakage).
   - `pathways.py` — 70:20:10 CBC-compliant learning pathway recommendations.
   - `assessment.py` — RAG proxy with fallback stub for concurrent dev.
   - `admin.py` — Demo-ready synthetic MoSPI metrics for dashboard rendering.
6. **Seed Data (`seed.py`):**
   - Atomic transaction (single `commit()`) populating FRAC roles, KCM competencies, and role-competency mappings for all 3 default roles.
7. **Cross-Team Integration (Unified Gateway):**
   - Member 3 LTI router mounted at `/lti/*` (OIDC login, launch validation, AGS grade passback, Bhashini translation).
   - Member 2 RAG service loaded as in-process bridge at `/api/v1/rag/generate`.
   - Both integrations wrapped in `try/except` for graceful degradation if subsystems are unavailable.

### Handoff Notes for Teammates
- **Member 2 (Vedansh):** Your `RAGAssessmentService` is now loaded in-process inside the gateway. Ollama must run on the host (`http://host.docker.internal:11434`). Drop PDFs into `rag-service/data/raw_pdfs/` and run ingestion.
- **Member 3:** Your LTI router is auto-mounted. RSA keys must exist in `lti-security/certs/`. The mock iGOT platform's JWKS is at `http://mock-igot:9000/.well-known/jwks.json`.
- **Member 4 (Learner UI):** All endpoints live under `http://localhost:8000/api/v1/`. Check `app/schemas/assessment.py` for exact keys.
- **Member 5 (Admin UI):** Your charts read from `/api/v1/admin/metrics`. The response JSON matches `AdminMetricsOut`.
- **Member 6:** Mock iGOT runs on `http://localhost:9000`. LTI launches target `http://gateway:8000/lti/launch` inside Docker.

## Learning Resources & Mental Models

To help teammates quickly grasp *why* we chose this specific stack, here are plain-English analogies for our core technologies:

* **LTI 1.3 OIDC (Security): "The VIP Bouncer Pass"**
  * **Why we use it:** Instead of forcing officers to create new passwords (which risks MoSPI data), the iGOT LMS acts as a bouncer. It verifies the officer and hands our app a cryptographically signed VIP pass (JWT) containing their exact role and identity. We don't verify the user; we verify the bouncer's signature.

* **FastAPI Async Orchestration: "The Smart Restaurant Kitchen"**
  * **Why we use it:** If our local AI model takes 10-15 seconds to "cook" a RAG assessment, a synchronous server would freeze, dropping all other requests. FastAPI's asynchronous event loop lets the gateway instantly serve Admin UI charts while the AI chef continues cooking in the background.

* **Docker Compose Networks: "The Walled Garden"**
  * **Why we use it:** Our PostgreSQL database and internal services aren't exposed to the chaotic public internet. They live inside karmmitra_net, an exclusive virtual network where containers can securely talk to each other using simple names (e.g., postgres://db:5432) without complex firewall rules.

* **RAG / ChromaDB Vector Stores: "The Open-Book Test"**
  * **Why we use it:** Asking an AI to blindly memorize MoSPI manuals leads to severe hallucinations. Instead, ChromaDB acts as an ultra-fast index. When an officer needs a test, we instantly pull the exact 3 relevant paragraphs from the manuals, hand them to the local Llama-3 model, and command it: "Generate questions *only* using this text."


