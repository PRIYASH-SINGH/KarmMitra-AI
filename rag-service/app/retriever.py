"""
Competency-Aware Semantic Retriever for KarmMitra AI.
Performs similarity search against persistent ChromaDB vector store,
with metadata filtering/boosting by competency domain (Functional / Behavioural / Domain).
"""

from typing import Any, List, Optional

try:
    from langchain_core.documents import Document
except ImportError:
    try:
        from langchain.docstore.document import Document
    except ImportError:
        class Document:  # type: ignore
            def __init__(self, page_content: str, metadata: Optional[dict] = None):
                self.page_content = page_content
                self.metadata = metadata or {}

            def __repr__(self):
                return f"Document(page_content={self.page_content[:50]!r}, metadata={self.metadata})"


class CompetencyRetriever:
    """
    Retriever wrapping Chroma vector store with KCM competency domain filtering.
    """

    def __init__(self, vectorstore: Any):
        self.vectorstore = vectorstore

    def retrieve(
        self,
        query: str,
        top_k: int = 4,
        domain: Optional[str] = None,
    ) -> List[Document]:
        """
        Runs similarity search against ChromaDB.
        Applies metadata filter for domain ('Functional', 'Behavioural', 'Domain')
        if available; falls back to unconstrained search if domain filter yields no results.
        """
        filter_dict = None
        if domain:
            filter_dict = {"domain": domain.strip().capitalize()}

        try:
            if filter_dict and hasattr(self.vectorstore, "similarity_search"):
                results = self.vectorstore.similarity_search(query, k=top_k, filter=filter_dict)
                if results:
                    return results
        except Exception:
            pass

        if hasattr(self.vectorstore, "similarity_search"):
            return self.vectorstore.similarity_search(query, k=top_k)
        return []


def retrieve_competency_chunks(
    vectorstore: Any,
    query: str,
    top_k: int = 4,
    domain: Optional[str] = None,
) -> List[Document]:
    """
    Functional helper to retrieve top-k document chunks for a competency query.
    """
    retriever = CompetencyRetriever(vectorstore)
    return retriever.retrieve(query=query, top_k=top_k, domain=domain)
