# -*- coding: utf-8 -*-
"""
دانلود عکس اختصاصی هر محصول/دسته از Wikimedia Commons (بدون کلید API).

نسخهٔ ۳: برای هر هدف کوئری‌های متعدد + «کلیدواژه‌های ممنوع» در عنوان تا
نتایج نامربوط (مثلاً کاسهٔ یونانی باستان برای دانهٔ پرنده، گروه Pet Shop Boys
برای فروشگاه) هرگز انتخاب نشوند. تأخیر و retry روی 429 رعایت می‌شود.
خروجی: public/images/products/*.jpg + گزارش عنوان هر انتخاب.
"""
import json
import os
import sys
import subprocess
import time
import urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.join(HERE, "..", "public", "images", "products")
UA = "PawsMarket/1.0 (Tehran pet marketplace research)"

GLOBAL_NEGATIVE = ["map", "chart", "diagram", "logo", "screenshot", "flag", "coat of arms", "blueprint", "stamp", "coin"]

# (slug, [کوئری‌ها به‌ترتیب اولویت], [کلیدواژه‌های ممنوع در عنوان])
TARGETS = [
    ("dog-food", ["kibble dog food", "dry dog food kibble pile", "dog food bag"], ["soaked", "snow", "feeder"]),
    ("cat-food", ["dry cat food kibble", "cat food bowl dry"], ["box sitting"]),
    ("dog-treat", ["dog biscuits bone", "dog treats bakery"], []),
    ("dog-bed", ["orthopedic dog bed", "dog bed pet cushion", "dog sleeping on bed"], ["cat"]),
    ("cat-litter", ["kitty litter", "cat litter box"], ["resting on"]),
    ("bird-seed", ["millet bird seed", "budgie millet spray food", "bird seeds mix"], ["kylix", "vase", "museum", "workshop", "ancient", "archaeolog"]),
    ("bird-cage", ["bird cage parakeet", "canary bird cage"], ["antique", "toy", "museum"]),
    ("bird-toy", ["bird swing perch toy", "budgie swing toy", "parrot perch swing"], ["antique", "wind-up", "museum", "clock"]),
    ("dog-supplement", ["dietary supplement capsules bottle", "fish oil capsules bottle", "vitamin tablets bottle"], ["rose", "geograph", "plant", "flower"]),
    ("cat-diet", ["wet cat food eating", "cat eating from bowl"], []),
    ("pet-shampoo", ["shampooing dog", "dog bath soap"], ["hair", "watsons", "portrait", "wolfhound"]),
    ("dog-bath", ["dog being washed shower", "washing dog bath tub"], ["advertisement", "soap ad", "1951"]),
    ("pet-brush", ["slicker brush grooming", "pet grooming brush tool", "brush for dog fur"], ["geograph", "shop", "groomers", "storefront"]),
    ("dog-towel", ["dog after bath", "towel dog"], ["without", "beach", "1943", "mascot"]),
    ("store-vet", ["veterinarian examining dog", "vet clinic dog stethoscope"], ["guantanamo", "operating room", "prison"]),
    ("store-shelter", ["dogs in animal shelter", "dog shelter kennels indoor", "rescue dogs cages"], ["ride", "event", "parade", "technician"]),
    ("store-shop", ["pet supplies store interior", "pet shop aquarium fish", "pet store shelves products"], ["boys", "band", "concert", "festen"]),
    ("store-grooming", ["groomer trimming dog", "dog haircut scissors grooming"], ["1951", "vintage"]),
    ("store-boarding", ["boarding kennels dogs", "cats in cattery", "cattery cats cages"], ["homestead", "lockport", "house"]),
]


def _curl(url, dest=None):
    cmd = ["curl", "-sSL", "--max-time", "40", "-A", UA, url]
    if dest:
        cmd += ["-o", dest]
        r = subprocess.run(cmd, capture_output=True)
        if r.returncode != 0:
            raise RuntimeError(r.stderr.decode("utf-8", "replace")[:120])
        return None
    r = subprocess.run(cmd, capture_output=True)
    if r.returncode != 0:
        raise RuntimeError(r.stderr.decode("utf-8", "replace")[:120])
    body = r.stdout.decode("utf-8", "replace")
    if "Too Many" in body[:120] or body.lstrip().startswith("429"):
        raise RuntimeError("HTTP 429")
    return body


def search_commons(query, limit=8):
    params = urllib.parse.urlencode(
        {
            "action": "query",
            "generator": "search",
            "gsrsearch": query,
            "gsrnamespace": "6",
            "gsrlimit": str(limit),
            "prop": "imageinfo",
            "iiprop": "url|mime|size",
            "iiurlwidth": "900",
            "format": "json",
            "origin": "*",
        }
    )
    url = "https://commons.wikimedia.org/w/api.php?" + params
    for attempt in range(3):
        try:
            return json.loads(_curl(url))
        except Exception as e:  # noqa: BLE001
            if "429" in str(e) and attempt < 2:
                time.sleep(6)
                continue
            raise
    return {}


def pick_candidate(data, forbidden):
    pages = (data.get("query") or {}).get("pages") or {}
    for page in pages.values():
        infos = page.get("imageinfo") or []
        if not infos:
            continue
        info = infos[0]
        title = page.get("title", "")
        if info.get("mime") not in ("image/jpeg", "image/png", "image/webp"):
            continue
        low = title.lower()
        if any(neg in low for neg in GLOBAL_NEGATIVE + forbidden):
            continue
        if info.get("width", 0) < 640:
            continue
        url = info.get("thumburl") or info.get("url")
        if url:
            return title, url
    return None, None


def download(url, dest):
    _curl(url, dest=dest)
    return os.path.getsize(dest)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    only = set(sys.argv[1:])
    targets = [t for t in TARGETS if not only or t[0] in only]
    report = []
    for slug, queries, forbidden in targets:
        dest = os.path.join(OUT_DIR, slug + ".jpg")
        got = False
        for q in queries:
            try:
                data = search_commons(q)
                title, url = pick_candidate(data, forbidden)
            except Exception as exc:  # noqa: BLE001
                report.append((slug, f"ERR {exc}", q))
                break
            if url:
                size = download(url, dest)
                report.append((slug, "ok", f"{title} | {size}B | via '{q}'"))
                got = True
                break
            time.sleep(3)
        if not got:
            kept = "kept-existing" if os.path.exists(dest) else "MISSING"
            report.append((slug, f"NO-CANDIDATE ({kept})", queries[0]))
        time.sleep(3)
    print(f"{'slug':16} {'status':24} source")
    for slug, status, title in report:
        print(f"{slug:16} {status:24} {str(title)[:88]}")
    ok = sum(1 for r in report if r[1] == "ok")
    print(f"\n{ok}/{len(TARGETS)} fresh; files in dir: {len([f for f in os.listdir(OUT_DIR) if f.endswith('.jpg')])}")


if __name__ == "__main__":
    main()
