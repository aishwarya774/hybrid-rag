import os
from pathlib import Path
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader, TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from app.core.vectorstore import get_vectorstore
from app.core.config import settings


SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".txt", ".md"}

splitter = RecursiveCharacterTextSplitter(
    chunk_size=512,
    chunk_overlap=64,
    length_function=len,
)


def get_loader(file_path: str):
    ext = Path(file_path).suffix.lower()
    if ext == ".pdf":
        return PyPDFLoader(file_path)
    elif ext == ".docx":
        return Docx2txtLoader(file_path)
    elif ext in (".txt", ".md"):
        return TextLoader(file_path, encoding="utf-8")
    raise ValueError(f"Unsupported file type: {ext}")


async def ingest_file(file_path: str, filename: str) -> dict:
    loader = get_loader(file_path)
    documents = loader.load()

    # Tag metadata
    for doc in documents:
        doc.metadata["source"] = filename
        doc.metadata["file_path"] = file_path

    chunks = splitter.split_documents(documents)
    vectorstore = get_vectorstore()
    vectorstore.add_documents(chunks)

    return {
        "filename": filename,
        "pages": len(documents),
        "chunks": len(chunks),
        "status": "ingested",
    }


async def list_documents() -> list[dict]:
    upload_dir = Path(settings.upload_dir)
    files = []
    for f in upload_dir.iterdir():
        if f.suffix.lower() in SUPPORTED_EXTENSIONS:
            files.append({
                "name": f.name,
                "size_kb": round(f.stat().st_size / 1024, 1),
                "type": f.suffix[1:].upper(),
            })
    return files


async def delete_document(filename: str) -> bool:
    file_path = Path(settings.upload_dir) / filename
    if file_path.exists():
        file_path.unlink()
        # Note: also remove from vectorstore in production
        return True
    return False
