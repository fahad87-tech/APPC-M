// =============================================================================
// Supabase client, cloud persistence, realtime sync, and local fallback
// =============================================================================

const SUPABASE_CONFIG = {
  url: String(window.VECTORSELECT_SUPABASE_URL || "").trim(),
  anonKey: String(window.VECTORSELECT_SUPABASE_ANON_KEY || "").trim()
};

const isSupabaseConfigured = () => Boolean(
  supabaseClient || (
    String(SUPABASE_CONFIG.url || (typeof window !== "undefined" && window.VECTORSELECT_SUPABASE_URL) || "").trim().startsWith("https://")
    && String(SUPABASE_CONFIG.anonKey || (typeof window !== "undefined" && window.VECTORSELECT_SUPABASE_ANON_KEY) || "").trim()
  )
);

let supabaseClient = null;
const _cloudSyncWarningAt = {};

function reportCloudSyncFailure(surface, message) {
  const key = String(surface || "cloud");
  const now = Date.now();
  if (now - (_cloudSyncWarningAt[key] || 0) < 10000) return;
  _cloudSyncWarningAt[key] = now;
  const text = message || "Cloud synchronization failed. Check the internet connection and try again.";
  console.warn(`[Cloud Sync] ${key}:`, text);
  if (typeof window !== "undefined") {
    if (typeof window.showToast === "function") window.showToast("Cloud sync problem", text, "coral", 5000);
    else if (typeof window.showTeacherToast === "function") window.showTeacherToast("Cloud sync problem", text, "coral", 5000);
  }
}

if (typeof supabase !== "undefined" && isSupabaseConfigured()) {
  try {
    supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    console.log("Supabase client initialized.");
  } catch (error) {
    console.warn("Supabase initialization failed:", error);
  }
}

// Runtime .env loader: Allows users to put credentials in a root .env file
let envLoadPromise = null;
async function ensureSupabaseInitialized() {
  if (supabaseClient) return supabaseClient;
  if (isSupabaseConfigured()) {
    if (typeof supabase !== "undefined" && !supabaseClient) {
      try {
        const u = SUPABASE_CONFIG.url || (typeof window !== "undefined" && window.VECTORSELECT_SUPABASE_URL);
        const k = SUPABASE_CONFIG.anonKey || (typeof window !== "undefined" && window.VECTORSELECT_SUPABASE_ANON_KEY);
        supabaseClient = supabase.createClient(u, k);
      } catch (e) {
        console.warn("Supabase client init error:", e);
      }
    }
    return supabaseClient;
  }

  if (!envLoadPromise) {
    envLoadPromise = (async () => {
      if (typeof window === "undefined" || !window.fetch) return null;
      const baseDir = (window.location && window.location.pathname)
        ? window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/") + 1)
        : "";
      const paths = [
        ".env",
        "./.env",
        baseDir ? `${baseDir}.env` : "/.env",
        "/.env"
      ];
      for (const p of paths) {
        try {
          const res = await fetch(p);
          if (res.ok) {
            const txt = await res.text();
            if (txt.trim().startsWith("<")) continue;
            txt.split(/\r?\n/).forEach(line => {
              const trimmed = line.trim();
              if (!trimmed || trimmed.startsWith("#")) return;
              const eq = trimmed.indexOf("=");
              if (eq === -1) return;
              const k = trimmed.slice(0, eq).trim().toUpperCase();
              const v = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
              if (k === "SUPABASE_URL" || k === "VITE_SUPABASE_URL" || k === "NEXT_PUBLIC_SUPABASE_URL" || k === "VECTORSELECT_SUPABASE_URL") {
                SUPABASE_CONFIG.url = v;
                window.VECTORSELECT_SUPABASE_URL = v;
              }
              if (k === "SUPABASE_ANON_KEY" || k === "VITE_SUPABASE_ANON_KEY" || k === "NEXT_PUBLIC_SUPABASE_ANON_KEY" || k === "VECTORSELECT_SUPABASE_ANON_KEY") {
                SUPABASE_CONFIG.anonKey = v;
                window.VECTORSELECT_SUPABASE_ANON_KEY = v;
              }
            });
            if (isSupabaseConfigured()) break;
          }
        } catch (_) {}
      }

      if (isSupabaseConfigured() && typeof supabase !== "undefined" && !supabaseClient) {
        try {
          supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
          console.log("Supabase client successfully initialized from .env");
        } catch (e) {
          console.warn("Supabase initialization from .env failed:", e);
        }
      }
      return supabaseClient;
    })();
  }
  return envLoadPromise;
}

if (typeof window !== "undefined") {
  window.isSupabaseConfigured = isSupabaseConfigured;
  window.ensureSupabaseInitialized = ensureSupabaseInitialized;
  ensureSupabaseInitialized().catch(() => {});
}

let serverClockOffsetMs = 0;
let serverClockCheckedAt = 0;
let realtimeChannels = [];

function normalizeCode(value) {
  return String(value || "").trim().toUpperCase();
}

function localAssignments() {
  try {
    return JSON.parse(localStorage.getItem("teacher_assignments") || "[]");
  } catch {
    return [];
  }
}

function saveLocalAssignments(assignments) {
  localStorage.setItem("teacher_assignments", JSON.stringify(assignments));
}

function normalizeAssignment(assignment) {
  if (!assignment) return assignment;
  return {
    ...assignment,
    join_code: normalizeCode(assignment.join_code),
    title: assignment.title || assignment.assessment_title || "Assignment",
    assessment_title: assignment.assessment_title || assignment.title || "Assignment",
    is_started: assignment.is_started === true,
    timer_paused: assignment.timer_paused === true || assignment.is_paused === true,
    timer_remaining_seconds: assignment.timer_remaining_seconds ?? assignment.remaining_seconds,
    paused_remaining_seconds: assignment.paused_remaining_seconds ?? assignment.remaining_seconds
  };
}

function mirrorAssignment(assignment) {
  const normalized = normalizeAssignment(assignment);
  const assignments = localAssignments().filter(a => normalizeCode(a.join_code) !== normalized.join_code);
  assignments.unshift(normalized);
  saveLocalAssignments(assignments);
  return normalized;
}

// Keep browser-side assignment metadata even when an older Supabase schema
// does not yet contain the newer scope fields.
const CLOUD_ASSIGNMENT_COLUMNS = new Set([
  "id", "join_code", "subject", "unit", "assessment_id", "assessment_title",
  "title", "class_period", "time_limit_minutes", "quiz_mode",
  "per_question_seconds", "current_question_index", "allow_calculator",
  "show_leaderboard", "enable_lockdown", "randomize_questions",
  "allow_student_review", "allow_review", "enable_point_redemption",
  "is_active", "is_started", "started_at", "timer_paused", "is_paused",
  "paused_remaining_seconds", "timer_remaining_seconds", "remaining_seconds",
  "discussion_active", "answer_revealed", "revealed_answer",
  "revealed_explanation", "previous_correct_answer", "question_started_at",
  "created_at", "updated_at"
]);

function assignmentForCloud(assignment) {
  return Object.fromEntries(
    Object.entries(assignment || {}).filter(([key]) => CLOUD_ASSIGNMENT_COLUMNS.has(key))
  );
}

function updateLocalAssignment(join_code, patch) {
  const code = normalizeCode(join_code);
  const assignments = localAssignments().map(assignment => (
    normalizeCode(assignment.join_code) === code
      ? normalizeAssignment({ ...assignment, ...patch })
      : assignment
  ));
  saveLocalAssignments(assignments);
}

function getServerNowMs() {
  return Date.now() + serverClockOffsetMs;
}

function getServerNowIso() {
  return new Date(getServerNowMs()).toISOString();
}

async function syncServerClock(force = false) {
  await ensureSupabaseInitialized();
  if (!supabaseClient) {
    return { success: false, offsetMs: serverClockOffsetMs, error: { message: "Supabase is unavailable." } };
  }
  if (!force && Date.now() - serverClockCheckedAt < 30000) {
    return { success: true, offsetMs: serverClockOffsetMs, cached: true };
  }

  const startedAt = Date.now();
  try {
    const { data, error } = await supabaseClient.rpc("get_server_time");
    const finishedAt = Date.now();
    if (!error && data) {
      const serverMs = Date.parse(data);
      if (Number.isFinite(serverMs)) {
        serverClockOffsetMs = serverMs - ((startedAt + finishedAt) / 2);
        serverClockCheckedAt = finishedAt;
        return { success: true, offsetMs: serverClockOffsetMs, cached: false };
      }
    }
    return { success: false, offsetMs: serverClockOffsetMs, error: error || { message: "Invalid server time response." } };
  } catch (error) {
    return { success: false, offsetMs: serverClockOffsetMs, error: { message: error?.message || "Could not synchronize with the Supabase clock." } };
  }
}

// Compatibility helpers for older saved browser code; these contain no
// provider-specific behavior and can be removed after all cached pages expire.
window.getServerNowMs = getServerNowMs;
window.getServerNowIso = getServerNowIso;
window.syncServerClock = syncServerClock;

async function loginTeacherWithSupabase(identity, password) {
  await ensureSupabaseInitialized();
  if (!supabaseClient) {
    return { success: false, error: "Supabase is not configured for this deployment." };
  }
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: identity,
    password
  });
  if (error) return { success: false, error: error.message };
  sessionStorage.setItem("teacher_authenticated", "true");
  sessionStorage.setItem("teacher_email", identity);
  return { success: true, user: data.user, session: data.session };
}

function logoutTeacherFromSupabase() {
  if (supabaseClient) supabaseClient.auth.signOut().catch(() => {});
  sessionStorage.removeItem("teacher_authenticated");
  sessionStorage.removeItem("teacher_email");
}

function isTeacherAuthenticated() {
  return sessionStorage.getItem("teacher_authenticated") === "true";
}

async function createAssignmentOnCloud(assignmentData) {
  await ensureSupabaseInitialized();
  const assignment = normalizeAssignment({
    ...assignmentData,
    is_started: false,
    created_at: assignmentData.created_at || new Date().toISOString()
  });
  mirrorAssignment(assignment);

  if (!supabaseClient) {
    return {
      success: false,
      source: "localStorage",
      data: assignment,
      error: { message: "Supabase is unavailable. This assignment cannot be shared across devices." }
    };
  }
  const { data, error } = await supabaseClient
    .from("active_assignments")
    .insert([assignmentForCloud(assignment)])
    .select()
    .single();
  if (error) {
    console.warn("Supabase assignment insert failed:", error);
    reportCloudSyncFailure("assignment", error.message || "The assignment could not be saved to Supabase.");
    return { success: false, source: "localStorage", data: assignment, error };
  }
  mirrorAssignment(data);
  return { success: true, source: "supabase", data };
}

async function fetchTeacherAssignments() {
  await ensureSupabaseInitialized();
  if (supabaseClient) {
    const { data, error } = await supabaseClient
      .from("active_assignments")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      const cloudAssignments = data.map(normalizeAssignment);
      cloudAssignments.forEach(mirrorAssignment);

      // A dispatch can exist in localStorage while an older deployment,
      // delayed replication, or a transient write failure leaves the cloud
      // query empty. Do not erase the visible assignment in that case.
      if (cloudAssignments.length > 0) return cloudAssignments;
      return localAssignments().map(normalizeAssignment);
    }
    if (error) console.warn("Supabase assignments query failed:", error);
  }
  return localAssignments().map(normalizeAssignment);
}

async function updateAssignment(join_code, patch) {
  await ensureSupabaseInitialized();
  const code = normalizeCode(join_code);
  updateLocalAssignment(code, patch);
  if (!supabaseClient) {
    return {
      success: false,
      source: "localStorage",
      error: { message: "Supabase is unavailable. Live assignment changes cannot reach students." }
    };
  }
  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await supabaseClient
      .from("active_assignments")
      .update(patch)
      .eq("join_code", code)
      .select()
      .maybeSingle();
    if (!error) {
      if (data) mirrorAssignment(data);
      return { success: true, source: "supabase", data };
    }
    lastError = error;
    if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
  }
  console.warn("Supabase assignment update failed after retries:", lastError);
  reportCloudSyncFailure("assignment", lastError?.message || "Live assignment changes could not reach Supabase.");
  return { success: false, source: "localStorage", error: lastError };
}

async function setAssignmentStatus(join_code, is_active) {
  return updateAssignment(join_code, { is_active: Boolean(is_active) });
}

async function setAssignmentQuestionIndex(join_code, current_question_index) {
  return updateAssignment(join_code, { current_question_index: Number(current_question_index) || 0 });
}

async function verifyJoinCode(join_code) {
  await ensureSupabaseInitialized();
  const code = normalizeCode(join_code);
  if (supabaseClient) {
    const { data, error } = await supabaseClient
      .from("active_assignments")
      .select("*")
      .eq("join_code", code)
      .maybeSingle();
    if (!error && data) return { found: true, assignment: normalizeAssignment(data) };
    if (error) console.warn("Supabase join-code lookup failed:", error);
  }
  const match = localAssignments().find(a => normalizeCode(a.join_code) === code);
  return match ? { found: true, assignment: normalizeAssignment(match) } : { found: false };
}

const _cachedAnswerKeys = {};

async function fetchAnswerKeysForQuiz(assessment_id) {
  const id = String(assessment_id || "").trim();
  if (!id) return null;
  if (_cachedAnswerKeys[id]) return _cachedAnswerKeys[id];

  if (window.OFFLINE_ANSWER_KEYS) {
    if (window.OFFLINE_ANSWER_KEYS[id]) {
      _cachedAnswerKeys[id] = window.OFFLINE_ANSWER_KEYS[id].keys || [];
      return _cachedAnswerKeys[id];
    }
    if (window.OFFLINE_ANSWER_KEYS[id.toLowerCase()]) {
      _cachedAnswerKeys[id] = window.OFFLINE_ANSWER_KEYS[id.toLowerCase()].keys || [];
      return _cachedAnswerKeys[id];
    }
  }

  await ensureSupabaseInitialized();
  if (!supabaseClient) return null;

  let { data, error } = await supabaseClient
    .from("answer_keys")
    .select("keys")
    .eq("assessment_id", id)
    .maybeSingle();

  if (!data && id !== id.toLowerCase()) {
    const res = await supabaseClient
      .from("answer_keys")
      .select("keys")
      .eq("assessment_id", id.toLowerCase())
      .maybeSingle();
    data = res.data;
  }

  if (error && !data) {
    console.warn("Supabase answer-key lookup failed:", error);
    return null;
  }

  const result = data && Array.isArray(data.keys) ? data.keys : null;
  if (result) _cachedAnswerKeys[id] = result;
  return result;
}

async function submitStudentExam(submissionData) {
  await ensureSupabaseInitialized();
  const record = {
    ...submissionData,
    join_code: normalizeCode(submissionData.join_code),
    percentage: Number(submissionData.percentage || submissionData.score_percentage || 0),
    score_percentage: Number(submissionData.score_percentage ?? submissionData.percentage ?? 0),
    submitted_at: submissionData.submitted_at || new Date().toISOString()
  };
  if (!supabaseClient) {
    const error = { message: "Supabase is unavailable. Your result was not submitted." };
    reportCloudSyncFailure("submission", error.message);
    return { success: false, source: "localStorage", error };
  }
  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await supabaseClient
      .from("exam_submissions")
      .insert([record])
      .select()
      .single();
    if (!error) return { success: true, source: "supabase", data };
    lastError = error;
    if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
  }
  console.warn("Supabase submission failed after retries:", lastError);
  reportCloudSyncFailure("submission", lastError?.message || "Your result was not submitted.");
  return { success: false, source: "supabase", error: lastError };
}

async function fetchSubmissionsByCode(join_code) {
  await ensureSupabaseInitialized();
  const code = normalizeCode(join_code);
  if (supabaseClient) {
    const { data, error } = await supabaseClient
      .from("exam_submissions")
      .select("*")
      .eq("join_code", code)
      .order("points", { ascending: false })
      .order("score", { ascending: false })
      .order("time_spent_seconds", { ascending: true });
    if (!error && data) return data;
    if (error) {
      console.warn("Supabase submissions query failed:", error);
      throw error;
    }
  }
  return JSON.parse(localStorage.getItem(`submissions_${code}`) || "[]");
}

async function checkInStudent(join_code, student_name) {
  await ensureSupabaseInitialized();
  const code = normalizeCode(join_code);
  if (!supabaseClient) {
    const error = { message: "Supabase is unavailable. The teacher cannot see this check-in." };
    reportCloudSyncFailure("check-in", error.message);
    return { success: false, source: "localStorage", error };
  }
  const { error } = await supabaseClient
    .from("session_participants")
    .upsert([{ join_code: code, student_name: String(student_name).trim() }],
      { onConflict: "join_code,student_name" });
  if (!error) return { success: true, source: "supabase" };
  console.warn("Supabase participant check-in failed:", error);
  reportCloudSyncFailure("check-in", error.message || "The teacher cannot see this check-in.");
  return { success: false, source: "supabase", error };
}

async function fetchParticipantsByCode(join_code) {
  await ensureSupabaseInitialized();
  const code = normalizeCode(join_code);
  if (supabaseClient) {
    const { data, error } = await supabaseClient
      .from("session_participants")
      .select("student_name, joined_at")
      .eq("join_code", code)
      .order("joined_at", { ascending: true });
    if (!error && data) {
      const names = data.map(row => row.student_name).filter(Boolean);
      return { names, count: names.length };
    }
    if (error) console.warn("Supabase participant query failed:", error);
  }
  const names = JSON.parse(localStorage.getItem(`participants_${code}`) || "[]");
  return { names, count: names.length };
}

async function submitLiveAnswer(payload) {
  await ensureSupabaseInitialized();
  const code = normalizeCode(payload.join_code);
  const record = {
    join_code: code,
    student_name: payload.student_name,
    question_real_index: Number(payload.question_real_index),
    selected_letter: payload.selected_letter ?? null,
    is_correct: Boolean(payload.is_correct),
    points: Number(payload.points || 0),
    speed_bonus: Number(payload.speed_bonus || 0),
    streak: Number(payload.streak || 0),
    recovered_points: Number(payload.recovered_points || 0),
    answered_at: new Date().toISOString()
  };
  if (!supabaseClient) {
    const error = { message: "Supabase is unavailable. Your live answer was not synced to the teacher." };
    reportCloudSyncFailure("live-answer", error.message);
    return { success: false, source: "localStorage", error };
  }
  const { error } = await supabaseClient
    .from("live_question_answers")
    .upsert([record], { onConflict: "join_code,student_name,question_real_index" });
  if (!error) return { success: true, source: "supabase" };
  console.warn("Supabase live-answer write failed:", error);
  reportCloudSyncFailure("live-answer", error.message || "Your live answer was not synced to the teacher.");
  return { success: false, source: "supabase", error };
}

async function fetchLiveAnswersByCode(join_code, question_real_index) {
  await ensureSupabaseInitialized();
  const code = normalizeCode(join_code);
  const question = Number(question_real_index);
  if (supabaseClient) {
    const { data, error } = await supabaseClient
      .from("live_question_answers")
      .select("*")
      .eq("join_code", code)
      .eq("question_real_index", question);
    if (!error && data) return data;
    if (error) console.warn("Supabase live-answer query failed:", error);
  }
  return JSON.parse(localStorage.getItem(`live_answers_${code}`) || "[]")
    .filter(row => Number(row.question_real_index) === question);
}

async function deleteAssignment(join_code) {
  await ensureSupabaseInitialized();
  const code = normalizeCode(join_code);
  if (supabaseClient) {
    const { error } = await supabaseClient.from("active_assignments").delete().eq("join_code", code);
    if (error) console.warn("Supabase assignment delete failed:", error);
  }
  saveLocalAssignments(localAssignments().filter(a => normalizeCode(a.join_code) !== code));
  ["submissions", "participants", "live_answers", "reactions"].forEach(prefix => {
    localStorage.removeItem(`${prefix}_${code}`);
  });
  return { success: true };
}

async function setAssignmentTimerState(join_code, state) {
  const patch = {};
  const fields = [
    "question_started_at", "discussion_active", "timer_paused",
    "paused_remaining_seconds", "answer_revealed", "revealed_answer",
    "revealed_explanation", "previous_correct_answer", "current_question_index",
    "per_question_seconds", "enable_point_redemption", "is_active", "is_started",
    "timer_remaining_seconds", "remaining_seconds", "is_paused"
  ];
  fields.forEach(field => {
    if (state[field] !== undefined) patch[field] = state[field];
  });
  if (patch.timer_remaining_seconds !== undefined) {
    patch.remaining_seconds = Math.max(0, Math.round(Number(patch.timer_remaining_seconds) || 0));
  }
  if (patch.timer_paused !== undefined) patch.is_paused = Boolean(patch.timer_paused);
  if (patch.is_paused !== undefined) patch.timer_paused = Boolean(patch.is_paused);
  if (patch.remaining_seconds !== undefined && patch.timer_remaining_seconds === undefined) {
    patch.timer_remaining_seconds = patch.remaining_seconds;
  }
  return updateAssignment(join_code, patch);
}

async function startAssignment(join_code) {
  return updateAssignment(join_code, {
    is_started: true,
    started_at: getServerNowIso()
  });
}

async function sendLiveEmojiReaction(join_code, arg2, arg3) {
  await ensureSupabaseInitialized();
  let student_name = arg2;
  let emoji = arg3;
  const emojis = ["🚀", "🔥", "💡", "🤯", "👏", "⚡"];
  if (emojis.includes(arg2)) {
    emoji = arg2;
    student_name = arg3;
  }
  const record = {
    join_code: normalizeCode(join_code),
    student_name: student_name || "Student",
    emoji: emoji || "🚀",
    timestamp: Date.now()
  };
  if (!supabaseClient) {
    const error = { message: "Supabase is unavailable. Your reaction was not broadcast." };
    reportCloudSyncFailure("reaction", error.message);
    return { success: false, source: "localStorage", error };
  }
  const { error } = await supabaseClient.from("live_reactions").insert([record]);
  if (!error) return { success: true, source: "supabase" };
  console.warn("Supabase reaction write failed:", error);
  reportCloudSyncFailure("reaction", error.message || "Your reaction was not broadcast.");
  return { success: false, source: "supabase", error };
}

async function fetchRecentEmojiReactions(join_code, windowMs = 3500) {
  await ensureSupabaseInitialized();
  const code = normalizeCode(join_code);
  const cutoff = Date.now() - windowMs;
  if (supabaseClient) {
    const { data, error } = await supabaseClient
      .from("live_reactions")
      .select("*")
      .eq("join_code", code)
      .gte("timestamp", cutoff)
      .order("timestamp", { ascending: true });
    if (!error && data) return data;
  }
  return JSON.parse(localStorage.getItem(`reactions_${code}`) || "[]")
    .filter(row => Number(row.timestamp) >= cutoff);
}

async function fetchLiveClassLeaderboard(join_code) {
  await ensureSupabaseInitialized();
  const { names } = await fetchParticipantsByCode(join_code);
  const code = normalizeCode(join_code);
  let answers = [];
  if (supabaseClient) {
    const { data, error } = await supabaseClient
      .from("live_question_answers")
      .select("*")
      .eq("join_code", code);
    if (error) {
      console.warn("Supabase live leaderboard query failed:", error);
      throw error;
    }
    if (data) answers = data;
  }
  if (!answers.length) answers = JSON.parse(localStorage.getItem(`live_answers_${code}`) || "[]");

  const studentMap = {};
  names.forEach(name => {
    studentMap[name] = {
      name, points: 0, baseScore: 0, speedBonus: 0, streak: 0, maxStreak: 0,
      correctCount: 0, incorrectCount: 0, unansweredCount: 0, recoveredCount: 0,
      totalAnswered: 0, recentAnswerTime: 0, isSuperMax: false
    };
  });
  answers.forEach(answer => {
    const student = studentMap[answer.student_name];
    if (!student) return;
    student.totalAnswered += 1;
    student.points += Number(answer.points || 0);
    student.speedBonus += Number(answer.speed_bonus || 0);
    if (Number(answer.recovered_points || 0) > 0) student.recoveredCount += 1;
    if (answer.is_correct) {
      student.correctCount += 1;
      student.streak += 1;
      student.maxStreak = Math.max(student.maxStreak, student.streak);
    } else {
      if (String(answer.selected_letter || "").trim()) student.incorrectCount += 1;
      else student.unansweredCount += 1;
      student.streak = 0;
    }
  });
  const leaderboard = Object.values(studentMap).map(student => ({
    ...student,
    points: Math.max(0, Math.min(120, Math.round(student.points * 10) / 10)),
    isSuperMax: student.points > 100
  }));
  leaderboard.sort((a, b) => b.points - a.points || b.maxStreak - a.maxStreak
    || b.correctCount - a.correctCount);
  leaderboard.forEach((student, index) => { student.rank = index + 1; });
  return leaderboard;
}

function subscribeToLiveAssignment(assignmentId, onUpdate) {
  if (!assignmentId) return null;
  if (!supabaseClient) {
    let subHandle = { unsubscribe: () => {} };
    ensureSupabaseInitialized().then(client => {
      if (!client) return;
      const channel = client
        .channel(`assignment-${assignmentId}`)
        .on("postgres_changes", {
          event: "UPDATE",
          schema: "public",
          table: "active_assignments",
          filter: `id=eq.${assignmentId}`
        }, payload => onUpdate(normalizeAssignment(payload.new)))
        .subscribe();
      realtimeChannels.push(channel);
      subHandle.unsubscribe = () => client.removeChannel(channel);
    });
    return subHandle;
  }
  const channel = supabaseClient
    .channel(`assignment-${assignmentId}`)
    .on("postgres_changes", {
      event: "UPDATE",
      schema: "public",
      table: "active_assignments",
      filter: `id=eq.${assignmentId}`
    }, payload => onUpdate(normalizeAssignment(payload.new)))
    .subscribe();
  realtimeChannels.push(channel);
  return channel;
}

function subscribeToLiveEvents(join_code, onEvent) {
  if (!join_code) return null;
  const code = normalizeCode(join_code);
  if (!supabaseClient) {
    let subHandle = { unsubscribe: () => {} };
    ensureSupabaseInitialized().then(client => {
      if (!client) return;
      const channel = client
        .channel(`reactions-${code}`)
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "live_reactions",
          filter: `join_code=eq.${code}`
        }, payload => onEvent(payload.new))
        .subscribe();
      realtimeChannels.push(channel);
      subHandle.unsubscribe = () => client.removeChannel(channel);
    });
    return subHandle;
  }
  const channel = supabaseClient
    .channel(`reactions-${code}`)
    .on("postgres_changes", {
      event: "INSERT",
      schema: "public",
      table: "live_reactions",
      filter: `join_code=eq.${code}`
    }, payload => onEvent(payload.new))
    .subscribe();
  realtimeChannels.push(channel);
  return channel;
}

function unsubscribeAllLiveChannels() {
  if (!supabaseClient) return;
  realtimeChannels.forEach(channel => supabaseClient.removeChannel(channel));
  realtimeChannels = [];
}

try {
  const assignments = localAssignments().map(normalizeAssignment);
  saveLocalAssignments(assignments);
} catch {
  // Storage is optional in restricted browser contexts.
}
