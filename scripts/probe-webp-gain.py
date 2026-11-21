"""Measure what webp actually saves on this project's images. Read-only.

Samples deterministic slices from each consumer set and reports per-file and
aggregate byte savings, so the conversion decision rests on numbers from the
real corpus rather than on a rule of thumb about webp.
"""
import io
import pathlib
import sys

from PIL import Image

REPO = pathlib.Path(__file__).resolve().parent.parent
IMG = REPO / "public" / "images"


def encode(img: Image.Image, w: int, quality: int = 82) -> bytes:
    if img.width > w:
        img = img.resize((w, round(w * img.height / img.width)), Image.LANCZOS)
    buf = io.BytesIO()
    img.convert("RGB").save(buf, "WEBP", quality=quality, method=6)
    return buf.getvalue()


def main() -> int:
    for group in ("listings", "stores", "products"):
        files = sorted(p for p in (IMG / group).rglob("*.jpg") if p.is_file())
        # deterministic slice: every Nth file, 30 samples
        step = max(1, len(files) // 30)
        sample = files[::step][:30]
        orig = saved = 0
        worst = []
        for p in sample:
            try:
                im = Image.open(p)
            except Exception:
                continue
            ob = p.stat().st_size
            wb = len(encode(im, 660))
            orig += ob
            saved += wb
            worst.append((ob and wb / ob, p.name, ob, wb))
        if not orig:
            continue
        worst.sort()
        print(f"\n{group}: {len(sample)} sampled, {orig/1024:.0f} KB -> "
              f"{saved/1024:.0f} KB  ({orig/saved:.2f}x)")
        print("  best  :", *[f"{r:.2f} {n} {o//1024}->{w//1024}K" for r, n, o, w in worst[:2]], sep="\n    ")
        print("  worst :", *[f"{r:.2f} {n} {o//1024}->{w//1024}K" for r, n, o, w in worst[-2:]], sep="\n    ")
        bigger = [x for x in worst if x[0] > 1.0]
        print(f"  files where webp was BIGGER: {len(bigger)}/{len(worst)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())