from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Ollama
    ollama_base_url: str = "http://ollama:11434"
    default_local_model: str = "llama3.1"
    default_embed_model: str = "nomic-embed-text"

    # OpenAI
    openai_api_key: str = ""

    # ChromaDB
    chroma_host: str = "chromadb"
    chroma_port: int = 8000
    chroma_token: str = "hybridrag-secret"
    chroma_collection: str = "documents"

    # Router thresholds
    complexity_threshold: float = 0.7
    local_max_tokens: int = 2048

    # Misc
    log_level: str = "info"
    upload_dir: str = "/app/data/uploads"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
