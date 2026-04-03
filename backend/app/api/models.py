from fastapi import APIRouter, HTTPException
import httpx
from app.core.config import settings

router = APIRouter()


@router.get("/")
async def list_models():
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(f"{settings.ollama_base_url}/api/tags")
            data = r.json()
            models = [m["name"] for m in data.get("models", [])]
            return {
                "local_models": models,
                "openai_available": bool(settings.openai_api_key),
                "openai_models": ["gpt-4o-mini", "gpt-4o"] if settings.openai_api_key else [],
            }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Ollama unreachable: {e}")
