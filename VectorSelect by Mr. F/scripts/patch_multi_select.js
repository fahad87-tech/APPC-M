const fs = require('fs');

console.log('=== MULTI-SELECT PATCHER FOR INDEX.HTML & TEACHER.HTML ===');

function applyPatch(file, patches) {
  let content = fs.readFileSync(file, 'utf8');
  const isCRLF = content.includes('\r\n');
  let normalized = content.replace(/\r\n/g, '\n');

  patches.forEach(({ name, target, replacement }) => {
    const targetNorm = target.replace(/\r\n/g, '\n');
    const replacementNorm = replacement.replace(/\r\n/g, '\n');

    if (!normalized.includes(targetNorm)) {
      console.error(`ERROR: Target not found for: [${name}] in ${file}`);
      process.exit(1);
    }
    normalized = normalized.replace(targetNorm, () => replacementNorm);
    console.log(`✓ Applied: [${name}]`);
  });

  const finalContent = isCRLF ? normalized.replace(/\n/g, '\r\n') : normalized;
  fs.writeFileSync(file, finalContent, 'utf8');
  console.log(`✓ Saved ${file} (${finalContent.length} bytes)\n`);
}

// ----------------------------------------------------------------------------
// 1. INDEX.HTML PATCHES
// ----------------------------------------------------------------------------
const indexPatches = [
  {
    name: "Multi-Select Helpers Definition",
    target: `      return exp || "Official College Board rationale.";
    }

    // ============================================================================
    // UI FEEDBACK SYSTEM — Toasts, Ripples, Particle Bursts
    // ============================================================================`,
    replacement: `      return exp || "Official College Board rationale.";
    }

    // ============================================================================
    // MULTI-SELECT & NORMALIZATION HELPERS
    // ============================================================================
    function normalizeAnswer(ans) {
      if (!ans) return "";
      return String(ans)
        .split(",")
        .map(s => s.trim().toUpperCase())
        .filter(Boolean)
        .sort()
        .join(",");
    }

    function parseAnswerLetters(ans) {
      if (!ans) return [];
      return String(ans)
        .split(",")
        .map(s => s.trim().toUpperCase())
        .filter(Boolean);
    }

    function isAnswerCorrect(studentAns, correctAns) {
      const normS = normalizeAnswer(studentAns);
      const normC = normalizeAnswer(correctAns);
      return Boolean(normS && normC && normS === normC);
    }

    function isQuestionMultiSelect(q, realIdx) {
      if (!q && typeof currentQuiz !== "undefined" && currentQuiz && currentQuiz.questions && typeof realIdx === "number") {
        q = currentQuiz.questions[realIdx];
      }
      if (!q) return false;
      if (q.multi_select === true) return true;
      const key = String(q.correct_answer || "");
      if (key.includes(",")) return true;
      const promptText = (q.prompt || "") + " " + (q.explanation || "");
      if (/select\\s+(?:two|2|all)/i.test(promptText)) return true;
      return false;
    }

    function getExpectedChoiceCount(q, realIdx) {
      if (!q && typeof currentQuiz !== "undefined" && currentQuiz && currentQuiz.questions && typeof realIdx === "number") {
        q = currentQuiz.questions[realIdx];
      }
      if (!q) return 1;
      if (q.expected_choices && typeof q.expected_choices === "number") return q.expected_choices;
      const key = String(q.correct_answer || "");
      if (key.includes(",")) {
        const parts = key.split(",").map(s => s.trim()).filter(Boolean);
        if (parts.length > 1) return parts.length;
      }
      const promptText = (q.prompt || "") + " " + (q.explanation || "");
      if (/select\\s+(?:two|2)/i.test(promptText)) return 2;
      return isQuestionMultiSelect(q, realIdx) ? 2 : 1;
    }

    // ============================================================================
    // UI FEEDBACK SYSTEM — Toasts, Ripples, Particle Bursts
    // ============================================================================`
  },
  {
    name: "showDiscussionFeedback: isCorrect & missed set",
    target: `      // Update student missed questions set
      if (!studentAnswer || studentAnswer !== correctAnswer) {
        studentMissedQuestions.add(realIdx);
      } else {
        studentMissedQuestions.delete(realIdx);
      }`,
    replacement: `      // Update student missed questions set
      const isCorrect = isAnswerCorrect(studentAnswer, correctAnswer);
      if (!studentAnswer || !isCorrect) {
        studentMissedQuestions.add(realIdx);
      } else {
        studentMissedQuestions.delete(realIdx);
      }`
  },
  {
    name: "showDiscussionFeedback: verdict panel check",
    target: `      } else if (studentAnswer === correctAnswer) {
        feedbackPanel.className = "verdict-card mt-4 p-5 rounded-2xl border border-lime-500/45 bg-lime-500/10 space-y-3 enter";`,
    replacement: `      } else if (isCorrect) {
        feedbackPanel.className = "verdict-card mt-4 p-5 rounded-2xl border border-lime-500/45 bg-lime-500/10 space-y-3 enter";`
  },
  {
    name: "showDiscussionFeedback: toast verdict check",
    target: `        } else if (studentAnswer === correctAnswer) {
          showToast("Correct!", \`Q\${qNum} — you nailed it!\`, "lime", 3400);`,
    replacement: `        } else if (isCorrect) {
          showToast("Correct!", \`Q\${qNum} — you nailed it!\`, "lime", 3400);`
  },
  {
    name: "showDiscussionFeedback: choice button highlighting loop",
    target: `      // Highlight correct answer and wrong choice on the choice buttons
      const buttons = document.querySelectorAll("#q-choices-container .choice-btn");
      buttons.forEach(btn => {
        const letter = (btn.dataset.letter || "").trim() || (btn.textContent.trim().match(/^[A-D]/) ? btn.textContent.trim().match(/^[A-D]/)[0] : "");
        btn.disabled = true;
        btn.style.pointerEvents = "none";
        btn.classList.remove("choice-selected", "ring-indigo-400", "ring-2", "ring-4");
        if (letter && letter === correctAnswer) {
          btn.classList.remove("choice-wrong", "choice-dimmed");
          btn.classList.add("choice-correct");
          btn.style.opacity = "1";
          if (studentAnswer === correctAnswer) {
            burstParticles(btn);
          }
        } else if (studentAnswer && letter === studentAnswer) {
          btn.classList.remove("choice-correct", "choice-dimmed");
          btn.classList.add("choice-wrong");
          btn.style.opacity = "1";
        } else {
          btn.classList.remove("choice-correct", "choice-wrong");
          btn.classList.add("choice-dimmed");
          btn.style.opacity = "0.45";
        }
      });`,
    replacement: `      // Highlight correct answer and wrong choice on the choice buttons
      const correctLetters = parseAnswerLetters(correctAnswer);
      const studentLetters = parseAnswerLetters(studentAnswer);
      const buttons = document.querySelectorAll("#q-choices-container .choice-btn");
      buttons.forEach(btn => {
        const letter = (btn.dataset.letter || "").trim() || (btn.textContent.trim().match(/^[A-D]/) ? btn.textContent.trim().match(/^[A-D]/)[0] : "");
        btn.disabled = true;
        btn.style.pointerEvents = "none";
        btn.classList.remove("choice-selected", "ring-indigo-400", "ring-2", "ring-4");
        if (letter && correctLetters.includes(letter)) {
          btn.classList.remove("choice-wrong", "choice-dimmed");
          btn.classList.add("choice-correct");
          btn.style.opacity = "1";
          if (isCorrect) {
            burstParticles(btn);
          }
        } else if (studentLetters.includes(letter)) {
          btn.classList.remove("choice-correct", "choice-dimmed");
          btn.classList.add("choice-wrong");
          btn.style.opacity = "1";
        } else {
          btn.classList.remove("choice-correct", "choice-wrong");
          btn.classList.add("choice-dimmed");
          btn.style.opacity = "0.45";
        }
      });`
  },
  {
    name: "updateGridHighlights: isCorrect comparison",
    target: `          const isCorrect = Boolean(studentAns && correctAns && studentAns === correctAns);`,
    replacement: `          const isCorrect = Boolean(studentAns && correctAns && isAnswerCorrect(studentAns, correctAns));`
  },
  {
    name: "renderCurrentQuestion: choices rendering and multi-select badge",
    target: `      // 2. Choices — Large, Punchy Circle Selectors (A, B, C, D)
      const choicesBox = document.getElementById("q-choices-container");
      choicesBox.innerHTML = "";
      const selected = studentAnswers[realIdx];
      const isRevealed = isCurrentQuestionEvaluationRevealed();
      const revealedKey = isRevealed ? getQuestionCorrectAnswer(realIdx) : null;

      if (q.card_image) {
        const label = document.createElement("p");
        label.className = "text-sm md:text-base text-chalk/70 font-black mb-4 uppercase tracking-widest text-center";
        label.textContent = "Select your answer:";
        choicesBox.appendChild(label);

        const row = document.createElement("div");
        row.className = "flex items-center justify-center gap-6 md:gap-8 pb-3";

        const showAnswerFeedback = isRevealed || ((isExamLocked || isExamSubmitted) && Boolean(revealedKey));
        q.choices.forEach(c => {
          const isSelected = selected === c.letter;
          let btnCls = "";
          let disabled = false;
          if (showAnswerFeedback && revealedKey) {
            disabled = true;
            if (c.letter === revealedKey) {
              btnCls = "choice-correct";
            } else if (isSelected) {
              btnCls = "choice-wrong";
            } else {
              btnCls = "bg-ink-700 text-chalk/40 border-ink-600 opacity-40 choice-dimmed";
            }
          } else if (isSelected) {
            btnCls = "choice-selected";
          } else {
            btnCls = "bg-ink-700 text-chalk/80 border-ink-500 hover:border-copper-500 hover:text-copper-400";
          }

          const btn = document.createElement("button");
          btn.dataset.letter = c.letter;
          btn.disabled = disabled;
          btn.className = \`choice-btn pressable h-16 w-16 md:h-20 md:w-20 rounded-2xl flex items-center justify-center font-black text-2xl md:text-3xl border-2 \${btnCls}\`;
          btn.textContent = c.letter;
          if (isSelected) {
            const sweep = document.createElement("span");
            sweep.className = "sweep-bar";
            btn.appendChild(sweep);
          }
          btn.onclick = (e) => {
            if (isRevealed || isExamLocked || isExamSubmitted) return;
            spawnRipple(e.currentTarget);
            selectChoice(c.letter);
          };
          row.appendChild(btn);
        });

        choicesBox.appendChild(row);
      } else {
        // Fallback full-text buttons
        const showAnswerFeedback = isRevealed || ((isExamLocked || isExamSubmitted) && Boolean(revealedKey));
        choicesBox.className = "space-y-3 pt-2";
        q.choices.forEach(c => {
          const isSelected = selected === c.letter;
          let btnCls = "";
          let disabled = false;
          if (showAnswerFeedback && revealedKey) {
            disabled = true;
            if (c.letter === revealedKey) {
              btnCls = "choice-correct";
            } else if (isSelected) {
              btnCls = "choice-wrong";
            } else {
              btnCls = "border-ink-700 bg-ink-900/40 text-chalk/40 opacity-40 choice-dimmed";
            }
          } else if (isSelected) {
            btnCls = "choice-selected";
          } else {
            btnCls = "border-ink-600 bg-ink-800/70 hover:border-copper-500/60 text-chalk/80 hover:text-chalk";
          }

          const btn = document.createElement("button");
          btn.dataset.letter = c.letter;
          btn.disabled = disabled;
          btn.className = \`choice-btn pressable w-full text-left p-5 rounded-2xl border flex items-center gap-4 \${btnCls}\`;
          btn.onclick = (e) => {
            if (isRevealed || isExamLocked || isExamSubmitted) return;
            spawnRipple(e.currentTarget);
            selectChoice(c.letter);
          };

          let choiceHtml = c.text && c.text.trim().length > 0 ? c.text.trim() : \`Option \${c.letter}\`;
          if (window.marked && (choiceHtml.includes('$') || choiceHtml.includes('*') || choiceHtml.includes('_'))) {
            choiceHtml = marked.parseInline(choiceHtml);
          }

          btn.innerHTML = \`
            <div class="h-12 w-12 rounded-xl flex items-center justify-center font-black text-lg shrink-0 transition \${
              isSelected ? "bg-ink-900/40 text-copper-400" : "bg-ink-700 text-chalk/70 border border-ink-500"
            }">
              \${c.letter}
            </div>
            <div class="text-base md:text-lg leading-relaxed font-semibold">
              \${choiceHtml}
            </div>
          \`;
          choicesBox.appendChild(btn);
        });
      }`,
    replacement: `      // 2. Choices — Large, Punchy Circle Selectors (A, B, C, D)
      const choicesBox = document.getElementById("q-choices-container");
      choicesBox.innerHTML = "";
      const selected = studentAnswers[realIdx];
      const isMulti = isQuestionMultiSelect(q, realIdx);
      const expectedCount = isMulti ? getExpectedChoiceCount(q, realIdx) : 1;
      const selectedLetters = parseAnswerLetters(selected);
      const isRevealed = isCurrentQuestionEvaluationRevealed();
      const revealedKey = isRevealed ? getQuestionCorrectAnswer(realIdx) : null;
      const revealedLetters = parseAnswerLetters(revealedKey);

      if (q.card_image) {
        const label = document.createElement("p");
        label.className = "text-sm md:text-base text-chalk/70 font-black mb-4 uppercase tracking-widest text-center";
        if (isMulti) {
          label.innerHTML = \`<span class="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black mr-2">✦ MULTI-SELECT</span> Select \${expectedCount} answers: <span class="text-copper-400 font-bold">(\${selectedLetters.length} of \${expectedCount} selected)</span>\`;
        } else {
          label.textContent = "Select your answer:";
        }
        choicesBox.appendChild(label);

        const row = document.createElement("div");
        row.className = "flex items-center justify-center gap-6 md:gap-8 pb-3";

        const showAnswerFeedback = isRevealed || ((isExamLocked || isExamSubmitted) && Boolean(revealedKey));
        q.choices.forEach(c => {
          const isSelected = selectedLetters.includes(c.letter);
          let btnCls = "";
          let disabled = false;
          if (showAnswerFeedback && revealedKey) {
            disabled = true;
            if (revealedLetters.includes(c.letter)) {
              btnCls = "choice-correct";
            } else if (isSelected) {
              btnCls = "choice-wrong";
            } else {
              btnCls = "bg-ink-700 text-chalk/40 border-ink-600 opacity-40 choice-dimmed";
            }
          } else if (isSelected) {
            btnCls = "choice-selected";
          } else {
            btnCls = "bg-ink-700 text-chalk/80 border-ink-500 hover:border-copper-500 hover:text-copper-400";
          }

          const btn = document.createElement("button");
          btn.dataset.letter = c.letter;
          btn.disabled = disabled;
          btn.className = \`choice-btn pressable h-16 w-16 md:h-20 md:w-20 rounded-2xl flex items-center justify-center font-black text-2xl md:text-3xl border-2 \${btnCls}\`;
          btn.textContent = c.letter;
          if (isSelected) {
            const sweep = document.createElement("span");
            sweep.className = "sweep-bar";
            btn.appendChild(sweep);
          }
          btn.onclick = (e) => {
            if (isRevealed || isExamLocked || isExamSubmitted) return;
            spawnRipple(e.currentTarget);
            selectChoice(c.letter);
          };
          row.appendChild(btn);
        });

        choicesBox.appendChild(row);
      } else {
        // Fallback full-text buttons
        if (isMulti) {
          const multiLabel = document.createElement("div");
          multiLabel.className = "text-center mb-2";
          multiLabel.innerHTML = \`<span class="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black mr-2">✦ MULTI-SELECT</span> Select \${expectedCount} answers: <span class="text-copper-400 font-bold">(\${selectedLetters.length} of \${expectedCount} selected)</span>\`;
          choicesBox.appendChild(multiLabel);
        }
        const showAnswerFeedback = isRevealed || ((isExamLocked || isExamSubmitted) && Boolean(revealedKey));
        choicesBox.className = "space-y-3 pt-2";
        q.choices.forEach(c => {
          const isSelected = selectedLetters.includes(c.letter);
          let btnCls = "";
          let disabled = false;
          if (showAnswerFeedback && revealedKey) {
            disabled = true;
            if (revealedLetters.includes(c.letter)) {
              btnCls = "choice-correct";
            } else if (isSelected) {
              btnCls = "choice-wrong";
            } else {
              btnCls = "border-ink-700 bg-ink-900/40 text-chalk/40 opacity-40 choice-dimmed";
            }
          } else if (isSelected) {
            btnCls = "choice-selected";
          } else {
            btnCls = "border-ink-600 bg-ink-800/70 hover:border-copper-500/60 text-chalk/80 hover:text-chalk";
          }

          const btn = document.createElement("button");
          btn.dataset.letter = c.letter;
          btn.disabled = disabled;
          btn.className = \`choice-btn pressable w-full text-left p-5 rounded-2xl border flex items-center gap-4 \${btnCls}\`;
          btn.onclick = (e) => {
            if (isRevealed || isExamLocked || isExamSubmitted) return;
            spawnRipple(e.currentTarget);
            selectChoice(c.letter);
          };

          let choiceHtml = c.text && c.text.trim().length > 0 ? c.text.trim() : \`Option \${c.letter}\`;
          if (window.marked && (choiceHtml.includes('$') || choiceHtml.includes('*') || choiceHtml.includes('_'))) {
            choiceHtml = marked.parseInline(choiceHtml);
          }

          btn.innerHTML = \`
            <div class="h-12 w-12 rounded-xl flex items-center justify-center font-black text-lg shrink-0 transition \${
              isSelected ? "bg-ink-900/40 text-copper-400" : "bg-ink-700 text-chalk/70 border border-ink-500"
            }">
              \${c.letter}
            </div>
            <div class="text-base md:text-lg leading-relaxed font-semibold">
              \${choiceHtml}
            </div>
          \`;
          choicesBox.appendChild(btn);
        });
      }`
  },
  {
    name: "renderCurrentQuestion: isLocked evaluation check",
    target: `        const isCorrect = isEvaluated && (selected === revealedKey);`,
    replacement: `        const isCorrect = isEvaluated && isAnswerCorrect(selected, revealedKey);`
  },
  {
    name: "selectChoice: multi-select toggle, capacity check & gamified delay",
    target: `    function selectChoice(letter) {
      if (discussionActive) return;
      if (isExamLocked || isExamSubmitted) return;
      const realIdx = questionOrder[currentQuestionIdx];
      if (quizMode === "teacher_led" && studentLockedAnswers[realIdx]) return; // Strictly cannot change if locked in teacher-led!
      
      // In gamified sessions, once a question is answered and scored, it cannot be changed
      if (isGamifiedSession && gamifiedScoredQuestions.has(realIdx)) return;

      if (window.GameArena) window.GameArena.SoundFX.click();
      const wasSelected = studentAnswers[realIdx];
      studentAnswers[realIdx] = letter;
      
      if (isGamifiedSession) {
        gamifiedScoredQuestions.add(realIdx);
        studentLockedAnswers[realIdx] = { manual: true, locked_at: new Date().toISOString() };
        syncStudentLiveAnswer(true);

        const correct = getQuestionCorrectAnswer(realIdx) || (currentQuiz && currentQuiz.questions[realIdx] && currentQuiz.questions[realIdx].correct_answer);
        const isRight = Boolean(correct && letter === correct);

        renderCurrentQuestion();
        onStudentAnswerLockedInGamified(isRight);
        return;
      }

      syncStudentLiveAnswer(false);
      renderCurrentQuestion();

      const qNum = currentQuestionIdx + 1;
      if (quizMode === "student_led") {
        if (wasSelected && wasSelected !== letter) {
          showToast(\`Answer changed to Option \${letter}\`, \`Question \${qNum} updated\`, "plum", 1500);
        } else {
          showToast(\`Option \${letter} selected\`, \`Question \${qNum}\`, "plum", 1500);
        }
      } else {
        if (wasSelected && wasSelected !== letter) {
          showToast(\`Answer changed to \${letter}\`, \`Question \${qNum} updated\`, "plum", 2000);
        } else {
          showToast(\`Option \${letter} selected\`, \`Question \${qNum} (Click Lock to finalize)\`, "copper", 2000);
        }
      }
    }`,
    replacement: `    function selectChoice(letter) {
      if (discussionActive) return;
      if (isExamLocked || isExamSubmitted) return;
      const realIdx = questionOrder[currentQuestionIdx];
      if (quizMode === "teacher_led" && studentLockedAnswers[realIdx]) return; // Strictly cannot change if locked in teacher-led!
      
      // In gamified sessions, once a question is answered and scored, it cannot be changed
      if (isGamifiedSession && gamifiedScoredQuestions.has(realIdx)) return;

      if (window.GameArena) window.GameArena.SoundFX.click();

      const q = currentQuiz && currentQuiz.questions && currentQuiz.questions[realIdx];
      const isMulti = isQuestionMultiSelect(q, realIdx);
      const expectedCount = isMulti ? getExpectedChoiceCount(q, realIdx) : 1;
      const wasSelected = studentAnswers[realIdx];

      if (isMulti) {
        let curLetters = parseAnswerLetters(studentAnswers[realIdx]);
        const existsIdx = curLetters.indexOf(letter);
        if (existsIdx >= 0) {
          curLetters.splice(existsIdx, 1);
        } else {
          if (curLetters.length >= expectedCount) {
            curLetters.shift();
          }
          curLetters.push(letter);
        }
        curLetters.sort();
        if (curLetters.length > 0) {
          studentAnswers[realIdx] = curLetters.join(",");
        } else {
          delete studentAnswers[realIdx];
        }
      } else {
        studentAnswers[realIdx] = letter;
      }
      
      if (isGamifiedSession) {
        const selectedLetters = parseAnswerLetters(studentAnswers[realIdx]);
        if (isMulti && selectedLetters.length < expectedCount) {
          syncStudentLiveAnswer(false);
          renderCurrentQuestion();
          showToast(\`Selected (\${selectedLetters.length}/\${expectedCount})\`, \`Select \${expectedCount} choices to submit\`, "copper", 1500);
          return;
        }

        gamifiedScoredQuestions.add(realIdx);
        studentLockedAnswers[realIdx] = { manual: true, locked_at: new Date().toISOString() };
        syncStudentLiveAnswer(true);

        const correct = getQuestionCorrectAnswer(realIdx) || (q && q.correct_answer);
        const isRight = isAnswerCorrect(studentAnswers[realIdx], correct);

        renderCurrentQuestion();
        onStudentAnswerLockedInGamified(isRight);
        return;
      }

      syncStudentLiveAnswer(false);
      renderCurrentQuestion();

      const qNum = currentQuestionIdx + 1;
      const curAnswer = studentAnswers[realIdx];
      if (isMulti) {
        const curLetters = parseAnswerLetters(curAnswer);
        if (curLetters.length === 0) {
          showToast("Selection Cleared", \`Question \${qNum}\`, "plum", 1400);
        } else if (curLetters.length < expectedCount) {
          showToast(\`Option \${letter} toggled (\${curLetters.length}/\${expectedCount})\`, \`Question \${qNum}: Select \${expectedCount} choices\`, "plum", 1500);
        } else {
          showToast(\`Options \${curLetters.join(" & ")} selected\`, \`Question \${qNum}: Ready\`, "plum", 1800);
        }
      } else {
        if (quizMode === "student_led") {
          if (wasSelected && wasSelected !== letter) {
            showToast(\`Answer changed to Option \${letter}\`, \`Question \${qNum} updated\`, "plum", 1500);
          } else {
            showToast(\`Option \${letter} selected\`, \`Question \${qNum}\`, "plum", 1500);
          }
        } else {
          if (wasSelected && wasSelected !== letter) {
            showToast(\`Answer changed to \${letter}\`, \`Question \${qNum} updated\`, "plum", 2000);
          } else {
            showToast(\`Option \${letter} selected\`, \`Question \${qNum} (Click Lock to finalize)\`, "copper", 2000);
          }
        }
      }
    }`
  },
  {
    name: "lockCurrentAnswer: multi-select validation gate",
    target: `    function lockCurrentAnswer() {
      const realIdx = questionOrder[currentQuestionIdx];
      if (!studentAnswers[realIdx]) {
        alert("Please select an answer choice before locking in.");
        return;
      }`,
    replacement: `    function lockCurrentAnswer() {
      const realIdx = questionOrder[currentQuestionIdx];
      const q = currentQuiz && currentQuiz.questions && currentQuiz.questions[realIdx];
      const isMulti = isQuestionMultiSelect(q, realIdx);
      const expectedCount = isMulti ? getExpectedChoiceCount(q, realIdx) : 1;
      const currentSelected = parseAnswerLetters(studentAnswers[realIdx]);

      if (currentSelected.length === 0) {
        alert("Please select an answer choice before locking in.");
        return;
      }
      if (isMulti && currentSelected.length < expectedCount) {
        alert(\`This is a multi-select question requiring \${expectedCount} answers. You have selected \${currentSelected.length}. Please select \${expectedCount} choices before locking in.\`);
        return;
      }`
  },
  {
    name: "lockCurrentAnswer: gamified isRight comparison",
    target: `      if (isGamifiedSession) {
        const correct = getQuestionCorrectAnswer(realIdx) || (currentQuiz && currentQuiz.questions[realIdx] && currentQuiz.questions[realIdx].correct_answer);
        const isRight = Boolean(studentAnswers[realIdx] && correct && studentAnswers[realIdx] === correct);
        onStudentAnswerLockedInGamified(isRight);
      }`,
    replacement: `      if (isGamifiedSession) {
        const correct = getQuestionCorrectAnswer(realIdx) || (currentQuiz && currentQuiz.questions[realIdx] && currentQuiz.questions[realIdx].correct_answer);
        const isRight = isAnswerCorrect(studentAnswers[realIdx], correct);
        onStudentAnswerLockedInGamified(isRight);
      }`
  },
  {
    name: "syncCurrentQuestionEvaluationState isCorrect",
    target: `      const correctAns = getQuestionCorrectAnswer(realIdx);
      const studentAns = studentAnswers[realIdx];
      const isCorrect = Boolean(studentAns && correctAns && studentAns === correctAns);`,
    replacement: `      const correctAns = getQuestionCorrectAnswer(realIdx);
      const studentAns = studentAnswers[realIdx];
      const isCorrect = Boolean(studentAns && correctAns && isAnswerCorrect(studentAns, correctAns));`
  },
  {
    name: "syncStudentLiveAnswer isCorrect",
    target: `      const correctAns = getQuestionCorrectAnswer(realIdx);
      const isCorrect = Boolean(letter && correctAns && letter === correctAns);`,
    replacement: `      const correctAns = getQuestionCorrectAnswer(realIdx);
      const isCorrect = Boolean(letter && correctAns && isAnswerCorrect(letter, correctAns));`
  },
  {
    name: "nextQuestion gamified isRight",
    target: `          const correct = getQuestionCorrectAnswer(curReal) || (currentQuiz && currentQuiz.questions[curReal] && currentQuiz.questions[curReal].correct_answer);
          const isRight = Boolean(studentAnswers[curReal] && correct && studentAnswers[curReal] === correct);`,
    replacement: `          const correct = getQuestionCorrectAnswer(curReal) || (currentQuiz && currentQuiz.questions[curReal] && currentQuiz.questions[curReal].correct_answer);
          const isRight = Boolean(studentAnswers[curReal] && correct && isAnswerCorrect(studentAnswers[curReal], correct));`
  },
  {
    name: "finishAndGradeExam retryScore",
    target: `        currentQuiz.questions.forEach((q, idx) => {
          const correct = getQuestionCorrectAnswer(idx) || q.correct_answer;
          if (studentAnswers[idx] && studentAnswers[idx] === correct) retryScore++;
        });`,
    replacement: `        currentQuiz.questions.forEach((q, idx) => {
          const correct = getQuestionCorrectAnswer(idx) || q.correct_answer;
          if (studentAnswers[idx] && isAnswerCorrect(studentAnswers[idx], correct)) retryScore++;
        });`
  },
  {
    name: "finishAndGradeExam main score",
    target: `      let score = 0;
      currentQuiz.questions.forEach((q, idx) => {
        const correct = getQuestionCorrectAnswer(idx) || q.correct_answer;
        if (studentAnswers[idx] && studentAnswers[idx] === correct) {
          score++;
        }
      });`,
    replacement: `      let score = 0;
      currentQuiz.questions.forEach((q, idx) => {
        const correct = getQuestionCorrectAnswer(idx) || q.correct_answer;
        if (studentAnswers[idx] && isAnswerCorrect(studentAnswers[idx], correct)) {
          score++;
        }
      });`
  },
  {
    name: "showReviewView isCorrect",
    target: `      currentQuiz.questions.forEach((q, idx) => {
        const studentAns = studentAnswers[idx];
        const correctAns = getQuestionCorrectAnswer(idx) || q.correct_answer;
        const isCorrect = Boolean(studentAns && correctAns && studentAns === correctAns);`,
    replacement: `      currentQuiz.questions.forEach((q, idx) => {
        const studentAns = studentAnswers[idx];
        const correctAns = getQuestionCorrectAnswer(idx) || q.correct_answer;
        const isCorrect = Boolean(studentAns && correctAns && isAnswerCorrect(studentAns, correctAns));`
  },
  {
    name: "computeConceptBreakdown b.correct",
    target: `        const chosen = studentAnswers[idx];
        if (chosen !== undefined) b.answered++;
        if (chosen && chosen === q.correct_answer) b.correct++;
        else b.missed.push(idx);`,
    replacement: `        const chosen = studentAnswers[idx];
        if (chosen !== undefined) b.answered++;
        if (chosen && isAnswerCorrect(chosen, q.correct_answer)) b.correct++;
        else b.missed.push(idx);`
  },
  {
    name: "startRemediationQuiz missedIdx",
    target: `      currentQuiz.questions.forEach((q, idx) => {
        const chosen = studentAnswers[idx];
        if (!chosen || chosen !== q.correct_answer) missedIdx.push(idx);
      });`,
    replacement: `      currentQuiz.questions.forEach((q, idx) => {
        const chosen = studentAnswers[idx];
        if (!chosen || !isAnswerCorrect(chosen, q.correct_answer)) missedIdx.push(idx);
      });`
  }
];

applyPatch('index.html', indexPatches);

// ----------------------------------------------------------------------------
// 2. TEACHER.HTML PATCHES
// ----------------------------------------------------------------------------
const teacherPatches = [
  {
    name: "Multi-Select Helpers in teacher.html",
    target: `    let isAnswerRevealed = false;`,
    replacement: `    let isAnswerRevealed = false;

    // ============================================================================
    // MULTI-SELECT & NORMALIZATION HELPERS
    // ============================================================================
    function normalizeAnswer(ans) {
      if (!ans) return "";
      return String(ans)
        .split(",")
        .map(s => s.trim().toUpperCase())
        .filter(Boolean)
        .sort()
        .join(",");
    }

    function parseAnswerLetters(ans) {
      if (!ans) return [];
      return String(ans)
        .split(",")
        .map(s => s.trim().toUpperCase())
        .filter(Boolean);
    }

    function isAnswerCorrect(studentAns, correctAns) {
      const normS = normalizeAnswer(studentAns);
      const normC = normalizeAnswer(correctAns);
      return Boolean(normS && normC && normS === normC);
    }`
  },
  {
    name: "teacher.html distribution bars multi-answer counts",
    target: `      dedupedAnswers.forEach(a => {
        const rawLetter = a.selected_letter;
        const isAnswered = rawLetter && rawLetter !== 'null' && rawLetter !== 'undefined' && String(rawLetter).trim() !== '';
        if (isAnswered) {
          const letter = String(rawLetter).toUpperCase();
          if (counts[letter] !== undefined) {
            counts[letter]++;
            answeredCount++;
          }
        } else {
          counts.NO_ANSWER++;
        }
      });
      const totalAnswers = dedupedAnswers.length;

      const distContainer = document.getElementById("lc-distribution-bars");
      if (distContainer) {
        distContainer.innerHTML = "";
        ["A", "B", "C", "D"].forEach(letter => {
          const count = counts[letter];
          const pct = totalAnswers > 0 ? Math.round((count / totalAnswers) * 100) : 0;
          const isCorrect = letter === correctLetter;`,
    replacement: `      const correctLetters = parseAnswerLetters(correctLetter);
      dedupedAnswers.forEach(a => {
        const rawLetter = a.selected_letter;
        const isAnswered = rawLetter && rawLetter !== 'null' && rawLetter !== 'undefined' && String(rawLetter).trim() !== '';
        if (isAnswered) {
          const letters = parseAnswerLetters(rawLetter);
          let counted = false;
          letters.forEach(letter => {
            if (counts[letter] !== undefined) {
              counts[letter]++;
              counted = true;
            }
          });
          if (counted) {
            answeredCount++;
          }
        } else {
          counts.NO_ANSWER++;
        }
      });
      const totalAnswers = dedupedAnswers.length;

      const distContainer = document.getElementById("lc-distribution-bars");
      if (distContainer) {
        distContainer.innerHTML = "";
        ["A", "B", "C", "D"].forEach(letter => {
          const count = counts[letter];
          const pct = totalAnswers > 0 ? Math.round((count / totalAnswers) * 100) : 0;
          const isCorrect = correctLetters.includes(letter);`
  },
  {
    name: "teacher.html openApClassroomModal multi-answer telemetry",
    target: `        if (!isAnswered) {
          blankCount++;
          choiceCounts.BLANK++;
          studentItems.push({
            name: displayName,
            status: 'BLANK',
            chosen: 'None',
            isCorrect: false
          });
        } else if (chosenLetter === correctLetter) {
          rightCount++;
          if (choiceCounts[chosenLetter] !== undefined) choiceCounts[chosenLetter]++;
          studentItems.push({
            name: displayName,
            status: 'RIGHT',
            chosen: chosenLetter,
            isCorrect: true
          });
        } else {
          wrongCount++;
          if (choiceCounts[chosenLetter] !== undefined) choiceCounts[chosenLetter]++;
          studentItems.push({
            name: displayName,
            status: 'WRONG',
            chosen: chosenLetter,
            isCorrect: false
          });
        }`,
    replacement: `        const isRight = isAnswerCorrect(chosenLetter, correctLetter);
        const letters = parseAnswerLetters(chosenLetter);
        letters.forEach(l => {
          if (choiceCounts[l] !== undefined) choiceCounts[l]++;
        });

        if (!isAnswered) {
          blankCount++;
          choiceCounts.BLANK++;
          studentItems.push({
            name: displayName,
            status: 'BLANK',
            chosen: 'None',
            isCorrect: false
          });
        } else if (isRight) {
          rightCount++;
          studentItems.push({
            name: displayName,
            status: 'RIGHT',
            chosen: chosenLetter,
            isCorrect: true
          });
        } else {
          wrongCount++;
          studentItems.push({
            name: displayName,
            status: 'WRONG',
            chosen: chosenLetter,
            isCorrect: false
          });
        }`
  },
  {
    name: "teacher.html hardest question calculation",
    target: `          subs.forEach(s => {
            if (s.answers && s.answers[qIdx] === q.correct_answer) correctCount++;
          });`,
    replacement: `          subs.forEach(s => {
            if (s.answers && isAnswerCorrect(s.answers[qIdx], q.correct_answer)) correctCount++;
          });`
  },
  {
    name: "teacher.html concept stats correctCount",
    target: `          stats.total++;
          if (chosen === q.correct_answer) stats.correctCount++;
          else stats.distractor[chosen] = (stats.distractor[chosen] || 0) + 1;`,
    replacement: `          stats.total++;
          if (isAnswerCorrect(chosen, q.correct_answer)) stats.correctCount++;
          else stats.distractor[chosen] = (stats.distractor[chosen] || 0) + 1;`
  },
  {
    name: "teacher.html perStudent right calculation",
    target: `          perStudent[key].total++;
          if (chosen === q.correct_answer) perStudent[key].right++;`,
    replacement: `          perStudent[key].total++;
          if (isAnswerCorrect(chosen, q.correct_answer)) perStudent[key].right++;`
  }
];

applyPatch('teacher.html', teacherPatches);
console.log('=== ALL MULTI-SELECT PATCHES COMPLETED SUCCESSFULLY ===');
