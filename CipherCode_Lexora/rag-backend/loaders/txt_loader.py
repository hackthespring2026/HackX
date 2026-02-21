import os
from langchain_community.document_loaders import TextLoader
from config.settings import RAW_DATA_DIR


def load_single_txt(file_path: str):
    """
    Load a single TXT file and return LangChain Documents.
    """
    loader = TextLoader(file_path, encoding='utf-8')
    documents = loader.load()
    return documents


def load_all_txts():
    """
    Load all TXT files from the raw data directory.
    """
    all_documents = []

    for filename in os.listdir(RAW_DATA_DIR):
        if filename.lower().endswith(".txt"):
            file_path = os.path.join(RAW_DATA_DIR, filename)
            print(f"Loading TXT: {filename}")

            docs = load_single_txt(file_path)
            all_documents.extend(docs)

    print(f"Total TXT documents loaded: {len(all_documents)}")
    return all_documents
