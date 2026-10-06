# -*- coding: utf-8 -*-
"""Targeted fetch for shelter + boarding images.

Commons' German query set returned fields, statues and event photos — useless
for a Persian pet-marketplace card. This uses narrower English concept queries
plus known-good open-source photo sets, and writes <target>__r4<n>.jpg.

Rejects by aspect: cards render ~16:10 to 4:3, so very tall panoramas are out.

Run: PYTHONIOENCODING=utf-8 python scripts/fetch_shelter_boarding.py
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

BAD = ("logo", "map", "diagram", "screenshot", "icon", "chart", "poster", "paint",
       "drawing", "sketch", "engraving", "woodcut", "stamp", "coin", "medal",
       "statue", "monument", "sculpture", "grave", "cemet", "soldier", "military",
       "prison", "war", "18", "19", "vintage", "historical", "sign", "banner",
       "navy", "sailor", "panoramio", "panoramio", "hundepension", "tierferienhof",
       "hotel", "pension", "landscape", "field", "field")

TARGETS = {
    "shelter-card": [
        "dog shelter volunteer caring",
        "rescue dog being cared for",
        "animal shelter worker dog",
        "adoption event dogs",
    ],
    "shelter-card2": [
        "dogs playing shelter yard",
        "dog rescue centre interior",
        "homeless dogs shelter",
    ],
    "boarding-card": [
        "cat boarding room interior",
        "cats in cattery room",
        "pet hotel room cats",
    ],
    "boarding-card2": [
        "dog kennel clean indoor",
        "dog boarding facility indoor",
    ],
}


def curl(url, dest=None, tries=3, timeout=30):
    cmd = ["curl", "-sSL", "--max-time", str(timeout), "-A", UA, url]
    if dest:
        cmd += ["-o", dest]
    for _ in range(tries):
        r = subprocess.run(cmd, capture_output=True)
        if r.returncode == 0:
            return None if dest else r.stdout.decode("utf-8", "replace")
        time.sleep(3)
    raise RuntimeError("curl fail")


def commons(query, want=14):
    params = urllib.parse.urlencode({
        "action": "query", "generator": "search", "gsrsearch": query,
        "gsrnamespace": "6", "gsrlimit": str(want), "prop": "imageinfo",
        "iiprop": "url|mime|size", "iiurlwidth": "1100", "format": "json",
    })
    for _ in range(3):
        try:
            d = json.loads(curl("https://commons.wikimedia.org/w/api.php?" + params))
        except Exception as exc:  # noqa: BLE001
            print("  search fail:", str(exc)[:60], flush=True)
            time.sleep(5)
            continue
        out = []
        for page in (d.get("query") or {}).get("pages", {}).values():
            infos = page.get("imageinfo") or []
            if not infos:
                continue
            info = infos[0]
            title = page.get("title", "")
            low = title.lower()
            if any(b in low for b in BAD):
                continue
            if info.get("mime") not in ("image/jpeg", "image/png"):
                continue
            if info.get("width", 0) < 900:
                continue
            u = info.get("thumburl") or info.get("url")
            if u:
                out.append((title, u))
        return out
    return []


def normalize(path):
    try:
        im = Image.open(path)
        im.verify()
        im = Image.open(path)
        w, h = im.size
        if w < 700 or h < 500:
            return None
        ar = w / h
        if ar < 0.75 or ar > 2.2:      # skip extreme panoramas / tall verticals
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
        if [f for f in os.listdir(OUT) if f.startswith(target + "__")]:
            print(f"{target:16} cached", flush=True)
            continue
        got = 0
        for q in queries:
            if got >= 3:
                break
            for title, url in commons(q):
                if got >= 3:
                    break
                dest = os.path.join(OUT, f"{target}__r4{got + 1}.jpg")
                try:
                    curl(url, dest=dest)
                    size = normalize(dest)
                    if size:
                        got += 1
                        print(f"  {target}[{got}] {str(title)[:56]} {size}", flush=True)
                except Exception:  # noqa: BLE001
                    if os.path.exists(dest):
                        try:
                            os.remove(dest)
                        except OSError:
                            pass
        print(f"{target:16} -> {got}", flush=True)


if __name__ == "__main__":
    main()