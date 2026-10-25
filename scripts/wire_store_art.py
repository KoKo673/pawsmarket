# -*- coding: utf-8 -*-
"""Point shops without a photo at a generated category image.

Two problems this addresses, both measured:

* **570 of 757 shops have no photo of their own.** Their enrichment points at
  `images/stores/placeholder/<hash>.svg`, a generated gradient reading «تصویر
  ثبت نشده است». The card then shows a coloured panel with the shop's name in
  the middle — not a photo at all.

* **Sharing one image per category is not good enough either.** The original
  8-image scheme put identical photos on 100+ clinics, which store_images.py
  was written to fix: pixel-identical photos read as fake data.

So each category gets a small pool (`public/images/stores/generated/`) and
shops are dealt across it by a hash of their name. Neighbours in the list get
different pictures, and a shop's picture never changes between builds because
the hash is stable.

Real Google Maps photos are left alone. They are the shop's actual premises,
and a generated image is not a substitute for that claim — only a stand-in
when there is no claim to make.

    python scripts/wire_store_art.py            # dry run, prints the plan
    python scripts/wire_store_art.py --write    # edits src/data/shops.ts
"""
import argparse
import hashlib
import io
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SHOPS = os.path.join(ROOT, "src", "data", "shops.ts")
GEN = "images/stores/generated"

# The pool each category is dealt from. `vet` keeps its original `vet.jpg`
# first so the picture a clinic already shows does not change under it.
POOLS = {
    "vet": ["vet", "vet-a", "vet-b", "vet-c"],
    "shop": ["shop", "shop-a", "shop-b", "shop-c"],
    # `groomer` is excluded on purpose. Four attempts — two of them with the
    # scene rewritten from scratch, no table, no bar, no salon in the prompt —
    # all came back with a dog looped to an overhead restraint arm. The model
    # reconstructs "grooming salon" from the concept, not from the words, and
    # that arm reads as a clinic cage rather than a salon, which is exactly
    # what the user objected to.
    #
    # A fifth attempt is not worth $0.012 when two clean images already
    # exist. Two pictures across 22 salons beats one of them being wrong.
    "groomer": ["groomer-a", "groomer-b"],
    "boarding": ["boarding", "boarding-a", "boarding-b"],
    "shelter": ["shelter", "shelter-a"],
    "cafe": ["cafe"],
}

# Real photos that say the wrong thing about the business.
#
# Picked by looking at all 187 on a contact sheet, not by file size — every
# one of these passes the only automated filter (`MIN_BYTES` in
# fetch_store_images.py), which admits anything over 8 KB. A photo of a sick
# puppy on a soiled mat is a large file; size says nothing about whether the
# picture belongs on a listing.
#
# Keyed by shop name rather than contact-sheet index, because the index only
# means something relative to one sort order.
REJECT = {
    "کلینیک دامپزشکی دانشگاه تهران",   # puppy on a soiled mat, tiled corridor
    "بیمارستان دامپزشکی شرق",          # shih tzu held up by the scruff
    "کلینیک دامپزشکی نبض",             # extreme close-up, eyes shut, unflattering
    "بیمارستان دامپزشکی مهر",          # empty tiled room, no shop visible
    "کلینیک دامپزشکی ستاره ری",        # bare corridor with one cupboard
}


def stable_index(name, n):
    """Same shop → same picture, every build. hash() is salted per process,
    so it cannot be used here."""
    h = hashlib.sha1(name.encode("utf-8")).hexdigest()
    return int(h[:8], 16) % n


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true")
    args = ap.parse_args()

    text = io.open(SHOPS, encoding="utf-8").read()
    entries = list(re.finditer(r'\n  "([^"]+)": \{(.*?)\n  \}', text, re.S))
    print(f"entries: {len(entries)}")

    edits = []          # (start, end, new_body)
    counts = {}
    changed = 0
    kept_real = 0

    for m in entries:
        name, body = m.group(1), m.group(2)
        img = re.search(r'image:\s*"([^"]+)"', body)
        cat = re.search(r'category:\s*"([^"]+)"', body)
        if not img or not cat:
            continue
        category = cat.group(1)
        current = img.group(1)

        if "placeholder" not in current and name not in REJECT:
            kept_real += 1
            continue

        pool = POOLS.get(category)
        if not pool:
            continue
        pick = pool[stable_index(name, len(pool))]
        new_path = f"{GEN}/{pick}.jpg"
        if new_path == current:
            continue
        body2 = body.replace(current, new_path, 1)
        edits.append((m.start(2), m.end(2), body2))
        counts[category] = counts.get(category, 0) + 1
        changed += 1

    print(f"placeholder shops re-pointed: {changed}")
    for k in sorted(counts):
        print(f"   {k:9} {counts[k]:4}  -> pool of {len(POOLS[k])}")
    print(f"real photos left alone:      {kept_real}")

    if not args.write:
        print("\ndry run — pass --write to apply")
        return

    # Apply from the end so earlier offsets stay valid.
    out = text
    for start, end, body2 in sorted(edits, key=lambda e: e[0], reverse=True):
        out = out[:start] + body2 + out[end:]
    io.open(SHOPS, "w", encoding="utf-8").write(out)
    print(f"\nwrote {SHOPS}")


if __name__ == "__main__":
    main()
