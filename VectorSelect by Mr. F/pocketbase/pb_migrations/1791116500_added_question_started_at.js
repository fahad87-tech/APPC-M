/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("aa_coll_0000002")

  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "fld_aa_qstarted",
    "name": "question_started_at",
    "type": "text",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": 40,
      "pattern": ""
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("aa_coll_0000002")

  collection.schema.removeField("fld_aa_qstarted")

  return dao.saveCollection(collection)
})
