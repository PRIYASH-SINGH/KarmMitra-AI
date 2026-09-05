# 04 Flow — How Execution Travels

This document traces the lifecycle of a user request across the KarmMitra AI distributed architecture. It explains how Member 1's backend coordinates execution between the frontend and other microservices.

## Flow 1: LTI Handshake & Cold Start (Members 6 -> 3 -> 4 -> 1)

1. **iGOT Portal (Member 6 Mock):** User selects an official persona and clicks "Launch".
2. **OIDC Handshake:** Form POSTs a signed LTI 1.3 JWT to Member 3's `/lti/launch` route.
3. **Decryption (Member 3):** JWT is decoded, verifying signature. Extracted: `user_id` (sub claim), `frac_role_code`, `lineitem_url`.
4. **Redirect (Member 3):** User redirected to Learner UI (Member 4) with URL params: `?user_id=...&role=...`
5. **Triage Fetch (Member 4 -> 1):** Learner UI calls `GET /api/v1/triage/questions`.
6. **Triage Submit (Member 4 -> 1):** Learner completes 5-Q quiz. Calls `POST /api/v1/triage/submit`.
7. **Auto-Upsert (Member 1):** Gateway creates the `OfficialProfile` if it doesn't exist, logs score, and calculates gaps.

## Flow 2: RAG Assessment Execution (Members 4 -> 1 -> 2)

1. **Pathway Trigger (Member 4):** User clicks "Launch Module" on a 10% Formal Course (PathwayCard).
2. **RAG Proxy (Member 4 -> 1):** Learner UI POSTs `AssessmentRequestIn` to Gateway (`/api/v1/assessment/generate`).
3. **Sovereign AI (Member 1 -> 2):** Gateway routes request to Member 2's local `vLLM`/ChromaDB service via REST.
4. **Validation (Member 1):** Gateway validates Member 2's response against `AssessmentGenerateOut` Pydantic schema to catch hallucinations/malformed JSON.
5. **Render (Member 1 -> 4):** Verified MCQ JSON returned to React frontend.

## Flow 3: AGS Grade Passback (Members 4 -> 1 -> 3 -> 6)

1. **Submit Quiz (Member 4 -> 1):** Learner completes RAG quiz. `POST /api/v1/assessment/submit`.
2. **Scoring & Logging (Member 1):** Gateway scores answers against `correct_answers` map. Saves to `AssessmentResult` table with `ags_passback_status = "pending"`.
3. **AGS Invocation (Member 1 -> 3):** Gateway triggers Member 3's internal passback client (using LTI `lineitem_url`).
4. **Platform Sync (Member 3 -> 6):** Secure S2S call to the LMS to update the government gradebook.
5. **Commit (Member 1):** Gateway updates `ags_passback_status` to `"success"`.

## Flow 4: Admin Analytics (Members 5 -> 1)

1. **Dashboard Mount (Member 5):** Admin Dashboard loads.
2. **Data Fetch (Member 5 -> 1):** Axios calls `GET /api/v1/admin/metrics`.
3. **Aggregation (Member 1):**
   - PostgreSQL queries average readiness (`AssessmentResult` / `OfficialProfile.triage_score`).
   - Group by `OfficialProfile.division` for Readiness charts.
   - Map against `KCMCompetency` thresholds for Radar charts.
4. **Render:** JSON shape matching `AdminMetricsOut` returned, powering Recharts directly.
