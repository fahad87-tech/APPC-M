"""Apply a subtle UnsharpMask to all existing question card PNGs in-place.
Run this once after the build script changes — no need to re-extract from PDFs.

Usage:  python "D:\\APPS\\VectorSelect by Mr. F\\scripts\\sharpen_existing_cards.py"
"""
import glob
from PIL import Image, ImageFilter

CARDS_GLOB = r"D:\APPS\VectorSelect by Mr. F\assets\cards\*.png"

count = 0
for path in glob.glob(CARDS_GLOB):
    im = Image.open(path)
    im = im.filter(ImageFilter.UnsharpMask(radius=2, percent=50, threshold=3))
    im.save(path, "PNG")
    count += 1
    if count % 100 == 0:
        print(f"  Sharpened {count} cards...")

print(f"Done. Sharpened {count} cards.")
