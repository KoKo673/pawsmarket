# -*- coding: utf-8 -*-
"""Summarise what the Overpass cache has collected so far.

Reads scripts/.overpass-cache/*.json directly, so progress is visible even
while the harvest is still running.
"""
import glob
import json
import os
import re
import sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, ".overpass-cache")

seen = {}
for path in glob.glob(os.path.join(CACHE, "*.json")):
    try:
        with open(path, encoding="utf-8") as f:
            d = json.load(f)
    except Exception:  # noqa: BLE001
        continue
    for e in d.get("elements", []):
        seen[(e.get("type"), e.get("id"))] = e

named = [e for e in seen.values()
         if (e.get("tags") or {}).get("name") or (e.get("tags") or {}).get("name:fa")]

buckets = Counter()
groomers, shelters, boardings = [], [], []
for e in named:
    t = e["tags"]
    fa = t.get("name:fa") or t.get("name") or ""
    blob = " ".join(str(t.get(k, "")) for k in ("name", "name:fa", "shop", "amenity", "craft"))
    if re.search(r"آرایش|استایل|groom", blob, re.I):
        buckets["groomer"] += 1
        groomers.append(fa)
    elif re.search(r"پناهگاه|مهربانی|شelter|rescue", blob, re.I):
        buckets["shelter"] += 1
        shelters.append(fa)
    elif re.search(r"پانسیون|boarding|هتل", blob, re.I):
        buckets["boarding"] += 1
        boardings.append(fa)
    elif re.search(r"دامپزشک|درمانگاه|veterinar", blob, re.I):
        buckets["vet"] += 1
    elif re.search(r"پت ?شاپ|پرنده|خرگوش|آکواریوم|فروشگاه|ماهی", blob, re.I):
        buckets["shop"] += 1
    else:
        buckets["other"] += 1

print(f"cached queries: {len(glob.glob(os.path.join(CACHE, '*.json')))}")
print(f"unique elements: {len(seen)}   named: {len(named)}")
print("\nby category:")
for k, v in buckets.most_common():
    print(f"  {k:10} {v}")

def show(title, items, limit=25):
    if not items:
        return
    print(f"\n{title} ({len(items)}):")
    for n in items[:limit]:
        print("   ", n[:52])
    if len(items) > limit:
        print(f"    … and {len(items) - limit} more")

show("GROOMERS", sorted(set(groomers)))
show("SHELTERS", sorted(set(shelters)))
show("BOARDING", sorted(set(boardings)))