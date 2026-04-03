from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.rag import run_rag_query

router = APIRouter()


class ChatRequest(BaseModel):
    query: str
    force_provider: str | None = None   # "ollama" | "openai" | None (auto)
    top_k: int = 5


class ChatResponse(BaseModel):
    answer: str
    provider: str
    routing_reason: str
    model: str
    sources: list[dict]


@router.post("/", response_model=ChatResponse)
async def chat(req: ChatRequest):
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    try:
        result = await run_rag_query(
            query=req.query,
            force_provider=req.force_provider,
            top_k=req.top_k,
        )
        return ChatResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
