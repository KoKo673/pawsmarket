# -*- coding: utf-8 -*-
"""
Normalise the raw Apify place scrape into catalog rows, discarding anything
that is not verifiably a pet business.

This is the accuracy gate. A raw Google Maps scrape mixes real pet businesses
with:

  · places whose only connection to "pet" is a word in the name while the
    business itself is something else,
  · duplicates of the same shop under slightly different titles,
  · outside the requested area (a "Tehran" search reaches the suburbs),
  · plus-code addresses like "RF22+28X" — technically a location, but not an
    address a visitor could use.

Rules applied here (each one exists because it showed up in the sample):
  1. Google's own category decides the kind. The search term only decides what
     we looked for, not what the business is — "آرایشگاه حیوانات" returns vets,
     and "پت شاپ" returns groomers.
  2. An explicit pet category is REQUIRED. A name containing حیوان/پت is not
     enough on its own.
  3. The place must sit inside the Tehran bounding box, or be one of the named
     neighbouring towns we deliberately sweep.
  4. De-duplicate by place_id and by normalised (name, rounded coords) — the
     same shop appears under several titles across neighbouring searches.
  5. Keep the phone only when it looks like an Iranian number.
  6. Flag rows whose address is a plus code so the UI can show coordinates
     rather than pretending to have a street address.

Usage: PYTHONIOENCODING=utf-8 python scripts/normalize_apify_places.py
Writes scripts/apify_places_clean.json
"""
import json
import os
import re
import unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "apify_places.json")
OUT = os.path.join(HERE, "apify_places_clean.json")

# Greater Tehran plus Karaj and the southern/western metro towns the sweep
# covers. Tehran's south/west alone sit outside a city-centre-centred box.
LAT_RANGE = (35.20, 35.92)
LNG_RANGE = (50.95, 51.75)

# Google's category → our category
CATEGORY_MAP = [
    (r"veterinar|animal hospital|emergency veterinarian", "vet"),
    (r"pet\s*groom|groomer", "groomer"),
    (r"pet\s*boarding|pet hotel|boarding service", "boarding"),
    (r"animal shelter|pet adoption|rescue", "shelter"),
    (r"pet\s*store|pet\s*supply|animal feed|aquarium shop|bird shop", "shop"),
]

# A human barbershop that happens to sit next to the word حیوانات.
HUMAN_HAIRCUT = re.compile(r"آرایشگاه\s*(آقایان|خانم‌ها|مردانه|زنانه|کودک)")

IR_PHONE = re.compile(r"^(?:\+?98|0)?9\d{9}$|^(?:\+?98|0)?2\d{9,10}$")

PLUS_CODE = re.compile(r"\b[A-Z]{2,4}\d{1,3}\+[A-Z0-9]{2,}\b")

DROPPED = {
    "wrong_category": 0,
    "outside_area": 0,
    "human_haircut": 0,
    "duplicate": 0,
    "no_coords": 0,
    "latin_name": 0,
}

# Persian storefronts sometimes trade under a Roman name («Petcenter»,
# «Petshop dr Taghizadeh»). Those are legitimate businesses, but the site is
# Persian-only, so a name the visitor cannot read is worse than omitting the
# row: we have no Persian name to show. A name that is *mostly* Latin is
# dropped; a Persian name that merely contains a Latin brand token is kept.
_LATIN_MAJORITY = 0.5


def latin_ratio(s):
    """Share of letters that are Latin/Greek/Cyrillic rather than Persian."""
    if not s:
        return 1.0
    letters = [c for c in s if c.isalpha()]
    if not letters:
        return 1.0
    latin = sum(1 for c in letters if ord(c) < 0x0530)
    return latin / len(letters)


def norm_text(s):
    """Normalise for comparison: Arabic/Persian variants + spacing."""
    if not s:
        return ""
    s = unicodedata.normalize("NFKC", s)
    s = (s.replace("ي", "ی").replace("ك", "ک")
           .replace("‌", " ").replace("أ", "ا").replace("إ", "ا"))
    s = re.sub(r"[^\w\s]", "", s)
    return re.sub(r"\s+", " ", s).strip().lower()


def classify(category):
    cat = (category or "").lower()
    for pattern, kind in CATEGORY_MAP:
        if re.search(pattern, cat):
            return kind
    return None


def clean_phone(raw):
    if not raw:
        return None
    digits = re.sub(r"[^\d+]", "", str(raw))
    if IR_PHONE.match(digits):
        return digits
    # Google sometimes returns a local format; accept 10-digit numbers too
    if re.fullmatch(r"\d{10}", digits):
        return digits
    return None


def main():
    if not os.path.exists(SRC):
        raise SystemExit(f"missing {SRC} — run scripts/fetch_apify_places.py first")
    rows = json.load(open(SRC, encoding="utf-8"))

    seen_ids, seen_geo = set(), set()
    out = []

    for r in rows:
        name = (r.get("name") or "").strip()
        if not name:
            continue

        kind = classify(r.get("category"))
        if kind is None:
            DROPPED["wrong_category"] += 1
            continue
        if latin_ratio(name) > _LATIN_MAJORITY:
            DROPPED["latin_name"] += 1
            continue
        if HUMAN_HAIRCUT.search(name):
            DROPPED["human_haircut"] += 1
            continue

        lat, lng = r.get("lat"), r.get("lng")
        if lat is None or lng is None:
            DROPPED["no_coords"] += 1
            continue
        if not (LAT_RANGE[0] <= lat <= LAT_RANGE[1]
                and LNG_RANGE[0] <= lng <= LNG_RANGE[1]):
            DROPPED["outside_area"] += 1
            continue

        pid = r.get("place_id")
        if pid and pid in seen_ids:
            DROPPED["duplicate"] += 1
            continue
        geo_key = (norm_text(name), round(lat, 4), round(lng, 4))
        if geo_key in seen_geo:
            DROPPED["duplicate"] += 1
            continue
        if pid:
            seen_ids.add(pid)
        seen_geo.add(geo_key)

        addr = (r.get("address") or "").strip()
        out.append({
            "name": name,
            "category": kind,
            "google_category": r.get("category"),
            "address": None if PLUS_CODE.search(addr) else addr,
            "address_is_plus_code": bool(PLUS_CODE.search(addr)),
            "neighborhood": r.get("neighborhood"),
            "phone": clean_phone(r.get("phone")),
            "website": r.get("website"),
            "lat": round(float(lat), 6),
            "lng": round(float(lng), 6),
            "rating": r.get("rating"),
            "reviews": r.get("reviews"),
            "place_id": pid,
            "source": "google-maps-via-apify",
        })

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)

    from collections import Counter
    print(f"raw {len(rows)} -> clean {len(out)}")
    print("dropped:", ", ".join(f"{k}={v}" for k, v in DROPPED.items()))
    print("\nby category:")
    for k, v in Counter(r["category"] for r in out).most_common():
        print(f"  {k:9} {v}")
    print(f"\nwith phone : {sum(1 for r in out if r['phone'])}/{len(out)}")
    print(f"with street address: "
          f"{sum(1 for r in out if r['address'])}/{len(out)}")
    print(f"with website: {sum(1 for r in out if r['website'])}/{len(out)}")
    print(f"with rating : {sum(1 for r in out if r['rating'])}/{len(out)}")


if __name__ == "__main__":
    main()