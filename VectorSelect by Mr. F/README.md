# VectorSelect by Mr. F

**The High-Precision AP Physics Assessment & Class Mastery System**

VectorSelect by Mr. F is an interactive exam runner and classroom dispatch platform specifically tailored for **AP Physics 1** and **AP Physics C: Mechanics**. It solves the formatting and formula problems of traditional online quiz software by serving pristine, zero-leak College Board question cards alongside synchronized pacing, on-screen scientific tools, deterrent lockdown monitoring, and live analytics.

---

## 🌟 Key Highlights & Competitive Advantages

1. **Dual Quiz Pacing Modes**:
   - **Student-Led (Self-Paced)**: Students navigate freely with flagged review, on-screen question grid, dynamic timer urgency, and review submissions.
   - **Teacher-Led (Synchronized)**: Instructor controls question-by-question pacing in real-time from the instructor live console. Supports auto-advance intervals (30s, 45s, 60s, 90s, 120s) or manual advance.
2. **Zero-Redundancy Question Cards**:
   - High-DPI question cards contain full vector formulas, diagrams, and options (A)–(D) with zero answer leakage.
   - Clean, compact letter-only selection circles (A, B, C, D) prevent duplicated option text while preserving complex figures and multi-column option tables.
3. **On-Screen Scientific Calculator**:
   - Draggable, floating scientific calculator supporting trigonometric functions (`sin`, `cos`, `tan`), logarithmic powers (`ln`, `log`), roots (`√`), constants (`π`, `e`), and keyboard input.
   - Teachers can toggle calculator access on or off per assignment.
4. **Exam Integrity & Lockdown Deterrents**:
   - Real-time tab switch tracking and window focus loss detection (`visibilitychange` / `blur`).
   - Fullscreen enforcement with warning overlays upon exit.
   - Interception of common copy/print shortcuts (`Ctrl+C`, `Ctrl+V`, `Ctrl+P`, `F12`, `PrintScreen`) and context menu blocking.
   - Integrity stats visible on the instructor roster with clean/flagged tags.
5. **Class Analytics & Export**:
   - Dynamic score distribution histograms across 5 performance buckets.
   - Hardest questions analysis calculated from real student answers vs. official answer keys.
   - One-click CSV export of student performance, times, and integrity logs.
6. **Instant Answer Review**:
   - Post-submission answer review showing student choices, official College Board keys, and complete scoring rationales.

---

## 📁 Repository & Directory Layout

```
D:\APPS\VectorSelect by Mr. F\
├── index.html                   # Student Portal (Exam Runner, Calculator, Leaderboard)
├── teacher.html                 # Instructor Portal (Dispatcher, Live Control, Analytics)
├── supabase_config.js           # Cloud & LocalStorage synchronization layer
├── supabase_schema.sql          # PostgreSQL table schemas and RLS policies
├── data/
│   ├── exams.json               # Full 104-assessment database (1,077 questions)
│   └── exams_bundle.js          # CORS-safe offline data bundle
├── assets/
│   └── cards/                   # 1,025+ high-resolution question cards (.png)
├── scripts/
│   └── build_exam_database.py   # Dual-source extraction & card generation engine
├── run_server.bat               # Starts local server on port 8888 & opens portals
├── launch_student_portal.bat    # Quick launcher for student portal
├── launch_teacher_portal.bat    # Quick launcher for instructor portal
└── implementation.md            # Replication guide and architectural documentation
```

---

## 🚀 How to Run Locally

Double-click `run_server.bat` in this folder, or open terminal:

```bash
cd "D:\APPS\VectorSelect by Mr. F"
python -m http.server 8888
```

Then visit:
- **Student Portal**: `http://localhost:8888/index.html`
- **Instructor Portal**: `http://localhost:8888/teacher.html` (Passcode: `physics2026`)

---

## 🌐 Deploying to GitHub Pages (For Your Students)

Because VectorSelect by Mr. F is a static web application with an offline bundle, you can deploy it directly to GitHub Pages in minutes:

1. Create a repository on GitHub (e.g. `vectorselect-physics`).
2. Push the files from `D:\APPS\VectorSelect by Mr. F`:
   ```bash
   cd "D:\APPS\VectorSelect by Mr. F"
   git init
   git add .
   git commit -m "Deploy VectorSelect by Mr. F"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/vectorselect-physics.git
   git push -u origin main
   ```
3. Enable GitHub Pages:
   - Go to **Settings** &rarr; **Pages**.
   - Under **Build and deployment**, select **Deploy from a branch** &rarr; `main` / `/ (root)`.
   - Click **Save**.
4. Students can now join using direct assignment links generated in your teacher portal!

---

## ⚡ Optional Cloud Sync with Supabase

The app works instantly offline using browser `localStorage`. To sync scores and assignments across multiple student devices:

1. Create a project at [supabase.com](https://supabase.com).
2. Run `supabase_schema.sql` in the **SQL Editor**.
3. In `supabase_config.js`, supply your project credentials:
   ```javascript
   const SUPABASE_CONFIG = {
     url: "https://your-project-id.supabase.co",
     anonKey: "your-anon-public-key"
   };
   ```
