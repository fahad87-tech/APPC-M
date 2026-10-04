"""
INGEST MID-TERM REVIEWS
=======================
Processes the 5 Quizizz/Wayground Mid-Term Review worksheets:
  - APP1 Unit 1 Review (11 Qs)
  - APP1 Unit 2 Review (10 Qs)
  - APP1 Unit 2A Review (10 Qs)
  - APPC Unit 1 Review (18 Qs)
  - APPC Unit 2 Review (15 Qs)

Crops high-res question cards, extracts answer keys,
and integrates them cleanly into exams.json and exams_bundle.js.
"""
import os
import re
import json
import pypdfium2 as pdfium
from PIL import Image

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INPUT_DIR = os.path.join(BASE_DIR, "input pdf")
CARDS_DIR = os.path.join(BASE_DIR, "assets", "cards")
DATA_DIR = os.path.join(BASE_DIR, "data")
JSON_PATH = os.path.join(DATA_DIR, "exams.json")
BUNDLE_PATH = os.path.join(DATA_DIR, "exams_bundle.js")

os.makedirs(CARDS_DIR, exist_ok=True)

def assessment_sort_key(a):
    title = a.get("title", "")
    m = re.match(r'^(\d+)\.(\d+)', title)
    if m:
        return (0, int(m.group(1)), int(m.group(2)), title)
    m_sec = re.search(r'Section\s*(\d+)', title, re.IGNORECASE)
    if m_sec:
        return (1, int(m_sec.group(1)), 0, title)
    if "Mid-Term Review" in title or "Midterm Review" in title:
        m_part = re.search(r'Part\s*(\d+)', title, re.IGNORECASE)
        part_num = int(m_part.group(1)) if m_part else 1
        return (2, part_num, 0, title)
    if "Practice Exam" in title or "Unit Test" in title:
        return (3, 0, 0, title)
    if "Progress Check" in title or "PC" in title:
        return (4, 0, 0, title)
    return (5, 0, 0, title)

REVIEWS = [
    {
        "course_key": "APP1",
        "unit_key": "Unit 1",
        "slug": "app1_unit1_midterm_review",
        "title": "Unit 1 Mid-Term Review: MCQ",
        "path": os.path.join(INPUT_DIR, "APP1", "Unit 1", "MidTerm Review", "Free Printable APP1 Unit 1 Review.pdf")
    },
    {
        "course_key": "APP1",
        "unit_key": "Unit 2",
        "slug": "app1_unit2_midterm_review_1",
        "title": "Unit 2 Mid-Term Review: MCQ (Part 1)",
        "path": os.path.join(INPUT_DIR, "APP1", "Unit 2", "MidTerm Review", "Free Printable APP1 Unit 2 REview.pdf")
    },
    {
        "course_key": "APP1",
        "unit_key": "Unit 2",
        "slug": "app1_unit2_midterm_review_2",
        "title": "Unit 2 Mid-Term Review: MCQ (Part 2)",
        "path": os.path.join(INPUT_DIR, "APP1", "Unit 2", "MidTerm Review", "Free Printable APP1 Unit 2A Review.pdf")
    },
    {
        "course_key": "APPC",
        "unit_key": "Unit 1",
        "slug": "appc_unit1_midterm_review",
        "title": "Unit 1 Mid-Term Review: MCQ",
        "path": os.path.join(INPUT_DIR, "APPC", "Unit 1", "Midterm Review", "Free Printable APPC - Unit 1 Review.pdf")
    },
    {
        "course_key": "APPC",
        "unit_key": "Unit 2",
        "slug": "appc_unit2_midterm_review",
        "title": "Unit 2 Mid-Term Review: MCQ",
        "path": os.path.join(INPUT_DIR, "APPC", "Unit 2", "Midterm Review", "Free Printable APPC Unit 2 Review.pdf")
    }
]

def parse_answer_keys(doc):
    ak_text = ""
    # Look in the last 3 pages
    for i in range(max(0, len(doc) - 3), len(doc)):
        txt = doc[i].get_textpage().get_text_range()
        if "Answer Key" in txt:
            ak_text += txt
            
    answers = {}
    entries = re.split(r'(?=\b\d{1,2}\.\s+[a-e]\))', ak_text)
    for entry in entries:
        m = re.match(r'(\d{1,2})\.\s+([a-e]\).*)', entry, re.DOTALL)
        if m:
            qnum = int(m.group(1))
            ans_body = m.group(2)
            letters = re.findall(r'([a-e])\)', ans_body)
            # Normalize to uppercase, e.g. 'A' or 'A,D'
            norm_letters = sorted(set([l.upper() for l in letters]))
            answers[qnum] = norm_letters[0] if len(norm_letters) == 1 else ",".join(norm_letters)
            
    return answers

def process_review_pdf(review_info):
    pdf_path = review_info["path"]
    slug = review_info["slug"]
    
    if not os.path.exists(pdf_path):
        print(f"Error: File not found: {pdf_path}")
        return None
        
    doc = pdfium.PdfDocument(pdf_path)
    ans_keys = parse_answer_keys(doc)
    scale = 2.0
    
    # Map questions per page (ignoring last 2 pages: Answer Keys & URL footer)
    content_pages = len(doc) - 2
    # Ensure answer keys page is excluded
    while content_pages > 0 and "Answer Key" in doc[content_pages - 1].get_textpage().get_text_range():
        content_pages -= 1
        
    questions = []
    
    for p_idx in range(content_pages):
        page = doc[p_idx]
        w, h = page.get_size()
        tp = page.get_textpage()
        text = tp.get_text_range()
        
        # Render high-res image of page
        bitmap = page.render(scale=scale)
        page_img = bitmap.to_pil()
        
        # Locate question starts
        q_matches = []
        for m in re.finditer(r'(?:^|\n)\s*([1-9]\d?)\.\s*(?!\d)', text):
            qnum = int(m.group(1))
            char_idx = m.start(1)
            box = tp.get_charbox(char_idx)
            top_y = h - box[3]
            q_matches.append((qnum, char_idx, top_y))
            
        if not q_matches:
            continue
            
        for i, (qnum, char_idx, top_y) in enumerate(q_matches):
            crop_top = max(10.0, top_y - 12.0)
            
            if i + 1 < len(q_matches):
                # Another question follows on the same page
                next_top = q_matches[i + 1][2]
                crop_bottom = max(crop_top + 30.0, next_top - 12.0)
            else:
                # Last question on this page: find bottom of content before footer
                cutoff = text.rfind('04/10/2026')
                if cutoff < 0:
                    cutoff = text.rfind('https://wayground.com')
                if cutoff < 0:
                    cutoff = len(text)
                    
                last_idx = cutoff - 1
                while last_idx >= char_idx and text[last_idx].isspace():
                    last_idx -= 1
                    
                if last_idx >= char_idx:
                    box_last = tp.get_charbox(last_idx)
                    crop_bottom = min(h - 25.0, (h - box_last[1]) + 15.0)
                else:
                    crop_bottom = h - 45.0
                    
            # Crop image
            x0 = int(22 * scale)
            x1 = int((w - 22) * scale)
            y0 = int(crop_top * scale)
            y1 = int(crop_bottom * scale)
            
            # Ensure valid box
            if y1 > y0 + 10:
                cropped = page_img.crop((x0, y0, x1, y1))
                card_filename = f"{slug}_q{qnum}.png"
                card_rel_path = f"assets/cards/{card_filename}"
                card_abs_path = os.path.join(CARDS_DIR, card_filename)
                cropped.save(card_abs_path, optimize=True)
            else:
                card_rel_path = ""
                
            # Choices (detect if e is present in choices or answer key)
            has_e = False
            # Check text between this question and next
            next_char_idx = q_matches[i+1][1] if i + 1 < len(q_matches) else len(text)
            q_slice = text[char_idx:next_char_idx]
            if re.search(r'\be\)', q_slice) or ans_keys.get(qnum) == 'E':
                has_e = True
                
            choice_letters = ['A', 'B', 'C', 'D', 'E'] if has_e else ['A', 'B', 'C', 'D']
            choices = [{"letter": l, "text": ""} for l in choice_letters]
            
            correct_ans = ans_keys.get(qnum, "A")
            
            questions.append({
                "number": qnum,
                "card_image": card_rel_path,
                "choices": choices,
                "correct_answer": correct_ans,
                "explanation": f"Mid-Term Review Question {qnum} from official review materials."
            })
            
    # Sort questions by number
    questions.sort(key=lambda x: x["number"])
    
    return {
        "id": slug,
        "title": review_info["title"],
        "unit": review_info["unit_key"],
        "subject": "AP Physics 1: Algebra-Based" if review_info["course_key"] == "APP1" else "AP Physics C: Mechanics",
        "question_count": len(questions),
        "questions": questions
    }

def main():
    print("==================================================")
    print("INGESTING MID-TERM REVIEW EXAMS")
    print("==================================================")
    
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        database = json.load(f)
        
    total_added = 0
    
    for rev in REVIEWS:
        print(f"\nProcessing: {rev['title']} ...")
        assess_obj = process_review_pdf(rev)
        if not assess_obj or not assess_obj["questions"]:
            print(f"  Failed to process {rev['title']}")
            continue
            
        c_key = rev["course_key"]
        u_key = rev["unit_key"]
        
        if c_key in database["subjects"] and u_key in database["subjects"][c_key]["units"]:
            unit_obj = database["subjects"][c_key]["units"][u_key]
            # Replace existing or append
            existing_idx = None
            for idx, item in enumerate(unit_obj["assessments"]):
                if item["id"] == rev["slug"]:
                    existing_idx = idx
                    break
                    
            if existing_idx is not None:
                unit_obj["assessments"][existing_idx] = assess_obj
                print(f"  ✓ Updated existing assessment '{rev['title']}' ({len(assess_obj['questions'])} questions)")
            else:
                unit_obj["assessments"].append(assess_obj)
                print(f"  ✓ Added new assessment '{rev['title']}' ({len(assess_obj['questions'])} questions)")
                
            total_added += len(assess_obj["questions"])

    # Re-sort all units' assessments strictly by section number
    for s_info in database.get("subjects", {}).values():
        for u_info in s_info.get("units", {}).values():
            if "assessments" in u_info:
                u_info["assessments"].sort(key=assessment_sort_key)
            
    # Write back to exams.json
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(database, f, indent=2)
        
    # Write back to exams_bundle.js
    with open(BUNDLE_PATH, "w", encoding="utf-8") as f:
        f.write("// VectorSelect by Mr. F — AP Physics Assessments Database\n")
        f.write("window.EXAM_DATA = ")
        json.dump(database, f, indent=2)
        f.write(";\n")
        
    print(f"\n==================================================")
    print(f"DONE! Processed 5 Review Exams ({total_added} total question cards)")
    print("Database updated in exams.json and exams_bundle.js")
    print("==================================================")

if __name__ == "__main__":
    main()
