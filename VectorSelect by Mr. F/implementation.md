# VectorSelect by Mr. F — Master Implementation Specification (Supabase Edition)

## 1. Overview & System Architecture
VectorSelect is a high-performance web classroom assessment platform designed for AP Physics C: Mechanics. It supports both **Teacher-Led Synchronized Pacing** and **Student-Led Independent Modes**.

### Core Architecture
- **Frontend**: Pure vanilla modern JavaScript (ES6+), HTML5, Tailwind CSS, KaTeX math typesetting, and Lucide icons. Single-page zero-build architecture.
- **Backend**: Supabase (PostgreSQL with Realtime WebSockets & Row Level Security).
- **Static Hosting**: GitHub Pages, local HTTP server (`python -m http.server 8888`), or any static hosting provider.
- **Offline Reliability**: Gracefully falls back to offline answer keys (`data/answer_keys.js`), local assessment schemas, and HTML5 localStorage if the Supabase cloud service is unreachable.

---

## 2. Supabase Configuration & Key Placement

You have two flexible, fully-supported options to configure Supabase:

### Option A: `.env` File (Recommended for Local Dev & Git Safety)
Create a `.env` file in the root folder of the project (`VectorSelect by Mr. F/.env`):
```env
# Supabase Cloud Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
- **Git Protected**: `.env` and `.env.*` are already included in `.gitignore`, preventing accidental commits of your credentials.
- **Automatic Runtime Loading**: When served through any local HTTP server (such as `python -m http.server 8888` or VS Code Live Server), `supabase_config.js` automatically fetches and parses `.env` on startup.

### Option B: `supabase_public_config.js` (For Static Hosting / GitHub Pages)
If deploying statically to GitHub Pages or running without a local web server (direct `file:///`), open:
`VectorSelect by Mr. F/supabase_public_config.js`

Add your Supabase credentials:
```javascript
// Public Supabase configuration for the static frontend.
// Use the project URL and anon/publishable key only.
// Never put a service_role key in this file or any browser asset.
window.VECTORSELECT_SUPABASE_URL = "https://your-project-id.supabase.co";
window.VECTORSELECT_SUPABASE_ANON_KEY = "eyJhbGciOi...";
```

> **Security Note**: Only use your Supabase **Project URL** and **`anon` (public)** key. Database permissions and student isolation are secured on PostgreSQL using Row Level Security (RLS). Never expose your `service_role` secret key.

---

## 3. Database Schema Setup

Run the SQL script [`supabase_schema.sql`](supabase_schema.sql) in your **Supabase Dashboard → SQL Editor**:

### Tables Created
1. **`active_assignments`**:
   - Stores session state (`join_code`, `current_question_index`, `per_question_seconds`, `timer_remaining_seconds`, `timer_paused`, `discussion_active`, `answer_revealed`, `revealed_answer`, `revealed_explanation`).
   - Enables Realtime publication for instantaneous state broadcast across all student browsers.
2. **`answer_keys`**:
   - Stores authoritative College Board answer keys and rationales indexed by `assessment_id`.
3. **`exam_submissions`**:
   - Stores completed student exam records, points (0–120), streak data, and question breakdowns.
4. **`live_events`**:
   - Handles real-time student responses (`live_answer`), join notifications (`participant_join`), and floating emoji reactions (`emoji`).

---

## 4. Key Functional Mechanics

### A. Zero-Drift Timer Synchronization
- Teacher console broadcasts `timer_remaining_seconds` every 1 second.
- Student runner ticks at 1000ms intervals and locks directly into step with the teacher clock whenever updates arrive, eliminating any 1–2s drift.

### B. Instant Evaluation & Official Key Reveal
- When question time expires (`perQRemaining <= 0` or teacher clock hits 0) OR when the instructor clicks **End & Discuss** / **Reveal Key**:
  - Correct answer button turns vibrant emerald green (`.choice-correct`, `opacity: 1 !important`).
  - Student wrong selection turns coral red (`.choice-wrong`, `opacity: 1 !important`).
  - Official verdict banner appears with the College Board rationale/explanation.

### C. Clean Question State Transition
- Advancing to the next question (`advanceNow` / `isQuestionTransition`):
  - Clears `discussion_active` and `answer_revealed`.
  - Wipes previous question answers, locks, and evaluation banners.
  - Restores all choices (A, B, C, D) to clickable, interactive states.

### D. Single-Student Telemetry Accuracy
- Responses are deduplicated case-insensitively by student name and numeric question index, sorting by latest submission (`-created_at`), guaranteeing 1 student is never counted multiple times.

---

## 5. Replication Guide for Any IDE
1. Clone the repository into your local IDE workspace.
2. Provide your Supabase project credentials using either:
   - Create a `.env` file from `.env.example` with `SUPABASE_URL` and `SUPABASE_ANON_KEY`, **OR**
   - Fill in `window.VECTORSELECT_SUPABASE_URL` and `window.VECTORSELECT_SUPABASE_ANON_KEY` in `supabase_public_config.js`.
3. In your Supabase Dashboard SQL Editor, run `supabase_schema.sql` to initialize tables, indexes, and Realtime publications.
4. In your Supabase Dashboard SQL Editor, run `data/supabase_seed.sql` to populate all 120+ official answer keys into the `answer_keys` table.
5. Serve locally with Python (`python -m http.server 8888`) or open via VS Code Live Server.
6. Access:
   - Student Runner: `http://localhost:8888/index.html`
   - Teacher Console: `http://localhost:8888/teacher.html`

---

## 6. Verification & Production Deployment Status
- **Supabase Cloud Project**: Authenticated and connected via PostgREST API with PostgreSQL Row Level Security (RLS).
- **Database Schema**: Successfully provisioned via `supabase_schema.sql` (`active_assignments`, `answer_keys`, `exam_submissions`, `session_participants`, `live_question_answers`, `live_reactions`, and real-time triggers).
- **Official Answer Keys Seeded**: Successfully populated 106 assessments with complete College Board keys and explanations into `public.answer_keys` via `supabase_seed.sql`, verified live over PostgREST API.
- **Global CDN Delivery**: Static client configured with public credentials in `supabase_public_config.js` for worldwide classroom access on GitHub Pages.
- **Local Developer Security**: Root `.env` parser integrated into `supabase_config.js` with `.env` protected under `.gitignore`.

---

## 7. Teacher Live Control Layout & Zero-Abort Discussion Pipeline

### A. Static Header & Scrollable Stage Pane Layout (`teacher.html`)
- **Viewport Optimization**: Live control modal occupies the entire viewport (`z-50 p-2 sm:p-3 overflow-hidden`) without wasting vertical screen real-estate.
- **Permanent Static Top Anchor**: The top bar containing "Teacher-Led Live Session", Projector Mode badge, Quiz Title, the large high-contrast **CLASS JOIN CODE** (for late-arriving students), and modal close button (`✕`) is fixed (`shrink-0 border-b border-slate-800`) and **never scrolls**.
- **Independently Scrollable Stage Body**: Everything below the top header (`#lc-runner-body`) uses `overflow-y-auto overscroll-contain flex-1 min-h-0`. When scrolling, the HUD bar slides up smoothly, giving maximum vertical space to `#lc-stage-pane`.
- **Responsive High-Res Question Image**: `#lc-card-img` is configured with `max-w-full h-auto object-contain`, preventing any artificial down-scaling or blurry rendering so diagrams and LaTeX formulas remain razor sharp.
- **Unrestricted Wheel & Touch Navigation**: Removed artificial `preventDefault` event listener blocks so mouse-wheel, touchpad, and touch scroll natively and seamlessly throughout the modal.

### B. Non-Blocking "End & Discuss" Architecture
- **Zero-Abort Guarantee**: In `showDiscussionPanel()`, the early `return;` on missing answer keys has been eliminated. Clicking **💬 End & Discuss** ALWAYS:
  1. Pauses teacher timer and sets remaining seconds to 0.
  2. Broadcasts `{ discussion_active: true, timer_remaining_seconds: 0, timer_paused: true }` to Supabase `active_assignments`.
  3. Reveals official answer keys if available; if not yet seeded, safely marks key as pending while opening the discussion panel and rendering real-time choice distributions.
  4. Transforms the action button to **➔ Next Question (Answers Hidden)**.
  5. Opens `#lc-discussion-panel` and reveals the class response telemetry.

### C. Student Evaluation Revelation & Feedback Sync (`index.html`)
- **Evaluation Gate**: `isCurrentQuestionEvaluationRevealed()` returns `true` whenever:
  1. Instructor sets `answer_revealed` or sends `revealed_answer`, OR
  2. Instructor starts discussion (`discussionActive`), OR
  3. Question timer has expired (`perQRemaining <= 0`), and an official key is present.
- **Student Choice Highlighting**: Upon reveal:
  - Correct choice highlights in bright emerald green (`.choice-correct`).
  - Incorrect student choice highlights in coral red (`.choice-wrong`).
  - Neutral choices are dimmed (`.choice-dimmed`).
  - Locked banner transforms from neutral "Time Expired" to the official verdict banner with explanation.
- **Background Answer Key Preload**: `startExamRunner()` asynchronously hydrates answer keys from Supabase via `fetchAnswerKeysForQuiz(assessment_id)` in the background so evaluation is instant when time expires or instructor initiates discussion.

### D. Default Portal Settings
- **Default Quiz Mode**: `teacher_led` ("Teacher-Led (Synchronized)") is selected by default on portal launch.
- **Default Per-Question Pacing**: 90 Seconds Auto (`per_question_seconds: 90`) is configured as the active timer default, with the per-question box prominently displayed and the student self-paced overall timer hidden.
- **Double-Guarded Initialization**: Both HTML markup attributes (`selected`) and `initTeacherApp()` JavaScript state synchronization enforce this configuration whenever the teacher portal is opened or refreshed.

---

## 8. Watertight Question Transition & Unlocked Option State Architecture

### A. Root Causes of Question Transition Lock Bug
1. **Teacher Local Memory Desync**:
   - In `advanceNow()` and `lcPrevQuestion()`, when advancing questions, `setAssignmentTimerState` was dispatched to the server, but `currentLiveAssignment.question_started_at` in the teacher's local JavaScript object was never updated.
   - On the very next 250ms tick of `lcTimerInterval`, `getLiveQuestionRemaining()` computed `perQ - ((now - startedAt)/1000)`. Because `startedAt` was stale (from session launch minutes ago), `lcTimerRemaining` computed as `<= 0`.
   - The timer interval immediately fired `endCurrentQuestionDiscussion()`, invoking `showDiscussionPanel(..., true)`. This immediately broadcasted `discussion_active = true`, `answer_revealed = true`, and `revealed_answer = "A"` (or the key) to Supabase within 250ms of moving questions.
2. **Student Fall-Through Auto-Lock**:
   - In `syncStudentWithTeacherAssignment()` (`index.html`), when `isQuestionTransition` triggered, it cleared local answers and locks, but did **not** `return`.
   - When the immediate discussion broadcast arrived, lines 3201-3211 ran: `if (newDiscussion || newAnswerRevealed)`, immediately creating `studentLockedAnswers[currentReal] = { auto: true }` and locking the student screen on the new question.
3. **Student Premature `isTimeUp` & Answer Key Exposure**:
   - `isCurrentQuestionEvaluationRevealed()` previously evaluated `const isTimeUp = (typeof perQRemaining === 'number') && perQRemaining <= 0;`. In Manual Pacing or during transition before the countdown initialized, `isTimeUp` returned `true`.
   - `getQuestionCorrectAnswer()` returned `q.correct_answer` directly. When `isTimeUp` was true, `renderCurrentQuestion()` applied `choice-correct` (bright emerald green checkmark) to the correct option and disabled all buttons (`disabled = true`), making it appear to the student as if that option was already chosen and locked!
4. **Student Local Timer Auto-Lock at Zero**:
   - `updatePerQDisplay(secs)` called `autoLockCurrentQuestion()` whenever `secs <= 0`. In Manual Pacing or before `question_started_at` was set, `secs` was 0, prematurely triggering auto-lock.

---

### B. Comprehensive Architectural Fixes

#### 1. Teacher Console Synchronous Atomic Advancement (`teacher.html`)
- **Interval Clearing**: `clearInterval(lcTimerInterval)` is called synchronously at the beginning of `advanceNow()` and `lcPrevQuestion()`, halting any prior question's timer loop immediately.
- **Local Memory State Refresh**: `currentLiveAssignment` fields are updated synchronously before any asynchronous operations:
  ```javascript
  currentLiveAssignment.current_question_index = currentLiveIndex;
  currentLiveAssignment.question_started_at = nowIso;
  currentLiveAssignment.discussion_active = false;
  currentLiveAssignment.answer_revealed = false;
  currentLiveAssignment.revealed_answer = "";
  currentLiveAssignment.revealed_explanation = "";
  currentLiveAssignment.previous_correct_answer = prevCorrectKey;
  currentLiveAssignment.timer_remaining_seconds = perQ;
  currentLiveAssignment.timer_paused = false;
  currentLiveAssignment.paused_remaining_seconds = null;
  ```
- **Authoritative Server Broadcast**: Writes `nowIso` and reset states to Supabase `active_assignments`.
- **Timer Stale-Guard**: In `setupQuestionTimer()`, if `lcTimerRemaining <= 0` at startup, it is reset to `perQ` with a fresh `getServerNowIso()`, preventing any tick-0 expiration.

#### 2. Student Runner Clean Question Reset & Transition Early-Return (`index.html`)
- **Complete State Wipe on Transition**:
  ```javascript
  delete studentAnswers[newRealIdx];
  delete studentAnswers[teacherQ];
  delete studentLockedAnswers[newRealIdx];
  delete studentLockedAnswers[teacherQ];
  delete currentRevealedAnswers[teacherQ];
  delete currentRevealedAnswers[newRealIdx];
  delete currentRevealedExplanations[teacherQ];
  delete currentRevealedExplanations[newRealIdx];
  delete discussionFeedbackShownForQuestion[newRealIdx];
  delete recoveryAttemptedForQuestion[newRealIdx];
  ```
- **Reset Discussion & Freeze States**: Sets `discussionActive = false; answerRevealed = false;` and calls `updateDiscussionFreeze(false, false);`.
- **Fresh Choice Rendering**: Calls `renderCurrentQuestion();` with all choice buttons interactive, unlocked, and devoid of correct/wrong highlights.
- **Immediate Early Return**: `return;` is invoked immediately after the transition handling to prevent any stale discussion payload from the prior question or network race from falling through and auto-locking the newly loaded question.

#### 3. Strict Pedagogical Evaluation & Key Gating (`index.html`)
- **Guarded Evaluation Revealer**:
  ```javascript
  function isCurrentQuestionEvaluationRevealed() {
    if (quizMode === "teacher_led") {
      const hasTimer = Boolean(currentAssignment && Number(currentAssignment.per_question_seconds) > 0);
      const startedAt = Date.parse(currentAssignment && currentAssignment.question_started_at || "");
      const isTimeUp = hasTimer && Number.isFinite(startedAt) && (typeof perQRemaining === 'number') && perQRemaining <= 0;
      return (discussionActive || answerRevealed || isTimeUp);
    }
    return isCountDown && remainingSeconds <= 0;
  }
  ```
- **Confidential Answer Key Getters**: In `getQuestionCorrectAnswer()` and `getQuestionExplanation()`, in `teacher_led` mode, if `!isCurrentQuestionEvaluationRevealed()`, they strictly return `""`, ensuring no choice can be pre-highlighted in green before official instructor reveal.
- **Guarded Timer Local Lock**: `updatePerQDisplay(secs)` only calls `autoLockCurrentQuestion()` if `hasTimer && Number.isFinite(startedAt) && secs <= 0`.

---

## 9. Toast Deduplication & Question Card Canvas Drawing Architecture

### A. Toast Notification Deduplication
- **Duplicate Suppression in Host**: `showToast(title, body, theme, timeout)` checks if an identical toast (`data-toast-key="${title}:::${body}"`) is already mounted in `#toast-host`. If present, the duplicate request is discarded.
- **Single-Fire Evaluation Feedback**: `showDiscussionFeedback(realIdx, revealedKey, explanation)` checks `if (!discussionFeedbackShownForQuestion[realIdx]) { discussionFeedbackShownForQuestion[realIdx] = true; ... }` so each question's evaluation toast (e.g. "Correct: Q1 — Verified College Board key Option B") fires strictly once per discussion or timer expiry phase.
- **Redundant Sync Call Removal**: Cleaned up `syncStudentWithTeacherAssignment()` to prevent double-invoking `showDiscussionFeedback()`.

### B. Question Card Native Canvas Drawing Engine
- **Floating Circular Activation Badge**:
  - Located on the top-right corner of the question card (`#q-card-white-box`).
  - Circular button (`#btn-toggle-canvas`) toggles drawing mode on/off with visual cyan glow and status indicator ("Active" / "Off").
  - Matching `#hdr-btn-toggle-canvas` button in the top Question Header Bar.
- **Hover Popout Tool Suite (`#q-canvas-menu`)**:
  - **Option 1: Marker**:
    - Preset color palette: Crimson Red (`#ef4444`), Electric Cyan (`#06b6d4`), Highlighter Yellow (`#eab308`), Lime Green (`#22c55e`), and Purple (`#a855f7`).
    - Brush thickness pills: Thin (2px), Med (4px), Thick (8px).
  - **Option 2: Eraser**:
    - Eraser mode switches canvas `globalCompositeOperation` to `destination-out`, cleanly erasing annotations without modifying or degrading the underlying AP Physics question card image.
  - **Clear Tool**: Clears current question canvas markings with one tap.
- **Ratio-Normalized Vector Resolution (`xRatio`, `yRatio`)**:
  - Pointer coordinates are normalized as ratios: `xRatio = (clientX - rect.left) / rect.width`, `yRatio = (clientY - rect.top) / rect.height`.
  - When the browser window resizes, when students collapse the sidebar with **Expand Space**, or when switching zoom scales (100% / 120% / 140%), all strokes redraw with precision relative to the vector diagram.
- **Non-Destructive Pointer Interaction**:
  - When Drawing Mode is **Off**: `q-card-canvas` is set to `pointer-events: none;`. Clicking anywhere on the card opens the full-screen 125%+ vector inspector modal (`openImageModal`).
  - When Drawing Mode is **Active**: `q-card-canvas` switches to `pointer-events: auto;`. `onQuestionCardClick()` ignores zoom triggers, allowing natural stylus, finger touch, or mouse annotation directly across the problem card.
- **Per-Question Stroke Persistence**:
  - Drawings are stored per question index in `cardDrawStrokesByQuestion[realIdx]`.
  - Navigating back and forth preserves student working steps on each card.
- **Full Parity Across Both Portals**:
  - **Student Runner (`index.html`)**: Available on `#q-card-white-box` for personal sketching.
  - **Teacher Live Control & Projector Stage (`teacher.html`)**: Available on `#lc-card-box` via `#btn-toggle-teacher-canvas` with full marker/eraser toolset for whole-class instruction, diagram breakdown, and vector derivations on smartboards or projectors.

---

## 10. Header Branding & Attribution Single-Line Layout

- **Problem**: In narrow viewports or responsive flex containers, the "by Mr. F" attribution badge lacked strict wrapping constraints, allowing "BY MR." and "F" to break across two lines awkwardly.
- **Resolution**:
  - In both `index.html` and `teacher.html`, the brand row container was updated to `flex flex-wrap items-center gap-2`.
  - Added `whitespace-nowrap shrink-0` to the wordmark (`VectorSelect`), the attribution card (`by Mr. F`), and the portal badges (`Student Portal` / `Teacher Hub`).
  - Guarantees the "by Mr. F" badge remains rendered seamlessly as an unbroken, single-line pill across all device screen widths.

---

## 11. Gamified Student-Paced Quizzes, Game Duration Studio & AAA Mini-Games Engine

### A. System Architecture & Capabilities
VectorSelect features an interactive student-paced gamification suite inspired by Wayground, Quizizz, and Blooket, elevated with:
1. **60fps Hi-DPI Canvas Rendering**: Crisp, vector-proportional graphics with dynamic particle systems (dust, splashes, confetti) and spring physics.
2. **Pedagogical Mechanics Integration**: Mini-games are tied directly to AP Physics mechanics (Newton's Laws $F = ma$ and friction in *Tug of War*; Work-Energy Theorem $\Delta U_g = mgh$ in *Mastery Peak*).
3. **Pure Web Audio API Sound Synthesizer**: Procedural synthesized sounds (clicks, rope whooshes, correct jingles, error buzzes, powerups, victory fanfares) with zero external audio assets, zero download lag, and 100% offline capability.
4. **Deterministic Wall-Clock Timer**: Eliminates timer drift across background tab throttling using absolute timestamp differences:
   $$\text{Remaining Time} = \text{GameEndTime} - \text{Date.now}()$$

---

### B. Database & State Schema Extensions

#### PostgreSQL Schema (`supabase_schema.sql`)
Added to `public.active_assignments`:
```sql
alter table public.active_assignments add column if not exists game_mode text not null default 'classic';
alter table public.active_assignments add column if not exists game_duration_minutes integer not null default 5;
alter table public.active_assignments add column if not exists questions_per_round integer not null default 4;
alter table public.active_assignments add column if not exists show_answer_timing text not null default 'immediate';
alter table public.active_assignments add column if not exists student_accommodations boolean not null default true;
```

#### Client Normalization (`supabase_config.js`)
- Whitelisted in `CLOUD_ASSIGNMENT_COLUMNS` for cloud persistence.
- Hydrated in `normalizeAssignment()` with local fallbacks (`game_mode: "classic"`, `game_duration_minutes: 5`, `questions_per_round: 4`, `show_answer_timing: "immediate"`, `student_accommodations: true`) for seamless offline running.

---

### C. Teacher Portal: Mode Selection Hub & Game Studio (`teacher.html`)

1. **Activity Mode Cards Hub**:
   - Visual cards for **Classic** (Synchronized teacher-led), **Mastery Peak** (Self-paced ascent), **Playground** (Arcade & duel), **Test Mode** (Formal mock exam), and **Team Mode** (Co-op duel).
2. **Student-Paced Gamified Controls Box (`#student-gamified-controls-box`)**:
   - Automatically unhides when "Student-Led (Self-Paced)" is selected in `<select id="teacher-quiz-mode">`.
   - Displays 4 interactive game cards:
     - ⚡ **Wayarena Battle**: Vector laser shootout in a sci-fi maze with AI bots & 4 powerups.
     - ⚔️ **Tug of War**: High-energy beach rope pull powered by question accuracy.
     - ⛰️ **Mastery Peak**: Climb 4,200m alpine summit; repeat missed concepts.
     - 📝 **Classic Exam**: Standard student-paced AP assessment with zero mini-games.
   - Master Game Duration dropdown (3m, 5m, 7m, 10m, 15m, 20m, 30m).
   - Questions-per-burst segmented pills (3 Qs, 4 Qs, 6 Qs) with dynamic hint text.
   - One-click shortcut button to open the full 60fps Game Studio modal.
3. **Game Selection & Configuration Studio Modal (`#game-studio-modal`)**:
   - Live 60fps Canvas preview running `GameArena.createMazeBattlePreview()`, `createTugOfWarPreview()`, or `createMasteryPeakPreview()`.
   - Comprehensive rulebook modal (`showGameRulesModal()`) detailing Wayarena laser combat, powerups, and scoring.
   - Direct dispatch button with accommodations toggle and show-answer modes.

---

### D. High-Fidelity Canvas Mini-Game Engine (`data/game_arena.js`)

- **Hi-DPI Responsive Canvas Setup**: Auto-calibrates against `devicePixelRatio` (up to 2.5x) with dynamic proportional rendering.
- **Procedural Chibi Physicist Avatars**: Cute helmet characters with responsive facial expressions (straining during pull, smiling on streaks, blinking).
- **Tug of War Beach Arena**:
  - Parallax sky with animated clouds and distant island.
  - Sine-wave oscillating turquoise ocean surf.
  - Golden sand dunes with chalk center line.
  - Dynamic catenary rope with center red ribbon marker and spring tension.
  - Interactive clickable wooden barrels with bouncing spring transforms.
  - Particle emitters for sand dust, water splashes, and victory confetti.
- **Mastery Peak Alpine Arena**:
  - Gradient mountain peaks with snow caps and summit flag.
  - Winding trail with 4 altitude waypoints and climber avatar.
  - Continuous falling snow particle simulation.
- **Wayarena (Sci-Fi Vector Maze Battle)**:
  - **Grid & Maze Topology**: 15x11 retro-futuristic labyrinth with laser-cut perimeter and neon-lit interior corridors.
  - **Real-Time Ballistics**: Vector lasers with bounding collision checks, 2-bounce reflection vectors, and sparkling energy decay.
  - **AI Bots**: 3 autonomous bots (*NewtonBot*, *GalileoBot*, *KeplerBot*) with raycast line-of-sight targeting, randomized patrol vectors, and smart obstacle avoidance.
  - **Dynamic Power-Ups**:
    - ⚡ *Quantum Dash*: +80% thruster velocity boost for fast flanking.
    - 🛡️ *Kinetic Shield*: Invulnerability bubble and deflection barrier.
    - 💥 *Triple Blast*: 3-way spread laser cannons for room-clearing coverage.
    - 💣 *Graviton EMP*: Radial 360-degree shockwave detonation that stuns and clears nearby opponents.
  - **Input Schemes**: Full keyboard (WASD / Arrow Keys + Space to fire) plus on-screen touch D-Pad and Fire button for Chromebooks and iPads.
  - **Combat Feedback**: Knockout kill feed, HP/Shield bars, recharge indicators, and particle explosions.
- **Web Audio API Synthesizer (`GameArena.SoundFX`)**:
  - `click()`: 800Hz $\rightarrow$ 300Hz sine chirp (30ms).
  - `tug()`: 140Hz $\rightarrow$ 65Hz triangle whoosh with low-pass impact.
  - `correct()`: Four-note major triad arpeggio (C5, E5, G5, C6).
  - `wrong()`: 180Hz sawtooth buzz.
  - `laser()`: 920Hz $\rightarrow$ 210Hz futuristic frequency modulation blip.
  - `hit()`: Low-pass filtered noise crunch for ballistic impact.
  - `explosion()`: Sub-bass decay rumble with distortion.
  - `powerup()`: Rising 320Hz $\rightarrow$ 880Hz square wave sweep.
  - `victory()`: Multi-oscillator 4-note victory fanfare.

---

### E. Student Runner Gamified Pacing Loop & Victory Podium (`index.html`)

1. **Gamified Arcade HUD (`#gamified-arcade-hud`)**:
   - Dynamic game title badge (⚔️ *Tug of War*, ⛰️ *Mastery Peak*, ⚡ *Wayarena*).
   - Round tracker (`Round 1`, `Round 2`, etc.) and progress bar (`X / Y Qs`).
   - Master Game Clock: Large amber font displaying deterministic countdown (`05:00`) synchronized to `Date.now()`.
2. **Knowledge Phase $\rightarrow$ Action Phase Rhythm**:
   - Student answers AP Physics multiple-choice questions.
   - Each correct answer boosts the **Quiz Power Multiplier** (`x1.25`, `x1.50`, etc.) and plays synthesized sound effects.
   - Upon reaching the round target (e.g. 4 questions), screen unlocks the **Action Phase** (`#gamified-arena-modal`).
   - Student plays a high-energy mini-game round (15s for Tug of War; 25s for Wayarena):
     - In *Tug of War*, tapping barrels applies rope pulls amplified by their quiz accuracy multiplier!
     - In *Wayarena*, student navigates the sci-fi maze, blasts bot classmates, picks up power-ups, and racks up knockouts!
   - When the round concludes, victory fanfare sounds and student seamlessly returns to the next question set.
3. **Master Game Completion & Victory Podium (`#gamified-results-podium`)**:
   - When the master game duration hits `0:00`, the session finishes with celebratory fanfare.
   - The results screen reveals a **3D-Style Victory Podium** displaying:
     - 1st, 2nd, and 3rd place champions with custom player and bot standings.
     - Total Knockouts / Pull Advantage / Summit Altitude metrics.
     - Total Mini-Game Rounds cleared.
     - Arcade Mastery Rank (e.g., *Quantum Apex*, *Vector Striker*, *Titan Puller*).
   - Coexists harmoniously with standard AP Physics score, accuracy percentage, time spent, Concept Mastery Breakdown, and College Board rationale review.
4. **Schema Resilience & URL Param Hydration**:
   - `createAssignmentOnCloud` and `updateAssignment` automatically catch PostgreSQL error `42703` (missing column) and re-dispatch safely without dropping assignments.
   - Student join URLs include `?join=CODE&game=wayarena&mins=5&qround=4`, ensuring 100% gamified fidelity even before cloud migrations are run.

---

### F. Multi-IDE Replication Checklist
To replicate this gamified architecture in another IDE (VS Code, Cursor, WebStorm):
1. **Schema**: Run the new columns migration in your Supabase SQL editor:
   ```sql
   alter table public.active_assignments add column if not exists game_mode text not null default 'classic';
   alter table public.active_assignments add column if not exists game_duration_minutes integer not null default 5;
   alter table public.active_assignments add column if not exists questions_per_round integer not null default 4;
   alter table public.active_assignments add column if not exists show_answer_timing text not null default 'immediate';
   alter table public.active_assignments add column if not exists student_accommodations boolean not null default true;
   ```
2. **Config**: Include `"game_mode"`, `"game_duration_minutes"`, `"questions_per_round"`, `"show_answer_timing"`, `"student_accommodations"` in your state normalization dictionary (`supabase_config.js`).
3. **Engine**: Copy `data/game_arena.js` into your static asset folder.
4. **Teacher Portal**: Add `#student-gamified-controls-box` and `#game-studio-modal` markup and handlers to `teacher.html`.
5. **Student Portal**: Add `#gamified-arcade-hud`, `#gamified-arena-modal`, `#gamified-results-podium`, and the round progress handlers to `index.html`.
6. **Zero Dependencies**: Requires zero build steps (`npm`, `webpack`, `vite` not required) — runs purely in vanilla JavaScript, Web Audio API, and HTML5 Canvas on any static server or web platform.

---

## 12. 2.5D Chibi Physics Battlers & Mouse-Aim Ballistics System (Wayarena Engine Upgrade)

### A. Context & Architectural Rationale
In earlier builds, top-down maze combat rendered abstract 2D circular discs with colored slice arcs, and the canvas overlay mistakenly displayed a static barrel-tapping prompt from Tug of War. This caused confusion regarding game mechanics and character identities.

To deliver an engaging, intuitive classroom experience comparable to Brawl Stars, Gimkit, and Blooket, the Wayarena engine in `data/game_arena.js` was upgraded to a **2.5D Procedural Chibi Battlers & Mouse-Aim Ballistics System**.

---

### B. Procedural 2.5D Chibi Battlers (`drawBattleAvatar`)
Every combatant is rendered purely via mathematical Canvas 2D vector primitives—ensuring zero external sprite sheet downloads, instant offline startup, and crisp rendering on Retina / Hi-DPI displays.

1. **Depth & Grounding**:
   - Translucent black elliptical drop shadow beneath feet (`rgba(0, 0, 0, 0.45)`).
2. **Animated Locomotion**:
   - Alternating running boots with dynamic stride oscillation: `legOffset = isMoving ? Math.sin(walkCycle) * 4 : 0`.
   - Boot base with character-themed sole accents.
3. **Armored Torso & Reactor Core**:
   - Dark battle armor chassis with colored chestplate.
   - Center glowing reactor core pulsing at `Math.sin(time * 6)`.
4. **Vector Plasma Blaster Rifle & Muzzle Flash**:
   - Dual-tone carbine body with neon energy heatsink and extended muzzle.
   - Gloved hands gripping foregrip and trigger stock.
   - Blaster rotates continuously around the character center to track aiming `angle`.
   - Dynamic muzzle flash burst flares on discharge for 4 frames.
5. **Cute Chibi Head & Anime Expression**:
   - Warm skin tone (`#fed7aa`) with soft rosy blushing cheeks.
   - Large anime eyes with colored irises, pupils, and white specular highlights.
   - Angled eyebrows conveying battle focus.
   - Cheerful determined battle smile.
6. **Distinct Historical Scientist Personas**:
   - **Player ("You")**: Spiky hero anime hair with neon cyan streak, plus a cyber holographic monocle visor over the right eye with HUD reticle.
   - **NewtonBot**: Powdered white baroque curls cascading around his head, paired with a golden apple chest emblem.
   - **GalileoBot**: Brunette wavy scientist hair, professor beard, and brass celestial stargazing goggles on forehead.
   - **KeplerBot**: Emerald astronaut dome helmet with an orbiting planetary ring antenna and orbiting gold planetoid.
7. **Kinetic Shield Bubble**:
   - 3D translucent cyan spherical bubble with glowing neon rim and rotating orbital nodes.
8. **Overhead Status Display**:
   - Multi-segment health bar (green $\rightarrow$ yellow $\rightarrow$ red gradient).
   - High-contrast player name badge (`YOU [P1]`, `NewtonBot [AI]`, etc.).
   - Active powerup indicator tag (`⚡ SPEED`, `💥 3-WAY`, `💣 EMP`).

---

### C. Decoupled Movement & Precision Mouse-Aiming
The player's input model was decoupled from directional movement:
- **Desktop (Mouse & Keyboard)**:
  - **Movement**: `W, A, S, D` and Arrow Keys smoothly steer the character through corridors with continuous wall collision checking.
  - **Aiming**: Moving the mouse over the canvas calculates the exact angle towards the cursor.
  - **Targeting Laser Sight**: A high-tech dotted neon guide line projects from the blaster muzzle directly to the crosshair reticle at the cursor position.
  - **Firing**: Left-clicking anywhere on the canvas or pressing Spacebar fires directly along the targeting beam.
- **Mobile & Touch**:
  - Touch-dragging moves and steers the player.
  - Dedicated on-screen **FIRE ⚡** button fires lasers without interrupting movement.
- **Dynamic Overlay Instructions**:
  - `#arena-overlay-hint` in `index.html` dynamically displays:
    - *Wayarena*: `"🎯 WASD: Move • Mouse: Aim • Click / Space: BLAST bots & grab powerups!"`
    - *Tug of War*: `"👆 Tap wooden barrels or screen rapidly to pull the rope!"`
    - *Mastery Peak*: `"👆 Tap screen rapidly to climb the icy summit!"`

---

### D. Floating Combat Text & Juiced Visual Feedback
1. **`FloatingTextEmitter`**:
   - Hits: `💥 -1 HP` floating upward and fading.
   - Shield blocks: `🛡️ BLOCKED!` in bright cyan.
   - Knockouts: `👑 ELIMINATED! +150 PTS` in gold.
   - Respawns: `🔄 RESPAWNING...` with temporary immunity shield.
   - Powerup pickup: Floating banner announcing `⚡ SPEED BOOST!`, `🛡️ KINETIC SHIELD!`, `💥 3-WAY BLASTER!`, `💣 GRAVITON EMP BLAST!`.
2. **Camera Impact Shake**:
   - Hits and knockouts trigger subtle 2D canvas translation shake (`this.shake = 8`), adding punchy arcade weight.
3. **Powerup Supply Crates**:
   - Floating 3D supply crates with rotating orbital plasma rings and clear floating badges (`[ ⚡ SPEED ]`, `[ 🛡️ SHIELD ]`, `[ 💥 3-WAY ]`, `[ 💣 EMP ]`).

---

### E. Replication Checklist for Other IDEs
When replicating in another environment:
1. Ensure `FloatingTextEmitter` is initialized in your game loop.
2. Bind both `pointermove` and `pointerdown` with `e.pointerType` checks to distinguish touch drag from desktop mouse aim.
3. Set line dash `[4, 4]` on canvas context for the targeting laser sight.
4. Scale all avatars proportionally using `cellW` and `cellH` from `setupHiDpi(canvas)`.



