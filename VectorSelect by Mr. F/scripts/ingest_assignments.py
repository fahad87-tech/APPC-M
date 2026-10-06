"""
ingest_assignments.py — Ultra-Secure Hybrid Key Separation & Ingestion Pipeline

1. Reads data/exams.json.
2. Extracts official answer keys & explanations into:
   - data/answer_keys.json (Used to seed Supabase)
   - data/answer_keys.js   (Used ONLY for offline air-gapped classroom localhost fallback)
3. Assigns an immutable unique question_id (e.g. app1_unit1_1_1_q1) to every question.
4. Strips correct_answer and explanation from all questions in:
   - data/exams.json
   - data/exams_bundle.js (window.EXAM_DATA)
5. Verifies 0 occurrences of "correct_answer" remain in the public student bundle.
"""

import os
import json
import re

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
DATA_DIR = os.path.join(PROJECT_DIR, "data")

EXAMS_JSON_PATH = os.path.join(DATA_DIR, "exams.json")
EXAMS_BUNDLE_PATH = os.path.join(DATA_DIR, "exams_bundle.js")
KEYS_JSON_PATH = os.path.join(DATA_DIR, "answer_keys.json")
KEYS_JS_PATH = os.path.join(DATA_DIR, "answer_keys.js")


def main():
    print("=" * 70)
    print("VectorSelect — Key Ingestion & Stripping Pipeline (Supabase Ready)")
    print("=" * 70)

    if not os.path.exists(EXAMS_JSON_PATH):
        raise FileNotFoundError(f"Missing {EXAMS_JSON_PATH}")

    with open(EXAMS_JSON_PATH, "r", encoding="utf-8") as f:
        exams_data = json.load(f)

    all_keys = {}
    total_assessments = 0
    total_questions = 0
    total_keys_extracted = 0

    subjects = exams_data.get("subjects", {})
    for subj_key, subj_val in subjects.items():
        units = subj_val.get("units", {})
        for unit_name, unit_val in units.items():
            assessments = unit_val.get("assessments", [])
            for a in assessments:
                total_assessments += 1
                a_id = a.get("id")
                a_title = a.get("title", "")
                a_subj = a.get("subject", subj_val.get("name", subj_key))
                a_unit = a.get("unit", unit_name)

                keys_list = []
                questions = a.get("questions", [])

                for idx, q in enumerate(questions):
                    total_questions += 1
                    q_num = q.get("number", idx + 1)
                    q_id = f"{a_id}_q{q_num}"
                    q["question_id"] = q_id

                    corr = q.get("correct_answer", "")
                    expl = q.get("explanation", "")

                    if corr:
                        total_keys_extracted += 1

                    keys_list.append({
                        "question_id": q_id,
                        "number": q_num,
                        "correct_answer": corr,
                        "explanation": expl
                    })

                    # STRIP FROM PUBLIC BUNDLE
                    q.pop("correct_answer", None)
                    q.pop("explanation", None)

                all_keys[a_id] = {
                    "assessment_id": a_id,
                    "title": a_title,
                    "subject": a_subj,
                    "unit": a_unit,
                    "question_count": len(questions),
                    "keys": keys_list
                }

    print(f"[*] Processed Assessments : {total_assessments}")
    print(f"[*] Total Questions       : {total_questions}")
    print(f"[*] Answer Keys Extracted : {total_keys_extracted}")

    # 1. Save extracted keys to answer_keys.json (Internal Enclave)
    with open(KEYS_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(all_keys, f, indent=2, ensure_ascii=False)
    print(f"[+] Wrote secure key enclave -> {KEYS_JSON_PATH}")

    # 2. Save air-gap fallback to data/answer_keys.js (Git-Ignored)
    with open(KEYS_JS_PATH, "w", encoding="utf-8") as f:
        f.write("// VectorSelect by Mr. F — Offline Air-Gapped Fallback Answer Keys\n")
        f.write("// DO NOT COMMIT TO PUBLIC GITHUB REPOSITORY\n")
        f.write("window.OFFLINE_ANSWER_KEYS = ")
        json.dump(all_keys, f, indent=2, ensure_ascii=False)
        f.write(";\n")
    print(f"[+] Wrote offline air-gap fallback -> {KEYS_JS_PATH}")

    # 3. Save sanitized data/exams.json
    with open(EXAMS_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(exams_data, f, indent=2, ensure_ascii=False)
    print(f"[+] Wrote sanitized database -> {EXAMS_JSON_PATH}")

    # 4. Save sanitized public client bundle data/exams_bundle.js
    with open(EXAMS_BUNDLE_PATH, "w", encoding="utf-8") as f:
        f.write("// VectorSelect by Mr. F — AP Physics Assessments Database (Sanitized - Zero Key Exposure)\n")
        f.write("window.EXAM_DATA = ")
        json.dump(exams_data, f, indent=2, ensure_ascii=False)
        f.write(";\n")
    print(f"[+] Wrote sanitized client bundle -> {EXAMS_BUNDLE_PATH}")

    # 5. VERIFICATION: Ensure ZERO "correct_answer" strings in exams_bundle.js
    with open(EXAMS_BUNDLE_PATH, "r", encoding="utf-8") as f:
        bundle_content = f.read()

    matches = re.findall(r'"correct_answer"\s*:', bundle_content)
    if len(matches) == 0:
        print("[✓] VERIFICATION PASSED: 0 occurrences of 'correct_answer' found in exams_bundle.js.")
        print("[✓] Public bundle is 100% leak-proof for GitHub Pages!")
    else:
        raise ValueError(f"[✗] VERIFICATION FAILED: Found {len(matches)} residual 'correct_answer' keys in bundle!")

    print("=" * 70)


if __name__ == "__main__":
    main()
