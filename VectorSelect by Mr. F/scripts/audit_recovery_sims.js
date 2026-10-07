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
const expectedTypes = new Set(["cannon", "drift", "force", "harmonic", "torque", "momentum", "rolling", "fluids"]);
const failures = [];
const counts = new Map();

function fail(message) {
  if (failures.length < 20) failures.push(message);
}

for (const course of ["app1", "appc"]) {
  for (let unit = 1; unit <= 8; unit++) {
    for (const format of ["sim"]) {
      for (let i = 0; i < 1000; i++) {
        const usedFingerprints = new Set();
        const challenge = engine.generateChallenge(course, unit, format, {
          coveredUnits: [unit],
          usedScenarioFingerprints: usedFingerprints
        });
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
        if (!challenge.scenarioFingerprint || usedFingerprints.has(challenge.scenarioFingerprint)) {
          fail(`${label}: missing or duplicate scenario fingerprint`);
        }
        usedFingerprints.add(challenge.scenarioFingerprint);
        if (course === "appc" && unit === 8) {
          if (challenge.servedUnitNum === 8 || challenge.simType === "fluids") {
            fail(`${label}: AP Physics C must exclude Unit 8 fluids`);
          }
          continue;
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
        } else if (challenge.simType === "momentum") {
          const v1 = ((d.m1 - d.restitution * d.m2) * d.u1 + (1 + d.restitution) * d.m2 * d.u2) / (d.m1 + d.m2);
          const v2 = ((d.m2 - d.restitution * d.m1) * d.u2 + (1 + d.restitution) * d.m1 * d.u1) / (d.m1 + d.m2);
          if (!(d.m1 > 0 && d.m2 > 0 && d.restitution >= 0 && d.restitution <= 1)) {
            fail(`${label}: invalid collision parameters`);
          }
          if (Math.abs(v1 - d.targetV1) > 1e-9 || !Number.isFinite(v2)) {
            fail(`${label}: collision target does not match apparatus equation`);
          }
        } else if (challenge.simType === "force") {
          const rad = d.theta * Math.PI / 180;
          const expected = (d.applied - d.m * d.g * Math.sin(rad) - d.mu * d.m * d.g * Math.cos(rad)) / d.m;
          if (!(d.m > 0 && d.applied > 0 && d.mu >= 0 && Math.abs(expected - d.targetAcceleration) < 1e-9)) {
            fail(`${label}: invalid force balance`);
          }
        } else if (challenge.simType === "rolling") {
          const expected = Math.sqrt(2 * d.g * d.height / (1 + d.inertiaFactor)) / d.radius;
          if (!(d.mass > 0 && d.radius > 0 && d.height > 0 && Math.abs(expected - d.targetOmega) < 1e-9)) {
            fail(`${label}: invalid rolling-energy target`);
          }
        } else if (challenge.simType === "fluids") {
          if (!(d.area1 > 0 && d.area2 > 0 && d.speed1 > 0 && Math.abs(d.area1 * d.speed1 - d.area2 * d.targetSpeed) < 1e-9)) {
            fail(`${label}: continuity target mismatch`);
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
