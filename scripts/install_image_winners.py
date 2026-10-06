# -*- coding: utf-8 -*-
"""
Install visually-verified QA winners into public/images/.

Winners were chosen by reading every candidate image (round 1 report) and
judging subject match + professional quality. Round-2 candidates (file names
containing `__r2`) override round-1 when present.

Mapping:
  candidate target      → destination
  store-shop            → stores/shop-1.jpg      products/store-shop.jpg
  shop-2                → stores/shop-2.jpg
  shop-3                → stores/shop-3.jpg
  shop-4                → stores/shop-4.jpg
  vet-2 / vet-3         → stores/vet-2.jpg / vet-3.jpg   (vet-1 = old store-vet.jpg)
  store-grooming        → stores/groomer-1.jpg  products/store-grooming.jpg
  groomer-2/3           → stores/groomer-2.jpg / groomer-3.jpg
  store-shelter/shelter-2 → stores/shelter-1.jpg / shelter-2.jpg  products/store-shelter.jpg
  store-boarding/boarding-2 → stores/boarding-1.jpg / boarding-2.jpg products/store-boarding.jpg
  dog-food/cat-diet/dog-bed/bird-cage/cat-wet-food/dog-toy-ball/dog-collar/
  pet-carrier/cat-scratcher/aquarium/rabbit-food → products/<same name>.jpg

Run: PYTHONIOENCODING=utf-8 python scripts/install_image_winners.py [--apply]
       (default = dry run)
"""
import os
import shutil
import sys

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
CAND = os.path.abspath(os.path.join(HERE, "..", "..", "_research", "img-candidates"))
PROD = os.path.abspath(os.path.join(HERE, "..", "public", "images", "products"))
STORES = os.path.abspath(os.path.join(HERE, "..", "public", "images", "stores"))

# candidate target -> (winner index, [destinations])
W = "r2"  # prefer round-2 file when it exists

PLAN = [
    # ---- store pools (src/data/shops.ts STORE_POOLS) ----
    ("store-shop",     1, [(STORES, "shop-1.jpg"), (PROD, "store-shop.jpg")]),
    ("shop-2",         2, [(STORES, "shop-2.jpg")]),
    ("shop-3",         2, [(STORES, "shop-3.jpg")]),
    ("shop-4",         1, [(STORES, "shop-4.jpg")]),
    ("vet-2",          2, [(STORES, "vet-2.jpg")]),
    ("vet-3",          2, [(STORES, "vet-3.jpg")]),
    # store-grooming round-1 candidates were REJECTED by visual QA
    # (B&W 1951 clipper photo / storefront exteriors) — waiting on round 2.
    ("store-grooming", None, [(STORES, "groomer-1.jpg"), (PROD, "store-grooming.jpg")]),
    # groomer-2 / groomer-3 round-1 candidates were REJECTED by visual QA
    # (1951 archive photo / oil painting / snow sculpture) — waiting on round 2.
    ("groomer-2",      None, [(STORES, "groomer-2.jpg")]),
    ("groomer-3",      None, [(STORES, "groomer-3.jpg")]),
    ("store-shelter",  None, [(STORES, "shelter-1.jpg"), (PROD, "store-shelter.jpg")]),
    ("shelter-2",      None, [(STORES, "shelter-2.jpg")]),
    ("store-boarding", None, [(STORES, "boarding-1.jpg"), (PROD, "store-boarding.jpg")]),
    ("boarding-2",     None, [(STORES, "boarding-2.jpg")]),
    # ---- product images (src/data/products.ts) ----
    ("dog-food",       None, [(PROD, "dog-food.jpg")]),
    ("cat-diet",       None, [(PROD, "cat-diet.jpg")]),
    ("dog-bed",        None, [(PROD, "dog-bed.jpg")]),
    ("bird-cage",      1, [(PROD, "bird-cage.jpg")]),
    ("cat-wet-food",   2, [(PROD, "cat-wet-food.jpg")]),
    ("dog-toy-ball",   2, [(PROD, "dog-treat.jpg")]),
    ("dog-collar",     None, [(PROD, "dog-collar.jpg")]),
    ("pet-carrier",    None, [(PROD, "pet-carrier.jpg")]),
    ("cat-scratcher",  3, [(PROD, "cat-scratcher.jpg")]),
    ("aquarium",       2, [(PROD, "aquarium.jpg")]),
    ("rabbit-food",    None, [(PROD, "rabbit-food.jpg")]),
]


def find_source(target):
    """Prefer round-2 candidate; fall back to round-1 winner index."""
    r2 = os.path.join(CAND, f"{target}__r21.jpg")
    if os.path.exists(r2):
        return r2
    return None


def main():
    apply = "--apply" in sys.argv
    os.makedirs(STORES, exist_ok=True)
    missing, planned = [], []

    for target, winner, dests in PLAN:
        src = find_source(target)
        if not src:
            src = os.path.join(CAND, f"{target}__{winner}.jpg") if winner else None
        if not src or not os.path.exists(src):
            missing.append(target)
            continue
        for folder, name in dests:
            dst = os.path.join(folder, name)
            try:
                im = Image.open(src)
                im.verify()
                size = Image.open(src).size
                if size[0] < 600:
                    raise ValueError(f"too small {size}")
                planned.append((target, os.path.basename(src), f"{folder}/{name}", size))
                if apply:
                    shutil.copyfile(src, dst)
            except Exception as exc:  # noqa: BLE001
                missing.append(f"{target} ({exc})")

    mode = "APPLY" if apply else "DRY-RUN"
    print(f"== {mode} ==")
    for t, s, d, size in planned:
        print(f"  {t:16} {s:26} -> {d:34} {size}")
    if missing:
        print("\nMISSING (need QA / round-2):")
        for m in missing:
            print("  -", m)
    if not apply:
        print("\nre-run with --apply to install")


if __name__ == "__main__":
    main()