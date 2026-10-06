# -*- coding: utf-8 -*-
"""Crop an image to remove a corner watermark, reframing on the subject.

Strategy: crop the watermark corner off and return the remaining rectangle
(no synthetic fill — that produced visible black voids). Callers pick the
crop box so the subject stays framed.

Usage: PYTHONIOENCODING=utf-8 python scripts/crop_watermark.py <src> <dst> [fx] [fy]
   fx/fy = fraction of width/height removed from the RIGHT/BOTTOM (default .42/.30)
"""
import sys

from PIL import Image

src, dst = sys.argv[1], sys.argv[2]
fx = float(sys.argv[3]) if len(sys.argv) > 3 else 0.42
fy = float(sys.argv[4]) if len(sys.argv) > 4 else 0.30

im = Image.open(src).convert("RGB")
w, h = im.size
out = im.crop((0, 0, int(w * (1 - fx)), int(h * (1 - fy))))
if max(out.size) > 1100:
    out.thumbnail((1100, 1100))
out.save(dst, quality=90)
print(f"{w}x{h} -> {out.size}")