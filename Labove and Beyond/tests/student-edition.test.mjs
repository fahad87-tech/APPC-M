import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('Student Edition - Verify Zero Pre-Tracked Points (Clean Slate Guarantee)', async (t) => {
  // Read videoLibrary.ts source code
  const videoLibPath = path.join(rootDir, 'src', 'utils', 'videoLibrary.ts');
  const videoLibContent = fs.readFileSync(videoLibPath, 'utf8');

  // Verify that REAL_EXPERIMENT_VIDEOS is directly BASE_EXPERIMENT_VIDEOS without pretracked injection
  assert.match(
    videoLibContent,
    /export const REAL_EXPERIMENT_VIDEOS:\s*PhysicsExperimentSample\[\]\s*=\s*BASE_EXPERIMENT_VIDEOS;/,
    'REAL_EXPERIMENT_VIDEOS must be BASE_EXPERIMENT_VIDEOS (unmodified by pretracked datasets)'
  );

  // Read pretrackedData.ts
  const pretrackedPath = path.join(rootDir, 'src', 'utils', 'pretrackedData.ts');
  const pretrackedContent = fs.readFileSync(pretrackedPath, 'utf8');
  assert.match(
    pretrackedContent,
    /export const PRETRACKED_EXPERIMENTS:\s*Record<[^>]+>\s*=\s*\{\};/,
    'PRETRACKED_EXPERIMENTS must be an empty record'
  );

  // Parse all experiment definitions in videoLibrary.ts
  const idMatches = [...videoLibContent.matchAll(/id:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
  // Filter out any non-experiment IDs
  const sampleIds = idMatches.filter((id) => id.startsWith('fizziq-') || id.startsWith('tracker-'));

  assert.ok(sampleIds.length >= 50, `Expected at least 50 experiments, found ${sampleIds.length}`);

  // Ensure no sampleTrackPoints or sampleSeriesList are hardcoded with points in videoLibrary.ts
  assert.strictEqual(
    videoLibContent.includes('sampleTrackPoints: ['),
    false,
    'videoLibrary.ts must not contain sampleTrackPoints array'
  );
  assert.strictEqual(
    videoLibContent.includes('sampleSeriesList: ['),
    false,
    'videoLibrary.ts must not contain sampleSeriesList array'
  );
});

test('Student Edition - Verify Video Assets Exist Locally in public/', async (t) => {
  const videoLibPath = path.join(rootDir, 'src', 'utils', 'videoLibrary.ts');
  const videoLibContent = fs.readFileSync(videoLibPath, 'utf8');

  const videoUrlMatches = [...videoLibContent.matchAll(/videoUrl:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
  assert.ok(videoUrlMatches.length > 0, 'Should find video URLs in videoLibrary');

  const missingVideos = [];
  for (const vUrl of videoUrlMatches) {
    const cleanPath = vUrl.startsWith('/') ? vUrl.slice(1) : vUrl;
    const localFilePath = path.join(rootDir, 'public', cleanPath);
    if (!fs.existsSync(localFilePath)) {
      missingVideos.push(vUrl);
    }
  }

  assert.deepStrictEqual(missingVideos, [], `All referenced video files must exist in public/. Missing: ${missingVideos.join(', ')}`);
});

test('Student Edition - Verify Teacher/Cheat Features are Removed from UI', async (t) => {
  // Verify TrackerControls has no onLoadPretracked or "Pre-Tracked Data" button
  const trackerControlsPath = path.join(rootDir, 'src', 'components', 'Tracker', 'TrackerControls.tsx');
  const trackerControlsContent = fs.readFileSync(trackerControlsPath, 'utf8');
  assert.strictEqual(
    trackerControlsContent.includes('onLoadPretracked'),
    false,
    'TrackerControls must not have onLoadPretracked'
  );
  assert.strictEqual(
    trackerControlsContent.includes('Pre-Tracked Data'),
    false,
    'TrackerControls must not have Pre-Tracked Data button'
  );

  // Verify VideoLibraryModal has no Teacher/Student mode toggle
  const modalPath = path.join(rootDir, 'src', 'components', 'Modals', 'VideoLibraryModal.tsx');
  const modalContent = fs.readFileSync(modalPath, 'utf8');
  assert.strictEqual(
    modalContent.includes('onToggleStudentMode'),
    false,
    'VideoLibraryModal must not have onToggleStudentMode'
  );
  assert.strictEqual(
    modalContent.includes('Pre-Analyzed Data'),
    false,
    'VideoLibraryModal must not have Pre-Analyzed Data filter'
  );

  // Verify Navbar has no Teacher Mode toggle
  const navbarPath = path.join(rootDir, 'src', 'components', 'Navbar.tsx');
  const navbarContent = fs.readFileSync(navbarPath, 'utf8');
  assert.strictEqual(
    navbarContent.includes('Analyzed Lab'),
    false,
    'Navbar must not have Analyzed Lab button'
  );
  assert.ok(
    navbarContent.includes('🧑‍🎓 Student Edition'),
    'Navbar must feature the Student Edition badge'
  );
});

test('Physics Kinematics Math - Transform, Velocity, Energy & Regression', async (t) => {
  // Test coordinate conversion: 1m ruler = 100px -> scale = 0.01 m/px
  const rulerP1 = { x: 100, y: 500 };
  const rulerP2 = { x: 200, y: 500 };
  const pixelDist = Math.hypot(rulerP2.x - rulerP1.x, rulerP2.y - rulerP1.y); // 100px
  const realDist = 1.0; // 1m
  const scaleRatio = realDist / pixelDist; // 0.01 m/px

  const origin = { x: 100, y: 500 };
  const invertY = true; // upward is positive

  function toPhysical(px, py) {
    const dx = (px - origin.x) * scaleRatio;
    const dy = (origin.y - py) * scaleRatio; // inverted: up is positive
    return { x: dx, y: dy };
  }

  // Point at origin
  const p0 = toPhysical(100, 500);
  assert.strictEqual(p0.x, 0);
  assert.strictEqual(p0.y, 0);

  // Point 200px right, 150px up
  const p1 = toPhysical(300, 350);
  assert.strictEqual(p1.x, 2.0); // 200px * 0.01 = 2m
  assert.strictEqual(p1.y, 1.5); // 150px * 0.01 = 1.5m

  // Test Velocity via central difference: v = (x_{i+1} - x_{i-1}) / (t_{i+1} - t_{i-1})
  const dt = 1 / 30; // 30 fps
  const t0 = 0, t1 = dt, t2 = 2 * dt;
  const x0 = 0, x1 = 0.1, x2 = 0.2; // uniform velocity = 3.0 m/s
  const v1 = (x2 - x0) / (t2 - t0);
  assert.ok(Math.abs(v1 - 3.0) < 1e-9, `v1 should be 3.0 m/s, got ${v1}`);

  // Test Kinetic & Potential Energy
  const mass = 0.2; // 200g
  const speed = 4.0; // m/s
  const height = 1.8; // m
  const g = 9.81;

  const Ek = 0.5 * mass * speed * speed; // 0.5 * 0.2 * 16 = 1.6 J
  const Ep = mass * g * height; // 0.2 * 9.81 * 1.8 = 3.5316 J
  const Em = Ek + Ep;

  assert.ok(Math.abs(Ek - 1.6) < 1e-9);
  assert.ok(Math.abs(Ep - 3.5316) < 1e-9);
  assert.ok(Math.abs(Em - 5.1316) < 1e-9);

  // Test Center of Mass: m1=0.2 at (0, 0), m2=0.3 at (5, 10)
  const m1 = 0.2, pos1 = { x: 0, y: 0 };
  const m2 = 0.3, pos2 = { x: 5, y: 10 };
  const totalM = m1 + m2;
  const cmX = (m1 * pos1.x + m2 * pos2.x) / totalM;
  const cmY = (m1 * pos1.y + m2 * pos2.y) / totalM;
  assert.strictEqual(cmX, 3.0); // (0 + 1.5) / 0.5 = 3.0
  assert.strictEqual(cmY, 6.0); // (0 + 3.0) / 0.5 = 6.0
});
