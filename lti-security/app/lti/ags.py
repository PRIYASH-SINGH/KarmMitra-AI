"""
LTI 1.3 Assignment and Grade Services (AGS) Passback Client
Implements OAuth 2.0 client-credentials exchange via signed client assertions (RS256),
token caching, idempotent grade submission, and robust error handling.
"""

import time
import uuid
import logging
import hashlib
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from threading import Lock
from pydantic import BaseModel, Field
import httpx
import jwt

from app.core.config import settings
from app.core.security import KeyManager

logger = logging.getLogger("lti.ags")

# IMS AGS Scopes & Content Types
SCOPE_AGS_SCORE = "https://purl.imsglobal.org/spec/lti-ags/scope/score"
SCOPE_AGS_LINEITEM = "https://purl.imsglobal.org/spec/lti-ags/scope/lineitem"
CONTENT_TYPE_SCORE = "application/vnd.ims.lis.v1.score+json"


class ScoreSubmission(BaseModel):
    """LTI 1.3 AGS Score payload model according to IMS LIS Score schema."""
    userId: str = Field(..., description="Platform user subject identifier (sub)")
    scoreGiven: float = Field(..., ge=0.0, description="Actual score attained by the learner")
    scoreMaximum: float = Field(..., gt=0.0, description="Maximum possible score for the activity")
    comment: Optional[str] = Field(None, description="Optional evaluative comment or feedback")
    activityProgress: str = Field(
        default="Completed",
        description="Initialized, Started, InProgress, Submitted, or Completed"
    )
    gradingProgress: str = Field(
        default="FullyGraded",
        description="FullyGraded, Pending, PendingManual, Failed, or NotReady"
    )
    timestamp: Optional[str] = Field(
        None,
        description="ISO 8601 UTC timestamp of the grading event"
    )


class AGSResult(BaseModel):
    """Structured, typed response from grade passback operations."""
    success: bool
    status_code: Optional[int] = None
    message: str
    dedupe_key: Optional[str] = None
    idempotent_replay: bool = False


class AGSClient:
    """
    Client for interacting with LMS Platform Assignment and Grade Services.
    Handles signed client-assertion OAuth 2.0 token exchange and grade submission.
    """

    def __init__(self):
        self._cached_token: Optional[str] = None
        self._token_expires_at: float = 0.0
        self._token_lock = Lock()
        # Idempotency deduplication store: dedupe_key -> submission timestamp
        self._idempotency_store: Dict[str, float] = {}
        self._store_lock = Lock()

    def generate_client_assertion(self) -> str:
        """
        Create a signed RS256 client-assertion JWT according to IMS Security Framework.
        Includes iss, sub, aud, exp, iat, jti, signed with this tool's private key.
        """
        now = int(time.time())
        claims = {
            "iss": settings.PLATFORM_CLIENT_ID,
            "sub": settings.PLATFORM_CLIENT_ID,
            "aud": settings.PLATFORM_TOKEN_URL,
            "iat": now,
            "exp": now + 300,  # 5 minutes validity
            "jti": str(uuid.uuid4())
        }
        headers = {
            "kid": settings.TOOL_KEY_ID,
            "alg": "RS256",
            "typ": "JWT"
        }
        private_key = KeyManager.get_private_key()
        return jwt.encode(claims, private_key, algorithm="RS256", headers=headers)

    async def get_access_token(self, force_refresh: bool = False) -> str:
        """
        Obtain OAuth 2.0 access token via client-assertion exchange with PLATFORM_TOKEN_URL.
        Caches the token until 60 seconds before expiration.
        """
        now = time.time()
        with self._token_lock:
            if not force_refresh and self._cached_token and now < (self._token_expires_at - 60):
                return self._cached_token

        # Generate signed client-assertion (never hardcoded mock bearer tokens in production)
        assertion = self.generate_client_assertion()
        data = {
            "grant_type": "client_credentials",
            "client_assertion_type": "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
            "client_assertion": assertion,
            "scope": f"{SCOPE_AGS_SCORE} {SCOPE_AGS_LINEITEM}"
        }

        logger.info("Requesting AGS access token from %s", settings.PLATFORM_TOKEN_URL)
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                settings.PLATFORM_TOKEN_URL,
                data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            if resp.status_code != 200:
                logger.error("Token exchange failed with status %d: %s", resp.status_code, resp.text)
                raise RuntimeError(f"AGS OAuth2 token request failed: {resp.status_code}")

            token_data = resp.json()
            access_token = token_data.get("access_token")
            expires_in = token_data.get("expires_in", 3600)

            with self._token_lock:
                self._cached_token = access_token
                self._token_expires_at = time.time() + float(expires_in)
                logger.info("Successfully acquired and cached AGS access token (expires in %ds)", expires_in)
                return access_token

    def _compute_dedupe_key(self, lineitem_url: str, score: ScoreSubmission) -> str:
        """Compute an idempotent fingerprint for the grade submission."""
        raw = f"{lineitem_url}:{score.userId}:{score.scoreGiven:.2f}:{score.scoreMaximum:.2f}:{score.activityProgress}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    async def submit_score(
        self,
        lineitem_url: str,
        score: ScoreSubmission,
        dedupe_ttl_seconds: float = 300.0
    ) -> AGSResult:
        """
        Submit grade to {lineitem}/scores idempotently.
        Prevents duplicate posting within dedupe window and returns a typed AGSResult.
        """
        # Ensure timestamp is set
        if not score.timestamp:
            score.timestamp = datetime.now(timezone.utc).isoformat()

        # Idempotency check: detect and prevent double posting
        dedupe_key = self._compute_dedupe_key(lineitem_url, score)
        now = time.time()
        with self._store_lock:
            # Purge entries older than dedupe_ttl
            expired = [k for k, v in self._idempotency_store.items() if now - v > dedupe_ttl_seconds]
            for k in expired:
                del self._idempotency_store[k]

            if dedupe_key in self._idempotency_store:
                logger.info("Idempotent grade passback detected; skipping duplicate post for key=%s", dedupe_key[:8])
                return AGSResult(
                    success=True,
                    status_code=200,
                    message="Grade already submitted (idempotent duplicate avoided)",
                    dedupe_key=dedupe_key,
                    idempotent_replay=True
                )

        # Normalize lineitem score endpoint: ensure it points to {lineitem}/scores
        scores_endpoint = lineitem_url.rstrip("/")
        if not scores_endpoint.endswith("/scores"):
            scores_endpoint = f"{scores_endpoint}/scores"

        # Prepare payload
        payload = score.model_dump(exclude_none=True)

        try:
            token = await self.get_access_token()
        except Exception as err:
            logger.error("Failed to acquire token for AGS passback: %s", err)
            return AGSResult(
                success=False,
                status_code=None,
                message=f"Failed to obtain OAuth2 token: {err}",
                dedupe_key=dedupe_key
            )

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": CONTENT_TYPE_SCORE
        }

        try:
            logger.info("Posting score to %s for user %s (score: %s/%s)",
                        scores_endpoint, score.userId, score.scoreGiven, score.scoreMaximum)
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(scores_endpoint, json=payload, headers=headers)

                if 200 <= resp.status_code < 300:
                    with self._store_lock:
                        self._idempotency_store[dedupe_key] = time.time()
                    logger.info("Score successfully posted (status: %d)", resp.status_code)
                    return AGSResult(
                        success=True,
                        status_code=resp.status_code,
                        message="Score submitted successfully",
                        dedupe_key=dedupe_key
                    )
                elif resp.status_code == 401:
                    # Token might have been revoked; force refresh and try once more
                    logger.warning("AGS submission returned 401; refreshing token and retrying once")
                    token = await self.get_access_token(force_refresh=True)
                    headers["Authorization"] = f"Bearer {token}"
                    retry_resp = await client.post(scores_endpoint, json=payload, headers=headers)
                    if 200 <= retry_resp.status_code < 300:
                        with self._store_lock:
                            self._idempotency_store[dedupe_key] = time.time()
                        return AGSResult(
                            success=True,
                            status_code=retry_resp.status_code,
                            message="Score submitted successfully after token retry",
                            dedupe_key=dedupe_key
                        )
                    return AGSResult(
                        success=False,
                        status_code=retry_resp.status_code,
                        message=f"AGS submission failed with status {retry_resp.status_code}: {retry_resp.text}",
                        dedupe_key=dedupe_key
                    )
                else:
                    logger.error("AGS submission rejected with status %d: %s", resp.status_code, resp.text)
                    return AGSResult(
                        success=False,
                        status_code=resp.status_code,
                        message=f"Platform rejected score: status {resp.status_code}",
                        dedupe_key=dedupe_key
                    )

        except httpx.TimeoutException as ex:
            logger.error("Timeout during AGS grade passback to %s: %s", scores_endpoint, ex)
            return AGSResult(
                success=False,
                status_code=None,
                message="Network timeout while communicating with platform AGS endpoint",
                dedupe_key=dedupe_key
            )
        except Exception as ex:
            logger.error("Unexpected error during AGS passback: %s", ex)
            return AGSResult(
                success=False,
                status_code=None,
                message=f"Unexpected error: {ex}",
                dedupe_key=dedupe_key
            )


# Global AGS client instance
ags_client = AGSClient()
