# -*- coding: utf-8 -*-
"""
Download QA candidates for image targets from Openverse (commercial license)
with Wikimedia Commons fallback. Candidates land in office/_research/img-candidates/
as <target>__<n>.jpg (max side 1000). Pick winners via visual QA, then install
with scripts/install_image_winners.py.
Run: PYTHONIOENCODING=utf-8 python scripts/fetch_image_candidates.py [target ...]
"""
import io
import json
import os
import subprocess
import sys
import time
import urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_DIR = os.path.abspath(os.path.join(HERE, "..", "..", "_research", "img-candidates"))
UA = "PawsMarket/1.0 (Tehran pet marketplace image research)"
PER_TARGET = 3

# target -> ordered queries (first that yields enough candidates wins)
TARGETS = {
    # replaces of amateur/wrong images (final: public/images/products/)
    "store-shop": ["pet store interior shelves", "pet supplies shop display", "pet shop dogs for sale"],
    "store-grooming": ["dog grooming salon groomer", "professional dog grooming cut", "puppy grooming bath"],
    "store-shelter": ["happy shelter dog volunteer", "animal rescue dog portrait", "dog shelter group"],
    "store-boarding": ["cattery cat hotel", "cat boarding window", "boarding kennel dog play"],
    "dog-food": ["dry dog food bowl", "kibble dog bowl studio", "dog food kibble close up"],
    "cat-diet": ["cat eating wet food bowl", "cat food can bowl", "cat eating from plate"],
    "dog-bed": ["dog sleeping on bed modern", "stylish dog bed living room", "dog bed cushion"],
    "bird-cage": ["parrot in bird cage", "canary bird cage indoor", "decorative bird cage"],
    # new product images (final: public/images/products/)
    "puppy-food": ["puppy kibble food bowl", "small dog food bowl kibble", "dog food measuring cup"],
    "cat-wet-food": ["canned cat food", "cat food can meat", "wet cat food tin"],
    "dog-toy-ball": ["dog playing ball toy", "rubber dog toy ball", "dog toy tennis ball"],
    "dog-collar": ["dog leash collar leather", "dog collar leash set", "dog wearing collar leash"],
    "pet-carrier": ["pet carrier travel bag", "dog carrier backpack", "cat carrier box"],
    "rabbit-food": ["rabbit eating pellets bowl", "rabbit hay food", "rabbit food bowl"],
    "cat-scratcher": ["cat scratching post furniture", "cat scratching board", "cat tree scratcher"],
    "aquarium": ["aquarium fish tank home", "freshwater aquarium plants", "aquarium store tanks"],
    # new per-store pools (final: public/images/stores/)
    "vet-2": ["veterinarian examining cat", "vet holding cat clinic", "cat checkup veterinarian"],
    "vet-3": ["veterinarian dog examination table", "vet with puppy clinic", "animal doctor dog"],
    "shop-2": ["pet food aisle store", "dog leashes accessories shop", "pet shop shelves products"],
    "shop-3": ["pet store aquarium section", "pet supplies store window", "pet boutique interior"],
    "groomer-2": ["dog being brushed grooming", "groomer blow drying dog", "dog haircut scissors"],
    "groomer-3": ["small dog bath groomer", "dog spa grooming table", "puppy first bath"],
    "shelter-2": ["dog rescue kennel run", "shelter dogs playing yard", "puppy rescue portrait"],
    "boarding-2": ["cats playing cattery", "cat hotel room", "cat window perch"],
}

FORBIDDEN = (
    "boys", "band", "concert", "logo", "map", "chart", "diagram", "screenshot",
    "grave", "cemetery", "christmas", "halloween", "drawing", "illustration",
    "statue", "museum", "antique", "toyota", "planet", "festival",
)


def curl(url, dest=None):
    cmd = ["curl", "-sSL", "--max-time", "45", "-A", UA, url]
    if dest:
        cmd += ["-o", dest]
    r = subprocess.run(cmd, capture_output=True)
    if r.returncode != 0:
        raise RuntimeError(r.stderr.decode("utf-8", "replace")[:160])
    if dest:
        return None
    return r.stdout.decode("utf-8", "replace")


def openverse(query, want):
    q = urllib.parse.quote(query)
    url = (f"https://api.openverse.org/v1/images/?q={q}"
           f"&license_type=commercial&page_size={want * 4}&mature=false")
    try:
        d = json.loads(curl(url))
    except Exception as exc:  # noqa: BLE001
        print(f"  openverse err: {exc}")
        return []
    out = []
    for r in d.get("results", []):
        title = (r.get("title") or "").lower()
        if any(b in title for b in FORBIDDEN):
            continue
        if (r.get("width") or 0) < 700 or (r.get("height") or 0) < 500:
            continue
        u = r.get("url")
        if u:
            out.append((f"OV:{r.get('title','')[:50]}", u))
        if len(out) >= want:
            break
    return out


def commons(query, want):
    params = urllib.parse.urlencode({
        "action": "query", "generator": "search", "gsrsearch": query,
        "gsrnamespace": "6", "gsrlimit": str(want * 4), "prop": "imageinfo",
        "iiprop": "url|mime|size", "iiurlwidth": "1000", "format": "json",
    })
    try:
        d = json.loads(curl("https://commons.wikimedia.org/w/api.php?" + params))
    except Exception as exc:  # noqa: BLE001
        print(f"  commons err: {exc}")
        return []
    out = []
    for page in (d.get("query") or {}).get("pages", {}).values():
        infos = page.get("imageinfo") or []
        if not infos:
            continue
        info = infos[0]
        title = page.get("title", "")
        low = title.lower()
        if any(b in low for b in FORBIDDEN):
            continue
        if info.get("mime") not in ("image/jpeg", "image/png"):
            continue
        if info.get("width", 0) < 700:
            continue
        u = info.get("thumburl") or info.get("url")
        if u:
            out.append((f"WC:{title[:50]}", u))
        if len(out) >= want:
            break
    return out


def installable(path):
    """Reject non-images / tiny files; return size or None."""
    try:
        from PIL import Image
        im = Image.open(path)
        im.verify()
        im = Image.open(path)
        w, h = im.size
        if w < 500 or h < 380:
            return None
        # downscale to max side 1000 to keep QA light
        if max(w, h) > 1000:
            im = im.convert("RGB")
            im.thumbnail((1000, 1000))
            im.save(path, quality=90)
        return os.path.getsize(path)
    except Exception:  # noqa: BLE001
        try:
            os.remove(path)
        except OSError:
            pass
        return None


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    only = set(sys.argv[1:])
    report = []
    for target, queries in TARGETS.items():
        if only and target not in only:
            continue
        # skip if candidates already present from a previous run
        existing = [f for f in os.listdir(OUT_DIR) if f.startswith(target + "__")]
        if len(existing) >= PER_TARGET:
            report.append((target, "cached", len(existing)))
            continue
        got = 0
        for q in queries:
            if got >= PER_TARGET:
                break
            cands = openverse(q, PER_TARGET - got) + commons(q, PER_TARGET - got)
            for src, url in cands:
                if got >= PER_TARGET:
                    break
                dest = os.path.join(OUT_DIR, f"{target}__{got + 1}.jpg")
                try:
                    curl(url, dest=dest)
                    size = installable(dest)
                    if size:
                        got += 1
                        print(f"  {target}[{got}] <- {src} ({size//1024}KB)")
                    time.sleep(0.4)
                except Exception as exc:  # noqa: BLE001
                    print(f"  dl fail {target}: {exc}")
            time.sleep(1.2)
        report.append((target, "ok" if got else "NONE", got))
    print("\n== summary ==")
    for t, s, n in report:
        print(f"{t:16} {s:8} {n}")


if __name__ == "__main__":
    main()
