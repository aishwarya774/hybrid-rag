# app/api/health.py
from fastapi import APIRouter
import httpx
from app.core.config import settings

router = APIRouter()

@router.get("/health")
async def health():
    return {"status": "ok", "service": "hybridrag-backend"}

@router.get("/api/status")
async def full_status():
    ollama_ok = False
    try:
        async with httpx.AsyncClient(timeout=3) as client:
            r = await client.get(f"{settings.ollama_base_url}/api/tags")
            ollama_ok = r.status_code == 200
    except Exception:
        pass

    return {
        "backend": "ok",
        "ollama": "connected" if ollama_ok else "unavailable",
        "openai": "configured" if settings.openai_api_key else "not_configured",
        "default_model": settings.default_local_model,
    }
