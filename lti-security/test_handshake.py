"""
LTI 1.3 Security & Bhashini DPI Integration - Comprehensive Handshake Test Suite
Tests positive launch flow, negative security vectors, JWKS, AGS assertions, and Bhashini fallback.
"""

import sys
import os
import time
import urllib.parse
from datetime import datetime, timezone
import pytest
from httpx import AsyncClient, ASGITransport
import jwt
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath("."))

from app.main import app
from app.core.config import settings
from app.core.security import KeyManager, platform_jwks_cache
from app.lti.ags import ags_client, ScoreSubmission
from app.services.bhashini import bhashini_service

# Generate mock Platform RSA keypair for testing incoming id_token signatures
MOCK_PLATFORM_KEY_ID = "igot-mock-key-2026"
platform_private_key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048,
    backend=default_backend()
)
platform_public_key = platform_private_key.public_key()


def setup_mock_platform_keys():
    """Register mock platform public key in platform_jwks_cache."""
    with platform_jwks_cache._lock:
        platform_jwks_cache._cache[MOCK_PLATFORM_KEY_ID] = platform_public_key
        platform_jwks_cache._last_fetched = time.time()


def create_signed_id_token(
    sub: str = "officer-karmayogi-101",
    nonce: str = "test-nonce",
    custom_claims: dict = None,
    issuer: str = settings.PLATFORM_ISSUER,
    audience: str = settings.PLATFORM_CLIENT_ID,
    kid: str = MOCK_PLATFORM_KEY_ID,
    exp_offset: int = 300,
    signing_key = platform_private_key
) -> str:
    """Helper to generate signed RS256 LTI 1.3 id_token."""
    now = int(time.time())
    if custom_claims is None:
        custom_claims = {
            "frac_role": "Section Officer",
            "division": "Personnel & Training",
            "state": "New Delhi"
        }

    claims = {
        "iss": issuer,
        "aud": audience,
        "sub": sub,
        "iat": now,
        "exp": now + exp_offset,
        "nonce": nonce,
        "https://purl.imsglobal.org/spec/lti/claim/message_type": "LtiResourceLinkRequest",
        "https://purl.imsglobal.org/spec/lti/claim/version": "1.3.0",
        "https://purl.imsglobal.org/spec/lti/claim/roles": [
            "http://purl.imsglobal.org/vocab/lis/v2/membership#Learner"
        ],
        "https://purl.imsglobal.org/spec/lti/claim/custom": custom_claims,
        "https://purl.imsglobal.org/spec/lti-ags/claim/endpoint": {
            "lineitem": "https://igot-karmayogi.gov.in/api/v1/lineitems/course-42/lineitem-1",
            "scope": [
                "https://purl.imsglobal.org/spec/lti-ags/scope/score",
                "https://purl.imsglobal.org/spec/lti-ags/scope/lineitem"
            ]
        }
    }
    headers = {
        "kid": kid,
        "alg": "RS256",
        "typ": "JWT"
    }
    return jwt.encode(claims, signing_key, algorithm="RS256", headers=headers)


@pytest.mark.asyncio
async def test_01_tool_jwks_endpoint():
    """Verify tool public JWKS endpoint serves RFC 7517 compliant key specifications."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/lti/jwks.json")
        assert resp.status_code == 200, f"JWKS endpoint returned status {resp.status_code}"
        data = resp.json()
        assert "keys" in data
        assert len(data["keys"]) > 0
        jwk = data["keys"][0]
        assert jwk["kty"] == "RSA"
        assert jwk["alg"] == "RS256"
        assert jwk["use"] == "sig"
        assert jwk["kid"] == settings.TOOL_KEY_ID
        assert "n" in jwk and len(jwk["n"]) > 50
        assert "e" in jwk
        print("\n[PASS] Test 1: Tool JWKS endpoint is RFC 7517 compliant.")


@pytest.mark.asyncio
async def test_02_oidc_login_and_valid_launch_flow():
    """Verify complete end-to-end positive LTI 1.3 flow: OIDC login -> POST launch -> session retrieval."""
    setup_mock_platform_keys()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Step 1: OIDC Login Initiation
        login_params = {
            "iss": settings.PLATFORM_ISSUER,
            "login_hint": "user_officer_42",
            "target_link_uri": f"{settings.TOOL_HOST}/lti/launch"
        }
        login_resp = await client.get("/lti/login", params=login_params, follow_redirects=False)
        assert login_resp.status_code == 302
        location = login_resp.headers["location"]
        assert settings.PLATFORM_AUTH_URL in location

        # Extract generated state and nonce from redirection URL
        parsed_url = urllib.parse.urlparse(location)
        query_params = urllib.parse.parse_qs(parsed_url.query)
        assert "state" in query_params
        assert "nonce" in query_params
        state = query_params["state"][0]
        nonce = query_params["nonce"][0]
        assert len(state) >= 32
        assert len(nonce) >= 32

        # Step 2: Simulate Platform signed POST launch
        id_token = create_signed_id_token(
            sub="karmayogi-cadre-9988",
            nonce=nonce,
            custom_claims={
                "frac_role": "Under Secretary",
                "division": "Administrative Reforms",
                "state": "Gujarat"
            }
        )

        launch_data = {
            "id_token": id_token,
            "state": state
        }
        launch_resp = await client.post("/lti/launch", data=launch_data, follow_redirects=False)
        assert launch_resp.status_code == 303, f"Launch returned status {launch_resp.status_code}: {launch_resp.text}"
        redirect_target = launch_resp.headers["location"]
        assert settings.FRONTEND_URL in redirect_target
        assert "session_id=" in redirect_target

        # Step 3: Verify Opaque Session Data
        parsed_redirect = urllib.parse.urlparse(redirect_target)
        redirect_params = urllib.parse.parse_qs(parsed_redirect.query)
        session_id = redirect_params["session_id"][0]

        session_resp = await client.get(f"/lti/session/{session_id}")
        assert session_resp.status_code == 200
        session_body = session_resp.json()
        assert session_body["sub"] == "karmayogi-cadre-9988"
        assert session_body["custom"]["frac_role"] == "Under Secretary"
        assert session_body["custom"]["division"] == "Administrative Reforms"
        assert session_body["custom"]["state"] == "Gujarat"
        assert session_body["ags"]["lineitem"] == "https://igot-karmayogi.gov.in/api/v1/lineitems/course-42/lineitem-1"
        print("[PASS] Test 2: OIDC Login -> POST Launch -> Opaque Session flow succeeded.")


@pytest.mark.asyncio
async def test_03_negative_replay_attack_prevention():
    """Verify replay protection: re-submitting a consumed state/nonce is immediately rejected with 401."""
    setup_mock_platform_keys()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Login
        login_resp = await client.get("/lti/login", params={
            "iss": settings.PLATFORM_ISSUER,
            "login_hint": "user_replay_test",
            "target_link_uri": f"{settings.TOOL_HOST}/lti/launch"
        }, follow_redirects=False)
        qs = urllib.parse.parse_qs(urllib.parse.urlparse(login_resp.headers["location"]).query)
        state, nonce = qs["state"][0], qs["nonce"][0]

        id_token = create_signed_id_token(nonce=nonce)
        launch_payload = {"id_token": id_token, "state": state}

        # First launch: must succeed
        res1 = await client.post("/lti/launch", data=launch_payload, follow_redirects=False)
        assert res1.status_code == 303

        # Second launch with identical state/nonce: MUST return 401 Unauthorized
        res2 = await client.post("/lti/launch", data=launch_payload, follow_redirects=False)
        assert res2.status_code == 401
        assert res2.json()["detail"] == "Authentication failed"
        print("[PASS] Test 3: Replay attack prevention strictly enforced (401 Generic Unauthorized).")


@pytest.mark.asyncio
async def test_04_negative_tampered_signature():
    """Verify cryptographic validation: tampered token or signature mismatch is rejected with 401."""
    setup_mock_platform_keys()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        login_resp = await client.get("/lti/login", params={
            "iss": settings.PLATFORM_ISSUER,
            "login_hint": "tamper_test",
            "target_link_uri": f"{settings.TOOL_HOST}/lti/launch"
        }, follow_redirects=False)
        qs = urllib.parse.parse_qs(urllib.parse.urlparse(login_resp.headers["location"]).query)
        state, nonce = qs["state"][0], qs["nonce"][0]

        # Sign token with an unauthorized rogue key
        rogue_key = rsa.generate_private_key(public_exponent=65537, key_size=2048, backend=default_backend())
        tampered_token = create_signed_id_token(nonce=nonce, signing_key=rogue_key)

        res = await client.post("/lti/launch", data={"id_token": tampered_token, "state": state})
        assert res.status_code == 401
        assert res.json()["detail"] == "Authentication failed"
        print("[PASS] Test 4: Tampered signature correctly rejected with 401.")


@pytest.mark.asyncio
async def test_05_negative_expired_token():
    """Verify token expiry validation: expired id_token is rejected with 401."""
    setup_mock_platform_keys()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        login_resp = await client.get("/lti/login", params={
            "iss": settings.PLATFORM_ISSUER,
            "login_hint": "expiry_test",
            "target_link_uri": f"{settings.TOOL_HOST}/lti/launch"
        }, follow_redirects=False)
        qs = urllib.parse.parse_qs(urllib.parse.urlparse(login_resp.headers["location"]).query)
        state, nonce = qs["state"][0], qs["nonce"][0]

        # Expired token (exp in the past: -300s)
        expired_token = create_signed_id_token(nonce=nonce, exp_offset=-300)

        res = await client.post("/lti/launch", data={"id_token": expired_token, "state": state})
        assert res.status_code == 401
        assert res.json()["detail"] == "Authentication failed"
        print("[PASS] Test 5: Expired token correctly rejected with 401.")


@pytest.mark.asyncio
async def test_06_negative_issuer_mismatch():
    """Verify issuer validation: id_token with mismatched 'iss' claim is rejected with 401."""
    setup_mock_platform_keys()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        login_resp = await client.get("/lti/login", params={
            "iss": settings.PLATFORM_ISSUER,
            "login_hint": "iss_test",
            "target_link_uri": f"{settings.TOOL_HOST}/lti/launch"
        }, follow_redirects=False)
        qs = urllib.parse.parse_qs(urllib.parse.urlparse(login_resp.headers["location"]).query)
        state, nonce = qs["state"][0], qs["nonce"][0]

        invalid_iss_token = create_signed_id_token(
            nonce=nonce,
            issuer="https://unauthorized-platform.org"
        )

        res = await client.post("/lti/launch", data={"id_token": invalid_iss_token, "state": state})
        assert res.status_code == 401
        assert res.json()["detail"] == "Authentication failed"
        print("[PASS] Test 6: Mismatched issuer rejected with 401.")


@pytest.mark.asyncio
async def test_07_negative_audience_mismatch():
    """Verify audience validation: id_token with mismatched 'aud' claim is rejected with 401."""
    setup_mock_platform_keys()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        login_resp = await client.get("/lti/login", params={
            "iss": settings.PLATFORM_ISSUER,
            "login_hint": "aud_test",
            "target_link_uri": f"{settings.TOOL_HOST}/lti/launch"
        }, follow_redirects=False)
        qs = urllib.parse.parse_qs(urllib.parse.urlparse(login_resp.headers["location"]).query)
        state, nonce = qs["state"][0], qs["nonce"][0]

        invalid_aud_token = create_signed_id_token(
            nonce=nonce,
            audience="wrong-client-identifier"
        )

        res = await client.post("/lti/launch", data={"id_token": invalid_aud_token, "state": state})
        assert res.status_code == 401
        assert res.json()["detail"] == "Authentication failed"
        print("[PASS] Test 7: Mismatched audience rejected with 401.")


@pytest.mark.asyncio
async def test_08_ags_client_assertion_and_idempotency():
    """Verify AGS client-assertion token signing (RS256, IMS specs) and idempotency deduplication."""
    # 1. Generate client assertion
    assertion = ags_client.generate_client_assertion()
    unverified_header = jwt.get_unverified_header(assertion)
    assert unverified_header["alg"] == "RS256"
    assert unverified_header["kid"] == settings.TOOL_KEY_ID

    # Verify assertion using tool's public key
    tool_pub_key = KeyManager.get_public_key()
    claims = jwt.decode(
        assertion,
        key=tool_pub_key,
        algorithms=["RS256"],
        audience=settings.PLATFORM_TOKEN_URL
    )
    assert claims["iss"] == settings.PLATFORM_CLIENT_ID
    assert claims["sub"] == settings.PLATFORM_CLIENT_ID
    assert "jti" in claims
    assert claims["exp"] > claims["iat"]

    # 2. Verify Deduplication Key Generation
    score = ScoreSubmission(
        userId="user-sub-123",
        scoreGiven=92.5,
        scoreMaximum=100.0,
        comment="Competency verified",
        activityProgress="Completed",
        gradingProgress="FullyGraded"
    )
    key1 = ags_client._compute_dedupe_key("https://igot.gov.in/lineitem/1", score)
    key2 = ags_client._compute_dedupe_key("https://igot.gov.in/lineitem/1", score)
    assert key1 == key2

    # Simulate already submitted item in idempotency store
    with ags_client._store_lock:
        ags_client._idempotency_store[key1] = time.time()

    idempotent_result = await ags_client.submit_score("https://igot.gov.in/lineitem/1", score)
    assert idempotent_result.success is True
    assert idempotent_result.idempotent_replay is True
    print("[PASS] Test 8: AGS signed client assertion and idempotency deduplication verified.")


@pytest.mark.asyncio
async def test_09_bhashini_service_cache_and_fallback():
    """Verify Bhashini service caching and graceful degradation without raising exceptions."""
    # Seed cache directly
    bhashini_service._set_cache("Competency Assessment", "en", "hi", "योग्यता मूल्यांकन")

    # Call translate - should hit cache
    cached_resp = await bhashini_service.translate_text("Competency Assessment", "en", "hi")
    assert cached_resp.cached is True
    assert cached_resp.translated_text == "योग्यता मूल्यांकन"
    assert cached_resp.degraded_fallback is False

    # Call translate with an uncached string without credentials -> must fall back gracefully to source text
    fallback_resp = await bhashini_service.translate_text("Random Uncached Question", "en", "hi")
    assert fallback_resp.cached is False
    assert fallback_resp.translated_text == "Random Uncached Question"
    assert fallback_resp.degraded_fallback is True
    print("[PASS] Test 9: Bhashini translation cache hit & graceful degradation fallback verified.")


if __name__ == "__main__":
    import asyncio
    print("=" * 70)
    print("RUNNING LTI 1.3 SECURITY & BHASHINI DPI INTEGRATION TEST SUITE")
    print("=" * 70)

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    tests = [
        ("Tool JWKS Endpoint (RFC 7517)", test_01_tool_jwks_endpoint),
        ("OIDC Login -> Launch -> Session Flow", test_02_oidc_login_and_valid_launch_flow),
        ("Replay Attack Prevention (Single-use Nonce/State)", test_03_negative_replay_attack_prevention),
        ("Tampered Signature Rejection (RS256)", test_04_negative_tampered_signature),
        ("Expired Token Rejection (401)", test_05_negative_expired_token),
        ("Issuer Mismatch Rejection (401)", test_06_negative_issuer_mismatch),
        ("Audience Mismatch Rejection (401)", test_07_negative_audience_mismatch),
        ("AGS Client Assertion & Idempotency", test_08_ags_client_assertion_and_idempotency),
        ("Bhashini DPI Caching & Graceful Fallback", test_09_bhashini_service_cache_and_fallback),
    ]

    passed = 0
    failed = 0
    for name, test_fn in tests:
        try:
            loop.run_until_complete(test_fn())
            passed += 1
        except Exception as e:
            failed += 1
            print(f"\n[FAIL] {name}: {e}")
            import traceback
            traceback.print_exc()

    print("=" * 70)
    print(f"RESULTS: {passed} PASSED, {failed} FAILED")
    print("=" * 70)

    if failed > 0:
        sys.exit(1)
    else:
        sys.exit(0)
