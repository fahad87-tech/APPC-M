# Classroom Hub GitHub Sync & Supabase Score Persistence Plan

## Goal
1. Update GitHub Classroom Hub folder with live student names from `D:\APPS\Classroom Hub\classroom_data.json`
2. Implement score persistence for GitHub curve tools via Supabase (replacing localStorage)

## Context
- Live app: `D:\APPS\Classroom Hub`
- GitHub copy: `C:\Users\fahad\Documents\GitHub\APPC-M\Complete Clasroom Tool\`
- Live student source: `classroom_data.json` (current Sept 22 roster)
- GitHub templates: `students_data.json`, `classes_data.json` (old template)
- Curve tools currently use `localStorage` for scores (not persistent across devices)
- Supabase credentials provided: URL + anon key

## Decisions
- **Student names**: Use live/current roster from `classroom_data.json` (not template)
- **Name source**: Make `students_data.json` the single source of truth - update all curve tools to load from it
- **Score persistence**: Replace `localStorage` with Supabase `curve_state` table

## Supabase Setup
```
Project URL: https://cabjyjqbfnntcdqqmjhu.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhYmp5anFiZm5udGNkcXFtamh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMDY5NzgsImV4cCI6MjEwNTY4Mjk3OH0.2tpKcvCwVT7WM-30g6uCFC_5cUULkq3CghwgRHPjAAk

Table schema (run in Supabase SQL editor):
create table curve_state (
  class_id   text primary key,   -- e.g. "AP Physics C"
  state      jsonb not null,     -- full per-class curve state
  updated_at timestamptz not null default now()
);
alter table curve_state enable row level security;
create policy "anon full access" on curve_state for all using (true) with check (true);
```

## Implementation Tasks

### 1. Update Student Data Files
**Files to modify:**
- `C:\Users\fahad\Documents\GitHub\APPC-M\Complete Clasroom Tool\students_data.json`
- `C:\Users\fahad\Documents\GitHub\APPC-M\Complete Clasroom Tool\classes_data.json`

**Action:**
Extract live roster from `D:\APPS\Classroom Hub\classroom_data.json` → convert to required format → overwrite both files.

**Format for students_data.json:**
```json
{
  "classes": {
    "AP Physics C": [
      { "id": "apc_will", "name": "Will", "row": 3, "pair_position": 1 },
      ...
    ],
    "AP Physics 1": [ ... ],
    "Honors Physics 1": [ ... ],
    "Honors Physics 2": [ ... ]
  },
  "last_updated": "2026-09-22",
  "version": "2.0"
}
```

**Format for classes_data.json:**
```json
{
  "classes": {
    "AP Physics C": [
      { "id": "s_0eu0i5j5", "name": "Kenny Cao", "row": 3, "pair_position": 1 },
      ...
    ],
    ...
  },
  "last_rotation": { ... },
  "callLog": { ... },
  "curve": { ... }
}
```

### 2. Update Curve Tools for Supabase Persistence
**Files to modify:**
- `AP_Curving_Tool.html`
- `Curving_Tool.html` 
- `Curve_Manager.html`

**Common changes per file:**

#### A. Add Supabase client initialization

Add the CDN script tag to `<head>` (before the inline `<script>`):

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

Then in the inline `<script>`, after the existing constants:

```javascript
const SUPABASE_URL = 'https://cabjyjqbfnntcdqqmjhu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhYmp5anFiZm5udGNkcXFtamh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMDY5NzgsImV4cCI6MjEwNTY4Mjk3OH0.2tpKcvCwVT7WM-30g6uCFC_5cUULkq3CghwgRHPjAAk';

// Initialize Supabase client (the CDN exposes a global `supabase` namespace)
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

⚠️ **Naming note**: the CDN exposes a global `supabase` object. Do NOT declare `let supabase` — it would shadow the global. Use a distinct name like `supabaseClient` for the client instance.

#### B. Replace localStorage functions with Supabase equivalents
Replace these function pairs:
- `loadData()` / `saveData()` 
- `loadMainData()` / `saveMainData()`
- `loadOrders()` / `saveOrders()`
- `loadApBands()` / `saveApBands()`
- `loadFormulas()` / `saveFormulas()`
- `loadAssignments()` / `saveAssignments()`

With Supabase versions (use `supabaseClient` in all calls):
```javascript
// Load entire app state from Supabase
async function loadSupabaseState() {
  try {
    const { data, error } = await supabaseClient
      .from('curve_state')
      .select('*');
    
    if (error) throw error;
    
    // Convert array to object keyed by class_id
    const stateObj = {};
    data.forEach(row => {
      stateObj[row.class_id] = row.state;
    });
    
    return stateObj;
  } catch (error) {
    console.error('Error loading state from Supabase:', error);
    return {};
  }
}

// Save state to Supabase (upsert)
async function saveSupabaseState(state) {
  try {
    const updates = Object.entries(state).map(([class_id, stateData]) => ({
      class_id,
      state: stateData,
      updated_at: new Date().toISOString()
    }));
    
    const { error } = await supabaseClient
      .from('curve_state')
      .upsert(updates, { onConflict: ['class_id'] });
    
    if (error) throw error;
  } catch (error) {
    console.error('Error saving state to Supabase:', error);
  }
}
```

#### C. Modify student data loading
All tools should load students from `students_data.json` via fetch:
```javascript
// Replace embedded defaults/hardcoded arrays
async function loadStudentsFromJSON() {
  try {
    const response = await fetch('students_data.json?t=' + Date.now());
    if (!response.ok) throw new Error('Failed to load students_data.json');
    const data = await response.json();
    return data.classes || {};
  } catch (error) {
    console.error('Error loading students_data.json:', error);
    return {}; // fallback to empty
  }
}
```

Then use this in initialization instead of embedded arrays.

#### D. Update initialization sequence
Change from:
1. loadDefaults() 
2. syncFromRotatorData()
To:
1. loadStudentsFromJSON() → populate initial state
2. loadSupabaseState() → override with persisted scores
3. syncFromRotatorData() → handle live updates from Class Rotation tool

### 3. Specific File Changes

#### AP_Curving_Tool.html
- Replace `DEFAULT_STUDENTS_CLASS1`/`DEFAULT_STUDENTS_CLASS2` loading with `loadStudentsFromJSON()`
- Replace `STORAGE_KEY` localStorage usage with Supabase functions
- Update `loadDefaults()` to use fetched student data
- Update `saveData()` to call `saveSupabaseState()`

#### Curving_Tool.html (and Curve_Manager.html which is similar)
- Already loads from `students_data.json` via Class Rotation sync
- Need to add direct fetch fallback if sync fails
- Replace localStorage persistence with Supabase
- Update `save()` function to use Supabase

### 4. Build Process Update
The `build_combined.py` script in GitHub root loads `students_data.json` for the combined app, so updating that file will automatically propagate to `Combined_App.html`.

### 5. Validation Steps
After implementation:
1. Verify GitHub `students_data.json` and `classes_data.json` match live roster
2. Test curve tools load correct student names
3. Enter scores in curve tools
4. Verify scores persist after page refresh
5. Verify scores appear in different browser/device
6. Check Supabase table contains expected data
7. Verify combined app still works correctly

## Risk Mitigation
- **Backup originals**: Copy modified files to `.bak` before changes
- **Fallback logic**: If Supabase fails, warn user and fall back to localStorage
- **Gradual rollout**: Test one tool first, then others
- **Supabase security**: Anon key only allows insert/select/update on our table (RLS enabled)

## Open Questions
None - all decisions made and information provided.

## Tasks Ready for Implementation
1. Update student JSON files with live data
2. Modify AP_Curving_Tool.html for Supabase + JSON loading
3. Modify Curving_Tool.html for Supabase + JSON loading  
4. Modify Curve_Manager.html for Supabase + JSON loading
5. Verify implementation works