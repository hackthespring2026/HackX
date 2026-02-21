import os
from langchain_community.vectorstores import FAISS
from embeddings.embedder import get_embedding_model
from config.settings import VECTOR_DB_DIR


def build_faiss_index(documents):
    """
    Build a FAISS index from chunked documents.
    """
    embeddings = get_embedding_model()

    print("Creating FAISS index...")
    db = FAISS.from_documents(documents, embeddings)

    return db


def add_documents_to_index(db, documents):
    """
    Add new documents to an existing FAISS index.
    
    WHY THIS FUNCTION:
    - Part of incremental indexing strategy
    - Allows adding new chunks to existing index without full rebuild
    - Preserves previously indexed data while expanding the searchable corpus
    - Dramatically improves performance when frequently uploading new documents
    """
    print(f"Adding {len(documents)} new document chunks to index...")
    db.add_documents(documents)
    return db


def save_faiss_index(db):
    """
    Save FAISS index to disk.
    """
    os.makedirs(VECTOR_DB_DIR, exist_ok=True)
    db.save_local(VECTOR_DB_DIR)
    print(f"FAISS index saved at: {VECTOR_DB_DIR}")


def load_faiss_index():
    """
    Load FAISS index from disk.
    """
    embeddings = get_embedding_model()
    return FAISS.load_local(
        VECTOR_DB_DIR,
        embeddings,
        allow_dangerous_deserialization=True
    )
