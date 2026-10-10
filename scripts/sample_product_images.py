# -*- coding: utf-8 -*-
"""
Download a sample of real catalog product photos for visual QA.

The catalog images live on Digikala/Torob CDNs, so they are only reachable as
URLs. This pulls a spread of them to disk (a) so a reviewer can open the files
directly and (b) so obviously-unusable ones (illustrations, unrelated photos)
can be filtered out and replaced.

Usage:
  PYTHONIOENCODING=utf-8 python scripts/sample_product_images.py [count]
Writes office/_qa/images/NNN_<id>.jpg plus office/_qa/images/manifest.json
"""
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
CATALOG = os.path.join(HERE, "catalog_products.json")
OUT_DIR = os.path.join(ROOT, "_qa", "images")

# Resize to a sane width so the reviewer is not opening 3000px originals.
MAX_EDGE = 900


def download(url, dest):
    r = subprocess.run(
        ["curl", "-sSL", "--max-time", "45",
         "-H", "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
         "-o", dest, url],
        capture_output=True)
    if r.returncode != 0 or not os.path.exists(dest):
        return None
    if os.path.getsize(dest) < 1024:      # error page, not an image
        os.remove(dest)
        return None
    return dest


def normalise(path):
    from PIL import Image
    try:
        im = Image.open(path)
        im.verify()
        im = Image.open(path)
        im = im.convert("RGB")
        if max(im.size) > MAX_EDGE:
            im.thumbnail((MAX_EDGE, MAX_EDGE))
        im.save(path, quality=88)
        return im.size
    except Exception:  # noqa: BLE001
        if os.path.exists(path):
            try:
                os.remove(path)
            except OSError:
                pass
        return None


def main():
    count = int(sys.argv[1]) if len(sys.argv) > 1 else 40
    rows = [r for r in json.load(open(CATALOG, encoding="utf-8")) if r.get("image")]
    os.makedirs(OUT_DIR, exist_ok=True)
    for f in os.listdir(OUT_DIR):
        os.remove(os.path.join(OUT_DIR, f))

    # spread the sample across the catalog rather than taking the first N,
    # which would all be the same few queries
    step = max(1, len(rows) // count)
    sample = rows[::step][:count]

    manifest = []
    for i, r in enumerate(sample, 1):
        dest = os.path.join(OUT_DIR, f"{i:03d}.jpg")
        if not download(r["image"], dest):
            print(f"  [{i}] download failed: {r['name'][:40]}")
            continue
        size = normalise(dest)
        if not size:
            print(f"  [{i}] not an image: {r['name'][:40]}")
            continue
        manifest.append({"file": os.path.basename(dest), "name": r["name"],
                         "price": r["price_toman"], "brand": r.get("brand")})

    with open(os.path.join(OUT_DIR, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=1)

    print(f"\nwrote {len(manifest)} images to {OUT_DIR}")
    print(f"  of {len(rows)} catalog products with images")


if __name__ == "__main__":
    main()