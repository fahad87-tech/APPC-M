/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "es_coll_0000003",
    "created": "2026-10-04 11:06:28.480Z",
    "updated": "2026-10-04 11:06:28.480Z",
    "name": "exam_submissions",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "fld_es_assign",
        "name": "assignment",
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
        "id": "fld_es_code",
        "name": "join_code",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 6,
          "max": 6,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "fld_es_name",
        "name": "student_name",
        "type": "text",
        "required": true,
        "presentable": true,
        "unique": false,
        "options": {
          "min": 2,
          "max": 80,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "fld_es_score",
        "name": "score",
        "type": "number",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": 500,
          "noDecimal": true
        }
      },
      {
        "system": false,
        "id": "fld_es_total",
        "name": "total_questions",
        "type": "number",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 1,
          "max": 500,
          "noDecimal": true
        }
      },
      {
        "system": false,
        "id": "fld_es_pct",
        "name": "score_percentage",
        "type": "number",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": 100,
          "noDecimal": false
        }
      },
      {
        "system": false,
        "id": "fld_es_pts",
        "name": "points",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": 120,
          "noDecimal": false
        }
      },
      {
        "system": false,
        "id": "fld_es_spd",
        "name": "speed_bonus",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": 50,
          "noDecimal": false
        }
      },
      {
        "system": false,
        "id": "fld_es_strk",
        "name": "max_streak",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": 100,
          "noDecimal": true
        }
      },
      {
        "system": false,
        "id": "fld_es_rec",
        "name": "recoveries_completed",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": 100,
          "noDecimal": true
        }
      },
      {
        "system": false,
        "id": "fld_es_ans",
        "name": "answers",
        "type": "json",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSize": 2000000
        }
      },
      {
        "system": false,
        "id": "fld_es_tab",
        "name": "tab_switch_count",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": 500,
          "noDecimal": true
        }
      },
      {
        "system": false,
        "id": "fld_es_fs",
        "name": "fullscreen_exits",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": 500,
          "noDecimal": true
        }
      },
      {
        "system": false,
        "id": "fld_es_time",
        "name": "time_spent_seconds",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": 86400,
          "noDecimal": true
        }
      }
    ],
    "indexes": [
      "CREATE INDEX `idx_es_join_code` ON `exam_submissions` (`join_code`)"
    ],
    "listRule": "",
    "viewRule": "",
    "createRule": null,
    "updateRule": null,
    "deleteRule": "@request.auth.id != ''",
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("es_coll_0000003");

  return dao.deleteCollection(collection);
})
