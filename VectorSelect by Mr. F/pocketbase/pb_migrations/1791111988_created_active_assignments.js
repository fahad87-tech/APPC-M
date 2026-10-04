/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "aa_coll_0000002",
    "created": "2026-10-04 11:06:28.480Z",
    "updated": "2026-10-04 11:06:28.480Z",
    "name": "active_assignments",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "fld_aa_code",
        "name": "join_code",
        "type": "text",
        "required": true,
        "presentable": true,
        "unique": false,
        "options": {
          "min": 6,
          "max": 6,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "fld_aa_aid",
        "name": "assessment_id",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 1,
          "max": 120,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "fld_aa_title",
        "name": "title",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 1,
          "max": 255,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "fld_aa_sub",
        "name": "subject",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 1,
          "max": 120,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "fld_aa_mode",
        "name": "quiz_mode",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "fld_aa_tlimit",
        "name": "time_limit_minutes",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": 300,
          "noDecimal": true
        }
      },
      {
        "system": false,
        "id": "fld_aa_qsec",
        "name": "per_question_seconds",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": 600,
          "noDecimal": true
        }
      },
      {
        "system": false,
        "id": "fld_aa_qidx",
        "name": "current_question_index",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": 200,
          "noDecimal": true
        }
      },
      {
        "system": false,
        "id": "fld_aa_act",
        "name": "is_active",
        "type": "bool",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {}
      },
      {
        "system": false,
        "id": "fld_aa_start",
        "name": "is_started",
        "type": "bool",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {}
      },
      {
        "system": false,
        "id": "fld_aa_pause",
        "name": "is_paused",
        "type": "bool",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {}
      },
      {
        "system": false,
        "id": "fld_aa_rem",
        "name": "remaining_seconds",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": 10000,
          "noDecimal": true
        }
      },
      {
        "system": false,
        "id": "fld_aa_disc",
        "name": "discussion_active",
        "type": "bool",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {}
      },
      {
        "system": false,
        "id": "fld_aa_rev",
        "name": "answer_revealed",
        "type": "bool",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {}
      },
      {
        "system": false,
        "id": "fld_aa_areview",
        "name": "allow_review",
        "type": "bool",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {}
      },
      {
        "system": false,
        "id": "fld_aa_acalc",
        "name": "allow_calculator",
        "type": "bool",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {}
      }
    ],
    "indexes": [
      "CREATE UNIQUE INDEX `idx_aa_join_code` ON `active_assignments` (`join_code`)"
    ],
    "listRule": "is_active = true",
    "viewRule": "is_active = true",
    "createRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.id != ''",
    "deleteRule": "@request.auth.id != ''",
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("aa_coll_0000002");

  return dao.deleteCollection(collection);
})
