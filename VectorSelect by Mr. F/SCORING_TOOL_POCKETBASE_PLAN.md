# Refined Architectural & Deployment Plan: Standalone PocketBase for Scoring Tool

**Target Application:** `Scoring Tool` (`..\Scoring Tool\index.html`)  
**Dedicated Backend Host:** Standalone PocketBase in `Scoring Tool\pocketbase\` (Port 8091)  
**Strict Safety Guarantee:** **100% Zero-Touch Isolation for VectorSelect** (VectorSelect on Port 8090 is completely untouched and preserved)  
**Legacy Migration:** **Complete Deprecation & Removal of Supabase**  
**Document Location:** `c:\Users\fahad\Documents\GitHub\APPC-M\VectorSelect by Mr. F\SCORING_TOOL_POCKETBASE_PLAN.md`  
**Revision:** 2.0 (Refined Standalone & Isolated Architecture)  

---

## 1. Prime Directives: VectorSelect Safety & Supabase Elimination

> [!IMPORTANT]
> ### Directive 1: Zero-Touch Isolation for VectorSelect
> Under NO circumstances will VectorSelect's codebase, collections, database (`pb_data/data.db`), hooks, or port (`8090`) be modified or shared.
> - **Scoring Tool runs in its own isolated folder**: `..\Scoring Tool\pocketbase\`
> - **Scoring Tool runs on its own dedicated port**: `http://127.0.0.1:8091`
> - **Independent SQLite Database**: `..\Scoring Tool\pocketbase\pb_data\data.db`
> - Even if Scoring Tool is stopped, reinstalled, or reset, VectorSelect remains 100% unaffected.

> [!CAUTION]
> ### Directive 2: Complete Deprecation & Removal of Supabase
> Historical plans in the repository (e.g., `.kilo/plans/1790123586486-classroom-hub-supabase-sync.md`) contemplated using Supabase (`https://cabjyjqbfnntcdqqmjhu.supabase.co`) with a `curve_state` table for curve tools.
> **This plan formally eliminates Supabase:**
> 1. **No External Cloud Dependencies**: Avoids recurring SaaS fees, remote API key management, and internet outage failures in classrooms.
> 2. **No Supabase Scripts or SDKs**: Any remaining Supabase references, CDNs, or `/api/curve` stubs are purged.
> 3. **100% Local-First PocketBase**: Single Go binary, zero configuration, instant boot, offline-first operation, and sub-millisecond local SQLite queries.

---

## 2. System Architecture: Fully Decoupled Two-App Ecosystem

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         VECTORSELECT BY MR. F                               │
│                         (100% UNTOUCHED & ISOLATED)                         │
│                                                                             │
│   • Frontend: index.html (Student Runner) & teacher.html (Console)          │
│   • Backend:  VectorSelect by Mr. F\pocketbase\pocketbase.exe               │
│   • Port:     http://127.0.0.1:8090                                         │
│   • Database: VectorSelect by Mr. F\pocketbase\pb_data\data.db              │
│   • Tables:   answer_keys, active_assignments, exam_submissions, live_events│
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                     (Optional Passive Read-Only Query)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SCORING TOOL APP                                  │
│                      (DEDICATED STANDALONE SYSTEM)                          │
│                                                                             │
│   • Frontend: Scoring Tool\index.html                                       │
│   • Backend:  Scoring Tool\pocketbase\pocketbase.exe                        │
│   • Port:     http://127.0.0.1:8091 (Prevents all port collision)           │
│   • Database: Scoring Tool\pocketbase\pb_data\data.db (Own SQLite)          │
│   • Tables:   scoring_classes, scoring_assignments, scoring_records,        │
│               scoring_presets                                               │
│   • Fallback: Dual-storage with zero-break localStorage                     │
│   • Supabase: COMPLETELY REMOVED & REPLACED                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Dedicated Directory Layout (`Scoring Tool\pocketbase\`)

Scoring Tool possesses its own independent backend directory inside `..\Scoring Tool\`:

```text
Scoring Tool/
├── index.html                           <-- Main Scoring Tool Interface
├── pocketbase/                          <-- Dedicated PocketBase Directory
│   ├── pb_data/                         <-- Own SQLite database (data.db)
│   ├── pb_hooks/                        <-- Custom JS hooks (if needed)
│   ├── pb_migrations/                   <-- Auto-migration scripts
│   │   └── 1791121000_created_scoring_tool_collections.js
│   ├── pb_public/                       <-- Optional static web root
│   ├── pocketbase.exe                   <-- Standalone Windows binary
│   ├── scoring_tool_schema.json         <-- Dedicated collections schema
│   ├── run_pocketbase.bat               <-- Boots on http://127.0.0.1:8091
│   ├── LICENSE.md
│   └── CHANGELOG.md
```

### Dedicated Launcher (`run_pocketbase.bat`)
Configured specifically for port **8091**:
```cmd
@echo off
title Scoring Tool PocketBase Engine
echo Starting Scoring Tool PocketBase Backend on port 8091...
pocketbase.exe serve --http=127.0.0.1:8091 --dir=pb_data --hooksDir=pb_hooks
```

---

## 4. Dedicated Database Schema (Scoring Tool Collections)

The collections are self-contained in `Scoring Tool\pocketbase\pb_data\data.db` and defined in `scoring_tool_schema.json`:

### 1. `scoring_classes`
Stores rosters and student sorting sequences for each cohort:
- **`name`** (text, unique): `"AP Physics C"`, `"AP Physics 1"`, `"Honors Physics 1"`, `"Honors Physics 2"`
- **`period`** (text): e.g. `"Period 1"`
- **`academic_year`** (text): e.g. `"2025-2026"`
- **`roster`** (json): Array of `{ id: "s_0eu0i5j5", name: "Kenny Cao" }`
- **`sort_order`** (json): Array of student IDs preserving drag-and-drop ordering.

### 2. `scoring_assignments`
Tracks assessments and their curve configurations:
- **`class_name`** (text): Target cohort
- **`title`** (text): e.g. `"Unit 1 Progress Check"`
- **`date`** (date): Assessment date
- **`mode`** (select): `"ap"` (AP curve bands) or `"formula"` (mathematical formula)
- **`max_raw`** (number): Total points possible (default: 100)
- **`formula`** (text): e.g. `"=ROUND(RAW_PCT*1.08, 1)"`
- **`categories_config`** (json): Weights and scaling for MCQ, FIB, SA, FRQ:
  ```json
  {
    "mcq": { "en": true, "mx": 40, "sc": 52 },
    "fib": { "en": true, "mx": 10, "sc": 10 },
    "sa":  { "en": true, "mx": 15, "sc": 15 },
    "frq": { "en": true, "mx": 48, "sc": 48 }
  }
  ```
- **`bands_config`** (json): AP 1–5 score cutoff thresholds:
  ```json
  [
    { "ap": 5, "rMin": 70, "rMax": 100, "cMin": 90, "cMax": 100 },
    { "ap": 4, "rMin": 54, "rMax": 69.9, "cMin": 75, "cMax": 89 },
    { "ap": 3, "rMin": 40, "rMax": 53.9, "cMin": 60, "cMax": 74 },
    { "ap": 2, "rMin": 25, "rMax": 39.9, "cMin": 30, "cMax": 59 },
    { "ap": 1, "rMin": 0, "rMax": 24.9, "cMin": 0, "cMax": 29 }
  ]
  ```

### 3. `scoring_records`
Stores individual student scores for each assignment:
- **`assignment_id`** (text): Relation to assignment
- **`class_name`** (text): Cohort name
- **`student_id`** (text): Student unique ID
- **`student_name`** (text): Student display name
- **`mcq`**, **`fib`**, **`sa`**, **`frq`** (text): Raw category inputs
- **`raw_score`** (number): Composite raw score
- **`raw_pct`** (number): Raw percentage
- **`curved_pct`** (number): Final curved percentage
- **`ap_score`** (number): Assigned AP score (1–5)
- **`mode`** (text): `"ap"` or `"formula"`
- **`row_order`** (number): Row index

### 4. `scoring_presets`
Stores reusable curve formula formulas and AP cutoff profiles:
- **`name`** (text, unique): e.g. `"Strict AP Mechanics Standard"`
- **`type`** (select): `"ap_bands"` or `"formula"`
- **`preset_data`** (json): Stored bands or formula string
- **`is_default`** (bool): Default selection for new assignments

---

## 5. Excision & Removal of Supabase and Legacy Stubs

### What Must Be Removed from `Scoring Tool/index.html`
1. **Purge `/api/curve` calls**:
   - In lines 184–192 and 195: Remove `fetch('/api/curve')` which was an old Classroom Hub server endpoint.
   - Replace with the local PocketBase client pointing to `http://127.0.0.1:8091`.
2. **Purge Classroom Hub References**:
   - Clean up notes mentioning "Classroom Hub".
3. **No External CDNs for Supabase**:
   - Verify that zero `@supabase/supabase-js` scripts exist in the document head.
4. **Implement Dual-Storage Adapter**:
   - The app continues writing immediately to `localStorage` (`scoring_tool_curve_v1`).
   - If PocketBase is running on `http://127.0.0.1:8091`, it seamlessly syncs scores in the background.
   - If PocketBase is stopped, the app works 100% normally offline without error dialogs or blocking.

---

## 6. Non-Invasive Passive Bridge to VectorSelect

If the teacher wishes to pull quiz scores from VectorSelect into the Scoring Tool:
- **Strictly Passive Read-Only**: Scoring Tool will send an HTTP `GET` request to VectorSelect's public or teacher read endpoint on port 8090 (`http://127.0.0.1:8090/api/collections/exam_submissions/records`).
- **Zero Writing**: Scoring Tool will **NEVER** write, update, or delete records in VectorSelect's database.
- **CSV Fallback**: The teacher can alternatively export a CSV from VectorSelect and import it into Scoring Tool with zero network interaction between the two apps.

---

## 7. Execution Checklist & Phased Rollout

| Step | Action | Safety Guarantee |
| :--- | :--- | :--- |
| **Step 1** | Create `Scoring Tool\pocketbase\` with `pb_data/`, `pb_migrations/`, `pb_hooks/`, and `run_pocketbase.bat` (Port 8091) | Isolated directory; VectorSelect untouched |
| **Step 2** | Initialize schema with `scoring_tool_schema.json` and migration `1791121000_created_scoring_tool_collections.js` | Dedicated collections; zero overlap with VectorSelect |
| **Step 3** | Clean `Scoring Tool\index.html`: Remove Supabase references and dead `/api/curve` stubs | Purges legacy dead code |
| **Step 4** | Implement PocketBase SDK connection to `http://127.0.0.1:8091` with automatic `localStorage` fallback | Offline-first; works whether PocketBase is on or off |
| **Step 5** | Verify VectorSelect (`http://127.0.0.1:8090`) continues running completely unaffected | Complete isolation verified |
| **Step 6** | Document in `implementation.md` and commit to Git | Reproducibility guaranteed |

---

## 8. Summary of Guarantees
1. **VectorSelect Integrity**: VectorSelect remains on port `8090` with its own database, answer keys, live quiz pacing, and student exam runner completely untouched.
2. **Scoring Tool Autonomy**: Scoring Tool has its own dedicated PocketBase instance on port `8091`.
3. **No Supabase Dependency**: Completely self-hosted, air-gapped, zero-cost, and private.
