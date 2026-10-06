// ==============================================================================
// Scoring Tool PocketBase Client Adapter
// File: scoring_pocketbase_config.js
// ==============================================================================
// Dual-storage adapter: instant localStorage (<1ms) + async PocketBase :8091
// Mirrors patterns from VectorSelect pocketbase_config.js with scoring-specific fields.
// ==============================================================================

const SCORING_PB_CONFIG = {
  url: localStorage.getItem("scoring_pocketbase_url") || "http://127.0.0.1:8091"
};

function getScoringPbUrl() {
  return SCORING_PB_CONFIG.url.replace(/\/+$/, "");
}

function setScoringPbUrl(newUrl) {
  if (!newUrl) return;
  SCORING_PB_CONFIG.url = newUrl.replace(/\/+$/, "");
  localStorage.setItem("scoring_pocketbase_url", SCORING_PB_CONFIG.url);
  initScoringPocketBase();
}

let pb = null;
let syncStatus = "offline"; // offline | syncing | online

function initScoringPocketBase() {
  if (typeof PocketBase !== "undefined") {
    try {
      pb = new PocketBase(getScoringPbUrl());
      pb.autoCancellation(false);
      console.log("[ScoringPB] Initialized client at " + getScoringPbUrl());
    } catch (e) {
      console.warn("[ScoringPB] Init error:", e);
      pb = null;
    }
  } else {
    console.log("[ScoringPB] SDK not loaded; operating in local air-gapped mode.");
  }
}

initScoringPocketBase();

// ------------------------------------------------------------------------------
// Auth helpers (same admin credentials as VectorSelect)
// ------------------------------------------------------------------------------

async function loginScoringTeacher(identity, password) {
  if (!pb) { initScoringPocketBase(); if (!pb) return { success: false, error: "PocketBase client unavailable." }; }
  try {
    const authData = await pb.collection("users").authWithPassword(identity, password);
    sessionStorage.setItem("scoring_teacher_authenticated", "true");
    sessionStorage.setItem("scoring_teacher_email", identity);
    return { success: true, user: authData.record, type: "user" };
  } catch (err1) {
    try {
      const adminData = await pb.admins.authWithPassword(identity, password);
      sessionStorage.setItem("scoring_teacher_authenticated", "true");
      sessionStorage.setItem("scoring_teacher_email", identity);
      return { success: true, admin: adminData.admin, type: "admin" };
    } catch (err2) {
      return { success: false, error: err1.message || err2.message || "Invalid credentials" };
    }
  }
}

function logoutScoringTeacher() {
  if (pb) pb.authStore.clear();
  sessionStorage.removeItem("scoring_teacher_authenticated");
  sessionStorage.removeItem("scoring_teacher_email");
}

function isScoringTeacherAuthenticated() {
  const localAuth = sessionStorage.getItem("scoring_teacher_authenticated") === "true";
  const pbAuth = Boolean(pb && pb.authStore.isValid);
  return localAuth || pbAuth;
}

// ------------------------------------------------------------------------------
// Collection CRUD: scoring_classes
// ------------------------------------------------------------------------------

async function fetchScoringClasses() {
  try {
    if (!pb) return [];
    const records = await pb.collection("scoring_classes").getFullList({ sort: "name" });
    return records;
  } catch (e) { console.warn("[ScoringPB] fetchClasses error:", e); return []; }
}

async function createScoringClass(data) {
  try {
    if (!pb) return null;
    return await pb.collection("scoring_classes").create(data);
  } catch (e) { console.warn("[ScoringPB] createClass error:", e); return null; }
}

async function updateScoringClass(id, data) {
  try {
    if (!pb) return null;
    return await pb.collection("scoring_classes").update(id, data);
  } catch (e) { console.warn("[ScoringPB] updateClass error:", e); return null; }
}

// ------------------------------------------------------------------------------
// Collection CRUD: scoring_assignments
// ------------------------------------------------------------------------------

async function fetchScoringAssignments(className) {
  try {
    if (!pb) return [];
    const filter = className ? `class_name="${className}"` : "";
    const records = await pb.collection("scoring_assignments").getFullList({ sort: "-created", filter });
    return records;
  } catch (e) { console.warn("[ScoringPB] fetchAssignments error:", e); return []; }
}

async function createScoringAssignment(data) {
  try {
    if (!pb) return null;
    return await pb.collection("scoring_assignments").create(data);
  } catch (e) { console.warn("[ScoringPB] createAssignment error:", e); return null; }
}

async function updateScoringAssignment(id, data) {
  try {
    if (!pb) return null;
    return await pb.collection("scoring_assignments").update(id, data);
  } catch (e) { console.warn("[ScoringPB] updateAssignment error:", e); return null; }
}

// ------------------------------------------------------------------------------
// Collection CRUD: scoring_records
// ------------------------------------------------------------------------------

async function fetchScoringRecords(assignmentId) {
  try {
    if (!pb) return [];
    const filter = assignmentId ? `assignment_id="${assignmentId}"` : "";
    const records = await pb.collection("scoring_records").getFullList({ sort: "row_order", filter });
    return records;
  } catch (e) { console.warn("[ScoringPB] fetchRecords error:", e); return []; }
}

async function createScoringRecord(data) {
  try {
    if (!pb) return null;
    return await pb.collection("scoring_records").create(data);
  } catch (e) { console.warn("[ScoringPB] createRecord error:", e); return null; }
}

async function updateScoringRecord(id, data) {
  try {
    if (!pb) return null;
    return await pb.collection("scoring_records").update(id, data);
  } catch (e) { console.warn("[ScoringPB] updateRecord error:", e); return null; }
}

async function deleteScoringRecord(id) {
  try {
    if (!pb) return false;
    await pb.collection("scoring_records").delete(id);
    return true;
  } catch (e) { console.warn("[ScoringPB] deleteRecord error:", e); return false; }
}

// ------------------------------------------------------------------------------
// Collection CRUD: scoring_presets
// ------------------------------------------------------------------------------

async function fetchScoringPresets() {
  try {
    if (!pb) return [];
    return await pb.collection("scoring_presets").getFullList({ sort: "name" });
  } catch (e) { console.warn("[ScoringPB] fetchPresets error:", e); return []; }
}

async function createScoringPreset(data) {
  try {
    if (!pb) return null;
    return await pb.collection("scoring_presets").create(data);
  } catch (e) { console.warn("[ScoringPB] createPreset error:", e); return null; }
}

// ------------------------------------------------------------------------------
// SSE Realtime Subscriptions for multi-device/tab sync
// ------------------------------------------------------------------------------

let _scoringRecordSubscription = null;
let _scoringAssignmentSubscription = null;

function subscribeScoringRecords(onUpdate) {
  if (!pb || !_scoringRecordSubscription) {
    try {
      _scoringRecordSubscription = "*";
      pb.collection("scoring_records").subscribe("*", (e) => {
        if (onUpdate && e.record) onUpdate(e.action, e.record);
      });
      console.log("[ScoringPB] Subscribed to scoring_records.");
    } catch (err) { console.warn("[ScoringPB] records subscription error:", err); }
  }
}

function subscribeScoringAssignments(onUpdate) {
  if (!pb || _scoringAssignmentSubscription) return;
  try {
    _scoringAssignmentSubscription = true;
    pb.collection("scoring_assignments").subscribe("*", (e) => {
      if (onUpdate && e.record) onUpdate(e.action, e.record);
    });
    console.log("[ScoringPB] Subscribed to scoring_assignments.");
  } catch (err) { console.warn("[ScoringPB] assignments subscription error:", err); }
}

function unsubscribeAllScoringChannels() {
  if (!pb) return;
  try {
    pb.collection("scoring_records").unsubscribe("*");
    pb.collection("scoring_assignments").unsubscribe("*");
    _scoringRecordSubscription = null;
    _scoringAssignmentSubscription = null;
    console.log("[ScoringPB] Unsubscribed from all scoring channels.");
  } catch (e) {}
}

// ------------------------------------------------------------------------------
// Dual-storage sync helpers
// ------------------------------------------------------------------------------

function setSyncStatus(status) {
  syncStatus = status;
  const el = document.getElementById("syncStatus");
  if (el) {
    el.textContent = status === "online" ? "🟢 PocketBase Connected (:8091)" :
                     status === "syncing" ? "🟡 Syncing..." : "🟠 Offline Mode (Local Storage Only)";
    el.style.color = status === "online" ? "#86efac" : status === "syncing" ? "#fde047" : "#fb923c";
  }
}

function saveToLocal(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { console.warn("[ScoringPB] localStorage write error:", e); }
}

function loadFromLocal(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) { return fallback; }
}

// Save scoring state with dual-write (local immediate, PocketBase background)
async function saveScoringStateDual(state) {
  saveToLocal("scoring_tool_curve_v1", state);
  setSyncStatus("syncing");
  if (!pb) { setSyncStatus("offline"); return; }
  try {
    // Upsert assignments, records, classes via PocketBase
    if (state.assignments && Array.isArray(state.assignments)) {
      for (const a of state.assignments) {
        const existing = a.id ? await pb.collection("scoring_assignments").getOne(a.id).catch(() => null) : null;
        if (existing) { await pb.collection("scoring_assignments").update(a.id, a).catch(() => {}); }
        else { await pb.collection("scoring_assignments").create(a).catch(() => {}); }
      }
    }
    if (state.records && Array.isArray(state.records)) {
      for (const r of state.records) {
        if (r.id) { await pb.collection("scoring_records").update(r.id, r).catch(() => {}); }
        else { await pb.collection("scoring_records").create(r).catch(() => {}); }
      }
    }
    setSyncStatus("online");
  } catch (e) {
    console.warn("[ScoringPB] sync error:", e);
    setSyncStatus("offline");
  }
}

// Load scoring state with fallback chain: PocketBase -> localStorage -> defaults
async function loadScoringStateDual() {
  // Try PocketBase first
  if (pb) {
    try {
      const classes = await pb.collection("scoring_classes").getFullList({ sort: "name" });
      if (classes && classes.length) {
        setSyncStatus("online");
        return { classes, assignments: [], records: [], presets: [] };
      }
    } catch (e) { /* fall through to localStorage */ }
  }
  // Fallback to localStorage
  const local = loadFromLocal("scoring_tool_curve_v1", null);
  if (local) { setSyncStatus("offline"); return local; }
  setSyncStatus("offline");
  return null;
}