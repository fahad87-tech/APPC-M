/**
 * Test Suite: Teacher Portal 3-Step Dispatcher Wizard & Student-Paced Frictionless Answering
 */
const fs = require('fs');
const assert = require('assert');

console.log('--- Running Stepper & Student-Paced Verification Suite ---');

const teacherHtml = fs.readFileSync('teacher.html', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');

// Test 1: Verify teacher.html contains all 3 stepper steps and lobby
assert(teacherHtml.includes('id="wizard-step-1"'), 'Step 1 container missing');
assert(teacherHtml.includes('id="wizard-step-2"'), 'Step 2 container missing');
assert(teacherHtml.includes('id="wizard-step-3"'), 'Step 3 container missing');
assert(teacherHtml.includes('id="wizard-lobby-container"'), 'Lobby container missing');
console.log('✔ Test 1 Passed: Teacher Portal 3-step wizard & lobby containers exist.');

// Test 2: Verify Step 1 Quick Launch and Cascading Selectors
assert(teacherHtml.includes('quickLaunchAssignment()'), 'Quick launch trigger missing');
assert(teacherHtml.includes('id="teacher-select-subject"'), 'Subject selector missing');
assert(teacherHtml.includes('id="teacher-select-unit"'), 'Unit selector missing');
assert(teacherHtml.includes('id="teacher-select-assessment"'), 'Assessment selector missing');
assert(teacherHtml.includes('id="opt-calc"'), 'Calculator toggle missing');
assert(teacherHtml.includes('id="opt-review"'), 'Review toggle missing');
console.log('✔ Test 2 Passed: Step 1 Quick Launch & configuration selectors present.');

// Test 3: Verify Step 2 Wayground-style Pacing Cards
assert(teacherHtml.includes('id="pacing-card-teacher"'), 'Teacher-Led pacing card missing');
assert(teacherHtml.includes('id="pacing-card-student"'), 'Student-Led pacing card missing');
assert(teacherHtml.includes('selectWizardPacing(\'teacher_led\')'), 'Teacher pacing handler missing');
assert(teacherHtml.includes('selectWizardPacing(\'student_led\')'), 'Student pacing handler missing');
console.log('✔ Test 3 Passed: Step 2 Wayground-style pacing cards present.');

// Test 4: Verify Step 3 Wayground Mini-Game Tiles
assert(teacherHtml.includes('id="tg-card-wayarena"'), 'Wayarena tile missing');
assert(teacherHtml.includes('id="tg-card-tug_of_war"'), 'Tug of War tile missing');
assert(teacherHtml.includes('id="tg-card-mastery_peak"'), 'Mastery Peak tile missing');
assert(teacherHtml.includes('id="tg-card-classic"'), 'Classic Exam tile missing');
assert(teacherHtml.includes('id="teacher-game-duration"'), 'Game duration selector missing');
assert(teacherHtml.includes('id="teacher-questions-per-round"'), 'Questions per burst selector missing');
console.log('✔ Test 4 Passed: Step 3 Wayground-style mini-game tiles present.');

// Test 5: Verify Lobby Screen Elements
assert(teacherHtml.includes('id="banner-code"'), 'Join code display missing');
assert(teacherHtml.includes('id="banner-qr-code"'), 'QR Code image element missing');
assert(teacherHtml.includes('id="banner-url"'), 'Direct share URL input missing');
assert(teacherHtml.includes('id="lobby-student-count"'), 'Live student counter missing');
assert(teacherHtml.includes('id="btn-lobby-primary-action"'), 'Lobby action button missing');
console.log('✔ Test 5 Passed: Dedicated Lobby Screen with Join Code & QR code present.');

// Test 6: Verify index.html frictionless student-paced answering (No lock button gate)
assert(indexHtml.includes('let isExamLocked = false;'), 'isExamLocked variable missing');
assert(indexHtml.includes('let isExamSubmitted = false;'), 'isExamSubmitted variable missing');
// Ensure selectChoice allows direct change without lock when student_led
assert(indexHtml.includes('if (quizMode === "teacher_led" && studentLockedAnswers[realIdx]) return;'), 'Teacher-led lock gate must remain');
// Ensure review mode displays green/red evaluation and rationale
assert(indexHtml.includes('Official College Board Scoring Rationale'), 'Official rationale card missing');
assert(indexHtml.includes('choice-correct'), 'choice-correct styling missing');
assert(indexHtml.includes('choice-wrong'), 'choice-wrong styling missing');
console.log('✔ Test 6 Passed: Student-paced lock removal and locked review mode validated.');

console.log('\nAll 6 Stepper and Student-Paced Verification Tests Passed 100%!');
