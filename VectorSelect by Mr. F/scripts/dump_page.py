"""Dump raw page text for the three progress checks to design a reliable parser."""
import os
import re
import sys

import pypdfium2 as pdfium

BASE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "input pdf")

WHICH = sys.argv[1] if len(sys.argv) > 1 else "app1u4"
PAGE = int(sys.argv[2]) if len(sys.argv) > 2 else 0

FILES = {
    "app1u4": os.path.join(BASE, "APP1", "Unit 4",
                           "SG_Unit3ProgressCheckMCQ_67397b3772fd05.67397b3993d710.48803153.pdf"),
    "appcu1": os.path.join(BASE, "APPC", "Unit 1",
                           "SG_Unit1ProgressCheckMCQ_66cd760c0e7321.66cd760e9bbc85.32218794.pdf"),
    "appcu4": os.path.join(BASE, "APPC", "unit 4",
                           "SG_Unit4ProgressCheckMCQ_67397b832856f4.67397b857700e4.45142013.pdf"),
}

doc = pdfium.PdfDocument(FILES[WHICH])
print(f"file: {os.path.basename(FILES[WHICH])}  pages={len(doc)}")
print(f"--- page {PAGE} raw text ---")
txt = doc[PAGE].get_textpage().get_text_range()
for i, line in enumerate(txt.split("\n")):
    print(f"{i:>3}| {line}")