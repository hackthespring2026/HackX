import os
from langchain_community.document_loaders import PyPDFLoader
from config.settings import RAW_DATA_DIR


def load_single_pdf(file_path: str):
    """
    Load a single PDF file and return LangChain Documents.
    Each page becomes a Document with metadata.
    """
    loader = PyPDFLoader(file_path)
    documents = loader.load()
    return documents


def load_all_pdfs():
    """
    Load all PDF files from the raw data directory.
    """
    all_documents = []

    for filename in os.listdir(RAW_DATA_DIR):
        if filename.lower().endswith(".pdf"):
            file_path = os.path.join(RAW_DATA_DIR, filename)
            print(f"Loading PDF: {filename}")

            docs = load_single_pdf(file_path)
            all_documents.extend(docs)

    print(f"Total pages loaded: {len(all_documents)}")
    return all_documents
