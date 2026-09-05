# 02 Decisions — Why, Not Just What

This document tracks the critical architectural and framework decisions made in the KarmMitra AI Member 1 Backend, and explicitly the *reasons* behind them.

## 1. FastAPI + Asyncpg over Flask + Psycopg2
* **What:** The gateway uses FastAPI with `asyncpg` and SQLAlchemy 2.0 async sessions.
* **Why:** During the hackathon demo, multiple subsystems (Admin Dashboard polling, Learner assessments, RAG generation) will hit the gateway simultaneously. A synchronous framework would block the thread while waiting for Member 2's Llama-3 model to generate questions (which takes 5-15 seconds). `asyncio` allows the gateway to handle Admin UI requests instantly while the RAG assessment request waits in the background.

## 2. Docker Networking (`host.docker.internal`)
* **What:** Defaulting `RAG_SERVICE_URL` to `http://host.docker.internal:11434`.
* **Why (Blind Spot #3 Fixed):** The backend API runs inside a Docker network (`karmmitra_net`). If it tries to reach Member 2's local Ollama/vLLM instance on `localhost`, the container looks *inside itself*, resulting in a connection refused. `host.docker.internal` securely routes the request out to the host machine.

## 3. String Foreign Keys for FRAC Roles
* **What:** `OfficialProfile.frac_role_code` is a String FK to `FRACRole.role_code`, rather than an integer `id`.
* **Why (Blind Spot #4 Fixed):** iGOT Karmayogi's LTI 1.3 JWT tokens transmit roles as string codes (e.g., `"MOSPI_FOD_INV_01"`). Using this string as the canonical relational link avoids an unnecessary `SELECT id FROM frac_roles WHERE code = X` lookup round-trip on every LTI launch.

## 4. Auto-Upserting Users on Triage
* **What:** `OfficialProfile` is created dynamically when `/triage/submit` is called if it does not exist.
* **Why (Blind Spot #1 Fixed):** The "Cold Start" problem. When an official logs into iGOT for the first time, Member 6 initiates the launch. If our DB strictly required a pre-seeded user, the launch would crash. By auto-upserting using the `sub` claim from the JWT, the system gracefully handles completely new users.

## 5. Pydantic-Driven API Contracts
* **What:** Extensive use of strict Pydantic schemas (`AdminMetricsOut`, `TriageQuestionOut`) that map 1:1 to React prop shapes.
* **Why:** Prevents "undefined is not an object" runtime crashes on the frontend. Member 4 and Member 5 can look directly at `schemas/*.py` to know exactly what JSON their Axios clients will receive, eliminating cross-team integration friction.

## 6. Pydantic `extra="ignore"` for Environment Config
* **What:** Using `SettingsConfigDict(extra="ignore")` in `config.py` instead of the default strict validation.
* **Why:** In a microservices architecture, a shared `.env` file often holds variables intended for different containers (like frontend API keys or raw DB credentials). Without ignoring extra fields, Pydantic v2 crashes the FastAPI container on startup if it detects a variable it doesn't recognize.

## 7. Atomic Database Seeding (`db.flush`)
* **What:** `seed.py` uses multiple `await db.flush()` calls instead of intermediate `commit()`s, saving the final `commit()` for the very end.
* **Why:** Ensures the initial database population is a single atomic transaction. If the seeding fails halfway through, no partial data is committed, guaranteeing an idempotent, clean database state on restart.
## 8. Unbuffered Python Logs
* **What:** Adding `ENV PYTHONUNBUFFERED=1` to the `Dockerfile`.
* **Why:** Python buffers stdout inside containers, delaying logs. This ensures `print()` statements and errors stream instantly to `docker compose logs`, which is critical for debugging during the fast-paced hackathon.

## 9. Modern Docker Compose Spec
* **What:** Removing the `version: '3.8'` declaration from `docker-compose.yml`.
* **Why:** Compose V2 has fully integrated the compose command into the Docker CLI and deprecated the `version` attribute, which was causing terminal warnings.
