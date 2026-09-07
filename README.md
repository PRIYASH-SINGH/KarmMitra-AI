# KarmMitra AI (SIH26101)

A Sovereign AI and LTI 1.3-Compliant Competency Engine for Mission Karmayogi & MoSPI.

## Tech Stack
- **Backend Gateway**: FastAPI, Python 3.11, SQLAlchemy 2.0 (Async)
- **Database**: PostgreSQL 16
- **Sovereign AI/RAG**: Local Llama-3-8B via vLLM/Ollama, ChromaDB, SentenceTransformers
- **LTI Security**: RS256 OIDC, JWT, AGS Passback, Bhashini NMT
- **Mock LMS**: Express.js (Node 18) iGOT Karmayogi Simulator
- **Frontend**: React 18 (Learner & Admin UIs — in development)
- **Infrastructure**: Docker Compose (unified monorepo network)

## Quick Start

```bash
# 1. Copy the environment template
cp .env.example .env

# 2. Build and run the entire stack
docker compose up --build -d

# 3. Verify
curl http://localhost:8000/health       # Unified Gateway
curl http://localhost:9000/health       # Mock iGOT Platform
```

## Service Endpoints
| Service | URL | Description |
| :--- | :--- | :--- |
| Gateway API Docs | `http://localhost:8000/docs` | Swagger UI for all endpoints |
| Mock iGOT Portal | `http://localhost:9000` | LTI launch simulator & AGS receiver |
| LTI JWKS | `http://localhost:8000/lti/jwks.json` | Tool public key set |

## Monorepo Layout
```
karmmitra-ai/
├── backend/                # Member 1: FastAPI Gateway & PostgreSQL
├── rag-service/            # Member 2: Sovereign AI RAG Pipeline
├── lti-security/           # Member 3: LTI 1.3 Security & Bhashini
├── mock-igot-platform/     # Member 6:
├── Mock iGOT LMS Simulator
├── admin-ui/               # Member 5:
├── learner-ui/             # Member 4: React Learner Dashboard
├── docker-compose.yml      # Root orchestration (all services)
└── .env.example            # Environment configuration template
```

## Tear Down
```bash
docker compose down -v      # Wipes DB volume for a clean restart
```
