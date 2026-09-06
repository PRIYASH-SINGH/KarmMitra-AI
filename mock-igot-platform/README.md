# KarmMitra AI — Mock iGOT Karmayogi LMS Platform Simulator (Member 6)

[![Node.js 18+](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-4.21+-blue.svg)](https://expressjs.com)
[![LTI 1.3](https://img.shields.io/badge/IMS%20Global-LTI%201.3%20Advantage-orange.svg)](https://www.imsglobal.org/)
[![MoSPI Sovereign AI](https://img.shields.io/badge/MoSPI-Mission%20Karmayogi-purple.svg)](https://karmayogi.gov.in/)

## Subsystem Overview
This microservice simulates the **iGOT Karmayogi** Government of India LMS platform for the **KarmMitra AI** ecosystem (SIH26101). It enables the team to test LTI 1.3 launches, synthetic MoSPI personas, and Assignment and Grade Services (AGS) passbacks locally without needing direct access to government production systems:

1. **LTI 1.3 Launch Initiator (`POST /platform/launch`)**:
   - Generates RS256-signed IMS Global `id_token` payloads with custom MoSPI claims (`frac_role`, `division`, `state`).
   - Serves an auto-submitting HTML redirect form targeting the KarmMitra tool (`http://localhost:8000/lti/launch`).
2. **RFC 7517 Public JWKS (`GET /.well-known/jwks.json`)**:
   - Exposes the platform's RSA public key with `n`, `e`, and `kid` (`igot-mock-key-2026`) so Member 3's tool can verify token signatures.
3. **Synthetic Persona Selector (`GET /api/users`)**:
   - Pre-seeds MoSPI statistical officers spanning Field Operations (FOD), Survey Design (SDRD), and National Accounts (NAD) across diverse onboarding scenarios (cold-start triage, mid-career gap analysis, leadership).
4. **AGS Grade Passback Receiver (`POST /platform/ags/lineitem/.../scores`)**:
   - Validates incoming grade payloads (`userId`, `scoreGiven`, `scoreMaximum`, `activityProgress`).
   - Persists submissions in-memory and displays them in a live stream via `GET /platform/ags/history`.
5. **Portal Simulator Test Harness (`public/index.html`)**:
   - Clean developer and demonstration interface on `http://localhost:9000` with clear simulation warning banners.
6. **Automated QA & Preflight Runner (`test_runner.py`)**:
   - Comprehensive test runner probing all 6 monorepo subsystems and executing automated functional tests.

---

## Directory Layout
```
mock-igot-platform/
├── package.json                    # Dependencies (express, cors, body-parser, jsonwebtoken, dotenv)
├── server.js                       # Express server simulating iGOT Karmayogi
├── .env.example                    # Configuration template
├── .gitignore                      # Excludes certs/*.key, .env, node_modules/
├── certs/
│   ├── platform_private.key        # RSA key for signing test LTI launch tokens (excluded in git)
│   └── platform_public.key         # Exposed via /.well-known/jwks.json (excluded in git)
├── data/
│   ├── synthetic_users.json        # Seeded MoSPI statistical officer personas
│   └── course_catalog.json         # Simulated iGOT MoSPI course catalog
├── public/
│   └── index.html                  # Test harness UI with live AGS passback monitor
├── test_runner.py                  # End-to-end integration and preflight test suite
└── README.md                       # Subsystem documentation
```

---

## Quickstart Guide

### 1. Install Dependencies
```bash
npm install
# Note for Windows PowerShell users: use npm.cmd install if script execution policy restricts npm.ps1
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Key environment variables:
| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `9000` | Port for the mock platform server |
| `TOOL_LAUNCH_URL` | `http://localhost:8000/lti/launch` | Target LTI 1.3 launch endpoint on KarmMitra gateway |
| `PLATFORM_ISSUER` | `https://igotkarmayogi.gov.in` | Expected `iss` claim |
| `TOOL_CLIENT_ID` | `karmmitra_sih26101_tool` | Registered OAuth 2.0 client ID |
| `PLATFORM_KEY_ID` | `igot-mock-key-2026` | Public/private key identifier |

### 3. Start the Mock Platform
```bash
npm start
# Or directly: node server.js
```
The server will boot on `http://localhost:9000`.

### 4. Run the QA Test Runner
In a separate terminal:
```bash
# Run isolated mock platform self-tests:
python test_runner.py --mock-only

# Run full ecosystem preflight (across all 6 subsystems):
python test_runner.py
```

---

## Endpoints Reference

| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/` or `/index.html` | Portal simulator UI test harness |
| `GET` | `/.well-known/jwks.json` | RFC 7517 compliant platform JWKS key set |
| `GET` | `/health` | Liveness health probe |
| `GET` | `/api/users` | List synthetic MoSPI officer personas |
| `GET` | `/api/courses` | List simulated iGOT MoSPI course catalog |
| `POST` | `/platform/launch` | Initiate signed RS256 LTI 1.3 launch |
| `GET` | `/platform/oidc/auth` | Simulated LMS OIDC authorization endpoint |
| `POST` | `/platform/ags/lineitem/competency_assessment/scores` | AGS grade passback receiver |
| `GET` | `/platform/ags/history` | View received grade passbacks |
| `DELETE` | `/platform/ags/history` | Reset received grade passbacks |
