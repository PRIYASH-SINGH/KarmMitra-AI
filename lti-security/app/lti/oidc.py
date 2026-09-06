"""
LTI 1.3 OIDC Login Initiation & Tool JWKS Handler
Compliant with IMS Global LTI 1.3 Security Specification.
"""

import urllib.parse
import logging
from typing import Optional
from fastapi import APIRouter, Request, HTTPException, status, Query
from fastapi.responses import RedirectResponse, JSONResponse

from app.core.config import settings
from app.core.security import state_nonce_store, KeyManager

logger = logging.getLogger("lti.oidc")
router = APIRouter()


@router.get("/login", summary="Initiate LTI 1.3 OIDC Login Flow")
async def lti_login(
    request: Request,
    iss: str = Query(..., description="Issuer identifier of the LMS Platform"),
    login_hint: str = Query(..., description="Opaque platform user identifier"),
    target_link_uri: str = Query(..., description="Final destination URL for the tool launch"),
    lti_message_hint: Optional[str] = Query(None, description="Optional platform message context hint"),
    client_id: Optional[str] = Query(None, description="Optional client ID passed during launch initiation")
):
    """
    Step 1 of LTI 1.3 Launch:
    1. Validate that the platform issuer (iss) strictly matches PLATFORM_ISSUER.
    2. Generate cryptographically random, unpredictable 'state' and 'nonce'.
    3. Persist state and nonce server-side to guarantee single-use replay protection.
    4. Issue an HTTP 302 Redirect to the platform's OIDC authorization endpoint.
    """
    # Security Check: Reject unfamiliar issuers immediately
    if iss.rstrip("/") != settings.PLATFORM_ISSUER.rstrip("/"):
        logger.warning("Rejected login initiation from unauthorized issuer: %s", iss)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unrecognized platform issuer"
        )

    # Optional Client ID check if provided by the platform
    if client_id and client_id != settings.PLATFORM_CLIENT_ID:
        logger.warning("Client ID mismatch: expected %s, got %s", settings.PLATFORM_CLIENT_ID, client_id)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Client ID mismatch"
        )

    # Generate cryptographically secure state and nonce (Never hardcode nonces!)
    state, nonce = state_nonce_store.generate_and_save(
        login_hint=login_hint,
        target_link_uri=target_link_uri,
        lti_message_hint=lti_message_hint
    )
    logger.info("Generated login state and nonce for login_hint=%s", login_hint)

    # Construct the redirect URI pointing back to this tool's launch endpoint
    launch_redirect_uri = f"{settings.TOOL_HOST.rstrip('/')}/lti/launch"

    # Build authentication request query parameters according to IMS Global spec
    params = {
        "response_type": "id_token",
        "scope": "openid",
        "client_id": settings.PLATFORM_CLIENT_ID,
        "redirect_uri": launch_redirect_uri,
        "login_hint": login_hint,
        "state": state,
        "nonce": nonce,
        "prompt": "none",
        "response_mode": "form_post"
    }

    if lti_message_hint:
        params["lti_message_hint"] = lti_message_hint

    auth_url = f"{settings.PLATFORM_AUTH_URL}?{urllib.parse.urlencode(params)}"
    logger.debug("Redirecting browser to platform auth endpoint: %s", auth_url)

    # Return 302 Found redirect to LMS platform auth endpoint
    return RedirectResponse(url=auth_url, status_code=status.HTTP_302_FOUND)


@router.get("/jwks.json", summary="LTI 1.3 Tool Public Key Set (JWKS)")
async def get_tool_jwks():
    """
    Returns this tool's public key formatted as an RFC 7517 compliant JWKS.
    The LMS platform retrieves this to verify digital signatures on tokens
    and grade passback assertions produced by this tool.
    """
    jwk = KeyManager.get_tool_jwk()
    return JSONResponse(
        content={"keys": [jwk]},
        headers={"Cache-Control": "public, max-age=3600"}
    )
