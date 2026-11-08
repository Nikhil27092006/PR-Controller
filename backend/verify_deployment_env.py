#!/usr/bin/env python3
"""
Pre-deployment Environment & Connectivity Verifier for PRFlow.
Run this script to ensure all production configuration variables are
properly set and that the external services (PostgreSQL, GitHub) are reachable.
"""

import sys
import requests
from sqlalchemy import create_engine, text

from app.config.settings import settings


def print_status(component: str, ok: bool, details: str = ""):
    badge = "[PASS]" if ok else "[FAIL]"
    print(f"{badge} {component:<25} : {details}")


def check_db():
    try:
        engine = create_engine(settings.DB_CONNECTION, connect_args={"connect_timeout": 5})
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print_status("PostgreSQL Database", True, "Successfully connected and executed test query")
        return True
    except Exception as exc:
        print_status("PostgreSQL Database", False, f"Connection failed: {exc}")
        return False


def check_github_token():
    token = (settings.GITHUB_TOKEN or "").strip()
    if not token or token == "PASTE_YOUR_NEW_TOKEN_HERE":
        print_status("GitHub Token", False, "GITHUB_TOKEN is missing or has placeholder value")
        return False

    try:
        resp = requests.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {token}", "User-Agent": "PRFlow-Verify"},
            timeout=5,
        )
        if resp.status_code == 200:
            user = resp.json().get("login", "unknown")
            print_status("GitHub Token", True, f"Valid token for GitHub user: @{user}")
            return True
        else:
            print_status("GitHub Token", False, f"GitHub returned HTTP {resp.status_code}")
            return False
    except Exception as exc:
        print_status("GitHub Token", False, f"Request failed: {exc}")
        return False


def check_secrets():
    all_ok = True
    if settings.SECRET_KEY in ("dev-only-change-this-secret-key", "your_super_secret_jwt_key_change_me_in_production"):
        print_status("JWT SECRET_KEY", False, "Using default development key! Change in production.")
        all_ok = False
    else:
        print_status("JWT SECRET_KEY", True, "Configured with custom secret")

    if not settings.SESSION_SECRET_KEY or settings.SESSION_SECRET_KEY == "dev-only-change-this-session-secret":
        print_status("SESSION_SECRET_KEY", False, "Using default development session key! Change in production.")
        all_ok = False
    else:
        print_status("SESSION_SECRET_KEY", True, "Configured with custom session key")

    return all_ok


def check_urls():
    all_ok = True
    print(f"\nConfiguration Check:")
    print(f"  - FRONTEND_URL       : {settings.FRONTEND_URL}")
    print(f"  - CORS_ORIGIN        : {settings.CORS_ORIGIN}")
    print(f"  - GITHUB_REDIRECT_URI: {settings.GITHUB_REDIRECT_URI}")
    print(f"  - GITHUB_CLIENT_ID   : {'[SET]' if settings.GITHUB_CLIENT_ID else '[NOT SET]'}")
    return all_ok


def main():
    print("=" * 60)
    print("      PRFlow Deployment Readiness Check")
    print("=" * 60)

    db_ok = check_db()
    gh_ok = check_github_token()
    sec_ok = check_secrets()
    check_urls()

    print("=" * 60)
    if db_ok and gh_ok and sec_ok:
        print("RESULT: Ready for production deployment!")
        sys.exit(0)
    else:
        print("RESULT: Please review failing checks above before deploying.")
        sys.exit(1)


if __name__ == "__main__":
    main()

