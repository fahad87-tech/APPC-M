import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const isInsideStudentEdition = path.basename(rootDir) === 'student-edition';
const mainDir = isInsideStudentEdition ? path.resolve(rootDir, '..') : rootDir;
const studentDir = isInsideStudentEdition ? rootDir : path.join(rootDir, 'student-edition');

test('Marker Visibility & Acc/Dec Lines: UI Toggles in TrackerControls and AutotrackModal', async () => {
  // Check main app TrackerControls
  const trackerControls = fs.readFileSync(path.join(mainDir, 'src', 'components', 'Tracker', 'TrackerControls.tsx'), 'utf8');
  assert.ok(trackerControls.includes("onToggleVector('showDataMarkers')"), 'TrackerControls must have showDataMarkers toggle');
  assert.ok(trackerControls.includes("onToggleVector('showAccelerationLines')"), 'TrackerControls must have showAccelerationLines toggle');
  assert.ok(trackerControls.includes('Markers'), 'TrackerControls must feature Markers button');
  assert.ok(trackerControls.includes('Acc/Dec Lines'), 'TrackerControls must feature Acc/Dec Lines button');

  // Check main app AutotrackModal
  const autotrackModal = fs.readFileSync(path.join(mainDir, 'src', 'components', 'Tracker', 'AutotrackModal.tsx'), 'utf8');
  assert.ok(autotrackModal.includes("onToggleVector?.('showDataMarkers')"), 'AutotrackModal must have showDataMarkers toggle');
  assert.ok(autotrackModal.includes("onToggleVector?.('showAccelerationLines')"), 'AutotrackModal must have showAccelerationLines toggle');

  // Check student edition TrackerControls
  const studentControls = fs.readFileSync(path.join(studentDir, 'src', 'components', 'Tracker', 'TrackerControls.tsx'), 'utf8');
  assert.ok(studentControls.includes("onToggleVector('showDataMarkers')"), 'Student TrackerControls must have showDataMarkers toggle');
  assert.ok(studentControls.includes("onToggleVector('showAccelerationLines')"), 'Student TrackerControls must have showAccelerationLines toggle');

  // Check student edition AutotrackModal
  const studentAutotrack = fs.readFileSync(path.join(studentDir, 'src', 'components', 'Tracker', 'AutotrackModal.tsx'), 'utf8');
  assert.ok(studentAutotrack.includes("onToggleVector?.('showDataMarkers')"), 'Student AutotrackModal must have showDataMarkers toggle');
  assert.ok(studentAutotrack.includes("onToggleVector?.('showAccelerationLines')"), 'Student AutotrackModal must have showAccelerationLines toggle');
});

test('Physics Acc/Dec Logic: Tangential, Horizontal, and Vertical Motion States', () => {
  function evaluateMotion(vx, vy, ax, ay) {
    const speed = Math.hypot(vx, vy);
    const at = speed > 0.05 ? (vx * ax + vy * ay) / speed : 0;

    // X Direction
    const prodX = vx * ax;
    let stateX = 'uniform';
    if (Math.abs(ax) >= 0.08 && Math.abs(vx) >= 0.03) {
      stateX = prodX > 0.03 ? 'accelerating' : prodX < -0.03 ? 'decelerating' : 'uniform';
    }

    // Y Direction
    const prodY = vy * ay;
    let stateY = 'uniform';
    if (Math.abs(ay) >= 0.08 && Math.abs(vy) >= 0.03) {
      stateY = prodY > 0.03 ? 'accelerating' : prodY < -0.03 ? 'decelerating' : 'uniform';
    }

    // Overall Tangential
    let overall = 'UNIFORM SPEED';
    if (speed > 0.05 && Math.abs(at) >= 0.08) {
      overall = at > 0.08 ? 'ACCELERATING' : 'DECELERATING';
    }

    return { stateX, stateY, overall, at };
  }

  // Case 1: Free fall drop (vy < 0, ay = -9.81 < 0) -> Accelerating (falling faster)
  const freeFall = evaluateMotion(0, -3.5, 0, -9.81);
  assert.strictEqual(freeFall.stateY, 'accelerating', 'Downward velocity + downward gravity must be accelerating');
  assert.strictEqual(freeFall.overall, 'ACCELERATING');
  assert.ok(freeFall.at > 0, 'Tangential acceleration must be positive');

  // Case 2: Projectile tossed upward (vy > 0, ay = -9.81 < 0) -> Decelerating (rising to apex)
  const risingToss = evaluateMotion(1.5, 4.0, 0, -9.81);
  assert.strictEqual(risingToss.stateY, 'decelerating', 'Upward velocity + downward gravity must be decelerating');
  assert.strictEqual(risingToss.stateX, 'uniform', 'Zero horizontal acceleration must be uniform');
  assert.strictEqual(risingToss.overall, 'DECELERATING');
  assert.ok(risingToss.at < 0, 'Tangential acceleration must be negative');

  // Case 3: Cart slowing down due to friction (vx > 0, ax = -0.5 < 0) -> Decelerating
  const frictionCart = evaluateMotion(2.0, 0, -0.5, 0);
  assert.strictEqual(frictionCart.stateX, 'decelerating', 'Forward velocity + opposing friction must be decelerating');
  assert.strictEqual(frictionCart.overall, 'DECELERATING');

  // Case 4: Train accelerating forward (vx > 0, ax = +1.2 > 0) -> Accelerating
  const trainAcc = evaluateMotion(1.0, 0, 1.2, 0);
  assert.strictEqual(trainAcc.stateX, 'accelerating', 'Forward velocity + forward force must be accelerating');
  assert.strictEqual(trainAcc.overall, 'ACCELERATING');

  // Case 5: Uniform velocity roll (vx = 2.5, ax = 0) -> Uniform
  const uniformRoll = evaluateMotion(2.5, 0, 0, 0);
  assert.strictEqual(uniformRoll.stateX, 'uniform');
  assert.strictEqual(uniformRoll.overall, 'UNIFORM SPEED');
});
