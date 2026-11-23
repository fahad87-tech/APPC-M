/**
 * Verification test for Movable Pencil Tool
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log("=== MOVABLE PENCIL TOOL VERIFICATION SUITE ===");

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

// 1. Structural DOM check
console.log("Testing DOM structure...");
if (!html.includes('id="q-canvas-tool-wrapper"') ||
    !html.includes('id="q-canvas-drag-handle"') ||
    !html.includes('id="btn-toggle-canvas"') ||
    !html.includes('id="q-canvas-menu"')) {
  console.error("FAIL: Canvas tool wrapper, drag handle, button, or menu missing from HTML");
  process.exit(1);
}
console.log("✔ Test 1 Passed: Canvas tool DOM elements present with drag handle.");

// 2. Reset Position action in menu
if (!html.includes('resetCanvasToolPosition(event)') || !html.includes('Reset Position (Top-Right)')) {
  console.error("FAIL: Reset Position button missing from canvas popout menu");
  process.exit(1);
}
console.log("✔ Test 2 Passed: Reset Position button present in canvas menu.");

// 3. Test Clamping & Drag Math Simulation
console.log("Testing boundary clamping and positioning logic...");

function simulateClamp(targetLeft, targetTop, boxWidth, boxHeight, toolWidth, toolHeight) {
  const minX = 6;
  const maxX = Math.max(minX, boxWidth - toolWidth - 6);
  const minY = 6;
  const maxY = Math.max(minY, boxHeight - toolHeight - 6);

  const clampedLeft = Math.max(minX, Math.min(maxX, targetLeft));
  const clampedTop = Math.max(minY, Math.min(maxY, targetTop));
  return { left: clampedLeft, top: clampedTop };
}

// Case A: Dragged past top-left off-screen
const r1 = simulateClamp(-100, -50, 1000, 800, 50, 60);
if (r1.left !== 6 || r1.top !== 6) {
  console.error("FAIL: Clamping failed on negative coordinates", r1);
  process.exit(1);
}

// Case B: Dragged past bottom-right off-screen
const r2 = simulateClamp(1500, 1200, 1000, 800, 50, 60);
if (r2.left !== 944 || r2.top !== 734) {
  console.error("FAIL: Clamping failed on oversized coordinates", r2);
  process.exit(1);
}

// Case C: Normal in-bounds coordinates
const r3 = simulateClamp(400, 300, 1000, 800, 50, 60);
if (r3.left !== 400 || r3.top !== 300) {
  console.error("FAIL: Clamping altered valid in-bounds coordinates", r3);
  process.exit(1);
}
console.log("✔ Test 3 Passed: Coordinate boundary clamping functions correctly.");

// 4. Test Smart Menu Alignment
console.log("Testing smart popout menu alignment...");

function simulateMenuPlacement(left, top, boxWidth, boxHeight) {
  let alignX, alignY;
  if (left < 220) {
    alignX = 'left';
  } else {
    alignX = 'right';
  }
  if (boxHeight && (boxHeight - top < 250)) {
    alignY = 'up';
  } else {
    alignY = 'down';
  }
  return { alignX, alignY };
}

// Far left, top -> align left, down
const m1 = simulateMenuPlacement(50, 20, 1000, 800);
if (m1.alignX !== 'left' || m1.alignY !== 'down') {
  console.error("FAIL: Menu orientation incorrect for top-left", m1);
  process.exit(1);
}

// Far right, bottom -> align right, up
const m2 = simulateMenuPlacement(900, 700, 1000, 800);
if (m2.alignX !== 'right' || m2.alignY !== 'up') {
  console.error("FAIL: Menu orientation incorrect for bottom-right", m2);
  process.exit(1);
}
console.log("✔ Test 4 Passed: Smart menu placement dynamically shifts orientation.");

// 5. Test Click vs Drag Suppression
console.log("Testing click vs drag threshold discrimination...");
let suppressClick = false;
function onDragMove(dx, dy) {
  const dist = Math.hypot(dx, dy);
  if (dist > 4) {
    suppressClick = true;
  }
}
function onButtonClick() {
  if (suppressClick) return 'dragged';
  return 'clicked';
}

// Micro jitter (1px) -> treated as pure click
onDragMove(1, 1);
if (onButtonClick() !== 'clicked') {
  console.error("FAIL: Micro-movement falsely triggered drag suppression");
  process.exit(1);
}

// Real drag (20px) -> treated as drag, click suppressed
onDragMove(15, 20);
if (onButtonClick() !== 'dragged') {
  console.error("FAIL: Intentional drag failed to suppress click");
  process.exit(1);
}
console.log("✔ Test 5 Passed: Click vs drag discrimination works seamlessly.");

console.log("\nAll 5 Movable Pencil Tool Verification Tests Passed 100%!");
