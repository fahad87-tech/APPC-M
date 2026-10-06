/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db);

  // 1. scoring_classes
  const classes = new Collection({
    id: "sc_coll_classes01",
    name: "scoring_classes",
    type: "base",
    system: false,
    schema: [
      { system: false, id: "fld_sc_cname", name: "name", type: "text", required: true, presentable: true, unique: true, options: { min: 1, max: 100, pattern: "" } },
      { system: false, id: "fld_sc_cperiod", name: "period", type: "text", required: false, presentable: false, unique: false, options: { min: null, max: 50, pattern: "" } },
      { system: false, id: "fld_sc_cyear", name: "academic_year", type: "text", required: false, presentable: false, unique: false, options: { min: null, max: 20, pattern: "" } },
      { system: false, id: "fld_sc_croster", name: "roster", type: "json", required: false, presentable: false, unique: false, options: { maxSize: 2000000 } },
      { system: false, id: "fld_sc_csort", name: "sort_order", type: "json", required: false, presentable: false, unique: false, options: { maxSize: 2000000 } }
    ],
    indexes: [],
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''",
    options: {}
  });
  dao.saveCollection(classes);

  // 2. scoring_assignments
  const assignments = new Collection({
    id: "sc_coll_assign01",
    name: "scoring_assignments",
    type: "base",
    system: false,
    schema: [
      { system: false, id: "fld_sa_cname", name: "class_name", type: "text", required: true, presentable: true, unique: false, options: { min: 1, max: 100, pattern: "" } },
      { system: false, id: "fld_sa_title", name: "title", type: "text", required: true, presentable: true, unique: false, options: { min: 1, max: 200, pattern: "" } },
      { system: false, id: "fld_sa_date", name: "date", type: "date", required: false, presentable: false, unique: false, options: { min: "", max: "" } },
      { system: false, id: "fld_sa_mode", name: "mode", type: "select", required: true, presentable: false, unique: false, options: { maxSelect: 1, values: ["ap", "formula"] } },
      { system: false, id: "fld_sa_maxraw", name: "max_raw", type: "number", required: false, presentable: false, unique: false, options: { min: 0, max: 1000, noDecimal: false } },
      { system: false, id: "fld_sa_formula", name: "formula", type: "text", required: false, presentable: false, unique: false, options: { min: null, max: 500, pattern: "" } },
      { system: false, id: "fld_sa_cats", name: "categories_config", type: "json", required: false, presentable: false, unique: false, options: { maxSize: 2000000 } },
      { system: false, id: "fld_sa_bands", name: "bands_config", type: "json", required: false, presentable: false, unique: false, options: { maxSize: 2000000 } },
      { system: false, id: "fld_sa_vslink", name: "linked_vectorselect_code", type: "text", required: false, presentable: false, unique: false, options: { min: null, max: 50, pattern: "" } }
    ],
    indexes: [],
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''",
    options: {}
  });
  dao.saveCollection(assignments);

  // 3. scoring_records
  const records = new Collection({
    id: "sc_coll_recs0001",
    name: "scoring_records",
    type: "base",
    system: false,
    schema: [
      { system: false, id: "fld_sr_aid", name: "assignment_id", type: "text", required: false, presentable: false, unique: false, options: { min: null, max: 50, pattern: "" } },
      { system: false, id: "fld_sr_cname", name: "class_name", type: "text", required: true, presentable: false, unique: false, options: { min: 1, max: 100, pattern: "" } },
      { system: false, id: "fld_sr_sid", name: "student_id", type: "text", required: true, presentable: false, unique: false, options: { min: 1, max: 100, pattern: "" } },
      { system: false, id: "fld_sr_sname", name: "student_name", type: "text", required: true, presentable: true, unique: false, options: { min: 1, max: 100, pattern: "" } },
      { system: false, id: "fld_sr_mcq", name: "mcq", type: "text", required: false, presentable: false, unique: false, options: { min: null, max: 20, pattern: "" } },
      { system: false, id: "fld_sr_fib", name: "fib", type: "text", required: false, presentable: false, unique: false, options: { min: null, max: 20, pattern: "" } },
      { system: false, id: "fld_sr_sa", name: "sa", type: "text", required: false, presentable: false, unique: false, options: { min: null, max: 20, pattern: "" } },
      { system: false, id: "fld_sr_frq", name: "frq", type: "text", required: false, presentable: false, unique: false, options: { min: null, max: 20, pattern: "" } },
      { system: false, id: "fld_sr_raw", name: "raw_score", type: "number", required: false, presentable: false, unique: false, options: { min: null, max: null, noDecimal: false } },
      { system: false, id: "fld_sr_rawpct", name: "raw_pct", type: "number", required: false, presentable: false, unique: false, options: { min: null, max: null, noDecimal: false } },
      { system: false, id: "fld_sr_curved", name: "curved_pct", type: "number", required: false, presentable: false, unique: false, options: { min: null, max: null, noDecimal: false } },
      { system: false, id: "fld_sr_ap", name: "ap_score", type: "number", required: false, presentable: false, unique: false, options: { min: 1, max: 5, noDecimal: true } },
      { system: false, id: "fld_sr_mode", name: "mode", type: "text", required: false, presentable: false, unique: false, options: { min: null, max: 20, pattern: "" } },
      { system: false, id: "fld_sr_roword", name: "row_order", type: "number", required: false, presentable: false, unique: false, options: { min: null, max: null, noDecimal: true } }
    ],
    indexes: [],
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''",
    options: {}
  });
  dao.saveCollection(records);

  // 4. scoring_presets
  const presets = new Collection({
    id: "sc_coll_preset01",
    name: "scoring_presets",
    type: "base",
    system: false,
    schema: [
      { system: false, id: "fld_sp_name", name: "name", type: "text", required: true, presentable: true, unique: true, options: { min: 1, max: 100, pattern: "" } },
      { system: false, id: "fld_sp_type", name: "type", type: "select", required: true, presentable: false, unique: false, options: { maxSelect: 1, values: ["ap_bands", "formula"] } },
      { system: false, id: "fld_sp_data", name: "preset_data", type: "json", required: true, presentable: false, unique: false, options: { maxSize: 2000000 } },
      { system: false, id: "fld_sp_def", name: "is_default", type: "bool", required: false, presentable: false, unique: false, options: {} }
    ],
    indexes: [],
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''",
    options: {}
  });
  dao.saveCollection(presets);

}, (db) => {
  const dao = new Dao(db);
  ["sc_coll_classes01","sc_coll_assign01","sc_coll_recs0001","sc_coll_preset01"].forEach(id => {
    try { const c = dao.findCollectionByNameOrId(id); dao.deleteCollection(c); } catch(_) {}
  });
  return null;
});
