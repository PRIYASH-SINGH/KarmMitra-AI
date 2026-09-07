"""
LTI 1.3 Launch Validator & Security Verification Engine
Implements strict signature validation, audience/issuer checks, replay prevention,
and claims extraction for iGOT Karmayogi (KarmMitra AI).
"""

import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, Form, HTTPException, status
from fastapi.responses import RedirectResponse
import jwt
from jwt.exceptions import PyJWTError, ExpiredSignatureError, InvalidSignatureError

from app.core.config import settings
from app.core.security import state_nonce_store, session_store, platform_jwks_cache

logger = logging.getLogger("lti.validator")
router = APIRouter()

# LTI 1.3 Standard Specification Claim URIs
CLAIM_MESSAGE_TYPE = "https://purl.imsglobal.org/spec/lti/claim/message_type"
CLAIM_VERSION = "https://purl.imsglobal.org/spec/lti/claim/version"
CLAIM_ROLES = "https://purl.imsglobal.org/spec/lti/claim/roles"
CLAIM_CUSTOM = "https://purl.imsglobal.org/spec/lti/claim/custom"
CLAIM_AGS_ENDPOINT = "https://purl.imsglobal.org/spec/lti-ags/claim/endpoint"
CLAIM_TARGET_LINK = "https://purl.imsglobal.org/spec/lti/claim/target_link_uri"


def _generic_auth_error(internal_log_msg: str, exc: Optional[Exception] = None) -> HTTPException:
    """
    Log detailed security failure internally for auditing, but return an opaque
    HTTP 401 generic error to avoid leaking validation details to attackers.
    """
    if exc:
        logger.warning("LTI Launch Auth Failure: %s [Exception: %s]", internal_log_msg, exc)
    else:
        logger.warning("LTI Launch Auth Failure: %s", internal_log_msg)
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication failed"
    )


@router.post("/launch", summary="Handle LTI 1.3 Signed POST Launch")
async def lti_launch(
    id_token: str = Form(..., description="Signed RS256 LTI 1.3 id_token from LMS Platform"),
    state: str = Form(..., description="State parameter from initial OIDC initiation")
):
    """
    Step 2 of LTI 1.3 Launch:
    1. Inspect JWT header to obtain 'kid' and verify 'alg' is RS256.
    2. Lookup platform public key from JWKS (fetching/refreshing with rotation support).
    3. Strictly verify RS256 cryptographic signature (NO verify_signature=False in prod).
    4. Validate standard claims: iss, aud, exp.
    5. Validate single-use nonce & state against server-side store (replay protection).
    6. Extract sub, roles, Karmayogi custom claims (frac_role, division, state), and AGS endpoint.
    7. Generate opaque server-side session and redirect to frontend.
    """
    if not id_token or not state:
        raise _generic_auth_error("Missing id_token or state in launch form data")

    # 1. Unverified Header Inspection for Algorithm and Key ID (kid)
    try:
        unverified_header = jwt.get_unverified_header(id_token)
    except Exception as e:
        raise _generic_auth_error("Failed to read JWT header", e)

    alg = unverified_header.get("alg")
    if alg != "RS256":
        raise _generic_auth_error(f"Unsupported algorithm '{alg}'. LTI 1.3 requires RS256.")

    kid = unverified_header.get("kid")
    if not kid:
        raise _generic_auth_error("JWT header is missing 'kid' key identifier")

    # 2. Extract unverified claims to retrieve nonce before signature check
    try:
        unverified_payload = jwt.decode(id_token, options={"verify_signature": False})
    except Exception as e:
        raise _generic_auth_error("Failed to decode token payload", e)

    token_nonce = unverified_payload.get("nonce")
    if not token_nonce:
        raise _generic_auth_error("LTI id_token is missing 'nonce' claim")

    # 3. Replay Protection: Consume state and nonce atomically
    # If the state/nonce was already used or doesn't match, this fails immediately
    consumed_login = state_nonce_store.consume(state=state, nonce=token_nonce)
    if not consumed_login:
        raise _generic_auth_error(f"Invalid, expired, or replayed state/nonce (state={state[:8]}...)")

    # 4. Fetch Platform Public Key (with key rotation support via dynamic reload)
    platform_public_key = await platform_jwks_cache.get_key_by_kid(kid)
    if not platform_public_key:
        raise _generic_auth_error(f"Public key for kid '{kid}' not found in platform JWKS")

    # 5. Cryptographic Signature & Standard Claims Verification
    # Strictly enforce signature verification using PyJWT
    try:
        payload = jwt.decode(
            id_token,
            key=platform_public_key,
            algorithms=["RS256"],
            audience=settings.PLATFORM_CLIENT_ID,
            issuer=settings.PLATFORM_ISSUER,
            options={
                "verify_signature": True,
                "verify_aud": True,
                "verify_iss": True,
                "verify_exp": True,
                "require": ["exp", "iss", "aud", "sub", "nonce"]
            }
        )
    except ExpiredSignatureError as e:
        raise _generic_auth_error("id_token has expired", e)
    except InvalidSignatureError as e:
        raise _generic_auth_error("Invalid cryptographic signature on id_token", e)
    except PyJWTError as e:
        raise _generic_auth_error("JWT claims verification failed", e)
    except Exception as e:
        raise _generic_auth_error("Unexpected error during JWT verification", e)

    # 6. Extract Claims: Subject, Roles, Custom Competency Claims, and AGS Endpoint
    user_sub = payload.get("sub")
    roles = payload.get(CLAIM_ROLES, [])
    custom_claims = payload.get(CLAIM_CUSTOM, {})
    ags_endpoint_claim = payload.get(CLAIM_AGS_ENDPOINT, {})

    # Extract Karmayogi-specific competencies and roles
    # Look in custom claim namespace or top-level fallback
    frac_role = custom_claims.get("frac_role") or payload.get("frac_role")
    division = custom_claims.get("division") or payload.get("division")
    gov_state = custom_claims.get("state") or payload.get("state")

    # Extract AGS Lineitem URL and Scopes for Grade Passback
    lineitem = ags_endpoint_claim.get("lineitem")
    lineitems = ags_endpoint_claim.get("lineitems")
    ags_scopes = ags_endpoint_claim.get("scope", [])

    launch_data = {
        "sub": user_sub,
        "roles": roles,
        "custom": {
            "frac_role": frac_role,
            "division": division,
            "state": gov_state,
            **custom_claims
        },
        "ags": {
            "lineitem": lineitem,
            "lineitems": lineitems,
            "scopes": ags_scopes
        },
        "login_context": consumed_login,
        "claims": payload
    }

    # 7. Create Opaque Server-Side Session
    # Store claims server-side; do NOT leak sub/role/lineitem in plaintext query params!
    session_id = session_store.create_session(launch_data)
    logger.info(
        "Successful LTI Launch for sub=%s, frac_role=%s, division=%s. Opaque session=%s...",
        user_sub, frac_role, division, session_id[:8]
    )

    # Redirect user to frontend with only the opaque session reference
    redirect_target = f"{settings.FRONTEND_URL}?session_id={session_id}"
    return RedirectResponse(url=redirect_target, status_code=status.HTTP_303_SEE_OTHER)
