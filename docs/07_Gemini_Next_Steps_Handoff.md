# KarmMitra AI — Deep Analysis & Next Steps Handoff

**Target Audience:** Gemini Agent (Next Steps Execution)
**Date:** Current Build Status
**Context:** This report provides a comprehensive analysis of the KarmMitra AI (SIH26101) repository state following the pull of cross-functional team deliverables.

---

## 1. Project Status vs. Prototype Prep Blueprint

Based on the `KarmMitra AI Prototype Prep.pdf` architecture matrix, the repository currently contains the following completed subsystems:

| Subsystem | Member | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Core Backend & DB** | Member 1 | 🟢 COMPLETE | FastAPI Gateway, Async PostgreSQL 16, Pydantic schemas, and Triage/Admin stubs are fully scaffolded and secure. |
| **Sovereign AI (RAG)** | Member 2 | 🟢 DELIVERED | `rag-service/` directory present. Implements PDF chunking, ChromaDB, and zero-hallucination Llama-3-8B generation. |
| **LTI Security** | Member 3 | 🟢 DELIVERED | `lti-security/` directory present. Implements OIDC login, RS256 signature validation, and AGS Passback. |
| **Mock iGOT LMS** | Member 6 | 🟢 DELIVERED | `mock-igot-platform/` directory present. Node.js/Express simulator for testing LTI launches and AGS receiver. |
| **Learner UI** | Member 4 | 🔴 MISSING | React 18 frontend directory (`learner-ui/`) has not been scaffolded or pushed yet. |
| **Admin UI** | Member 5 | 🔴 MISSING | React dashboard directory (`admin-ui/`) has not been scaffolded or pushed yet. |

---

## 2. Technical Changes & Hardening Executed (Backend)

The `backend/` directory has been heavily refined for production-grade security and hackathon reliability:
1. **Triage Hardening:** Removed answer-key leakage in `GET /questions` via `TriageQuestionPublicOut`. Score grading in `POST /submit` is strictly evaluated server-side.
2. **Cold-Start Auto-Upsert:** LTI launches dynamically provision new `OfficialProfile` records if they don't exist, preventing Foreign Key crashes.
3. **Atomic Seeding:** `seed.py` utilizes `await db.flush()` to execute in a single atomic database transaction, fully mapping competencies for all default FRAC roles.
4. **Pydantic Configurations:** Upgraded to Pydantic v2 `SettingsConfigDict(extra="ignore")` to prevent FastAPI crashes when parsing monolithic `.env` files.
5. **Removed Secrets:** Cleaned all hardcoded database credentials and JWT secrets from `docker-compose.yml` and `config.py`.

---

## 3. The Core Challenge: Cross-Team Integration (Next Steps)

The immediate priority for the Gemini agent is **Cross-Team Integration**. Members 1, 2, and 3 have built isolated micro-components that now must be merged into the unified FastAPI Gateway. 

### A. Monorepo Orchestration (Docker Compose)
Currently, `backend/docker-compose.yml` only orchestrates the Postgres DB and the FastAPI app, binding only the `backend/` directory.
**Action:** Create a root-level `docker-compose.yml` to orchestrate the entire monorepo. It must spin up the DB, FastAPI Gateway, and the `mock-igot-platform` (Node.js) on the same `karmmitra_net` bridge network.

### B. Python Module Pathing
Both `rag-service` (Member 2) and `lti-security` (Member 3) are designed to be imported directly into the Member 1 FastAPI gateway. 
- `rag-service/README.md` expects: `from rag_service.app.service import RAGAssessmentService`
- `lti-security/README.md` expects mounting: `app.include_router(lti_router)`
**Action:** The backend Dockerfile/Compose must mount the root of the monorepo to the `/app` working directory (or configure `PYTHONPATH`) so that `backend/app/main.py` can successfully resolve and import `rag_service` and `lti_security`.

### C. Wiring `assessment.py` (RAG Integration)
**Action:** Remove the hardcoded dummy JSON fallback in `backend/app/api/v1/endpoints/assessment.py` (`POST /generate`). Import and instantiate `RAGAssessmentService` from Member 2, and invoke it to generate real AI MCQs.

### D. Securing the AI Answer Key (Tech Debt)
**Action:** Currently, `assessment.py` (`POST /submit`) trusts the client's `correct_answers` payload to grade the exam. This is a critical security vulnerability. 
*Fix:* When `POST /generate` creates questions, the backend must cache the correct answers (e.g., in Redis, or a temporary DB table associated with the user's session) and evaluate the user's submission against that server-side cache.

### E. Wiring LTI Security & AGS Passback
**Action:** 
1. Mount the LTI router from `lti-security/app/router.py` into `backend/app/main.py`.
2. Update `assessment.py` (`POST /submit`) to trigger Member 3's real `submit_score` AGS passback function rather than simply returning `ags_status = "success"`.

---

## Gemini Execution Instructions

When you assume control, prioritize the following sequence:
1. Initialize a root `docker-compose.yml` to network the Mock iGOT platform with the API and DB.
2. Adjust Python imports and Docker volume mounts to unify `backend`, `rag-service`, and `lti-security` into a single running FastAPI process.
3. Wire the `assessment.py` `/generate` and `/submit` logic to use the real RAG service and secure server-side grading.
