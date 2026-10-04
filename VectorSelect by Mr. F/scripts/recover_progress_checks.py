"""
RECOVERY CROP — progress checks that lost questions during the original build.
==========================================================================
Three progress-check MCQ sets came out of the first extraction pass missing
most of their questions:

  APP1 Unit 4 Progress Check ....... only Q1
  APPC Unit 1 Progress Check ....... only Q1, Q4
  APPC Unit 4 Progress Check ....... only Q1

Root cause: `build_exam_database.crop_sg_questions()` detects a question
heading with

    r'(?:^|\n)\\s*(\\d+)\\.\\s+([^\\n]+)'

which requires real text *after* the number on the same line. College Board
scoring guides frequently render the heading as a bare "3." with the stem
starting on the next line, so those questions were never detected and no
card was ever cropped.

This script re-crops those three sets using a heading pattern that accepts a
bare number, and re-uses the pipeline's answer-stripping so no key leaks.

What it does NOT do: touch unit tests. They are excluded by design.
"""
import json
import os
import re

import pypdfium2 as pdfium
import pypdfium2.raw as pdfium_raw
from PIL import Image, ImageFilter

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_ROOT = os.path.join(BASE_DIR, "input pdf")
CARDS_DIR = os.path.join(BASE_DIR, "assets", "cards")
JSON_PATH = os.path.join(BASE_DIR, "data", "exams.json")

SCALE = 2.0
HEADER_MARGIN = 65.0
FOOTER_MARGIN = 25.0

# Green answer-highlight vectors used by College Board scoring guides.
GREEN_COLORS = [
    (58, 145, 63),
    (227, 255, 222),
    (230, 255, 230),
    (0, 128, 0),
]

# (subject_key, unit_key, assessment_id, source_pdf)
TARGETS = [
    (
        "APP1", "Unit 4", "app1_unit4_unit_4_progress_check",
        os.path.join(SRC_ROOT, "APP1", "Unit 4",
                     "SG_Unit3ProgressCheckMCQ_67397b3772fd05.67397b3993d710.48803153.pdf"),
    ),
    (
        "APPC", "Unit 1", "appc_unit1_unit_1_progress_check",
        os.path.join(SRC_ROOT, "APPC", "Unit 1",
                     "SG_Unit1ProgressCheckMCQ_66cd760c0e7321.66cd760e9bbc85.32218794.pdf"),
    ),
    (
        "APPC", "Unit 4", "appc_unit4_unit_4_progress_check",
        os.path.join(SRC_ROOT, "APPC", "unit 4",
                     "SG_Unit4ProgressCheckMCQ_67397b832856f4.67397b857700e4.45142013.pdf"),
    ),
]

# A question heading: an integer 1..40 followed by a period, at line start.
# The stem may or may not follow on the same line, so we capture only the
# number and require the token before it to be line-initial. The (?!\d) guard
# rejects wrapped decimals such as "1.5 m/s. A short time later...".
QHEAD = re.compile(r"(?:^|\n)\s{0,10}(\d{1,2})\s?\.(?!\d)")

ANSWER = re.compile(r"Answer\s+([A-D])\b")


def sanitize_page(page):
    """Remove College Board's green answer-highlight vectors from a page."""
    try:
        count = pdfium_raw.FPDFPage_GetObjectCount(page)
    except Exception:
        return

    doomed = []
    for i in range(count):
        try:
            otype = pdfium_raw.FPDFPage_GetObjectType(page, i)
            if otype != pdfium_raw.FPDF_PAGEOBJ_PATH:
                continue
            fill = pdfium_raw.FPDFPageObj_GetFillColor(page, i)
            stroke = pdfium_raw.FPDFPageObj_GetStrokeColor(page, i)
            for rgb in (fill, stroke):
                if rgb is None or len(rgb) < 3:
                    continue
                r, g, b = int(rgb[0]), int(rgb[1]), int(rgb[2])
                if (r, g, b) in GREEN_COLORS:
                    doomed.append(i)
                    break
        except Exception:
            continue

    for i in doomed:
        try:
            pdfium_raw.FPDFPage_RemoveObject(page, i)
        except Exception:
            pass

    if doomed:
        try:
            pdfium_raw.FPDFPage_GenerateContent(page)
        except Exception:
            pass


def is_green(color):
    if color is None or len(color) < 3:
        return False
    return (int(color[0]), int(color[1]), int(color[2])) in GREEN_COLORS


def scan_pages(doc):
    """Return per-page question starts and answer-box positions."""
    pages = []
    for p_idx in range(len(doc)):
        page = doc[p_idx]
        width, height = page.get_size()
        tp = page.get_textpage()
        text = tp.get_text_range()

        qs = []
        for m in QHEAD.finditer(text):
            qnum = int(m.group(1))
            if not (1 <= qnum <= 40):
                continue
            # Reject "Page 4 of 13" style matches.
            tail = text[m.end():m.end() + 30].strip()
            if re.match(r"(?i)page\b", tail):
                continue
            try:
                box = tp.get_charbox(m.start(1))
            except Exception:
                continue
            top_y = height - box[3]
            if top_y > HEADER_MARGIN:
                qs.append({"qnum": qnum, "top_y": top_y})

        # De-duplicate repeated detections of the same number on one page.
        seen = set()
        uniq = []
        for q in sorted(qs, key=lambda x: x["top_y"]):
            if q["qnum"] in seen:
                continue
            seen.add(q["qnum"])
            uniq.append(q)

        answers = []
        for m in ANSWER.finditer(text):
            try:
                box = tp.get_charbox(m.start(0))
            except Exception:
                continue
            answers.append({"ans": m.group(1), "top_y": height - box[3]})
        answers.sort(key=lambda a: a["top_y"])

        pages.append({
            "p_idx": p_idx,
            "w": width,
            "h": height,
            "qs": uniq,
            "ans": answers,
        })
    return pages


def collect_answers(pages):
    """
    Map question number -> answer letter.

    Answers appear as 'Answer X' immediately after that question's options,
    so we walk the pages in reading order pairing the Nth answer with the Nth
    question start.
    """
    ordered_qs = []
    for pd in pages:
        for q in pd["qs"]:
            ordered_qs.append((pd["p_idx"], q["top_y"], q["qnum"]))
    ordered_qs.sort(key=lambda t: (t[0], t[1]))

    ordered_ans = []
    for pd in pages:
        for a in pd["ans"]:
            ordered_ans.append((pd["p_idx"], a["top_y"], a["ans"]))
    ordered_ans.sort(key=lambda t: (t[0], t[1]))

    keys = {}
    for idx, (_p, _y, qnum) in enumerate(ordered_qs):
        if idx < len(ordered_ans):
            # Only trust an answer that appears on the same page or later.
            if ordered_ans[idx][0] >= _p:
                keys[qnum] = ordered_ans[idx][2]
    return keys, ordered_qs


def crop_one(doc, pages, ordered_qs, keys, qnum, slug):
    """
    Crop a single question, cutting strictly above its 'Answer X' line so the
    key and green highlight never appear on the card.
    """
    entry = next((t for t in ordered_qs if t[2] == qnum), None)
    if not entry:
        return None

    start_page, start_top, _ = entry
    segments = []

    end_y = None
    for pd in pages:
        if pd["p_idx"] != start_page:
            continue
        below = [a["top_y"] for a in pd["ans"] if a["top_y"] > start_top]
        if below:
            end_y = min(below) - 8.0
            break

    if end_y is not None:
        segments.append({
            "p_idx": start_page,
            "top_y": max(HEADER_MARGIN, start_top - 8.0),
            "bottom_y": end_y,
        })
    else:
        # Answer not on this page: run to the footer, then continue onto the
        # next page(s) until the next question heading appears.
        segments.append({
            "p_idx": start_page,
            "top_y": max(HEADER_MARGIN, start_top - 8.0),
            "bottom_y": pages[start_page]["h"] - FOOTER_MARGIN,
        })

        cursor = start_page + 1
        while cursor < len(pages):
            pd = pages[cursor]
            nxt = [q for q in pd["qs"] if q["qnum"] > qnum]
            if nxt:
                segments.append({
                    "p_idx": cursor,
                    "top_y": HEADER_MARGIN,
                    "bottom_y": min(n["top_y"] for n in nxt) - 8.0,
                })
                break
            stop = pd["h"] - FOOTER_MARGIN
            if pd["ans"]:
                stop = min(a["top_y"] for a in pd["ans"]) - 8.0
            segments.append({
                "p_idx": cursor,
                "top_y": HEADER_MARGIN,
                "bottom_y": stop,
            })
            cursor += 1

    crops = []
    for seg in segments:
        page = doc[seg["p_idx"]]
        pil = page.render(scale=SCALE).to_pil()
        top_px = int(max(0, seg["top_y"] * SCALE))
        bot_px = int(min(pil.height, seg["bottom_y"] * SCALE))
        left_px = int(30.0 * SCALE)
        right_px = int((pages[seg["p_idx"]]["w"] - 30.0) * SCALE)
        if bot_px > top_px + 20:
            crops.append(pil.crop((left_px, top_px, right_px, bot_px)))

    if not crops:
        return None

    if len(crops) == 1:
        card = crops[0]
    else:
        total_h = sum(c.height for c in crops)
        max_w = max(c.width for c in crops)
        card = Image.new("RGB", (max_w, total_h), (255, 255, 255))
        offset = 0
        for c in crops:
            card.paste(c, (0, offset))
            offset += c.height

    card = card.filter(ImageFilter.UnsharpMask(radius=1.2, percent=28, threshold=5))

    fname = f"{slug}_q{qnum}.png"
    card.save(os.path.join(CARDS_DIR, fname), "PNG")
    return f"assets/cards/{fname}"


def main():
    os.makedirs(CARDS_DIR, exist_ok=True)
    db = json.load(open(JSON_PATH, encoding="utf-8"))

    for subject_key, unit_key, assessment_id, src in TARGETS:
        print("=" * 64)
        print(f"{subject_key} / {unit_key} / {assessment_id}")
        if not os.path.exists(src):
            print("  SOURCE PDF NOT FOUND — skipped")
            continue

        doc = pdfium.PdfDocument(src)
        for p in range(len(doc)):
            sanitize_page(doc[p])

        pages = scan_pages(doc)
        keys, ordered_qs = collect_answers(pages)
        qnums = sorted({q[2] for q in ordered_qs})
        print(f"  detected questions: {qnums}")
        print(f"  answer keys       : {''.join(keys[k] for k in qnums if k in keys)}")

        cropped = {}
        for qnum in qnums:
            rel = crop_one(doc, pages, ordered_qs, keys, qnum, assessment_id)
            if rel:
                cropped[qnum] = rel

        print(f"  cards written     : {len(cropped)} -> {sorted(cropped)}")

        # Splice the recovered questions back into the database.
        unit = db["subjects"][subject_key]["units"][unit_key]
        assessment = next(
            (a for a in unit["assessments"] if a["id"] == assessment_id), None
        )
        if assessment:
            have = {q["number"] for q in assessment["questions"]}
            added = 0
            for qnum in sorted(cropped):
                if qnum in have:
                    continue
                letter = keys.get(qnum, "")
                assessment["questions"].append({
                    "number": qnum,
                    "card_image": cropped[qnum],
                    "choices": [{"letter": c, "text": ""} for c in "ABCD"],
                    "correct_answer": letter,
                    "explanation": "",
                })
                added += 1
            assessment["questions"].sort(key=lambda q: q["number"])
            assessment["question_count"] = len(assessment["questions"])
            print(f"  added to database : {added} (total now {assessment['question_count']})")
        print()

    with open(JSON_PATH, "w", encoding="utf-8") as fh:
        json.dump(db, fh, indent=2, ensure_ascii=False)
    print(f"Wrote {JSON_PATH}")
    print("Next: run scripts/tag_concepts.py to re-tag and rebuild the bundle.")


if __name__ == "__main__":
    main()