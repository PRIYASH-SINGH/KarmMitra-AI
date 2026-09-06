# KarmMitra AI — Session Handoff Context
*Prepared for continuity if this Claude session ends. Give this to whichever AI picks up next.*

## Who you're helping
Priyash — Member 1 (Core Backend) on a 6-person Smart India Hackathon team (SIH26101) building **KarmMitra AI**. Not a professional developer; explicitly wants to *understand* the code, not just accept AI-generated output. Prefers multi-step instructions delivered **one step at a time**, waiting for confirmation before the next — this saves both AI credits and actually helps them learn instead of skimming ahead.

## Project overview
KarmMitra AI is a Sovereign AI + LTI 1.3-compliant competency engine for Mission Karmayogi / MoSPI (India's Ministry of Statistics and Programme Implementation). Four problems it solves:
1. **Cold-start gap** — new officials have no data → solved with a 5-question baseline diagnostic triage
2. **Data sovereignty** — government data can't go to OpenAI → local RAG (Llama-3-8b via Ollama/vLLM + ChromaDB)
3. **External DB write security** — iGOT (govt LMS) audits reject external DB writes → LTI 1.3 Assignment & Grade Services (AGS) passback via signed JWT instead of direct writes
4. **Generic recommendations** — implements the Capacity Building Commission's 70:20:10 pathway model (70% experiential, 20% collaborative, 10% formal)

## Team & GitHub structure
- Member 1 Priyash — Core Backend (FastAPI/Postgres/Docker) — **this user**
- Member 2 Vedansh — Sovereign AI / RAG (Llama-3/Ollama/ChromaDB) — folder `rag-service/`
- Member 3 — LTI Security (OIDC/JWT/AGS/Bhashini translation) — folder `lti-security/`
- Member 4 — Learner UI (React 18)
- Member 5 — Admin UI (React 18 + Recharts) — dashboard already running locally on `localhost:5174`, consuming `GET /api/v1/admin/metrics`
- Member 6 — Mock iGOT (Express.js) — folder `mock-igot-platform/`

Repo: `KarmMitra-AI` on GitHub, monorepo layout. **Default branch is `priyash-backend`** (not `main` — deliberate but non-standard, flagged as optional polish before final submission). Members 2, 3, and 6's feature branches have all been merged into `priyash-backend` via PRs — clean merges, since none of them touched the `backend/` folder directly.

**Important discovery**: Member 3's LTI integration already started writing directly into `backend/app/lti/` (files: `__init__.py`, `main.py`, `router.py`, `core/config.py`, `core/security.py`, `lti/ags.py`) — this is new, not yet reviewed with Claude. Worth reading before assuming `backend/app/` is still solely the user's own code.

## Backend stack
FastAPI, Python 3.11-slim (Docker), PostgreSQL 16, SQLAlchemy 2.0 async + asyncpg, Pydantic v2, Docker Compose. Backend runs on **port 8000**, confirmed live via `docker compose up --build -d`.

## Build status: complete, endpoint logic implemented
`triage.py`, `assessment.py`, `pathways.py`, `admin.py`, `seed.py` all have working logic. Files reviewed line-by-line with Claude; issues found and most fixed:

**Fixed:**
- `TriageQuestionOut` originally leaked `correctOption` to the client before submission — added `TriageQuestionPublicOut` (no answer key) and wired `/triage/questions` to use it; `/triage/submit` scoring moved server-side
- `pathway.py`'s `PathwayItem.type` and `admin.py`'s `StateRanking.status` were plain `str` for what should be fixed enum values — changed to `Literal[...]`
- `config.py` crashed on startup with `pydantic_core.ValidationError: extra_forbidden` because `.env` (shared across containers) included Postgres-only vars (`postgres_user`, etc.) that `Settings` didn't declare — fixed with `model_config = SettingsConfigDict(env_file=".env", extra="ignore")`
- `seed.py` used multiple `db.commit()` calls (non-atomic, risk of partial-seed-then-skip on restart) — changed to `db.flush()` for intermediate steps, one `commit()` at the end
- `seed.py` originally only mapped competencies for `role1` (Field Ops); `role2`/`role3` were empty — now all three roles have `RoleCompetencyMapping` rows, **confirmed via direct DB query** (not just claimed)
- Added `ENV PYTHONUNBUFFERED=1` to Dockerfile (print() output wasn't flushing in container logs, made debugging confusing)
- `/health` endpoint confirmed live at `GET /health` (top-level, not under `/api/v1`) — returns a richer shape than expected: `{status, service, compliance}`

**Not yet fixed — known design issue:**
- `AssessmentSubmitIn` (RAG-generated assessment flow) has the client send back `correct_answers: dict` for server-side scoring. Since the answer key was already sent to the client via `GeneratedQuestionOut.correct_option` in the `/generate` response, any client can submit `correct_answers` identical to their own `answers` and score 100% on every competency. **This needs a design decision before it's a mechanical fix** — where does the real answer key get cached server-side (in-memory dict, the `AssessmentResult` table, or Redis)? Not yet discussed in depth.

## Cross-team integration: what's left
1. Replace `assessment.py`'s `POST /generate` stub with a real `httpx` call to Member 2's `rag-service` (need to check its actual entrypoint/port — not yet reviewed)
2. Wire Member 3's real AGS passback function into `lti_passback.py`, mount their LTI router in `main.py`, update `assessment.py`'s `POST /submit` to call it for real instead of simulating success — **note the `backend/app/lti/` scaffold above may already be a head start on this**
3. Frontend integration ongoing (Member 5's dashboard already live and schema-matched; Member 4's learner UI status unknown)
4. Member 6 to point their test suite at the now-merged, now-live `/health` and API routes

## Tooling situation (why the "one step at a time" pacing matters)
User has three AI tools in play:
- **Claude (this conversation)** — used for concept explanation, line-by-line code review, and scoped mechanical edits. Genuinely separate quota from Google's ecosystem.
- **Google Antigravity** — agentic IDE, used for actual code generation and live integration work. **Credits are limited and a real constraint.** Established rule: reserve Antigravity specifically for things needing live iteration against a real running service (the two integrations above) — not for explanation or simple mechanical edits, which Claude/manual editing handles for free.
- **Gemini Pro** — also available, but user was warned it may share the same underlying weekly quota pool as Antigravity under a bundled Google AI Pro/Ultra plan (per community reports, unconfirmed for this specific account) — so it's not a guaranteed "free" alternative.

## Current in-progress task (as of last message)
Mid-`git pull` merge conflict on `.gitignore` at the repo root — two people added different lines to the same region (user added `docs/KarmMitra AI Prototype Prep.pdf` and `docs/prep_text.txt`; Member 3 added a `# Certificates and Keys` section: `certs/`, `*.key`, `*.pem`, `*.pub`). Conflict manually resolved by keeping both, removing git's conflict markers. Was hitting `"Committing is not possible because you have unmerged files"` — needs `git add .gitignore` to mark it resolved before the merge commit will succeed.

## Established working ritual (keep using this)
1. Concept discussion before any code generation
2. One scoped Antigravity prompt per file, not open-ended "build everything"
3. Diff review with Claude, line by line, especially anything async/security-related
4. Recall check — user tries to explain the file back before moving on
5. Log "why" decisions in `docs/02_Decisions.md`; known bugs logged honestly in `docs/05_Bug_Feature.md` rather than hidden

## Pre-push hygiene already done
`.gitignore` covers `.env`, `__pycache__/`, venvs, OS files; secrets extracted from `config.py`/`docker-compose.yml` into env vars; this is the repo's first-ever commit (`root-commit` confirmed), so no historical secret-leak risk exists.
