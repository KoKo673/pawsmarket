# -*- coding: utf-8 -*-
"""
Harvest real Tehran pet businesses (name, address, phone, coords, rating)
through Apify's Google Maps scraper.

Why this exists: Google Places needs an international card, which is not
available here, and OpenStreetMap has only six genuine pet groomers mapped in
all of Tehran. Apify runs the Maps scrape on its own infrastructure, so it
reaches the data we could not.

Tehran is covered district by district so coverage does not depend on the
search ranking of a single city-wide query — that was the weakness that left
OSM at 6 groomers.

Usage:
  APIFY_TOKEN=... PYTHONIOENCODING=utf-8 python scripts/fetch_apify_places.py

Writes scripts/apify_places.json
"""
import json
import os
import re
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "apify_places.json")

ACTOR = "compass~crawler-google-places"
TOKEN = os.environ.get("APIFY_TOKEN", "")

# Tehran districts (محله) — the map is queried per district so every part of
# the city is covered, not just whatever ranks highest city-wide.
DISTRICTS = [
    "منطقه 1 تهران", "منطقه 2 تهران", "منطقه 3 تهران", "منطقه 4 تهران",
    "منطقه 5 تهران", "منطقه 6 تهران", "منطقه 7 تهران", "منطقه 8 تهران",
    "منطقه 9 تهران", "منطقه 10 تهران", "منطقه 11 تهران", "منطقه 12 تهران",
    "منطقه 13 تهران", "منطقه 14 تهران", "منطقه 15 تهران", "منطقه 16 تهران",
    "منطقه 17 تهران", "منطقه 18 تهران", "منطقه 19 تهران", "منطقه 20 تهران",
    "منطقه 21 تهران", "منطقه 22 تهران",
    # well-known neighbourhoods, which the district numbers do not always reach
    "ونک تهران", "سعادت‌آباد تهران", "پونک تهران", "شهرک غرب تهران",
    "نیاوران تهران", "فرمانیه تهران", "زعفرانیه تهران", "ولیعصر تهران",
    "تجریش تهران", "گیشا تهران", "امیرآباد تهران", "یوسف‌آباد تهران",
    "پاسداران تهران", "دروازه گرج تهران", "نارمک تهران", "پیروزی تهران",
    "شهریار تهران", "اسلامشهر", "شهر قدس", "ورامین",
    "پردیس تهران", "شهرک اکباتان", "شهرک آزادی", "صادقیه",
    "مرزداران", "جنت‌آباد", "بهشتی", "قزوین", "افسریه", "مشیریه",
    "خانی‌آباد", "نارود", "سوهانک", "ضرابخانه", "جمهوری",
    # south Tehran — districts 19–22 were only reachable by number
    "شهرک خزانه", "نازی‌آباد", "شهرک آزادی تهران", "یافت‌آباد",
    "شهرک ولیعصر", "دروازه غار", "بمون", "سلسبون", "شهرک راه‌آهن",
    "علی‌آباد", "وحدت", "شهید بروجردی", "غزی‌آباد", "south of Tehran",
    # west Tehran — the districts that search by number never reached
    "تهرانپارس", "شهرک غرب", "اکباتان غرب", "سازمان آب", "آپادانا",
    "مرزداران غرب", "دولت‌آباد", "شهرآرا", "صادقیه غرب", "گاندی",
    "سعادت‌آباد غرب", "شهرک اکباتان غرب", "اتوبان نواب",
    # Karj — the western metro corridor the Tehran-only sweep never touched
    "کرج عظیمیه", "کرج مهرشهر", "کرج گوهردشت", "کرج آزادی",
    "کرج جهانشهر", "کرج کوثرورز", "کرج سه‌راه گوهر", "کرج رج‌بیه",
    "کرج شاندیز", "کرج خیابان فردوسی", "کرج مرداویج", "کرج گوهر",
    "ماهدشت", "کمال‌شهر", "مشکین‌دشت",
    # Karaj's older sibling towns
    "نظرآباد", "محمدشهر کرج", "ماهدشت کرج", "مشکین دشت کرج",
]

# Search terms per business line, combined with each district.
TERMS = {
    "pet_shop": ["پت شاپ", "فروشگاه حیوانات خانگی", "پت‌شاپ"],
    "vet": ["دامپزشکی", "کلینیک دامپزشکی", "بیمارستان دامپزشکی"],
    "groomer": ["آرایشگاه حیوانات خانگی", " grooming حیوانات", "پت استایل"],
    "boarding": ["پانسیون حیوانات", "هتل حیوانات"],
    "shelter": ["پناهگاه حیوانات", "نگهداری حیوانات"],
}

PET_HINT = re.compile(
    r"pet|animal|vet|groom|boarding|shelter|aquarium|bird|dog|cat",
    re.I)
# Tehran and the neighbouring towns we sweep
AREA_HINT = re.compile(
    r"تهران|tehran|اسلامشهر|شهر قدس|ورامین|کرج|شهریار|پردیس|قرمز|بومهن", re.I)


def run_actor(input_payload, wait=600):
    """Run the Apify actor synchronously and return the dataset id."""
    url = (f"https://api.apify.com/v2/acts/{ACTOR}/runs"
           f"?waitForFinish={wait}&token={TOKEN}")
    body = json.dumps(input_payload)
    r = subprocess.run(
        ["curl", "-sS", "--max-time", str(wait + 90),
         "-X", "POST", url,
         "-H", "Content-Type: application/json",
         "--data-binary", body],
        capture_output=True)
    try:
        j = json.loads(r.stdout.decode("utf-8", "replace"))
    except json.JSONDecodeError:
        return None
    if "error" in j:
        print("    API error:", str(j["error"].get("message"))[:140], flush=True)
        return None
    return j["data"]


def fetch_dataset(dataset_id, limit=400):
    url = (f"https://api.apify.com/v2/datasets/{dataset_id}/items"
           f"?limit={limit}&token={TOKEN}")
    r = subprocess.run(["curl", "-sS", "--max-time", "90", url],
                       capture_output=True)
    try:
        return json.loads(r.stdout.decode("utf-8", "replace"))
    except json.JSONDecodeError:
        return []


def to_row(place, term_kind, district):
    title = (place.get("title") or "").strip()
    if not title or not PET_HINT.search(title + " " +
                                       " ".join(place.get("categories") or [])):
        return None
    loc = place.get("location") or {}
    lat, lng = loc.get("lat"), loc.get("lng")
    if lat is None or lng is None:
        return None
    # Guard against results that are not in the area we asked about
    addr = place.get("address") or ""
    if not AREA_HINT.search(f"{addr} {place.get('city','')} "
                             f"{place.get('state','')} "
                             f"{place.get('neighborhood','')}"):
        return None
    return {
        "name": title,
        "kind_hint": term_kind,
        "district_query": district,
        "category": (place.get("categoryName") or "").strip() or None,
        "categories": place.get("categories") or [],
        "address": addr or None,
        "neighborhood": place.get("neighborhood") or None,
        "phone": (place.get("phoneUnformatted")
                  or place.get("phone") or "").strip() or None,
        "website": place.get("url") or None,
        "lat": float(lat),
        "lng": float(lng),
        "rating": place.get("totalScore"),
        "reviews": place.get("reviewsCount"),
        "place_id": place.get("placeId"),
    }


def save(rows):
    """Write results after every single query.

    A full sweep is hundreds of Apify runs and this script can be killed at any
    moment; without an incremental write everything since the last complete run
    is lost — which is exactly what happened to an earlier 245-place sweep.
    """
    tmp = OUT + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, indent=1)
    os.replace(tmp, OUT)


def load_existing():
    if not os.path.exists(OUT):
        return []
    try:
        with open(OUT, encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return []


def main():
    if not TOKEN:
        raise SystemExit("set APIFY_TOKEN first")

    # resume: a previous run may already have covered part of the sweep
    rows = load_existing()
    seen = {r["place_id"] for r in rows if r.get("place_id")}
    done_pairs = {(r.get("district_query"), r.get("kind_hint")) for r in rows}
    if rows:
        print(f"resuming: {len(rows)} places already collected "
              f"({len(done_pairs)} district/kind pairs done)", flush=True)

    districts = DISTRICTS[:] if "--all" in sys.argv else DISTRICTS[:6]
    kinds = list(TERMS)
    runs = 0

    for d_i, district in enumerate(districts, 1):
        for kind in kinds:
            if (district, kind) in done_pairs:
                continue
            terms = TERMS[kind]
            payload = {
                "searchStringsArray": terms,
                "locationQuery": f"{district}, Iran",
                "maxCrawledPlacesPerSearch": 15,
                "languageCode": "fa",
                "countryCode": "ir",
            }
            print(f"[{d_i}/{len(districts)}] {district} · {kind} …", flush=True)
            data = run_actor(payload)
            runs += 1
            if not data or not data.get("defaultDatasetId"):
                save(rows)
                time.sleep(2)
                continue
            items = fetch_dataset(data["defaultDatasetId"])
            added = 0
            for p in items:
                row = to_row(p, kind, district)
                if not row or row["place_id"] in seen:
                    continue
                seen.add(row["place_id"])
                rows.append(row)
                added += 1
            save(rows)          # ← durable after every query
            print(f"    +{added} (total {len(rows)})", flush=True)
            time.sleep(1.5)

    save(rows)

    from collections import Counter
    print(f"\nwrote {OUT}   after {runs} runs")
    print(f"  places: {len(rows)}")
    print(f"  with phone: {sum(1 for r in rows if r['phone'])}")
    print(f"  with address: {sum(1 for r in rows if r['address'])}")
    print("  by kind hint:")
    for k, v in Counter(r["kind_hint"] for r in rows).most_common():
        print(f"    {k:10} {v}")
    print("  top categories:")
    for k, v in Counter(r["category"] for r in rows if r["category"]).most_common(10):
        print(f"    {v:4}  {k[:48]}")


if __name__ == "__main__":
    main()