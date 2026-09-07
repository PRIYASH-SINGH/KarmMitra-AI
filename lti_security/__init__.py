"""
Python package bridge: maps `lti_security` imports to `lti-security/` directory.
The actual LTI code lives in lti-security/app/. We add lti-security/ to sys.path
so that its internal `from app.core.config import settings` imports resolve
to lti-security/app/ rather than backend/app/.
"""
