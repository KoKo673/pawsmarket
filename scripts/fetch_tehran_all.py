# -*- coding: utf-8 -*-
"""
Dump ALL pet-related POIs across greater Tehran (22 districts + شمیرانات جنوبی)
from Overpass API: pet shops, groomers, vets, shelters, boarding, pet cafes.

Output: scripts/tehran_all.json  (same element shape as previous dumps)
Retries across two Overpass endpoints; polite delays.
Run: PYTHONIOENCODING=utf-8 python scripts/fetch_tehran_all.py
"""
import json
import os
import subprocess
import time
import urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "tehran_all.json")
UA = "PawsMarket/1.0 (Tehran pet marketplace research)"

# Greater Tehran incl. Shemiran (north), Ray (south), Kan (west), Eslamshahr fringe
BBOX = "35.48,51.02,35.87,51.68"

QUERY = f"""
[out:json][timeout:120];
(
  node["shop"~"^(pet|pet_food|animal|pet_grooming)$"]({BBOX});
  node["amenity"~"^(veterinary|animal_shelter|animal_boarding|pet_cafe)$"]({BBOX});
  node["healthcare"~"^(veterinary|animal_doctor)$"]({BBOX});
  node["craft"="pet_grooming"]({BBOX});
  way["shop"~"^(pet|pet_food|animal|pet_grooming)$"]({BBOX});
  way["amenity"~"^(veterinary|animal_shelter|animal_boarding|pet_cafe)$"]({BBOX});
  way["craft"="pet_grooming"]({BBOX});
);
out center tags;
""".strip()

ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]


def fetch():
    data = urllib.parse.urlencode({"data": QUERY}).encode()
    for attempt in range(6):
        ep = ENDPOINTS[attempt % len(ENDPOINTS)]
        try:
            r = subprocess.run(
                ["curl", "-sS", "--max-time", "150", "-A", UA,
                 "-H", "Content-Type: application/x-www-form-urlencoded",
                 "--data-binary", data.decode(), ep],
                capture_output=True)
            body = r.stdout.decode("utf-8", "replace")
            if body.lstrip().startswith("{"):
                d = json.loads(body)
                return d
            print(f"attempt {attempt+1}: non-JSON from {ep}: {body[:120]!r}")
        except Exception as exc:  # noqa: BLE001
            print(f"attempt {attempt+1}: {exc}")
        time.sleep(8 + attempt * 4)
    raise SystemExit("Overpass failed after retries")


def main():
    d = fetch()
    els = d.get("elements", [])
    named = [e for e in els if (e.get("tags") or {}).get("name") or (e.get("tags") or {}).get("name:fa")]
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump({"elements": els}, f, ensure_ascii=False)
    print(f"wrote {OUT}: {len(els)} elements, {len(named)} named")
    by_tag = {}
    for e in named:
        t = e["tags"]
        key = t.get("amenity") or t.get("shop") or t.get("craft") or t.get("healthcare") or "?"
        by_tag[key] = by_tag.get(key, 0) + 1
    for k, v in sorted(by_tag.items(), key=lambda kv: -kv[1]):
        print(f"  {k}: {v}")


if __name__ == "__main__":
    main()
