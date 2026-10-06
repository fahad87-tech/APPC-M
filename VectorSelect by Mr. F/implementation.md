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
