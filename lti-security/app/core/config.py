"""
LTI 1.3 Security & Bhashini DPI Integration - Configuration Module
Loads settings from environment variables and .env file via Pydantic Settings.
"""

from pathlib import Path
from typing import Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Tool Host Information
    TOOL_HOST: str = Field(
        default="http://localhost:8000",
        description="Public base URL of this LTI 1.3 Tool microservice"
    )
    TOOL_KEY_ID: str = Field(
        default="karmmitra-tool-key-1",
        description="Key ID (kid) exposed in JWKS and client assertion headers"
    )

    # iGOT Karmayogi Platform LTI 1.3 Configuration
    PLATFORM_ISSUER: str = Field(
        default="https://igot-karmayogi.gov.in",
        description="Expected 'iss' claim from the platform (e.g. iGOT Karmayogi LMS)"
    )
    PLATFORM_CLIENT_ID: str = Field(
        default="karmmitra-ai-client-id",
        description="OAuth2 client_id assigned to this tool on the platform"
    )
    PLATFORM_AUTH_URL: str = Field(
        default="https://igot-karmayogi.gov.in/auth",
        description="OIDC authorization endpoint on the platform"
    )
    PLATFORM_TOKEN_URL: str = Field(
        default="https://igot-karmayogi.gov.in/oauth2/token",
        description="OAuth2 token endpoint on the platform for AGS service token requests"
    )
    PLATFORM_KEYSET_URL: str = Field(
        default="https://igot-karmayogi.gov.in/jwks.json",
        description="JWKS endpoint on the platform providing public keys for RS256 verification"
    )

    # Cryptographic Key Paths (Configurable via ENV, falling back to local certs/ folder)
    PRIVATE_KEY_PATH: str = Field(
        default="certs/private.key",
        description="Path to RSA 2048-bit private key PEM file"
    )
    PUBLIC_KEY_PATH: str = Field(
        default="certs/public.key",
        description="Path to RSA 2048-bit public key PEM file"
    )

    # Frontend Redirection Configuration
    FRONTEND_URL: str = Field(
        default="http://localhost:3000/competency-gap",
        description="Target frontend URL where user is redirected post-launch with opaque session_id"
    )

    # Security TTL Settings
    SESSION_TTL_SECONDS: int = Field(
        default=3600,
        description="Opaque launch session validity duration in seconds (1 hour)"
    )
    STATE_NONCE_TTL_SECONDS: int = Field(
        default=600,
        description="Login initiation state & nonce expiration duration in seconds (10 minutes)"
    )

    # Bhashini Digital Public Infrastructure (DPI) Configuration
    BHASHINI_USER_ID: str = Field(
        default="",
        description="User ID for Bhashini NMT API"
    )
    BHASHINI_API_KEY: str = Field(
        default="",
        description="API Key for Bhashini pipeline inference API"
    )
    BHASHINI_PIPELINE_ENDPOINT: str = Field(
        default="https://dhruva-api.bhashini.gov.in/services/inference/pipeline",
        description="Inference pipeline endpoint for Bhashini translation"
    )

    # Local / Mock development mode (Note: Signature verification is NEVER disabled in prod paths)
    MOCK_MODE: bool = Field(
        default=False,
        description="Explicit flag for running mock platform stubs during local dev/testing"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    def load_private_key_pem(self) -> bytes:
        """Load RSA private key PEM bytes from configured path."""
        key_path = Path(self.PRIVATE_KEY_PATH)
        if not key_path.exists():
            raise FileNotFoundError(
                f"Private key file not found at: {key_path.resolve()}. "
                f"Ensure certs/private.key exists or set PRIVATE_KEY_PATH."
            )
        return key_path.read_bytes()

    def load_public_key_pem(self) -> bytes:
        """Load RSA public key PEM bytes from configured path."""
        key_path = Path(self.PUBLIC_KEY_PATH)
        if not key_path.exists():
            raise FileNotFoundError(
                f"Public key file not found at: {key_path.resolve()}. "
                f"Ensure certs/public.key exists or set PUBLIC_KEY_PATH."
            )
        return key_path.read_bytes()


settings = Settings()
