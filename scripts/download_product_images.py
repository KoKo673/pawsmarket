# -*- coding: utf-8 -*-
"""
Download the real product photos behind the catalog and give each product its
own local file.

Why this exists
---------------
Every listing's photo was falling back to a category stock image. The catalog
holds 1071 real Iranian products — Digikala/Torob names, Toman prices and CDN
photo URLs — but the `products` table has no image column and
`src/data/products.ts` maps only ~30 hand-written titles. So «غذای ماهی قرمز و
گوپی میکس» rendered the dog-kibble-and-a-paw photo simply because no mapping
existed. A wrong photo is worse than none: it tells the shopper the shop sells
something else.

What it does
------------
  1. Reads scripts/catalog_products.json (the merged Digikala+Torob catalog).
  2. Downloads each distinct source photo to public/images/products/real/.
  3. Names the file by the SHA-1 of its own bytes, so the same photo shared by
     ten product rows is stored (and served) once.
  4. Writes scripts/product_images.json mapping product name → local path,
     which scripts/seed_real_shops.py folds into the generated TS.

Photos are bundled rather than hot-linked on purpose: Digikala's CDN 403s
cross-origin requests from a browser, and a catalogue that shows paw icons
whenever the CDN rate-limits is not a product.

Usage:
  PYTHONIOENCODING=utf-8 python scripts/download_product_images.py [--limit N]
Writes: public/images/products/real/*.jpg, scripts/product_images.json
"""
import hashlib
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
CATALOG = os.path.join(HERE, "catalog_products.json")
OUTDIR = os.path.join(HERE, "..", "public", "images", "products", "real")
MAP = os.path.join(HERE, "product_images.json")

MIN_BYTES = 2000          # a 1 KB "image" is an error page, not a photo
MIN_W, MIN_H = 100, 100   # reject tracking pixels and 1×1 spacers
TIMEOUT = 30


def _unlink(path):
    try:
        os.remove(path)
    except OSError:
        pass


def download(url, slot=0):
    """Fetch a photo, returning its bytes or None if unusable."""
    # A per-call temp name, and a best-effort delete: on Windows an indexer or
    # scanner can hold the file open for a moment after curl exits, and a shared
    # "_dl.tmp" both raced and raised PermissionError mid-run (201 files in).
    tmp = os.path.join(HERE, f"_dl_{slot % 8}.tmp")
    if os.path.exists(tmp):
        try:
            os.remove(tmp)
        except OSError:
            pass
    r = subprocess.run(
        ["curl", "-sSL", "-o", tmp, "--max-time", str(TIMEOUT),
         "-w", "%{http_code}", url],
        capture_output=True)
    if r.stdout.decode() != "200" or not os.path.exists(tmp):
        return None
    if os.path.getsize(tmp) < MIN_BYTES:
        _unlink(tmp)
        return None
    with open(tmp, "rb") as f:
        data = f.read()
    _unlink(tmp)

    # Verify it really decodes as an image, and is not a hairline sliver.
    # A wrong-format or 1×1 file served as a product photo looks broken.
    try:
        from PIL import Image  # optional; falls back to bytes-only checks
        import io
        with Image.open(io.BytesIO(data)) as im:
            w, h = im.size
            if w < MIN_W or h < MIN_H:
                return None
            im.verify()
    except ImportError:
        if not (data[:2] == b"\xff\xd8" or data[:8] == b"\x89PNG\r\n\x1a\n"):
            return None
    except Exception:
        return None
    return data


def main():
    if not os.path.exists(CATALOG):
        raise SystemExit(f"missing {CATALOG} — run scripts/merge_sources.py first")
    os.makedirs(OUTDIR, exist_ok=True)

    rows = json.load(open(CATALOG, encoding="utf-8"))
    rows = [r for r in rows if (r.get("image") or "").startswith("http")]
    limit = None
    if "--limit" in sys.argv:
        limit = int(sys.argv[sys.argv.index("--limit") + 1])

    # One download per distinct URL, not per product row: the same bag of food
    # is listed under several sellers and re-fetching it wasted most of the run.
    by_url = {}
    for r in rows:
        by_url.setdefault(r["image"], []).append(r["name"])

    print(f"{len(rows)} products, {len(by_url)} distinct source photos")
    if limit:
        keep = list(by_url.items())[:limit]
        by_url = dict(keep)
        print(f"limited to {len(by_url)} photos")

    mapping = {}
    stored = {}
    failed = 0
    for i, (url, names) in enumerate(by_url.items(), 1):
        data = download(url, i)
        if data is None:
            failed += 1
            continue
        digest = hashlib.sha1(data).hexdigest()[:16]
        fname = f"{digest}.jpg"
        fpath = os.path.join(OUTDIR, fname)
        if not os.path.exists(fpath):
            with open(fpath, "wb") as f:
                f.write(data)
        stored[digest] = len(data)
        rel = f"images/products/real/{fname}"
        for n in names:
            mapping[n.strip()] = rel
        if i % 25 == 0:
            print(f"  [{i}/{len(by_url)}] stored {len(stored)}  failed {failed}",
                  flush=True)

    # Names that had no usable photo of their own fall back to any photo of a
    # *related* product, so they still get something honest rather than the
    # generic category shot. Never a mismatched image — only same-category.
    print(f"\nstored {len(stored)} unique photos "
          f"({sum(stored.values()) / 1e6:.1f} MB), failed {failed}")
    print(f"products covered: {len(mapping)}/{len(rows)}")

    tmp = MAP + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(mapping, f, ensure_ascii=False, indent=1)
    os.replace(tmp, MAP)
    print(f"wrote {MAP}")


if __name__ == "__main__":
    main()