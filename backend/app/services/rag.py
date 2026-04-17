from langchain_community.llms import Ollama
from langchain_openai import ChatOpenAI
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from langchain.callbacks import AsyncIteratorCallbackHandler
from app.core.config import settings
from app.core.vectorstore import get_vectorstore
from app.services.router import LLMProvider, route_query
import asyncio


RAG_PROMPT = PromptTemplate(
    input_variables=["context", "question"],
    template="""You are a helpful AI assistant with access to a knowledge base.
Use the following retrieved context to answer the question accurately.
If the context doesn't contain enough information, say so honestly.

Context:
{context}

Question: {question}

Answer:""",
)


def _resolve_model(provider: LLMProvider, model_override: str | None) -> str:
    """Determine which model to use based on provider and optional override."""
    if provider == LLMProvider.OPENAI:
        return model_override if model_override and model_override.startswith("gpt") else "gpt-4o-mini"
    # For Ollama, allow any model override
    return model_override or settings.default_local_model


def _build_llm(provider: LLMProvider, model: str, callback_handler=None):
    """Build the appropriate LLM instance."""
    if provider == LLMProvider.OPENAI:
        kwargs = dict(
            model=model,
            api_key=settings.openai_api_key,
            temperature=0.1,
            streaming=callback_handler is not None,
        )
        if callback_handler:
            kwargs["callbacks"] = [callback_handler]
        return ChatOpenAI(**kwargs)
    else:
        kwargs = dict(
            base_url=settings.ollama_base_url,
            model=model,
            temperature=0.1,
        )
        if callback_handler:
            kwargs["callbacks"] = [callback_handler]
        return Ollama(**kwargs)


async def run_rag_query(
    query: str,
    force_provider: str | None = None,
    top_k: int = 5,
    model_override: str | None = None,
) -> dict:
    provider, reason = route_query(query, force_provider)
    model = _resolve_model(provider, model_override)
    vectorstore = get_vectorstore()
    retriever = vectorstore.as_retriever(search_kwargs={"k": top_k})

    llm = _build_llm(provider, model)

    chain = RetrievalQA.from_chain_type(
        llm=llm,
        retriever=retriever,
        chain_type="stuff",
        chain_type_kwargs={"prompt": RAG_PROMPT},
        return_source_documents=True,
    )

    result = await chain.ainvoke({"query": query})

    sources = [
        {
            "source": doc.metadata.get("source", "unknown"),
            "page": doc.metadata.get("page", 0),
            "snippet": doc.page_content[:200],
        }
        for doc in result.get("source_documents", [])
    ]

    return {
        "answer": result["result"],
        "provider": provider.value,
        "routing_reason": reason,
        "sources": sources,
        "model": model,
    }


async def stream_rag_query(
    query: str,
    force_provider: str | None = None,
    top_k: int = 5,
    model_override: str | None = None,
):
    """
    Async generator that yields SSE events:
      { type: "metadata", data: { provider, model, routing_reason } }
      { type: "token",    data: { content } }
      { type: "sources",  data: [...] }
      { type: "done",     data: {} }
    """
    provider, reason = route_query(query, force_provider)
    model = _resolve_model(provider, model_override)

    # Send metadata first
    yield {
        "type": "metadata",
        "data": {
            "provider": provider.value,
            "model": model,
            "routing_reason": reason,
        },
    }

    vectorstore = get_vectorstore()
    retriever = vectorstore.as_retriever(search_kwargs={"k": top_k})

    # Retrieve source documents first
    docs = await retriever.ainvoke(query)
    sources = [
        {
            "source": doc.metadata.get("source", "unknown"),
            "page": doc.metadata.get("page", 0),
            "snippet": doc.page_content[:200],
        }
        for doc in docs
    ]

    # Build context string from retrieved docs
    context = "\n\n".join(doc.page_content for doc in docs)
    formatted_prompt = RAG_PROMPT.format(context=context, question=query)

    # Stream tokens using callback handler
    callback = AsyncIteratorCallbackHandler()
    llm = _build_llm(provider, model, callback_handler=callback)

    # Run the LLM in a background task so we can iterate tokens
    async def run_llm():
        try:
            if provider == LLMProvider.OPENAI:
                await llm.ainvoke(formatted_prompt)
            else:
                await llm.ainvoke(formatted_prompt)
        except Exception as e:
            callback.done.set()
            raise e
        finally:
            callback.done.set()

    task = asyncio.create_task(run_llm())

    # Yield tokens as they arrive
    async for token in callback.aiter():
        yield {
            "type": "token",
            "data": {"content": token},
        }

    await task  # ensure task completes / propagates errors

    # Send sources after the answer
    yield {
        "type": "sources",
        "data": sources,
    }

    yield {
        "type": "done",
        "data": {},
    }
