# 03 Explicit Comments — Inline Intent

In the KarmMitra AI codebase, we follow a strict commenting philosophy. Code tells you *how* it does something. Explicit comments tell you *why* it does it. This is essential for hackathon speed and cross-team code handoffs.

## The Standard: Intent over Narration

Do **not** narrate the syntax. Do explain the **architectural intent, business rule, or workaround**.

### ❌ Bad Comment (Narration)
```python
# Create a new query to select the user by user_id
query = select(OfficialProfile).where(OfficialProfile.user_id == payload.user_id)
# Execute the query
result = await db.execute(query)
```

### ✅ Good Comment (Inline Intent)
```python
# INTENT: Fetch user or auto-create if launched via LTI without pre-seeding (Cold Start).
query = select(OfficialProfile).where(OfficialProfile.user_id == payload.user_id)
```

## Required Comment Tags

Whenever you write a non-trivial piece of logic, prefix the comment with one of these tags:

### 1. `INTENT:`
Used for business logic, schema design, or API contracts.
> `INTENT: Domain classification determines the 70:20:10 pathway bucket. Functional -> 70% experiential tasks.`

### 2. `WHY:`
Used for dependency choices, framework quirks, or rejecting an alternative approach.
> `WHY allow_origins=["*"] for prototype: During SIH, Members 4/5 run React dev servers on varying ports. In prod, constrain this.`

### 3. `FIX:` or `CRITICAL:`
Used to document a known bug that was squashed, preventing teammates from accidentally reverting it.
> `FIX (Blind Spot #2): We use conn.run_sync() because Base.metadata.create_all is synchronous. Calling it directly on async engine causes crashes.`

## Contract Alignment Comments
When creating schemas, document exactly which frontend component relies on the shape:
```python
class TriageQuestionOut(BaseModel):
    """
    INTENT: Matches the shape that Member 4's BaselineTriage.jsx
    destructures: { id, questionText, options: [{key, text}], correctOption }
    """
```

## DevOps Constraints and Warnings

> [!CAUTION]
> **RSA Keys Required for Mock iGOT & Gateway:** The `mock-igot-platform/certs/` directory MUST contain manually generated `platform_private.key` and `platform_public.key` via OpenSSL before building the mock container. Additionally, the FastAPI Gateway requires its own LTI Tool keys in `backend/certs/private.key` and `backend/certs/public.key` for the `/lti/jwks.json` endpoint to work without throwing a `500 Internal Server Error`.
