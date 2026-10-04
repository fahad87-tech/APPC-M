/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("aa_coll_0000002")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "v83qbrgm",
    "name": "enable_point_redemption",
    "type": "bool",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {}
  }))

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "mmc5bqxk",
    "name": "revealed_answer",
    "type": "text",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("aa_coll_0000002")

  // remove
  collection.schema.removeField("v83qbrgm")

  // remove
  collection.schema.removeField("mmc5bqxk")

  return dao.saveCollection(collection)
})
