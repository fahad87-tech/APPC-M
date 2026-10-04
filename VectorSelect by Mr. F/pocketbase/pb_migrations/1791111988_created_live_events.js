/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "le_coll_0000004",
    "created": "2026-10-04 11:06:28.480Z",
    "updated": "2026-10-04 11:06:28.480Z",
    "name": "live_events",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "fld_le_code",
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
        "id": "fld_le_type",
        "name": "event_type",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 1,
          "max": 50,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "fld_le_pay",
        "name": "payload",
        "type": "json",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSize": 500000
        }
      }
    ],
    "indexes": [
      "CREATE INDEX `idx_le_join_code` ON `live_events` (`join_code`)"
    ],
    "listRule": "",
    "viewRule": "",
    "createRule": "",
    "updateRule": null,
    "deleteRule": null,
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("le_coll_0000004");

  return dao.deleteCollection(collection);
})
