from retrieval.rag_retriever import retrieve_context
from llm.groq_llm import get_groq_response


def ask_question(question: str):
    print("Retrieving context...")
    context, metadata = retrieve_context(question)

    print("Generating answer...")
    answer = get_groq_response(context, question)

    return answer, metadata
