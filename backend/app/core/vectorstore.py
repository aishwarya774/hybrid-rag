import chromadb
from chromadb.config import Settings as ChromaSettings
from langchain_chroma import Chroma
from langchain_community.embeddings import OllamaEmbeddings
from app.core.config import settings

_vectorstore = None


async def init_vectorstore():
    global _vectorstore
    client = chromadb.HttpClient(
        host=settings.chroma_host,
        port=settings.chroma_port,
        settings=ChromaSettings(
            chroma_client_auth_provider="chromadb.auth.token.TokenAuthClientProvider",
            chroma_client_auth_credentials=settings.chroma_token,
        ),
    )
    embeddings = OllamaEmbeddings(
        base_url=settings.ollama_base_url,
        model=settings.default_embed_model,
    )
    _vectorstore = Chroma(
        client=client,
        collection_name=settings.chroma_collection,
        embedding_function=embeddings,
    )
    return _vectorstore


def get_vectorstore() -> Chroma:
    if _vectorstore is None:
        raise RuntimeError("Vector store not initialized")
    return _vectorstore
