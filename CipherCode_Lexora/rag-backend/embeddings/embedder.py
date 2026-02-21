from langchain_community.embeddings import HuggingFaceEmbeddings
from config.settings import EMBEDDING_MODEL_NAME


def get_embedding_model():
    """
    Returns a HuggingFace embedding model.
    """
    embeddings = HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL_NAME
    )
    return embeddings
