from groq import Groq
from config.settings import GROQ_API_KEY

client = Groq(api_key=GROQ_API_KEY)


def get_groq_response(context: str, question: str):
    """
    Generate answer from Groq LLM using retrieved context.
    """

    prompt = f"""
        You are LexoraAI, an intelligent AI assistant for policy and document assistance.
        Answer the question ONLY using the context below.
        If the answer is not in the context, say "I don't have that information right now ".

        Context:
            {context}

        Question:
            {question}
        """

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {"role": "user", "content": prompt}
        ],
        temperature=0.2
    )

    return response.choices[0].message.content


def get_groq_summary(text: str):
    """
    Generate section-wise summary using Groq LLM.
    """

    prompt = f"""
        You are LexoraAI, an intelligent AI assistant for policy and document assistance.
        Please provide a section-wise summary of the following document.
        Highlight key policies like leave, attendance, or any rules.
        Format your response clearly using markdown headings and bullet points.

        Document:
            {text}
        """

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {"role": "user", "content": prompt}
        ],
        temperature=0.3
    )

    return response.choices[0].message.content
