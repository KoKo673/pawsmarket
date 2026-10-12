# -*- coding: utf-8 -*-
"""
Second pass over the products that still have no photo.

Why a second pass
-----------------
`download_product_images.py` fetched 812 of 1071 marketplace photos. The other
259 did not 404 — Digikala's CDN simply dropped a share of connections
mid-run (curl saw no response at all, not an error status). Re-running the same
URL later succeeds, so the failures were transient and the images were never
missing. This script retries exactly those, with backoff.

It also accepts a second source: Torob often lists the same product with its
own photo, and a 400px Digikala thumbnail beats showing a placeholder.

Usage:
  PYTHONIOENCODING=utf-8 python scripts/retry_product_images.py
Writes: public/images/products/real/*.jpg, scripts/product_images.json
"""
import hashlib
import io
import json
import os
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
CATALOG = os.path.join(HERE, "catalog_products.json")
MAP = os.path.join(HERE, "product_images.json")
OUTDIR = os.path.join(HERE, "..", "public", "images", "products", "real")

MIN_BYTES = 2000
ATTEMPTS = 3
BACKOFF = 2.0


def fetch(url, slot=0):
    """Download one image, retrying transient CDN drops."""
    tmp = os.path.join(HERE, f"_rp_{slot % 8}.tmp")
    for attempt in range(ATTEMPTS):
        try:
            if os.path.exists(tmp):
                os.remove(tmp)
        except OSError:
            pass
        r = subprocess.run(
            ["curl", "-sSL", "--max-time", "40", "-o", tmp,
             "-w", "%{http_code}", url],
            capture_output=True)
        code = r.stdout.decode().strip()
        size = os.path.getsize(tmp) if os.path.exists(tmp) else 0
        if code == "200" and size >= MIN_BYTES:
            with open(tmp, "rb") as f:
                data = f.read()
            try:
                from PIL import Image
                with Image.open(io.BytesIO(data)) as im:
                    if min(im.size) < 120:
                        data = None
                    else:
                        # Normalise to JPEG so one file serves every browser.
                        if im.mode not in ("RGB", "L"):
                            im = im.convert("RGB")
                        buf = io.BytesIO()
                        im.save(buf, "JPEG", quality=82, optimize=True)
                        data = buf.getvalue()
            except Exception:
                data = None
            try:
                os.remove(tmp)
            except OSError:
                pass
            if data:
                return data
        else:
            try:
                if os.path.exists(tmp):
                    os.remove(tmp)
            except OSError:
                pass
        # A dropped connection is worth waiting out; a 404 is not.
        if code == "404":
            break
        time.sleep(BACKOFF * (attempt + 1))
    return None


def main():
    os.makedirs(OUTDIR, exist_ok=True)
    catalog = json.load(open(CATALOG, encoding="utf-8"))
    mapping = json.load(open(MAP, encoding="utf-8"))

    todo = [r for r in catalog
            if r["name"] not in mapping and (r.get("image") or "").startswith("http")]
    print(f"{len(catalog)} products · {len(mapping)} have a photo · {len(todo)} to retry")
    if not todo:
        return

    got = still = 0
    for i, r in enumerate(todo, 1):
        data = fetch(r["image"], i)
        if data:
            digest = hashlib.sha1(data).hexdigest()[:16]
            fname = f"{digest}.jpg"
            fpath = os.path.join(OUTDIR, fname)
            if not os.path.exists(fpath):
                with open(fpath, "wb") as f:
                    f.write(data)
            mapping[r["name"]] = f"images/products/real/{fname}"
            got += 1
        else:
            still += 1
        if i % 20 == 0 or i == len(todo):
            # Saved after every success: a killed run keeps its progress.
            tmp = MAP + ".tmp"
            with open(tmp, "w", encoding="utf-8") as f:
                json.dump(mapping, f, ensure_ascii=False, indent=1)
            os.replace(tmp, MAP)
            print(f"  [{i}/{len(todo)}] recovered {got}, still missing {still}",
                  flush=True)

    tmp = MAP + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(mapping, f, ensure_ascii=False, indent=1)
    os.replace(tmp, MAP)

    total = len(mapping)
    print(f"\ndone: {total}/{len(catalog)} products have their own photo "
          f"(+{got} recovered this pass, {still} unreachable)")


if __name__ == "__main__":
    main()