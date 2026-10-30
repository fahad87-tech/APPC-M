import os
import fitz
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

DEST_DIR = r"C:\Users\fahad\Desktop\MT REVIEWs"
os.makedirs(DEST_DIR, exist_ok=True)

REVIEWS = [
    {
        "filename": "APP1 Unit 1 Midterm Review (with Answers).pdf",
        "course": "AP Physics 1",
        "unit": "Unit 1: Kinematics",
        "src": r"input pdf\APP1\Unit 1\MidTerm Review\Free Printable APP1 Unit 1 Review.pdf",
        "keys": [
            ("Q1", "C", "t_C"),
            ("Q2", "E", "Acceleration a: Equal; Time to Hit Ground: Equal"),
            ("Q3", "A", "Correct trajectory matching acceleration profile"),
            ("Q4", "B", "5 m/s² down the incline"),
            ("Q5", "B", "16 m/s²"),
            ("Q6", "D", "The slope of the tangent to a best-fit sinusoidal curve at 0.7 s"),
            ("Q7", "D", "6 m/s"),
            ("Q8", "A", "Directly above the spring launcher"),
            ("Q9", "E", "downward and constant"),
            ("Q10", "C", "20 m"),
            ("Q11", "C", "Matches relative position and velocity equations")
        ]
    },
    {
        "filename": "APP1 Unit 2 Midterm Review - Part 1 (with Answers).pdf",
        "course": "AP Physics 1",
        "unit": "Unit 2: Dynamics (Part 1)",
        "src": r"input pdf\APP1\Unit 2\MidTerm Review\Free Printable APP1 Unit 2 REview.pdf",
        "keys": [
            ("Q1", "A, D", "Multi-Select: Total force by incline (A) & Gravitational force on Earth (D)"),
            ("Q2", "B, D", "Multi-Select: Weight increased descending (B) & Weighs less on Mars (D)"),
            ("Q3", "C", "F_2 = 30 N and a_2 = 60 m/s² (Newton's 3rd Law & F=ma)"),
            ("Q4", "D", "-f - mg sin θ = ma"),
            ("Q5", "B", "21 s"),
            ("Q6", "C", "10.0 N"),
            ("Q7", "C", "I and II only"),
            ("Q8", "B, D", "Multi-Select: Angle of incline (B) & Coefficient of kinetic friction (D)"),
            ("Q9", "E", "x_0"),
            ("Q10", "E", "mg sin θ")
        ]
    },
    {
        "filename": "APP1 Unit 2 Midterm Review - Part 2 (with Answers).pdf",
        "course": "AP Physics 1",
        "unit": "Unit 2: Circular Motion & Gravitation (Part 2)",
        "src": r"input pdf\APP1\Unit 2\MidTerm Review\Free Printable APP1 Unit 2A Review.pdf",
        "keys": [
            ("Q1", "D", "less than 9.8 m/s² but greater than zero"),
            ("Q2", "B", "F_N > F_g Always: Case 2; F_N < F_g Always: Case 1"),
            ("Q3", "D", "81 F_1"),
            ("Q4", "B", "T = 2π√(R/g)"),
            ("Q5", "E", "F/2"),
            ("Q6", "D", "Force decreases nonlinearly, approaching zero as radius increases"),
            ("Q7", "A", "200 N"),
            ("Q8", "D", "Net force towards the center of curvature"),
            ("Q9", "E", "I, II, and III"),
            ("Q10", "E", "It has components both to the left and vertically downward")
        ]
    },
    {
        "filename": "APPC Unit 1 Midterm Review (with Answers).pdf",
        "course": "AP Physics C: Mechanics",
        "unit": "Unit 1: Kinematics (Calculus-Based)",
        "src": r"input pdf\APPC\Unit 1\Midterm Review\Free Printable APPC - Unit 1 Review.pdf",
        "keys": [
            ("Q1", "C", "Derivative and velocity vector evaluation"),
            ("Q2", "B", "1.42 s"),
            ("Q3", "C", "The block is moving to the right and slowing down"),
            ("Q4", "D", "v_x = 2, v_y = -2 - 10t"),
            ("Q5", "A", "Students 1, 4, and 5"),
            ("Q6", "D", "E"),
            ("Q7", "D", "Parabolic trajectory calculation"),
            ("Q8", "D", "77 m"),
            ("Q9", "E", "v as a function of t"),
            ("Q10", "C", "8 m/s²"),
            ("Q11", "B", "v_0 + (Δv)t / 2"),
            ("Q12", "D", "D"),
            ("Q13", "B", "II and V"),
            ("Q14", "A", "2N / M"),
            ("Q15", "C", "13 m/s²"),
            ("Q16", "C", "Velocity and acceleration integral"),
            ("Q17", "A", "Increases in magnitude at decreasing rate, approaching terminal value"),
            ("Q18", "E", "Horizontal wind opposing motion, 32 m")
        ]
    },
    {
        "filename": "APPC Unit 2 Midterm Review (with Answers).pdf",
        "course": "AP Physics C: Mechanics",
        "unit": "Unit 2: Newton's Laws & Circular Motion",
        "src": r"input pdf\APPC\Unit 2\Midterm Review\Free Printable APPC Unit 2 Review.pdf",
        "keys": [
            ("Q1", "A", "(6 m, 3 m)"),
            ("Q2", "A", "1.4 m/s²"),
            ("Q3", "B", "2μ_s N_0 / g - M_0"),
            ("Q4", "D", "m_0 / (kh - m_0 g)"),
            ("Q5", "D", "Neither situation"),
            ("Q6", "B", "0.50"),
            ("Q7", "D", "F_2 > F_1 > 0"),
            ("Q8", "B", "Directly above Point P for 0 < θ < 90°"),
            ("Q9", "D", "Neither claim is necessarily true (Equivalence principle / acceleration)"),
            ("Q10", "A", "It is greater than √(Rg cos θ)"),
            ("Q11", "A", "f_1"),
            ("Q12", "B", "2:3"),
            ("Q13", "B", "Δx_2 = 4 Δx_1"),
            ("Q14", "A", "T_1 must be largest because horizontal is 4/3 and vertical is 1"),
            ("Q15", "B", "T_2 / F_g")
        ]
    }
]

print("=== 1. Exporting Individual Review PDFs (with Clean Endings) ===")
for r in REVIEWS:
    src_path = r["src"]
    dest_path = os.path.join(DEST_DIR, r["filename"])
    if not os.path.exists(src_path):
        print(f"Warning: Source not found: {src_path}")
        continue
    doc = fitz.open(src_path)
    # Check if last page is blank URL footer
    last_page = doc[-1]
    last_text = last_page.get_text().strip()
    content_lines = [l for l in last_text.split('\n') if l.strip() and not l.startswith('http') and '04/10/2026' not in l and 'Free Printable' not in l]
    if len(content_lines) == 0:
        doc.delete_page(len(doc) - 1)
        print(f"  Trimmed trailing empty page from {r['filename']} -> Final page count: {len(doc)}")
    else:
        print(f"  Retained all {len(doc)} pages for {r['filename']}")
    doc.save(dest_path)
    doc.close()
    print(f"  -> Saved: {dest_path}")

print("\n=== 2. Generating Master Answer Key Reference PDF ===")
master_pdf_path = os.path.join(DEST_DIR, "Midterm Reviews - Complete Answer Key Guide (APP1 & APPC).pdf")

doc = SimpleDocTemplate(
    master_pdf_path,
    pagesize=letter,
    leftMargin=36,
    rightMargin=36,
    topMargin=36,
    bottomMargin=36
)

styles = getSampleStyleSheet()

title_style = ParagraphStyle(
    "TitleStyle",
    parent=styles["Normal"],
    fontName="Helvetica-Bold",
    fontSize=20,
    leading=24,
    textColor=colors.HexColor("#0f172a"),
    alignment=1 # Center
)

subtitle_style = ParagraphStyle(
    "SubtitleStyle",
    parent=styles["Normal"],
    fontName="Helvetica-Bold",
    fontSize=11,
    leading=15,
    textColor=colors.HexColor("#0284c7"),
    alignment=1
)

meta_style = ParagraphStyle(
    "MetaStyle",
    parent=styles["Normal"],
    fontName="Helvetica",
    fontSize=9,
    leading=12,
    textColor=colors.HexColor("#64748b"),
    alignment=1
)

section_heading = ParagraphStyle(
    "SectionHeading",
    parent=styles["Normal"],
    fontName="Helvetica-Bold",
    fontSize=13,
    leading=16,
    textColor=colors.HexColor("#1e293b"),
    spaceBefore=10,
    spaceAfter=4
)

cell_bold = ParagraphStyle(
    "CellBold",
    parent=styles["Normal"],
    fontName="Helvetica-Bold",
    fontSize=9,
    leading=12,
    textColor=colors.HexColor("#0f172a")
)

cell_ans = ParagraphStyle(
    "CellAns",
    parent=styles["Normal"],
    fontName="Helvetica-Bold",
    fontSize=10,
    leading=13,
    textColor=colors.HexColor("#0369a1"),
    alignment=1
)

cell_desc = ParagraphStyle(
    "CellDesc",
    parent=styles["Normal"],
    fontName="Helvetica",
    fontSize=8.5,
    leading=11,
    textColor=colors.HexColor("#334155")
)

story = []

story.append(Paragraph("AP PHYSICS MIDTERM EXAM REVIEWS", title_style))
story.append(Spacer(1, 4))
story.append(Paragraph("Master Answer Key & Teacher Solution Guide • Mr. F", subtitle_style))
story.append(Spacer(1, 2))
story.append(Paragraph("Official Verified Keys for AP Physics 1 and AP Physics C: Mechanics Units 1 & 2", meta_style))
story.append(Spacer(1, 14))

for idx, r in enumerate(REVIEWS):
    elements = []
    header_text = f"<b>{r['course']}</b> — {r['unit']} <font color='#64748b' size='8.5'>({len(r['keys'])} Questions)</font>"
    elements.append(Paragraph(header_text, section_heading))
    elements.append(Spacer(1, 4))
    
    table_data = [
        [
            Paragraph("<b>Question</b>", cell_bold),
            Paragraph("<b>Correct Answer</b>", cell_ans),
            Paragraph("<b>Description / Rationale</b>", cell_bold)
        ]
    ]
    
    for q_num, ans, desc in r["keys"]:
        table_data.append([
            Paragraph(f"<b>{q_num}</b>", cell_bold),
            Paragraph(f"<b>{ans}</b>", cell_ans),
            Paragraph(desc, cell_desc)
        ])
        
    t = Table(table_data, colWidths=[65, 95, 380])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ("ALIGN", (1, 0), (1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5),
        ("TOPPADDING", (0, 0), (-1, -1), 3.5),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")])
    ]))
    elements.append(t)
    elements.append(Spacer(1, 10))
    
    # Add page breaks between sections logically to keep layout pristine
    if idx in [1, 3]:
        story.append(KeepTogether(elements))
        story.append(PageBreak())
    else:
        story.append(KeepTogether(elements))

doc.build(story)
print(f"  -> Generated Master Guide: {master_pdf_path}")
