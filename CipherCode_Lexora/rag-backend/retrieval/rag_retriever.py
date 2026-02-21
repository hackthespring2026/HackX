from vectorstore.faiss_store import load_faiss_index


def retrieve_context(query: str, k: int = 3):
    db = load_faiss_index()
    results = db.similarity_search(query, k=k)

    context = "\n\n".join(doc.page_content for doc in results)
    metadata = [doc.metadata for doc in results]

    return context, metadata
