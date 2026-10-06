# -*- coding: utf-8 -*-
"""Merge everything in the Overpass query cache into tehran_wide.json.

Lets the harvest be killed and restarted without losing completed queries —
the cache is the durable record, the dump is just the merged view.
"""
import glob
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, ".overpass-cache")
OUT = os.path.join(HERE, "tehran_wide.json")

seen = {}
if os.path.exists(OUT):
    with open(OUT, encoding="utf-8") as f:
        for e in json.load(f).get("elements", []):
            seen[(e.get("type"), e.get("id"))] = e
before = len(seen)

files = glob.glob(os.path.join(CACHE, "*.json"))
for path in files:
    try:
        with open(path, encoding="utf-8") as f:
            d = json.load(f)
    except Exception:  # noqa: BLE001
        continue
    for e in d.get("elements", []):
        seen[(e.get("type"), e.get("id"))] = e

tmp = OUT + ".tmp"
with open(tmp, "w", encoding="utf-8") as f:
    json.dump({"elements": list(seen.values())}, f, ensure_ascii=False)
os.replace(tmp, OUT)

named = [e for e in seen.values()
         if (e.get("tags") or {}).get("name") or (e.get("tags") or {}).get("name:fa")]
print(f"cached queries: {len(files)}")
print(f"elements: {before} -> {len(seen)}   named: {len(named)}")
print(f"wrote {OUT}")