"""
push_keys_to_pocketbase.py — Seed Official Answer Keys to PocketBase

Reads data/answer_keys.json and seeds or updates all 106 assessment
records in the PocketBase collection `answer_keys`.

Supports:
  1. Direct local SQLite seeding (fastest, 0 credentials needed for localhost):
     python scripts/push_keys_to_pocketbase.py --local
  2. Remote REST API seeding (for cloud instances like Fly.io / Railway):
     python scripts/push_keys_to_pocketbase.py --url https://your-pb.fly.dev --email admin@example.com --password YourPassword
"""

import os
import sys
import json
import secrets
import string
import datetime
import argparse
import urllib.request
import urllib.error

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
KEYS_JSON_PATH = os.path.join(PROJECT_DIR, "data", "answer_keys.json")
LOCAL_DB_PATH = os.path.join(PROJECT_DIR, "pocketbase", "pb_data", "data.db")


def seed_local_sqlite(keys_db):
    import sqlite3
    if not os.path.exists(LOCAL_DB_PATH):
        print(f"[!] Local database not found at {LOCAL_DB_PATH}. Run pocketbase first!")
        return False

    print(f"[*] Seeding directly into local SQLite database: {LOCAL_DB_PATH} ...")
    conn = sqlite3.connect(LOCAL_DB_PATH)
    c = conn.cursor()

    alphabet = string.ascii_lowercase + string.digits
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S.000Z")

    inserted = 0
    for a_id, item in keys_db.items():
        c.execute("SELECT id FROM answer_keys WHERE assessment_id = ?", (a_id,))
        existing = c.fetchone()
        keys_json = json.dumps(item.get("keys", []), ensure_ascii=False)
        if existing:
            c.execute("UPDATE answer_keys SET subject = ?, unit = ?, keys = ?, updated = ? WHERE assessment_id = ?",
                      (item.get("subject", ""), item.get("unit", ""), keys_json, now, a_id))
        else:
            rec_id = "".join(secrets.choice(alphabet) for _ in range(15))
            c.execute("INSERT INTO answer_keys (id, assessment_id, subject, unit, keys, created, updated) VALUES (?, ?, ?, ?, ?, ?, ?)",
                      (rec_id, a_id, item.get("subject", ""), item.get("unit", ""), keys_json, now, now))
        inserted += 1

    conn.commit()
    conn.close()
    print(f"[✓] SUCCESS: Seeded all {inserted} assessments into answer_keys table!")
    return True


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
    parser = argparse.ArgumentParser(description="Seed Answer Keys into PocketBase Enclave")
    parser.add_argument("--local", action="store_true", help="Seed directly into local SQLite database (no auth required)")
    parser.add_argument("--url", default=os.getenv("POCKETBASE_URL", "http://127.0.0.1:8090"), help="PocketBase URL")
    parser.add_argument("--email", default=os.getenv("POCKETBASE_ADMIN_EMAIL", "739156332@qq.com"), help="Admin / Teacher Email")
    parser.add_argument("--password", default=os.getenv("POCKETBASE_ADMIN_PASSWORD", ""), help="Admin / Teacher Password")
    args = parser.parse_args()

    print("=" * 70)
    print("VectorSelect — PocketBase Key Enclave Seeder")
    print("=" * 70)

    if not os.path.exists(KEYS_JSON_PATH):
        raise FileNotFoundError(f"Missing {KEYS_JSON_PATH}. Run scripts/ingest_assignments.py first!")

    with open(KEYS_JSON_PATH, "r", encoding="utf-8") as f:
        keys_db = json.load(f)

    # Prefer local SQLite if requested or if localhost without password provided
    if args.local or (args.url.startswith("http://127.0.0.1") and not args.password):
        if os.path.exists(LOCAL_DB_PATH):
            success = seed_local_sqlite(keys_db)
            if success:
                print("=" * 70)
                return

    base_url = args.url.rstrip("/")
    password = args.password
    if not password:
        password = input(f"Enter admin password for {args.email}: ").strip()

    # Authenticate as Admin
    auth_url = f"{base_url}/api/admins/auth-with-password"
    print(f"[*] Authenticating with PocketBase Admin API at {auth_url}...")
    try:
        auth_resp = make_request(auth_url, method="POST", data={"identity": args.email, "password": password})
        token = auth_resp.get("token")
        if not token:
            raise RuntimeError("No token returned in auth response.")
        print("[✓] Admin authentication successful!")
    except Exception as e:
        print(f"[✗] Authentication failed: {e}")
        sys.exit(1)

    headers = {"Authorization": token}
    records_url = f"{base_url}/api/collections/answer_keys/records"

    success_count = 0
    fail_count = 0

    print(f"[*] Seeding {len(keys_db)} assessment keys into PocketBase...")

    for a_id, item in keys_db.items():
        payload = {
            "assessment_id": a_id,
            "subject": item.get("subject", ""),
            "unit": item.get("unit", ""),
            "keys": item.get("keys", [])
        }

        query_url = f"{records_url}?filter=(assessment_id='{a_id}')"
        try:
            existing = make_request(query_url, headers=headers)
            items = existing.get("items", [])
            if items:
                rec_id = items[0]["id"]
                patch_url = f"{records_url}/{rec_id}"
                make_request(patch_url, method="PATCH", headers=headers, data=payload)
            else:
                make_request(records_url, method="POST", headers=headers, data=payload)
            success_count += 1
            if success_count % 20 == 0 or success_count == len(keys_db):
                print(f"    -> Progress: {success_count}/{len(keys_db)} assessments synced.")
        except Exception as err:
            print(f"[!] Error seeding {a_id}: {err}")
            fail_count += 1

    print("-" * 70)
    print(f"[✓] Completed Seeding: {success_count} synced, {fail_count} errors.")
    print("=" * 70)


if __name__ == "__main__":
    main()
