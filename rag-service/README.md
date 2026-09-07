# KarmMitra AI — RAG Service (Member 2 Deliverable)

Sovereign competency assessment and zero-hallucination multiple-choice question (MCQ) engine for **MoSPI / iGOT Karmayogi** (SIH26101 Hackathon).

---

## Deliverable Summary

This service is fully self-contained inside `rag-service/` within the `karmmitra-ai` monorepo. It implements:
1. **Document Ingestion**: Ingests MoSPI/NSSTA PDF training manuals from `data/raw_pdfs/`, cleans and chunks text using `RecursiveCharacterTextSplitter` (750 chars, 150 overlap) with tabular/statistical context preservation.
2. **Embeddings & Persistent ChromaDB**: Generates normalized embeddings with `sentence-transformers/all-MiniLM-L6-v2` (CUDA with clean CPU fallback) and stores them into persistent local ChromaDB disk storage (`./vectorstore`).
3. **Domain-Aware Semantic Retrieval**: Retrieves top relevant reference chunks filtered/boosted by KCM competency domains (`Functional`, `Behavioural`, `Domain`).
4. **Zero-Hallucination Sovereign AI Engine**: Directs local Llama-3-8B (via Ollama or vLLM) with a strict zero-hallucination prompt forbidding outside knowledge and demanding raw JSON schema.
5. **Strict Pydantic Validation**: Validates every generated question against Pydantic schemas (strictly 4 options, valid correct answer key, and grounded source justification).
6. **Single Import Interface for Member 1**: Exposes `RAGAssessmentService`.

---

## Directory Structure

```text
rag-service/
├── data/
│   └── raw_pdfs/            # Drop MoSPI / NSSTA PDF manuals here (.gitkeep preserved)
├── vectorstore/              # Persistent ChromaDB disk storage (git-ignored)
├── requirements.txt         # Pinned service dependencies
├── .env.example             # Configuration defaults and overrides
├── .gitignore               # Ignores vectorstore, .env, __pycache__, raw pdfs
├── app/
│   ├── __init__.py          # Exports RAGAssessmentService
│   ├── config.py            # Centralized settings & GPU/CPU fallback helper
│   ├── ingestion.py         # PDF parsing, semantic chunking & vector seeding
│   ├── retriever.py         # CompetencyRetriever with domain filtering
│   ├── generator.py         # SovereignAIEngine + strict Pydantic schemas + zero-hallucination prompt
│   └── service.py           # RAGAssessmentService (Member 1 integration facade)
├── test_service.py          # Standalone verification script
└── README.md
```

---

## Integration for Member 1 (FastAPI Gateway)

Member 1 imports `RAGAssessmentService` directly:

```python
from rag_service.app.service import RAGAssessmentService
# Or: from app.service import RAGAssessmentService

# 1. Initialize service once on backend startup
rag_service = RAGAssessmentService()

# 2. Call competency assessment inside FastAPI route
assessment = await rag_service.create_competency_assessment(
    competency_name="CAPI Data Collection",
    competency_code="KCM_FUNC_STAT_04",
    question_count=3,
    domain="Functional"
)

# 3. Return validated JSON payload to learner UI
return assessment.model_dump()
```

---

## Setup & Running

### 1. Install Dependencies

```bash
cd rag-service
python -m venv .venv

# Windows:
.venv\Scripts\activate
# Linux / macOS:
source .venv/bin/activate

pip install -r requirements.txt
```

### 2. Ingest MoSPI / NSSTA Manuals

Drop your PDF manuals into `data/raw_pdfs/`, then run:

```bash
python -m app.ingestion
```

### 3. Run Local LLM (Ollama / vLLM)

Start Ollama with Llama-3:

```bash
ollama run llama3:8b
```

### 4. Run Verification Test

```bash
python test_service.py
```
