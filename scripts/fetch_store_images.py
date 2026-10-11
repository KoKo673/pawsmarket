# -*- coding: utf-8 -*-
"""
Give every shop its own real Google Maps photo.

Why this exists
---------------
537 shops were sharing 8 images — three for all 100+ pet shops, two for all
110+ clinics. Two different neighbourhood vet clinics rendering pixel-identical
photos read as fake data, which is exactly what the front end has to avoid.

Google Places (the official API) needs a foreign card, unavailable here. Apify
runs the same Maps scrape on its own infrastructure and DOES return photos when
driven by `startUrls` rather than a text search — `searchStringsArray` yields
`imagesCount: 0`. That difference is the whole reason this script exists.

What it does
------------
  1. Reads the already-harvested place list (scripts/apify_places.json), so no
     query is repeated and no Apify credit is spent re-discovering places.
  2. For each place, runs the actor on its `place_id` URL to get photo URLs.
  3. Downloads the best few photos into public/images/stores/real/.
  4. Writes scripts/store_images.json: shop name → local file.

Resumable: already-done place ids are skipped, and results are saved after
every place, so a killed run loses at most one place.

Quota
-----
Apify's quota is per ACCOUNT, and a sweep of this size exhausts it (the
response is `Monthly usage hard limit exceeded`). The fetcher therefore takes a
list of tokens and rotates to the next one on a quota error, resuming where it
left off — nothing is lost and nothing is re-fetched.

Usage:
  APIFY_TOKEN=key1,key2 PYTHONIOENCODING=utf-8 python scripts/fetch_store_images.py
Writes: public/images/stores/real/*.jpg, scripts/store_images.json
"""
import hashlib
import io
import json
import os
import re
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
PLACES = os.path.join(HERE, "apify_places.json")
OUTDIR = os.path.join(HERE, "..", "public", "images", "stores", "real")
MAP = os.path.join(HERE, "store_images.json")
DONE = os.path.join(HERE, ".store_images_done.json")

ACTOR = "compass~crawler-google-places"
# Comma-separated; the first one that still has quota is used.
TOKENS = [t.strip() for t in os.environ.get("APIFY_TOKEN", "").split(",") if t.strip()]

PHOTOS_PER_SHOP = 2      # enough for the gallery, not enough to be a crawl
MIN_BYTES = 8000
MAX_EDGE = 900           # card images render at ~600px; 900 keeps it crisp

QUOTA = re.compile(r"usage limit|hard limit|quota", re.I)

_token_idx = 0


class QuotaExhausted(Exception):
    pass


def run_actor(place_id, wait=300):
    """Ask the actor for one place's detail page (this is where photos live)."""
    global _token_idx
    payload = {
        "startUrls": [{"url": f"https://www.google.com/maps/place/?q=place_id:{place_id}"}],
        "maxCrawledPlacesPerSearch": 1,
        "languageCode": "fa",
        "countryCode": "ir",
    }
    body = json.dumps(payload)
    for attempt in range(len(TOKENS)):
        token = TOKENS[_token_idx % len(TOKENS)]
        url = (f"https://api.apify.com/v2/acts/{ACTOR}/runs"
               f"?waitForFinish={wait}&token={token}")
        r = subprocess.run(
            ["curl", "-sS", "--max-time", str(wait + 90), "-X", "POST", url,
             "-H", "Content-Type: application/json", "--data-binary", body],
            capture_output=True)
        try:
            j = json.loads(r.stdout.decode("utf-8", "replace"))
        except json.JSONDecodeError:
            continue
        msg = str((j.get("error") or {}).get("message", ""))
        if j.get("error") and QUOTA.search(msg):
            _token_idx += 1
            if _token_idx % len(TOKENS) == 0:
                raise QuotaExhausted(msg)
            print(f"    (token exhausted, rotating: {msg[:60]})", flush=True)
            continue
        if j.get("error"):
            return None
        return (j.get("data") or {}).get("defaultDatasetId")
    return None


def fetch_items(dataset_id, limit=20):
    token = TOKENS[_token_idx % len(TOKENS)]
    url = (f"https://api.apify.com/v2/datasets/{dataset_id}/items"
           f"?limit={limit}&token={token}")
    r = subprocess.run(["curl", "-sS", "--max-time", "90", url], capture_output=True)
    try:
        return json.loads(r.stdout.decode("utf-8", "replace"))
    except json.JSONDecodeError:
        return []


def photo_urls(place):
    """Collect candidate photo URLs.

    Only the no-crop variants are kept: Google's default crop slices a
    storefront sign — the one thing that identifies the shop — in half.
    """
    urls = []
    for key in ("imageUrls", "photoUrls"):
        for u in place.get(key) or []:
            if isinstance(u, str) and u.startswith("http"):
                urls.append(u)
    u = place.get("imageUrl")
    if isinstance(u, str) and u.startswith("http"):
        urls.append(u)

    out, seen = [], set()
    for u in urls:
        sized = re.sub(r"=w\d+-h\d+-k-no.*$", "", u) + f"=s{MAX_EDGE}-k-no"
        if sized not in seen:
            seen.add(sized)
            out.append(sized)
    return out


def _unlink(path):
    try:
        os.remove(path)
    except OSError:
        pass


def download(url, slot=0):
    # Distinct temp per call, deleted best-effort: on Windows a file handle can
    # outlive curl, and a shared "_dl.tmp" made os.remove raise mid-run.
    tmp = os.path.join(HERE, f"_sd_{slot % 8}.tmp")
    _unlink(tmp)
    r = subprocess.run(["curl", "-sSL", "-o", tmp, "--max-time", "30",
                        "-w", "%{http_code}", url], capture_output=True)
    if r.stdout.decode() != "200" or not os.path.exists(tmp):
        return None
    if os.path.getsize(tmp) < MIN_BYTES:
        _unlink(tmp)
        return None
    with open(tmp, "rb") as f:
        data = f.read()
    _unlink(tmp)
    try:
        from PIL import Image
        with Image.open(io.BytesIO(data)) as im:
            if min(im.size) < 220:
                return None
    except Exception:
        return None
    return data


def load_json(path, default):
    if not os.path.exists(path):
        return default
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return default


def save_json(path, value):
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(value, f, ensure_ascii=False, indent=1)
    os.replace(tmp, path)


def main():
    if not TOKENS:
        raise SystemExit("set APIFY_TOKEN (comma-separated list) first")
    if not os.path.exists(PLACES):
        raise SystemExit("missing apify_places.json — run fetch_apify_places.py")
    os.makedirs(OUTDIR, exist_ok=True)

    places = [p for p in load_json(PLACES, []) if p.get("place_id")]
    mapping = load_json(MAP, {})
    done = set(load_json(DONE, []))

    # Normalise first: the catalog already de-duped these, but doing it again
    # here means a re-run never wastes a query on a shop already photographed.
    seen_geo = set()
    todo = []
    for p in places:
        key = f"{p['name'].strip()}|{round(p['lat'], 3)}|{round(p['lng'], 3)}"
        if key in seen_geo:
            continue
        seen_geo.add(key)
        if p["name"].strip() in mapping or p["place_id"] in done:
            continue
        todo.append(p)

    limit = int(sys.argv[sys.argv.index("--limit") + 1]) if "--limit" in sys.argv else None
    if limit:
        todo = todo[:limit]

    print(f"{len(places)} places · {len(mapping)} already photographed · "
          f"{len(todo)} to go · {len(TOKENS)} token(s)")

    with_photo = no_photo = 0
    dl_slot = 0
    for i, p in enumerate(todo, 1):
        try:
            ds = run_actor(p["place_id"])
        except QuotaExhausted as e:
            print(f"\nquota exhausted on every token ({e}); stopping.",
                  flush=True)
            print(f"saved: {len(mapping)} shops photographed. "
                  f"Re-run later (or with another APIFY_TOKEN) to continue.")
            return
        got = []
        if ds:
            for item in fetch_items(ds):
                for u in photo_urls(item)[:PHOTOS_PER_SHOP]:
                    dl_slot += 1
                    data = download(u, dl_slot)
                    if not data:
                        continue
                    digest = hashlib.sha1(data).hexdigest()[:16]
                    fname = f"{digest}.jpg"
                    fpath = os.path.join(OUTDIR, fname)
                    if not os.path.exists(fpath):
                        with open(fpath, "wb") as f:
                            f.write(data)
                    got.append(f"images/stores/real/{fname}")
                    if len(got) >= PHOTOS_PER_SHOP:
                        break
                if len(got) >= PHOTOS_PER_SHOP:
                    break

        if got:
            mapping[p["name"].strip()] = got
            with_photo += 1
        else:
            no_photo += 1
        done.add(p["place_id"])

        # Save after every place — this run costs real Apify credit per shop.
        save_json(MAP, mapping)
        save_json(DONE, sorted(done))

        if i % 10 == 0 or i == len(todo):
            print(f"  [{i}/{len(todo)}] +{with_photo} with photos, "
                  f"{no_photo} without (total {len(mapping)})", flush=True)
        time.sleep(0.8)

    print(f"\nwrote {MAP}: {len(mapping)} shops have their own photo")
    print(f"  with photos: {with_photo}   without: {no_photo}")


if __name__ == "__main__":
    main()