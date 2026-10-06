# VectorSelect by Mr. F — Master Implementation Specification

## 1. Overview & System Architecture
VectorSelect is a high-performance web classroom assessment platform designed for AP Physics C: Mechanics. It supports both **Teacher-Led Synchronized Pacing** and **Student-Led Independent Modes**.

### Core Architecture
- **Frontend**: Pure vanilla modern JavaScript (ES6+), HTML5, Tailwind CSS, KaTeX math typesetting, and Lucide icons. Single-page zero-build architecture.
- **Backend**: Embedded PocketBase SQLite database running locally on `http://127.0.0.1:8090`.
- **Static Hosting**: Local HTTP server on port 8888 or direct static deployment.
- **Offline Reliability**: Gracefully falls back to offline answer keys, local assessment schemas, and localStorage telemetry if the PocketBase service is unreachable.

---

## 2. Key Features

### A. Dual Assessment Modes
1. **Teacher-Led Live Pacing (`teacher_led`)**:
   - The instructor centrally controls the active question index (`current_question_index`).
   - All student clients automatically sync instantaneously via Server-Sent Events (SSE) backed by a 1-second heartbeat polling fallback.
   - **Zero-Drift Synchronized Timer**: Teacher broadcasts `timer_remaining_seconds` every 1 second without throttling. The student countdown timer ticks down at 1000ms intervals and snaps into direct lockstep with teacher clock whenever received (eliminating 1-2s lag/drift).
   - **Pedagogical Confidentiality**: During live question answering while time is remaining, student choices remain neutrally locked without revealing correctness or distractor keys.
   - **Instant Evaluation & Official Key Reveal**: When the timer expires (`perQRemaining <= 0` or teacher remaining reaches 0) OR when the instructor clicks **End & Discuss** / **Reveal Key**, the student screen immediately reveals:
     - The official correct answer highlighted in vibrant emerald green (`.choice-correct`, `opacity: 1 !important`).
     - The student's chosen option highlighted in coral/rose red if incorrect (`.choice-wrong`, `opacity: 1 !important`).
     - An official verdict banner displaying the result status ("✓ Correct!", "✕ Incorrect", or "⚠️ No Answer Submitted") along with the authoritative College Board rationale/explanation.
   - **Clean Question State Isolation**: Advancing to the next question clears discussion and reveal states atomically, wiping all previous locks, choices, and evaluation banners, and immediately restores choice buttons (A, B, C, D) to active, clickable states (`pointer-events: auto`, `opacity: 1`).
   - **Strict Response Deduplication**: Student live telemetry answers are strictly deduplicated by case-insensitive student name and numeric question index, ensuring each student accounts for exactly one entry in class response histograms, AP Classroom telemetry, and the live leaderboard.
2. **Student-Led Self-Paced (`student_led`)**:
   - Students navigate between questions freely via sidebar navigation grid or Next/Previous buttons.
   - Overall exam timer counts down to submission.
   - Instant feedback or post-submission review depending on assessment settings.

### B. High-Resolution Question Cards & Interface
- Card images scale dynamically with full zoom and pan controls.
- Quick Formula Sheet drawer (AP Physics C official tables).
- Interactive Free Body Diagram (FBD) Scratchpad with vector drawing tools and canvas clearing.
- In-app scientific calculator.

### C. Gamified Scoring & Point Redemption
- **Dynamic Scoring Range**: 0 to 120 points (100 base points + up to 20 speed/streak bonus points).
- **Streak Multipliers**: Consecutive correct answers grant streak badges and bonus multipliers.
- **Procedural Point Redemption**:
  - Gated strictly to Question 2+ and only if the student missed the immediately preceding question.
  - Generates either an interactive physics simulation or an analytical scenario to recover up to +3.5 lost points per question.

### D. Teacher Live Control HUD & Telemetry
- Ultra-compact HUD bar with question counters, timer controls, and layout toggle (Split View vs. Cinema Mode).
- Real-time student participation dots and distractor distribution bars (A, B, C, D, and Unanswered).
- AP Classroom-style inspection modal showing students grouped by choice selection.
- Live Leaderboard modal (keyboard shortcut `L`) showcasing ranked student standings and scores.

---

## 3. Data Schema (PocketBase)

### Collections
1. **`active_assignments`**:
   - `join_code` (text, unique, 6 characters, uppercase)
   - `assessment_id` (text, matches quiz database ID)
   - `assessment_title` (text)
   - `quiz_mode` (`teacher_led` | `student_led`)
   - `current_question_index` (number, 0-indexed)
   - `per_question_seconds` (number)
   - `timer_remaining_seconds` (number)
   - `question_started_at` (datetime)
   - `timer_paused` (bool)
   - `paused_remaining_seconds` (number)
   - `discussion_active` (bool)
   - `answer_revealed` (bool)
   - `revealed_answer` (text)
   - `revealed_explanation` (text)
   - `previous_correct_answer` (text)
   - `enable_point_redemption` (bool)
   - `is_started` (bool)
   - `is_active` (bool)

2. **`live_answers`**:
   - `join_code` (text)
   - `student_name` (text)
   - `question_index` (number)
   - `selected_letter` (text: 'A', 'B', 'C', 'D' or null)
   - `is_correct` (bool)
   - `is_locked` (bool)
   - `points_awarded` (number)
   - `recovered_points` (number)

3. **`participants`**:
   - `join_code` (text)
   - `names` (json array of student names)

---

## 4. Port Configuration & Startup

- **`START POCKET.bat`**:
  - VectorSelect PocketBase database: `http://127.0.0.1:8090` (dedicated, isolated from Classroom Hub Schedule on 8095)
  - Scoring Tool PocketBase database: `http://127.0.0.1:8091`
  - Static Web Server: `http://localhost:8888`
- **Port Allocation**:
  - `8090`: PocketBase VectorSelect
  - `8091`: PocketBase Scoring Tool
  - `8092`: Lesson Planner
  - `8095`: Classroom Hub Schedule Server (migrated from 8090 to prevent PocketBase collisions)
  - `8888`: VectorSelect Static Web Server
- **URLs**:
  - Student Interface: `http://localhost:8888/index.html`
  - Teacher Console: `http://localhost:8888/teacher.html`
  - PocketBase Admin: `http://127.0.0.1:8090/_/`

---

## 5. Replication Guide for Any IDE
1. Clone the repository into any local directory.
2. Ensure PocketBase binary is placed in `./pocketbase/pocketbase.exe` (or Linux/macOS equivalent `pocketbase`).
3. Launch PocketBase with `--http=127.0.0.1:8090 --dir=pb_data`.
4. Serve static files with Python (`python -m http.server 8888`) or VS Code Live Server.
5. All teacher-led pacing, timer synchronization, and student scoring will function seamlessly out-of-the-box.
