"""Count real questions + detect answer keys in candidate progress-check PDFs."""
import os
import re

import pypdfium2 as pdfium

BASE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "input pdf")

CANDIDATES = [
    ("APP1 u4-asis  SG_Unit3ProgressCheckMCQ",
     os.path.join(BASE, "APP1", "Unit 4", "SG_Unit3ProgressCheckMCQ_67397b3772fd05.67397b3993d710.48803153.pdf")),
    ("APP1 folder4  SG_Unit5ProgressCheckMCQ",
     os.path.join(BASE, "APP1", "Unit 4", "SG_Unit5ProgressCheckMCQ_6804f1512b9fa2.6804f153853e65.28253131.pdf")),
    ("APP1 folder3A SG_Unit3ProgressCheckMCQ",
     os.path.join(BASE, "APP1", "Unit 3 A", "SG_Unit3ProgressCheckMCQ_67397b3772fd05.67397b3993d710.48803153.pdf")),
    ("APPC u1       SG_Unit1ProgressCheckMCQ",
     os.path.join(BASE, "APPC", "Unit 1", "SG_Unit1ProgressCheckMCQ_66cd760c0e7321.66cd760e9bbc85.32218794.pdf")),
    ("APPC u4       SG_Unit4ProgressCheckMCQ",
     os.path.join(BASE, "APPC", "unit 4", "SG_Unit4ProgressCheckMCQ_67397b832856f4.67397b857700e4.45142013.pdf")),
]

# A question heading: small integer, a period, then content, at line start.
QHEAD = re.compile(r"^(\d{1,2})\s?\.\s+(\S.*)$")

for label, path in CANDIDATES:
    if not os.path.exists(path):
        print(f"{label}\n    MISSING\n")
        continue

    doc = pdfium.PdfDocument(path)
    keys = []
    # Page 1 is usually the cover/index listing "Answer A", "Answer B"...
    for i in range(len(doc)):
        txt = doc[i].get_textpage().get_text_range()
        for m in re.finditer(r"Answer\s+([A-D])\b", txt):
            if m.group(1) not in keys:
                keys.append(m.group(1))

    heads = {}
    for i in range(len(doc)):
        txt = doc[i].get_textpage().get_text_range()
        for line in txt.split("\n"):
            m = QHEAD.match(line.strip())
            if not m:
                continue
            n = int(m.group(1))
            if not (1 <= n <= 40):
                continue
            rest = m.group(2)
            # Reject "Page 4 of 14" and similar.
            if re.match(r"(?i)page\s", rest):
                continue
            heads.setdefault(n, []).append(i)

    ordered = sorted(heads)
    print(f"{label}")
    print(f"    file      : {os.path.basename(path)}")
    print(f"    pages     : {len(doc)}")
    print(f"    q numbers : {ordered}")
    print(f"    max q     : {max(ordered) if ordered else 0}")
    print(f"    answer key: {''.join(keys) if keys else '(none found)'}")
    print()