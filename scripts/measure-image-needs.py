"""How wide are the images the site actually shows? Read-only measurement.

Feeds the decision about which variants to generate, instead of guessing a
ladder. Prints, per consumer set, how many source files can actually fill a
given width at a given device pixel ratio.
"""
import pathlib
import sys

from PIL import Image

REPO = pathlib.Path(__file__).resolve().parent.parent
IMG = REPO / "public" / "images"

# The widest CSS box each consumer set is rendered into, measured on
# production 2026-11-21 (screenshots + getBoundingClientRect):
#   listings/*  hero collage 529 (desktop, eager) / rail 255
#   stores/*    explore card + store hero 413 CSS px
#   products/*  listing card ~300 CSS px
CONTEXTS = {
    "listings": [("hero-desktop-2x", 529, 2), ("card-desktop-2x", 397, 2), ("card-2x", 335, 2)],
    "stores": [("card-desktop-2x", 413, 2), ("card-2x", 335, 2)],
    "products": [("card-desktop-2x", 300, 2)],
}


def main() -> int:
    grand = []
    for group, ctxs in CONTEXTS.items():
        files = sorted(p for p in (IMG / group).rglob("*.jpg") if p.is_file())
        if not files:
            continue
        widths = []
        for p in files:
            try:
                widths.append(Image.open(p).size[0])
            except Exception:
                pass
        widths.sort()
        print(f"\n{group}: {len(widths)} jpg, median width {widths[len(widths)//2]}")
        for label, css, dpr in ctxs:
            need = css * dpr
            cover = sum(1 for w in widths if w >= need)
            print(f"  {label:18} needs {need:>5}px  covered by {cover:>4}/{len(widths)}"
                  f"  ({100*cover/len(widths):.0f}%)")
            grand.append((group, label, need, cover, len(widths)))
    return 0


if __name__ == "__main__":
    sys.exit(main())