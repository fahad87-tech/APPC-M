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

ENHANCEMENTS = {
    ("app1_unit2_midterm_review_1", 1): {
        "bbox": (7, 7, 681, 191),
        "target_w": 650,
        "text_split_y": 158,
    },
    ("app1_unit2_midterm_review_1", 3): {
        "bbox": (488, 28, 1245, 286),
        "target_w": 750,
        "text_split_y": 220,
    },
    ("app1_unit2_midterm_review_1", 4): {
        "bbox": (480, 90, 1240, 350),
        "target_w": 750,
        "text_split_y": 150,
    },
    ("app1_unit2_midterm_review_1", 6): {
        "bbox": (48, 32, 1021, 325),
        "target_w": 750,
        "text_split_y": 178,
    },
    ("app1_unit2_midterm_review_1", 7): {
        "bbox": (58, 18, 752, 268),
        "target_w": 750,
        "text_split_y": 193,
    },
    ("app1_unit2_midterm_review_1", 9): {
        "bbox": (8, 11, 790, 314),
        "target_w": 700,
        "text_split_y": 203,
    },
    ("app1_unit2_midterm_review_2", 2): {
        "bbox": (17, 47, 1049, 229),
        "target_w": 850,
        "text_split_y": 142,
    },
    ("app1_unit2_midterm_review_2", 10): {
        "bbox": (34, 11, 735, 355),
        "target_w": 700,
        "text_split_y": 239,
    },
    ("app1_unit1_midterm_review", 1): {
        "bbox": (12, 10, 873, 470),
        "target_w": 700,
        "text_split_y": 240,
    },
    ("app1_unit1_midterm_review", 3): {
        "bbox": (4, 13, 922, 125),
        "target_w": 850,
        "text_split_y": 96,
    },
    ("app1_unit1_midterm_review", 6): {
        "bbox": (18, 5, 976, 476),
        "target_w": 700,
        "text_split_y": 225,
    },
    ("app1_unit1_midterm_review", 8): {
        "bbox": (1, 25, 986, 479),
        "target_w": 700,
        "text_split_y": 225,
    },
    ("app1_unit1_midterm_review", 11): {
        "bbox": (3, 24, 611, 275),
        "target_w": 650,
        "text_split_y": 210,
    },
    ("appc_unit1_midterm_review", 1): {
        "bbox": (0, 20, 1428, 668),
        "target_w": 750,
        "text_split_y": 220,
    },
    ("appc_unit1_midterm_review", 3): {
        "bbox": (217, 32, 1289, 165),
        "target_w": 850,
        "text_split_y": 86,
    },
    ("appc_unit1_midterm_review", 6): {
        "bbox": (88, 4, 559, 71),
        "target_w": 700,
        "text_split_y": 90,
    },
    ("appc_unit1_midterm_review", 11): {
        "bbox": (52, 12, 1123, 454),
        "target_w": 750,
        "text_split_y": 191,
    },
    ("appc_unit1_midterm_review", 13): {
        "bbox": (22, 10, 1092, 615),
        "target_w": 700,
        "text_split_y": 246,
    },
    ("appc_unit1_midterm_review", 18): {
        "bbox": (59, 19, 1131, 221),
        "target_w": 800,
        "text_split_y": 116,
    },
}

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
                crop_bottom = next_top - 10.0
            else:
                # Last question on this page: find bottom of all text characters & images above footer
                max_y = crop_top + 50.0
                for c in range(len(text)):
                    if not text[c].isspace():
                        c_box = tp.get_charbox(c)
                        c_bot = h - c_box[1]
                        c_top = h - c_box[3]
                        if c_top >= crop_top - 5.0 and c_bot < 762.0:
                            if c_bot > max_y:
                                max_y = c_bot

                for obj in page.get_objects():
                    if obj.type == pdfium.raw.FPDF_PAGEOBJ_IMAGE:
                        l, b, r, t = obj.get_bounds()
                        obj_bot = h - b
                        obj_top = h - t
                        if obj_top >= crop_top - 5.0 and obj_bot < 762.0:
                            if obj_bot > max_y:
                                max_y = obj_bot

                crop_bottom = min(h - 22.0, max_y + 16.0)
                    
            # Crop image
            x0 = int(22 * scale)
            x1 = int((w - 22) * scale)
            y0 = int(crop_top * scale)
            y1 = int(crop_bottom * scale)
            
            # Ensure valid box
            if y1 > y0 + 10:
                card_filename = f"{slug}_q{qnum}.png"
                card_rel_path = f"assets/cards/{card_filename}?v=20261029_v5"
                card_abs_path = os.path.join(CARDS_DIR, card_filename)

                # Special enhancement for Q13 in APPC Unit 2 Midterm Review (tiny embedded image stem)
                if slug == "appc_unit2_midterm_review" and qnum == 13:
                    base_q13 = page_img.crop((x0, y0, x1, y1))
                    native_img = None
                    for obj in page.get_objects():
                        if obj.type == pdfium.raw.FPDF_PAGEOBJ_IMAGE:
                            l, b, r, t = obj.get_bounds()
                            if t < 300: # Q13 image
                                native_img = obj.get_bitmap().to_pil()
                                break
                    if native_img:
                        target_w = 980
                        target_h = int(native_img.height * (target_w / native_img.width))
                        scaled_prompt = native_img.resize((target_w, target_h), Image.Resampling.LANCZOS)
                        new_card_h = base_q13.height + (target_h - 28) + 15
                        enhanced_card = Image.new("RGB", (base_q13.width, new_card_h), (255, 255, 255))
                        num_crop = base_q13.crop((0, 0, 102, 60))
                        enhanced_card.paste(num_crop, (0, 0))
                        enhanced_card.paste(scaled_prompt, (110, 16))
                        choices_crop = base_q13.crop((0, int(45 * scale), base_q13.width, base_q13.height))
                        enhanced_card.paste(choices_crop, (0, 16 + target_h + 15))
                        enhanced_card.save(card_abs_path, optimize=True)
                    else:
                        cropped = page_img.crop((x0, y0, x1, y1))
                        cropped.save(card_abs_path, optimize=True)
                elif slug == "app1_unit2_midterm_review_2" and qnum == 6:
                    # Clean mask for duplicate bottom choices text in Q6
                    from PIL import ImageDraw
                    base_card = page_img.crop((x0, y0, x1, y1))
                    draw = ImageDraw.Draw(base_card)
                    draw.rectangle([0, 805, 550, base_card.height], fill=(255, 255, 255))
                    clean_card = base_card.crop((0, 0, base_card.width, 838))
                    clean_card.save(card_abs_path, optimize=True)
                elif (slug, qnum) in ENHANCEMENTS:
                    cfg = ENHANCEMENTS[(slug, qnum)]
                    base_card = page_img.crop((x0, y0, x1, y1))
                    native_img = None
                    for obj in page.get_objects():
                        if obj.type == pdfium.raw.FPDF_PAGEOBJ_IMAGE:
                            l, b, r, t = obj.get_bounds()
                            obj_top = h - t
                            obj_bot = h - b
                            if obj_top >= crop_top - 5.0 and obj_bot <= crop_bottom + 5.0:
                                if (r - l > 150) and (l < 100):
                                    native_img = obj.get_bitmap().to_pil()
                                    break
                    if native_img:
                        diag_crop = native_img.crop(cfg["bbox"])
                        target_w = cfg["target_w"]
                        target_h = int(diag_crop.height * (target_w / diag_crop.width))
                        scaled_diag = diag_crop.resize((target_w, target_h), Image.Resampling.LANCZOS)
                        
                        text_and_choices = base_card.crop((0, cfg["text_split_y"], base_card.width, base_card.height))
                        if slug == "appc_unit1_midterm_review" and qnum == 1:
                            text_and_choices = text_and_choices.crop((0, 0, text_and_choices.width, 515))

                        num_crop = base_card.crop((0, 0, 102, 45))
                        
                        pad = 16
                        new_h = 45 + pad + target_h + pad + text_and_choices.height
                        enhanced_card = Image.new("RGB", (base_card.width, new_h), (255, 255, 255))
                        enhanced_card.paste(num_crop, (0, 0))
                        diag_x = (base_card.width - target_w) // 2
                        enhanced_card.paste(scaled_diag, (diag_x, 45 + pad))
                        enhanced_card.paste(text_and_choices, (0, 45 + pad + target_h + pad))
                        enhanced_card.save(card_abs_path, optimize=True)
                    else:
                        cropped = page_img.crop((x0, y0, x1, y1))
                        cropped.save(card_abs_path, optimize=True)
                else:
                    cropped = page_img.crop((x0, y0, x1, y1))
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
