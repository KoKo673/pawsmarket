# -*- coding: utf-8 -*-
"""
Harvest real product photos and captions from Instagram via Apify.

Purpose in this project: Digikala and Torob give us names, prices and a
single catalogue photo each. Instagram is where Iranian pet shops actually
photograph real stock — shelves, new arrivals, packaging — so this source
supplies the imagery and the descriptive text that the retail catalogues do not.

Instagram requires an authenticated session for search. Credentials come from
the environment and are never written to the output file:

  IG_USERNAME / IG_PASSWORD

Usage:
  APIFY_TOKEN=... IG_USERNAME=... IG_PASSWORD=... \
    PYTHONIOENCODING=utf-8 python scripts/fetch_instagram.py

Writes scripts/instagram_media.json
"""
import json
import os
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "instagram_media.json")

TOKEN = os.environ.get("APIFY_TOKEN", "")
IG_USER = os.environ.get("IG_USERNAME", "")
IG_PASS = os.environ.get("IG_PASSWORD", "")

ACTOR = "apify~instagram-scraper"

# Account keywords Tehran shops actually use. Pet shops, vets and groomers
# post in Persian far more than in English.
ACCOUNTS = [
    "petshop.tehran", "pet_shop_tehran", "petshoptehran",
    "dog_pet_shop_tehran", "cat_pet_shop_tehran",
    "veterinary.tehran", "vet_clinic_tehran", "doktor_veterinar",
    "pet_grooming_tehran", " grooming_tehran",
    "pet_shop_iran", "petshop_iran", "petstore_iran",
    "فروشگاه_پت", "پت_شاپ", "دامپزشکی", "آرایشگاه_حیوانات",
    "لوازم_ petshop", "pet_shop_tehran_", "petstore.tehran",
]

# Only keep posts that are plausibly a product/pet photo we can show.
KEEP_TERMS = (
    "غذا", "خرده", "بسته", "پک", "کیلو", "گرم", "مدل", "برند",
    "موجود", "جدید", "فروش", "تخفیف", "قیمت", "اسکای", "پت",
    "کنسرو", "تشویقی", "مکمل", "ویتامین", "شامپو", "تخت", "پتو",
    "قلاده", "باکس", "اسباب", "خاک", "آکواریوم", "قفس",
    "food", "kibble", "treat", "cat", "dog", "pet", "shampoo",
)


def run(input_payload, wait=280):
    url = (f"https://api.apify.com/v2/acts/{ACTOR}/runs"
           f"?waitForFinish={wait}&token={TOKEN}")
    r = subprocess.run(
        ["curl", "-sS", "--max-time", str(wait + 60), "-X", "POST", url,
         "-H", "Content-Type: application/json",
         "--data-binary", json.dumps(input_payload)],
        capture_output=True)
    try:
        j = json.loads(r.stdout.decode("utf-8", "replace"))
    except json.JSONDecodeError:
        return None
    if "error" in j:
        return None
    return j["data"]


def dataset_items(dataset_id, limit=40):
    url = (f"https://api.apify.com/v2/datasets/{dataset_id}/items"
           f"?limit={limit}&token={TOKEN}")
    r = subprocess.run(["curl", "-sS", "--max-time", "60", url],
                       capture_output=True)
    try:
        items = json.loads(r.stdout.decode("utf-8", "replace"))
    except json.JSONDecodeError:
        return []
    # the actor reports a single pseudo-item when a query yields nothing
    if isinstance(items, list) and len(items) == 1 and "error" in items[0]:
        return []
    return items if isinstance(items, list) else []


def save(rows):
    tmp = OUT + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, indent=1)
    os.replace(tmp, OUT)


def main():
    if not TOKEN:
        raise SystemExit("set APIFY_TOKEN")
    if not (IG_USER and IG_PASS):
        print("IG_USERNAME/IG_PASSWORD not set — running anonymously "
              "(yields little; Instagram gates search behind login)", flush=True)

    login = {"username": IG_USER, "password": IG_PASS} if IG_USER else None
    seen, rows = set(), []

    for i, account in enumerate(ACCOUNTS, 1):
        payload = {"resultsLimit": 12, "search": account}
        if login:
            payload["login"] = login
        print(f"[{i}/{len(ACCOUNTS)}] @{account} …", flush=True)
        data = run(payload)
        if not data or not data.get("defaultDatasetId"):
            save(rows)
            time.sleep(1)
            continue
        items = dataset_items(data["defaultDatasetId"])
        added = 0
        for it in items:
            url = it.get("url") or it.get("shortCode")
            if not url or url in seen:
                continue
            caption = (it.get("caption") or "").strip()
            text = f"{it.get('fullName','')} {caption}"
            if not any(t in text for t in KEEP_TERMS):
                continue
            seen.add(url)
            rows.append({
                "account": it.get("username"),
                "name": it.get("fullName"),
                "url": url,
                "caption": caption[:600],
                "image": it.get("displayUrl") or it.get("thumbnailUrl"),
                "likes": it.get("likesCount"),
                "comments": it.get("commentsCount"),
                "timestamp": it.get("takenAt") or it.get("timestamp"),
                "source": "instagram-via-apify",
            })
            added += 1
        save(rows)
        print(f"    +{added} (total {len(rows)})", flush=True)
        time.sleep(1.2)

    save(rows)
    print(f"\nwrote {OUT}")
    print(f"  media: {len(rows)}")
    print(f"  with image: {sum(1 for r in rows if r['image'])}")
    print(f"  with caption: {sum(1 for r in rows if r['caption'])}")


if __name__ == "__main__":
    main()