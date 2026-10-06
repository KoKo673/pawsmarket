# -*- coding: utf-8 -*-
"""Round-2 fetch for image targets whose round-1 candidates all failed QA.

Only Commons (reliable) + Openverse, with tighter queries. Writes
<target>__r2<n>.jpg so round-1 winners stay untouched.
Run: PYTHONIOENCODING=utf-8 python scripts/fetch_image_candidates2.py
"""
import json
import os
import subprocess
import time
import urllib.parse

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(os.path.join(HERE, "..", "..", "_research", "img-candidates"))
UA = "PawsMarket/1.0 (Tehran pet marketplace image research)"
PER_TARGET = 3

BAD_TITLE_TOKENS = (
    "logo", "map", "diagram", "screenshot", "icon", "chart", "poster",
    "paint", "drawing", "sketch", "engraving", "lithograph", "woodcut",
    "19", "18", "vintage", "1940", "1950", "1960", "1970", "stamp",
    "coin", "medal", "statue", "monument", "grave", "cemet",
    "war", "soldier", "military", "prison", "cattle", "sheep", "pig",
    "cow", "horse", "cougar", "lion", "wildlife", "road",
)

TARGETS = {
    # kibble / dry food — the old one was an open bag in a plastic sack
    "dog-food": [
        "Hundefutter Trockenfutter Schüssel",
        "dog kibble bowl",
        "Trockenfutter Hund Napf",
    ],
    "puppy-food": [
        "Welpenfutter Schüssel",
        "puppy food bowl",
        "Kibble Welpe Fressen",
    ],
    # pet bed (round 1 returned only a pencil sketch)
    "dog-bed": [
        "Hundebett",
        "dog bed basket",
        "Hund Kissen Bett",
    ],
    # cat prescription food — round 1 all amateur flash shots
    "cat-diet": [
        "Katzenfutter Schüssel",
        "cat food bowl kibble",
        "Katze frisst Futter",
    ],
    # grooming — modern salon/bath/trim, not 1951 archive
    "store-grooming": [
        "Hund baden Friseur",
        "dog grooming salon professional",
        "Hundefriseur",
    ],
    "groomer-2": [
        "Hund baden Friseur",
        "dog grooming table professional",
        "Hundefriseur Salon",
    ],
    "groomer-3": [
        "Hund föhnen Trimmen",
        "dog haircut scissors groomer",
        "Welpe Bad Friseur",
    ],
    # shelter — hopeful rescue tone
    "shelter-2": [
        "Tierheim Hunde Zwinger",
        "animal shelter dogs indoor",
        "Tierschutzverein Hunde",
    ],
    "boarding-2": [
        "Katzenpension",
        "cattery indoor cats",
        "Tierpension Katzen",
    ],
    "dog-collar": [
        "Hundehalsband",
        "dog leash collar product",
        "Hundeleine Halsband",
    ],
    "pet-carrier": [
        "Hundetransportbox",
        "pet carrier box",
        "Tiertransportbox",
    ],
    "rabbit-food": [
        "Kaninchen Futter Napf",
        "rabbit eating pellets",
        "Hasen Futter",
    ],
    # shelter + boarding pools used by STORE_POOLS
    "shelter-1": [
        "Tierheim Hunde Zwinger",
        "shelter dogs indoor kennel",
        "Tierschutz Hunde Pflege",
    ],
    "boarding-1": [
        "Katzenpension",
        "cattery cats indoor room",
        "Tierpension",
    ],
    "shop-4": [
        "Tierhandlung Geschäft",
        "pet supplies store interior",
        "Zoohandlung Regale",
    ],
}


def curl(url, dest=None, tries=3):
    cmd = ["curl", "-sSL", "--max-time", "45", "-A", UA, url]
    if dest:
        cmd += ["-o", dest]
    for _ in range(tries):
        r = subprocess.run(cmd, capture_output=True)
        if r.returncode == 0:
            return None if dest else r.stdout.decode("utf-8", "replace")
        time.sleep(4)
    raise RuntimeError("curl failed")


def commons(query, want=10):
    params = urllib.parse.urlencode({
        "action": "query", "generator": "search", "gsrsearch": query,
        "gsrnamespace": "6", "gsrlimit": str(want), "prop": "imageinfo",
        "iiprop": "url|mime|size", "iiurlwidth": "1100", "format": "json",
    })
    for _ in range(3):
        try:
            d = json.loads(curl("https://commons.wikimedia.org/w/api.php?" + params))
        except Exception:
            time.sleep(6)
            continue
        out = []
        for page in (d.get("query") or {}).get("pages", {}).values():
            infos = page.get("imageinfo") or []
            if not infos:
                continue
            info = infos[0]
            title = page.get("title", "")
            low = title.lower()
            if any(tok in low for tok in BAD_TITLE_TOKENS):
                continue
            if info.get("mime") not in ("image/jpeg", "image/png"):
                continue
            if info.get("width", 0) < 800:
                continue
            u = info.get("thumburl") or info.get("url")
            if u:
                out.append((title, u))
        return out
    return []


def openverse(query, want=8):
    url = ("https://api.openverse.org/v1/images/?q=" + urllib.parse.quote(query)
           + f"&license_type=commercial&page_size={want}&mature=false")
    try:
        d = json.loads(curl(url))
    except Exception:
        return []
    out = []
    for r in d.get("results", []):
        t = (r.get("title") or "").lower()
        if any(tok in t for tok in BAD_TITLE_TOKENS):
            continue
        if (r.get("width") or 0) < 800:
            continue
        if r.get("url"):
            out.append((r.get("title", ""), r["url"]))
    return out


def normalize(path):
    try:
        im = Image.open(path)
        im.verify()
        im = Image.open(path)
        if im.size[0] < 600 or im.size[1] < 450:
            return None
        im = im.convert("RGB")
        if max(im.size) > 1100:
            im.thumbnail((1100, 1100))
        im.save(path, quality=90)
        return im.size
    except Exception:
        if os.path.exists(path):
            try:
                os.remove(path)
            except OSError:
                pass
        return None


def main():
    os.makedirs(OUT, exist_ok=True)
    for target, queries in TARGETS.items():
        existing = [f for f in os.listdir(OUT) if f.startswith(target + "__r2")]
        got = len(existing)
        if got >= PER_TARGET:
            print(f"{target:16} cached {got}")
            continue
        for q in queries:
            if got >= PER_TARGET:
                break
            for title, url in openverse(q) + commons(q):
                if got >= PER_TARGET:
                    break
                dest = os.path.join(OUT, f"{target}__r2{got + 1}.jpg")
                try:
                    curl(url, dest=dest)
                    size = normalize(dest)
                    if size:
                        got += 1
                        print(f"  {target}[{got}] {str(title)[:58]} {size}")
                    time.sleep(0.5)
                except Exception as exc:  # noqa: BLE001
                    print(f"  fail {target}: {str(exc)[:60]}")
            time.sleep(1.5)
        print(f"{target:16} -> {got}")
    print("done")


if __name__ == "__main__":
    main()