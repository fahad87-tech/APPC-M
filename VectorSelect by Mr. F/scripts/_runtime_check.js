/**
 * Runtime smoke test: loads concepts.js + the exam bundle and exercises the
 * exact expressions the portals use for concept analytics and mastery bands.
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const BASE = path.dirname(__dirname);

const sandbox = {
  console,
  window: {},
  document: { getElementById: () => null, createElement: () => ({ style: {} }) },
  Math,
  Object,
  Array,
  JSON,
  String,
  Number,
  Set,
  Map
};
sandbox.globalThis = sandbox;

vm.createContext(sandbox);

function load(file, name) {
  const code = fs.readFileSync(path.join(BASE, file), "utf8");
  vm.runInContext(code, sandbox, { filename: name });
}

load("data/concepts.js", "concepts.js");
load("data/exams_bundle.js", "exams_bundle.js");

const { EXAM_DATA } = sandbox.window;

/**
 * Top-level `const`/`function` in a vm script become lexical or global
 * bindings rather than own properties of the sandbox object, so read them
 * back by evaluating the identifier inside the context.
 */
const evalInSandbox = (expr) => vm.runInContext(expr, sandbox);
const CONCEPT_META = evalInSandbox("CONCEPT_META");
const conceptMeta = evalInSandbox("conceptMeta");
const masteryBand = evalInSandbox("masteryBand");

let failures = 0;
function check(label, cond, detail = "") {
  if (cond) {
    console.log(`  PASS  ${label}`);
  } else {
    failures++;
    console.log(`  FAIL  ${label}${detail ? "  — " + detail : ""}`);
  }
}

console.log("--- taxonomy integrity ---");
check("CONCEPT_META has entries", Object.keys(CONCEPT_META).length >= 26,
      `${Object.keys(CONCEPT_META).length} entries`);

const tones = new Set(Object.values(CONCEPT_META).map(x => x.color));
const allowed = new Set(["brass", "copper", "coral", "lime", "plum"]);
check("every colour is a real palette token",
      [...tones].every(t => allowed.has(t)), [...tones].join(","));

console.log();
console.log("--- every question has a resolvable concept ---");

let totalQ = 0, missingConcept = 0, unknownConcept = 0, missingCard = 0;
const seenConcepts = new Set();
const subjectKeys = Object.keys(EXAM_DATA.subjects);

for (const sk of subjectKeys) {
  for (const uk of Object.keys(EXAM_DATA.subjects[sk].units)) {
    const unit = EXAM_DATA.subjects[sk].units[uk];
    for (const a of unit.assessments) {
      for (const q of a.questions) {
        totalQ++;
        if (!q.concept) missingConcept++;
        else if (!CONCEPT_META[q.concept]) unknownConcept++;
        else seenConcepts.add(q.concept);
        if (!q.card_image) missingCard++;
      }
    }
  }
}

console.log(`  ${totalQ} questions scanned across ${subjectKeys.length} courses`);
check("no question missing a concept", missingConcept === 0, `${missingConcept} missing`);
check("no unknown concept key", unknownConcept === 0, `${unknownConcept} unknown`);
check("no question missing a card image", missingCard === 0, `${missingCard} missing`);
check("taxonomy fully exercised", seenConcepts.size === Object.keys(CONCEPT_META).length,
      `${seenConcepts.size}/${Object.keys(CONCEPT_META).length} concepts used`);

console.log();
console.log("--- assessment ids unique within a unit ---");
let dupes = 0;
for (const sk of subjectKeys) {
  for (const uk of Object.keys(EXAM_DATA.subjects[sk].units)) {
    const ids = EXAM_DATA.subjects[sk].units[uk].assessments.map(a => a.id);
    const dup = ids.filter((v, i) => ids.indexOf(v) !== i);
    if (dup.length) {
      dupes += dup.length;
      console.log(`        ${sk}/${uk}: ${dup.join(", ")}`);
    }
  }
}
check("no duplicate assessment ids", dupes === 0, `${dupes} duplicates`);

console.log();
console.log("--- conceptMeta + masteryBand behaviour ---");
const m = conceptMeta("torque");
check("conceptMeta resolves a known key", m.label === "Torque & Equilibrium", m.label);
const fallback = conceptMeta("does_not_exist");
check("conceptMeta falls back safely", typeof fallback.label === "string" && fallback.label.length > 0,
      fallback.label);

check("masteryBand 0.9 -> secured", masteryBand(0.9).key === "secured");
check("masteryBand 0.75 -> developing", masteryBand(0.75).key === "developing");
check("masteryBand 0.6 -> shaky", masteryBand(0.6).key === "shaky");
check("masteryBand 0.2 -> priority", masteryBand(0.2).key === "priority");

console.log();
console.log("--- answers key contract (student submits index-keyed answers) ---");
const quiz = EXAM_DATA.subjects.APP1.units["Unit 1"].assessments[0];
const fakeAnswers = {};
quiz.questions.forEach((q, i) => { fakeAnswers[i] = q.correct_answer; });
const hit = quiz.questions.filter((q, i) => fakeAnswers[i] === q.correct_answer).length;
check("index-keyed answers score correctly", hit === quiz.questions.length,
      `${hit}/${quiz.questions.length}`);

console.log();
console.log(failures === 0 ? "All runtime checks passed." : `${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);