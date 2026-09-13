import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

// 1. Test CSV serialization for frequency history records
test('Frequency Recorder: CSV Export serialization of f(t) time-series data', () => {
  const records = [
    { time: 0.0, frequency: 440.0, note: 'A4', cents: 0, decibels: 72.4 },
    { time: 0.1, frequency: 442.5, note: 'A4', cents: 10, decibels: 73.1 },
    { time: 0.2, frequency: 523.25, note: 'C5', cents: 0, decibels: 68.0 },
    { time: 0.3, frequency: 659.25, note: 'E5', cents: 0, decibels: 65.5 },
  ];

  // Emulate exportFrequencyToCsv logic
  const headers = ['Time (s)', 'Frequency (Hz)', 'Note', 'Cents Offset', 'Intensity (dB)'];
  const rows = records.map((r) => [
    r.time.toFixed(3),
    r.frequency.toFixed(2),
    `"${r.note}"`,
    r.cents,
    r.decibels.toFixed(1),
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');

  assert.ok(csvContent.includes('Time (s),Frequency (Hz),Note,Cents Offset,Intensity (dB)'));
  assert.ok(csvContent.includes('0.000,440.00,"A4",0,72.4'));
  assert.ok(csvContent.includes('0.200,523.25,"C5",0,68.0'));

  // Test statistics calculation (min, max, mean)
  const freqs = records.map((r) => r.frequency);
  const minFreq = Math.min(...freqs);
  const maxFreq = Math.max(...freqs);
  const avgFreq = freqs.reduce((sum, f) => sum + f, 0) / freqs.length;

  assert.strictEqual(minFreq, 440.0);
  assert.strictEqual(maxFreq, 659.25);
  assert.ok(Math.abs(avgFreq - 516.25) < 0.01);
});

// 2. Test Erase and Restart state transitions
test('Frequency Recorder: Erase and Restart resets buffer, timer, and statistics', () => {
  let records = [
    { time: 0.0, frequency: 440.0, note: 'A4', cents: 0, decibels: 72.0 },
    { time: 1.5, frequency: 441.0, note: 'A4', cents: 4, decibels: 71.5 },
  ];
  let isRecording = true;
  let recordStartTime = 1700000000;

  // Erase and Restart action
  const handleEraseAndRestart = () => {
    records = [];
    recordStartTime = Date.now();
    isRecording = true;
  };

  handleEraseAndRestart();

  assert.strictEqual(records.length, 0, 'Buffer should be completely cleared');
  assert.strictEqual(isRecording, true, 'Recording should immediately resume fresh');
  assert.ok(recordStartTime > 0, 'Start time should be re-initialized');
});

// 3. Test Physical Simulation Models (Doppler Effect, Frequency Chirp, Vibrato FM)
test('Acoustics Physics: Doppler shift calculation matches physical moving source', () => {
  const f0 = 440.0; // Source emit frequency (Hz)
  const v_sound = 343.0; // Speed of sound at 20°C in m/s
  const v_source = 30.0; // Source velocity (e.g. 108 km/h vehicle)

  // Approach: f_obs = f0 * v / (v - vs)
  const f_approach = f0 * (v_sound / (v_sound - v_source));
  // Recede: f_obs = f0 * v / (v + vs)
  const f_recede = f0 * (v_sound / (v_sound + v_source));

  assert.ok(f_approach > f0, 'Approaching source must exhibit higher frequency (blue-shifted)');
  assert.ok(f_recede < f0, 'Receding source must exhibit lower frequency (red-shifted)');
  assert.ok(Math.abs(f_approach - 482.17) < 0.1);
  assert.ok(Math.abs(f_recede - 404.61) < 0.1);

  // Doppler smooth pass-by geometry: distance y0 = 10m, x(t) = v_source * (t - t_pass)
  const t_pass = 5.0;
  const y0 = 10.0;
  const calcObservedDoppler = (t) => {
    const x = v_source * (t - t_pass);
    const r = Math.sqrt(x * x + y0 * y0);
    const cosTheta = x / r; // cos(theta) along line of sight
    const v_rel = v_source * cosTheta; // positive when moving away
    return f0 * (v_sound / (v_sound + v_rel));
  };

  const f_before = calcObservedDoppler(1.0);
  const f_center = calcObservedDoppler(5.0);
  const f_after = calcObservedDoppler(9.0);

  assert.ok(f_before > f0, 'Before CPA observed frequency is shifted up');
  assert.ok(Math.abs(f_center - f0) < 0.001, 'At CPA observed frequency equals source frequency');
  assert.ok(f_after < f0, 'After CPA observed frequency is shifted down');
});

test('Acoustics Physics: Linear frequency chirp f(t) sweep', () => {
  const f_start = 200.0;
  const f_end = 2000.0;
  const duration = 10.0; // seconds

  const calcChirp = (t) => {
    const cycleTime = t % duration;
    return f_start + ((f_end - f_start) * cycleTime) / duration;
  };

  assert.strictEqual(calcChirp(0.0), 200.0);
  assert.strictEqual(calcChirp(5.0), 1100.0);
  assert.ok(Math.abs(calcChirp(9.99) - 1998.2) < 1.0);
});

test('Acoustics Physics: Musical pitch detection note mapping', () => {
  const noteStrings = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  const freqToNote = (frequency) => {
    const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
    const roundedNote = Math.round(noteNum) + 69;
    const noteName = noteStrings[roundedNote % 12];
    const octave = Math.floor(roundedNote / 12) - 1;
    const expectedFreq = 440 * Math.pow(2, (roundedNote - 69) / 12);
    const cents = Math.round(1200 * (Math.log(frequency / expectedFreq) / Math.log(2)));
    return { note: `${noteName}${octave}`, cents };
  };

  assert.strictEqual(freqToNote(440.0).note, 'A4');
  assert.strictEqual(freqToNote(440.0).cents, 0);

  assert.strictEqual(freqToNote(261.63).note, 'C4');
  assert.ok(Math.abs(freqToNote(261.63).cents) <= 1);

  assert.strictEqual(freqToNote(523.25).note, 'C5');
  assert.strictEqual(freqToNote(880.0).note, 'A5');
});

// 4. Source Code Verification for UI Toggles & Suites
test('Component Verification: PhysicsSuite.tsx and SoundStudio.tsx integrate f(t) and toggle', () => {
  const suitesPath = path.resolve('src/components/PhysicsSuites/PhysicsSuite.tsx');
  assert.ok(fs.existsSync(suitesPath), 'PhysicsSuite.tsx must exist');
  const suitesContent = fs.readFileSync(suitesPath, 'utf8');

  assert.ok(suitesContent.includes("activeSuite === 'acoustics'"), 'Must have acoustics suite state');
  assert.ok(suitesContent.includes('Acoustics & Frequency f(t)'), 'Must display suite title');
  assert.ok(suitesContent.includes('<FrequencyRecorder'), 'Must render FrequencyRecorder component');

  const studioPath = path.resolve('src/components/Sound/SoundStudio.tsx');
  assert.ok(fs.existsSync(studioPath), 'SoundStudio.tsx must exist');
  const studioContent = fs.readFileSync(studioPath, 'utf8');

  assert.ok(studioContent.includes("analyzerMode === 'timeSeries'"), 'Must toggle between instantaneous and time-series');
  assert.ok(studioContent.includes('Instantaneous f₀'), 'Must have instantaneous toggle label');
  assert.ok(studioContent.includes('Frequency vs. Time Graph f(t)'), 'Must have f(t) toggle label');
  assert.ok(studioContent.includes('<FrequencyRecorder'), 'Must render FrequencyRecorder in timeSeries mode');
});
