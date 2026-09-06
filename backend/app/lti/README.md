# Member 3 — LTI 1.3 Security & Bhashini DPI Integration

Member 3's complete subsystem, automated test suite, and configuration reside in the [`lti-security/`](../../../lti-security/) directory (mirroring `rag-service/` at the repository root):

- **Master Router**: [`lti-security/app/router.py`](../../../lti-security/app/router.py)
- **OIDC Initiation**: [`lti-security/app/lti/oidc.py`](../../../lti-security/app/lti/oidc.py)
- **Launch Validator**: [`lti-security/app/lti/validator.py`](../../../lti-security/app/lti/validator.py)
- **AGS Grade Passback**: [`lti-security/app/lti/ags.py`](../../../lti-security/app/lti/ags.py)
- **Bhashini DPI Client**: [`lti-security/app/services/bhashini.py`](../../../lti-security/app/services/bhashini.py)
- **Automated Handshake Tests**: [`lti-security/test_handshake.py`](../../../lti-security/test_handshake.py)
