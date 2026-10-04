#!/usr/bin/env python3
"""
Card integrity auditor — pure geometry, no OCR required.

We check the bottom 15% of each card PNG for non-white pixels.
If the region is too bright (>95% white), we suspect the bottom got clipped.

Additionally, we check that the image is not absurdly short (<150px tall),
which would indicate a gross crop failure.
"""
from pathlib import Path
from PIL import Image
import csv

CARDS_DIR = Path(r"D:\APPS\VectorSelect by Mr. F\assets\cards")
WHITE_THRESHOLD = 240       # 0-255, > this is considered white
MIN_NONWHITE_RATIO = 0.04   # at least 4% non-white pixels in bottom band
BOTTOM_BAND_PCT = 0.18      # inspect bottom 18% of height
MIN_HEIGHT_PX = 150         # reject cards shorter than this

def audit_card(path: Path) -> dict:
    try:
        im = Image.open(path)
        im.load()
    except Exception as e:
        return {"file": path.name, "status": "ERROR", "error": str(e)[:100]}
    
    w, h = im.size
    if h < MIN_HEIGHT_PX:
        return {"file": path.name, "status": "TOO_SHORT", "height": h}
    
    # Convert to greyscale and crop bottom band
    grey = im.convert("L")
    band_top = int(h * (1 - BOTTOM_BAND_PCT))
    band = grey.crop((0, band_top, w, h))
    
    # Count non-white pixels
    total = band.width * band.height
    nonwhite = sum(1 for p in band.getdata() if p < WHITE_THRESHOLD)
    ratio = nonwhite / total if total else 0
    
    if ratio < MIN_NONWHITE_RATIO:
        status = "CLIPPED_BOTTOM"
    else:
        status = "OK"
    
    return {
        "file": path.name,
        "status": status,
        "height": h,
        "width": w,
        "nonwhite_ratio": round(ratio, 4),
    }

def main():
    files = sorted(CARDS_DIR.glob("*.png"))
    print(f"Scanning {len(files)} cards...")
    
    results = []
    for i, f in enumerate(files, 1):
        if i % 100 == 0:
            print(f"  {i}/{len(files)}")
        results.append(audit_card(f))
    
    # Summary
    from collections import Counter
    cnt = Counter(r["status"] for r in results)
    print("\n=== SUMMARY ===")
    for status, count in cnt.most_common():
        print(f"  {status:20s} : {count}")
    
    # CSV
    out = CARDS_DIR.parent / "card_audit_geo.csv"
    with open(out, "w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=["file", "status", "height", "width", "nonwhite_ratio"])
        writer.writeheader()
        for r in results:
            writer.writerow(r)
    print(f"\nCSV written to {out}")
    
    # Problems
    bad = [r for r in results if r["status"] not in ("OK", "ERROR")]
    if bad:
        print(f"\n=== {len(bad)} PROBLEMS ===")
        for r in bad[:30]:
            print(f"  {r['file']:40s} {r['status']:15s} h={r.get('height',0)}px ratio={r.get('nonwhite_ratio',0)}")
    else:
        print("\n✅ No clipping detected.")

if __name__ == "__main__":
    main()