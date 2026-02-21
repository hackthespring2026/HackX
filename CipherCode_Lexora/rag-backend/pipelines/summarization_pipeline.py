from loaders.pdf_loader import load_all_pdfs
from loaders.txt_loader import load_all_txts
from llm.groq_llm import get_groq_summary


def summarize_documents():
    print("Generating summary...")

    # Load all documents
    pdf_documents = load_all_pdfs()
    txt_documents = load_all_txts()
    documents = pdf_documents + txt_documents

    if not documents:
        return "No documents found to summarize."

    # Extract text from all documents
    full_text = "\n\n".join([doc.page_content for doc in documents])

    # Ensure we don't exceed token limits by taking a reasonable chunk for the summary if it's too large.
    # A character limit around 30,000 to 50,000 is safe for many small LLMs, let's limit it to 40,000 for safety.
    max_chars = 40000
    if len(full_text) > max_chars:
        full_text = full_text[:max_chars] + "... [Text truncated due to length limits]"

    summary = get_groq_summary(full_text)

    return summary
