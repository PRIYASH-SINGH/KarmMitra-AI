"""
KarmMitra AI - LTI 1.3 Security & Bhashini DPI FastAPI Gateway Microservice
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.router import lti_router

app = FastAPI(
    title="KarmMitra AI - LTI 1.3 Security Microservice",
    description="Implements LTI 1.3 Advantage (OIDC, Launch, JWKS, AGS Passback) and Bhashini DPI NMT translation",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the LTI 1.3 & DPI router
app.include_router(lti_router)


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy", "service": "lti-security"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
