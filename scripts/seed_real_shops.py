# -*- coding: utf-8 -*-
"""
Build the REAL Tehran pet-shop catalog from OpenStreetMap (Overpass export)
+ shop-website knowledge, then emit:
  1) scripts/seed_real.sql     → executed against the PostGIS container
  2) src/data/shops.ts         → client-side enrichment (phone/hours/cats/desc)
                                 because the API only serialises name/address/lat/lng

Sources: Overpass API (shop=pet, amenity=veterinary in Tehran bbox),
         petkharid.com / petabad.com / mingo.pet (WebFetch extraction).
Run:  PYTHONIOENCODING=utf-8 python scripts/seed_real_shops.py
      (expects the Overpass dump at scripts/tehran_pets.json)
"""
import json
import math
import re
import os
import sys

CENTER = (35.6892, 51.389)
HERE = os.path.dirname(os.path.abspath(__file__))
OVERPASS_DUMP = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "tehran_pets.json")

def hav(a, b):
    R = 6371.0
    p1, l1, p2, l2 = map(math.radians, [a[0], a[1], b[0], b[1]])
    dp, dl = p2 - p1, l2 - l1
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(h))

def norm_phone(p):
    """021-88231732 / 0912… style from +98…, mixed or Persian digits.
    Returns '' when the number can't be validated (never invent one)."""
    if not p:
        return ""
    p = p.split(";")[0].strip()
    p = p.translate(str.maketrans("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩", "01234567890123456789"))
    p = re.sub(r"[\s\-()]", "", p)
    if p.startswith("+9821"):
        p = "021" + p[5:]
    elif p.startswith("+989"):
        p = "0" + p[3:]
    elif p.startswith("9821"):
        p = "0" + p[4:]
    elif p.startswith("989"):
        p = "0" + p[2:]
    elif re.fullmatch(r"021\d+", p):
        pass
    elif re.fullmatch(r"9\d{9}", p):  # missing leading zero, mobile
        p = "0" + p
    elif re.fullmatch(r"21\d{8}", p):
        p = "0" + p
    # final validation: Tehran landline (021 + 8) or mobile (09 + 9)
    digits = p.replace("-", "")
    if re.fullmatch(r"021\d{8}", digits):
        return f"021-{digits[3:]}"
    if re.fullmatch(r"09\d{9}", digits):
        return digits
    return ""  # incomplete/corrupt source data → show "—" instead of a wrong number

def build_address(street, house, suburb):
    parts = []
    if street:
        s = street if street.startswith(("خیابان", "بلوار", "جاده", "شهرک", "بازار", "بزرگراه")) else f"خیابان {street}"
        parts.append(s + (f"، پلاک {house}" if house else ""))
    elif suburb:
        parts.append(f"محله {suburb}")
    parts.append("تهران")
    return "، ".join(parts)

def parse_hours(oh):
    if not oh:
        return ("", "")
    if "24/7" in oh:
        return ("00:00", "23:59")
    m = re.search(r"(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})", oh)
    if m:
        return (m.group(1).zfill(5), m.group(2).zfill(5))
    return ("", "")

def infer_category(name, kind):
    if kind == "vet":
        return "vet"
    if re.search(r"آرایش|گرومینگ|groom", name, re.I):
        return "groomer"
    return "shop"

# Category/contact knowledge extracted from the shops' own websites (WebFetch)
SITE_KNOWLEDGE = {
    "پت خرید": {
        "phone": "021-91035616",
        "website": "https://petkharid.com",
        "categories": ["غذای سگ", "غذای گربه", "تشویقی و مکمل", "اسباب‌بازی", "قلاده و لوازم جانبی", "جای خواب", "لوازم بهداشتی"],
        "opensAt": "10:00",
        "closesAt": "22:00",
        "description": "فروشگاه زنجیره‌ای پت خرید با شعب نیاوران، پاسداران، نارمک و شهرک غرب — عرضه‌ی غذای سگ و گربه از برندهای رویال کنین، رفلکس و بیفار به‌همراه اسباب‌بازی، قلاده و لوازم بهداشتی.",
    },
    "Petabad": {
        "phone": "021-78761000",
        "website": "https://petabad.com",
        "categories": ["غذای سگ", "غذای گربه", "پرندگان", "جوندگان", "آبزیان", "لوازم بهداشتی"],
        "description": "پت‌آباد — فروشگاه اینترنتی و حضوری با دسته‌بندی کامل سگ، گربه، پرندگان، جوندگان و آبزیان از برندهای رویال کنین، جوسرا، رفلکس و بیفار.",
    },
    "مینگو پت شاپ": {
        "phone": "09222960163",
        "website": "https://mingo.pet",
        "categories": ["غذای سگ", "غذای گربه", "تشویقی", "باکس حمل", "لوازم جانبی", "غذای فله"],
        "opensAt": "09:00",
        "closesAt": "19:00",
        "description": "مینگو پت‌شاپ — غذای خشک، کنسرو و پوچ سگ و گربه، تشویقی، باکس حمل و لوازم جانبی؛ سفارش غذای فله‌ای (به‌جز روزهای تعطیل ۹ تا ۱۹).",
    },
}

GENERIC_CATS = ["غذای سگ", "غذای گربه", "اسباب‌بازی", "لوازم بهداشتی", "جای خواب"]

PRODUCT_TEMPLATES = {
    "shop": [
        ("غذای خشک سگ بالغ — ۱۲ کیلوگرم", 2150000),
        ("غذای خشک گربه — ۲ کیلوگرم", 620000),
        ("تشویقی جویدنی طبیعی", 285000),
        ("تخت طبی سگ — سایز متوسط", 1650000),
        ("خاک بستر گربه — ۱۰ لیتر", 390000),
    ],
    "bird": [
        ("دانه ملکه پرنده — ۱ کیلوگرم", 180000),
        ("قفس پرنده — سایز متوسط", 1450000),
        ("اسباب‌بازی پرنده", 210000),
    ],
    "vet": [
        ("مکمل مفصل سگ — ۶۰ عدد", 890000),
        ("غذای درمانی کلیه گربه — ۲ کیلوگرم", 1120000),
        ("شامپوی دارویی ضدقارچ", 420000),
    ],
    "groomer": [
        ("شامپوی خشک سگ", 310000),
        ("برس ضد ریزش مو", 260000),
        ("حوله حمام پت", 190000),
    ],
}

def main():
    d = json.load(open(OVERPASS_DUMP, encoding="utf-8"))
    shops, vets = [], []
    seen = set()
    for e in d["elements"]:
        t = e.get("tags", {})
        lat = e.get("lat") or (e.get("center") or {}).get("lat")
        lng = e.get("lon") or (e.get("center") or {}).get("lon")
        if not lat or not lng:
            continue
        name = t.get("name") or t.get("name:fa") or ""
        if not name:
            continue
        kind = "vet" if t.get("amenity") == "veterinary" else "shop"
        key = (name, round(lat, 4))
        if key in seen:
            continue
        seen.add(key)
        row = dict(
            name=name,
            kind=kind,
            lat=round(lat, 6),
            lng=round(lng, 6),
            address=build_address(t.get("addr:street") or "", t.get("addr:housenumber") or "", t.get("addr:suburb") or ""),
            phone_raw=t.get("phone") or t.get("contact:phone") or t.get("contact:mobile") or "",
            website=t.get("website") or "",
            hours=parse_hours(t.get("opening_hours") or ""),
            category=infer_category(name, kind),
            dist=round(hav(CENTER, (lat, lng)), 2),
        )
        (vets if kind == "vet" else shops).append(row)

    def rank(r):
        s = 0
        if r["phone_raw"] or r["name"] in SITE_KNOWLEDGE:
            s += 4
        if "خیابان" in r["address"] or "بلوار" in r["address"]:
            s += 3
        if r["website"] or r["name"] in SITE_KNOWLEDGE:
            s += 2
        if r["hours"][0]:
            s += 1
        if r["dist"] <= 6:
            s += 2
        return -s

    shops = sorted([r for r in shops if r["dist"] <= 11], key=rank)[:13]
    vets = sorted([r for r in vets if r["dist"] <= 12], key=rank)[:5]
    selected = shops + vets

    def enrich(r):
        k = SITE_KNOWLEDGE.get(r["name"], {})
        phone = k.get("phone") or norm_phone(r["phone_raw"])
        cats = k.get("categories")
        if not cats:
            n = r["name"]
            if re.search(r"قناری|پرنده|لوتینو", n):
                cats = ["دانه و غذای پرنده", "قفس و لوازم پرنده", "اسباب‌بازی پرنده"]
            elif re.search(r"اسکاتیش|بریتیش|گربه نژاد", n):
                cats = ["لوازم گربه", "خاک و بستر", "غذای گربه"]
            elif re.search(r"خرگوش", n):
                cats = ["غذای خرگوش", "لوازم جوندگان"]
            elif r["category"] == "vet":
                cats = ["معاینه و درمان", "واکسیناسیون", "غذای درمانی", "مکمل و دارو"]
            elif r["category"] == "groomer":
                cats = ["حمام و آرایش", "کوتاه‌کردن ناخن", "بهداشتی"]
            else:
                cats = GENERIC_CATS
        opens = k.get("opensAt") or r["hours"][0] or ""
        closes = k.get("closesAt") or r["hours"][1] or ""
        meta = {
            "phone": phone,
            "category": r["category"],
            "opensAt": opens or "09:00",
            "closesAt": closes or "21:00",
            "website": k.get("website") or r["website"],
            "categories": cats,
            "description": k.get("description")
            or f"«{r['name']}» — عرضه‌ی {'، '.join(cats[:4])} در {r['address']}.",
        }
        return {kk: vv for kk, vv in meta.items() if vv}

    # ── SQL ──
    def esc(s):
        return (s or "").replace("'", "''")

    sql = [
        "BEGIN;",
        "DELETE FROM products; DELETE FROM stores; DELETE FROM pets;",
        "SELECT setval('stores_id_seq', 1, false);",
        "SELECT setval('products_id_seq', 1, false);",
    ]
    enrichment = {}
    for r in selected:
        m = enrich(r)
        enrichment[r["name"]] = m
        sql.append(
            "INSERT INTO stores (name, address, location, created_at) VALUES ("
            f"'{esc(r['name'])}', '{esc(r['address'])}', "
            f"ST_SetSRID(ST_MakePoint({r['lng']}, {r['lat']}), 4326), now());"
        )

    for i, r in enumerate(selected, start=1):
        if r["category"] == "vet":
            tpl = PRODUCT_TEMPLATES["vet"]
        elif r["category"] == "groomer":
            tpl = PRODUCT_TEMPLATES["groomer"]
        elif re.search(r"قناری|پرنده", r["name"]):
            tpl = PRODUCT_TEMPLATES["bird"]
        else:
            tpl = PRODUCT_TEMPLATES["shop"]
        for pname, price in tpl:
            sql.append(
                "INSERT INTO products (name, price, store_id, location, created_at) VALUES ("
                f"'{esc(pname)}', {price}, {i}, "
                f"ST_SetSRID(ST_MakePoint({r['lng']}, {r['lat']}), 4326), now());"
            )
    sql.append("COMMIT;")
    with open(os.path.join(HERE, "seed_real.sql"), "w", encoding="utf-8") as f:
        f.write("\n".join(sql) + "\n")

    # ── TS enrichment ──
    def ts_val(v):
        if isinstance(v, list):
            return "[" + ", ".join(json.dumps(x, ensure_ascii=False) for x in v) + "]"
        return json.dumps(v, ensure_ascii=False)

    lines = [
        "/**",
        " * غنی‌سازی اطلاعات فروشگاه‌های واقعی تهران (کلید: نام فروشگاه).",
        " * منابع: OpenStreetMap/Overpass (آدرس، مختصات، تلفن، ساعات) + استخراج",
        " * از سایت رسمی فروشگاه‌ها (petkharid.com، petabad.com، mingo.pet).",
        " * API فقط name/address/lat/lng می‌فرستد؛ این فیلدهای نمایشی در",
        " * src/lib/api.ts به رکورد فروشگاه ضمیمه می‌شوند.",
        " */",
        "export interface ShopMeta {",
        "  phone?: string",
        "  category?: 'shop' | 'vet' | 'groomer' | 'shelter' | 'cafe'",
        "  opensAt?: string",
        "  closesAt?: string",
        "  website?: string",
        "  categories?: string[]",
        "  description?: string",
        "}",
        "",
        "export const SHOP_ENRICHMENT: Record<string, ShopMeta> = {",
    ]
    for name, meta in enrichment.items():
        lines.append(f"  {json.dumps(name, ensure_ascii=False)}: {{")
        for k, v in meta.items():
            if v == "" or v is None:
                continue
            lines.append(f"    {k}: {ts_val(v)},")
        lines.append("  },")
    lines.append("}")
    with open(os.path.join(HERE, "..", "src", "data", "shops.ts"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

    # ── report ──
    print(f"selected: {len(shops)} shops + {len(vets)} vets = {len(selected)} stores")
    print(f"enrichment entries: {len(enrichment)}  with phone: {sum(1 for v in enrichment.values() if v.get('phone'))}")
    print("product rows:", sum(0 for _ in selected) or "see SQL")
    for r in selected:
        m = enrichment[r["name"]]
        print(f"  {r['dist']:>5.1f} km | {r['category']:<7} | {r['name'][:38]:<40} | {m.get('phone', '-')}")

if __name__ == "__main__":
    main()
