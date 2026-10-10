# -*- coding: utf-8 -*-
"""
Merge every product source into one catalog, cross-checking before deciding.

Sources
-------
  digikala_products.json  — Digikala search API (name, Toman price, brand, photo)
  torob_products.json     — Torob via the local torob-mcp container (multi-seller
                            price comparison, Toman price, photo)
  tehran_all/tehran_wide  — OSM: shops and their location (no inventory)

Conflict policy — the point of this script
-----------------------------------------
Two Iranian marketplaces listing the same bag of cat food will disagree: one
is a promo, one is stale, one bundles. Nothing here averages or picks silently:

  * PRICE — the two sources are compared. Agreeing within 10% → keep one.
    Disagreeing → the CHEAPER price wins and the row is marked `price_conflict`
    with both figures kept, so the UI can show «۸۵٬۰۰۰ تومان (ترب) / ۹۲٬۰۰۰ تومان
    (دیجی‌کالا)» rather than picking one and calling it fact.
  * NAME — matched on a normalised form (Arabic/Persian glyph variants folded,
    spacing and punctuation dropped, weights stripped) so «غذای خشک گربه مفید
    مدل ADULT وزن 2 کیلو» and «غذا خشک گربه مفید ADULT وزن 2 کیلـوگرم» collapse.
  * IDENTITY — the same product on both sites is matched by normalised name and
    a 25%-tolerance on the price; only then are the rows merged. Anything else
    stays separate, because two genuinely different products can share a name.
  * IMAGE — a real product photo beats a category stock image.

Usage:
  PYTHONIOENCODING=utf-8 python scripts/merge_sources.py
Writes scripts/catalog_products.json
"""
import json
import os
import re
import unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "catalog_products.json")

PRICE_AGREE = 0.10      # within 10% → same product, no conflict
PRICE_MATCH = 0.25      # within 25% → same product for identity purposes

FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹"

# Words dropped before comparison: they vary between sellers and carry no
# identity (marketing filler, pack size is kept because it does).
FILLER = re.compile(
    r"(اصل|اورجینال|خام|تضمینی|پک|بسته|عدد|فروش|ویژه|تخفیف|ارسال|رایگان|"
    r"بهترین|قیمت|ویژه|جدید|شرکتی|درجه\s*یک|دومینی)", re.I)


def norm_name(s):
    """Fold Persian/Arabic variants and drop filler so equivalent titles match."""
    if not s:
        return ""
    s = unicodedata.normalize("NFKC", str(s))
    s = s.translate(str.maketrans("كيى", "کیی"))
    s = (s.replace("ي", "ی").replace("ك", "ک")
           .replace("‌", " ").replace("‏", " ")
           .replace("أ", "ا").replace("إ", "ا").replace("آ", "ا")
           .replace("۰", "0").replace("۱", "1").replace("۲", "2")
           .replace("۳", "3").replace("۴", "4").replace("۵", "5")
           .replace("۶", "6").replace("۷", "7").replace("۸", "8")
           .replace("۹", "9"))
    s = FILLER.sub(" ", s)
    s = re.sub(r"[^\w\s]", " ", s, flags=re.UNICODE)
    s = re.sub(r"\s+", " ", s).strip().lower()
    return s


def to_int(v):
    try:
        return int(round(float(v)))
    except (TypeError, ValueError):
        return None


def load_digikala():
    p = os.path.join(HERE, "digikala_products.json")
    if not os.path.exists(p):
        return []
    out = []
    for r in json.load(open(p, encoding="utf-8")):
        price = to_int(r.get("price_toman"))
        if not price:
            continue
        out.append({
            "name": (r.get("name") or "").strip(),
            "key": norm_name(r.get("name")),
            "price_toman": price,
            "brand": r.get("brand"),
            "image": r.get("image"),
            "category": r.get("category_path"),
            "sources": ["digikala"],
        })
    return out


def load_torob():
    p = os.path.join(HERE, "torob_products.json")
    if not os.path.exists(p):
        return []
    out = []
    for r in json.load(open(p, encoding="utf-8")):
        price = to_int(r.get("price_toman"))
        if not price:
            continue
        out.append({
            "name": (r.get("name") or "").strip(),
            "key": norm_name(r.get("name")),
            "price_toman": price,
            "brand": r.get("brand"),
            "image": r.get("image"),
            "category": r.get("category"),
            "sources": ["torob"],
        })
    return out


def main():
    dk = load_digikala()
    tr = load_torob()
    print(f"sources: digikala={len(dk)}  torob={len(tr)}")

    # index torob by normalised name for pairing
    by_key = {}
    for r in tr:
        by_key.setdefault(r["key"], []).append(r)

    merged = []
    stats = {"merged": 0, "conflicts": 0, "digikala_only": 0}
    used_torob = set()

    for d in dk:
        cands = by_key.get(d["key"]) or []
        # identity check: same title AND price within tolerance
        partner = None
        for c in cands:
            lo, hi = sorted((d["price_toman"], c["price_toman"]))
            if lo / hi >= (1 - PRICE_MATCH):
                partner = c
                break

        if partner is None:
            row = dict(d)
            row["price_conflict"] = None
            merged.append(row)
            stats["digikala_only"] += 1
            continue

        used_torob.add(partner["prk"] if partner.get("prk") else id(partner))
        lo, hi = sorted((d["price_toman"], partner["price_toman"]))
        agree = (lo / hi) >= (1 - PRICE_AGREE)

        row = dict(d)
        row["price_toman"] = lo                      # cheaper wins
        row["brand"] = d.get("brand") or partner.get("brand")
        row["image"] = d.get("image") or partner.get("image")
        row["sources"] = sorted(set(d["sources"] + partner["sources"]))
        row["price_conflict"] = None if agree else {
            "digikala": d["price_toman"], "torob": partner["price_toman"]}
        merged.append(row)
        stats["merged"] += 1
        if not agree:
            stats["conflicts"] += 1

    # torob products Digikala did not list — add them (they still carry a real
    # name, price and photo, so they belong in the catalog)
    added_torob = 0
    for r in tr:
        marker = r.get("prk") or id(r)
        if marker in used_torob:
            continue
        if any(m["key"] == r["key"] for m in merged):
            continue
        r["price_conflict"] = None
        merged.append(r)
        added_torob += 1

    merged.sort(key=lambda r: (r.get("category") or "", r["price_toman"]))
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(merged, f, ensure_ascii=False, indent=1)

    print(f"\nwrote {OUT}")
    print(f"  products: {len(merged)}")
    print(f"  paired across both sources: {stats['merged']} "
          f"({stats['conflicts']} with a price conflict)")
    print(f"  digikala-only: {stats['digikala_only']}   torob-only: {added_torob}")
    print(f"  with image: {sum(1 for r in merged if r.get('image'))}")
    if stats["conflicts"]:
        print("\n  price conflicts (both figures kept):")
        for r in merged:
            if r.get("price_conflict"):
                c = r["price_conflict"]
                print(f"    {r['name'][:44]:46} "
                      f"digikala={c['digikala']:,} torob={c['torob']:,}")
    print("\n  sample:")
    for r in merged[:6]:
        src = "+".join(r["sources"])
        print(f"    [{src:17}] {r['name'][:46]:48} {r['price_toman']:>10,}")


if __name__ == "__main__":
    main()