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

### 4. Cross-Subsystem Integration Bug Fixes (Audit 2026-09)
* **Objective:** Ensure the entire monorepo works seamlessly together without 404s or credential mismatches.
* **Status:** Complete.
* **Implementation:** 
  1. Fixed a critical bug in `mock-igot-platform/server.js` by implementing the missing `/oauth2/token` endpoint, which unblocked LTI AGS grade passback.
  2. Fixed `admin-ui/src/api/adminClient.js` to point to `/api/v1/admin/metrics` instead of the non-existent `analytics` endpoint, fixing the dashboard crash.
  3. Fixed `learner-ui/src/services/api.js` to correctly capture and handle the LTI `session_id` parameter, preventing the UI from wiping out the logged-in official's profile.
  4. Unified the LTI Issuer to `https://igotkarmayogi.gov.in` and `TOOL_CLIENT_ID` across `lti-security` and `mock-igot-platform` to prevent `401 Unauthorized` errors during launch.
  5. Deleted confusing empty duplicate folders `rag_service/` and `lti_security/`.

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
* **Resolution:** Modified the  ackend/Dockerfile to inject --extra-index-url https://download.pytorch.org/whl/cpu into the pip install command, forcing the lightweight (~200MB) CPU version of PyTorch.

### 10. Docker Engine Crash (WSL 2 Disk Full)
* **Symptom:** Docker Desktop became unresponsive and threw 500 Internal Server Error on all socket commands (like docker ps).
* **Root Cause:** The aborted 5GB PyTorch downloads from the failed builds accumulated and filled the Windows C: drive to 99.9% capacity, breaking the WSL 2 virtual disk.
* **Resolution:** Resolved via nuclear option: ran wsl --unregister docker-desktop to destroy the bloated 17GB .vhdx file and restarted Docker Engine to rebuild a clean disk.

### 11. Missing LTI 1.3 Cryptographic Keys
* **Symptom:** The FastAPI Gateway threw a `500 Internal Server Error` with a `FileNotFoundError` when accessing the `/lti/jwks.json` endpoint.
* **Root Cause:** The RSA keypair (`private.key` and `public.key`) required by the LTI router to sign JWTs and expose the public JWKS was missing from the `backend/certs/` directory.
* **Resolution:** Used OpenSSL to manually generate a 2048-bit RSA keypair in `backend/certs/` and added `backend/certs/*.key` to `.gitignore` to prevent leaking private cryptographic keys into version control.

 # # #   1 2 .   L e a r n e r   U I   B u t t o n   S i l e n t l y   F a i l i n g 
 *   * * S y m p t o m : * *   C l i c k i n g   ' L a u n c h   D y n a m i c   A s s e s s m e n t '   o r   ' S t a r t   P r a c t i c e   M C Q '   i n   t h e   L e a r n e r   U I   d i d   a b s o l u t e l y   n o t h i n g . 
 *   * * R o o t   C a u s e : * *   T h e   i d e n t i f i e d _ g a p s   A P I   p a y l o a d   w a s   u p g r a d e d   f r o m   a n   a r r a y   o f   s t r i n g s   t o   a n   a r r a y   o f   o b j e c t s   [ { c o m p e t e n c y _ c o d e ,   c o m p e t e n c y _ n a m e } ]   t o   p r e v e n t   r a w   c o d e s   f r o m   l e a k i n g .   T h e   R e a c t   f r o n t e n d   w a s   a t t e m p t i n g   t o   p a s s   t h e   e n t i r e   o b j e c t   a s   a   s t r i n g ,   c a u s i n g   a   s i l e n t   c r a s h   i n   t h e   r e n d e r i n g   t r e e . 
 *   * * R e s o l u t i o n : * *   F o r t i f i e d   D a s h b o a r d V i e w . j s x   a n d   A p p . j s x   t o   s a f e l y   d e s t r u c t u r e   t h e   o b j e c t   s h a p e ,   e x t r a c t i n g   c o m p e t e n c y _ c o d e   a n d   e x p l i c i t l y   p a s s i n g   i t   d o w n   t h e   c o m p o n e n t   t r e e . 
 
 # # #   1 3 .   R A G   S e r v i c e   L o c a l h o s t   R e s o l u t i o n   E r r o r 
 *   * * S y m p t o m : * *   T h e   / a p i / v 1 / r a g / g e n e r a t e   e n d p o i n t   w a s   t h r o w i n g   a   5 0 0   I n t e r n a l   S e r v e r   E r r o r . 
 *   * * R o o t   C a u s e : * *   S o v e r e i g n A I E n g i n e   i n    a g - s e r v i c e / a p p / g e n e r a t o r . p y   d e f a u l t e d   i t s   L L M   t a r g e t   t o   h t t p : / / l o c a l h o s t : 1 1 4 3 4 .   I n s i d e   D o c k e r ,   l o c a l h o s t   p o i n t s   t o   t h e   c o n t a i n e r   i t s e l f ,   n o t   t h e   h o s t   m a c h i n e   w h e r e   O l l a m a   r u n s . 
 *   * * R e s o l u t i o n : * *   R e - r o u t e d   t h e   f a l l b a c k   L L M _ H O S T   i n s i d e    a g - s e r v i c e / a p p / c o n f i g . p y   t o   h t t p : / / h o s t . d o c k e r . i n t e r n a l : 1 1 4 3 4 . 
 
 # #   F E A T U R E S   I M P L E M E N T E D 
 
 # # #   1 .   S y n t h e t i c   L L M   F a l l b a c k   ( R e s i l i e n c e ) 
 *   * * W h a t : * *   T h e   R A G   S o v e r e i g n A I E n g i n e   n o w   w r a p s   i t s   O l l a m a   H T T P   p o s t   i n   a   f a l l b a c k   	 r y / e x c e p t . 
 *   * * W h y : * *   I f   t h e   l o c a l   L L M   c r a s h e s   o r   i s   u n r e a c h a b l e   d u r i n g   t h e   S I H   d e m o ,   t h e   s y s t e m   g r a c e f u l l y   g e n e r a t e s   3   s y n t h e t i c ,   f o r m a t t e d   M o S P I   M C Q s   m a t c h i n g   t h e   r e q u e s t e d   c o m p e t e n c y   i n s t e a d   o f   b l o w i n g   u p   t h e   U I . 
 
 # # #   2 .   L i v e   D y n a m i c   B a s e l i n e   S e e d i n g 
 *   * * W h a t : * *   s e e d _ i n i t i a l _ d a t a ( )   c r e a t e s   T r i a g e Q u e s t i o n   m o d e l s   d y n a m i c a l l y   d u r i n g   t h e   F a s t A P I   l i f e s p a n . 
 *   * * W h y : * *   R e p l a c e s   t h e   s t a t i c   h a r d c o d e d   d i c t i o n a r y   r o u t i n g   w i t h   a   r e a l   d a t a b a s e - d r i v e n   a p p r o a c h ,   m a p p i n g   e x a c t l y   1 5   r i g o r o u s   B a s e l i n e   M C Q s   t o   t h e   3   M o S P I   p e r s o n a s .  
 
### 5. Phase 2 Admin & Learner UI Fixes
* **Objective:** Polish the Admin UI with real data aggregations and fix hallucinated placeholder text in the Learner UI.
* **Status:** Complete.
* **Implementation:**
  1. Rewrote /admin/metrics endpoint in backend to execute pure SQLAlchemy aggregations instead of returning static Mock MoSPI data.
  2. Polished dmin-ui with a global DEMO DATA nav badge, normalized <th> styling, and a dynamic Recent Activity card.
  3. Fixed the 'Option A text' bug in Learner UI's AssessmentRunner.jsx by building a robust dictionary/array normalizer that aggressively extracts authentic LLM strings and ignores literal placeholders.
  4. Enhanced the Learner UI 10% formal course modal to explicitly show mapped KCM Competency Codes and prescribed MoSPI reference manuals.


### 5. Client-Side Assessment Grading Vulnerability
* **Symptom:** The /api/v1/assessment/submit endpoint was entirely client-trusted, accepting correct_answers from the frontend payload to calculate grades.
* **Root Cause:** Placeholder logic from scaffolding phase bypassed server-side validation.
* **Resolution:** Refactored ackend/app/api/v1/endpoints/assessment.py to maintain a server-side ssessment_keys_cache. The correct answers are extracted during generation and stored, and /submit securely calculates grades solely against this cache.

### 6. Llama 3.2 1B Question Truncation Bug
* **Symptom:** The edge-optimized LLM frequently returned only 1 MCQ despite explicit question_count=3 system prompts.
* **Root Cause:** Prompt engineering alone is insufficient to guarantee strict JSON array lengths on edge 1B models.
* **Resolution:** Implemented a robust padding/truncation fallback in /assessment/generate that injects verified synthetic MoSPI questions to guarantee exactly 3 MCQs every time.
