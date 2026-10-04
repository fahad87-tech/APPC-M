/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("aa_coll_0000002")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "fld_aa_prevans",
    "name": "previous_correct_answer",
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
  collection.schema.removeField("fld_aa_prevans")

  return dao.saveCollection(collection)
})
