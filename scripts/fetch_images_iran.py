# -*- coding: utf-8 -*-
"""
Fetch replacement images for the 16 files visual QA rejected.

Rejection reasons we must design around:
  * foreign text in frame (Norwegian pet aisle, English shampoo label, Latin
    packaging)  → prefer neutral/label-free studio shots
  * off-subject   → query the exact product, not the animal
  * amateur       → reject low resolution / phone snapshots
  * watermark     → reject titles/URLs suggesting overlay credits

Source priority: Wikimedia Commons (large, stable) then Openverse.
Candidates land in office/_research/img-candidates/ as <target>__v2<n>.jpg and
must still pass visual QA before installation.

Run: PYTHONIOENCODING=utf-8 python scripts/fetch_images_iran.py [target ...]
"""
import json
import os
import subprocess
import sys
import time
import urllib.parse

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(os.path.join(HERE, "..", "..", "_research", "img-candidates"))
UA = "PawsMarket/1.0 (Tehran pet marketplace image research)"

# Titles that imply overlay text, foreign-only context, or junk
BAD = ("logo", "map", "diagram", "screenshot", "icon", "chart", "poster", "stamp",
       "coin", "medal", "statue", "monument", "grave", "cemet", "soldier",
       "military", "prison", "war", "painting", "drawing", "sketch", "engraving",
       "woodcut", "lithograph", "19th", "18th", "sign", "banner", "street sign",
       "supermarket", "verdor", "kaufland", "edeka", "rewe", "aldi", "lidl",
       "petplan", "mars", "nestle purina packaging", "label", "packaging shot")

# target -> (queries, min_width)
#  Queries deliberately avoid brand names: branded packaging brings foreign text.
TARGETS = {
    # ── rejected products ────────────────────────────────────────────
    "v2-dog-food": (["dog food kibble bowl studio", "kibble close up macro",
                     "dog biscuits bowl"], 900),
    "v2-dog-treat": (["dog treat biscuits pile", "dog chews treats studio",
                      "dog biscuit macro"], 900),
    "v2-dog-towel": (["dog towel bath towel white", "towel on wooden bench",
                      "folded towels neutral"], 900),
    "v2-cat-litter": (["cat litter box granules clean", "kitty litter tray",
                       "litter pellets neutral"], 900),
    "v2-cat-wet-food": (["cat food can wet food", "canned pet food tin plain",
                         "wet cat food bowl"], 900),
    "v2-cat-diet": (["cat eating from bowl", "cat food bowl indoor",
                     "cat drinking milk bowl"], 900),
    "v2-bird-seed": (["bird seed mix container", "canary seed bowl",
                      "seeds scoop pet bird"], 900),
    "v2-bird-cage": (["empty bird cage studio", "birdcage white background",
                      "canary cage plain"], 900),
    "v2-aquarium": (["aquarium fish tank interior planted", "aquarium planted tank",
                     "freshwater aquarium fish"], 1000),
    "v2-pet-shampoo": (["pet shampoo bottle plain", "shampoo bottle white background",
                        "liquid soap bottle neutral"], 900),
    # ── rejected stores ──────────────────────────────────────────────
    "v2-shop": (["pet shop window display", "pet supplies store window",
                 "pet store entrance"], 1000),
    "v2-shop-aisle": (["pet food shelves store aisle", "pet supplies retail shelves",
                       "dog food store display"], 1000),
    "v2-boarding": (["animal shelter building", "pet hotel kennel building",
                     "animal rescue centre building"], 1000),
    "v2-shelter": (["shelter dog indoor bright", "animal rescue dog care",
                    "dog shelter play yard"], 1000),
}


def curl(url, dest=None, tries=3, timeout=40):
    cmd = ["curl", "-sSL", "--max-time", str(timeout), "-A", UA, url]
    if dest:
        cmd += ["-o", dest]
    for _ in range(tries):
        r = subprocess.run(cmd, capture_output=True)
        if r.returncode == 0:
            return None if dest else r.stdout.decode("utf-8", "replace")
        time.sleep(3)
    raise RuntimeError("curl fail")


def commons(query, min_w, want=12):
    params = urllib.parse.urlencode({
        "action": "query", "generator": "search", "gsrsearch": query,
        "gsrnamespace": "6", "gsrlimit": str(want), "prop": "imageinfo",
        "iiprop": "url|mime|size", "iiurlwidth": "1200", "format": "json",
    })
    for _ in range(3):
        try:
            d = json.loads(curl("https://commons.wikimedia.org/w/api.php?" + params))
        except Exception:  # noqa: BLE001
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
            if info.get("width", 0) < min_w:
                continue
            u = info.get("thumburl") or info.get("url")
            if u:
                out.append((title, u))
        return out
    return []


def normalize(path, min_w, min_h=600):
    try:
        im = Image.open(path)
        im.verify()
        im = Image.open(path)
        w, h = im.size
        if w < min_w or h < min_h:
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
    only = set(sys.argv[1:])
    for target, (queries, min_w) in TARGETS.items():
        if only and target not in only:
            continue
        have = [f for f in os.listdir(OUT) if f.startswith(target + "__")]
        if len(have) >= 2:
            print(f"{target:18} cached {len(have)}", flush=True)
            continue
        got = len(have)
        for q in queries:
            if got >= 2:
                break
            for title, url in commons(q, min_w):
                if got >= 2:
                    break
                dest = os.path.join(OUT, f"{target}__{got + 1}.jpg")
                try:
                    curl(url, dest=dest)
                    size = normalize(dest, min_w)
                    if size:
                        got += 1
                        print(f"  {target}[{got}] {str(title)[:56]} {size}", flush=True)
                except Exception:  # noqa: BLE001
                    if os.path.exists(dest):
                        try:
                            os.remove(dest)
                        except OSError:
                            pass
            time.sleep(1.5)
        print(f"{target:18} -> {got}", flush=True)


if __name__ == "__main__":
    main()