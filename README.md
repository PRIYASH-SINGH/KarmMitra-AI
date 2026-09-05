# KarmMitra AI (SIH26101)

A Sovereign AI and LTI 1.3-Compliant Competency Engine for Mission Karmayogi & MoSPI.

## Tech Stack
- **Backend**: FastAPI, Python 3.11
- **Database**: PostgreSQL 16 (Async SQLAlchemy)
- **AI/RAG**: Local Llama-3-8B via vLLM, ChromaDB
- **Frontend**: React 18
- **Infrastructure**: Docker Compose

## Quick Start (Backend)

The backend and database are fully containerized. To spin up the gateway and PostgreSQL database with auto-seeding:

```bash
cd backend
# Create your local environment file
cp .env.example .env

# Build and run the containers
docker compose up --build -d
```

The FastAPI gateway will be available at `http://localhost:8000`.
API documentation (Swagger UI) is available at `http://localhost:8000/docs`.

To tear down and wipe the database:
```bash
docker compose down -v
```
