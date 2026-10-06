# -*- coding: utf-8 -*-
"""Focused fetch for the three most-visible amateur images: shelter, boarding,
grooming. Commons only (Openverse/Flickr was resetting connections), short
timeouts, writes <target>__r3<n>.jpg.
Run: PYTHONIOENCODING=utf-8 python scripts/fetch_image_candidates3.py
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
       "statue", "grave", "cemet", "soldier", "military", "prison", "war",
       "18", "19", "vintage", "historical")

TARGETS = {
    "store-shelter": ["Tierheim Hund", "shelter dog indoor", "animal rescue dog cared"],
    "shelter-2": ["Tierschutz Hund Pflege", "shelter volunteer dog", "rescue dog portrait"],
    "store-boarding": ["Katzenpension", "cattery cats room", "Tierpension Katze"],
    "boarding-2": ["Hundepension", "dog boarding kennel clean", "pet hotel room"],
    "store-grooming": ["Hundefriseur", "dog grooming salon", "Hund baden"],
    "groomer-2": ["Hund föhnen", "dog blow dry grooming", "Hund scheren Friseur"],
    "groomer-3": ["Welpe baden", "puppy bath grooming", "Hund Haare schneiden"],
    "shop-4": ["Tierhandlung", "Zoohandlung", "pet shop interior shelves"],
    "vet-1": ["Tierarzt Hund Untersuchung", "veterinarian dog clinic", "Tierarzt Katze"],
}


def curl(url, dest=None, tries=2, timeout=25):
    cmd = ["curl", "-sSL", "--max-time", str(timeout), "-A", UA, url]
    if dest:
        cmd += ["-o", dest]
    for _ in range(tries):
        r = subprocess.run(cmd, capture_output=True)
        if r.returncode == 0:
            return None if dest else r.stdout.decode("utf-8", "replace")
        time.sleep(2)
    raise RuntimeError("curl fail")


def commons(query, want=12):
    params = urllib.parse.urlencode({
        "action": "query", "generator": "search", "gsrsearch": query,
        "gsrnamespace": "6", "gsrlimit": str(want), "prop": "imageinfo",
        "iiprop": "url|mime|size", "iiurlwidth": "1100", "format": "json",
    })
    try:
        d = json.loads(curl("https://commons.wikimedia.org/w/api.php?" + params, tries=3))
    except Exception as exc:  # noqa: BLE001
        print("   search fail:", str(exc)[:50])
        return []
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
        if info.get("width", 0) < 800:
            continue
        u = info.get("thumburl") or info.get("url")
        if u:
            out.append((title, u))
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
        if [f for f in os.listdir(OUT) if f.startswith(target + "__r3")]:
            print(f"{target:16} cached")
            continue
        got = 0
        for q in queries:
            if got >= 3:
                break
            for title, url in commons(q):
                if got >= 3:
                    break
                dest = os.path.join(OUT, f"{target}__r3{got + 1}.jpg")
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