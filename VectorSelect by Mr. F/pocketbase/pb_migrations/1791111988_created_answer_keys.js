/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "ak_coll_0000001",
    "created": "2026-10-04 11:06:28.480Z",
    "updated": "2026-10-04 11:06:28.480Z",
    "name": "answer_keys",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "fld_ak_aid",
        "name": "assessment_id",
        "type": "text",
        "required": true,
        "presentable": true,
        "unique": false,
        "options": {
          "min": 1,
          "max": 120,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "fld_ak_sub",
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
        "id": "fld_ak_uni",
        "name": "unit",
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
        "id": "fld_ak_key",
        "name": "keys",
        "type": "json",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSize": 2000000
        }
      }
    ],
    "indexes": [
      "CREATE UNIQUE INDEX `idx_ak_assessment_id` ON `answer_keys` (`assessment_id`)"
    ],
    "listRule": "@request.auth.id != ''",
    "viewRule": "@request.auth.id != ''",
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("ak_coll_0000001");

  return dao.deleteCollection(collection);
})
