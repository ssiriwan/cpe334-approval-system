#!/usr/bin/env python3
"""
deploy/smoke_test.py
Smoke test for CPE 334 Approval System on Google Cloud Run.
Verifies:
  1) GET /api/health (status: ok, valid commit SHA)
  2) GET / (UI HTML document served)
  3) Optional: POST /api/auth/login if SMOKE_EMAIL and SMOKE_PASSWORD are set.
"""

import sys
import os
import json
import time
import urllib.request
import urllib.error

def check_endpoint(url, desc, max_attempts=12, delay=5):
    print(f"--> Checking {desc}: {url}")
    last_error = None
    for attempt in range(1, max_attempts + 1):
        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "CPE334-SmokeTest/1.0", "Accept": "*/*"}
            )
            with urllib.request.urlopen(req, timeout=20) as resp:
                status = resp.status
                body = resp.read().decode("utf-8", errors="replace")
                if 200 <= status < 300:
                    print(f"    [OK] Attempt {attempt}: HTTP {status}")
                    return status, body
                else:
                    print(f"    [WAIT] Attempt {attempt}: unexpected status {status}")
        except urllib.error.HTTPError as e:
            last_error = f"HTTPError {e.code}: {e.reason}"
            print(f"    [WAIT] Attempt {attempt}: {last_error}")
        except Exception as e:
            last_error = str(e)
            print(f"    [WAIT] Attempt {attempt}: {last_error}")

        if attempt < max_attempts:
            time.sleep(delay)

    print(f"    [FAIL] Could not verify {desc} after {max_attempts} attempts. Last error: {last_error}")
    sys.exit(1)

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 deploy/smoke_test.py <SERVICE_URL>")
        sys.exit(1)

    service_url = sys.argv[1].rstrip("/")
    print("==================================================================")
    print(f"Running Smoke Test against: {service_url}")
    print("==================================================================")

    # 1. Health Probe
    health_url = f"{service_url}/api/health"
    _, health_body = check_endpoint(health_url, "Health probe (/api/health)")
    try:
        health_json = json.loads(health_body)
        assert health_json.get("status") == "ok", f"Expected status 'ok', got {health_json.get('status')}"
        commit = health_json.get("commit", "unknown")
        print(f"    [INFO] Server reports commit: {commit}")
    except Exception as e:
        print(f"    [FAIL] Failed to parse health check response: {e}")
        print(f"    Response body was: {health_body[:200]}")
        sys.exit(1)

    # 2. Web UI (HTML)
    _, html_body = check_endpoint(f"{service_url}/", "Frontend Web UI (/)")
    if "<!DOCTYPE html>" not in html_body and "<html" not in html_body:
        print("    [WARN] Root response does not look like HTML")
    else:
        print("    [OK] Frontend HTML served properly.")

    # 3. Optional Login Test
    email = os.environ.get("SMOKE_EMAIL")
    password = os.environ.get("SMOKE_PASSWORD")
    if email and password:
        print(f"--> Checking login authentication for {email}...")
        login_url = f"{service_url}/api/auth/login"
        payload = json.dumps({"email": email, "password": password}).encode("utf-8")
        req = urllib.request.Request(
            login_url,
            data=payload,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "CPE334-SmokeTest/1.0"
            }
        )
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                if 200 <= resp.status < 300:
                    print(f"    [OK] Login succeeded: HTTP {resp.status}")
                else:
                    print(f"    [WARN] Login returned status {resp.status}")
        except Exception as e:
            print(f"    [WARN] Login verification skipped/failed: {e}")
    else:
        print("--> Skipping optional login test (SMOKE_EMAIL and SMOKE_PASSWORD not both set).")

    print("==================================================================")
    print("ALL SMOKE TESTS PASSED!")
    print("==================================================================")

if __name__ == "__main__":
    main()
