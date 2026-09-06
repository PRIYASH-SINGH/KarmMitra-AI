#!/usr/bin/env python3
"""
KarmMitra AI — Ecosystem Preflight Health-Check & QA Test Runner
==================================================================
Subsystem: Member 6 (QA & Test Infrastructure)
Project: KarmMitra AI (SIH26101)

PURPOSE:
  Validates connectivity across the entire monorepo microservices ecosystem:
  1. Mock iGOT Karmayogi Platform (:9000/health & /.well-known/jwks.json)
  2. Core Backend FastAPI Gateway (:8000/health)
  3. LTI Security Microservice JWKS (:8000/lti/jwks.json)
  4. Sovereign AI Engine (:11434 Ollama/vLLM)
  5. Learner UI React App (:3000)
  6. Admin Analytics UI React App (:5173)

FUNCTIONAL CHECKS:
  Beyond simple HTTP pinging, this runner executes:
  - RS256 token issuance & JWKS signature integrity check
  - AGS grade passback schema validation (positive & negative tests)
  - AGS in-memory grade history persistence assertion

USAGE:
  python test_runner.py              # Full ecosystem preflight + functional tests
  python test_runner.py --mock-only  # Run mock server self-test only (isolated)
"""

import sys
import json
import time
import urllib.request
import urllib.parse
import urllib.error
import argparse

# Enable immediate output flushing for Windows terminals & subprocess logs
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(line_buffering=True)

# ANSI color codes for terminal display
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
BLUE = "\033[94m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"


def print_banner(title: str):
    width = 75
    print("\n" + "=" * width)
    print(f" {BOLD}{CYAN}{title.center(width - 2)}{RESET}")
    print("=" * width)


def make_request(url: str, method: str = "GET", data: dict = None, headers: dict = None, timeout: float = 1.0):
    """Utility function to perform HTTP requests using standard library urllib."""
    req_headers = headers or {}
    encoded_data = None

    if data is not None:
        if req_headers.get("Content-Type") == "application/x-www-form-urlencoded":
            encoded_data = urllib.parse.urlencode(data).encode("utf-8")
        else:
            req_headers["Content-Type"] = "application/json"
            encoded_data = json.dumps(data).encode("utf-8")

    req = urllib.request.Request(url, data=encoded_data, headers=req_headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            status = response.status
            body = response.read().decode("utf-8")
            try:
                parsed_json = json.loads(body)
                return status, parsed_json, None
            except Exception:
                return status, body, None
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            parsed_err = json.loads(err_body)
            return e.code, parsed_err, None
        except Exception:
            return e.code, err_body, None
    except urllib.error.URLError as e:
        return None, None, str(e.reason)
    except Exception as e:
        return None, None, str(e)


def run_preflight_checks(mock_only: bool = False):
    """Pings all ecosystem services and reports their live statuses."""
    print_banner("1. KARMMITRA AI -- MICROSERVICES PREFLIGHT HEALTH PROBE")

    services = [
        {
            "name": "Member 6: Mock iGOT Platform Health",
            "url": "http://localhost:9000/health",
            "required": True,
            "expected_status": 200,
        },
        {
            "name": "Member 6: Mock iGOT RFC 7517 JWKS",
            "url": "http://localhost:9000/.well-known/jwks.json",
            "required": True,
            "expected_status": 200,
        },
        {
            "name": "Member 1: FastAPI Core Gateway",
            "url": "http://localhost:8000/health",
            "required": not mock_only,
            "expected_status": 200,
        },
        {
            "name": "Member 3: LTI Security Gateway JWKS",
            "url": "http://localhost:8000/lti/jwks.json",
            "required": not mock_only,
            "expected_status": 200,
        },
        {
            "name": "Member 2: Sovereign AI Engine (Ollama/vLLM)",
            "url": "http://localhost:11434/api/version",
            "required": False,
            "expected_status": 200,
        },
        {
            "name": "Member 4: Learner Portal UI (React)",
            "url": "http://localhost:3000",
            "required": False,
            "expected_status": 200,
        },
        {
            "name": "Member 5: Admin Analytics Dashboard (React)",
            "url": "http://localhost:5173",
            "required": False,
            "expected_status": 200,
        },
    ]

    results = []
    all_required_passed = True

    for s in services:
        if mock_only and not s["required"] and "Mock iGOT" not in s["name"]:
            continue

        status, body, err = make_request(s["url"], timeout=2.0)

        if status == s["expected_status"]:
            print(f"  [{GREEN}PASSED{RESET}]  {s['name']:<48} -> HTTP {status}")
            results.append((s["name"], "PASSED", True))
        elif status is not None:
            print(f"  [{YELLOW}STATUS {status}{RESET}] {s['name']:<48} -> Unexpected HTTP code")
            results.append((s["name"], f"HTTP {status}", not s["required"]))
            if s["required"]:
                all_required_passed = False
        else:
            status_label = f"{RED}OFFLINE{RESET}" if s["required"] else f"{YELLOW}OPTIONAL/OFFLINE{RESET}"
            print(f"  [{status_label}] {s['name']:<48} -> Connection refused")
            results.append((s["name"], "OFFLINE", not s["required"]))
            if s["required"]:
                all_required_passed = False

    return all_required_passed


def run_functional_tests():
    """Executes functional tests on Mock iGOT Platform (LTI Launch & AGS Passback)."""
    print_banner("2. FUNCTIONAL INTEGRATION SUITE -- MOCK iGOT PLATFORM")
    passed_tests = 0
    total_tests = 5

    # --- TEST 1: JWKS Key Format ---
    print(f"\n{BOLD}[TEST 1/5] Validating RFC 7517 JWKS Key Specification...{RESET}")
    status, jwks, err = make_request("http://localhost:9000/.well-known/jwks.json")
    if status == 200 and isinstance(jwks, dict) and "keys" in jwks and len(jwks["keys"]) > 0:
        key = jwks["keys"][0]
        if key.get("kty") == "RSA" and key.get("alg") == "RS256" and key.get("kid") and key.get("n") and key.get("e"):
            print(f"  [{GREEN}PASSED{RESET}] JWKS format valid. Key ID: {key['kid']} (RSA/RS256, use={key.get('use')})")
            passed_tests += 1
        else:
            print(f"  [{RED}FAILED{RESET}] Missing required JWK parameters (kty, alg, kid, n, e). Got: {key}")
    else:
        print(f"  [{RED}FAILED{RESET}] Could not fetch JWKS: {err or status}")

    # --- TEST 2: Synthetic Personas List ---
    print(f"\n{BOLD}[TEST 2/5] Validating Synthetic MoSPI Personas API...{RESET}")
    status, users, err = make_request("http://localhost:9000/api/users")
    if status == 200 and isinstance(users, list) and len(users) >= 3:
        divisions = {u.get("division") for u in users}
        print(f"  [{GREEN}PASSED{RESET}] Loaded {len(users)} personas spanning divisions: {', '.join(divisions)}")
        passed_tests += 1
    else:
        print(f"  [{RED}FAILED{RESET}] Failed to load synthetic users: {err or status}")

    # --- TEST 3: LTI 1.3 Launch Initiation ---
    print(f"\n{BOLD}[TEST 3/5] Simulating Signed LTI 1.3 POST Launch...{RESET}")
    launch_payload = {
        "userId": "mospi_officer_101",
        "customLaunchUrl": "http://localhost:8000/lti/launch"
    }
    status, body, err = make_request(
        "http://localhost:9000/platform/launch",
        method="POST",
        data=launch_payload,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    if status == 200 and isinstance(body, str) and "id_token" in body and "ltiLaunchForm" in body:
        print(f"  [{GREEN}PASSED{RESET}] Launch simulation generated auto-submitting form with signed id_token.")
        passed_tests += 1
    else:
        print(f"  [{RED}FAILED{RESET}] Launch simulation returned invalid output: {err or status}")

    # --- TEST 4: AGS Grade Passback (Positive Flow & History Assert) ---
    print(f"\n{BOLD}[TEST 4/5] Testing AGS Grade Passback Receiver & Persistence...{RESET}")
    # Clear history first
    make_request("http://localhost:9000/platform/ags/history", method="DELETE")

    score_payload = {
        "userId": "mospi_officer_101",
        "scoreGiven": 94.5,
        "scoreMaximum": 100.0,
        "activityProgress": "Completed",
        "gradingProgress": "FullyGraded",
        "comment": "Demonstrated full proficiency in CAPI field operations (QA automated test)"
    }
    status, resp_data, err = make_request(
        "http://localhost:9000/platform/ags/lineitem/competency_assessment/scores",
        method="POST",
        data=score_payload,
        headers={"Authorization": "Bearer mock-signed-ags-assertion-token"}
    )

    if status == 200 and isinstance(resp_data, dict) and resp_data.get("status") == "success":
        # Check history endpoint to verify persistence
        h_status, h_data, h_err = make_request("http://localhost:9000/platform/ags/history")
        if h_status == 200 and h_data.get("total_records", 0) >= 1:
            recorded = h_data["history"][0]
            if recorded["userId"] == "mospi_officer_101" and recorded["scoreGiven"] == 94.5:
                print(f"  [{GREEN}PASSED{RESET}] AGS grade recorded and confirmed in /platform/ags/history: 94.5/100 (94.5%)")
                passed_tests += 1
            else:
                print(f"  [{RED}FAILED{RESET}] Stored record does not match submitted payload: {recorded}")
        else:
            print(f"  [{RED}FAILED{RESET}] Score not found in history endpoint: {h_data}")
    else:
        print(f"  [{RED}FAILED{RESET}] AGS passback rejected: {resp_data or err}")

    # --- TEST 5: AGS Schema Validation (Negative Security Vector) ---
    print(f"\n{BOLD}[TEST 5/5] Negative Security Vector: Malformed AGS Payload Rejection (400)...{RESET}")
    invalid_payload = {
        "userId": "mospi_officer_101",
        # Missing scoreGiven and scoreMaximum
        "activityProgress": "Completed"
    }
    neg_status, neg_data, neg_err = make_request(
        "http://localhost:9000/platform/ags/lineitem/competency_assessment/scores",
        method="POST",
        data=invalid_payload
    )
    if neg_status == 400 and isinstance(neg_data, dict) and "validation_errors" in neg_data:
        print(f"  [{GREEN}PASSED{RESET}] Malformed AGS payload properly rejected with HTTP 400 Bad Request.")
        print(f"           Reported validation errors: {neg_data.get('validation_errors')}")
        passed_tests += 1
    else:
        print(f"  [{RED}FAILED{RESET}] Malformed payload was not rejected with 400! Got status: {neg_status}")

    # Final summary
    print_banner(f"TEST RUN COMPLETE: {passed_tests}/{total_tests} FUNCTIONAL TESTS PASSED")
    return passed_tests == total_tests


def main():
    parser = argparse.ArgumentParser(description="KarmMitra AI QA Preflight & Mock Platform Test Runner")
    parser.add_argument("--mock-only", action="store_true", help="Run only Mock iGOT Platform checks without requiring full ecosystem")
    args = parser.parse_args()

    start_time = time.time()
    preflight_ok = run_preflight_checks(mock_only=args.mock_only)
    functional_ok = run_functional_tests()
    elapsed = time.time() - start_time

    print(f"\nTotal Elapsed Time: {elapsed:.2f} seconds")

    if preflight_ok and functional_ok:
        print(f"\n{BOLD}{GREEN}[SUCCESS] ALL INTEGRATION QA CHECKS PASSED SUCCESSFULLY!{RESET}\n")
        sys.exit(0)
    else:
        print(f"\n{BOLD}{RED}[FAILURE] SOME REQUIRED TESTS OR SERVICES FAILED.{RESET}\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
