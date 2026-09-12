/**
 * KarmMitra AI — Mock iGOT Karmayogi Platform Simulator
 * =======================================================
 * Subsystem: Member 6 (QA & Test Infrastructure)
 * Role: LMS Platform Simulator, LTI 1.3 Launch Initiator & AGS Grade Receiver
 *
 * PURPOSE:
 *   Simulates the government iGOT Karmayogi LMS platform so the team can:
 *   1. Initiate signed RS256 LTI 1.3 launches with synthetic MoSPI personas.
 *   2. Host an RFC 7517 compliant JWKS public key set (/.well-known/jwks.json).
 *   3. Capture and validate LTI Advantage Assignment and Grade Services (AGS) passbacks.
 *   4. Inspect historical grade records via /platform/ags/history during live demos.
 *
 * NOTE ON REAL VS MOCK OIDC FLOW:
 *   In production iGOT Karmayogi, the handshake follows a 3-step OIDC round-trip:
 *     Step 1: Tool initiates login (GET /lti/login with iss & login_hint)
 *     Step 2: Platform authenticates user and redirects back with auth code/nonce
 *     Step 3: Platform POSTs signed id_token to Tool launch endpoint
 *   For rapid local developer iteration and UI testing, this mock platform provides:
 *     - Direct Launch Mode (POST /platform/launch): skips straight to signed launch
 *     - Full OIDC Mode (GET /platform/oidc/auth): supports Step 2 redirection if needed
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Load environment configuration
dotenv.config();

const app = express();

// Configuration with robust fallbacks
const PORT = process.env.PORT || 9000;
const TOOL_LAUNCH_URL = process.env.TOOL_LAUNCH_URL || 'http://localhost:8000/lti/launch';
const PLATFORM_ISSUER = process.env.PLATFORM_ISSUER || 'https://igotkarmayogi.gov.in';
const TOOL_CLIENT_ID = process.env.TOOL_CLIENT_ID || 'karmmitra_sih26101_tool';
const PLATFORM_KEY_ID = process.env.PLATFORM_KEY_ID || 'igot-mock-key-2026';
const PRIVATE_KEY_PATH = path.resolve(__dirname, process.env.PLATFORM_PRIVATE_KEY_PATH || 'certs/platform_private.key');
const PUBLIC_KEY_PATH = path.resolve(__dirname, process.env.PLATFORM_PUBLIC_KEY_PATH || 'certs/platform_public.key');

// Verify RSA cryptographic keys
let privateKeyPem;
let publicKeyPem;
let platformJwk;

try {
  privateKeyPem = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
  publicKeyPem = fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');

  // Convert RSA Public Key PEM into RFC 7517 JWK format using Node's built-in crypto
  const exportedJwk = crypto.createPublicKey(publicKeyPem).export({ format: 'jwk' });
  platformJwk = {
    kty: exportedJwk.kty || 'RSA',
    use: 'sig',
    alg: 'RS256',
    kid: PLATFORM_KEY_ID,
    n: exportedJwk.n,
    e: exportedJwk.e
  };
  console.log(`[INIT] Loaded RSA keypair for '${PLATFORM_KEY_ID}'`);
} catch (err) {
  console.error(`[FATAL] Error reading RSA keys from certs/ directory: ${err.message}`);
  console.error('Make sure certs/platform_private.key and certs/platform_public.key exist.');
  process.exit(1);
}

// Load synthetic MoSPI user data and course catalog
let syntheticUsers = [];
let courseCatalog = [];

try {
  const usersPath = path.resolve(__dirname, 'data/synthetic_users.json');
  syntheticUsers = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
  console.log(`[INIT] Loaded ${syntheticUsers.length} synthetic MoSPI user profiles.`);
} catch (err) {
  console.warn(`[WARN] Could not load data/synthetic_users.json: ${err.message}`);
}

try {
  const coursesPath = path.resolve(__dirname, 'data/course_catalog.json');
  courseCatalog = JSON.parse(fs.readFileSync(coursesPath, 'utf8'));
  console.log(`[INIT] Loaded ${courseCatalog.length} simulated iGOT courses.`);
} catch (err) {
  console.warn(`[WARN] Could not load data/course_catalog.json: ${err.message}`);
}

// In-memory store for AGS grade passback submissions
// Allows judges & developers to verify that passback occurred without reading terminal scrollback
const agsHistory = [];

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// -----------------------------------------------------------------------------
// 1. HEALTH & METRICS ENDPOINTS
// -----------------------------------------------------------------------------

/**
 * Health check probe used by Member 6 test_runner.py
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'mock-igot-platform',
    port: PORT,
    platform_issuer: PLATFORM_ISSUER,
    tool_client_id: TOOL_CLIENT_ID,
    active_key_id: PLATFORM_KEY_ID,
    timestamp: new Date().toISOString()
  });
});

// -----------------------------------------------------------------------------
// 2. LTI 1.3 JWKS ENDPOINT (RFC 7517)
// -----------------------------------------------------------------------------

/**
 * Exposes the platform's public key as an RFC 7517 JSON Web Key Set (JWKS).
 * Member 3's LTI security microservice fetches this endpoint to verify
 * incoming RS256 id_token signatures.
 */
app.get('/.well-known/jwks.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    keys: [platformJwk]
  });
});

// Compatibility alias for standard JWKS routes
app.get('/jwks.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    keys: [platformJwk]
  });
});

// -----------------------------------------------------------------------------
// 3. SYNTHETIC PERSONAS & CATALOG APIS
// -----------------------------------------------------------------------------

/**
 * Returns seeded MoSPI user personas for the test launcher UI.
 */
app.get('/api/users', (req, res) => {
  res.status(200).json(syntheticUsers);
});

/**
 * Returns simulated iGOT Karmayogi course catalog.
 */
app.get('/api/courses', (req, res) => {
  res.status(200).json(courseCatalog);
});

// -----------------------------------------------------------------------------
// 4. LTI 1.3 LAUNCH SIMULATOR (POST /platform/launch)
// -----------------------------------------------------------------------------

/**
 * Simulates the platform initiating an LTI 1.3 Resource Link Request.
 * Constructs standard IMS Global claims, signs them with RS256 using the platform's
 * private key, and returns an auto-submitting POST form targeting the tool.
 */
app.post('/platform/launch', (req, res) => {
  const { userId, customLaunchUrl, state: requestedState, nonce: requestedNonce } = req.body;

  // Resolve target official persona
  const user = syntheticUsers.find(u => u.userId === userId || u.sub === userId) || syntheticUsers[0] || {
    sub: 'mospi_officer_default',
    name: 'Default MoSPI Official',
    email: 'official@mock-mospi.gov.in',
    division: 'Field Operations Division (FOD)',
    frac_role: 'MOSPI_FOD_INV_01',
    designation: 'Statistical Officer',
    state: 'Delhi'
  };

  const targetUrl = customLaunchUrl || TOOL_LAUNCH_URL;
  const now = Math.floor(Date.now() / 1000);
  const nonce = requestedNonce || crypto.randomBytes(16).toString('hex');
  const state = requestedState || crypto.randomBytes(16).toString('hex');

  // Determine lineitem URL for grade passback (pointing back to this mock platform)
  const host = req.get('host');
  const protocol = req.protocol;
  const lineitemUrl = `${protocol}://${host}/platform/ags/lineitem/competency_assessment/scores`;

  // Standard IMS Global LTI 1.3 Claim Set
  const claims = {
    iss: PLATFORM_ISSUER,
    aud: TOOL_CLIENT_ID,
    sub: user.sub || user.userId,
    iat: now,
    exp: now + 3600, // Valid for 1 hour
    nonce: nonce,
    name: user.name,
    email: user.email,
    given_name: user.name.split(' ')[0],
    family_name: user.name.split(' ').slice(1).join(' ') || 'Official',

    // Standard LTI 1.3 Core Claims
    'https://purl.imsglobal.org/spec/lti/claim/message_type': 'LtiResourceLinkRequest',
    'https://purl.imsglobal.org/spec/lti/claim/version': '1.3.0',
    'https://purl.imsglobal.org/spec/lti/claim/deployment_id': 'deployment-mospi-karmmitra-01',
    'https://purl.imsglobal.org/spec/lti/claim/target_link_uri': targetUrl,
    'https://purl.imsglobal.org/spec/lti/claim/resource_link': {
      id: 'karmmitra-competency-diagnostic',
      title: 'KarmMitra AI Competency Diagnostic & Learning Pathway Engine',
      description: 'Sovereign AI-driven FRAC & KCM competency gap diagnostic for MoSPI'
    },
    'https://purl.imsglobal.org/spec/lti/claim/roles': [
      'http://purl.imsglobal.org/vocab/lis/v2/membership#Learner'
    ],

    // Karmayogi & MoSPI Custom Claims Namespace
    'https://purl.imsglobal.org/spec/lti/claim/custom': {
      frac_role: user.frac_role,
      role_title: user.role_title || user.designation,
      division: user.division,
      designation: user.designation,
      state: user.state,
      history_count: user.history_count !== undefined ? user.history_count : 0,
      scenario_label: user.scenario_label || 'Direct Simulation'
    },

    // LTI Assignment and Grade Services (AGS) Endpoint Claim
    'https://purl.imsglobal.org/spec/lti-ags/claim/endpoint': {
      scope: [
        'https://purl.imsglobal.org/spec/lti-ags/scope/score',
        'https://purl.imsglobal.org/spec/lti-ags/scope/lineitem'
      ],
      lineitem: lineitemUrl
    }
  };

  // Sign RS256 token with platform private key, injecting 'kid' in header
  const idToken = jwt.sign(claims, privateKeyPem, {
    algorithm: 'RS256',
    header: {
      alg: 'RS256',
      typ: 'JWT',
      kid: PLATFORM_KEY_ID
    }
  });

  console.log(`[LAUNCH] Generated signed LTI 1.3 token for ${user.name} (${user.sub}) targeting ${targetUrl}`);

  // Return an auto-submitting HTML form that POSTs id_token and state to the tool
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>iGOT Karmayogi — Redirecting to KarmMitra AI</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 32px;
      max-width: 500px;
      text-align: center;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    }
    .spinner {
      border: 4px solid rgba(255,255,255,0.1);
      border-top: 4px solid #38bdf8;
      border-radius: 50%;
      width: 44px;
      height: 44px;
      animation: spin 1s linear infinite;
      margin: 20px auto;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      background: #0369a1;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }
    .subtext { color: #94a3b8; font-size: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">iGOT KARMAYOGI LMS • LTI 1.3 LAUNCH</div>
    <h2>Launching KarmMitra AI</h2>
    <p class="subtext">Transferring secure credentials for <strong>${user.name}</strong> (${user.division})...</p>
    <div class="spinner"></div>
    <form id="ltiLaunchForm" action="${targetUrl}" method="POST">
      <input type="hidden" name="id_token" value="${idToken}" />
      <input type="hidden" name="state" value="${state}" />
      <noscript>
        <p>JavaScript is disabled in your browser. Click the button below to proceed:</p>
        <button type="submit" style="padding:10px 20px; background:#0284c7; color:#fff; border:none; border-radius:6px; cursor:pointer;">Proceed to KarmMitra AI</button>
      </noscript>
    </form>
  </div>
  <script>
    document.addEventListener("DOMContentLoaded", function() {
      document.getElementById("ltiLaunchForm").submit();
    });
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
});

// -----------------------------------------------------------------------------
// 5. FULL OIDC AUTHORIZATION SIMULATION (GET /platform/oidc/auth)
// -----------------------------------------------------------------------------

/**
 * Supports full 3-step OIDC flow if Member 3's GET /lti/login initiates an
 * authorization redirect to this mock LMS.
 */
app.get('/platform/oidc/auth', (req, res) => {
  const { client_id, redirect_uri, login_hint, state, nonce } = req.query;

  console.log(`[OIDC AUTH] Received authorization request for login_hint='${login_hint}', client_id='${client_id}'`);

  // Match user by login_hint or sub
  const user = syntheticUsers.find(u => u.sub === login_hint || u.userId === login_hint || u.email === login_hint) || syntheticUsers[0];

  const now = Math.floor(Date.now() / 1000);
  const host = req.get('host');
  const protocol = req.protocol;
  const lineitemUrl = `${protocol}://${host}/platform/ags/lineitem/competency_assessment/scores`;

  const claims = {
    iss: PLATFORM_ISSUER,
    aud: client_id || TOOL_CLIENT_ID,
    sub: user.sub,
    iat: now,
    exp: now + 3600,
    nonce: nonce || 'mock-nonce',
    name: user.name,
    email: user.email,
    'https://purl.imsglobal.org/spec/lti/claim/message_type': 'LtiResourceLinkRequest',
    'https://purl.imsglobal.org/spec/lti/claim/version': '1.3.0',
    'https://purl.imsglobal.org/spec/lti/claim/roles': ['http://purl.imsglobal.org/vocab/lis/v2/membership#Learner'],
    'https://purl.imsglobal.org/spec/lti/claim/custom': {
      frac_role: user.frac_role,
      role_title: user.role_title,
      division: user.division,
      designation: user.designation,
      state: user.state
    },
    'https://purl.imsglobal.org/spec/lti-ags/claim/endpoint': {
      scope: ['https://purl.imsglobal.org/spec/lti-ags/scope/score', 'https://purl.imsglobal.org/spec/lti-ags/scope/lineitem'],
      lineitem: lineitemUrl
    }
  };

  const idToken = jwt.sign(claims, privateKeyPem, {
    algorithm: 'RS256',
    header: { alg: 'RS256', typ: 'JWT', kid: PLATFORM_KEY_ID }
  });

  const target = redirect_uri || TOOL_LAUNCH_URL;

  // Render auto-submitting POST form back to tool redirect_uri
  const html = `<!DOCTYPE html>
<html>
<head><title>OIDC Auth Redirect</title></head>
<body onload="document.forms[0].submit()">
  <form action="${target}" method="POST">
    <input type="hidden" name="id_token" value="${idToken}" />
    <input type="hidden" name="state" value="${state || ''}" />
  </form>
</body>
</html>`;
  res.send(html);
});

// -----------------------------------------------------------------------------
// 6. AGS GRADE PASSBACK RECEIVER (POST /platform/ags/lineitem/.../scores)
// -----------------------------------------------------------------------------

/**
 * LTI Advantage Assignment and Grade Services (AGS) Score Receiver.
 * Receives learner scores calculated by KarmMitra AI, strictly validates
 * the payload, logs to console, and stores in memory for QA verification.
 */
app.post('/platform/ags/lineitem/competency_assessment/scores', (req, res) => {
  const payload = req.body;
  const authHeader = req.headers.authorization || '';

  console.log('\n======================================================');
  console.log(' [AGS GRADE PASSBACK RECEIVED — iGOT LMS GRADEBOOK]');
  console.log('======================================================');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Auth Header: ${authHeader ? authHeader.slice(0, 40) + '...' : '(None)'}`);
  console.log('Payload Body:', JSON.stringify(payload, null, 2));

  // Strict Schema Validation
  const errors = [];
  if (payload.userId === undefined || payload.userId === null || String(payload.userId).trim() === '') {
    errors.push("Missing required field 'userId'");
  }
  if (payload.scoreGiven === undefined || typeof payload.scoreGiven !== 'number') {
    errors.push("Missing or non-numeric required field 'scoreGiven'");
  }
  if (payload.scoreMaximum === undefined || typeof payload.scoreMaximum !== 'number' || payload.scoreMaximum <= 0) {
    errors.push("Missing or invalid required field 'scoreMaximum' (must be > 0)");
  }
  if (!payload.activityProgress) {
    errors.push("Missing required field 'activityProgress'");
  }

  if (errors.length > 0) {
    console.error('[AGS ERROR] Invalid Score Submission:', errors.join(', '));
    return res.status(400).json({
      error: 'Invalid AGS Payload',
      validation_errors: errors,
      expected_schema: {
        userId: 'string (e.g. mospi_officer_101)',
        scoreGiven: 'number (e.g. 85.0)',
        scoreMaximum: 'number (e.g. 100.0)',
        activityProgress: "string (e.g. 'Completed')",
        gradingProgress: "string (optional, e.g. 'FullyGraded')",
        comment: 'string (optional)'
      }
    });
  }

  // Record submission in memory
  const submissionRecord = {
    id: `ags_rec_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    receivedAt: new Date().toISOString(),
    ip: req.ip || req.connection.remoteAddress,
    userId: payload.userId,
    scoreGiven: payload.scoreGiven,
    scoreMaximum: payload.scoreMaximum,
    percentage: Math.round((payload.scoreGiven / payload.scoreMaximum) * 1000) / 10,
    activityProgress: payload.activityProgress,
    gradingProgress: payload.gradingProgress || 'FullyGraded',
    comment: payload.comment || '',
    authHeaderPresent: Boolean(authHeader)
  };

  agsHistory.unshift(submissionRecord);

  // Keep last 100 submissions in memory
  if (agsHistory.length > 100) {
    agsHistory.pop();
  }

  console.log(`[AGS SUCCESS] Grade successfully recorded for official '${payload.userId}': ${submissionRecord.percentage}% (${payload.scoreGiven}/${payload.scoreMaximum})`);
  console.log('======================================================\n');

  res.status(200).json({
    status: 'success',
    message: 'Score successfully recorded in mock iGOT Karmayogi gradebook',
    record: submissionRecord
  });
});

// -----------------------------------------------------------------------------
// 7. OAUTH 2.0 TOKEN ENDPOINT (POST /oauth2/token)
// -----------------------------------------------------------------------------

/**
 * Provides a mock OAuth 2.0 access token for LTI Advantage services.
 * In a real implementation, this validates the JWT client assertion.
 */
app.post('/oauth2/token', (req, res) => {
  console.log('[OAUTH2] Received token request');
  res.status(200).json({
    access_token: 'mock-ags-token-' + crypto.randomBytes(16).toString('hex'),
    token_type: 'Bearer',
    expires_in: 3600
  });
});

// -----------------------------------------------------------------------------
// 8. AGS GRADE HISTORY API (GET & DELETE /platform/ags/history)
// -----------------------------------------------------------------------------

/**
 * Returns list of recorded grade passback submissions.
 * Used by the test harness UI and test_runner.py.
 */
app.get('/platform/ags/history', (req, res) => {
  res.status(200).json({
    total_records: agsHistory.length,
    history: agsHistory
  });
});

/**
 * Clears recorded grade history (useful between test suites).
 */
app.delete('/platform/ags/history', (req, res) => {
  const count = agsHistory.length;
  agsHistory.length = 0;
  console.log(`[AGS RESET] Cleared ${count} records from AGS history.`);
  res.status(200).json({
    message: 'AGS passback history cleared successfully',
    cleared_count: count
  });
});

// -----------------------------------------------------------------------------
// 8. SERVER BOOTSTRAP
// -----------------------------------------------------------------------------

const server = app.listen(PORT, () => {
  console.log('==============================================================');
  console.log(` 🏛️  Mock iGOT Karmayogi LMS Platform Simulator (Member 6)`);
  console.log('==============================================================');
  console.log(` Server URL:          http://localhost:${PORT}`);
  console.log(` Portal Simulator UI: http://localhost:${PORT}/index.html`);
  console.log(` JWKS Endpoint:       http://localhost:${PORT}/.well-known/jwks.json`);
  console.log(` Target Tool URL:     ${TOOL_LAUNCH_URL}`);
  console.log(` Platform Issuer:     ${PLATFORM_ISSUER}`);
  console.log(` Client Identifier:   ${TOOL_CLIENT_ID}`);
  console.log(` Key ID:              ${PLATFORM_KEY_ID}`);
  console.log(` AGS Passback URL:    http://localhost:${PORT}/platform/ags/lineitem/competency_assessment/scores`);
  console.log('==============================================================\n');
});

module.exports = { app, server, agsHistory };
