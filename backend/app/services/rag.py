from langchain_community.llms import Ollama
from langchain_openai import ChatOpenAI
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from app.core.config import settings
from app.core.vectorstore import get_vectorstore
from app.services.router import LLMProvider, route_query


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


async def run_rag_query(
    query: str,
    force_provider: str | None = None,
    top_k: int = 5,
) -> dict:
    provider, reason = route_query(query, force_provider)
    vectorstore = get_vectorstore()
    retriever = vectorstore.as_retriever(search_kwargs={"k": top_k})

    # Build LLM based on routing decision
    if provider == LLMProvider.OPENAI:
        llm = ChatOpenAI(
            model="gpt-4o-mini",
            api_key=settings.openai_api_key,
            temperature=0.1,
        )
    else:
        llm = Ollama(
            base_url=settings.ollama_base_url,
            model=settings.default_local_model,
            temperature=0.1,
        )

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
        "model": "gpt-4o-mini" if provider == LLMProvider.OPENAI else settings.default_local_model,
    }
