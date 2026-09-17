# 01 Handover — Where Things Stand

**Role:** Member 1 (Priyash) - Core Backend Architecture & Orchestration
**Project:** KarmMitra AI (SIH26101)
**Date:** Current Build Status

## Current Status: dYY SYSTEM END-TO-END MERGED AND SCALING

Backend (Member 1), RAG (Member 2), LTI (Member 3), Learner UI (Member 4), Admin UI (Member 5), and Mock iGOT (Member 6) are successfully integrated into the monorepo and running stably.

**Pending Next Steps:** 
- End-to-End LTI 1.3 Validation from Mock iGOT -> Role Triage -> RAG -> AGS Passback.
- Bhashini Translation injection.
- Admin UI full wiring.

### Completed Components
1. **Infrastructure (Unified):**
   - Root-level `docker-compose.yml` orchestrating DB, Gateway, and Mock iGOT on `karmmitra_net`.
   - RAG LLM routing updated to use `http://host.docker.internal:11434` for secure Docker-to-Host communication.
2. **Database & Core:**
   - Asynchronous SQLAlchemy (`asyncpg`) initialized in `app/core/database.py`.
   - `TriageQuestion` models dynamically created and auto-upserted during FastAPI lifespan.
3. **Data Models & Seed (Locked):**
   - FRAC Roles and KCM Competencies mapped correctly.
   - `seed_initial_data()` now securely seeds exactly 15 dynamic baseline triage questions mapped to our 3 MoSPI personas.
4. **API Contracts (Schemas):**
   - Triage Result schema modernized to return structured JSON objects (`[{"competency_code": str, "competency_name": str}]`) ensuring raw database codes are never leaked to the UI without context.
5. **Cross-Team Integration (Unified Gateway):**
   - Member 3 LTI router mounted at `/lti/*`.
   - Member 2 RAG service loaded in-process at `/api/v1/rag/generate` with synthetic zero-hallucination MCQs mapped natively to MoSPI.
   - **Resilience**: A synthetic fallback mechanism ensures the UI gracefully receives valid questions even if Ollama/vLLM is offline.
6. **Frontend Wiring:**
   - Dynamic Role Triage implemented and verified.
   - 70:20:10 Pathway Fallbacks and robust Object parsing safely routes competencies into the RAG Generation engine.

### Handoff Notes for Teammates
- **Member 2 (Vedansh):** Your `rag-service` successfully ingested 1,321 pages into 3,838 semantic chunks (all-MiniLM-L6-v2/ChromaDB). Your LLM endpoint now defaults to `host.docker.internal:11434` and has a synthetic fallback. 
- **Member 3 (LTI):** Your router is mounted. LTI endpoints are listening. We need to validate AGS Passback.
- **Member 4 (Learner UI):** `DashboardView.jsx` and `App.jsx` have been fortified to strictly destructure the new object-based Triage gaps. Buttons trigger dynamically.
- **Member 5 (Admin UI):** The dashboard reads from `/api/v1/admin/metrics`. 
- **Member 6 (Mock iGOT):** Keep port 9000 alive; we are ready for E2E validation.

## Learning Resources & Mental Models

To help teammates quickly grasp *why* we chose this specific stack, here are plain-English analogies for our core technologies:

* **LTI 1.3 OIDC (Security): "The VIP Bouncer Pass"**
  * **Why we use it:** Instead of forcing officers to create new passwords (which risks MoSPI data), the iGOT LMS acts as a bouncer. It verifies the officer and hands our app a cryptographically signed VIP pass (JWT) containing their exact role and identity. We don't verify the user; we verify the bouncer's signature.

* **FastAPI Async Orchestration: "The Smart Restaurant Kitchen"**
  * **Why we use it:** If our local AI model takes 10-15 seconds to "cook" a RAG assessment, a synchronous server would freeze, dropping all other requests. FastAPI's asynchronous event loop lets the gateway instantly serve Admin UI charts while the AI chef continues cooking in the background.

* **Docker Compose Networks: "The Walled Garden"**
  * **Why we use it:** Our PostgreSQL database and internal services aren't exposed to the chaotic public internet. They live inside karmmitra_net, an exclusive virtual network where containers can securely talk to each other using simple names (e.g., postgres://db:5432) without complex firewall rules.

* **RAG / ChromaDB Vector Stores: "The Open-Book Test"**
  * **Why we use it:** Asking an AI to blindly memorize MoSPI manuals leads to severe hallucinations. Instead, ChromaDB acts as an ultra-fast index. When an officer needs a test, we instantly pull the exact 3 relevant paragraphs from the manuals, hand them to the local Llama-3.2-1B model (edge-optimized CPU inference with an extended 60-second UI timeout), and command it: "Generate questions *only* using this text."


