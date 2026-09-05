# 06 Architecture — The System Map

This document illustrates the overarching system topology for KarmMitra AI, highlighting how Member 1's backend operates as the central hub.

## Macro Topology

```mermaid
graph TD
    %% Member 6 (Mock iGOT Platform)
    subgraph M6 [Member 6: Mock iGOT]
        LMS[iGOT Portal Simulator]
        AGS[Gradebook / Lineitem]
    end

    %% Members 4 & 5 (Frontend)
    subgraph Frontends
        M4[Member 4: Learner UI React :3000]
        M5[Member 5: Admin UI React :5173]
    end

    %% Member 1 (Core Backend & DB)
    subgraph M1 [Member 1: Core Gateway Docker]
        API[FastAPI Gateway :8000]
        DB[(PostgreSQL 16)]
    end

    %% Member 3 (LTI Security)
    subgraph M3 [Member 3: Auth]
        LTI[OIDC & JWT Validaton]
    end

    %% Member 2 (RAG & AI)
    subgraph M2 [Member 2: Sovereign AI]
        VLLM[Ollama / vLLM :11434]
        CHROMA[(ChromaDB)]
    end

    %% Connections
    LMS -- "POST /lti/launch (JWT)" --> LTI
    LTI -- "Verified Context" --> M4
    
    M4 -- "Axios REST" --> API
    M5 -- "Axios REST" --> API
    
    API -- "Asyncpg SQL" --> DB
    API -- "RAG Request" --> VLLM
    VLLM -- "Vector Search" --> CHROMA
    
    API -- "Trigger Passback" --> LTI
    LTI -- "Signed JWT Passback" --> AGS
```

## Internal Backend Architecture (Member 1)

The backend follows a strict layered architecture:

1. **Gateways (`app/api/`):** 
   - HTTP route controllers. 
   - Parse incoming JSON payloads into Pydantic models.
   - Return formatted Pydantic responses.
   - *Rule: No raw SQL allowed here.*

2. **Schemas (`app/schemas/`):**
   - Pydantic `BaseModel` classes defining data contracts.
   - Separate models for `In` (Requests) and `Out` (Responses).

3. **Core (`app/core/`):**
   - Engine initialization (`database.py`).
   - Env variable validation (`config.py`).

4. **Models (`app/models/`):**
   - SQLAlchemy ORM models representing PostgreSQL tables.
   - *Rule: Use type-hinted Columns and explicit ForeignKeys.*

## Orchestration Details
* **Containerization:** The API and DB run on `karmmitra_net` via Docker Compose.
* **Volume Persistence:** PostgreSQL data is mapped to the `pgdata` Docker volume.
* **Network Exit:** The container connects to Member 2's AI engine using `host.docker.internal` to escape the virtual bridge and hit the host machine.
