/**
 * Syntax-checks the inline <script> blocks in index.html and teacher.html,
 * and the shared data/concepts.js, using Node's parser.
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const BASE = path.dirname(__dirname);
const targets = ["index.html", "teacher.html"];

let failures = 0;

for (const file of targets) {
  const html = fs.readFileSync(path.join(BASE, file), "utf8");
  const blocks = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];

  blocks.forEach((m, i) => {
    const code = m[1];
    const label = `${file} inline block ${i + 1}`;
    if (!code.trim()) {
      console.log(`  skip  ${label} (empty)`);
      return;
    }
    try {
      new vm.Script(code, { filename: label });
      console.log(`  PASS  ${label}  (${code.split("\n").length} lines)`);
    } catch (err) {
      failures++;
      console.log(`  FAIL  ${label}`);
      console.log(`        ${err.message}`);
      const m2 = /:(\d+)$/.exec(err.stack?.split("\n")[0] || "");
      if (err.stack) {
        console.log(err.stack.split("\n").slice(1, 4).map(l => "        " + l.trim()).join("\n"));
      }
    }
  });
}

// concepts.js is a classic script; parse it as-is.
try {
  const code = fs.readFileSync(path.join(BASE, "data", "concepts.js"), "utf8");
  new vm.Script(code, { filename: "data/concepts.js" });
  console.log(`  PASS  data/concepts.js  (${code.split("\n").length} lines)`);
} catch (err) {
  failures++;
  console.log(`  FAIL  data/concepts.js\n        ${err.message}`);
}

// supabase_config.js too.
try {
  const code = fs.readFileSync(path.join(BASE, "supabase_config.js"), "utf8");
  new vm.Script(code, { filename: "supabase_config.js" });
  console.log(`  PASS  supabase_config.js  (${code.split("\n").length} lines)`);
} catch (err) {
  failures++;
  console.log(`  FAIL  supabase_config.js\n        ${err.message}`);
}

console.log();
console.log(failures === 0 ? "All scripts parse cleanly." : `${failures} block(s) failed to parse.`);
process.exit(failures === 0 ? 0 : 1);