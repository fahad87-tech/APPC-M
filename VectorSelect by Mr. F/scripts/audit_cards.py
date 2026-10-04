#!/usr/bin/env python3
"""
Card integrity auditor — checks every PNG for bottom-edge clipping.

Detection strategy:
1. OCR the bottom ~25% of the image (where choice D lives)
2. Look for the four choice markers (A), (B), (C), (D) — all must be present
3. Verify the last choice (D) has at least N characters of readable text after its label
4. Flag if choice D is missing, or its text < threshold, or if the image ends abruptly
   (very small white margin at bottom suggesting crop)

Outputs a CSV and summary.
"""
import glob
import json
import os
import re
import sys
from pathlib import Path

import pytesseract
from PIL import Image, ImageFilter

CARDS_DIR = Path(r"D:\APPS\VectorSelect by Mr. F\assets\cards")
MIN_CHOICE_D_CHARS = 8      # minimum visible chars after "(D)" to consider it unclipped
BOTTOM_BAND_PCT = 0.35      # scan bottom 35% of image
MIN_WHITE_MARGIN_PX = 3     # min white margin at very bottom edge

# Tesseract config: single column, sparse text, don't rotate
TESS_CONFIG = "--oem 3 --psm 6 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789()[]{}<>=+-/.,:;?'\"!@#$%^&*_ "

CHOICE_RE = re.compile(r'\([A-D]\)\s*(.*)', re.DOTALL)

def extract_choice_d_text(image: Image.Image) -> tuple[bool, int, str]:
    """
    Returns (choice_d_found, char_count_after_D_label, snippet)
    """
    w, h = image.size
    # Crop bottom band where choice D lives
    band = image.crop((0, int(h * (1 - BOTTOM_BAND_PCT)), w, h))
    
    # Boost contrast for OCR
    band = band.convert("L").point(lambda x: 0 if x < 180 else 255)
    
    text = pytesseract.image_to_string(band, config=TESS_CONFIG).strip()
    text = re.sub(r'\s+', ' ', text)
    
    # Find the last (D) occurrence
    matches = list(CHOICE_RE.finditer(text))
    if not matches:
        return False, 0, text[:200]
    
    last = matches[-1]
    if last.group(1) != 'D':
        return False, 0, text[:200]
    
    after = last.group(2).strip()
    return True, len(after), after[:120]

def check_bottom_margin(image: Image.Image) -> bool:
    """Returns True if there's a suspicious white sliver at the bottom edge."""
    w, h = image.size
    bottom_row = image.crop((0, h - 2, w, h)).convert("L")
    # If >90% of bottom 2px row is near-white (>240), crop likely cut off
    whites = sum(1 for p in bottom_row.getdata() if p > 240)
    return whites / (w * 2) > 0.9

def audit_card(path: Path) -> dict:
    im = Image.open(path)
    w, h = im.size
    
    d_found, d_chars, snippet = extract_choice_d_text(im)
    white_bottom = check_bottom_margin(im)
    
    # Determine status
    if not d_found:
        status = "MISSING_CHOICE_D"
    elif d_chars < MIN_CHOICE_D_CHARS:
        status = "CLIPPED_CHOICE_D"
    elif white_bottom:
        status = "SUSPECT_WHITE_BOTTOM"
    else:
        status = "OK"
    
    return {
        "file": path.name,
        "size": f"{w}x{h}",
        "status": status,
        "choice_d_chars": d_chars,
        "snippet": snippet,
        "white_bottom": white_bottom,
    }

def main():
    files = sorted(CARDS_DIR.glob("*.png"))
    print(f"Scanning {len(files)} cards in {CARDS_DIR}...")
    
    results = []
    for i, f in enumerate(files, 1):
        if i % 100 == 0:
            print(f"  {i}/{len(files)}")
        try:
            results.append(audit_card(f))
        except Exception as e:
            results.append({
                "file": f.name,
                "status": "ERROR",
                "error": str(e)
            })
    
    # Summary
    by_status = {}
    for r in results:
        by_status.setdefault(r["status"], 0)
        by_status[r["status"]] += 1
    
    print("\n=== SUMMARY ===")
    for s, c in sorted(by_status.items(), key=lambda x: -x[1]):
        print(f"  {s:25s} : {c}")
    
    # Write CSV
    out = CARDS_DIR.parent / "card_audit.csv"
    with open(out, "w", encoding="utf-8") as fh:
        fh.write("file,status,size,choice_d_chars,white_bottom,snippet\n")
        for r in results:
            snippet = r.get("snippet", "").replace('"', '""')
            fh.write(f'"{r["file"]}",{r["status"]},"{r.get("size","")}",{r.get("choice_d_chars",0)},{r.get("white_bottom",False)},"{snippet}"\n')
    print(f"\nCSV written to {out}")
    
    # List first 20 problematic
    bad = [r for r in results if r["status"] != "OK"]
    if bad:
        print(f"\n=== FIRST {min(20, len(bad))} PROBLEMS ===")
        for r in bad[:20]:
            print(f"  {r['file']:50s}  {r['status']:22s}  D_chars={r.get('choice_d_chars',0):2d}  white_bottom={r.get('white_bottom',False)}  ...{r.get('snippet','')[:80]}")

if __name__ == "__main__":
    main()