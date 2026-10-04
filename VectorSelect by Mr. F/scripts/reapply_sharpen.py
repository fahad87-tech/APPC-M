"""Re-apply a GENTLER UnsharpMask to all existing question card PNGs in-place.

This effectively REDUCES the previous stronger sharpening: the cards are
currently sharpened with radius=2/percent=50/threshold=3. A gentler
pass (radius=1.2/percent=28/threshold=5) lets the earlier edge-enhancement
relax, producing natural print-sharpness instead of digital crunch.

Usage:  python "D:\\APPS\\VectorSelect by Mr. F\\scripts\\reapply_sharpen.py"
"""
import glob
from PIL import Image, ImageFilter

CARDS_GLOB = r"D:\APPS\VectorSelect by Mr. F\assets\cards\*.png"

count = 0
for path in glob.glob(CARDS_GLOB):
    im = Image.open(path)
    im = im.filter(ImageFilter.UnsharpMask(radius=1.2, percent=28, threshold=5))
    im.save(path, "PNG")
    count += 1
    if count % 100 == 0:
        print(f"  Re-filtered {count} cards...")

print(f"Done. Re-filtered {count} cards with gentle sharpening.")
