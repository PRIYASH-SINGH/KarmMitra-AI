"""
Document Ingestion Pipeline for KarmMitra AI RAG Service.
Extracts text from MoSPI / NSSTA training PDF manuals, performs context-aware
semantic chunking, computes embeddings via HuggingFace, and persists into ChromaDB.
"""

import sys
from pathlib import Path
from typing import Optional

# Support relative import when running as part of a package, or direct script execution
if __package__:
    from .config import (
        RAW_PDF_DIR,
        PERSIST_DIR,
        EMBEDDING_MODEL,
        CHUNK_SIZE,
        CHUNK_OVERLAP,
        get_device,
    )
else:
    _pkg_root = Path(__file__).resolve().parent.parent
    if str(_pkg_root) not in sys.path:
        sys.path.insert(0, str(_pkg_root))
    from app.config import (
        RAW_PDF_DIR,
        PERSIST_DIR,
        EMBEDDING_MODEL,
        CHUNK_SIZE,
        CHUNK_OVERLAP,
        get_device,
    )


def run_ingestion(
    raw_pdf_dir: Optional[str] = None,
    persist_dir: Optional[str] = None
) -> None:
    """
    Executes the ingestion workflow:
    1. Validates or creates the raw PDF directory.
    2. Loads all PDFs via PyPDFDirectoryLoader.
    3. Splits text using RecursiveCharacterTextSplitter with statistical context preservation.
    4. Generates embeddings using sentence-transformers (CUDA fallback to CPU).
    5. Persists vectors into ChromaDB with demo-narratable step-by-step logs.
    """
    target_raw_dir = Path(raw_pdf_dir or RAW_PDF_DIR)
    target_persist_dir = str(persist_dir or PERSIST_DIR)

    # 1. Ensure directory exists and check for PDF files
    if not target_raw_dir.exists():
        target_raw_dir.mkdir(parents=True, exist_ok=True)
        print(f"[INGESTION] Created missing directory: {target_raw_dir.resolve()}")
        print(f"[INGESTION] Action Required: Drop official MoSPI / NSSTA PDF manuals into '{target_raw_dir.resolve()}' and re-run ingestion.")
        return

    pdf_files = list(target_raw_dir.glob("*.pdf")) + list(target_raw_dir.glob("**/*.pdf"))
    if not pdf_files:
        print(f"[INGESTION] Directory '{target_raw_dir.resolve()}' exists but contains no PDF manuals.")
        print("[INGESTION] Action Required: Place official MoSPI / NSSTA training manuals (e.g. CAPI manual, Field Survey Guidelines) into this folder.")
        return

    print("=" * 70)
    print("      KARMMITRA AI - SOVEREIGN RAG INGESTION PIPELINE")
    print("=" * 70)

    # 2. Load PDF documents
    print(f"\n[STEP 1/4] Loading PDF documents from: {target_raw_dir.resolve()}")
    try:
        from langchain_community.document_loaders import PyPDFDirectoryLoader
    except ImportError:
        print("[ERROR] 'langchain-community' or 'pypdf' not installed. Install requirements first.")
        sys.exit(1)

    loader = PyPDFDirectoryLoader(str(target_raw_dir))
    documents = loader.load()

    if not documents:
        print("[INGESTION WARNING] No readable text could be extracted from the PDF files.")
        return

    print(f"[STEP 1/4 COMPLETED] Loaded {len(documents)} page(s) across {len(pdf_files)} PDF manual(s).")

    # 3. Context-aware text chunking
    print(f"\n[STEP 2/4] Splitting documents into semantic chunks (size={CHUNK_SIZE}, overlap={CHUNK_OVERLAP})...")
    try:
        from langchain_text_splitters import RecursiveCharacterTextSplitter
    except ImportError:
        from langchain.text_splitter import RecursiveCharacterTextSplitter

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", " ", ""],
    )
    chunks = text_splitter.split_documents(documents)
    print(f"[STEP 2/4 COMPLETED] Created {len(chunks)} context-aware chunk(s) preserving statistical/tabular context.")

    # 4. Initialize embedding model (CUDA with graceful CPU fallback)
    device = get_device()
    print(f"\n[STEP 3/4] Initializing HuggingFaceEmbeddings ('{EMBEDDING_MODEL}') on device: '{device}'...")
    try:
        try:
            from langchain_huggingface import HuggingFaceEmbeddings
        except ImportError:
            from langchain_community.embeddings import HuggingFaceEmbeddings

        embeddings = HuggingFaceEmbeddings(
            model_name=EMBEDDING_MODEL,
            model_kwargs={"device": device},
            encode_kwargs={"normalize_embeddings": True},
        )
    except Exception as exc:
        if device == "cuda":
            print(f"[DEVICE FALLBACK] CUDA initialization failed ({exc}). Falling back to 'cpu'...")
            from langchain_community.embeddings import HuggingFaceEmbeddings
            embeddings = HuggingFaceEmbeddings(
                model_name=EMBEDDING_MODEL,
                model_kwargs={"device": "cpu"},
                encode_kwargs={"normalize_embeddings": True},
            )
        else:
            raise exc

    print(f"[STEP 3/4 COMPLETED] Embedding engine ready on '{device}'.")

    # 5. Persist into ChromaDB
    print(f"\n[STEP 4/4] Embedding chunks and persisting to ChromaDB at '{target_persist_dir}'...")
    try:
        try:
            from langchain_chroma import Chroma
        except ImportError:
            from langchain_community.vectorstores import Chroma

        vectorstore = Chroma.from_documents(
            documents=chunks,
            embedding=embeddings,
            persist_directory=target_persist_dir,
        )
    except Exception as exc:
        print(f"[ERROR] Failed to persist to ChromaDB: {exc}")
        raise exc

    print(f"[STEP 4/4 COMPLETED] Vector store seeded successfully with {len(chunks)} chunks.")
    print("\n" + "=" * 70)
    print(" [INGESTION SUCCESS] Sovereign vector store ready for competency retrieval.")
    print("=" * 70)


if __name__ == "__main__":
    run_ingestion()
