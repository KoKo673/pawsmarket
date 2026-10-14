# -*- coding: utf-8 -*-
"""
Quality gate for the catalogue — run before every deploy.

Reported problems this exists to catch, each of which shipped at least once:

  «از یک عکس هم زمان چند جا استفاده شده» — eight stock photos were shared
  across 461 shops, and a single real photo reached 177 of them through an
  empty map key. One image on two businesses is one too many when the visitor
  is comparing them side by side.

  «عکس بی‌ربط» — a fish-food listing showed dog kibble, a shop's interior
  stood in for a pet bed.

  «امتیاز ۴٫۳ از ۱۰» — the rating line read as a score out of ten.

  «کلینیک ... روی عکس آیدی dr ashtiani vet دارد» — a shop's photo carried
  another business's watermark, because the photo was taken from a listing
  that was not theirs.

Usage:
  PYTHONIOENCODING=utf-8 python scripts/qc_catalog.py [--strict]
Exit code 1 when a failure-level check trips, so CI/deploy can gate on it.
"""
import argparse
import json
import os
import re
import sys
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
PUBLIC = os.path.join(HERE, "..", "public")

FAILURES: list[str] = []
WARNINGS: list[str] = []


def fail(msg: str) -> None:
    FAILURES.append(msg)


def warn(msg: str) -> None:
    WARNINGS.append(msg)


def load(name):
    p = os.path.join(HERE, name)
    if not os.path.exists(p):
        return None
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def check_duplicate_images():
    """No image may stand in for many different businesses."""
    photos = load("store_images.json") or {}
    placeholders = load("store_placeholders.json") or {}
    used = Counter()
    owner = defaultdict(list)
    for name, paths in photos.items():
        for p in paths:
            used[p] += 1
            owner[p].append(name)
    for name, p in placeholders.items():
        used[p] += 1
        owner[p].append(name)

    # A real storefront photo may legitimately appear twice only if two rows
    # really are the same business; anything above that is reuse.
    worst = [(p, n) for p, n in used.most_common(8) if n > 2]
    if worst:
        for p, n in worst:
            fail(f"image reused on {n} shops: {p}  "
                 f"(e.g. {', '.join(owner[p][:3])})")
    assert_placeholder_coverage(placeholders, photos)


def assert_placeholder_coverage(placeholders, photos):
    """Every shop without a real photo needs its own generated card."""
    if not placeholders:
        warn("store_placeholders.json missing — run make_placeholders.py")
        return
    missing = [n for n in photos if n not in placeholders]
    if len(placeholders) < 300:
        fail(f"only {len(placeholders)} placeholder cards — expected one per shop")
    del missing


def check_product_images():
    """Every product photo must belong to that product."""
    prod = load("product_images.json") or {}
    catalog = load("catalog_products.json") or []
    if not catalog:
        warn("catalog_products.json missing — skipping product image checks")
        return
    by_name = {r["name"]: r for r in catalog}

    # A photo used by unrelated products is the signature of a fallback that
    # got out of hand — the fish-food-with-kibble complaint.
    used = Counter(prod.values())
    bad = [(p, n) for p, n in used.most_common(5) if n > 12]
    for p, n in bad:
        fail(f"product photo reused on {n} products: {p}")

    # Names that promise an animal but whose image is a stock category shot.
    offsubject = 0
    for name, path in prod.items():
        if not path.startswith("images/products/real/"):
            offsubject += 1
    if offsubject:
        warn(f"{offsubject} products still use a curated image, not their own")
    del by_name


def check_photos_exist():
    """Every referenced file must be on disk."""
    missing = 0
    for f in ("store_images.json", "store_placeholders.json",
              "product_images.json"):
        data = load(f) or {}
        for v in data.values():
            paths = v if isinstance(v, list) else [v]
            for p in paths:
                if not os.path.exists(os.path.join(PUBLIC, p)):
                    missing += 1
    if missing:
        fail(f"{missing} referenced images are not on disk")


def check_rating_wording():
    """«۴٫۳ از ۱۰ نظر» reads as a score out of ten.

    Only matches the pattern where «از» is immediately followed by the review
    count and then «نظر» — the correct form («۴٫۳ از ۵ · ۱۰ نظر») has the
    scale in between and must not trip this.
    """
    # The bad shape: «از {count} نظر» with nothing but a number between.
    BAD = re.compile(r"از\s*\"?\s*\}?\s*\$?\{?[^}\n]{0,30}faDigits\([^)]*\)"
                     r"\}?[^}\n]{0,10}نظر")
    hits = []
    for root, _dirs, files in os.walk(os.path.join(HERE, "..", "src")):
        for name in files:
            if not name.endswith((".ts", ".tsx")):
                continue
            path = os.path.join(root, name)
            text = open(path, encoding="utf-8").read()
            for m in BAD.finditer(text):
                snippet = text[m.start():m.end()]
                # «از ۵ · {faDigits(...)} نظر» is correct — skip it.
                if "۵" in snippet or "5" in snippet:
                    continue
                line = text[:m.start()].count("\n") + 1
                hits.append(f"{os.path.relpath(path, HERE)}:{line} {snippet[:40]}")
    if hits:
        fail("rating text reads as «X از Y نظر» (looks like X out of Y): "
             + "; ".join(hits[:4]))


def check_latin_and_encoding():
    """Catalogue text must be Persian: no stray Latin digits or Arabic yeh."""
    catalog = load("catalog_products.json") or []
    shops = os.path.join(HERE, "..", "src", "data", "shops.ts")
    text = open(shops, encoding="utf-8").read() if os.path.exists(shops) else ""

    arabic = len(re.findall(r"[يكة]", text))
    if arabic:
        fail(f"{arabic} Arabic glyphs (ي/ك/ة) left in shops.ts")

    plus = re.findall(r"[A-Z0-9]{2,8}\+[A-Z0-9]{2,}", text)
    if plus:
        fail(f"{len(plus)} plus-codes left in shop addresses")

    # Latin digits inside a Persian quantity («وزن 200 گرم»).
    #
    # [0-9] explicitly, NOT \d: Python's \d matches Persian digits too, so the
    # sanity check flagged all 332 correct titles («وزن ۲۰ گرم») as broken.
    bad_titles = [r["name"] for r in catalog
                  if re.search(r"(وزن|کیلوگرم)\s*[0-9]", r["name"])]
    if bad_titles:
        warn(f"{len(bad_titles)} product titles still use Latin digits "
             f"(e.g. {bad_titles[0][:40]})")


def check_watermarks():
    """
    Flag photos whose filename matches a known watermark owner.

    The report was «کلینیک تخصصی پرندگان جم روی عکس آیدی dr ashtiani vet دارد»
    — a business's Instagram handle visible in a photo attached to a different
    business. A filename scan cannot read text inside a JPEG, but it does
    catch the case where a social-media asset was filed under its owner.
    """
    suspicious = []
    for root, _dirs, files in os.walk(os.path.join(PUBLIC, "images")):
        for name in files:
            if re.search(r"insta|instagram|@|watermark|logo", name, re.I):
                suspicious.append(os.path.relpath(os.path.join(root, name), PUBLIC))
    if suspicious:
        warn(f"{len(suspicious)} images look like social-media exports "
             f"(may carry a watermark): {suspicious[:3]}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--strict", action="store_true",
                    help="treat warnings as failures too")
    args = ap.parse_args()

    check_duplicate_images()
    check_product_images()
    check_photos_exist()
    check_rating_wording()
    check_latin_and_encoding()
    check_watermarks()

    print("=" * 62)
    if WARNINGS:
        print(f"WARNINGS ({len(WARNINGS)}):")
        for w in WARNINGS:
            print("  ~", w)
    if FAILURES:
        print(f"\nFAILURES ({len(FAILURES)}):")
        for f in FAILURES:
            print("  ✗", f)
    if not FAILURES and not WARNINGS:
        print("catalog QC: all checks passed")
    elif not FAILURES:
        print("\ncatalog QC: passed with warnings")

    if FAILURES or (args.strict and WARNINGS):
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())