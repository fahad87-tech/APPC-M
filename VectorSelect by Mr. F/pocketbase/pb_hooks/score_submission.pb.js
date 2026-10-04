// ==============================================================================
// PocketBase Server Hook: Atomic Server-Side Grading Engine
// File: pb_hooks/score_submission.pb.js
// ==============================================================================
// Exposes POST /api/score-submission
// Grades student submissions internally using system DAO privileges without
// ever exposing the answer keys collection to the public client.
// ==============================================================================

routerAdd("POST", "/api/score-submission", (c) => {
    const data = $apis.requestInfo(c).data;
    const cleanCode = (data.join_code || "").trim().toUpperCase();
    const cleanName = (data.student_name || "").trim();

    if (cleanName.length < 2 || cleanName.length > 60) {
        return c.json(400, { error: "Invalid student name length (must be between 2 and 60 characters)." });
    }

    if (!cleanCode || cleanCode.length !== 6) {
        return c.json(400, { error: "Invalid 6-character join code." });
    }

    // 1. Fetch active assignment
    let assignment;
    try {
        assignment = $app.dao().findFirstRecordByData("active_assignments", "join_code", cleanCode);
    } catch (e) {
        return c.json(404, { error: `Assignment with join code "${cleanCode}" not found.` });
    }

    if (!assignment.getBool("is_active")) {
        return c.json(400, { error: "This assessment has been closed by the instructor." });
    }

    // 2. Anti-Impersonation Check: Ensure student hasn't submitted yet
    try {
        const existing = $app.dao().findRecordsByFilter(
            "exam_submissions",
            `join_code = {:code} && student_name ~ {:name}`,
            "-created",
            1,
            0,
            { code: cleanCode, name: cleanName }
        );
        if (existing && existing.length > 0) {
            return c.json(409, { error: `Student "${cleanName}" has already submitted this assessment.` });
        }
    } catch (e) {
        // First record or filter evaluated
    }

    // 3. Fetch Official Answer Keys (internal privilege)
    const assessmentId = assignment.getString("assessment_id");
    let keyRecord;
    try {
        keyRecord = $app.dao().findFirstRecordByData("answer_keys", "assessment_id", assessmentId);
    } catch (e) {
        return c.json(500, { error: `Official answer keys for assessment "${assessmentId}" are unavailable.` });
    }

    const officialKeys = keyRecord.get("keys") || [];
    const studentAnswers = data.answers || [];
    let correctCount = 0;
    const totalQuestions = officialKeys.length;
    const allowReview = (assignment.getBool("allow_review") === true && assignment.getBool("is_active") === false);
    const breakdown = [];

    officialKeys.forEach((k, idx) => {
        let studentPick = null;
        if (Array.isArray(studentAnswers)) {
            studentPick = studentAnswers.find((a) => a && (a.question_id === k.question_id || a.number === k.number));
        } else if (typeof studentAnswers === "object" && studentAnswers !== null) {
            const val = studentAnswers[k.question_id] || studentAnswers[idx] || studentAnswers[String(idx)];
            if (val) studentPick = { selected: val };
        }

        const selected = (studentPick && studentPick.selected) ? String(studentPick.selected).trim().toUpperCase() : null;
        const isCorrect = Boolean(selected && selected === String(k.correct_answer || "").trim().toUpperCase());
        if (isCorrect) correctCount++;

        breakdown.push({
            question_id: k.question_id,
            number: k.number,
            is_correct: isCorrect,
            selected: selected,
            correct_answer: allowReview ? k.correct_answer : null,
            explanation: allowReview ? k.explanation : null
        });
    });

    const scorePct = totalQuestions > 0 ? Number(((correctCount / totalQuestions) * 100).toFixed(1)) : 0;
    const verifiedPoints = Math.min(120.0, Math.max(0.0, Number(data.points || 0)));

    // 4. Save verified record into exam_submissions
    const collection = $app.dao().findCollectionByNameOrId("exam_submissions");
    const record = new Record(collection);
    record.set("assignment", assignment.id);
    record.set("join_code", cleanCode);
    record.set("student_name", cleanName);
    record.set("score", correctCount);
    record.set("total_questions", totalQuestions);
    record.set("score_percentage", scorePct);
    record.set("points", verifiedPoints);
    record.set("speed_bonus", Math.max(0, Number(data.speed_bonus || 0)));
    record.set("max_streak", Math.max(0, Number(data.max_streak || 0)));
    record.set("recoveries_completed", Math.max(0, Number(data.recoveries_completed || 0)));
    record.set("answers", breakdown);
    record.set("tab_switch_count", Math.max(0, Number(data.tab_switches || data.tab_switch_count || 0)));
    record.set("fullscreen_exits", Math.max(0, Number(data.fullscreen_exits || 0)));
    record.set("time_spent_seconds", Math.max(0, Number(data.time_spent_seconds || 0)));

    $app.dao().saveRecord(record);

    // 5. Return sanitized grading result to student
    return c.json(200, {
        submission_id: record.id,
        score: correctCount,
        total_questions: totalQuestions,
        score_percentage: scorePct,
        points: verifiedPoints,
        review_available: allowReview,
        results: allowReview ? breakdown : breakdown.map(b => ({
            question_id: b.question_id,
            number: b.number,
            is_correct: b.is_correct
        }))
    });
});
