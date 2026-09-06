"""
LTI 1.3 Security & Cryptographic Utilities
Provides RSA key parsing, RFC 7517 JWK formatting, state/nonce replay protection,
opaque session management, and platform JWKS caching with key rotation support.
"""

import base64
import time
import secrets
import logging
from typing import Dict, Any, Optional
from threading import Lock
import httpx
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.asymmetric.rsa import RSAPublicKey, RSAPrivateKey
from cryptography.hazmat.backends import default_backend
import jwt

from app.core.config import settings

logger = logging.getLogger("lti.security")


def int_to_base64url(val: int) -> str:
    """Convert an integer to a URL-safe Base64 string without padding (RFC 7517/7518)."""
    byte_len = (val.bit_length() + 7) // 8
    val_bytes = val.to_bytes(byte_len, byteorder="big")
    return base64.urlsafe_b64encode(val_bytes).decode("ascii").rstrip("=")


def base64url_to_int(val: str) -> int:
    """Convert a URL-safe Base64 string without padding to an integer."""
    rem = len(val) % 4
    if rem > 0:
        val += "=" * (4 - rem)
    val_bytes = base64.urlsafe_b64decode(val.encode("ascii"))
    return int.from_bytes(val_bytes, byteorder="big")


def rsa_public_key_to_jwk(public_key: RSAPublicKey, kid: str) -> Dict[str, str]:
    """Convert a Cryptography RSAPublicKey to an RFC 7517 compliant JWK dict."""
    pub_numbers = public_key.public_numbers()
    n_b64 = int_to_base64url(pub_numbers.n)
    e_b64 = int_to_base64url(pub_numbers.e)
    return {
        "kty": "RSA",
        "alg": "RS256",
        "use": "sig",
        "kid": kid,
        "n": n_b64,
        "e": e_b64
    }


def jwk_to_rsa_public_key(jwk: Dict[str, Any]) -> RSAPublicKey:
    """Construct an RSAPublicKey from an RFC 7517 RSA JWK dict."""
    n_int = base64url_to_int(jwk["n"])
    e_int = base64url_to_int(jwk["e"])
    public_numbers = rsa.RSAPublicNumbers(e=e_int, n=n_int)
    return public_numbers.public_key(default_backend())


class KeyManager:
    """Manages loading and caching of this tool's RSA keypair."""

    _private_key: Optional[RSAPrivateKey] = None
    _public_key: Optional[RSAPublicKey] = None
    _lock = Lock()

    @classmethod
    def get_private_key(cls) -> RSAPrivateKey:
        with cls._lock:
            if cls._private_key is None:
                pem_data = settings.load_private_key_pem()
                cls._private_key = serialization.load_pem_private_key(
                    pem_data,
                    password=None,
                    backend=default_backend()
                )
            return cls._private_key

    @classmethod
    def get_public_key(cls) -> RSAPublicKey:
        with cls._lock:
            if cls._public_key is None:
                pem_data = settings.load_public_key_pem()
                cls._public_key = serialization.load_pem_public_key(
                    pem_data,
                    backend=default_backend()
                )
            return cls._public_key

    @classmethod
    def get_tool_jwk(cls) -> Dict[str, str]:
        """Returns the tool's public key as an RFC 7517 compliant JWK."""
        pub = cls.get_public_key()
        return rsa_public_key_to_jwk(pub, settings.TOOL_KEY_ID)


class StateNonceStore:
    """
    Thread-safe short-lived storage for OIDC login state and nonce.
    Enforces atomic single-use and expiration to prevent replay attacks.
    """

    def __init__(self, ttl_seconds: int = settings.STATE_NONCE_TTL_SECONDS):
        self._store: Dict[str, Dict[str, Any]] = {}
        self._ttl = ttl_seconds
        self._lock = Lock()

    def generate_and_save(
        self,
        login_hint: Optional[str] = None,
        target_link_uri: Optional[str] = None,
        lti_message_hint: Optional[str] = None
    ) -> tuple[str, str]:
        """Generate cryptographically random state and nonce and persist them."""
        # Never hardcode nonce or state; use secrets.token_urlsafe
        state = secrets.token_urlsafe(32)
        nonce = secrets.token_urlsafe(32)
        now = time.time()

        with self._lock:
            self._cleanup_expired(now)
            self._store[state] = {
                "nonce": nonce,
                "created_at": now,
                "expires_at": now + self._ttl,
                "login_hint": login_hint,
                "target_link_uri": target_link_uri,
                "lti_message_hint": lti_message_hint,
            }
        return state, nonce

    def consume(self, state: str, nonce: str) -> Optional[Dict[str, Any]]:
        """
        Verify state and nonce, then atomically consume (delete) the entry.
        Returns the entry data if valid; returns None if missing, expired, or nonce mismatch.
        """
        now = time.time()
        with self._lock:
            self._cleanup_expired(now)
            entry = self._store.get(state)
            if entry is None:
                logger.warning("Replay/Invalid state check failed: state not found in store")
                return None

            if entry["expires_at"] < now:
                logger.warning("State check failed: state has expired")
                self._store.pop(state, None)
                return None

            if entry["nonce"] != nonce:
                logger.warning("Nonce mismatch check failed: expected %s, got %s", entry["nonce"], nonce)
                # Invalidate state on mismatch to block brute-force
                self._store.pop(state, None)
                return None

            # Replay protection: pop immediately so it can never be reused
            return self._store.pop(state)

    def _cleanup_expired(self, now: float) -> None:
        expired_keys = [k for k, v in self._store.items() if v["expires_at"] < now]
        for k in expired_keys:
            self._store.pop(k, None)


class SessionStore:
    """
    Opaque server-side session store for authenticated LTI launch contexts.
    Avoids putting sensitive claims in plaintext URL query parameters.
    """

    def __init__(self, ttl_seconds: int = settings.SESSION_TTL_SECONDS):
        self._sessions: Dict[str, Dict[str, Any]] = {}
        self._ttl = ttl_seconds
        self._lock = Lock()

    def create_session(self, launch_data: Dict[str, Any]) -> str:
        """Create a new opaque session token and store launch data."""
        session_id = secrets.token_hex(32)
        now = time.time()
        with self._lock:
            self._cleanup_expired(now)
            self._sessions[session_id] = {
                "data": launch_data,
                "created_at": now,
                "expires_at": now + self._ttl
            }
        return session_id

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve active session data or None if expired/not found."""
        now = time.time()
        with self._lock:
            self._cleanup_expired(now)
            entry = self._sessions.get(session_id)
            if entry and entry["expires_at"] >= now:
                return entry["data"]
            return None

    def _cleanup_expired(self, now: float) -> None:
        expired = [k for k, v in self._sessions.items() if v["expires_at"] < now]
        for k in expired:
            self._sessions.pop(k, None)


class PlatformJWKSCache:
    """
    Caches platform JWKS public keys. Respects key rotation by re-fetching
    the keyset if an unfamiliar `kid` is encountered, with rate-limiting.
    """

    def __init__(self, ttl_seconds: int = 3600):
        self._cache: Dict[str, RSAPublicKey] = {}
        self._raw_keys: list[Dict[str, Any]] = []
        self._last_fetched: float = 0.0
        self._ttl = ttl_seconds
        self._lock = Lock()
        self._min_refetch_interval = 10.0  # seconds between force-refreshes to prevent DoS

    async def get_key_by_kid(self, kid: Optional[str]) -> Optional[RSAPublicKey]:
        """Fetch matching public key for `kid`. Forces cache reload if `kid` is missing."""
        now = time.time()
        with self._lock:
            if kid in self._cache and (now - self._last_fetched < self._ttl):
                return self._cache[kid]

        # Need to fetch or re-fetch
        await self.refresh_keyset()

        with self._lock:
            return self._cache.get(kid)

    async def refresh_keyset(self) -> None:
        """Fetch JWKS from PLATFORM_KEYSET_URL and update cached public keys."""
        now = time.time()
        with self._lock:
            if now - self._last_fetched < self._min_refetch_interval:
                return  # Throttle rapid refetches

        logger.info("Fetching platform JWKS from %s", settings.PLATFORM_KEYSET_URL)
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(settings.PLATFORM_KEYSET_URL)
                resp.raise_for_status()
                jwks_data = resp.json()

            new_cache: Dict[str, RSAPublicKey] = {}
            for key_dict in jwks_data.get("keys", []):
                if key_dict.get("kty") == "RSA" and key_dict.get("kid"):
                    try:
                        pub_key = jwk_to_rsa_public_key(key_dict)
                        new_cache[key_dict["kid"]] = pub_key
                    except Exception as ex:
                        logger.warning("Failed to parse JWK kid=%s: %s", key_dict.get("kid"), ex)

            with self._lock:
                self._cache = new_cache
                self._raw_keys = jwks_data.get("keys", [])
                self._last_fetched = time.time()
                logger.info("Platform JWKS successfully loaded %d keys", len(self._cache))
        except Exception as err:
            logger.error("Error fetching platform JWKS: %s", err)


# Global singletons
state_nonce_store = StateNonceStore()
session_store = SessionStore()
platform_jwks_cache = PlatformJWKSCache()
