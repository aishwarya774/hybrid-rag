from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.services.rag import run_rag_query, stream_rag_query
import json

router = APIRouter()


class ChatRequest(BaseModel):
    query: str
    force_provider: str | None = None   # "ollama" | "openai" | None (auto)
    top_k: int = 5
    model: str | None = None            # optional model override (e.g. "mistral", "tinyllama")


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
            model_override=req.model,
        )
        return ChatResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stream")
async def chat_stream(req: ChatRequest):
    """
    Server-Sent Events endpoint for streaming token-by-token responses.
    
    Event types sent:
      - metadata: { provider, model, routing_reason }
      - token:    { content }
      - sources:  [{ source, page, snippet }, ...]
      - done:     {}
      - error:    { detail }
    """
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    async def event_generator():
        try:
            async for event in stream_rag_query(
                query=req.query,
                force_provider=req.force_provider,
                top_k=req.top_k,
                model_override=req.model,
            ):
                event_type = event["type"]
                data = json.dumps(event["data"])
                yield f"event: {event_type}\ndata: {data}\n\n"
        except Exception as e:
            yield f"event: error\ndata: {json.dumps({'detail': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
