# -*- coding: utf-8 -*-
"""
Harvest product prices from Torob through the LOCAL torob-mcp container.

The project's hosted MCP copy runs on Cloudflare, which Torob treats as a
datacenter client and pauses ("Torob challenged this server recently"). Running
the MCP in Docker on this host means requests leave from the host's own
connection, so that block does not apply.

Torob's value over Digikala here is the price comparison: one product, many
sellers, so it gives a second price to cross-check Digikala against.

Requires the container:
    docker run -d --name torob-mcp -p 3000:3000 torob-mcp:local

Usage:
  PYTHONIOENCODING=utf-8 python scripts/fetch_torob.py
Writes scripts/torob_products.json
"""
import json
import os
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "torob_products.json")
MCP_URL = os.environ.get("TOROB_MCP_URL", "http://localhost:3000/mcp")

# Same category sweep the Digikala script uses, so the two sources cover the
# same ground and can be compared row by row.
QUERIES = [
    "غذای خشک سگ", "غذای خشک گربه", "کنسرو گربه", "غذای مرطوب گربه",
    "غذای خرگوش", "غذای پرنده", "دانه قناری", "غذای ماهی",
    "مکمل غذای سگ", "مکمل غذای گربه", "شیر خشک توله سگ",
    "مکمل مفصل سگ", "قرص گیاهی گربه", "قطره ضدانگل گربه",
    "شامپو سگ", "شامپو گربه", "پماد ضدقارچ گربه", "ویتامین سگ",
    "تخت سگ", "پتو سگ", "باکس حمل گربه", "قلاده سگ",
    "اسباب بازی سگ", "اسباب بازی گربه", "پنجه گربه",
    "قفس پرنده", "ظرف آب پرنده",
    "خاک بستر گربه", "کیسه بهداشتی سگ", "پوشک سگ",
    "آکواریوم", "دکور ماهی", "فیلتر آکواریوم",
]

PET_MARKERS = ("حیوان", "سگ", "گربه", "پرنده", "خرگوش", "ماهی",
               "همستر", "پت", "قناری", "طوطی", "آکواریوم")
NON_PET = ("موبایل", "لپ تاپ", "کامپیوتر", "تبلت", "الکترونیکی",
           "پوشاک", "کفش", "زیور", "عطر", "جواهر")


def rpc(tool, args, timeout=90):
    body = json.dumps({
        "jsonrpc": "2.0", "id": 1, "method": "tools/call",
        "params": {"name": tool, "arguments": args},
    }).encode("utf-8")
    req = urllib.request.Request(
        MCP_URL, data=body, method="POST",
        headers={"content-type": "application/json",
                 "accept": "application/json, text/event-stream"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        raw = r.read().decode("utf-8", "replace")
    for line in raw.splitlines():
        if line.startswith("data: "):
            outer = json.loads(line[6:])
            text = outer.get("result", {}).get("content", [{}])[0].get("text", "")
            try:
                return json.loads(text)
            except json.JSONDecodeError:
                return None
    return None


def main():
    seen, rows = set(), []
    for i, q in enumerate(QUERIES, 1):
        try:
            data = rpc("search_products", {"query": q, "limit": 20})
        except Exception as exc:  # noqa: BLE001
            print(f"  [{i}/{len(QUERIES)}] {q}: {type(exc).__name__}", flush=True)
            continue
        if not data:
            print(f"  [{i}/{len(QUERIES)}] {q}: no data", flush=True)
            continue

        added = 0
        for p in data.get("products") or []:
            name = (p.get("name_fa") or "").strip()
            if not name or name in seen:
                continue
            blob = name
            if any(x in blob for x in NON_PET):
                continue
            if not any(m in blob for m in PET_MARKERS):
                continue
            price = p.get("price_toman")
            if not price or int(price) < 10_000:
                continue
            seen.add(name)
            rows.append({
                "name": name,
                "price_toman": int(price),
                "brand": p.get("shop_name"),
                "image": p.get("image"),
                "category": q,
                "prk": p.get("prk"),
                "offers": len(p.get("offers") or []),
                "source": "torob",
            })
            added += 1
        total = (data.get("total_matches") or "?")
        print(f"  [{i}/{len(QUERIES)}] {q}: {total} matches, +{added} "
              f"(total {len(rows)})", flush=True)

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, indent=1)

    print(f"\nwrote {OUT}")
    print(f"  products: {len(rows)}")
    if rows:
        pr = sorted(r["price_toman"] for r in rows)
        print(f"  price range: {pr[0]:,} .. {pr[-1]:,} Toman")
        print(f"  with image: {sum(1 for r in rows if r['image'])}/{len(rows)}")


if __name__ == "__main__":
    main()