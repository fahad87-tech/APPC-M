"""
import_schema_to_pb.py — 1-Click Schema Importer for PocketBase

Authenticates as Admin and calls POST /api/collections/import
to apply pocketbase/pocketbase_schema.json instantly without copy-pasting.

Usage:
  python scripts/import_schema_to_pb.py --password YOUR_ADMIN_PASSWORD
"""

import os
import sys
import json
import argparse
import urllib.request
import urllib.error

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
SCHEMA_PATH = os.path.join(PROJECT_DIR, "pocketbase", "pocketbase_schema.json")


def make_request(url, method="GET", headers=None, data=None):
    if headers is None:
        headers = {}
    req_data = None
    if data is not None:
        req_data = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"

    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            body = resp.read().decode("utf-8")
            return json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            err_json = json.loads(body)
            raise RuntimeError(f"HTTP {e.code}: {err_json.get('message', body)}")
        except Exception:
            raise RuntimeError(f"HTTP {e.code}: {body}")


def main():
    parser = argparse.ArgumentParser(description="Import Schema into PocketBase")
    parser.add_argument("--url", default="http://127.0.0.1:8090", help="PocketBase URL")
    parser.add_argument("--email", default="739156332@qq.com", help="Admin Email")
    parser.add_argument("--password", required=False, help="Admin Password")
    args = parser.parse_args()

    base_url = args.url.rstrip("/")

    print("=" * 70)
    print("VectorSelect — PocketBase 1-Click Schema Importer")
    print("=" * 70)

    if not os.path.exists(SCHEMA_PATH):
        raise FileNotFoundError(f"Missing {SCHEMA_PATH}")

    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        collections = json.load(f)

    password = args.password
    if not password:
        password = input(f"Enter admin password for {args.email}: ").strip()

    # 1. Authenticate Admin
    auth_url = f"{base_url}/api/admins/auth-with-password"
    print(f"[*] Authenticating with PocketBase as {args.email}...")
    try:
        auth_resp = make_request(auth_url, method="POST", data={"identity": args.email, "password": password})
        token = auth_resp.get("token")
        if not token:
            raise RuntimeError("No token returned.")
        print("[✓] Admin authentication successful!")
    except Exception as e:
        print(f"[✗] Login failed: {e}")
        sys.exit(1)

    # 2. Import Collections
    import_url = f"{base_url}/api/collections/import"
    headers = {"Authorization": token}
    payload = {
        "collections": collections,
        "deleteMissing": False
    }

    print(f"[*] Importing {len(collections)} collections into PocketBase...")
    try:
        make_request(import_url, method="POST", headers=headers, data=payload)
        print("[✓] SUCCESS: All collections imported successfully!")
        print("    - answer_keys")
        print("    - active_assignments")
        print("    - exam_submissions")
        print("    - live_events")
        print("=" * 70)
    except Exception as e:
        print(f"[✗] Import failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
