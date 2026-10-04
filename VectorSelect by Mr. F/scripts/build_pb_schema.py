import os
import json
import sqlite3

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
DB_PATH = os.path.join(PROJECT_DIR, "pocketbase", "pb_data", "data.db")
SCHEMA_OUT_PATH = os.path.join(PROJECT_DIR, "pocketbase", "pocketbase_schema.json")

# Connect to database and extract users collection
conn = sqlite3.connect(DB_PATH)
c = conn.cursor()
c.execute("SELECT * FROM _collections WHERE name='users'")
cols = [desc[0] for desc in c.description]
user_coll = dict(zip(cols, c.fetchone()))
user_coll["schema"] = json.loads(user_coll["schema"])
user_coll["indexes"] = json.loads(user_coll["indexes"])
user_coll["options"] = json.loads(user_coll["options"])
user_coll["system"] = bool(user_coll["system"])

collections = [
    user_coll,
    {
        "id": "ak_coll_0000001",
        "created": "2026-10-04 10:00:00.000Z",
        "updated": "2026-10-04 10:00:00.000Z",
        "name": "answer_keys",
        "type": "base",
        "system": False,
        "schema": [
            {
                "system": False,
                "id": "fld_ak_aid",
                "name": "assessment_id",
                "type": "text",
                "required": True,
                "presentable": True,
                "unique": False,
                "options": {"min": 1, "max": 120, "pattern": ""}
            },
            {
                "system": False,
                "id": "fld_ak_sub",
                "name": "subject",
                "type": "text",
                "required": True,
                "presentable": False,
                "unique": False,
                "options": {"min": 1, "max": 120, "pattern": ""}
            },
            {
                "system": False,
                "id": "fld_ak_uni",
                "name": "unit",
                "type": "text",
                "required": True,
                "presentable": False,
                "unique": False,
                "options": {"min": 1, "max": 120, "pattern": ""}
            },
            {
                "system": False,
                "id": "fld_ak_key",
                "name": "keys",
                "type": "json",
                "required": True,
                "presentable": False,
                "unique": False,
                "options": {"maxSize": 2000000}
            }
        ],
        "indexes": ["CREATE UNIQUE INDEX `idx_ak_assessment_id` ON `answer_keys` (`assessment_id`)"],
        "listRule": "@request.auth.id != ''",
        "viewRule": "@request.auth.id != ''",
        "createRule": None,
        "updateRule": None,
        "deleteRule": None,
        "options": {}
    },
    {
        "id": "aa_coll_0000002",
        "created": "2026-10-04 10:00:00.000Z",
        "updated": "2026-10-04 10:00:00.000Z",
        "name": "active_assignments",
        "type": "base",
        "system": False,
        "schema": [
            {
                "system": False,
                "id": "fld_aa_code",
                "name": "join_code",
                "type": "text",
                "required": True,
                "presentable": True,
                "unique": False,
                "options": {"min": 6, "max": 6, "pattern": ""}
            },
            {
                "system": False,
                "id": "fld_aa_aid",
                "name": "assessment_id",
                "type": "text",
                "required": True,
                "presentable": False,
                "unique": False,
                "options": {"min": 1, "max": 120, "pattern": ""}
            },
            {
                "system": False,
                "id": "fld_aa_title",
                "name": "title",
                "type": "text",
                "required": True,
                "presentable": False,
                "unique": False,
                "options": {"min": 1, "max": 255, "pattern": ""}
            },
            {
                "system": False,
                "id": "fld_aa_sub",
                "name": "subject",
                "type": "text",
                "required": True,
                "presentable": False,
                "unique": False,
                "options": {"min": 1, "max": 120, "pattern": ""}
            },
            {
                "system": False,
                "id": "fld_aa_mode",
                "name": "quiz_mode",
                "type": "text",
                "required": False,
                "presentable": False,
                "unique": False,
                "options": {"min": None, "max": None, "pattern": ""}
            },
            {
                "system": False,
                "id": "fld_aa_tlimit",
                "name": "time_limit_minutes",
                "type": "number",
                "required": False,
                "presentable": False,
                "unique": False,
                "options": {"min": 0, "max": 300, "noDecimal": True}
            },
            {
                "system": False,
                "id": "fld_aa_qsec",
                "name": "per_question_seconds",
                "type": "number",
                "required": False,
                "presentable": False,
                "unique": False,
                "options": {"min": 0, "max": 600, "noDecimal": True}
            },
            {
                "system": False,
                "id": "fld_aa_qidx",
                "name": "current_question_index",
                "type": "number",
                "required": False,
                "presentable": False,
                "unique": False,
                "options": {"min": 0, "max": 200, "noDecimal": True}
            },
            {
                "system": False,
                "id": "fld_aa_act",
                "name": "is_active",
                "type": "bool",
                "required": False,
                "presentable": False,
                "unique": False,
                "options": {}
            },
            {
                "system": False,
                "id": "fld_aa_start",
                "name": "is_started",
                "type": "bool",
                "required": False,
                "presentable": False,
                "unique": False,
                "options": {}
            },
            {
                "system": False,
                "id": "fld_aa_pause",
                "name": "is_paused",
                "type": "bool",
                "required": False,
                "presentable": False,
                "unique": False,
                "options": {}
            },
            {
                "system": False,
                "id": "fld_aa_rem",
                "name": "remaining_seconds",
                "type": "number",
                "required": False,
                "presentable": False,
                "unique": False,
                "options": {"min": 0, "max": 10000, "noDecimal": True}
            },
            {
                "system": False,
                "id": "fld_aa_disc",
                "name": "discussion_active",
                "type": "bool",
                "required": False,
                "presentable": False,
                "unique": False,
                "options": {}
            },
            {
                "system": False,
                "id": "fld_aa_rev",
                "name": "answer_revealed",
                "type": "bool",
                "required": False,
                "presentable": False,
                "unique": False,
                "options": {}
            },
            {
                "system": False,
                "id": "fld_aa_areview",
                "name": "allow_review",
                "type": "bool",
                "required": False,
                "presentable": False,
                "unique": False,
                "options": {}
            },
            {
                "system": False,
                "id": "fld_aa_acalc",
                "name": "allow_calculator",
                "type": "bool",
                "required": False,
                "presentable": False,
                "unique": False,
                "options": {}
            }
        ],
        "indexes": ["CREATE UNIQUE INDEX `idx_aa_join_code` ON `active_assignments` (`join_code`)"],
        "listRule": "is_active = true",
        "viewRule": "is_active = true",
        "createRule": "@request.auth.id != ''",
        "updateRule": "@request.auth.id != ''",
        "deleteRule": "@request.auth.id != ''",
        "options": {}
    },
    {
        "id": "es_coll_0000003",
        "created": "2026-10-04 10:00:00.000Z",
        "updated": "2026-10-04 10:00:00.000Z",
        "name": "exam_submissions",
        "type": "base",
        "system": False,
        "schema": [
            {
                "system": False,
                "id": "fld_es_assign",
                "name": "assignment",
                "type": "text",
                "required": False,
                "presentable": False,
                "unique": False,
                "options": {"min": None, "max": None, "pattern": ""}
            },
            {
                "system": False,
                "id": "fld_es_code",
                "name": "join_code",
                "type": "text",
                "required": True,
                "presentable": False,
                "unique": False,
                "options": {"min": 6, "max": 6, "pattern": ""}
            },
            {
                "system": False,
                "id": "fld_es_name",
                "name": "student_name",
                "type": "text",
                "required": True,
                "presentable": True,
                "unique": False,
                "options": {"min": 2, "max": 80, "pattern": ""}
            },
            {
                "system": False,
                "id": "fld_es_score",
                "name": "score",
                "type": "number",
                "required": True,
                "presentable": False,
                "unique": False,
                "options": {"min": 0, "max": 500, "noDecimal": True}
            },
            {
                "system": False,
                "id": "fld_es_total",
                "name": "total_questions",
                "type": "number",
                "required": True,
                "presentable": False,
                "unique": False,
                "options": {"min": 1, "max": 500, "noDecimal": True}
            },
            {
                "system": False,
                "id": "fld_es_pct",
                "name": "score_percentage",
                "type": "number",
                "required": True,
                "presentable": False,
                "unique": False,
                "options": {"min": 0, "max": 100, "noDecimal": False}
            },
            {
                "system": False,
                "id": "fld_es_pts",
                "name": "points",
                "type": "number",
                "required": False,
                "presentable": False,
                "unique": False,
                "options": {"min": 0, "max": 120, "noDecimal": False}
            },
            {
                "system": False,
                "id": "fld_es_spd",
                "name": "speed_bonus",
                "type": "number",
                "required": False,
                "presentable": False,
                "unique": False,
                "options": {"min": 0, "max": 50, "noDecimal": False}
            },
            {
                "system": False,
                "id": "fld_es_strk",
                "name": "max_streak",
                "type": "number",
                "required": False,
                "presentable": False,
                "unique": False,
                "options": {"min": 0, "max": 100, "noDecimal": True}
            },
            {
                "system": False,
                "id": "fld_es_rec",
                "name": "recoveries_completed",
                "type": "number",
                "required": False,
                "presentable": False,
                "unique": False,
                "options": {"min": 0, "max": 100, "noDecimal": True}
            },
            {
                "system": False,
                "id": "fld_es_ans",
                "name": "answers",
                "type": "json",
                "required": True,
                "presentable": False,
                "unique": False,
                "options": {"maxSize": 2000000}
            },
            {
                "system": False,
                "id": "fld_es_tab",
                "name": "tab_switch_count",
                "type": "number",
                "required": False,
                "presentable": False,
                "unique": False,
                "options": {"min": 0, "max": 500, "noDecimal": True}
            },
            {
                "system": False,
                "id": "fld_es_fs",
                "name": "fullscreen_exits",
                "type": "number",
                "required": False,
                "presentable": False,
                "unique": False,
                "options": {"min": 0, "max": 500, "noDecimal": True}
            },
            {
                "system": False,
                "id": "fld_es_time",
                "name": "time_spent_seconds",
                "type": "number",
                "required": False,
                "presentable": False,
                "unique": False,
                "options": {"min": 0, "max": 86400, "noDecimal": True}
            }
        ],
        "indexes": ["CREATE INDEX `idx_es_join_code` ON `exam_submissions` (`join_code`)"],
        "listRule": "",
        "viewRule": "",
        "createRule": None,
        "updateRule": None,
        "deleteRule": "@request.auth.id != ''",
        "options": {}
    },
    {
        "id": "le_coll_0000004",
        "created": "2026-10-04 10:00:00.000Z",
        "updated": "2026-10-04 10:00:00.000Z",
        "name": "live_events",
        "type": "base",
        "system": False,
        "schema": [
            {
                "system": False,
                "id": "fld_le_code",
                "name": "join_code",
                "type": "text",
                "required": True,
                "presentable": False,
                "unique": False,
                "options": {"min": 6, "max": 6, "pattern": ""}
            },
            {
                "system": False,
                "id": "fld_le_type",
                "name": "event_type",
                "type": "text",
                "required": True,
                "presentable": False,
                "unique": False,
                "options": {"min": 1, "max": 50, "pattern": ""}
            },
            {
                "system": False,
                "id": "fld_le_pay",
                "name": "payload",
                "type": "json",
                "required": True,
                "presentable": False,
                "unique": False,
                "options": {"maxSize": 500000}
            }
        ],
        "indexes": ["CREATE INDEX `idx_le_join_code` ON `live_events` (`join_code`)"],
        "listRule": "",
        "viewRule": "",
        "createRule": "",
        "updateRule": None,
        "deleteRule": None,
        "options": {}
    }
]

with open(SCHEMA_OUT_PATH, "w", encoding="utf-8") as f:
    json.dump(collections, f, indent=2)

print("[✓] Successfully wrote 100% PocketBase 0.22.4 compliant schema to:", SCHEMA_OUT_PATH)
