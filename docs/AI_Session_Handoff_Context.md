# KarmMitra AI — AI Session Handoff Context
**Prepared for continuity across AI sessions.** Use this to understand the project architecture, the tech stack, what has been completed, and what remains to be done.

## 1. Project Overview & Architecture
KarmMitra AI is a Sovereign AI and LTI 1.3-Compliant Competency Engine designed for Mission Karmayogi and MoSPI (Ministry of Statistics and Programme Implementation). 
- **Cold-start gap:** Solved with a 5-question baseline diagnostic triage.
- **Data sovereignty:** Solved with local RAG (Llama-3 via Ollama/vLLM + ChromaDB).
- **External DB write security:** Solved with LTI 1.3 Assignment & Grade Services (AGS) passback.
- **Generic recommendations:** Implements the Capacity Building Commission's 70:20:10 pathway model.

### Team Topology
- **Member 1 (Priyash - Core Backend):** FastAPI Gateway, Postgres, Docker Compose. (This is the user).
- **Member 2 (Vedansh - Sovereign AI):** rag-service folder.
- **Member 3 (LTI Security):** lti-security folder.
- **Member 4 (Learner UI):** React frontend.
- **Member 5 (Admin UI):** React dashboard.
- **Member 6 (Mock iGOT):** Express.js LMS simulator.

## 2. Completed Milestones (Tier 1 & Tier 2)

### Tier 1 (Core Polish & Fixes)
- **Backend & RAG:** 
  - Verified 3-MCQ guarantee. The /assessment/generate endpoint strictly pads/truncates to ensure exactly 3 questions.
  - Server-side grading vulnerability fixed. /assessment/submit caches grading keys on the server and no longer trusts client payload answers.
- **Admin UI:**
  - Dynamic SQL Aggregations: /api/v1/admin/metrics fetches live func.count() and func.avg() aggregates.
  - Fixed fatal UI crashes (missing Divider import, CORS policy block, unhandled undefined array maps/filters).
- **Learner UI:**
  - Option text bug fixed in AssessmentRunner.jsx.
  - Authentic LTI 1.3 redirect simulation overlay for formal course enrollment.
- **Data Flow:** Verified end-to-end database persistence and LTI AGS passback inside the /submit completion handler.

### Tier 2 (Upload Document for Quiz)
- **RAG Generation Refactoring:** Encapsulated padding/synthetic logic directly inside SovereignAIEngine.generate_mcqs, keeping it natively resilient.
- **Gateway Upload Endpoint:** Created POST /api/v1/assessment/generate-from-upload which safely extracts up to 4000 characters from a 5MB max PDF using pypdf.
- **Microservice Boundary Adherence:** upload_assessment.py proxies the text payload securely via httpx.AsyncClient() to the new POST /api/v1/rag/generate-from-text endpoint exposed in the Gateway router, avoiding bad Python sys.path imports.
- **Learner UI:** Added 'Upload PDF for Quiz' button that wires to the new endpoint and feeds the standard AssessmentRunner component.

## 3. What is Left to Do (Next Objectives)
- Proceed with Tier 3 tasks (e.g., LTI 1.3 Handshake validation, Bhashini Translations, or further UI refinements as directed by the user).
- Check the issues backlog or await further commands from the user to continue the Hackathon tasks.
