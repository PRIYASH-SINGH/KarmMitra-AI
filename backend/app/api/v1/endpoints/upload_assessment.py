import os
import io
import httpx
from pypdf import PdfReader
from fastapi import APIRouter, File, UploadFile, HTTPException
from app.schemas.assessment import AssessmentGenerateOut

router = APIRouter()

# Max file size in bytes (5MB)
MAX_FILE_SIZE = 5 * 1024 * 1024
# Truncate text to 4000 chars
MAX_TEXT_LEN = 4000

@router.post("/generate-from-upload", response_model=AssessmentGenerateOut)
async def generate_from_upload(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    # Read file into memory buffer to check size
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds the 5MB limit.")
        
    try:
        # Extract text using pypdf
        reader = PdfReader(io.BytesIO(file_bytes))
        extracted_text = ""
        for page in reader.pages:
            extracted_text += page.extract_text() + "\n"
            if len(extracted_text) > MAX_TEXT_LEN:
                break
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {str(e)}")
        
    # Free memory buffer immediately before generation
    del file_bytes
    
    extracted_text = extracted_text[:MAX_TEXT_LEN].strip()
    if not extracted_text:
        raise HTTPException(status_code=400, detail="Could not extract readable text from PDF.")
        
    rag_api = "http://localhost:8000/api/v1/rag/generate-from-text"
    try:
        async with httpx.AsyncClient(timeout=180.0) as client:
            res = await client.post(
                rag_api, 
                json={
                    "context": extracted_text,
                    "competency_name": "Uploaded Document",
                    "competency_code": "UPLOAD",
                    "question_count": 3
                }
            )
            res.raise_for_status()
            data = res.json()
            questions = data.get("questions", [])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate questions: {str(e)}")
        
    return AssessmentGenerateOut(questions=questions)
