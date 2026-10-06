/**
 * Generate a large sample of point-redemption simulations and verify that
 * every challenge is renderable, answerable, and physically reachable.
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const BASE = path.dirname(__dirname);
const sandbox = {
  console,
  Math,
  Object,
  Array,
  JSON,
  String,
  Number,
  Set,
  Map,
  window: {}
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

for (const file of ["data/recovery_engine.js"]) {
  vm.runInContext(fs.readFileSync(path.join(BASE, file), "utf8"), sandbox, {
    filename: file
  });
}

const engine = sandbox.window.RecoveryEngine;
const expectedTypes = new Set(["cannon", "drift", "coaster", "harmonic", "torque"]);
const failures = [];
const counts = new Map();

function fail(message) {
  if (failures.length < 20) failures.push(message);
}

for (const course of ["app1", "appc"]) {
  for (let unit = 1; unit <= 8; unit++) {
    for (const format of ["sim"]) {
      for (let i = 0; i < 1000; i++) {
        const challenge = engine.generateChallenge(course, unit, format);
        const label = `${course}/unit-${unit}/${challenge.simType}`;
        counts.set(label, (counts.get(label) || 0) + 1);

        if (!expectedTypes.has(challenge.simType)) {
          fail(`${label}: unknown simulation type`);
        }
        if (!challenge.prompt || !Array.isArray(challenge.choices) || challenge.choices.length !== 4) {
          fail(`${label}: malformed prompt or choices`);
        }
        if (!challenge.choices || challenge.choices.filter(choice => choice.isCorrect).length !== 1) {
          fail(`${label}: expected exactly one correct choice`);
        }

        const d = challenge.simData || {};
        if (challenge.simType === "cannon") {
          const angle = d.angle * Math.PI / 180;
          const range = d.v0 * d.v0 * Math.sin(2 * angle) / d.g;
          if (!(d.photogateX > 0 && d.photogateX < range)) {
            fail(`${label}: photogate is not before landing`);
          }
        } else if (challenge.simType === "drift") {
          const vSquared = d.vA * d.vA - 2 * d.mu * d.g * d.L;
          if (!(vSquared > 0)) {
            fail(`${label}: friction challenge stops before gate B`);
          }
        } else if (challenge.simType === "coaster") {
          if (!(d.H >= 2.5 * d.R)) {
            fail(`${label}: release height is below loop-contact threshold`);
          }
        } else if (challenge.simType === "harmonic") {
          if (!(d.m > 0 && d.k > 0 && d.x0 > 0)) {
            fail(`${label}: invalid oscillator parameters`);
          }
        } else if (challenge.simType === "torque") {
          const ideal = (d.m1 * d.xFulcrum - d.Mbeam * (d.L / 2 - d.xFulcrum)) / d.m2;
          if (!(ideal >= 1 && ideal <= d.L - d.xFulcrum)) {
            fail(`${label}: balance point is outside slider range`);
          }
        }
      }
    }
  }
}

console.log("Simulation sample coverage:");
for (const [label, count] of [...counts].sort()) {
  console.log(`  ${label}: ${count}`);
}
if (failures.length) {
  console.error("\nSimulation audit failed:");
  failures.forEach(message => console.error(`  - ${message}`));
  process.exit(1);
}
console.log("\nAll sampled point-redemption simulations are renderable and physically reachable.");
