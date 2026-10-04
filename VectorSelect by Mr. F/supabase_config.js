// ==============================================================================
// Supabase Client & Realtime Assignment Sync
// ==============================================================================

const SUPABASE_CONFIG = {
  url: "",       // e.g. "https://your-project.supabase.co"
  anonKey: ""    // e.g. "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
};

const isSupabaseConfigured = () => {
  return SUPABASE_CONFIG.url && SUPABASE_CONFIG.url.startsWith("http") && SUPABASE_CONFIG.anonKey;
};

let supabaseClient = null;
if (typeof supabase !== 'undefined' && isSupabaseConfigured()) {
  try {
    supabaseClient = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    console.log("Supabase client initialized successfully.");
  } catch (err) {
    console.warn("Supabase init error:", err);
  }
}

// Auto-migration: Ensure all existing local assignments strictly have boolean is_started
try {
  const _existing = JSON.parse(localStorage.getItem('teacher_assignments') || '[]');
  let _modified = false;
  _existing.forEach(a => {
    if (a.is_started !== true) {
      a.is_started = false;
      _modified = true;
    }
  });
  if (_modified) {
    localStorage.setItem('teacher_assignments', JSON.stringify(_existing));
  }
} catch (e) {
  // ignore in non-browser or storage restricted environments
}

// ------------------------------------------------------------------------------
// Teacher Operations
// ------------------------------------------------------------------------------

// Creates an active assignment and stores the join code in Supabase
async function createAssignmentOnCloud(assignmentData) {
  // CRITICAL: Any new assignment strictly begins in the waiting lobby until the instructor clicks start
  assignmentData.is_started = false;

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('active_assignments')
        .insert([assignmentData])
        .select();

      if (error) throw error;
      return { success: true, data: data[0] };
    } catch (err) {
      console.error("Supabase assignment insert error:", err);
    }
  }

  // Local Storage Fallback
  try {
    let assignments = JSON.parse(localStorage.getItem('teacher_assignments') || '[]');
    // Remove duplicate code if exists
    assignments = assignments.filter(a => a.join_code !== assignmentData.join_code);
    assignments.unshift(assignmentData);
    localStorage.setItem('teacher_assignments', JSON.stringify(assignments));
    return { success: true, data: assignmentData };
  } catch (e) {
    return { success: false, error: e };
  }
}

// Retrieves all assignments created by the teacher
async function fetchTeacherAssignments() {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('active_assignments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(a => {
        a.is_started = (a.is_started === true);
        return a;
      });
    } catch (err) {
      console.warn("Supabase load error, reading local assignments:", err);
    }
  }

  const list = JSON.parse(localStorage.getItem('teacher_assignments') || '[]');
  return list.map(a => {
    a.is_started = (a.is_started === true);
    return a;
  });
}

// Toggles active/closed status of an assignment
async function setAssignmentStatus(join_code, is_active) {
  if (supabaseClient) {
    try {
      await supabaseClient
        .from('active_assignments')
        .update({ is_active })
        .eq('join_code', join_code);
    } catch (err) {
      console.warn("Supabase status update error:", err);
    }
  }

  let assignments = JSON.parse(localStorage.getItem('teacher_assignments') || '[]');
  assignments.forEach(a => {
    if (a.join_code === join_code) a.is_active = is_active;
  });
  localStorage.setItem('teacher_assignments', JSON.stringify(assignments));
}

// Updates current question index for synchronized teacher-led sessions
async function setAssignmentQuestionIndex(join_code, current_question_index) {
  if (supabaseClient) {
    try {
      await supabaseClient
        .from('active_assignments')
        .update({ current_question_index })
        .eq('join_code', join_code);
    } catch (err) {
      console.warn("Supabase question index update error:", err);
    }
  }

  let assignments = JSON.parse(localStorage.getItem('teacher_assignments') || '[]');
  assignments.forEach(a => {
    if (a.join_code === join_code) a.current_question_index = current_question_index;
  });
  localStorage.setItem('teacher_assignments', JSON.stringify(assignments));
}

// ------------------------------------------------------------------------------
// Student Operations
// ------------------------------------------------------------------------------

// Verifies a join code and returns the assigned test configuration
async function verifyJoinCode(join_code) {
  const code = join_code.trim().toUpperCase();

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('active_assignments')
        .select('*')
        .eq('join_code', code)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        data.is_started = (data.is_started === true);
        return { found: true, assignment: data };
      }
    } catch (err) {
      console.warn("Supabase code verification error, trying local:", err);
    }
  }

  // Local Storage Fallback
  const assignments = JSON.parse(localStorage.getItem('teacher_assignments') || '[]');
  const match = assignments.find(a => a.join_code === code);
  if (match) {
    // Strictly guarantee is_started is boolean true only if already started
    match.is_started = (match.is_started === true);
    return { found: true, assignment: match };
  }

  return { found: false };
}

// Submits student test results tagged with join code
async function submitStudentExam(submissionData) {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('exam_submissions')
        .insert([submissionData]);

      if (error) throw error;
      return { success: true, source: 'supabase', data };
    } catch (err) {
      console.error("Supabase submission error:", err);
    }
  }

  // Local Storage Fallback
  try {
    const key = `submissions_${submissionData.join_code}`;
    let list = JSON.parse(localStorage.getItem(key) || '[]');
    list.push({
      ...submissionData,
      submitted_at: new Date().toISOString()
    });
    list.sort((a, b) => b.score - a.score || a.time_spent_seconds - b.time_spent_seconds);
    localStorage.setItem(key, JSON.stringify(list));
    return { success: true, source: 'localStorage', data: list };
  } catch (e) {
    return { success: false, error: e };
  }
}

// Loads live submissions/leaderboard for a specific assignment code
async function fetchSubmissionsByCode(join_code) {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('exam_submissions')
        .select('*')
        .eq('join_code', join_code)
        .order('score', { ascending: false })
        .order('time_spent_seconds', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn("Supabase leaderboard query error:", err);
    }
  }

  const key = `submissions_${join_code}`;
  return JSON.parse(localStorage.getItem(key) || '[]');
}

// ------------------------------------------------------------------------------
// Live Session Operations (Teacher-Led Real-Time Sync)
// ------------------------------------------------------------------------------

// Check in a student to the session roster (upsert)
async function checkInStudent(join_code, student_name) {
  if (supabaseClient) {
    try {
      await supabaseClient
        .from('session_participants')
        .upsert(
          [{ join_code, student_name }],
          { onConflict: 'join_code,student_name' }
        );
      return { success: true };
    } catch (err) {
      console.warn("Supabase check-in error:", err);
    }
  }

  // LocalStorage fallback
  try {
    const key = `participants_${join_code}`;
    let list = JSON.parse(localStorage.getItem(key) || '[]');
    if (!list.includes(student_name)) {
      list.push(student_name);
      localStorage.setItem(key, JSON.stringify(list));
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e };
  }
}

// Fetch all participants who have joined a given assignment
async function fetchParticipantsByCode(join_code) {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('session_participants')
        .select('student_name, joined_at')
        .eq('join_code', join_code)
        .order('joined_at', { ascending: true });

      if (error) throw error;
      const names = (data || []).map(d => d.student_name);
      return { names, count: names.length };
    } catch (err) {
      console.warn("Supabase participants query error:", err);
    }
  }

  // LocalStorage fallback
  const key = `participants_${join_code}`;
  const names = JSON.parse(localStorage.getItem(key) || '[]');
  return { names, count: names.length };
}

// Submit a live answer for the current question (upsert per student+question)
async function submitLiveAnswer(payload) {
  if (supabaseClient) {
    try {
      await supabaseClient
        .from('live_question_answers')
        .upsert(
          [{
            join_code: payload.join_code,
            student_name: payload.student_name,
            question_real_index: payload.question_real_index,
            selected_letter: payload.selected_letter,
            is_correct: payload.is_correct,
            answered_at: new Date().toISOString()
          }],
          { onConflict: 'join_code,student_name,question_real_index' }
        );
      return { success: true };
    } catch (err) {
      console.warn("Supabase live answer error:", err);
    }
  }

  // LocalStorage fallback
  try {
    const key = `live_answers_${payload.join_code}`;
    let list = JSON.parse(localStorage.getItem(key) || '[]');
    list = list.filter(
      a => !(a.student_name === payload.student_name && a.question_real_index === payload.question_real_index)
    );
    list.push({
      join_code: payload.join_code,
      student_name: payload.student_name,
      question_real_index: payload.question_real_index,
      selected_letter: payload.selected_letter,
      is_correct: payload.is_correct,
      points: payload.points !== undefined ? payload.points : (payload.is_correct ? 10 : 0),
      speed_bonus: payload.speed_bonus || 0,
      streak: payload.streak || 0,
      recovered_points: payload.recovered_points || 0,
      answered_at: new Date().toISOString()
    });
    localStorage.setItem(key, JSON.stringify(list));
    return { success: true };
  } catch (e) {
    return { success: false, error: e };
  }
}

// Fetch live answers for a specific question in an assignment
async function fetchLiveAnswersByCode(join_code, question_real_index) {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('live_question_answers')
        .select('student_name, selected_letter, is_correct, answered_at')
        .eq('join_code', join_code)
        .eq('question_real_index', question_real_index);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn("Supabase live answers query error:", err);
    }
  }

  // LocalStorage fallback
  const key = `live_answers_${join_code}`;
  const list = JSON.parse(localStorage.getItem(key) || '[]');
  return list.filter(a => a.question_real_index === question_real_index);
}

// Deletes an assignment entirely (teacher-initiated cleanup)
async function deleteAssignment(join_code) {
  if (supabaseClient) {
    try {
      const { error } = await supabaseClient
        .from('active_assignments')
        .delete()
        .eq('join_code', join_code);
      if (error) throw error;
    } catch (err) {
      console.warn("Supabase delete error, removing locally:", err);
    }
  }

  // LocalStorage fallback (also runs alongside Supabase so the UI updates instantly)
  try {
    const assignments = JSON.parse(localStorage.getItem('teacher_assignments') || '[]')
      .filter(a => a.join_code !== join_code);
    localStorage.setItem('teacher_assignments', JSON.stringify(assignments));
    return { success: true };
  } catch (e) {
    return { success: false, error: e };
  }
}

// Update timer sync state on the assignment row
async function setAssignmentTimerState(join_code, state) {
  if (supabaseClient) {
    try {
      const updateData = {};
      if (state.question_started_at !== undefined) updateData.question_started_at = state.question_started_at;
      if (state.discussion_active !== undefined) updateData.discussion_active = state.discussion_active;
      if (state.timer_paused !== undefined) updateData.timer_paused = state.timer_paused;
      if (state.paused_remaining_seconds !== undefined) updateData.paused_remaining_seconds = state.paused_remaining_seconds;
      if (state.answer_revealed !== undefined) updateData.answer_revealed = state.answer_revealed;

      await supabaseClient
        .from('active_assignments')
        .update(updateData)
        .eq('join_code', join_code);
    } catch (err) {
      console.warn("Supabase timer state update error:", err);
    }
  }

  // LocalStorage fallback
  try {
    const assignments = JSON.parse(localStorage.getItem('teacher_assignments') || '[]');
    assignments.forEach(a => {
      if (a.join_code === join_code) {
        if (state.question_started_at !== undefined) a.question_started_at = state.question_started_at;
        if (state.discussion_active !== undefined) a.discussion_active = state.discussion_active;
        if (state.timer_paused !== undefined) a.timer_paused = state.timer_paused;
        if (state.paused_remaining_seconds !== undefined) a.paused_remaining_seconds = state.paused_remaining_seconds;
        if (state.answer_revealed !== undefined) a.answer_revealed = state.answer_revealed;
      }
    });
    localStorage.setItem('teacher_assignments', JSON.stringify(assignments));
  } catch (e) {
    // ignore
  }
}

// Start an assignment (transition from waiting lobby to active exam)
async function startAssignment(join_code) {
  if (supabaseClient) {
    try {
      await supabaseClient
        .from('active_assignments')
        .update({
          is_started: true,
          started_at: new Date().toISOString()
        })
        .eq('join_code', join_code);
    } catch (err) {
      console.warn("Supabase startAssignment error:", err);
    }
  }

  // LocalStorage fallback
  try {
    const assignments = JSON.parse(localStorage.getItem('teacher_assignments') || '[]');
    assignments.forEach(a => {
      if (a.join_code === join_code) {
        a.is_started = true;
        a.started_at = new Date().toISOString();
      }
    });
    localStorage.setItem('teacher_assignments', JSON.stringify(assignments));
    return { success: true };
  } catch (e) {
    return { success: false, error: e };
  }
}

// ------------------------------------------------------------------------------
// Live Reactions & Gamified 0-120 Leaderboard Functions
// ------------------------------------------------------------------------------

// Send a live reaction emoji from student
async function sendLiveEmojiReaction(join_code, arg2, arg3) {
  let emoji = arg2;
  let student_name = arg3;
  const commonEmojis = ['🚀', '🔥', '💡', '🤯', '👏', '⚡'];
  if (commonEmojis.includes(arg3) || (typeof arg3 === 'string' && arg3.length <= 4 && typeof arg2 === 'string' && arg2.length > 4)) {
    emoji = arg3;
    student_name = arg2;
  }
  const reactionObj = {
    join_code,
    emoji: emoji || '🚀',
    student_name: student_name || 'Student',
    timestamp: Date.now()
  };

  if (supabaseClient) {
    try {
      await supabaseClient
        .from('live_reactions')
        .insert([reactionObj]);
    } catch (err) {
      // ignore
    }
  }

  // LocalStorage fallback buffer
  try {
    const key = `reactions_${join_code}`;
    let list = JSON.parse(localStorage.getItem(key) || '[]');
    list.push(reactionObj);
    // Keep last 40 reactions only
    if (list.length > 40) list = list.slice(-40);
    localStorage.setItem(key, JSON.stringify(list));
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}

// Fetch reactions posted within the last N milliseconds (default 3500ms)
async function fetchRecentEmojiReactions(join_code, windowMs = 3500) {
  const cutoff = Date.now() - windowMs;

  if (supabaseClient) {
    try {
      const { data } = await supabaseClient
        .from('live_reactions')
        .select('*')
        .eq('join_code', join_code)
        .gte('timestamp', cutoff);
      if (data && data.length > 0) return data;
    } catch (err) {
      // fallback
    }
  }

  // LocalStorage fallback
  const key = `reactions_${join_code}`;
  const list = JSON.parse(localStorage.getItem(key) || '[]');
  return list.filter(r => r.timestamp >= cutoff);
}

// Compute dynamic 0-120 SUPER MAX live leaderboard
async function fetchLiveClassLeaderboard(join_code) {
  const participants = await fetchParticipantsByCode(join_code);
  const names = (participants && participants.names) || [];

  // Fetch all live answers for this assignment
  let allLiveAnswers = [];
  const keyPrefix = `live_answers_${join_code}`;
  const localList = JSON.parse(localStorage.getItem(keyPrefix) || '[]');
  allLiveAnswers = localList;

  // Group by student
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
      recentAnswerTime: 0,
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
      const isBlank = !raw || raw === 'null' || raw === 'undefined' || String(raw).trim() === '';
      if (isBlank) {
        s.unansweredCount++;
      } else {
        s.incorrectCount++;
      }
      s.streak = 0;
    }
  });

  // Convert to sorted array
  const leaderboard = Object.values(studentMap).map(s => {
    // Round to 1 decimal place
    s.points = Math.max(0, Math.min(120, Math.round(s.points * 10) / 10));
    s.isSuperMax = s.points > 100;
    return s;
  });

  // Sort descending by points, tie-break by maxStreak, then correctCount
  leaderboard.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.maxStreak !== a.maxStreak) return b.maxStreak - a.maxStreak;
    return b.correctCount - a.correctCount;
  });

  // Assign ranks
  leaderboard.forEach((item, index) => {
    item.rank = index + 1;
  });

  return leaderboard;
}


