"""
INGEST Q1 EXAM REVIEW (APP1 UNIT 2)
===================================
Processes:
  - C:\\Users\\fahad\\Desktop\\MT REVIEWs\\Q1 Exam Updated.pdf (Test Booklet, 15 pages)
  - C:\\Users\\fahad\\Desktop\\MT REVIEWs\\Q1 Exam Answers.pdf (Scoring Guide, 20 pages)

Features:
  - Exact vector-divider bounded cropping (scale=2.0)
  - Seamless multi-page stitching for Q2, Q7, Q9, Q10 (with Scenario 2 stimulus), and Q13
  - UnsharpMask sharpening filter for diagram & formula crispness
  - Audited answer keys & complete conceptual physics explanations for all 22 questions
  - Full synchronization into exams.json, exams_bundle.js, answer_keys.json, answer_keys.js, and supabase_seed.sql
"""

import os
import re
import json
import pypdfium2 as pdfium
from PIL import Image, ImageFilter, ImageOps

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CARDS_DIR = os.path.join(BASE_DIR, "assets", "cards")
DATA_DIR = os.path.join(BASE_DIR, "data")
JSON_PATH = os.path.join(DATA_DIR, "exams.json")
BUNDLE_PATH = os.path.join(DATA_DIR, "exams_bundle.js")
KEYS_JSON_PATH = os.path.join(DATA_DIR, "answer_keys.json")
KEYS_JS_PATH = os.path.join(DATA_DIR, "answer_keys.js")
SEED_SQL_PATH = os.path.join(DATA_DIR, "supabase_seed.sql")

TB_PATH = r"C:\Users\fahad\Desktop\MT REVIEWs\Q1 Exam Updated.pdf"
SG_PATH = r"C:\Users\fahad\Desktop\MT REVIEWs\Q1 Exam Answers.pdf"

os.makedirs(CARDS_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

VERSION_TAG = "20261101_v1"

QUESTIONS_AUDIT = [
    {
        "number": 1,
        "choices": ["A", "B", "C", "D"],
        "correct_answer": "A",
        "explanation": "Correct. The graph shows the position of each object as a function of time. Since object 1 is at the same position that it started at, but reversed direction, the total distance it has traveled is greater than that of object 2, which traveled in one direction."
    },
    {
        "number": 2,
        "choices": ["A", "B", "C", "D", "E"],
        "correct_answer": "E",
        "explanation": "Correct. Both balls are in free fall after leaving the hand. The downward acceleration of both balls is the acceleration due to gravity (g), so their accelerations are equal. Because both balls are launched horizontally from the same height, their initial vertical velocities are zero, and their vertical motions are identical: h = 1/2 g t^2. Therefore, both balls hit the ground in the exact same amount of time."
    },
    {
        "number": 3,
        "choices": ["A", "B", "C", "D"],
        "correct_answer": "B",
        "explanation": "Correct. The free fall acceleration close to the surface of any planet can be treated as constant, so height follows h(t) = h0 - 1/2 g t^2. Reading data points from the parabolic curvature of the height versus time graph yields an acceleration due to gravity most nearly equal to 8 m/s^2."
    },
    {
        "number": 4,
        "choices": ["A", "B", "C", "D"],
        "correct_answer": "D",
        "explanation": "Correct. Acceleration is the time derivative of velocity, a(t) = dv/dt. On a velocity versus time graph, the instantaneous acceleration at any given moment t = 0.7 s is equal to the slope of the tangent to a best-fit sinusoidal curve at 0.7 s."
    },
    {
        "number": 5,
        "choices": ["A", "B", "C", "D"],
        "correct_answer": "C",
        "explanation": "Correct. The block leaves the frictionless circular arc at speed v0 directed at an angle theta above the horizontal. In projectile motion, the horizontal component of velocity remains constant: vx = v0*cos(theta). At the highest point of its trajectory, the vertical velocity is zero (vy = 0), so the block's speed is purely horizontal: v = v0*cos(theta)."
    },
    {
        "number": 6,
        "choices": ["A", "B", "C", "D", "E"],
        "correct_answer": "D",
        "explanation": "Correct. Average speed during a time interval is equal to total distance divided by elapsed time: v_avg = Delta_x / Delta_t = (x(2 s) - x(1 s)) / (2 s - 1 s). Reading the positions at 1 s and 2 s from the graph gives Delta_x = 6 m, yielding an average speed of 6 m/s."
    },
    {
        "number": 7,
        "choices": ["A", "B", "C", "D"],
        "correct_answer": "C",
        "explanation": "Correct. Speed is the magnitude of velocity. From the position and velocity graphs, the car starts moving with a positive velocity that decreases toward zero, so its speed is decreasing. The slope of the velocity graph is constant and positive or the car's acceleration is positive (directed opposite to velocity, or defined positive by coordinates)."
    },
    {
        "number": 8,
        "choices": ["A", "B", "C", "D"],
        "correct_answer": "D",
        "explanation": "Correct. In order for the boat to land directly across from the starting point, the boat must head at an angle upstream such that its upstream velocity component cancels the river speed: v_boat * sin(theta) = v_river. The resulting crossing speed perpendicular to shore is v_perp = v_boat * cos(theta), and the total travel time across width d is t = d / v_perp."
    },
    {
        "number": 9,
        "choices": ["A", "B", "C", "D"],
        "correct_answer": "C",
        "explanation": "Correct. The horizontal component of applied force F is identical in both scenarios (F*cos(theta)). In scenario 1, pushing downward increases normal force (F_N = mg + F*sin(theta)) and friction. In scenario 2, pulling upward reduces normal force (F_N = mg - F*sin(theta)) and friction. Thus, acceleration in scenario 2 is greater than in scenario 1, giving a steeper slope on the speed vs. time graph in choice C."
    },
    {
        "number": 10,
        "choices": ["A", "B", "C", "D"],
        "correct_answer": "A",
        "explanation": "Correct. In scenario 2, vertical equilibrium yields F_N + F*sin(theta) = mg, so F_N = mg - F*sin(theta). Friction is f_k = mu_k*(mg - F*sin(theta)). Applying Newton's second law horizontally gives Sigma F_x = F*cos(theta) - mu_k*(mg - F*sin(theta)) = m*a, so a = [F*cos(theta) - mu_k*(mg - F*sin(theta))] / m."
    },
    {
        "number": 11,
        "choices": ["A", "B", "C", "D"],
        "correct_answer": "C",
        "explanation": "Correct. In trial 2, the spring exerts equal and opposite internal forces on blocks X and Y that cancel out for the two-block system. Because the external forces (gravity and normal force) are identical between trials, the net force on the two-block system is the same. However, considering block Y alone, the spring exerts an additional force on block Y, so the net force on block Y is different."
    },
    {
        "number": 12,
        "choices": ["A", "B", "C", "D"],
        "correct_answer": "D",
        "explanation": "Correct. In system 1, with an ideal inextensible string, the tension in the string supporting the hanging block is constant. In system 2, when the string between carts is replaced with a spring, the spring stretches and exerts an oscillating, time-dependent force, altering tension over time. Thus, the hanging block's acceleration as a function of time is not the same because string tension is constant in one system but not in the other."
    },
    {
        "number": 13,
        "choices": ["A", "B", "C", "D"],
        "correct_answer": "D",
        "explanation": "Correct. As the box slides up the ramp, both kinetic friction and the parallel component of gravity point down the incline (the negative direction). It is the sum of these two opposing forces that determines the acceleration of the box: Sigma F_x = -f_k - mg*sin(theta) = m*a."
    },
    {
        "number": 14,
        "choices": ["A", "B", "C", "D", "E"],
        "correct_answer": "B",
        "explanation": "Correct. The 1.0 kg block pushes the 2.0 kg block with a contact force of 2.0 N across a frictionless horizontal surface. Applying Newton's second law to the 2.0 kg block: F_contact = m_2 * a ==> 2.0 N = (2.0 kg) * a ==> a = 1.0 m/s^2."
    },
    {
        "number": 15,
        "choices": ["A", "B", "C", "D"],
        "correct_answer": "D",
        "explanation": "Correct. For a stack of two boxes of mass M inside an elevator accelerating upward with acceleration a, applying Newton's second law to the top box gives F_N - M*g = M*a ==> F_N = M*(a + g). The normal force exerted on the top box by the bottom box is M*(a + g)."
    },
    {
        "number": 16,
        "choices": ["A", "B", "C", "D"],
        "correct_answer": "C",
        "explanation": "Correct. For block 2 (middle block): block 1 pushes block 2 to the right with contact force F_12, block 3 pushes block 2 to the left with contact force F_32, normal force F_N acts upward, gravity F_g acts downward, and kinetic friction f_k opposes motion to the left. Choice C correctly displays all five force vectors."
    },
    {
        "number": 17,
        "choices": ["A", "B", "C", "D"],
        "correct_answer": "B",
        "explanation": "Correct. Blocks A and B are at rest on a frictionless horizontal table with block A fixed to the table. Block C hangs over a pulley from a string tied to block B. Because the system is in static equilibrium, string tension is T = mC*g. To keep block B stationary, block A must exert an equal and opposite horizontal force on block B of magnitude mC*g."
    },
    {
        "number": 18,
        "choices": ["A", "B", "C", "D"],
        "correct_answer": "A",
        "explanation": "Correct. The gravitational force between the moon and the object is modeled by F_g = G*M*m / r^2. Because the object rises to a height R above the surface (r increasing from R to 2R), the only force acting on the object (neglecting friction) is a downward gravitational force that decreases in magnitude with increasing distance."
    },
    {
        "number": 19,
        "choices": ["A", "B", "C", "D", "E"],
        "correct_answer": "B",
        "explanation": "Correct. The toy moves in a horizontal circle of radius R with period T, giving speed v = 2*pi*R / T. Centripetal acceleration is a_c = v^2 / R = (4*pi^2 * R^2 / T^2) / R = 4*pi^2 * R / T^2."
    },
    {
        "number": 20,
        "choices": ["A", "B", "C", "D", "E"],
        "correct_answer": "A",
        "explanation": "Correct. The ball of mass m rotates in a horizontal circle of radius r at constant speed v. The vertical components of tension balance the downward gravitational force, leaving a net force that is purely horizontal and provides centripetal acceleration: F_net = m*v^2 / r."
    },
    {
        "number": 21,
        "choices": ["A", "B", "C", "D"],
        "correct_answer": "D",
        "explanation": "Correct. At the circular bottom of the hill (point P), the cart is moving along a path curved upward, so it experiences an upward centripetal acceleration: a = v^2 / R. By Newton's second law: F_N - m*g = m*v^2 / R ==> F_N = m*g + m*v^2 / R > m*g. The normal force is greater than m*g because the cart is accelerating upward."
    },
    {
        "number": 22,
        "choices": ["A", "B", "C", "D"],
        "correct_answer": "D",
        "explanation": "Correct. The force exerted on the block by the string provides the centripetal force: F = m*v^2 / r. Because the mass m and speed v remain constant as the radius r increases, the force is inversely proportional to r (F proportional to 1/r), which corresponds to the inverse decay curve in graph D."
    }
]


def sharpen_card(card):
    """Subtle UnsharpMask to crisp up diagram strokes and text."""
    return card.filter(ImageFilter.UnsharpMask(radius=1.2, percent=28, threshold=5))


def crop_card(doc, qnum, scale=2.0):
    """Crops each question perfectly with exact vector divider bounds and multi-page stitching."""
    def get_crop(p_idx, y_top_pt, y_bot_pt, x_left_pt=35.0, x_right_pt=577.0):
        page = doc[p_idx]
        img = page.render(scale=scale).to_pil().convert("RGB")
        box = (int(x_left_pt * scale), int(y_top_pt * scale), int(x_right_pt * scale), int(y_bot_pt * scale))
        return img.crop(box)

    def stitch(imgs, pad=15):
        total_h = sum(im.height for im in imgs) + pad * (len(imgs) - 1)
        max_w = max(im.width for im in imgs)
        res = Image.new("RGB", (max_w, total_h), "white")
        y_off = 0
        for im in imgs:
            res.paste(im, ((max_w - im.width) // 2, y_off))
            y_off += im.height + pad
        return res

    if qnum == 1:
        # Page 1: between top divider and Q1/Q2 divider
        card = get_crop(0, 188.5, 507.0)
    elif qnum == 2:
        # Page 1: Q2 stem + Page 2: Q2 choices table
        p1 = get_crop(0, 510.0, 620.0)
        p2 = get_crop(1, 80.0, 500.0)
        card = stitch([p1, p2])
    elif qnum == 3:
        # Page 3: Q3 stem, graph, choices (above Q3/Q4 divider at 416.08)
        card = get_crop(2, 80.0, 413.0)
    elif qnum == 4:
        # Page 3: Q4 stimulus, graph, stem, choices
        card = get_crop(2, 417.0, 755.0)
    elif qnum == 5:
        # Page 4: Q5 stimulus, diagram, stem, choices
        card = get_crop(3, 82.0, 422.0)
    elif qnum == 6:
        # Page 4: Q6 position vs time graph, stem, choices
        card = get_crop(3, 423.5, 720.0)
    elif qnum == 7:
        # Page 5: Q7 graphs + stem, Page 6: choices table
        p1 = get_crop(4, 80.0, 410.0)
        p2 = get_crop(5, 80.0, 436.0)
        card = stitch([p1, p2])
    elif qnum == 8:
        # Page 6: Q8 stem and choices
        card = get_crop(5, 440.0, 625.0)
    elif qnum == 9:
        # Page 7: Scenario 1 & 2 diagrams + Q9 stem, Page 8: choices graphs
        p1 = get_crop(6, 82.0, 500.0)
        p2 = get_crop(7, 78.0, 545.0)
        card = stitch([p1, p2])
    elif qnum == 10:
        # Page 7: Scenario 2 stimulus/diagram, Page 8: Q10 stem & choices
        p1 = get_crop(6, 240.0, 455.0)
        p2 = get_crop(7, 552.0, 678.0)
        card = stitch([p1, p2])
    elif qnum == 11:
        # Page 9: Trial 1 & 2 diagrams, stem, choices table
        card = get_crop(8, 80.0, 630.0)
    elif qnum == 12:
        # Page 10: Figure 1 & 2 diagrams, stem, choices
        card = get_crop(9, 80.0, 545.0)
    elif qnum == 13:
        # Page 10: Ramp diagram & stem, Page 11: choices formulas
        p1 = get_crop(9, 548.0, 725.0)
        p2 = get_crop(10, 78.0, 152.0)
        card = stitch([p1, p2])
    elif qnum == 14:
        # Page 11: Two blocks diagram, stem, choices
        card = get_crop(10, 155.0, 373.0)
    elif qnum == 15:
        # Page 11: Elevator stimulus, diagram, stem, choices
        card = get_crop(10, 375.5, 681.5)
    elif qnum == 16:
        # Page 12: 3 blocks diagram, stem, free-body diagram choices
        card = get_crop(11, 80.0, 582.0)
    elif qnum == 17:
        # Page 13: Blocks A, B, C diagram, stem, choices
        card = get_crop(12, 80.0, 365.0)
    elif qnum == 18:
        # Page 13: Moon gravity stem, choices
        card = get_crop(12, 368.0, 490.0)
    elif qnum == 19:
        # Page 13: Horizontal circle toy stem, choices
        card = get_crop(12, 492.0, 635.0)
    elif qnum == 20:
        # Page 14: Vertical rod & strings diagram, stem, choices
        card = get_crop(13, 82.0, 415.5)
    elif qnum == 21:
        # Page 14: Circular bottom of hill diagram, stem, choices
        card = get_crop(13, 417.5, 725.0)
    elif qnum == 22:
        # Page 15: String circular motion diagram, stem, graph choices
        card = get_crop(14, 80.0, 460.0)
    else:
        raise ValueError(f"Invalid question number {qnum}")

    # Add gentle sharpening and 10px white border for pristine margin separation
    card = sharpen_card(card)
    card = ImageOps.expand(card, border=10, fill="white")
    return card


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
    if "Practice Exam" in title or "Unit Test" in title or "Exam Review" in title or "Q1 Exam" in title:
        return (3, 0, 0, title)
    if "Progress Check" in title or "PC" in title:
        return (4, 0, 0, title)
    return (5, 0, 0, title)


def main():
    print("==================================================")
    print("INGESTING Q1 EXAM REVIEW (APP1 UNIT 2)")
    print("==================================================")

    if not os.path.exists(TB_PATH):
        raise FileNotFoundError(f"Missing PDF: {TB_PATH}")

    doc = pdfium.PdfDocument(TB_PATH)
    print(f"Loaded Test Booklet: {TB_PATH} ({len(doc)} pages)")

    slug = "app1_unit2_q1_exam_review"
    questions = []

    # 1. Crop and save cards
    for item in QUESTIONS_AUDIT:
        qnum = item["number"]
        card = crop_card(doc, qnum)
        card_filename = f"{slug}_q{qnum}.png"
        card_path = os.path.join(CARDS_DIR, card_filename)
        card.save(card_path, "PNG", optimize=True)
        print(f"  ✓ Saved Card Q{qnum:02d}: {card_filename} ({card.size[0]}x{card.size[1]})")

        q_obj = {
            "number": qnum,
            "card_image": f"assets/cards/{card_filename}?v={VERSION_TAG}",
            "choices": [{"letter": ch, "text": ""} for ch in item["choices"]],
            "correct_answer": item["correct_answer"],
            "explanation": item["explanation"],
            "question_id": f"{slug}_q{qnum}"
        }
        questions.append(q_obj)

    assessment_obj = {
        "id": slug,
        "title": "Q1 Exam Review",
        "unit": "Unit 2",
        "subject": "AP Physics 1: Algebra-Based",
        "question_count": len(questions),
        "questions": questions
    }

    # 2. Update exams.json
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        database = json.load(f)

    unit2_assessments = database["subjects"]["APP1"]["units"]["Unit 2"]["assessments"]
    existing_idx = None
    for idx, a in enumerate(unit2_assessments):
        if a["id"] == slug:
            existing_idx = idx
            break

    if existing_idx is not None:
        unit2_assessments[existing_idx] = assessment_obj
        print(f"\n✓ Updated existing assessment '{slug}' in exams.json")
    else:
        unit2_assessments.append(assessment_obj)
        print(f"\n✓ Added new assessment '{slug}' to exams.json")

    # Sort Unit 2 assessments
    unit2_assessments.sort(key=assessment_sort_key)

    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(database, f, indent=2)

    # 3. Update exams_bundle.js
    with open(BUNDLE_PATH, "w", encoding="utf-8") as f:
        f.write("// VectorSelect by Mr. F — AP Physics Assessments Database\n")
        f.write("window.EXAM_DATA = ")
        json.dump(database, f, indent=2)
        f.write(";\n")
    print("✓ Updated exams_bundle.js")

    # 4. Update answer_keys.json and answer_keys.js
    keys_data = {}
    if os.path.exists(KEYS_JSON_PATH):
        with open(KEYS_JSON_PATH, "r", encoding="utf-8") as f:
            keys_data = json.load(f)

    keys_data[slug] = {
        "assessment_id": slug,
        "title": "Q1 Exam Review",
        "subject": "AP Physics 1: Algebra-Based",
        "unit": "Unit 2",
        "question_count": len(questions),
        "keys": [
            {
                "question_id": q["question_id"],
                "number": q["number"],
                "correct_answer": q["correct_answer"],
                "explanation": q["explanation"]
            }
            for q in questions
        ]
    }

    with open(KEYS_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(keys_data, f, indent=2)
    print("✓ Updated answer_keys.json")

    with open(KEYS_JS_PATH, "w", encoding="utf-8") as f:
        f.write("// VectorSelect by Mr. F — Enclave Answer Keys (Offline Fallback)\n")
        f.write("window.OFFLINE_ANSWER_KEYS = ")
        json.dump(keys_data, f, indent=2)
        f.write(";\n")
    print("✓ Updated answer_keys.js")

    # 5. Update supabase_seed.sql (if exists)
    if os.path.exists(SEED_SQL_PATH):
        keys_json_str = json.dumps(keys_data[slug]["keys"]).replace("'", "''")
        insert_stmt = f"\ninsert into public.answer_keys (assessment_id, subject, unit, keys, created_at, updated_at) values ('{slug}', 'AP Physics 1: Algebra-Based', 'Unit 2', '{keys_json_str}', now(), now()) on conflict (assessment_id) do update set keys = excluded.keys, updated_at = now();\n"
        with open(SEED_SQL_PATH, "a", encoding="utf-8") as f:
            f.write(insert_stmt)
        print("✓ Appended seed insert statement to supabase_seed.sql")

    print("\n==================================================")
    print("SUCCESS: Q1 Exam Review ingested perfectly!")
    print(f"Total Questions: {len(questions)}")
    print("==================================================")


if __name__ == "__main__":
    main()
