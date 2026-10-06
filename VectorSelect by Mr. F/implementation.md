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
4. Serve locally with Python (`python -m http.server 8888`) or open via VS Code Live Server.
5. Access:
   - Student Runner: `http://localhost:8888/index.html`
   - Teacher Console: `http://localhost:8888/teacher.html`

---

## 6. Verification & Production Deployment Status
- **Supabase Cloud Project**: Authenticated and connected via PostgREST API with PostgreSQL Row Level Security (RLS).
- **Database Schema**: Successfully provisioned via `supabase_schema.sql` (`active_assignments`, `answer_keys`, `exam_submissions`, `session_participants`, `live_question_answers`, `live_reactions`, and real-time triggers).
- **Global CDN Delivery**: Static client configured with public credentials in `supabase_public_config.js` for worldwide classroom access on GitHub Pages.
- **Local Developer Security**: Root `.env` parser integrated into `supabase_config.js` with `.env` protected under `.gitignore`.


