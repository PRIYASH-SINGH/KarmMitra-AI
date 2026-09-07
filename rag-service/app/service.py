# ==============================================================================
# INTEGRATION NOTE FOR MEMBER 1:
# Member 1 will import this with:
#     from rag_service.app.service import RAGAssessmentService
# (Or `from app.service import RAGAssessmentService` when working inside rag-service/)
# ==============================================================================

"""
Main service facade for KarmMitra AI RAG Service.
Exposes RAGAssessmentService as the single import surface for Member 1's FastAPI gateway.
Integrates semantic vector search and zero-hallucination Llama-3-8B MCQ generation.
"""

from typing import Optional
from pathlib import Path
import sys

# Support relative import when running as part of a package, or direct script execution
if __package__:
    from .config import (
        PERSIST_DIR,
        EMBEDDING_MODEL,
        LLM_HOST,
        LLM_MODEL,
        get_device,
    )
    from .retriever import CompetencyRetriever
    from .generator import SovereignAIEngine, AssessmentPayload
else:
    _pkg_root = Path(__file__).resolve().parent.parent
    if str(_pkg_root) not in sys.path:
        sys.path.insert(0, str(_pkg_root))
    from app.config import (
        PERSIST_DIR,
        EMBEDDING_MODEL,
        LLM_HOST,
        LLM_MODEL,
        get_device,
    )
    from app.retriever import CompetencyRetriever
    from app.generator import SovereignAIEngine, AssessmentPayload


class RAGAssessmentService:
    """
    Sovereign RAG Assessment Service for MoSPI / iGOT Karmayogi.
    Single-point integration class used by the FastAPI backend to generate
    psychometrically validated, zero-hallucination competency questions.
    """

    def __init__(
        self,
        persist_dir: Optional[str] = None,
        embedding_model: Optional[str] = None,
        llm_host: Optional[str] = None,
        llm_model: Optional[str] = None,
    ):
        self.persist_dir = str(persist_dir or PERSIST_DIR)
        self.embedding_model_name = embedding_model or EMBEDDING_MODEL
        self.llm_host = llm_host or LLM_HOST
        self.llm_model = llm_model or LLM_MODEL

        # Initialize Embedding Engine (CUDA with graceful CPU fallback)
        device = get_device()
        try:
            try:
                from langchain_huggingface import HuggingFaceEmbeddings
            except ImportError:
                from langchain_community.embeddings import HuggingFaceEmbeddings

            self.embeddings = HuggingFaceEmbeddings(
                model_name=self.embedding_model_name,
                model_kwargs={"device": device},
                encode_kwargs={"normalize_embeddings": True},
            )
        except Exception:
            # Fallback to CPU or mock-safe container if torch/CUDA/offline
            try:
                from langchain_community.embeddings import HuggingFaceEmbeddings
                self.embeddings = HuggingFaceEmbeddings(
                    model_name=self.embedding_model_name,
                    model_kwargs={"device": "cpu"},
                    encode_kwargs={"normalize_embeddings": True},
                )
            except Exception:
                self.embeddings = None

        # Open Persisted ChromaDB Vector Store
        try:
            try:
                from langchain_chroma import Chroma
            except ImportError:
                from langchain_community.vectorstores import Chroma

            self.vectorstore = Chroma(
                persist_directory=self.persist_dir,
                embedding_function=self.embeddings,
            )
        except Exception:
            self.vectorstore = None

        # Initialize Retriever & Sovereign AI Engine
        self.retriever = CompetencyRetriever(self.vectorstore)
        self.ai_engine = SovereignAIEngine(
            host=self.llm_host,
            model=self.llm_model,
        )

    async def create_competency_assessment(
        self,
        competency_name: str,
        competency_code: str,
        question_count: int = 3,
        domain: Optional[str] = None,
    ) -> AssessmentPayload:
        """
        Generates zero-hallucination MCQs for a given MoSPI competency.

        Workflow:
        1. Formulates a semantic search query for the competency.
        2. Retrieves top-4 reference chunks from the Chroma store.
        3. Raises ValueError if no relevant material exists in the vector store.
        4. Joins the chunks into a delimited context block.
        5. Calls SovereignAIEngine to generate and strictly validate MCQs via Pydantic.
        """
        # Step a: Formulate semantic query
        query = f"Methodology, definitions, instructions, and rules for {competency_name}"

        # Step b: Retrieve top-4 chunks
        if self.vectorstore is None:
            raise ValueError(
                f"Vector store is not initialized at '{self.persist_dir}'. "
                "Please run ingestion to create the persistent ChromaDB index."
            )

        chunks = self.retriever.retrieve(query=query, top_k=4, domain=domain)

        if not chunks:
            raise ValueError(
                f"No reference material found in MoSPI/NSSTA manuals for competency: "
                f"'{competency_name}' ({competency_code}). Please ingest official training manuals."
            )

        # Step c: Concatenate chunks into a single context block
        context_parts = [chunk.page_content.strip() for chunk in chunks if getattr(chunk, "page_content", "").strip()]
        if not context_parts:
            raise ValueError(
                f"Retrieved chunks for '{competency_name}' ({competency_code}) contain no readable text."
            )

        context_block = "\n\n---\n\n".join(context_parts)

        # Step d: Generate and validate MCQs via Sovereign AI Engine
        assessment = await self.ai_engine.generate_mcqs(
            context=context_block,
            competency_name=competency_name,
            competency_code=competency_code,
            count=question_count,
        )

        return assessment
