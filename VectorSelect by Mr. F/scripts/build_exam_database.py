import os
import re
import json
import asyncio
import pypdfium2 as pdfium
from PIL import Image, ImageFilter

WEB_APP_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INPUT_DIR = os.path.join(WEB_APP_DIR, "input pdf")
ASSETS_DIR = os.path.join(WEB_APP_DIR, "assets")
CARDS_DIR = os.path.join(ASSETS_DIR, "cards")
DATA_DIR = os.path.join(WEB_APP_DIR, "data")

os.makedirs(ASSETS_DIR, exist_ok=True)
os.makedirs(CARDS_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

# Question heading: an integer at line start followed by a period.
#
# The original pattern was r'(?:^|\n)\s*(\d+)\.\s+([^\n]+)', which required real
# text after the number on the same line. College Board scoring guides and test
# booklets frequently render the heading as a bare "3." with the stem starting
# on the next line, so those questions were never detected and no card was ever
# cropped for them. Capturing only the number and requiring it to be
# line-initial accepts both layouts.
#
# The (?!\d) guard rejects decimals. Without it a wrapped line such as
# "1.5 m/s. A short time later..." reads as heading "1", which truncated the
# preceding question's crop to a few pixels tall.
QHEADING = re.compile(r'(?:^|\n)\s{0,10}(\d{1,2})\s?\.(?!\d)')
ANSWER_PY = re.compile(r'Answer\s+([A-D])\b')
CHOICE_MARK = re.compile(r'\([A-D]\)')

# College Board export suffixes. A freshly exported scoring guide is named
#   SG_4.1-20261002-141606-fe7fc404-d7a4-4917-8dcd-ea3f38e50f24.pdf
# while its matching test booklet shares everything after the "TB_" swap:
#   TB_4.1-20261002-141555-ad5e0b86-7e7e-4351-aed2-c68ad8d0942e.pdf
# Note the timestamps differ, so pairing must fall back to the stable section
# token ("4.1", "Unit4ProgressCheckMCQ") rather than the full filename.
EXPORT_SUFFIX = re.compile(
    r'-\d{8}-\d{6}-[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}'
    r'-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\.pdf$'
)


def tb_prefix_for(sg_filename):
    """
    Return the test-booklet prefix that pairs with this scoring guide.

    Older exports are named SG_1_<id>.pdf / TB_1_<id>.pdf, so the section token
    ends at the first underscore. Newer exports name sections with a dot and
    carry a timestamp/UUID suffix:

        SG_1_6804f0ab...pdf              -> TB_1
        SG_4.1-2026...pdf               -> TB_4.1
        SG_4.10-2026...pdf              -> TB_4.10
        SG_Unit4ProgressCheckMCQ-...pdf -> TB_Unit4ProgressCheckMCQ

    The dot is only a section separator when a digit follows it, which keeps
    "4.1" intact while still stopping at the timestamp separator.
    """
    stem = EXPORT_SUFFIX.sub('', sg_filename)[3:]
    if '_' in stem:
        token = stem.split('_', 1)[0]
    else:
        token = re.split(r'\.(?!\d)', stem, maxsplit=1)[0]
    return 'TB_' + token

APP1_TITLES = {
    'Unit 1': {
        '1.1': '1.1: Scalars and Vectors in One Dimension',
        '1.2': '1.2: Displacement, Velocity, and Acceleration',
        '1.3': '1.3: Representing Motion (Graphs & Kinematics)',
        '1.4': '1.4: Reference Frames and Relative Motion',
        '1.5': '1.5: Vectors and Motion in Two Dimensions',
        'PC': 'Unit 1 Progress Check: MCQ',
        'Test': 'Unit 1 Practice Exam: MCQ'
    },
    'Unit 2': {
        '2.1': '2.1: Systems and Center of Mass',
        '2.2': '2.2: Forces and Free-Body Diagrams',
        '2.3': '2.3: Newton\'s Third Law',
        '2.4': '2.4: Newton\'s First Law and Inertia',
        '2.5': '2.5: Newton\'s Second Law',
        '2.6': '2.6: Gravitational Force and Weight',
        '2.7': '2.7: Kinetic and Static Friction',
        '2.8': '2.8: Spring Forces and Hooke\'s Law',
        '2.9': '2.9: Circular Motion and Centripetal Force',
        'PC': 'Unit 2 Progress Check: MCQ'
    },
    'Unit 3 A': {
        '4.1': '3.1: Work and Kinetic Energy',
        '4.2': '3.2: Work-Energy Theorem',
        '4.3': '3.3: Gravitational Potential Energy',
        '4.4': '3.4: Conservation of Mechanical Energy',
        '4.5': '3.5: Power and Energy Transformations',
        'PC': 'Unit 3 Progress Check: MCQ'
    },
    'Unit 4': {
        '4.1': '4.1: Momentum and Impulse',
        '4.2': '4.2: Impulse and Momentum Conservation',
        '4.3': '4.3: Systems of Variable Mass',
        '4.4': '4.4: Collisions in 1D and 2D',
        'PC': 'Unit 4 Progress Check: MCQ'
    },
    'Unit 5': {
        'ConnectingLinearandRotationalMotion': '5.1: Connecting Linear and Rotational Motion',
        'RotationalKinematics': '5.2: Rotational Kinematics',
        'Torque': '5.3: Torque Calculations and Vector Forces',
        'RotationalInertia': '5.4: Rotational Inertia',
        'RotationalEquilibriumandNewtonsFirstLawinRotationalForm': '5.5: Rotational Equilibrium & Newton\'s 1st Law',
        'NewtonsSecondLawinRotationalForm': '5.6: Newton\'s 2nd Law in Rotational Form',
        'PC': 'Unit 5 Progress Check: MCQ'
    },
    'Unit 6': {
        '1': '6.1: Rotational Kinetic Energy',
        '2': '6.2: Angular Momentum and Torque',
        '3': '6.3: Conservation of Angular Momentum',
        '5': '6.4: Rolling Motion without Slipping',
        '6': '6.5: Gravitation and Orbital Dynamics',
        'PC': 'Unit 6 Progress Check: MCQ'
    },
    'Unit 7': {
        '1': '7.1: Restoring Forces and Simple Harmonic Motion',
        '2': '7.2: Mass-Spring Oscillators',
        '3': '7.3: Kinematics of Simple Harmonic Motion',
        '4': '7.4: Simple Pendulums and Period',
        'PC': 'Unit 7 Progress Check: MCQ'
    },
    'Unit 8': {
        '1': '8.1: Internal Structure, Density, and Pressure',
        '2': '8.2: Pressure and Depth in Static Fluids',
        '3': '8.3: Buoyant Force and Archimedes\' Principle',
        '4': '8.4: Fluid Dynamics and Continuity Equation',
        'PC': 'Unit 8 Progress Check: MCQ'
    }
}

APPC_TITLES = {
    'Unit 1': {
        '1.1': '1.1: Kinematics in 1D (Vectors & Calculus)',
        '1.2': '1.2: Motion with Constant Acceleration',
        '1.3': '1.3: Motion with Variable Acceleration',
        '1.4': '1.4: Relative Motion and Reference Frames',
        '1.5': '1.5: 2D Kinematics and Projectiles',
        'PC': 'Unit 1 Progress Check: MCQ',
        'Test': 'Unit 1 Practice Exam: MCQ'
    },
    'Unit 2': {
        '2.1': '2.1: Systems and Center of Mass',
        '2.2': '2.2: Free-Body Diagrams and Equilibrium',
        '2.3': '2.3: Newton\'s Second Law (Differential Equations)',
        '2.4': '2.4: Newton\'s Third Law',
        '2.5': '2.5: Friction (Kinetic and Static)',
        '2.6': '2.6: Drag Forces and Terminal Velocity',
        '2.7': '2.7: Gravitational Force',
        '2.8': '2.8: Spring Forces and Restoring Forces',
        '2.9': '2.9: Circular Motion Dynamics',
        '2.10': '2.10: Variable Forces and Applications',
        'PC': 'Unit 2 Progress Check: MCQ'
    },
    'Unit 3': {
        '3.1': '3.1: Work Done by a Variable Force',
        '3.2': '3.2: Kinetic Energy and Work-Energy Theorem',
        '3.3': '3.3: Potential Energy and Conservative Forces',
        '3.4': '3.4: Conservation of Mechanical Energy',
        '3.5': '3.5: Power',
        'PC': 'Unit 3 Progress Check: MCQ'
    },
    'unit 4': {
        '1': '4.1: Momentum and Impulse',
        '2': '4.2: Impulse and Momentum Conservation',
        '3': '4.3: Systems of Variable Mass',
        '4': '4.4: Collisions in 1D and 2D',
        '4.1': '4.1: Momentum and Impulse',
        '4.2': '4.2: Impulse and Momentum Conservation',
        '4.3': '4.3: Systems of Variable Mass',
        '4.4': '4.4: Collisions in 1D and 2D',
        'PC': 'Unit 4 Progress Check: MCQ',
        'Test': 'Unit 4 Practice Exam: MCQ'
    },
    'Unit 4': {
        '1': '4.1: Momentum and Impulse',
        '2': '4.2: Impulse and Momentum Conservation',
        '3': '4.3: Systems of Variable Mass',
        '4': '4.4: Collisions in 1D and 2D',
        '4.1': '4.1: Momentum and Impulse',
        '4.2': '4.2: Impulse and Momentum Conservation',
        '4.3': '4.3: Systems of Variable Mass',
        '4.4': '4.4: Collisions in 1D and 2D',
        'PC': 'Unit 4 Progress Check: MCQ',
        'Test': 'Unit 4 Practice Exam: MCQ'
    },
    'Unit 5': {
        '1': '5.1: Rotational Kinematics (Angular Acceleration)',
        '2': '5.2: Connecting Linear and Rotational Quantities',
        '3': '5.3: Torque Calculation & Vector Cross Products',
        '4': '5.4: Rotational Inertia (Calculus & Parallel Axis)',
        '5': '5.5: Rotational Dynamics & Newton\'s 2nd Law',
        '6': '5.6: Combined Translation and Rotation',
        'PC': 'Unit 5 Progress Check: MCQ'
    },
    'Unit 6': {
        '1': '6.1: Rotational Kinetic Energy',
        '2': '6.2: Rolling Motion & Energy Conservation',
        '3': '6.3: Angular Momentum of Particles and Rigid Bodies',
        '4': '6.4: Conservation of Angular Momentum',
        '5': '6.5: Angular Impulse',
        '6': '6.6: Planetary Orbits and Kepler\'s Laws',
        'PC': 'Unit 6 Progress Check: MCQ'
    },
    'Unit 7': {
        '1': '7.1: Simple Harmonic Motion Foundations',
        '2': '7.2: Mass-Spring Systems & Differential Equations',
        '3': '7.3: Simple Pendulums',
        '4': '7.4: Physical Pendulums & Torsion Pendulums',
        '5': '7.5: Energy in Simple Harmonic Motion',
        'PC': 'Unit 7 Progress Check: MCQ'
    }
}

def unit_folder_sort_key(d):
    m = re.search(r'(\d+)', d)
    return int(m.group(1)) if m else 999

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

def resolve_title(course, unit, fname, headers):
    lookup = APP1_TITLES.get(unit, {}) if course == 'APP1' else (APPC_TITLES.get(unit) or APPC_TITLES.get(unit.lower(), {}) or APPC_TITLES.get(unit.title(), {}))
    
    # 1. Progress Check
    if 'ProgressCheckMCQ' in fname or 'PC-MCQ' in fname or 'PC - MCQ' in fname or fname == 'PC.pdf' or 'MCQ PC' in fname or 'MCQs.pdf' in fname:
        norm_unit = unit.replace(' A', '').title()
        return lookup.get('PC', f'{norm_unit} Progress Check: MCQ')
        
    # 2. Test
    if re.search(r'test', fname, re.IGNORECASE):
        norm_unit = unit.replace(' A', '').title()
        return lookup.get('Test', f'{norm_unit} Practice Exam: MCQ')
        
    # 3. Section number e.g. 1.1, 2.3
    m = re.search(r'(\d+\.\d+)', fname)
    if m and m.group(1) in lookup:
        return lookup[m.group(1)]
        
    # 4. SG_xx_
    m2 = re.search(r'SG_(\d+)_', fname)
    if m2:
        sec = m2.group(1)
        if len(sec) == 2 and f'{sec[0]}.{sec[1]}' in lookup:
            return lookup[f'{sec[0]}.{sec[1]}']
        elif len(sec) == 3 and f'{sec[0]}.{sec[1:]}' in lookup:
            return lookup[f'{sec[0]}.{sec[1:]}']
        elif sec in lookup:
            return lookup[sec]
            
    # 5. Named quiz
    for k, v in lookup.items():
        if k in fname:
            return v
            
    # 6. Headers
    for h in headers:
        if 'Quiz' in h or 'Test' in h or 'Progress Check' in h:
            clean_h = re.sub(r'AP PHYSICS \w+ (?:Scoring Guide|Test Booklet)', '', h).strip()
            if clean_h:
                return clean_h

    clean_name = fname.replace('.pdf', '').replace('Answers', 'Quiz').replace('SG_', '')
    return clean_name

def clean_text(text):
    if not text:
        return ""
    text = re.sub(r'AP PHYSICS \d+ (?:Test Booklet|Scoring Guide)[\s\S]*?(?:Page \d+ of \d+ AP Physics \d+|AP Physics \d+ Page \d+ of \d+)', '', text, flags=re.IGNORECASE)
    text = re.sub(r'(?:Test Booklet|Scoring Guide)\s+[\d\.]+\s+Page \d+ of \d+ AP Physics \d+', '', text, flags=re.IGNORECASE)
    text = re.sub(r'AP Physics \d+ Page \d+ of \d+', '', text, flags=re.IGNORECASE)
    return text.strip()

def extract_sg_answers_and_rationales(doc):
    """
    Extracts official answer letter (A-D) and explanation/rationale for every question from an SG document.
    """
    full_text = "\n".join(p.get_textpage().get_text_range() for p in doc)
    
    q_blocks = re.split(r'\n(?=\d+\.\s)', full_text)
    if len(q_blocks) <= 1:
        q_blocks = re.split(r'(?:^|\n)(?=\d+\.\s)', full_text)
        
    ans_data = {}
    for b in q_blocks:
        b = b.strip()
        m_num = re.match(r'^(\d+)\.\s*([\s\S]*)', b)
        if not m_num:
            continue
        qnum = int(m_num.group(1))
        content = m_num.group(2)
        
        m_ans = re.search(r'Answer\s+([A-D])\b', content, re.IGNORECASE)
        ans_letter = m_ans.group(1).upper() if m_ans else ""
        
        explanation = ""
        if m_ans:
            raw_exp = content[m_ans.end():].strip()
            lines = [l.strip() for l in raw_exp.split('\n') if not re.match(r'^(?:AP PHYSICS|Test Booklet|Scoring Guide|Page \d+)', l, re.I)]
            explanation = "\n".join(lines).strip()
            explanation = re.split(r'\n\s*\d+\.\s', explanation)[0].strip()
            
        ans_data[qnum] = {
            'correct_answer': ans_letter,
            'explanation': clean_text(explanation)
        }
    return ans_data

def sharpen_card(card):
    """Apply a very subtle UnsharpMask to crisp up text strokes and diagram lines.
    Kept deliberately gentle (radius=1.2, percent=28, threshold=5) so the
    enhancement reads as natural print sharpness rather than digital crunch.
    threshold=5 skips near-uniform regions (white bg, solid fills) entirely."""
    return card.filter(ImageFilter.UnsharpMask(radius=1.2, percent=28, threshold=5))

def crop_tb_questions(doc, quiz_slug):
    """
    Crops clean question cards from a Test Booklet (TB) PDF.
    Handles single-page questions and multi-page spanning questions.
    Guarantees 0 answers, 0 rationales, and 100% complete formulas/diagrams.
    """
    scale = 2.0
    header_margin = 65.0
    footer_margin = 25.0
    
    pages_data = []
    for p_idx, page in enumerate(doc):
        tp = page.get_textpage()
        text = tp.get_text_range()
        w, h = page.get_size()
        
        q_matches = []
        for m in QHEADING.finditer(text):
            qnum = int(m.group(1))
            char_idx = m.start(1)
            cbox = tp.get_charbox(char_idx)
            top_y = h - cbox[3]
            if top_y > header_margin:
                q_matches.append({'qnum': qnum, 'top_y': top_y, 'pos': m.start(0)})

        q_matches.sort(key=lambda x: x['top_y'])

        # Shared-stimulus layout: some items print the stimulus paragraph ABOVE
        # the numbered heading, e.g.
        #     A 500 g cart moves to the right with a kinetic energy of 0.14 J ...
        #     17. What is the kinetic energy of the cart after the collision?
        # A crop anchored at the "17." keeps the question and its four choices
        # but silently drops the stimulus. Record the top of the unclaimed
        # paragraph so the crop can be extended upward to include it.
        stimulus_top = {}
        if q_matches:
            choice_marks = []
            for cm in CHOICE_MARK.finditer(text):
                try:
                    cbox = tp.get_charbox(cm.start(0))
                except Exception:
                    continue
                choice_marks.append({'top_y': h - cbox[3], 'pos': cm.start(0)})
            choice_marks.sort(key=lambda x: x['top_y'])

            for i, q in enumerate(q_matches):
                if i == 0:
                    continue
                prev_q = q_matches[i - 1]
                between = [c for c in choice_marks
                           if prev_q['top_y'] < c['top_y'] < q['top_y']]
                if not between:
                    continue
                last_choice = between[-1]
                # Split the unclaimed region into rendered lines. The first line
                # still belongs to the previous choice's text, so a stimulus can
                # only start at line 1 or later, and only when the line above it
                # ended a complete sentence.
                gap_lines = [ln.strip() for ln in
                             text[last_choice['pos']:q['pos']].split('\n')]
                gap_lines = [ln for ln in gap_lines if ln]
                if len(gap_lines) < 2:
                    continue
                start_line = None
                for li in range(1, len(gap_lines)):
                    above = gap_lines[li - 1]
                    if not re.search(r'[.?!][\'")\]]?$', above):
                        continue
                    tail = re.sub(r'\s+', ' ', ' '.join(gap_lines[li:])).strip()
                    tail = re.sub(r'^\([A-D]\)', '', tail).strip()
                    sentences = [s for s in re.split(r'(?<=[.?!])\s+', tail)
                                 if len(s.split()) >= 4]
                    if len(sentences) >= 3:
                        start_line = li
                        break
                if start_line is None:
                    continue
                first_word = gap_lines[start_line].split()[0]
                # Locate the stimulus by character offset rather than a search
                # box: pypdfium2 builds vary in whether they expose
                # get_textbox(), while get_charbox() is always available.
                stim_char = text.find(first_word, last_choice['pos'], q['pos'])
                if stim_char < 0:
                    continue
                try:
                    fw_box = tp.get_charbox(stim_char)
                except Exception:
                    continue
                stim_y = h - fw_box[3]
                if last_choice['top_y'] < stim_y < q['top_y']:
                    stimulus_top[q['qnum']] = stim_y

        # Calculate meaningful content bottom
        n_chars = tp.count_chars()
        max_y = header_margin + 50.0
        for ci in range(max(0, n_chars - 300), n_chars):
            cbox = tp.get_charbox(ci)
            cy = h - cbox[1]
            if cy > max_y and cy < h - 15:
                max_y = cy
        content_bottom = min(h - footer_margin, max_y + 15.0)
        
        pages_data.append({
            'p_idx': p_idx,
            'w': w,
            'h': h,
            'qs': q_matches,
            'text': text,
            'stimulus_top': stimulus_top,
            'content_bottom': content_bottom
        })
        
    all_q_nums = []
    for pd in pages_data:
        for q in pd['qs']:
            if q['qnum'] not in all_q_nums:
                all_q_nums.append(q['qnum'])
    all_q_nums.sort()
    
    card_paths = {}
    for idx, qnum in enumerate(all_q_nums):
        start_pd = None
        start_q_obj = None
        for pd in pages_data:
            match = [q for q in pd['qs'] if q['qnum'] == qnum]
            if match:
                start_pd = pd
                start_q_obj = match[0]
                break
        if not start_pd:
            continue
            
        p_idx = start_pd['p_idx']
        # Extend upward to capture a shared stimulus printed above the heading.
        top_y = max(header_margin, start_q_obj['top_y'] - 8.0)
        stim_y = start_pd.get('stimulus_top', {}).get(qnum)
        if stim_y is not None:
            top_y = max(header_margin, min(top_y, stim_y - 8.0))
        segments = []
        
        same_page_next = [q for q in start_pd['qs'] if q['top_y'] > start_q_obj['top_y']]
        if same_page_next:
            bottom_y = same_page_next[0]['top_y'] - 6.0
            segments.append({'p_idx': p_idx, 'top_y': top_y, 'bottom_y': bottom_y})
        else:
            bottom_y = min(start_pd['h'] - footer_margin, start_pd['content_bottom'] + 10.0)
            segments.append({'p_idx': p_idx, 'top_y': top_y, 'bottom_y': bottom_y})
            
            curr_p = p_idx + 1
            while curr_p < len(pages_data):
                next_pd = pages_data[curr_p]
                if next_pd['qs']:
                    first_next_q = next_pd['qs'][0]
                    if first_next_q['top_y'] > 120.0:
                        cont_bottom = first_next_q['top_y'] - 6.0
                        segments.append({'p_idx': curr_p, 'top_y': header_margin, 'bottom_y': cont_bottom})
                    break
                else:
                    clean_page_text = re.sub(r'AP PHYSICS.*', '', next_pd['text'], flags=re.IGNORECASE).strip()
                    if clean_page_text and len(clean_page_text) > 10:
                        cont_bottom = min(next_pd['h'] - footer_margin, next_pd['content_bottom'] + 10.0)
                        segments.append({'p_idx': curr_p, 'top_y': header_margin, 'bottom_y': cont_bottom})
                    curr_p += 1
                    
        imgs = []
        for s in segments:
            page = doc[s['p_idx']]
            w, h = page.get_size()
            pil = page.render(scale=scale).to_pil()
            top_px = int(max(0, s['top_y'] * scale))
            bot_px = int(min(pil.height, s['bottom_y'] * scale))
            left_px = int(30.0 * scale)
            right_px = int((w - 30.0) * scale)
            if bot_px > top_px + 20:
                crop = pil.crop((left_px, top_px, right_px, bot_px))
                imgs.append(crop)
                
        if imgs:
            if len(imgs) == 1:
                card = imgs[0]
            else:
                tot_h = sum(im.height for im in imgs)
                max_w = max(im.width for im in imgs)
                card = Image.new("RGB", (max_w, tot_h), (255, 255, 255))
                y_off = 0
                for im in imgs:
                    card.paste(im, (0, y_off))
                    y_off += im.height
            card = sharpen_card(card)
            img_fname = f"{quiz_slug}_q{qnum}.png"
            full_out = os.path.join(CARDS_DIR, img_fname)
            card.save(full_out, "PNG")
            card_paths[qnum] = f"assets/cards/{img_fname}"
            
    return card_paths

def crop_sg_questions(doc, quiz_slug):
    """
    Crops clean question cards from a Scoring Guide (SG) PDF when no TB exists.
    Cuts off strictly ABOVE the 'Answer [A-D]' box so zero answers leak!
    Handles single-page questions and multi-page spanning questions.
    """
    scale = 2.0
    header_margin = 65.0
    footer_margin = 25.0
    
    # 1. Parse each page for questions and answers
    pages_data = []
    for p_idx, page in enumerate(doc):
        tp = page.get_textpage()
        text = tp.get_text_range()
        w, h = page.get_size()
        
        q_matches = []
        for m in QHEADING.finditer(text):
            qnum = int(m.group(1))
            cbox = tp.get_charbox(m.start(1))
            top_y = h - cbox[3]
            if top_y > header_margin:
                q_matches.append({'qnum': qnum, 'top_y': top_y})
                
        ans_matches = []
        for m in re.finditer(r'Answer\s+([A-D])\b', text):
            cbox = tp.get_charbox(m.start(0))
            top_y = h - cbox[3]
            ans_matches.append({'ans': m.group(1), 'top_y': top_y})
            
        q_matches.sort(key=lambda x: x['top_y'])
        ans_matches.sort(key=lambda x: x['top_y'])
        
        pages_data.append({
            'p_idx': p_idx,
            'w': w,
            'h': h,
            'qs': q_matches,
            'ans': ans_matches,
            'text': text
        })

    # Collect all questions
    all_q_nums = []
    for pd in pages_data:
        for q in pd['qs']:
            if q['qnum'] not in all_q_nums:
                all_q_nums.append(q['qnum'])
    all_q_nums.sort()
    
    card_paths = {}
    for idx, qnum in enumerate(all_q_nums):
        start_pd = None
        start_q_obj = None
        for pd in pages_data:
            match = [q for q in pd['qs'] if q['qnum'] == qnum]
            if match:
                start_pd = pd
                start_q_obj = match[0]
                break
        if not start_pd:
            continue
            
        p_idx = start_pd['p_idx']
        top_y = max(header_margin, start_q_obj['top_y'] - 8.0)
        segments = []
        
        # Look for answer on the same page
        valid_ans = [a for a in start_pd['ans'] if a['top_y'] > start_q_obj['top_y']]
        if valid_ans:
            # Answer is on the same page!
            bottom_y = valid_ans[0]['top_y'] - 8.0
            segments.append({'p_idx': p_idx, 'top_y': top_y, 'bottom_y': bottom_y})
        else:
            # Question continues onto subsequent pages until its Answer is reached
            segments.append({'p_idx': p_idx, 'top_y': top_y, 'bottom_y': start_pd['h'] - footer_margin})
            curr_p = p_idx + 1
            while curr_p < len(pages_data):
                next_pd = pages_data[curr_p]
                if next_pd['ans']:
                    # Reached answer on this page
                    cont_bottom = next_pd['ans'][0]['top_y'] - 8.0
                    segments.append({'p_idx': curr_p, 'top_y': header_margin, 'bottom_y': cont_bottom})
                    break
                elif next_pd['qs']:
                    # Reached next question without finding explicit answer
                    cont_bottom = next_pd['qs'][0]['top_y'] - 8.0
                    segments.append({'p_idx': curr_p, 'top_y': header_margin, 'bottom_y': cont_bottom})
                    break
                else:
                    # Intermediate content page
                    segments.append({'p_idx': curr_p, 'top_y': header_margin, 'bottom_y': next_pd['h'] - footer_margin})
                    curr_p += 1
                    
        imgs = []
        for s in segments:
            page = doc[s['p_idx']]
            w, h = page.get_size()
            pil = page.render(scale=scale).to_pil()
            top_px = int(max(0, s['top_y'] * scale))
            bot_px = int(min(pil.height, s['bottom_y'] * scale))
            left_px = int(30.0 * scale)
            right_px = int((w - 30.0) * scale)
            if bot_px > top_px + 20:
                crop = pil.crop((left_px, top_px, right_px, bot_px))
                imgs.append(crop)
                
        if imgs:
            if len(imgs) == 1:
                card = imgs[0]
            else:
                tot_h = sum(im.height for im in imgs)
                max_w = max(im.width for im in imgs)
                card = Image.new("RGB", (max_w, tot_h), (255, 255, 255))
                y_off = 0
                for im in imgs:
                    card.paste(im, (0, y_off))
                    y_off += im.height
            card = sharpen_card(card)
            img_fname = f"{quiz_slug}_q{qnum}.png"
            full_out = os.path.join(CARDS_DIR, img_fname)
            card.save(full_out, "PNG")
            card_paths[qnum] = f"assets/cards/{img_fname}"
            
    return card_paths

def parse_choice_texts(raw_text):
    """
    Extracts text for (A), (B), (C), (D) where available from text.
    """
    q_blocks = re.split(r'\n(?=\d+\.\s)', clean_text(raw_text))
    if len(q_blocks) <= 1:
        q_blocks = re.split(r'(?:^|\n)(?=\d+\.\s)', clean_text(raw_text))
        
    choice_map = {}
    for block in q_blocks:
        block = block.strip()
        m_num = re.match(r'^(\d+)\.\s*([\s\S]*)', block)
        if not m_num:
            continue
        qnum = int(m_num.group(1))
        content = m_num.group(2)
        
        opt_matches = list(re.finditer(r'\(([A-D])\)\s*', content))
        choices = {}
        ans_match = re.search(r'Answer\s+[A-D]\b', content, re.IGNORECASE)
        end_pos = ans_match.start() if ans_match else len(content)
        
        for i, om in enumerate(opt_matches):
            letter = om.group(1).upper()
            start_p = om.end()
            end_p = opt_matches[i+1].start() if i + 1 < len(opt_matches) else end_pos
            c_text = content[start_p:end_p].strip()
            c_text = clean_text(c_text)
            c_text = re.sub(r'Answer\s+[A-D].*$', '', c_text, flags=re.IGNORECASE).strip()
            choices[letter] = c_text
            
        choice_map[qnum] = choices
    return choice_map


# Progress-check filenames that carry a scoring guide's answers.
PC_ANSWER_FILES = ['SG_Unit2ProgressCheckMCQ', 'SG_Unit3ProgressCheckMCQ',
                   'SG_Unit4ProgressCheckMCQ', 'SG_Unit5ProgressCheckMCQ',
                   'SG_Unit6ProgressCheckMCQ', 'SG_Unit7ProgressCheckMCQ',
                   'SG_Unit8ProgressCheckMCQ', 'SG_Unit1ProgressCheckMCQ']


def has_answer_tokens(pdf_path, sample_pages=3):
    """Return the count of 'Answer X' tokens in the first few pages."""
    try:
        doc = pdfium.PdfDocument(pdf_path)
    except Exception:
        return -1
    total = 0
    for p in range(min(sample_pages, len(doc))):
        total += len(re.findall(r'Answer\s+([A-D])\b',
                                doc[p].get_textpage().get_text_range()))
    return total


async def process_all_exams():
    database = {
        "subjects": {
            "APP1": {
                "name": "AP Physics 1: Algebra-Based",
                "units": {}
            },
            "APPC": {
                "name": "AP Physics C: Mechanics",
                "units": {}
            }
        }
    }
    
    courses_cfg = [
        ("APP1", os.path.join(INPUT_DIR, "APP1")),
        ("APPC", os.path.join(INPUT_DIR, "APPC"))
    ]
    
    total_quizzes_processed = 0
    total_cards_generated = 0
    
    for course_key, course_path in courses_cfg:
        if not os.path.exists(course_path):
            continue
            
        print(f"\n=======================================================")
        print(f"  PROCESSING COURSE: {database['subjects'][course_key]['name']}")
        print(f"=======================================================")
        
        unit_dirs = sorted([d for d in os.listdir(course_path) if os.path.isdir(os.path.join(course_path, d))], key=unit_folder_sort_key)
        
        for u_dir in unit_dirs:
            full_u_path = os.path.join(course_path, u_dir)
            files = sorted(os.listdir(full_u_path))
            
            # Identify candidate assessments (SG files or standalone tests)
            candidate_files = []
            for f in files:
                if not f.endswith('.pdf') or 'FRQ' in f or ' (1)' in f or 'Cover' in f or 'Mid-Term' in f:
                    continue
                if (f.startswith('SG_') or 
                    'Answers' in f or 
                    ' A.pdf' in f or 
                    f.endswith('A.pdf') or 
                    f in ['PC.pdf', 'PC-MCQ.pdf', 'PC - MCQ.pdf', 'MCQ PC.pdf', 'MCQs.pdf', 'Unit Test 1.pdf']):
                    candidate_files.append(f)
                    
            # Deduplicate multiple identical ProgressCheckMCQ in same unit
            filtered_candidates = []
            seen_pc = False
            for cf in candidate_files:
                if 'ProgressCheckMCQ' in cf or cf in ['PC.pdf', 'PC-MCQ.pdf', 'PC - MCQ.pdf', 'MCQ PC.pdf', 'MCQs.pdf']:
                    if seen_pc:
                        continue
                    seen_pc = True
                filtered_candidates.append(cf)

            # Prefer the scoring guide over a bare test booklet for progress
            # checks. Both live in the same unit folder and the dedup above
            # keeps whichever sorts first, which is often the booklet. The
            # booklet renders the same questions but carries no answer key, so
            # choosing it silently blanks correct_answer for the whole set.
            # Examples: APP1/Unit 2 has PC-MCQ.pdf alongside
            # SG_Unit2ProgressCheckMCQ_*.pdf; APPC/Unit 2 has "PC - MCQ.pdf".
            pc_slot = None
            for idx, cf in enumerate(filtered_candidates):
                if 'ProgressCheckMCQ' in cf or cf in ['PC.pdf', 'PC-MCQ.pdf',
                                                       'PC - MCQ.pdf', 'MCQ PC.pdf',
                                                       'MCQs.pdf']:
                    pc_slot = idx
                    break
            if pc_slot is not None:
                current = filtered_candidates[pc_slot]
                current_ans = has_answer_tokens(
                    os.path.join(full_u_path, current))
                if current_ans <= 0:
                    for cf in PC_ANSWER_FILES:
                        if not cf.startswith('SG_'):
                            continue
                        hits = [f for f in filtered_candidates
                                if f.startswith(cf)]
                        if not hits:
                            hits = [f for f in files
                                    if f.startswith(cf) and 'FRQ' not in f.upper()
                                    and f not in filtered_candidates]
                        if hits:
                            cand = sorted(hits)[0]
                            cand_ans = has_answer_tokens(
                                os.path.join(full_u_path, cand))
                            if cand_ans > 0:
                                print(f"  [PC source] {current} has no answer key;"
                                      f" using {cand} ({cand_ans} answers) instead")
                                filtered_candidates[pc_slot] = cand
                            break
                
            unit_assessments = []
            norm_unit_name = u_dir.replace(' A', '').title()
            
            for f in filtered_candidates:
                pdf_path = os.path.join(full_u_path, f)
                try:
                    sg_doc = pdfium.PdfDocument(pdf_path)
                except Exception as e:
                    print(f"Could not open {pdf_path}: {e}")
                    continue
                    
                # Extract headers from page 0
                headers = []
                p0_text = sg_doc[0].get_textpage().get_text_range()
                for line in p0_text.split('\n')[:4]:
                    l_str = line.strip()
                    if l_str and not l_str.startswith('1.'):
                        headers.append(l_str)
                        
                header_str = " ".join(headers)
                if 'FRQ' in header_str:
                    continue
                if course_key == 'APPC' and 'AP PHYSICS 1' in header_str and 'MECHANICS' not in header_str:
                    continue
                    
                title = resolve_title(course_key, u_dir, f, headers)
                quiz_slug = f"{course_key}_{u_dir.replace(' ', '')}_{title.split(':')[0].replace(' ', '_').replace('.', '_')}".lower()
                quiz_slug = re.sub(r'[^a-z0-9_]', '', quiz_slug)
                
                # Check for corresponding TB file
                tb_file = None
                if f.startswith('SG_'):
                    pfx = tb_prefix_for(f)
                    matches = [cf for cf in files
                               if cf.startswith(pfx) and 'FRQ' not in cf.upper()]
                    # Oldest pairing wins so the choice is deterministic when a
                    # unit holds more than one booklet for the same section.
                    if matches:
                        tb_file = sorted(matches)[0]
                    # Also check progress check TBs
                    if not tb_file and 'ProgressCheckMCQ' in f:
                        for cf in files:
                            if 'FRQ' in cf.upper():
                                continue
                            if cf in ['PC-MCQ.pdf', 'PC - MCQ.pdf', 'MCQ PC.pdf', 'MCQs.pdf', 'PC.pdf'] or cf.startswith('TB_Unit'):
                                tb_file = cf
                                break
                elif 'Answers' in f:
                    stem = f.replace(' Answers.pdf', '.pdf').replace('Answers.pdf', '.pdf').strip()
                    if stem in files:
                        tb_file = stem
                elif f.endswith('A.pdf'):
                    stem = re.sub(r'\s*A\.pdf$', '.pdf', f)
                    if stem in files:
                        tb_file = stem
                        
                # Extract Answers and Rationales from SG
                sg_answers = extract_sg_answers_and_rationales(sg_doc)
                
                # Extract Choice Texts
                sg_full_text = "\n".join(p.get_textpage().get_text_range() for p in sg_doc)
                choice_texts = parse_choice_texts(sg_full_text)
                
                # Crop Question Cards (Prefer TB, fallback to clean SG crop)
                card_paths = {}
                used_source = "SG (Clean Crop)"
                if tb_file:
                    tb_path = os.path.join(full_u_path, tb_file)
                    try:
                        tb_doc = pdfium.PdfDocument(tb_path)
                        card_paths = crop_tb_questions(tb_doc, quiz_slug)
                        used_source = f"TB ({tb_file})"
                    except Exception as ex:
                        print(f"  Warning: TB crop failed for {tb_file}: {ex}, falling back to SG")
                        card_paths = crop_sg_questions(sg_doc, quiz_slug)
                else:
                    card_paths = crop_sg_questions(sg_doc, quiz_slug)
                    
                # Assemble questions
                # Find all question numbers discovered in card_paths or sg_answers
                all_qnums = sorted(set(list(card_paths.keys()) + list(sg_answers.keys())))
                if not all_qnums:
                    continue
                    
                questions = []
                for qnum in all_qnums:
                    card_img = card_paths.get(qnum, "")
                    ans_info = sg_answers.get(qnum, {"correct_answer": "", "explanation": ""})
                    q_choices_raw = choice_texts.get(qnum, {})
                    
                    choices = []
                    for l in ['A', 'B', 'C', 'D']:
                        choices.append({
                            "letter": l,
                            "text": q_choices_raw.get(l, "")
                        })
                        
                    questions.append({
                        "number": qnum,
                        "card_image": card_img,
                        "choices": choices,
                        "correct_answer": ans_info["correct_answer"],
                        "explanation": ans_info["explanation"]
                    })
                    
                existing_idx = next((i for i, a in enumerate(unit_assessments) if a["id"] == quiz_slug), None)
                new_assessment = {
                    "id": quiz_slug,
                    "title": title,
                    "unit": norm_unit_name,
                    "subject": database["subjects"][course_key]["name"],
                    "question_count": len(questions),
                    "questions": questions
                }
                if existing_idx is not None:
                    if len(questions) > len(unit_assessments[existing_idx]["questions"]):
                        unit_assessments[existing_idx] = new_assessment
                else:
                    unit_assessments.append(new_assessment)
                
                total_quizzes_processed += 1
                total_cards_generated += len(card_paths)
                print(f"  ✓ [{course_key}] {norm_unit_name} -> {title} ({len(questions)} Qs, Source: {used_source})")
                
            if unit_assessments:
                unit_assessments.sort(key=assessment_sort_key)
                unit_title_map = {
                    "Unit 1": "Unit 1: Kinematics",
                    "Unit 2": "Unit 2: Force and Translational Dynamics",
                    "Unit 3": "Unit 3: Work, Energy, and Power",
                    "Unit 4": "Unit 4: Linear Momentum",
                    "Unit 5": "Unit 5: Torque and Rotational Dynamics",
                    "Unit 6": "Unit 6: Energy and Momentum of Rotating Systems",
                    "Unit 7": "Unit 7: Oscillations",
                    "Unit 8": "Unit 8: Fluids"
                }
                display_unit_title = unit_title_map.get(norm_unit_name, f"{norm_unit_name}: Foundations")
                database["subjects"][course_key]["units"][norm_unit_name] = {
                    "title": display_unit_title,
                    "assessments": unit_assessments
                }

    # Save to JSON
    json_path = os.path.join(DATA_DIR, "exams.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(database, f, indent=2)
        
    # Save to JS bundle (CORS immune)
    js_path = os.path.join(DATA_DIR, "exams_bundle.js")
    with open(js_path, "w", encoding="utf-8") as f:
        f.write("// Wayground AP Physics Assessments Database\n")
        f.write("window.EXAM_DATA = ")
        json.dump(database, f, indent=2)
        f.write(";\n")
        
    # Ingest Mid-Term Review worksheets if present
    try:
        from ingest_midterm_reviews import main as ingest_reviews
        print("\nChecking for Mid-Term Review worksheets...")
        ingest_reviews()
    except Exception as e:
        print(f"Notice: ingest_midterm_reviews skipped or encountered: {e}")

    print("\n=======================================================")
    print("  EXAM DATABASE REGENERATION COMPLETE!")
    print(f"  Total Quizzes: {total_quizzes_processed}")
    print(f"  Total Question Cards Generated: {total_cards_generated}")
    print("=======================================================")

if __name__ == "__main__":
    asyncio.run(process_all_exams())

