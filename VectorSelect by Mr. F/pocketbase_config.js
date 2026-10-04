// ==============================================================================
// PocketBase Client & Realtime Assignment Sync
// File: pocketbase_config.js
// ==============================================================================
// Drop-in replacement for cloud & local real-time synchronization.
// Connects to PocketBase REST API & Server-Sent Events (SSE) subscriptions,
// with automatic offline fallback to HTML5 LocalStorage and window.OFFLINE_ANSWER_KEYS.
// ==============================================================================

const POCKETBASE_CONFIG = {
  // Default to localhost PocketBase (run_pocketbase.bat) or saved Cloud URL
  url: localStorage.getItem("pocketbase_url") || "http://127.0.0.1:8090"
};

function getPocketBaseUrl() {
  return POCKETBASE_CONFIG.url.replace(/\/+$/, "");
}

function setPocketBaseUrl(newUrl) {
  if (!newUrl) return;
  POCKETBASE_CONFIG.url = newUrl.replace(/\/+$/, "");
  localStorage.setItem("pocketbase_url", POCKETBASE_CONFIG.url);
  initPocketBaseClient();
}

let pb = null;

function initPocketBaseClient() {
  if (typeof PocketBase !== "undefined") {
    try {
      pb = new PocketBase(getPocketBaseUrl());
      pb.autoCancellation(false); // Enable concurrent queries without cancelling previous requests
      console.log(`[PocketBase] Initialized client at ${getPocketBaseUrl()}`);
    } catch (e) {
      console.warn("[PocketBase] Init error:", e);
      pb = null;
    }
  } else {
    console.log("[PocketBase] SDK not loaded; operating in local air-gapped mode.");
  }
}

// Auto-initialize immediately
initPocketBaseClient();

// ------------------------------------------------------------------------------
// PocketBase Teacher Authentication
// ------------------------------------------------------------------------------

async function loginTeacherWithPocketBase(identity, password) {
  if (!pb) {
    initPocketBaseClient();
  }
  if (!pb) {
    return { success: false, error: "PocketBase client is unavailable." };
  }

  // 1. Try Users collection auth
  try {
    const authData = await pb.collection("users").authWithPassword(identity, password);
    sessionStorage.setItem("teacher_authenticated", "true");
    sessionStorage.setItem("teacher_email", identity);
    return { success: true, user: authData.record, type: "user" };
  } catch (err1) {
    // 2. Try Admin auth
    try {
      const adminData = await pb.admins.authWithPassword(identity, password);
      sessionStorage.setItem("teacher_authenticated", "true");
      sessionStorage.setItem("teacher_email", identity);
      return { success: true, admin: adminData.admin, type: "admin" };
    } catch (err2) {
      return { success: false, error: err1.message || err2.message || "Invalid credentials" };
    }
  }
}

function logoutTeacherFromPocketBase() {
  if (pb) {
    pb.authStore.clear();
  }
  sessionStorage.removeItem("teacher_authenticated");
  sessionStorage.removeItem("teacher_email");
}

function isTeacherAuthenticated() {
  const isLocalAuth = sessionStorage.getItem("teacher_authenticated") === "true";
  const isPbAuth = Boolean(pb && pb.authStore.isValid);
  return isLocalAuth || isPbAuth;
}


// Auto-migration: Ensure all existing local assignments strictly have boolean is_started
try {
  const _existing = JSON.parse(localStorage.getItem("teacher_assignments") || "[]");
  let _modified = false;
  _existing.forEach(a => {
    if (a.is_started !== true) {
      a.is_started = false;
      _modified = true;
    }
  });
  if (_modified) {
    localStorage.setItem("teacher_assignments", JSON.stringify(_existing));
  }
} catch (e) {}

// ------------------------------------------------------------------------------
// Teacher Operations
// ------------------------------------------------------------------------------

// Creates an active assignment and stores the join code in PocketBase
async function createAssignmentOnCloud(assignmentData) {
  assignmentData.is_started = false;
  assignmentData.title = assignmentData.title || assignmentData.assessment_title || "Assignment";
  assignmentData.assessment_title = assignmentData.assessment_title || assignmentData.title;

  // LocalStorage Mirror for instant local reactivity
  try {
    let assignments = JSON.parse(localStorage.getItem("teacher_assignments") || "[]");
    assignments = assignments.filter(a => a.join_code !== assignmentData.join_code);
    assignments.unshift(assignmentData);
    localStorage.setItem("teacher_assignments", JSON.stringify(assignments));
  } catch (e) {
    console.warn("[Storage] Local storage mirror error:", e);
  }

  if (pb) {
    try {
      const record = await pb.collection("active_assignments").create(assignmentData);
      return { success: true, data: record };
    } catch (err) {
      console.error("[PocketBase] Assignment creation error:", err);
    }
  }

  return { success: true, data: assignmentData };
}

// Retrieves all assignments created by the teacher
async function fetchTeacherAssignments() {
  let pbRecords = [];
  if (pb) {
    try {
      const records = await pb.collection("active_assignments").getFullList({
        sort: "-created"
      });
      pbRecords = (records || []).map(a => {
        a.is_started = (a.is_started === true);
        a.assessment_title = a.assessment_title || a.title;
        a.title = a.title || a.assessment_title;
        return a;
      });
    } catch (err) {
      console.warn("[PocketBase] Load error, reading local assignments:", err);
    }
  }

  const localList = JSON.parse(localStorage.getItem("teacher_assignments") || "[]").map(a => {
    a.is_started = (a.is_started === true);
    a.assessment_title = a.assessment_title || a.title;
    a.title = a.title || a.assessment_title;
    return a;
  });

  const mergedMap = new Map();
  localList.forEach(a => mergedMap.set(a.join_code, a));
  pbRecords.forEach(a => mergedMap.set(a.join_code, a));
  return Array.from(mergedMap.values());
}

// Toggles active/closed status of an assignment
async function setAssignmentStatus(join_code, is_active) {
  const code = String(join_code).trim().toUpperCase();

  if (pb) {
    try {
      const item = await pb.collection("active_assignments").getFirstListItem(`join_code = "${code}"`);
      if (item) {
        await pb.collection("active_assignments").update(item.id, { is_active });
      }
    } catch (err) {
      console.warn("[PocketBase] Status update error:", err);
    }
  }

  let assignments = JSON.parse(localStorage.getItem("teacher_assignments") || "[]");
  assignments.forEach(a => {
    if (a.join_code === code) a.is_active = is_active;
  });
  localStorage.setItem("teacher_assignments", JSON.stringify(assignments));
}

// Updates current question index for synchronized pacing
async function setAssignmentQuestionIndex(join_code, current_question_index) {
  const code = String(join_code).trim().toUpperCase();

  if (pb) {
    try {
      const item = await pb.collection("active_assignments").getFirstListItem(`join_code = "${code}"`);
      if (item) {
        await pb.collection("active_assignments").update(item.id, { current_question_index });
      }
    } catch (err) {
      console.warn("[PocketBase] Question index update error:", err);
    }
  }

  let assignments = JSON.parse(localStorage.getItem("teacher_assignments") || "[]");
  assignments.forEach(a => {
    if (a.join_code === code) a.current_question_index = current_question_index;
  });
  localStorage.setItem("teacher_assignments", JSON.stringify(assignments));
}

// Verifies a join code and returns the assigned test configuration
async function verifyJoinCode(join_code) {
  const code = String(join_code).trim().toUpperCase();

  if (pb) {
    try {
      const item = await pb.collection("active_assignments").getFirstListItem(`join_code = "${code}"`);
      if (item) {
        item.is_started = (item.is_started === true);
        return { found: true, assignment: item };
      }
    } catch (err) {
      // Record not found or network offline; fall back to localStorage
    }
  }

  // Local Storage Fallback
  const assignments = JSON.parse(localStorage.getItem("teacher_assignments") || "[]");
  const match = assignments.find(a => a.join_code === code);
  if (match) {
    match.is_started = (match.is_started === true);
    return { found: true, assignment: match };
  }

  return { found: false };
}

// Submits student test results (via Atomic Server-Side Hook or Offline Fallback)
async function submitStudentExam(submissionData) {
  const serverUrl = getPocketBaseUrl();

  // Try Server-Side Atomic Grading Hook (POST /api/score-submission)
  try {
    const res = await fetch(`${serverUrl}/api/score-submission`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submissionData)
    });

    if (res.ok) {
      const scoredResult = await res.json();
      console.log("[PocketBase] Atomic server grading succeeded:", scoredResult);
      return { success: true, source: "pocketbase_server", data: scoredResult };
    } else {
      const err = await res.json().catch(() => ({}));
      console.warn("[PocketBase] Server-side grading returned status:", res.status, err);
    }
  } catch (err) {
    console.warn("[PocketBase] Server hook offline or unreachable, using local air-gap fallback:", err);
  }

  // Local Storage & Offline Enclave Fallback
  try {
    const code = submissionData.join_code;
    const key = `submissions_${code}`;
    let list = JSON.parse(localStorage.getItem(key) || "[]");

    let verifiedScore = submissionData.score || 0;
    // If offline answer keys are present, verify score accurately
    if (window.OFFLINE_ANSWER_KEYS && submissionData.assessment_id) {
      const offlineEntry = window.OFFLINE_ANSWER_KEYS[submissionData.assessment_id];
      if (offlineEntry && offlineEntry.keys) {
        let calcScore = 0;
        offlineEntry.keys.forEach((k, idx) => {
          const rawAns = submissionData.answers;
          let pick = null;
          if (Array.isArray(rawAns)) {
            const m = rawAns.find(a => a && (a.question_id === k.question_id || a.number === k.number));
            if (m) pick = m.selected;
          } else if (typeof rawAns === "object" && rawAns !== null) {
            pick = rawAns[k.question_id] || rawAns[idx] || rawAns[String(idx)];
          }
          if (pick && String(pick).toUpperCase() === String(k.correct_answer).toUpperCase()) {
            calcScore++;
          }
        });
        verifiedScore = calcScore;
      }
    }

    const record = {
      ...submissionData,
      score: verifiedScore,
      points: Math.min(120, Math.max(0, submissionData.points || 0)),
      submitted_at: new Date().toISOString()
    };

    list.push(record);
    list.sort((a, b) => (b.points || b.score) - (a.points || a.score) || a.time_spent_seconds - b.time_spent_seconds);
    localStorage.setItem(key, JSON.stringify(list));
    return { success: true, source: "localStorage", data: record };
  } catch (e) {
    return { success: false, error: e };
  }
}

// Loads live submissions/leaderboard for a specific assignment code
async function fetchSubmissionsByCode(join_code) {
  const code = String(join_code).trim().toUpperCase();

  if (pb) {
    try {
      const records = await pb.collection("exam_submissions").getFullList({
        filter: `join_code = "${code}"`,
        sort: "-points,-score,time_spent_seconds"
      });
      return records || [];
    } catch (err) {
      console.warn("[PocketBase] Submissions query error:", err);
    }
  }

  const key = `submissions_${code}`;
  return JSON.parse(localStorage.getItem(key) || "[]");
}

// ------------------------------------------------------------------------------
// Live Session Operations (Teacher-Led Real-Time Sync)
// ------------------------------------------------------------------------------

// Check in a student to the session roster
async function checkInStudent(join_code, student_name) {
  const code = String(join_code).trim().toUpperCase();

  if (pb) {
    try {
      await pb.collection("live_events").create({
        join_code: code,
        event_type: "participant_join",
        payload: { student_name, joined_at: new Date().toISOString() }
      });
      return { success: true };
    } catch (err) {
      console.warn("[PocketBase] Participant check-in error:", err);
    }
  }

  // LocalStorage Fallback
  try {
    const key = `participants_${code}`;
    let list = JSON.parse(localStorage.getItem(key) || "[]");
    if (!list.includes(student_name)) {
      list.push(student_name);
      localStorage.setItem(key, JSON.stringify(list));
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e };
  }
}

// Fetch all participants who have joined
async function fetchParticipantsByCode(join_code) {
  const code = String(join_code).trim().toUpperCase();

  let names = [];
  if (pb) {
    try {
      const events = await pb.collection("live_events").getFullList({
        filter: `join_code = "${code}" && event_type = "participant_join"`,
        sort: "created"
      });
      names = [...new Set(events.map(e => e.payload && e.payload.student_name).filter(Boolean))];
    } catch (err) {
      // Fallback to local
    }
  }

  if (names.length === 0) {
    const key = `participants_${code}`;
    names = JSON.parse(localStorage.getItem(key) || "[]");
  }

  return { names, count: names.length };
}

// Submit live question response for real-time teacher histogram bars
async function submitLiveAnswer(payload) {
  const code = String(payload.join_code).trim().toUpperCase();

  if (pb) {
    try {
      await pb.collection("live_events").create({
        join_code: code,
        event_type: "live_answer",
        payload: payload
      });
      return { success: true };
    } catch (err) {
      console.warn("[PocketBase] Live answer report error:", err);
    }
  }

  // LocalStorage Fallback
  try {
    const key = `live_answers_${code}`;
    let list = JSON.parse(localStorage.getItem(key) || "[]");
    list = list.filter(a => !(a.student_name === payload.student_name && a.question_real_index === payload.question_real_index));
    list.push({ ...payload, answered_at: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(list));
    return { success: true };
  } catch (e) {
    return { success: false, error: e };
  }
}

// Fetch live answer choices for histogram bar rendering
async function fetchLiveAnswersByCode(join_code, question_real_index) {
  const code = String(join_code).trim().toUpperCase();

  if (pb) {
    try {
      const events = await pb.collection("live_events").getFullList({
        filter: `join_code = "${code}" && event_type = "live_answer"`,
        sort: "-created"
      });
      const relevant = events
        .map(e => e.payload)
        .filter(p => p && p.question_real_index === question_real_index);
      return relevant;
    } catch (err) {}
  }

  const key = `live_answers_${code}`;
  const list = JSON.parse(localStorage.getItem(key) || "[]");
  return list.filter(a => a.question_real_index === question_real_index);
}

// Delete an assignment
async function deleteAssignment(join_code) {
  const code = String(join_code).trim().toUpperCase();

  if (pb) {
    try {
      const item = await pb.collection("active_assignments").getFirstListItem(`join_code = "${code}"`);
      if (item) {
        await pb.collection("active_assignments").delete(item.id);
      }
    } catch (err) {
      console.warn("[PocketBase] Delete assignment error:", err);
    }
  }

  let assignments = JSON.parse(localStorage.getItem("teacher_assignments") || "[]");
  assignments = assignments.filter(a => a.join_code !== code);
  localStorage.setItem("teacher_assignments", JSON.stringify(assignments));

  localStorage.removeItem(`submissions_${code}`);
  localStorage.removeItem(`participants_${code}`);
  localStorage.removeItem(`live_answers_${code}`);
  return { success: true };
}

// Set assignment timer, pause, and discussion state
async function setAssignmentTimerState(join_code, state) {
  const code = String(join_code).trim().toUpperCase();

  if (pb) {
    try {
      const item = await pb.collection("active_assignments").getFirstListItem(`join_code = "${code}"`);
      if (item) {
        await pb.collection("active_assignments").update(item.id, state);
      }
    } catch (err) {
      console.warn("[PocketBase] Timer state update error:", err);
    }
  }

  let assignments = JSON.parse(localStorage.getItem("teacher_assignments") || "[]");
  assignments.forEach(a => {
    if (a.join_code === code) Object.assign(a, state);
  });
  localStorage.setItem("teacher_assignments", JSON.stringify(assignments));
}

// Starts the assignment (students transition from waiting room to test runner)
async function startAssignment(join_code) {
  const code = String(join_code).trim().toUpperCase();

  if (pb) {
    try {
      const item = await pb.collection("active_assignments").getFirstListItem(`join_code = "${code}"`);
      if (item) {
        await pb.collection("active_assignments").update(item.id, { is_started: true });
        return { success: true };
      }
    } catch (err) {
      console.warn("[PocketBase] Start assignment error:", err);
    }
  }

  let assignments = JSON.parse(localStorage.getItem("teacher_assignments") || "[]");
  assignments.forEach(a => {
    if (a.join_code === code) a.is_started = true;
  });
  localStorage.setItem("teacher_assignments", JSON.stringify(assignments));
  return { success: true };
}

// Send live floating emoji reaction
async function sendLiveEmojiReaction(join_code, arg2, arg3) {
  let student_name = "Anonymous";
  let emoji = "🚀";

  if (typeof arg2 === "string" && arg3 === undefined) {
    emoji = arg2;
  } else if (typeof arg2 === "string" && typeof arg3 === "string") {
    student_name = arg2;
    emoji = arg3;
  }

  const code = String(join_code).trim().toUpperCase();

  if (pb) {
    try {
      await pb.collection("live_events").create({
        join_code: code,
        event_type: "emoji",
        payload: {
          emoji: emoji,
          student_name: student_name,
          timestamp: Date.now()
        }
      });
      return { success: true };
    } catch (err) {
      console.warn("[PocketBase] Emoji reaction broadcast error:", err);
    }
  }

  // LocalStorage Fallback
  try {
    const key = `emoji_reactions_${code}`;
    let list = JSON.parse(localStorage.getItem(key) || "[]");
    list.push({
      emoji: emoji,
      student_name: student_name,
      timestamp: Date.now()
    });
    // Keep only last 50 reactions
    if (list.length > 50) list = list.slice(list.length - 50);
    localStorage.setItem(key, JSON.stringify(list));
    return { success: true };
  } catch (e) {
    return { success: false, error: e };
  }
}

// Fetch recent emoji reactions
async function fetchRecentEmojiReactions(join_code, windowMs = 3500) {
  const code = String(join_code).trim().toUpperCase();
  const cutoff = Date.now() - windowMs;

  if (pb) {
    try {
      const events = await pb.collection("live_events").getFullList({
        filter: `join_code = "${code}" && event_type = "emoji"`,
        sort: "-created"
      });
      return events
        .map(e => e.payload)
        .filter(p => p && p.timestamp >= cutoff);
    } catch (err) {}
  }

  const key = `emoji_reactions_${code}`;
  const list = JSON.parse(localStorage.getItem(key) || "[]");
  return list.filter(r => r.timestamp >= cutoff);
}

// ------------------------------------------------------------------------------
// Real-Time SSE Subscriptions (PocketBase Native EventSource)
// ------------------------------------------------------------------------------

let activeAssignmentSubscription = null;
let activeLiveEventSubscription = null;

// Subscribes student screen to teacher pacing and live pause updates
function subscribeToLiveAssignment(assignmentId, onUpdate) {
  if (!pb || !assignmentId) return;

  try {
    if (activeAssignmentSubscription) {
      pb.collection("active_assignments").unsubscribe(activeAssignmentSubscription);
    }
    activeAssignmentSubscription = assignmentId;
    pb.collection("active_assignments").subscribe(assignmentId, (e) => {
      if (e.action === "update" && e.record) {
        onUpdate(e.record);
      }
    });
    console.log(`[PocketBase Realtime] Subscribed to assignment ${assignmentId}`);
  } catch (err) {
    console.warn("[PocketBase Realtime] Subscription error:", err);
  }
}

// Subscribes teacher console to floating emoji stream
function subscribeToLiveEvents(join_code, onEvent) {
  if (!pb || !join_code) return;
  const code = String(join_code).trim().toUpperCase();

  try {
    pb.collection("live_events").subscribe("*", (e) => {
      if (e.action === "create" && e.record && e.record.join_code === code) {
        onEvent(e.record);
      }
    });
    console.log(`[PocketBase Realtime] Subscribed to live events for code ${code}`);
  } catch (err) {
    console.warn("[PocketBase Realtime] Live events subscription error:", err);
  }
}

// Unsubscribes from all active SSE streams
function unsubscribeAllLiveChannels() {
  if (!pb) return;
  try {
    pb.collection("active_assignments").unsubscribe("*");
    pb.collection("live_events").unsubscribe("*");
    activeAssignmentSubscription = null;
    console.log("[PocketBase Realtime] Unsubscribed from all streams.");
  } catch (err) {}
}

// Live Class Leaderboard Tally
async function fetchLiveClassLeaderboard(join_code) {
  const code = String(join_code).trim().toUpperCase();
  const participants = await fetchParticipantsByCode(code);
  const names = Array.isArray(participants) ? participants : ((participants && participants.names) || []);

  let allLiveAnswers = [];
  if (pb) {
    try {
      const events = await pb.collection("live_events").getFullList({
        filter: `join_code = "${code}" && event_type = "live_answer"`
      });
      allLiveAnswers = events.map(e => e.payload).filter(Boolean);
    } catch (err) {}
  }
  if (allLiveAnswers.length === 0) {
    const key = `live_answers_${code}`;
    allLiveAnswers = JSON.parse(localStorage.getItem(key) || "[]");
  }

  const studentMap = {};
  names.forEach(name => {
    studentMap[name] = {
      name,
      points: 0.0,
      baseScore: 0.0,
      speedBonus: 0.0,
      streak: 0,
      maxStreak: 0,
      correctCount: 0,
      incorrectCount: 0,
      unansweredCount: 0,
      recoveredCount: 0,
      totalAnswered: 0,
      isSuperMax: false
    };
  });

  allLiveAnswers.forEach(ans => {
    const s = studentMap[ans.student_name];
    if (!s) return;
    s.totalAnswered++;
    const pts = parseFloat(ans.points || 0);
    s.points += pts;
    if (ans.speed_bonus) s.speedBonus += parseFloat(ans.speed_bonus);
    if (ans.recovered_points) s.recoveredCount++;

    if (ans.is_correct) {
      s.correctCount++;
      s.streak = (s.streak || 0) + 1;
      if (s.streak > s.maxStreak) s.maxStreak = s.streak;
    } else {
      const raw = ans.selected_letter;
      const isBlank = !raw || raw === "null" || raw === "undefined" || String(raw).trim() === "";
      if (isBlank) s.unansweredCount++;
      else s.incorrectCount++;
      s.streak = 0;
    }
  });

  const leaderboard = Object.values(studentMap).map(s => {
    s.points = Math.max(0, Math.min(120, Math.round(s.points * 10) / 10));
    s.isSuperMax = s.points > 100;
    return s;
  });

  leaderboard.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.maxStreak !== a.maxStreak) return b.maxStreak - a.maxStreak;
    return b.correctCount - a.correctCount;
  });

  leaderboard.forEach((item, index) => {
    item.rank = index + 1;
  });

  return leaderboard;
}
