from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api import chat, documents, models, health
from app.core.config import settings
from app.core.vectorstore import init_vectorstore


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_vectorstore()
    yield
    # Shutdown (cleanup if needed)


app = FastAPI(
    title="HybridRAG API",
    description="Local Ollama + OpenAI RAG engine",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["Health"])
app.include_router(chat.router,      prefix="/api/chat",      tags=["Chat"])
app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
app.include_router(models.router,    prefix="/api/models",    tags=["Models"])
