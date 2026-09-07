"""
LTI 1.3 Security & DPI Master Router
Aggregates OIDC authentication, launch validation, JWKS, AGS passback, and Bhashini services.
Mountable directly onto any FastAPI gateway application via:
    app.include_router(lti_router)
"""

import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status, Path, Query
from pydantic import BaseModel, Field

from app.lti.oidc import router as oidc_router
from app.lti.validator import router as validator_router
from app.lti.ags import ags_client, ScoreSubmission, AGSResult
from app.services.bhashini import bhashini_service, TranslationRequest, TranslationResponse
from app.core.security import session_store

logger = logging.getLogger("lti.router")

lti_router = APIRouter(prefix="/lti", tags=["LTI 1.3 & DPI"])

# Mount sub-routers:
# /lti/login, /lti/jwks.json
lti_router.include_router(oidc_router)
# /lti/launch
lti_router.include_router(validator_router)


class GradePassbackRequest(BaseModel):
    """Payload to trigger AGS grade submission from competency engine."""
    lineitem_url: str = Field(..., description="Target lineitem URL from the LTI launch AGS claim")
    score: ScoreSubmission


@lti_router.post(
    "/grade",
    response_model=AGSResult,
    summary="Submit Score via LTI 1.3 Assignment and Grade Services"
)
async def passback_grade(request: GradePassbackRequest):
    """
    Submits a learner score to the platform AGS lineitem with signed client assertion,
    token caching, idempotency deduplication, and structured status reporting.
    """
    result = await ags_client.submit_score(
        lineitem_url=request.lineitem_url,
        score=request.score
    )
    if not result.success:
        logger.warning("Grade passback failed: %s", result.message)
    return result


@lti_router.post(
    "/translate",
    response_model=TranslationResponse,
    summary="Translate Text via Bhashini DPI NMT"
)
async def translate_text_endpoint(request: TranslationRequest):
    """
    Translates UI strings, question text, or competency descriptions using Bhashini NMT.
    Features LRU caching and resilient fallback to source text if downstream API fails.
    """
    return await bhashini_service.translate_text(
        text=request.text,
        source_lang=request.source_language,
        target_lang=request.target_language
    )


@lti_router.get(
    "/session/{session_id}",
    summary="Retrieve Authenticated LTI Session Data"
)
async def get_session_data(
    session_id: str = Path(..., description="Opaque session identifier returned in launch redirect")
) -> Dict[str, Any]:
    """
    Allows the frontend application to exchange the opaque session ID for the user's
    claims (sub, Karmayogi role, division, state, and AGS lineitems) without exposing
    them in URL query parameters.
    """
    session_data = session_store.get_session(session_id)
    if not session_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or expired"
        )
    return session_data
