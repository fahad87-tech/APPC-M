const assert = require('assert');
const fs = require('fs');

console.log('=== MULTI-SELECT VERIFICATION SUITE ===');

// Extract the entire helper block from index.html
const indexHtml = fs.readFileSync('index.html', 'utf8');
const helperMarker = '// MULTI-SELECT & NORMALIZATION HELPERS';
const markerIdx = indexHtml.indexOf(helperMarker);
assert(markerIdx !== -1, 'Helper block not found in index.html');
const endMarkerIdx = indexHtml.indexOf('// UI FEEDBACK SYSTEM', markerIdx);
assert(endMarkerIdx !== -1, 'End marker not found in index.html');

const helperCode = indexHtml.slice(markerIdx, endMarkerIdx);
const evalScope = new Function(`
  ${helperCode}
  return { normalizeAnswer, parseAnswerLetters, isAnswerCorrect, isQuestionMultiSelect, getExpectedChoiceCount };
`)();

const { normalizeAnswer, parseAnswerLetters, isAnswerCorrect, isQuestionMultiSelect, getExpectedChoiceCount } = evalScope;

// Test 1: Normalization
console.log('Testing normalizeAnswer...');
assert.strictEqual(normalizeAnswer("A,D"), "A,D");
assert.strictEqual(normalizeAnswer("D,A"), "A,D");
assert.strictEqual(normalizeAnswer("b, d"), "B,D");
assert.strictEqual(normalizeAnswer(" A , C "), "A,C");
assert.strictEqual(normalizeAnswer("B"), "B");
assert.strictEqual(normalizeAnswer(""), "");
assert.strictEqual(normalizeAnswer(null), "");
console.log('✔ Test 1 Passed: normalizeAnswer works for all cases.');

// Test 2: parseAnswerLetters
console.log('Testing parseAnswerLetters...');
assert.deepStrictEqual(parseAnswerLetters("A,D"), ["A", "D"]);
assert.deepStrictEqual(parseAnswerLetters("D,A"), ["D", "A"]);
assert.deepStrictEqual(parseAnswerLetters("B, d"), ["B", "D"]);
assert.deepStrictEqual(parseAnswerLetters("C"), ["C"]);
assert.deepStrictEqual(parseAnswerLetters(""), []);
console.log('✔ Test 2 Passed: parseAnswerLetters parses properly.');

// Test 3: isAnswerCorrect
console.log('Testing isAnswerCorrect...');
assert.strictEqual(isAnswerCorrect("A,D", "A,D"), true);
assert.strictEqual(isAnswerCorrect("D,A", "A,D"), true);
assert.strictEqual(isAnswerCorrect("b,d", "B,D"), true);
assert.strictEqual(isAnswerCorrect("A", "A,D"), false);
assert.strictEqual(isAnswerCorrect("A,B", "A,D"), false);
assert.strictEqual(isAnswerCorrect("A,D,B", "A,D"), false);
assert.strictEqual(isAnswerCorrect("C", "C"), true);
assert.strictEqual(isAnswerCorrect("B", "C"), false);
assert.strictEqual(isAnswerCorrect("", "C"), false);
console.log('✔ Test 3 Passed: isAnswerCorrect order-agnostic evaluation matches.');

// Test 4: isQuestionMultiSelect & getExpectedChoiceCount
console.log('Testing question detection...');
const qMultiExplicit = { multi_select: true, expected_choices: 2, correct_answer: "A,D" };
const qMultiKeyOnly = { correct_answer: "B,D" };
const qMultiPrompt = { prompt: "A student performs an experiment. (Select two answers)", correct_answer: "A" };
const qSingle = { correct_answer: "C" };

assert.strictEqual(isQuestionMultiSelect(qMultiExplicit), true);
assert.strictEqual(isQuestionMultiSelect(qMultiKeyOnly), true);
assert.strictEqual(isQuestionMultiSelect(qMultiPrompt), true);
assert.strictEqual(isQuestionMultiSelect(qSingle), false);

assert.strictEqual(getExpectedChoiceCount(qMultiExplicit), 2);
assert.strictEqual(getExpectedChoiceCount(qMultiKeyOnly), 2);
assert.strictEqual(getExpectedChoiceCount(qMultiPrompt), 2);
assert.strictEqual(getExpectedChoiceCount(qSingle), 1);
console.log('✔ Test 4 Passed: isQuestionMultiSelect and getExpectedChoiceCount detect multi-select correctly.');

// Test 5: Verify APP1 Unit 2 Mid-Term Review 1 Questions
console.log('Testing actual questions in exams.json...');
const exams = require('../data/exams.json');
const u2 = exams.subjects.APP1.units['Unit 2'].assessments.find(a => a.id === 'app1_unit2_midterm_review_1');
assert(u2, 'app1_unit2_midterm_review_1 not found');

const q1 = u2.questions[0];
const q2 = u2.questions[1];
const q8 = u2.questions[7];

assert.strictEqual(isQuestionMultiSelect(q1), true);
assert.strictEqual(isQuestionMultiSelect(q2), true);
assert.strictEqual(isQuestionMultiSelect(q8), true);
assert.strictEqual(getExpectedChoiceCount(q1), 2);
assert.strictEqual(getExpectedChoiceCount(q2), 2);
assert.strictEqual(getExpectedChoiceCount(q8), 2);

assert.strictEqual(isAnswerCorrect("D,A", q1.correct_answer), true);
assert.strictEqual(isAnswerCorrect("D,B", q2.correct_answer), true);
assert.strictEqual(isAnswerCorrect("B,D", q8.correct_answer), true);
assert.strictEqual(isAnswerCorrect("A,B", q8.correct_answer), false);
console.log('✔ Test 5 Passed: Unit 2 Review Q1, Q2, Q8 validated for multi-select.');

// Test 6: Toggle behavior simulation
console.log('Testing selection toggle and capacity shift simulation...');
function simulateToggle(currentSelectedStr, letter, expectedCount) {
  let curLetters = parseAnswerLetters(currentSelectedStr);
  const existsIdx = curLetters.indexOf(letter);
  if (existsIdx >= 0) {
    curLetters.splice(existsIdx, 1);
  } else {
    if (curLetters.length >= expectedCount) {
      curLetters.shift();
    }
    curLetters.push(letter);
  }
  curLetters.sort();
  return curLetters.join(",");
}

let sel = "";
sel = simulateToggle(sel, "A", 2);
assert.strictEqual(sel, "A");

sel = simulateToggle(sel, "D", 2);
assert.strictEqual(sel, "A,D");

// Toggle off D
sel = simulateToggle(sel, "D", 2);
assert.strictEqual(sel, "A");

// Select B
sel = simulateToggle(sel, "B", 2);
assert.strictEqual(sel, "A,B");

// Exceed cap of 2: select D -> shifts oldest ('A') out, keeps B and D
sel = simulateToggle(sel, "D", 2);
assert.strictEqual(sel, "B,D");
console.log('✔ Test 6 Passed: Selection toggle & FIFO capacity shift works flawlessly.');

console.log('\nAll 6 Multi-Select Verification Tests Passed 100%!');
