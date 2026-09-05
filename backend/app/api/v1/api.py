from fastapi import APIRouter

from app.api.v1.endpoints import triage, pathways, assessment, admin, lti_passback

# INTENT: The master router that aggregates all v1 endpoints.
# Included directly by main.py (`app.include_router(api_router, prefix="/api/v1")`)

api_router = APIRouter()

api_router.include_router(triage.router, prefix="/triage", tags=["Baseline Triage"])
api_router.include_router(pathways.router, prefix="/pathways", tags=["70:20:10 Pathways"])
api_router.include_router(assessment.router, prefix="/assessment", tags=["RAG Assessment"])
api_router.include_router(admin.router, prefix="/admin", tags=["Dashboard Analytics"])
api_router.include_router(lti_passback.router, prefix="/lti-passback", tags=["LTI 1.3"])
