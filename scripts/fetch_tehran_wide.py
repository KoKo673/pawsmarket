# -*- coding: utf-8 -*-
"""
Wide Tehran POI harvest — shaped by measured mirror behaviour, not guesses.

Benchmarking this mirror (office/_research/bench.txt) showed:
  * plain key=value tag filters ("amenity"="veterinary") time out consistently
  * regex name filters (["name"~"...",i]) answer fast, even with Persian text
  * "shop"="pet" is fast and returns the bulk of the data

So the sweep leans on name-regex selectors (which also find under-tagged
businesses like «آرایشگاه حیوانات ژیوان» that carry no shop=pet tag), and keeps
only the cheap exact tag filters. Failed selectors are retried a few times then
skipped — the cache means nothing already fetched is lost.

Output: scripts/tehran_wide.json

Run: PYTHONIOENCODING=utf-8 python scripts/fetch_tehran_wide.py [--tiles 3]
"""
import json
import os
import re
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from osmq import build, query  # noqa: E402

OUT = os.path.join(HERE, "tehran_wide.json")
FULL = (35.45, 50.98, 35.90, 51.72)

# (label, selector-inner, tries)
# inner only — build() adds the [ ] and the bbox group
SELECTORS = [
    # exact tags that the mirror answers quickly
    ('tag:shop=pet',      '"shop"="pet"', 6),
    ('tag:animal_boarding', '"amenity"="animal_boarding"', 4),

    # name regexes — fast, and catch un-tagged businesses.
    # NOTE: a bare «آرایش» selector returns ~140 HUMAN barbershops, so every
    # grooming pattern must name an animal; the seeder also filters these out.
    ('name:groom-pet', r'"name"~"آرایش.{0,12}(حیوان|سگ|گربه|پت)|گرومینگ",i', 8),
    ('name:fa-groom-pet', r'"name:fa"~"آرایش.{0,12}(حیوان|سگ|گربه|پت)|گرومینگ"', 8),
    ('name:groom-shop', r'"name"~"آرایشگاه (سگ|پت|حیوان)|پت ?استایل|استایلیست",i', 8),
    ('name:petshop', r'"name"~"پت ?شاپ",i', 8),
    ('name:fa-petshop', r'"name:fa"~"پت ?شاپ"', 8),
    ('name:vet',     r'"name"~"دامپزشک|حیوان‌درمانگاه",i', 8),
    ('name:fa-vet',  r'"name:fa"~"دامپزشک|حیوان‌درمانگاه"', 8),
    ('name:vet-clinic', r'"name"~"کلینیک.*(دامپزشک|حیوان)|بیمارستان دامپزشکی",i', 6),
    ('name:shelter', r'"name"~"پناهگاه|مهربانی حیوانات|نگهداری بی‌سرپرست|شلت",i', 8),
    ('name:fa-shelter', r'"name:fa"~"پناهگاه|مهربانی حیوانات"', 8),
    ('name:boarding', r'"name"~"پانسیون|هتل (کانیس|حیوان|پت)|نگهداری حیوان",i', 8),
    ('name:fa-boarding', r'"name:fa"~"پانسیون|نگهداری حیوان"', 8),
    ('name:supplies', r'"name"~"فروشگاه حیوانات|لوازم حیوانات|فروشگاه پت",i', 6),
    ('name:fa-supplies', r'"name:fa"~"فروشگاه حیوانات|لوازم حیوانات"', 6),
    ('name:birds',   r'"name"~"پرنده|قناری|لوتینو|فینچ",i', 5),
    ('name:fa-birds', r'"name:fa"~"پرنده|قناری"', 5),
    ('name:rabbit',  r'"name"~"خرگوش|همستر|جوندگان|خزنده",i', 5),
    ('name:fa-rabbit', r'"name:fa"~"خرگوش|همستر|جوندگان"', 5),
    ('name:aquarium', r'"name"~"آکواریوم|ماهی زینتی|ماهی فروش",i', 5),
    ('name:fa-aquarium', r'"name:fa"~"آکواریوم|ماهی زینتی"', 5),
]


def tile_grid(bbox, n):
    s, w, nn, e = bbox
    return [(s + (nn - s) * i / n, w + (e - w) * j / n,
             s + (nn - s) * (i + 1) / n, w + (e - w) * (j + 1) / n)
            for i in range(n) for j in range(n)]


def classify(els):
    from collections import Counter
    b = Counter()
    for e in els:
        t = e.get("tags", {})
        blob = " ".join(str(t.get(k, "")) for k in
                        ("name", "name:fa", "shop", "amenity", "craft"))
        if re.search(r"آرایش|استایل|groom", blob, re.I):
            b["groomer"] += 1
        elif re.search(r"پناهگاه|مهربانی|شelter", blob, re.I):
            b["shelter"] += 1
        elif re.search(r"پانسیون|boarding|هتل", blob, re.I):
            b["boarding"] += 1
        elif re.search(r"دامپزشک|درمانگاه|veterinar", blob, re.I):
            b["vet"] += 1
        elif re.search(r"پت ?شاپ|پرنده|خرگوش|آکواریوم|فروشگاه", blob, re.I):
            b["shop"] += 1
        else:
            b["other"] += 1
    return b


def main():
    tiles_n = 3
    if "--tiles" in sys.argv:
        tiles_n = int(sys.argv[sys.argv.index("--tiles") + 1])

    tiles = tile_grid(FULL, tiles_n)
    print(f"{len(tiles)} tiles x {len(SELECTORS)} selectors "
          f"= {len(tiles) * len(SELECTORS)} queries", flush=True)

    seen = {}
    per_sel = {}
    # seed from any previous partial run so a kill never loses work
    if os.path.exists(OUT):
        try:
            with open(OUT, encoding="utf-8") as f:
                for e in json.load(f).get("elements", []):
                    seen[(e.get("type"), e.get("id"))] = e
            print(f"resumed with {len(seen)} elements from a previous run", flush=True)
        except Exception:  # noqa: BLE001
            pass

    def save():
        tmp = OUT + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump({"elements": list(seen.values())}, f, ensure_ascii=False)
        os.replace(tmp, OUT)

    save()
    for idx, bbox in enumerate(tiles, start=1):
        new_here = 0
        for label, sel, tries in SELECTORS:
            data = query(build(bbox, sel, timeout=45), tries=tries, verbose=False)
            els = (data or {}).get("elements", []) if data else []
            per_sel[label] = per_sel.get(label, 0) + len(els)
            for e in els:
                key = (e.get("type"), e.get("id"))
                if key not in seen:
                    seen[key] = e
                    new_here += 1
            time.sleep(0.8)
        # save after every tile AND every few selectors, so a timeout kill
        # never costs more than a few queries (the mirror stalls for minutes)
        save()
        print(f"tile {idx}/{len(tiles)}: +{new_here} new (total {len(seen)})", flush=True)

    els = list(seen.values())
    named = [e for e in els
             if (e.get("tags") or {}).get("name") or (e.get("tags") or {}).get("name:fa")]
    print(f"\nWROTE {OUT}")
    print(f"  elements: {len(els)}   named: {len(named)}")
    print("  per-selector hits:")
    for label, n in sorted(per_sel.items(), key=lambda kv: -kv[1]):
        print(f"    {label:22} {n}")
    print("  rough classification:")
    for k, v in classify(named).most_common():
        print(f"    {k:10} {v}")


if __name__ == "__main__":
    main()