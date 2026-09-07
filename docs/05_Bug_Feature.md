# 05 Bug / Feature — Start to Finish

This document serves as the central tracker for critical bugs squashed and core features implemented in the Member 1 Backend. It provides context on *how* a problem presented and *how* it was resolved.

## 🐛 BUGS RESOLVED

### 1. The "Cold Start" Database Crash (Blind Spot #1)
* **Symptom:** LTI launches from completely new officers threw `Foreign Key Constraint Failed` or `404 Not Found` when trying to save assessment scores.
* **Root Cause:** The database required `OfficialProfile` records to be manually seeded. In production, LTI launches bring dynamic identities.
* **Resolution:** Implemented an "Auto-Upsert" pattern in the `/triage/submit` endpoint. Using the `sub` claim (as `user_id`), the gateway checks if the user exists. If not, it creates them dynamically on their first login, linking them to the `frac_role_code` provided in the JWT.

### 2. Async Engine Metadata Sync Crash (Blind Spot #2)
* **Symptom:** Booting FastAPI raised `sqlalchemy.exc.MissingGreenlet: greenlet_spawn has not been called; can't call invoke() here.`
* **Root Cause:** Calling `Base.metadata.create_all()` (a synchronous function) directly on an `asyncpg` engine during the FastAPI lifespan hook.
* **Resolution:** Wrapped the table creation in an async context block using `run_sync`: 
  ```python
  async with engine.begin() as conn:
      await conn.run_sync(Base.metadata.create_all)
  ```

### 3. Docker Localhost Blindness (Blind Spot #3)
* **Symptom:** Gateway threw `Connection Refused` when trying to proxy `/assessment/generate` to Member 2's RAG service.
* **Root Cause:** Inside the `karmmitra_api` Docker container, `localhost` refers to the container itself, not the host machine running Ollama/vLLM.
* **Resolution:** Updated `.env.example` to use `http://host.docker.internal:11434`, properly mapping out of the Docker bridge network to the host OS.

### 4. JWT Claim Type Mismatch (Blind Spot #4)
* **Symptom:** Member 3's LTI token provides `MOSPI_FOD_INV_01` as the role, but the database required an integer ID `1` for the `OfficialProfile.frac_role_id` foreign key.
* **Root Cause:** Default integer ID modeling misaligned with OIDC distributed identity standards.
* **Resolution:** Changed the Foreign Key constraint in `OfficialProfile` to point directly to `FRACRole.role_code` (marked as `unique=True`).

### 5. Pydantic Settings Validation Crash with Shared `.env`
* **Symptom:** The FastAPI gateway crashed on startup with `ValidationError` when reading from the `.env` file containing unrelated variables (e.g., frontend keys or database admin credentials) used by other Docker Compose services.
* **Root Cause:** By default, Pydantic v2 `BaseSettings` strictly rejects unrecognized environment variables.
* **Resolution:** Upgraded to Pydantic v2 `SettingsConfigDict` and added `extra="ignore"` to gracefully discard unrelated configuration properties in the `.env` file.

### 6. Delayed/Missing Container Logs
* **Symptom:** `print()` statements and standard output logs were not appearing in real-time in the `docker compose logs` stream.
* **Root Cause:** Python buffers standard output by default when not attached to an interactive terminal, causing delays in log flushing.
* **Resolution:** Added `ENV PYTHONUNBUFFERED=1` to the `Dockerfile` to force immediate log flushing.

### 7. Docker Compose Obsolete Attribute Warning
* **Symptom:** Every `docker compose` command threw a loud warning: `the attribute version is obsolete, it will be ignored`.
* **Root Cause:** In modern Compose specs (v2+), the top-level `version` key is deprecated and ignored.
* **Resolution:** Removed the `version: '3.8'` line from `docker-compose.yml` to ensure clean, warning-free terminal output for all teammates.
---

## ✨ FEATURES IMPLEMENTED

### 1. 70:20:10 Pathway Engine & Triage Auto-Upsert
* **Objective:** Ensure compliance with Capacity Building Commission rules and handle new LTI logins.
* **Status:** Scaffolding complete (`schemas/pathway.py`), Triage endpoints active (`triage.py`).
* **Implementation:** The `/triage/submit` endpoint evaluates baseline scores and provisions profiles dynamically. The API maps assessment gaps to 3 activity types: Experiential (70%), Collaborative (20%), and Formal (10%).

### 2. Pydantic-Validated RAG Proxy & AGS Passback
* **Objective:** Prevent frontend crashes from hallucinated AI JSON structures and securely pass grades to iGOT.
* **Status:** Complete (`assessment.py`).
* **Implementation:** The Gateway sits between Member 4 (React) and Member 2 (Local LLM). When Member 2 returns JSON, the Gateway runs it through the `GeneratedQuestionOut` schema. If it's malformed, the Gateway handles the retry/error gracefully. On `/submit`, it logs the `AssessmentResult` and invokes Member 3's AGS passback client to update the LMS.

### 3. Demo-Ready Admin Metrics
* **Objective:** Ensure Member 5's React dashboard renders perfectly even if the database is mostly empty on day one of the hackathon.
* **Status:** Complete (`admin.py`).
* **Implementation:** The `/admin/metrics` endpoint falls back to rich, structured synthetic MoSPI data (FOD, SDRD, NAD counts) if there are fewer than 10 real assessments in the DB, matching the exact Pydantic keys the dashboard expects.

---

## 📝 KNOWN OPEN ISSUES / TECH DEBT

### 1. Client-Side Trust in RAG Assessment (`assessment.py`)
* **Issue:** The `POST /submit` endpoint in `assessment.py` currently trusts the `correct_answers` payload sent by the client to calculate the final score. 
* **Risk:** A compromised client or frontend bug could send manipulated answer keys, resulting in unearned competency scores being written to the database and passed back to iGOT via AGS.
* **Planned Fix:** Similar to the triage fix, the backend must securely cache the AI-generated answer key in Redis or the database during `/generate`, and grade against that server-side state during `/submit`.

### 2. Incomplete Data Seeding Mappings (`seed.py`)
* **Issue:** The `seed_initial_data` script originally only mapped competencies for `role1` (Statistical Field Investigator). While an immediate fix was introduced to add mappings for `role2` (Survey Design Analyst) and `role3` (National Accounts Economist), the mappings are still manually defined and lack a comprehensive MoSPI dictionary integration.
* **Risk:** Hardcoded mappings limit the scalability of the prototype for a pan-India demo.
* **Planned Fix:** Load the complete FRAC role and KCM dictionary from a standardized CSV/JSON asset during the database initialization phase.

### 8. Pip Version Collisions in Monorepo Build
* **Symptom:** docker compose build failed with ResolutionImpossible due to strictly pinned sub-dependencies in ackend/requirements.txt clashing with ag-service (chromadb) and lti-security.
* **Root Cause:** Hardcoded == version constraints generated by pip freeze prevented pip from finding a compatible dependency graph across all three merged subsystems.
* **Resolution:** Replaced all strict pins in ackend/requirements.txt with only the top-level packages (e.g., astapi, sqlalchemy), allowing pip's resolver to safely unify the environments.

### 9. PyTorch GPU 5GB Network Timeout
* **Symptom:** The unified Docker build timed out repeatedly during pip install.
* **Root Cause:** The sentence-transformers library (used by RAG) pulls the massive GPU binaries for PyTorch (~5GB) by default. The Docker WSL2 network layer timed out downloading this massive payload.
* **Resolution:** Modified the ackend/Dockerfile to inject --extra-index-url https://download.pytorch.org/whl/cpu into the pip install command, forcing the lightweight (~200MB) CPU version of PyTorch.

### 10. Docker Engine Crash (WSL 2 Disk Full)
* **Symptom:** Docker Desktop became unresponsive and threw 500 Internal Server Error on all socket commands (like docker ps).
* **Root Cause:** The aborted 5GB PyTorch downloads from the failed builds accumulated and filled the Windows C: drive to 99.9% capacity, breaking the WSL 2 virtual disk.
* **Resolution:** Resolved via nuclear option: ran wsl --unregister docker-desktop to destroy the bloated 17GB .vhdx file and restarted Docker Engine to rebuild a clean disk.

