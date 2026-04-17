"""
Models API — lists available Ollama models and allows switching.
"""
from fastapi import APIRouter
from app.core.config import settings
import httpx

router = APIRouter()


@router.get("/")
async def list_models():
    """
    Returns available local models from Ollama and the current default.
    """
    ollama_models = []
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(f"{settings.ollama_base_url}/api/tags")
            if resp.status_code == 200:
                data = resp.json()
                for m in data.get("models", []):
                    name = m.get("name", "")
                    size_bytes = m.get("size", 0)
                    size_gb = round(size_bytes / (1024**3), 1) if size_bytes else 0
                    ollama_models.append({
                        "name": name,
                        "size_gb": size_gb,
                        "modified": m.get("modified_at", ""),
                        "family": m.get("details", {}).get("family", "unknown"),
                        "parameter_size": m.get("details", {}).get("parameter_size", ""),
                    })
    except Exception:
        pass  # Ollama not reachable — return empty list

    # OpenAI models (static list — only available if key is set)
    openai_models = []
    if settings.openai_api_key:
        openai_models = [
            {"name": "gpt-4o-mini", "provider": "openai"},
            {"name": "gpt-4o", "provider": "openai"},
        ]

    return {
        "default_model": settings.default_local_model,
        "ollama_models": ollama_models,
        "openai_models": openai_models,
    }
