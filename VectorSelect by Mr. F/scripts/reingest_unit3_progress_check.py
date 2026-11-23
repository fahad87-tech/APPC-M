import ctypes
import os
import json
import pypdfium2 as pdfium
from PIL import Image, ImageFilter

CARDS_DIR = "assets/cards"
os.makedirs(CARDS_DIR, exist_ok=True)

print("=== RE-INGESTING APPC UNIT 3 PROGRESS CHECK (HIGH FIDELITY) ===")

pdf_path = "input pdf/APPC/Unit 3/PC.pdf"
doc = pdfium.PdfDocument(pdf_path)

# Step 1: Strip green highlight box and checkmark objects across all pages
total_removed = 0
for p_idx, page in enumerate(doc):
    page_removed = 0
    for obj in list(page.get_objects()):
        if obj.type != pdfium.raw.FPDF_PAGEOBJ_PATH:
            continue
        colors = []
        for getter in (pdfium.raw.FPDFPageObj_GetFillColor,
                       pdfium.raw.FPDFPageObj_GetStrokeColor):
            channels = [ctypes.c_uint() for _ in range(4)]
            if getter(obj.raw, *(ctypes.byref(c) for c in channels)):
                colors.append(tuple(c.value for c in channels[:3]))
        # Green highlight fill and checkmark stroke colors
        if any(c in ((230, 255, 230), (227, 255, 222),
                     (58, 145, 63), (0, 128, 0)) for c in colors):
            page.remove_obj(obj)
            page_removed += 1
            total_removed += 1
    page.gen_content()

print(f"✓ Removed {total_removed} green answer-reveal vector objects from PDF.")

scale = 2.0
margin_x = 30.0 # left/right crop inset in pt

# Crop definitions for all 18 questions: list of segments [(page_idx_0_based, top_y_pt, bottom_y_pt)]
CROPS = {
    1: [(0, 85.0, 325.0)],
    2: [(0, 445.0, 715.0), (1, 80.0, 175.0)],
    3: [(1, 330.0, 470.0)],
    4: [(2, 85.0, 460.0)],
    5: [(2, 595.0, 735.0)],
    6: [(3, 345.0, 475.0)],
    7: [(3, 680.0, 750.0), (4, 78.0, 168.0)],
    8: [(4, 305.0, 420.0)],
    9: [(4, 540.0, 600.0), (5, 75.0, 740.0)],
    10: [(6, 205.0, 575.0)],
    11: [(7, 85.0, 265.0)],
    12: [(7, 415.0, 548.0)],
    13: [(8, 85.0, 258.0)],
    14: [(8, 450.0, 575.0)],
    # Q15: Pyramid Diagram + Passage + Question 15 + Choices A-D
    15: [(9, 85.0, 502.0)],
    # Q16: Pyramid Diagram + Passage from Page 10 + Question 16 & Table from Page 11
    16: [(9, 85.0, 358.0), (10, 85.0, 330.0)],
    17: [(11, 85.0, 480.0)],
    18: [(12, 85.0, 430.0)]
}

def sharpen_card(im):
    # Subtle print unsharp mask
    return im.filter(ImageFilter.UnsharpMask(radius=1.2, percent=28, threshold=5))

generated_cards = {}
for qnum, segs in CROPS.items():
    seg_images = []
    for p_idx, top_y, bot_y in segs:
        page = doc[p_idx]
        w, h = page.get_size()
        pil_page = page.render(scale=scale).to_pil()
        
        l_px = int(margin_x * scale)
        r_px = int((w - margin_x) * scale)
        t_px = int(max(0, top_y * scale))
        b_px = int(min(pil_page.height, bot_y * scale))
        
        crop = pil_page.crop((l_px, t_px, r_px, b_px))
        seg_images.append(crop)
        
    if len(seg_images) == 1:
        card = seg_images[0]
    else:
        tot_h = sum(im.height for im in seg_images) + (len(seg_images) - 1) * 20
        max_w = max(im.width for im in seg_images)
        card = Image.new("RGB", (max_w, tot_h), (255, 255, 255))
        curr_y = 0
        for im in seg_images:
            card.paste(im, (0, curr_y))
            curr_y += im.height + 20
            
    card = sharpen_card(card)
    fname = f"appc_unit3_unit_3_progress_check_q{qnum}.png"
    out_path = os.path.join(CARDS_DIR, fname)
    card.save(out_path, "PNG")
    print(f"✓ Saved Q{qnum:2d}: {fname} (size {card.size})")
    generated_cards[qnum] = f"assets/cards/{fname}?v=20261123_v1"

print("\nAll 18 cards successfully generated and sharpened!")
