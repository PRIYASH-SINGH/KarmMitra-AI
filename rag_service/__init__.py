"""
Python package bridge: maps `rag_service` imports to `rag-service/` directory.
The actual RAG code lives in rag-service/app/. We add rag-service/ to sys.path
so that its internal `from app.config import ...` imports resolve
to rag-service/app/ rather than backend/app/.
"""
