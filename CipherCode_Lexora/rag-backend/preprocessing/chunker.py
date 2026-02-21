from langchain_text_splitters import RecursiveCharacterTextSplitter
from config.settings import CHUNK_SIZE, CHUNK_OVERLAP


def chunk_documents(documents):
    """
    Split documents into semantically meaningful chunks.
    Preserves metadata like source and page number.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", " ", ""]
    )

    chunked_docs = splitter.split_documents(documents)

    print(f"Total chunks created: {len(chunked_docs)}")
    return chunked_docs
