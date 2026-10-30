import os
import fitz

DEST_DIR = r"C:\Users\fahad\Desktop\MT REVIEWs"
SRC_DIR = r"input pdf"

REVIEW_CONFIGS = [
    {
        "src": os.path.join(SRC_DIR, "APP1", "Unit 1", "MidTerm Review", "Free Printable APP1 Unit 1 Review.pdf"),
        "dest": os.path.join(DEST_DIR, "APP1 Unit 1 Midterm Review (with Answers).pdf"),
        "trim_last": True
    },
    {
        "src": os.path.join(SRC_DIR, "APP1", "Unit 2", "MidTerm Review", "Free Printable APP1 Unit 2 REview.pdf"),
        "dest": os.path.join(DEST_DIR, "APP1 Unit 2 Midterm Review - Part 1 (with Answers).pdf"),
        "alt_dest": os.path.join(DEST_DIR, "APP1 Unit 2 Midterm Review - Part 1 (Clean).pdf"),
        "trim_last": True
    },
    {
        "src": os.path.join(SRC_DIR, "APP1", "Unit 2", "MidTerm Review", "Free Printable APP1 Unit 2A Review.pdf"),
        "dest": os.path.join(DEST_DIR, "APP1 Unit 2 Midterm Review - Part 2 (with Answers).pdf"),
        "trim_last": True
    },
    {
        "src": os.path.join(SRC_DIR, "APPC", "Unit 1", "Midterm Review", "Free Printable APPC - Unit 1 Review.pdf"),
        "dest": os.path.join(DEST_DIR, "APPC Unit 1 Midterm Review (with Answers).pdf"),
        "trim_last": True
    },
    {
        "src": os.path.join(SRC_DIR, "APPC", "Unit 2", "Midterm Review", "Free Printable APPC Unit 2 Review.pdf"),
        "dest": os.path.join(DEST_DIR, "APPC Unit 2 Midterm Review (with Answers).pdf"),
        "trim_last": True
    }
]

print("=== Complete Sanitization: Headers, Footers, and Wayground Logos ===")

for cfg in REVIEW_CONFIGS:
    src_path = cfg["src"]
    dest_path = cfg["dest"]
    filename = os.path.basename(dest_path)
    
    doc = fitz.open(src_path)
    
    # 1. Trim trailing blank page if present
    if cfg["trim_last"] and len(doc) > 1:
        last_page = doc[-1]
        last_text = last_page.get_text().strip()
        lines = [
            l.strip() for l in last_text.split('\n')
            if l.strip() and not l.strip().startswith('http')
            and '04/10/2026' not in l
            and 'Free Printable' not in l
            and not (len(l.strip().split('/')) == 2 and l.strip().split('/')[0].isdigit())
        ]
        if len(lines) == 0:
            doc.delete_page(len(doc) - 1)
            print(f"{filename}: Trimmed empty trailing page (new page count: {len(doc)})")

    # 2. Redact top headers, bottom footers, and page 1 logo
    for pno in range(len(doc)):
        page = doc[pno]
        
        # Redact top header band (browser print date & title): y < 28
        page.add_redact_annot(fitz.Rect(0, 0, page.rect.width, 28), fill=(1, 1, 1))
        
        # Redact bottom footer band (browser print url & page count): y > 762
        page.add_redact_annot(fitz.Rect(0, 762, page.rect.width, page.rect.height), fill=(1, 1, 1))
        
        # Redact Page 1 Wayground logo + 'Worksheets' text banner (x: 55-220, y: 62-92)
        if pno == 0:
            page.add_redact_annot(fitz.Rect(55, 62, 220, 92), fill=(1, 1, 1))
            
        page.apply_redactions()

    # 3. Clean metadata
    clean_meta = {}
    for k, v in doc.metadata.items():
        if v and ("wayground" in str(v).lower() or "quizizz" in str(v).lower()):
            clean_meta[k] = ""
        else:
            clean_meta[k] = v
    doc.set_metadata(clean_meta)

    out_bytes = doc.tobytes(garbage=4, deflate=True)
    doc.close()

    # Attempt to write to dest_path
    saved = False
    try:
        with open(dest_path, "wb") as fp:
            fp.write(out_bytes)
        print(f"  -> Successfully saved: {filename}")
        saved = True
    except Exception as e:
        print(f"  -> File locked in PDF viewer ({filename}): {e}")
        alt_path = cfg.get("alt_dest")
        if alt_path:
            try:
                with open(alt_path, "wb") as fp:
                    fp.write(out_bytes)
                print(f"  -> Saved clean copy to: {os.path.basename(alt_path)}")
                saved = True
            except Exception as e2:
                print(f"  -> Alt path also locked: {e2}")

# Clean up any leftover temporary files
for f in os.listdir(DEST_DIR):
    if f.endswith(".tmp.pdf") or f.startswith("Clean - APP1 Unit 2"):
        try:
            os.remove(os.path.join(DEST_DIR, f))
        except:
            pass

print("\n=== Sanitization Finished ===")
