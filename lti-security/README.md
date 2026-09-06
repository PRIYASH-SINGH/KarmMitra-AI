# KarmMitra AI — LTI 1.3 Security & Bhashini DPI Integration Microservice (Member 3)

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111+-009688.svg)](https://fastapi.tiangolo.com)
[![LTI 1.3](https://img.shields.io/badge/IMS%20Global-LTI%201.3%20Advantage-orange.svg)](https://www.imsglobal.org/activity/learning-tools-interoperability)
[![Bhashini DPI](https://img.shields.io/badge/Digital%20India-Bhashini%20NMT-green.svg)](https://bhashini.gov.in/)

## Subsystem Overview
This microservice provides the security foundation for **KarmMitra AI** inside the **iGOT Karmayogi LMS** (Government of India):
- **OIDC Login Initiation (`GET /lti/login`)**: Validates platform issuer, generates cryptographically random `state` and `nonce`, and redirects to LMS authorization endpoint.
- **LTI 1.3 Launch Verification (`POST /lti/launch`)**: Strictly validates incoming RS256 `id_token` against platform JWKS keys, enforces single-use replay protection, extracts user roles and competency claims (`frac_role`, `division`, `state`), and produces opaque server-side sessions.
- **Public JWKS Endpoint (`GET /lti/jwks.json`)**: Exposes this tool's public key in RFC 7517 JWK format for platform grade signature verification.
- **AGS Grade Passback (`app/lti/ags.py`)**: Uses RS256-signed OAuth 2.0 client-assertion tokens to submit learner scores to `{lineitem}/scores` with SHA-256 idempotency deduplication.
- **Bhashini NMT Translation (`app/services/bhashini.py`)**: Async translation client connecting to Bhashini Dhruva pipeline inference endpoints with in-memory LRU caching and graceful fallback.

---

## Directory Layout
```
lti-security/
├── certs/                   # RSA 2048-bit keypair (.gitignore strictly excludes *.key)
│   ├── private.key          # Auto-generated RSA Private Key
│   └── public.key           # Auto-generated RSA Public Key
├── app/
│   ├── __init__.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py        # Pydantic Settings class with .env configuration
│   │   └── security.py      # RSA loaders, RFC 7517 JWK converter, Replay protection, Session store
│   ├── lti/
│   │   ├── __init__.py
│   │   ├── oidc.py          # GET /lti/login (OIDC Initiation) & GET /lti/jwks.json (Tool JWKS)
│   │   ├── validator.py     # POST /lti/launch (Strict RS256 signature check, nonce check, claims extract)
│   │   └── ags.py           # OAuth2 client-assertion token exchange & idempotent grade passback
│   ├── services/
│   │   ├── __init__.py
│   │   └── bhashini.py      # Async Bhashini NMT client with LRU caching & resilient fallback
│   ├── main.py              # Standalone FastAPI gateway app mounting lti_router
│   └── router.py            # APIRouter(prefix="/lti") master router
├── .env.example             # Configuration template
├── .gitignore               # Excludes certs/, *.key, .env, .venv
├── requirements.txt         # Production dependencies
└── test_handshake.py        # Complete automated test suite
```

---

## Setup & Testing

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Generate RSA Keypair (if not present)
```bash
openssl genrsa -out certs/private.key 2048
openssl rsa -in certs/private.key -pubout -out certs/public.key
```

### 3. Run Test Suite
```bash
python test_handshake.py
# Or with pytest:
pytest -v test_handshake.py
```

### 4. Run Microservice
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
