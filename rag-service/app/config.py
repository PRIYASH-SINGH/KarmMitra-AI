"""
Central configuration module for KarmMitra AI RAG Service.
Centralizes paths, embedding models, text chunking parameters, and local LLM endpoints.
Supports environment variable overrides via .env.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Base directory for rag-service
BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env from rag-service root or current working directory
env_path = BASE_DIR / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

# Raw PDF manual drop directory
RAW_PDF_DIR = os.getenv("RAW_PDF_DIR", str(BASE_DIR / "data" / "raw_pdfs"))

# Persistent ChromaDB vector store directory
PERSIST_DIR = os.getenv("PERSIST_DIR", str(BASE_DIR / "vectorstore"))

# Embedding model identifier
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")

# Semantic text splitting configuration
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "750"))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "150"))

# Local Sovereign LLM configuration (Ollama / vLLM)
LLM_HOST = os.getenv("LLM_HOST", "http://localhost:11434")
LLM_MODEL = os.getenv("LLM_MODEL", "llama3:8b")


def get_device() -> str:
    """
    Detects whether CUDA acceleration is available for HuggingFace embeddings,
    falling back cleanly to CPU if unavailable.
    """
    try:
        import torch
        if torch.cuda.is_available():
            return "cuda"
    except Exception:
        pass
    return "cpu"
