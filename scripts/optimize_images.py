# -*- coding: utf-8 -*-
"""
Shrink the bundled product and shop photos.

Why
---
The catalog images are served from GitHub Pages exactly as downloaded: some
are 900 KB, and a grid of 48 product cards could pull 20 MB. On a phone that
is tens of seconds of blank cards, which is what "the app loads slowly"
actually was.

A card renders its photo at most ~400 px wide, so anything beyond ~800 px on
the long edge is detail nobody sees, paid for on every page view. This
re-encodes to that bound at quality 78, which is visually indistinguishable
in the grid and the detail sheet while cutting the payload by roughly 4×.

Idempotent: an image already within the bound and under the size budget is
left untouched, and a file is only replaced when the result is genuinely
smaller (a re-encode can grow an already-optimised JPEG).

Usage:
  PYTHONIOENCODING=utf-8 python scripts/optimize_images.py [--dry-run]
"""
import argparse
import io
import os
import sys

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
PUBLIC = os.path.join(HERE, "..", "public", "images")

MAX_EDGE = 820
QUALITY = 78
# Below this, re-encoding saves nothing worth the generation loss.
SKIP_BELOW = 90 * 1024


def optimize(path, dry):
    size = os.path.getsize(path)
    try:
        with Image.open(path) as im:
            w, h = im.size
            long_edge = max(w, h)
            if size <= SKIP_BELOW and long_edge <= MAX_EDGE:
                return 0, 0, "already small"
            if im.mode not in ("RGB", "L"):
                im = im.convert("RGB")
            if long_edge > MAX_EDGE:
                scale = MAX_EDGE / long_edge
                im = im.resize((max(1, round(w * scale)),
                                max(1, round(h * scale))),
                               Image.LANCZOS)
            buf = io.BytesIO()
            im.save(buf, "JPEG", quality=QUALITY, optimize=True,
                    progressive=True)
    except Exception as exc:  # noqa: BLE001
        return 0, 0, f"skipped ({str(exc)[:40]})"

    new = buf.getvalue()
    if len(new) >= size * 0.92:
        return 0, 0, "no gain"
    if not dry:
        with open(path, "wb") as f:
            f.write(new)
    return size, len(new), "ok"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    before = after = changed = skipped = 0
    for root, _dirs, files in os.walk(PUBLIC):
        for name in sorted(files):
            if not name.lower().endswith((".jpg", ".jpeg")):
                continue
            path = os.path.join(root, name)
            b, a, why = optimize(path, args.dry_run)
            if why == "ok":
                changed += 1
                before += b
                after += a
            else:
                skipped += 1

    print(f"images optimised : {changed}")
    print(f"left untouched   : {skipped}")
    if changed:
        print(f"before           : {before / 1e6:.1f} MB")
        print(f"after            : {after / 1e6:.1f} MB "
              f"({100 - after * 100 / max(1, before):.0f}% smaller)")
    if args.dry_run:
        print("(dry run — nothing written)")
    return 0


if __name__ == "__main__":
    sys.exit(main())