# -*- coding: utf-8 -*-
"""
Harvest REAL pet products (name, price, brand, image) from Digikala's public
search API — the endpoint used by dariush-bahrami/digikala-tools.

Why this source: OSM maps businesses well but not their inventory, so the
catalog had one generic row per shop. Digikala supplies real Tehran product
names, real prices in Toman, brand, category and a product photo, which turns
the catalog into something a buyer can actually act on.

The endpoint returns Persian titles, prices in Rial (the API's `default_variant`
price field), brand, category path and image URLs. No key, no login.

Only pet categories are kept — the query set is fixed and each result's
category path is checked, so unrelated hits cannot leak in.

Usage:
  PYTHONIOENCODING=utf-8 python scripts/fetch_digikala.py
Writes scripts/digikala_products.json
"""
import json
import os
import subprocess
import time
import urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "digikala_products.json")

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

# Queries chosen to cover the catalog's product categories.
QUERIES = [
    # غذا
    "غذای خشک سگ", "غذای تر سگ", "غذای خشک گربه", "غذای مرطوب گربه",
    "کنسرو گربه", "غذای خرگوش", "غذای پرنده", "دانه قناری",
    "غذای ماهی", "مکمل غذای سگ", "مکمل غذای گربه",
    "شیر خشک توله سگ", "پودر شیر گربه",
    # سلامت و دارو
    "مکمل مفصل سگ", "قرص گیاهی گربه", "قطره ضدانگل گربه",
    "شامپو سگ", "شامپو گربه", "پماد ضدقارچ گربه", "ویتامین سگ",
    # لوازم و جای خواب
    "تخت سگ", "پتو سگ", "باکس حمل گربه", "قلاده سگ",
    # اسباب‌بازی و لوازم
    "اسباب بازی سگ", "اسباب بازی گربه", "پنجه گربه", "جعبه آموزشی سگ",
    # قفس و پرنده
    "قفس پرنده", "ارابه پرنده", "ظرف آب پرنده",
    # بهداشت
    "خاک بستر گربه", "کیسه بهداشتی سگ", "پوشک سگ",
    # سایر
    "آکواریوم", "دکور ماهی", "فیلتر آکواریوم",
]

# Keep only these category fragments — anything else is not a pet product.
PET_MARKERS = (
    "حیوان", "سگ", "گربه", "پرنده", "خرگوش", "ماهی", "همستر", "جیوان",
    "پت", "طوطی", "قناری", "ژله‌ای", "آکواریوم",
)
# Explicitly exclude non-pet categories. These are matched against the
# CATEGORY path only — substring-matching bare words like «مد» against a title
# rejects almost everything, because «مدل» (model) and «غذا» both contain it.
NON_PET_CATEGORIES = (
    "موبایل", "لپ تاپ", "کامپیوتر", "تبلت", "الکترونیکی",
    "پوشاک", "کفش", "زیور", "عطر", "جواهر", "لوازم خانگی",
    "لوازم آرایشی", "ابزار", "کاغذ", "لوازم التحریر",
)


def search(query, page=1, has_stock=True):
    params = {
        "q": query,
        "page": page,
        "has_selling_stock": 1 if has_stock else 0,
    }
    url = "https://api.digikala.com/v1/search/?" + urllib.parse.urlencode(
        params, quote_via=urllib.parse.quote)
    r = subprocess.run(
        ["curl", "-sS", "--max-time", "45", "-A", UA, url],
        capture_output=True)
    body = r.stdout.decode("utf-8", "replace")
    if not body.strip().startswith("{"):
        return None
    try:
        return json.loads(body)
    except json.JSONDecodeError:
        return None


def pick_image(prod):
    try:
        urls = prod["images"]["main"]["url"]
        # Digikala returns a size-ordered list; the first is the largest.
        return urls[0] if urls else None
    except (KeyError, IndexError, TypeError):
        return None


def to_row(prod, query):
    """Normalise one API product into our catalog shape."""
    title = (prod.get("title_fa") or "").strip()
    if not title:
        return None
    variant = prod.get("default_variant") or {}
    # price is an object: {selling_price, rrp_price, discount_percent, …}
    price_obj = variant.get("price") or {}
    rial = price_obj.get("selling_price") or price_obj.get("rrp_price")
    if not rial:
        return None
    # The API quotes Rial; the catalog is in Toman.
    toman = int(rial) // 10
    if toman < 10_000:          # implausible after the conversion
        return None

    layer = prod.get("data_layer") or {}
    brand = (layer.get("brand") or "").strip() or None
    cat_path = layer.get("category") or ""
    rating = (prod.get("rating") or {}).get("rate")

    return {
        "name": title,
        "price_toman": toman,
        "brand": brand,
        "category_path": cat_path,
        "rating": rating,
        "image": pick_image(prod),
        "source_query": query,
    }


def main():
    seen, kept, dropped_non_pet, dropped_dup = {}, [], 0, 0

    for qi, q in enumerate(QUERIES, 1):
        data = search(q)
        if not data:
            print(f"  [{qi}/{len(QUERIES)}] {q}: no response", flush=True)
            continue
        products = (data.get("data") or {}).get("products") or []
        kept_here = 0
        for prod in products:
            row = to_row(prod, q)
            if not row:
                continue
            # category path decides; the title only supplies pet words
            cat = row["category_path"]
            if any(x in cat for x in NON_PET_CATEGORIES):
                dropped_non_pet += 1
                continue
            blob = f"{row['name']} {cat}"
            if not any(m in blob for m in PET_MARKERS):
                dropped_non_pet += 1
                continue
            if row["name"] in seen:
                dropped_dup += 1
                continue
            seen[row["name"]] = row
            kept.append(row)
            kept_here += 1
        print(f"  [{qi}/{len(QUERIES)}] {q}: {len(products)} returned, "
              f"{kept_here} new", flush=True)
        time.sleep(1.2)          # be polite to a public endpoint

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(kept, f, ensure_ascii=False, indent=1)

    print(f"\nwrote {OUT}")
    print(f"  kept: {len(kept)}  dropped(non-pet): {dropped_non_pet}  "
          f"dropped(dup): {dropped_dup}")
    if kept:
        priced = [r for r in kept if r["price_toman"]]
        priced.sort(key=lambda r: r["price_toman"])
        print(f"  price range: {priced[0]['price_toman']:,} .. "
              f"{priced[-1]['price_toman']:,} Toman")
        withimg = sum(1 for r in kept if r["image"])
        print(f"  with image: {withimg}/{len(kept)}")
        for r in kept[:5]:
            print(f"    - {r['name'][:52]:54} {r['price_toman']:>10,}")


if __name__ == "__main__":
    main()