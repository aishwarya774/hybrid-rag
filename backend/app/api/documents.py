import os, shutil
from fastapi import APIRouter, UploadFile, File, HTTPException
from pathlib import Path
from app.core.config import settings
from app.services.ingestion import ingest_file, list_documents, delete_document, SUPPORTED_EXTENSIONS

router = APIRouter()


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    ext = Path(file.filename).suffix.lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {ext}. Allowed: {SUPPORTED_EXTENSIONS}",
        )
    dest = Path(settings.upload_dir) / file.filename
    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)
    result = await ingest_file(str(dest), file.filename)
    return result


@router.get("/")
async def list_docs():
    return await list_documents()


@router.delete("/{filename}")
async def delete_doc(filename: str):
    ok = await delete_document(filename)
    if not ok:
        raise HTTPException(status_code=404, detail="File not found")
    return {"deleted": filename}
