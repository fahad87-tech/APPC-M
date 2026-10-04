/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("aa_coll_0000002")

  collection.createRule = ""
  collection.updateRule = ""
  collection.deleteRule = ""

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "kgsmjzxh",
    "name": "assessment_title",
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

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "6mjvcadb",
    "name": "unit",
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

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "wzsxsieq",
    "name": "class_period",
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

  collection.createRule = "@request.auth.id != ''"
  collection.updateRule = "@request.auth.id != ''"
  collection.deleteRule = "@request.auth.id != ''"

  // remove
  collection.schema.removeField("kgsmjzxh")

  // remove
  collection.schema.removeField("6mjvcadb")

  // remove
  collection.schema.removeField("wzsxsieq")

  return dao.saveCollection(collection)
})
