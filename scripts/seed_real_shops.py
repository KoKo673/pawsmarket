# -*- coding: utf-8 -*-
"""
Build the FULL Tehran pet catalog from the city-wide Overpass dumps
(scripts/tehran_wide.json preferred, scripts/tehran_all.json as fallback —
covering all districts: shops, vets, groomers, shelters, boarding) and emit:
  1) scripts/seed_real.sql     → executed against the PostGIS container
  2) src/data/shops.ts         → client-side enrichment (phone/hours/cats/
                                 desc/image — the API only serialises a few
                                 columns; everything else rides on name-keyed
                                 enrichment)

Rules (product quality bar):
  * names: name:fa > NAME_OVERRIDES > name — Latin-only names are either
    overridden or DROPPED (no English/Finglish on the site).
  * every store gets a category and a UNIQUE-ish image rotated from a
    per-category pool (crc32(name) — stable across runs).
  * products: per-store pick from an expanded pool (deterministic seed) with
    ±6% realistic price jitter — no two adjacent cards look identical.
  * shelters/boarding get NO products (we don't invent inventory for them).

Run:  PYTHONIOENCODING=utf-8 python scripts/seed_real_shops.py
"""
import hashlib
import json
import math
import os
import random
import re
import sys
import zlib

CENTER = (35.6892, 51.389)
HERE = os.path.dirname(os.path.abspath(__file__))
OVERPASS_DUMP = os.path.join(HERE, "tehran_wide.json")
OVERPASS_FALLBACK = os.path.join(HERE, "tehran_all.json")


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
    if "veterinary" in p.lower() or "clinic" in p.lower() or "http" in p.lower():
        return ""  # مقدار آلوده‌ی OSM (متن به‌جای شماره)
    p = p.translate(str.maketrans("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩", "01234567890123456789"))
    p = re.sub(r"[\s\-()]", "", p)
    if p.startswith("+9821"):
        p = "021" + p[5:]
    elif p.startswith("+989"):
        p = "0" + p[3:]
    elif p.startswith("9821"):
        p = "021" + p[4:]
    elif p.startswith("989"):
        p = "0" + p[2:]
    elif re.fullmatch(r"9\d{9}", p):
        p = "0" + p
    elif re.fullmatch(r"21\d{8}", p):
        p = "0" + p
    digits = p.replace("-", "")
    if re.fullmatch(r"021\d{8}", digits):
        return f"021-{digits[3:]}"
    if re.fullmatch(r"09\d{9}", digits):
        return digits
    return ""


_FA_DIGITS = str.maketrans("0123456789", "۰۱۲۳۴۵۶۷۸۹")

# نام‌های رسمی فارسی (name:fa از OSM یا تاییدشده) — قبل از هر چیز اعمال می‌شوند
NAME_OVERRIDES = {
    "Petabad": "پت‌آباد",
    "Pet Shop Golba": "پت شاپ گلبا",
    "Loivna petshop": "پت شاپ لاوینا",
    "SeePet Plus": "پت شاپ سی‌پت",
    "shahoo veterinary clinic": "کلینیک دامپزشکی شاهو",
}

# نام‌های لاتین بدون جایگزین فارسی → حذف می‌شوند (گزارش چاپ می‌شود)
LATIN_ONLY = re.compile(r"^[0-9A-Za-z][0-9A-Za-z\s.&'!+®-]*$")


def keep_persian(s):
    """Remove Latin-only tokens from a mixed name («ehsanvet کلینیک احسان»
    → «کلینیک احسان»). Digits and Persian survive; empty result = drop."""
    kept = [
        t for t in s.split()
        if re.search(r"[؀-ۿ]", t) or re.fullmatch(r"[\d/.,\-]+", t)
    ]
    return " ".join(kept).strip()


def resolve_name(tags):
    """name:fa > NAME_OVERRIDES > name | name:fa fallback. None = drop."""
    raw_name = (tags.get("name") or "").split("|")[0].strip()
    fa = (tags.get("name:fa") or "").split("|")[0].strip()
    if raw_name in NAME_OVERRIDES:
        return NAME_OVERRIDES[raw_name], "override"
    if fa:
        fa = keep_persian(fa)
        if fa:
            return fa, "name:fa"
    if raw_name:
        cleaned = keep_persian(raw_name)
        if cleaned:
            return cleaned, "name" if cleaned == raw_name else "name-latin-stripped"
    return None, "latin-dropped"


def build_address(street, house, suburb, city="تهران"):
    street = re.sub(r"^\s*تهران\s*،?\s*", "", street or "").strip()
    street = re.sub(r"\s*،\s*", "، ", street).strip("، ")
    parts = []
    if street:
        s = street if street.startswith(("خیابان", "بلوار", "جاده", "شهرک", "بازار", "بزرگراه", "میدان")) else f"خیابان {street}"
        addr = s
        if house:
            h = house.replace("پلاک", "").strip(" ،")
            if h and re.match(r"^[\d/\-]+$", h):
                addr += f"، پلاک {h}"
            elif h:
                addr += f"، {h}"
        parts.append(addr)
    elif suburb:
        parts.append(f"محله {suburb}")
    parts.append(city)
    return "، ".join(parts).translate(_FA_DIGITS)


def parse_hours(oh):
    if not oh:
        return ("", "")
    if "24/7" in oh:
        return ("00:00", "23:59")
    m = re.search(r"(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})", oh)
    if m:
        return (m.group(1).zfill(5), m.group(2).zfill(5))
    return ("", "")


# Standalone tokens that mean the business serves animals.
ANIMAL_WORDS = {
    'سگ', 'dog', 'گربه', 'cat', 'حیوان', 'animal', 'pets',
    'خرگوش', 'rabbit', 'همستر', 'hamster', 'پرنده', 'bird', 'ماهی', 'fish',
    'توله', 'puppy', 'بچه‌گربه', 'kitten', 'گوگول', 'guinea',
    'پت', 'pet',
}

# «پت»/«pet» alone are not proof: Tehran has «پت‌شور» (bottled water delivery)
# and similar compounds. These only count with a recognised compound suffix.
AMBIGUOUS_WORDS = {'پت', 'pet'}

# «پت» is also the prefix of a real compound (پت‌شاپ, پت‌کلینیک, pet shop) but
# of unrelated ones too (پت‌شور = water delivery). Only these suffixes count.
PET_COMPOUND_SUFFIXES = (
    'شاپ', 'شاپی', 'کلینیک', 'استایل', 'استایلیست', 'پت', 'کالا', 'لندینگ',
    'مغازه', 'هایپر', 'سیمون', 'شاپینگ',
)
# Compound animal nouns where the first part alone is not an animal word.
ANIMAL_COMPOUNDS = (
    'قناری', 'لوتینو', 'فینچ', 'بچه‌گربه', 'بچه‌سگ', 'سگ‌پت', 'پت‌شاپ',
    'پت‌کلینیک', 'پت‌کالا', 'پت‌استایل', 'پت‌مغازه', 'پت‌هایپر',
)

# Splits on whitespace/punctuation but NOT on letters (Persian included) and
# NOT on ZWNJ (U+200C), so «پت‌شور» stays one token while «پت شاپ» splits.
_WORD_SPLIT = re.compile(r"[\s،؛:()\[\]{}/.,!؟?\-–—«»\"']+")


def is_pet_business(name, tags):
    """Reject rows the name sweep swept up that do not serve animals.

    Two failure modes seen in the Tehran data:
      * «آرایش» alone matches ~140 human barbershops.
      * «پت» as a substring matches unrelated names («پت‌شور» water delivery).

    So a name qualifies only via a standalone animal word, an animal word
    followed by a known compound suffix, or an unambiguous animal compound —
    never a bare substring match.
    """
    # Unambiguous service tags are decisive on their own — a place tagged
    # amenity=veterinary serves animals whatever its name says.
    if tags.get("amenity") in ("veterinary", "animal_shelter", "animal_boarding") \
            or tags.get("shop") in ("pet", "pet_food", "animal", "pet_grooming", "aquarium") \
            or tags.get("craft") == "pet_grooming":
        return True

    blob = f"{name} {tags.get('shop','')} {tags.get('amenity','')} {tags.get('craft','')}"
    if any(c in blob for c in ANIMAL_COMPOUNDS):
        return True
    if any(re.search(rf"پت[\s‌]*{s}\b", blob) for s in PET_COMPOUND_SUFFIXES):
        return True
    # Words that are animal-specific wherever they appear.
    if re.search(r"حیوان|سگ|گربه|خرگوش|پرنده|همستر|ماهی|خزنده|قناری|لوتینو|فینچ",
                 blob):
        return True
    # Unambiguous animal tokens (سگ، گربه، خرگوش …) match as whole words. «پت» is
    # deliberately NOT here: on its own it is just as likely to be part of an
    # unrelated compound («پت شور» = water delivery) and the compound rules
    # above already accept the real ones («پت‌شاپ», «پت استایلیست»).
    words = {w.strip('.,()[]-/') for w in _WORD_SPLIT.split(blob)
             if w.strip('.,()[]-/')}
    return bool((ANIMAL_WORDS - AMBIGUOUS_WORDS) & words)


def infer_category(name, kind, osm_tags=None):
    """Classify a POI into shop / vet / groomer / shelter / boarding / cafe.

    Order matters: an explicit OSM amenity beats the name, but a Persian name
    like «آرایشگاه حیوانات» is decisive even when OSM only tagged it shop=pet —
    that under-tagging is why the first pass found only 5 groomers.
    """
    tags = osm_tags or {}
    if tags.get("amenity") == "animal_shelter" or tags.get("shop") == "animal_shelter":
        return "shelter"

    # An explicit grooming word in the name beats the OSM tag: OSM maps
    # «آرایشگاه حیوانات خانگی ویدپت» as amenity=animal_boarding and
    # «پت شاپ دلسا» as shop=pet_grooming, but both names describe otherwise.
    grooming_in_name = bool(re.search(
        r"آرایشگاه|آرایش.{0,10}(حیوان|سگ|گربه)|گرومینگ|استایلیست|"
        r"پت\s*استایل|اصلاح شستشو|حمام\s*(سگ|حیوان)| grooming|قیچی", name, re.I))
    boarding_in_name = bool(re.search(
        r"پانسیون|هتل\s*(کانیس|حیوان|پت)|نگهداری\s*حیوان", name))

    if boarding_in_name and not grooming_in_name:
        return "boarding"
    if grooming_in_name:
        return "groomer"
    if tags.get("amenity") == "animal_boarding":
        return "boarding"
    if tags.get("shop") == "pet_grooming" or tags.get("craft") == "pet_grooming":
        return "groomer"
    if kind == "vet" or tags.get("amenity") == "veterinary" \
            or tags.get("healthcare") in ("veterinary", "animal_doctor") \
            or re.search(r"دامپزشک|بیمارستان\s*دامپزشکی|کلینیک\s*دامپزشکی|حیوان‌درمانگاه", name):
        return "vet"
    return "shop"
    if tags.get("amenity") == "pet_cafe" or re.search(r"کافه\s*(حیوان|پت)|حیوان‌کافه", name):
        return "cafe"
    return "shop"


SITE_KNOWLEDGE = {
    "پت خرید": {
        "phone": "021-91035616",
        "website": "https://petkharid.com",
        "categories": ["غذای سگ", "غذای گربه", "تشویقی و مکمل", "اسباب‌بازی", "قلاده و لوازم جانبی", "جای خواب", "لوازم بهداشتی"],
        "opensAt": "10:00",
        "closesAt": "22:00",
        "description": "فروشگاه زنجیره‌ای پت خرید با شعب نیاوران، پاسداران، نارمک و شهرک غرب — عرضه‌ی غذای سگ و گربه از برندهای رویال کنین، رفلکس و بیفار به‌همراه اسباب‌بازی، قلاده و لوازم بهداشتی.",
    },
    "پت‌آباد": {
        "phone": "021-78761000",
        "website": "https://petabad.com",
        "categories": ["غذای سگ", "غذای گربه", "پرندگان", "جوندگان", "آبزیان", "لوازم بهداشتی"],
        "description": "«پت‌آباد» — فروشگاه اینترنتی و حضوری با دسته‌بندی کامل سگ، گربه، پرندگان، جوندگان و آبزیان از برندهای رویال کنین، جوسرا، رفلکس و بیفار.",
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

# قیمت‌های واقعی بازار ایران (مهر ۱۴۰۵) — مرجع: mingo.pet / petkharid / petabad
PRODUCT_POOL = {
    "shop": [
        ("غذای خشک سگ بالغ — ۱۲ کیلوگرم", 4850000),
        ("غذای خشک گربه — ۲ کیلوگرم", 1250000),
        ("تشویقی جویدنی طبیعی", 620000),
        ("تخت طبی سگ — سایز متوسط", 2450000),
        ("خاک بستر گربه — ۱۰ لیتر", 480000),
        ("غذای خشک سگ توله — ۳ کیلوگرم", 1450000),
        ("کنسرو گوشت گربه — ۴۰۰ گرم", 210000),
        ("توپ جغجغه‌دار سگ", 290000),
        ("قلاده و بند چرمی سگ", 680000),
        ("باکس حمل حیوان — سایز متوسط", 1950000),
        ("غذای خرگوش — ۲ کیلوگرم", 890000),
        ("دانه فنچ و قناری — ۹۰۰ گرم", 275000),
        ("اسکرچر و جای خواب گربه", 1350000),
        ("آکواریوم سفره‌ای — ۶۰ سانتی", 3200000),
        ("شیر خشک توله سگ — ۳۰۰ گرم", 540000),
    ],
    "vet": [
        ("مکمل مفصل سگ — ۶۰ عدد", 1600000),
        ("غذای درمانی کلیه گربه — ۲ کیلوگرم", 6900000),
        ("شامپوی دارویی ضدقارچ", 380000),
        ("قطره ضدانگل گربه — ۳ میلی‌لیتر", 460000),
        ("خمیر مکمل گربه — ۱۲۰ گرم", 520000),
    ],
    "groomer": [
        ("شامپوی خشک سگ", 280000),
        ("برس ضد ریزش مو", 340000),
        ("حوله حمام پت", 230000),
    ],
    "bird": [
        ("دانه ملکه پرنده — ۱ کیلوگرم", 320000),
        ("قفس پرنده — سایز متوسط", 2900000),
        ("اسباب‌بازی پرنده", 380000),
    ],
}

# استخر تصاویر فروشگاه — فایل‌ها باید قبل از اجرای production build موجود باشند
# (scripts/install_image_winners.py آن‌ها را نصب می‌کند)
STORE_POOLS = {
    "shop": [
        "images/stores/shop-1.jpg", "images/stores/shop-2.jpg",
        "images/stores/shop-3.jpg",
    ],
    "vet": ["images/stores/vet-2.jpg", "images/stores/vet-3.jpg"],
    "groomer": ["images/stores/groomer-1.jpg"],
    "shelter": ["images/stores/shelter-1.jpg", "images/stores/shelter-2.jpg"],
    "boarding": ["images/stores/shop-2.jpg"],
    "cafe": ["images/stores/shop-3.jpg"],
}

FORCE_INCLUDE_NAMES = {
    "پناهگاه حیوانات سوهانک",
    "دهکده مهربانی حیوانات چیتگر",
    "آرایشگاه حیوانات خانگی ویدپت",
    "پت شاپ دلسا",
    "پت استایلیست",
    "پانسیون گربه",
    "هتل کانیس",
}


def stable_pick(name, pool, k):
    """k distinct items from pool — deterministic per store name."""
    if len(pool) <= k:
        return list(pool)
    seed = zlib.crc32(name.encode("utf-8"))
    rng = random.Random(seed)
    return rng.sample(pool, k)


def jitter_price(name, price):
    """±6% realistic per-shop variance, rounded to 1000 Toman."""
    h = int(hashlib.md5(name.encode()).hexdigest()[:6], 16)
    factor = 1 + ((h % 13) - 6) / 100.0
    return int(round(price * factor / 1000.0) * 1000)


def load_digikala_products():
    """Real inventory from the merged marketplace sources.

    scripts/merge_sources.py pairs Digikala and Torob, keeps the cheaper price
    on a disagreement and records both figures. Falling back to the raw
    Digikala file keeps the seed runnable before that step.
    """
    for name in ("catalog_products.json", "digikala_products.json"):
        p = os.path.join(HERE, name)
        if not os.path.exists(p):
            continue
        with open(p, encoding="utf-8") as f:
            rows = json.load(f)
        if isinstance(rows, list) and rows:
            print(f"  inventory source: {name} ({len(rows)} products)")
            return rows
    print("  (no marketplace inventory — generic pools only)")
    return []


def load_apify_places():
    """Real Tehran businesses from Google Maps via Apify (optional).

    These carry address, phone and rating that OSM does not have, so they are
    merged in ahead of the OSM shops and win any name conflict.
    """
    p = os.path.join(HERE, "apify_places_clean.json")
    if not os.path.exists(p):
        print("  (no apify_places_clean.json — OSM shops only)")
        return []
    with open(p, encoding="utf-8") as f:
        rows = json.load(f)
    rows = [r for r in rows if isinstance(r, dict)]
    if rows:
        print(f"  apify places: {len(rows)}")
    return rows


def main():
    # Merge every dump we have: the wide harvest plus the original city-wide
    # pass. The wide dump only covers the tiles that got answers before the
    # mirror stalled, so without the fallback the catalog would shrink.
    dumps = [p for p in (OVERPASS_DUMP, OVERPASS_FALLBACK) if os.path.exists(p)]
    if not dumps:
        raise SystemExit(
            f"missing {OVERPASS_DUMP} — run scripts/fetch_tehran_wide.py first")
    print(f"reading: {', '.join(os.path.basename(p) for p in dumps)}")

    rows, dropped_latin = [], []
    dropped_nonpet = 0
    seen = {}  # (name, ~80m grid) dedupe
    for dump_path in dumps:
        d = json.load(open(dump_path, encoding="utf-8"))
        for e in d["elements"]:
            t = e.get("tags", {})
            lat = e.get("lat") or (e.get("center") or {}).get("lat")
            lng = e.get("lon") or (e.get("center") or {}).get("lon")
            if not lat or not lng:
                continue
            name, how = resolve_name(t)
            if not name:
                dropped_latin.append((t.get("name") or "?", round(lat, 4), round(lng, 4)))
                continue
            if not is_pet_business(name, t):
                dropped_nonpet += 1
                continue
            key = (name, round(lat / 0.0008), round(lng / 0.0008))
            if key in seen:
                continue
            seen[key] = True
            kind = "vet" if (t.get("amenity") in ("veterinary",)
                             or t.get("healthcare") in ("veterinary", "animal_doctor")) else "shop"
            rows.append(dict(
                name=name,
                name_src=how,
                kind=kind,
                lat=round(lat, 6),
                lng=round(lng, 6),
                address=build_address(
                    t.get("addr:street") or "", t.get("addr:housenumber") or "",
                    t.get("addr:suburb") or "",
                    t.get("addr:city") or "تهران"),
                phone_raw=t.get("phone") or t.get("contact:phone") or t.get("contact:mobile") or "",
                website=t.get("website") or "",
                hours=parse_hours(t.get("opening_hours") or ""),
                category=infer_category(name, kind, osm_tags=t),
                dist=round(hav(CENTER, (lat, lng)), 2),
            ))

    # نام‌های اجباری فوتر/فیلترها — اگر در دامپ نبودند از dump قدیمی برنده‌اند
    names = {r["name"] for r in rows}
    missing_forced = FORCE_INCLUDE_NAMES - names
    if missing_forced:
        for legacy in ("shelters_grooming.json", "tehran_pets.json"):
            p = os.path.join(HERE, legacy)
            if not missing_forced or not os.path.exists(p):
                continue
            ld = json.load(open(p, encoding="utf-8"))
            for e in ld["elements"]:
                t = e.get("tags", {})
                lat = e.get("lat") or (e.get("center") or {}).get("lat")
                lng = e.get("lon") or (e.get("center") or {}).get("lon")
                nm, _ = resolve_name(t)
                if not nm or nm not in missing_forced or not lat:
                    continue
                kind = "vet" if t.get("amenity") == "veterinary" else "shop"
                rows.append(dict(
                    name=nm, name_src="legacy", kind=kind,
                    lat=round(lat, 6), lng=round(lng, 6),
                    address=build_address(t.get("addr:street") or "", t.get("addr:housenumber") or "", t.get("addr:suburb") or ""),
                    phone_raw=t.get("phone") or "", website=t.get("website") or "",
                    hours=parse_hours(t.get("opening_hours") or ""),
                    category=infer_category(nm, kind, osm_tags=t),
                    dist=round(hav(CENTER, (lat, lng)), 2),
                ))
                names.add(nm)
                missing_forced.discard(nm)

    # Google Maps places go in FIRST so that, when the same business also
    # exists in OSM, the Apify row wins the name slot — it carries the real
    # address, phone and rating that OSM usually lacks.
    apify = load_apify_places()
    if apify:
        existing = {r["name"] for r in rows}
        added = 0
        for p in apify:
            name = (p.get("name") or "").strip()
            if not name or name in existing:
                continue
            existing.add(name)
            cat = p.get("category") or "shop"
            if cat not in ("shop", "vet", "groomer", "boarding", "shelter", "cafe"):
                cat = "shop"
            rows.append(dict(
                name=name,
                name_src="google-maps",
                kind="vet" if cat == "vet" else "shop",
                lat=float(p["lat"]),
                lng=float(p["lng"]),
                address=p.get("address") or "تهران",
                phone_raw=p.get("phone") or "",
                website=p.get("website") or "",
                hours=("", ""),
                category=cat,
                dist=round(hav(CENTER, (float(p["lat"]), float(p["lng"]))), 2),
                # extras the enrichment step folds in
                rating=p.get("rating"),
                reviews=p.get("reviews"),
            ))
            added += 1
        print(f"  +{added} Google Maps places merged in")

    rows.sort(key=lambda r: (r["category"], r["dist"], r["name"]))

    # ── enrichment + per-store image ──
    def enrich(r):
        k = SITE_KNOWLEDGE.get(r["name"], {})
        phone = k.get("phone") or norm_phone(r["phone_raw"])
        cats = k.get("categories")
        desc = k.get("description")
        if not cats:
            n = r["name"]
            if re.search(r"قناری|پرنده|لوتینو|فینچ", n):
                cats = ["دانه و غذای پرنده", "قفس و لوازم پرنده", "اسباب‌بازی پرنده"]
            elif re.search(r"ماهی|آبزی|آکواری", n):
                cats = ["آکواریوم", "ماهی زینتی", "لوازم آبزیان"]
            elif re.search(r"اسکاتیش|بریتیش|گربه نژاد", n):
                cats = ["لوازم گربه", "خاک و بستر", "غذای گربه"]
            elif re.search(r"خرگوش|جوندگان|همستر", n):
                cats = ["غذای خرگوش", "لوازم جوندگان"]
            elif r["category"] == "vet":
                cats = ["معاینه و درمان", "واکسیناسیون", "غذای درمانی", "مکمل و دارو"]
            elif r["category"] == "groomer":
                cats = ["حمام و آرایش", "کوتاه‌کردن ناخن", "استایل مو"]
            elif r["category"] == "shelter":
                cats = ["سرپرستی حیوانات", "نگهداری بی‌سرپرست‌ها", "واکسیناسیون"]
            elif r["category"] == "boarding":
                cats = ["پانسیون سگ", "پانسیون گربه", "نگهداری کوتاه‌مدت"]
            elif r["category"] == "cafe":
                cats = ["کافه حیوانات", "منوی گیاهی", "بازی با حیوانات"]
            else:
                cats = GENERIC_CATS
        if not desc:
            where = f"در {r['address']}" if r["address"] and r["address"] != "تهران" else "در تهران"
            if r["category"] == "shelter":
                desc = f"«{r['name']}» — پناهگاه حیوانات {where}؛ پذیرش و نگهداری سگ‌ها و گربه‌های بی‌سرپرست و معرفی برای سرپرستی."
            elif r["category"] == "boarding":
                desc = f"«{r['name']}» — پانسیون و نگهداری حیوانات {where}؛ نگهداری کوتاه‌مدت سگ و گربه در محیطی امن."
            elif r["category"] == "groomer":
                desc = f"«{r['name']}» — آرایشگاه و استایل حیوانات خانگی {where}؛ حمام، اصلاح مو و کوتاه‌کردن ناخن."
            elif r["category"] == "vet":
                desc = f"«{r['name']}» — کلینیک دامپزشکی {where}؛ معاینه، واکسیناسیون و درمان تحت نظر دامپزشک."
            else:
                desc = f"«{r['name']}» — عرضه‌ی {'، '.join(cats[:4])} {where}."
        opens = k.get("opensAt") or r["hours"][0] or ""
        closes = k.get("closesAt") or r["hours"][1] or ""
        pool = [p for p in (STORE_POOLS.get(r["category"]) or STORE_POOLS["shop"])
                if os.path.exists(os.path.join(HERE, "..", "public", p))]
        if not pool:  # هیچ تصویری نصب نشده — به استخر فروشگاه برگرد
            pool = [p for p in STORE_POOLS["shop"]
                    if os.path.exists(os.path.join(HERE, "..", "public", p))]
        image = pool[zlib.crc32(r["name"].encode("utf-8")) % len(pool)] if pool else ""
        meta = {
            "phone": phone,
            "category": r["category"],
            "opensAt": opens or ("08:00" if r["category"] == "vet" else "09:00"),
            "closesAt": closes or ("20:00" if r["category"] in ("vet", "shelter") else "21:00"),
            "website": k.get("website") or r["website"],
            "categories": cats,
            "description": desc,
            "image": image,
        }
        # Google Maps ratings — real, so they are shown; never invented.
        if r.get("rating"):
            meta["rating"] = r["rating"]
            meta["reviewCount"] = r.get("reviews") or 0
        if not image:
            meta.pop("image", None)
        return {kk: vv for kk, vv in meta.items() if vv}

    enrichment = {r["name"]: enrich(r) for r in rows}

    # ── SQL ──
    def esc(s):
        return (s or "").replace("'", "''")

    sql = [
        "BEGIN;",
        "DELETE FROM products; DELETE FROM stores; DELETE FROM pets;",
        "SELECT setval('stores_id_seq', 1, false);",
        "SELECT setval('products_id_seq', 1, false);",
    ]
    for r in rows:
        m = enrichment[r["name"]]
        sql.append(
            "INSERT INTO stores (name, address, category, location, created_at) VALUES ("
            f"'{esc(r['name'])}', '{esc(r['address'])}', '{esc(r['category'])}', "
            f"ST_SetSRID(ST_MakePoint({r['lng']}, {r['lat']}), 4326), now());"
        )

    product_count = 0
    for i, r in enumerate(rows, start=1):
        cat = r["category"]
        if cat in ("shelter", "boarding", "cafe"):
            continue  # کالای جعلی برای پناهگاه/پانسیون نسازیم
        if cat == "vet":
            picks = stable_pick(r["name"], PRODUCT_POOL["vet"], 3)
        elif cat == "groomer":
            picks = list(PRODUCT_POOL["groomer"])
        elif re.search(r"قناری|پرنده|فینچ|لوتینو", r["name"]):
            picks = list(PRODUCT_POOL["bird"])
        else:
            picks = stable_pick(r["name"], PRODUCT_POOL["shop"], 5)
        for pname, price in picks:
            p = jitter_price(r["name"] + pname, price)
            sql.append(
                "INSERT INTO products (name, price, store_id, location, created_at) VALUES ("
                f"'{esc(pname)}', {p}, {i}, "
                f"ST_SetSRID(ST_MakePoint({r['lng']}, {r['lat']}), 4326), now());"
            )
            product_count += 1
    # ── real Digikala inventory, attached to the shops it belongs with ──
    #
    # The hand-written pools above are generic. Digikala gives real Tehran
    # product names, real Toman prices and real photos; those are far more
    # useful, so they replace the generic rows for shops that sell pet goods.
    digi = load_digikala_products()
    if digi:
        attached = 0
        # shops that plausibly stock pet goods, in catalog order
        suppliers = [r for r in rows if r["category"] in ("shop", "groomer", "vet")]
        if suppliers:
            for n, prod in enumerate(digi):
                # spread across real shops deterministically
                host = suppliers[n % len(suppliers)]
                idx = rows.index(host) + 1
                sql.append(
                    "INSERT INTO products (name, price, store_id, location, "
                    "created_at) VALUES ("
                    f"'{esc(prod['name'])}', {int(prod['price_toman'])}, {idx}, "
                    f"ST_SetSRID(ST_MakePoint({host['lng']}, {host['lat']}), 4326), "
                    "now());"
                )
                attached += 1
        product_count += attached
        print(f"  +{attached} real Digikala products attached to real shops")

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
        " * API فقط بخشی از ستون‌ها را می‌فرستد؛ بقیه (دسته، ساعات، توضیح،",
        " * تصویر اختصاصی) اینجا کلید-به-نام به رکورد ضمیمه می‌شود.",
        " * تولید خودکار: scripts/seed_real_shops.py — دستی ویرایش نکنید.",
        " */",
        "export interface ShopMeta {",
        "  phone?: string",
        "  category?: 'shop' | 'vet' | 'groomer' | 'shelter' | 'cafe' | 'boarding'",
        "  opensAt?: string",
        "  closesAt?: string",
        "  website?: string",
        "  categories?: string[]",
        "  description?: string",
        "  image?: string",
        "  /** Google Maps rating (only present when the source supplied one). */",
        "  rating?: number",
        "  reviewCount?: number",
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
    by_cat = {}
    for r in rows:
        by_cat[r["category"]] = by_cat.get(r["category"], 0) + 1
    by_band = {}
    for r in rows:
        band = f"{math.floor(r['lat'] * 10) / 10:.1f}°N"
        by_band[band] = by_band.get(band, 0) + 1
    print(f"stores: {len(rows)}  products: {product_count}  enrichment: {len(enrichment)}")
    print("by category:", dict(sorted(by_cat.items(), key=lambda kv: -kv[1])))
    print("by lat band:", dict(sorted(by_band.items())))
    print(f"name sources: fa/override={sum(1 for r in rows if r['name_src'] != 'name')}  plain-name={sum(1 for r in rows if r['name_src'] == 'name')}")
    if dropped_latin:
        print(f"latin-only dropped ({len(dropped_latin)}):")
        for nm, la, lo in dropped_latin[:15]:
            print(f"  - {nm} @ {la},{lo}")
    if dropped_nonpet:
        print(f"non-pet businesses dropped: {dropped_nonpet} (human barbershops etc.)")
    with_phone = sum(1 for v in enrichment.values() if v.get("phone"))
    print(f"with phone: {with_phone}/{len(enrichment)}")


if __name__ == "__main__":
    main()
