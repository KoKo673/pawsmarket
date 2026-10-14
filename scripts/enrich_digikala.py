# -*- coding: utf-8 -*-
"""
Enrich the catalogue with live Digikala data through the digikala-mcp server.

Why
---
The catalogue carries an approximate rating (a 0-100 score with no review
count) and a price with no history. Both matter for a marketplace: «۴٫۳ ★ ·
۱۱۲۷۷ نظر» is evidence, «۸۳٪» is not, and «کمترین قیمت ۳۰ روز» is the one
thing a shopper cannot get anywhere else.

This matches each catalog product to its Digikala listing and records:
  * rating (0-5) and rating_count — the real figures
  * the 30-day price window (lowest / highest) so the UI can show whether
    today's price is actually good
  * the seller, and the product's own URL

Matching is by normalised title, which is why merge_sources.py already folds
Persian glyph variants and strips marketing filler — the same normaliser is
reused so a title matches here exactly as it did there.

Usage:
  PYTHONIOENCODING=utf-8 python scripts/enrich_digikala.py [--limit N] [--recheck]
Writes scripts/product_enrichment.json
"""
import argparse
import json
import os
import re
import subprocess
import sys
import time
import unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
CATALOG = os.path.join(HERE, "catalog_products.json")
OUT = os.path.join(HERE, "product_enrichment.json")
CACHE = os.path.join(HERE, ".digikala_lookup_cache.json")

UVX = os.environ.get(
    "UVX", r"C:\Users\HP\AppData\Roaming\Python\Python314\Scripts\uvx.exe")
PKG = "digikala-mcp"

FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹"


def norm(s: str) -> str:
    """Same folding the merge step uses, so titles match across sources."""
    if not s:
        return ""
    s = unicodedata.normalize("NFKC", str(s))
    s = (s.replace("ي", "ی").replace("ك", "ک").replace("‌", " ")
          .replace("أ", "ا").replace("إ", "ا"))
    s = re.sub(r"(اصل|اورجینال|خام|تضمینی|پک|بسته|عدد|فروش|ویژه|تخفیف|"
               r"ارسال|رایگان|بهترین|قیمت|جدید|شرکتی)", " ", s)
    s = re.sub(r"[" + FA_DIGITS + r"]", lambda m: str(FA_DIGITS.index(m.group())), s)
    s = re.sub(r"[^\w\s]", " ", s, flags=re.UNICODE)
    return re.sub(r"\s+", " ", s).strip().lower()


def _queries(name: str) -> list[str]:
    """Search phrasings for one catalogue title, most specific first.

    Digikala's search does best with a short, distinctive query. A 90-character
    title with a weight and a pack size on the end matches nothing, which is
    what left 40% of the catalogue unenriched. The model code is the strongest
    signal («اندوپت B122»), then the brand, then the trimmed title.
    """
    out: list[str] = []
    # A Latin/numeric model code, e.g. «B122», «ADULT1400», «SM», «P02».
    for code in re.findall(r"\b[A-Za-z]{1,6}[-]?\d{1,6}\b|\b[A-Z]{2,6}\b",
                           name):
        if len(code) >= 2:
            head = re.split(r"\s+(?:مدل|کد)\s+", name)[0]
            out.append(f"{head} {code}".strip()[:48])
            break
    # Brand token + the leading product noun.
    words = name.split()
    if len(words) >= 3:
        out.append(" ".join(words[:5])[:48])
    out.append(name[:48])
    # De-duplicate while keeping order.
    seen, uniq = set(), []
    for q in out:
        if q and q not in seen:
            seen.add(q)
            uniq.append(q)
    return uniq[:3]


class Mcp:
    """One long-lived digikala-mcp process, queried over stdio."""

    def __init__(self):
        self.proc = subprocess.Popen(
            [UVX, PKG], stdin=subprocess.PIPE, stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL, text=True, encoding="utf-8", bufsize=1,
            env=dict(os.environ, PYTHONIOENCODING="utf-8"))
        self.id = 0
        self._call("initialize", {
            "protocolVersion": "2024-11-05", "capabilities": {},
            "clientInfo": {"name": "pawsmarket", "version": "1"}})
        self._notify("notifications/initialized")

    def _notify(self, method, params=None):
        self.proc.stdin.write(json.dumps(
            {"jsonrpc": "2.0", "method": method, "params": params or {}}) + "\n")
        self.proc.stdin.flush()

    def _call(self, method, params, timeout=120):
        self.id += 1
        want = self.id
        self.proc.stdin.write(json.dumps(
            {"jsonrpc": "2.0", "id": want, "method": method,
             "params": params}) + "\n")
        self.proc.stdin.flush()
        deadline = time.time() + timeout
        while time.time() < deadline:
            line = self.proc.stdout.readline()
            if not line:
                return None
            try:
                msg = json.loads(line.strip())
            except json.JSONDecodeError:
                continue
            if msg.get("id") == want:
                return msg
        return None

    def tool(self, name, args, timeout=120):
        res = self._call("tools/call", {"name": name, "arguments": args},
                         timeout)
        if not res or "error" in res:
            return None
        for block in res.get("result", {}).get("content", []):
            if block.get("type") == "text":
                try:
                    return json.loads(block["text"])
                except json.JSONDecodeError:
                    return None
        return None

    def close(self):
        try:
            self.proc.kill()
        except Exception:  # noqa: BLE001
            pass


def load_cache():
    if os.path.exists(CACHE):
        try:
            with open(CACHE, encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            pass
    return {}


def save_cache(c):
    tmp = CACHE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(c, f, ensure_ascii=False)
    os.replace(tmp, CACHE)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--recheck", action="store_true",
                    help="ignore the cache and ask again")
    args = ap.parse_args()

    catalog = json.load(open(CATALOG, encoding="utf-8"))
    out = {}
    if os.path.exists(OUT):
        with open(OUT, encoding="utf-8") as f:
            out = json.load(f)
    cache = {} if args.recheck else load_cache()

    todo = [r for r in catalog if r["name"] not in out]
    if args.limit:
        todo = todo[:args.limit]
    print(f"{len(catalog)} products · {len(out)} already enriched · "
          f"{len(todo)} to look up")

    mcp = Mcp()
    matched = missed = 0
    try:
        for i, row in enumerate(todo, 1):
            key = norm(row["name"])
            found = None

            if key in cache:
                found = cache[key]
            else:
                # A full title is a poor query: Digikala's own search trims
                # long strings and returns near-misses, which is why 40% of
                # the catalogue found nothing. The brand plus the model code
                # is what actually identifies a product, so it is tried first
                # and the full title only as a fallback.
                found = None
                for query in _queries(row["name"]):
                    res = mcp.tool("dk_search", {"query": query, "limit": 10})
                    items = (res or {}).get("products") or []
                    for it in items:
                        if norm(it.get("title", "")) == key:
                            found = it
                            break
                    if found is None:
                        for it in items:
                            t = norm(it.get("title", ""))
                            if key and (key in t or t in key) and \
                                    abs(len(t) - len(key)) <= 14:
                                found = it
                                break
                    if found is not None:
                        break
                    time.sleep(0.3)
                cache[key] = found
                # Checkpoint every 25 rather than after every product: the
                # full map is 360 KB, so writing it per iteration meant ~380 MB
                # of JSON written to produce a 360 KB file on a single run.
                if i % 25 == 0:
                    save_cache(cache)

            if not found:
                missed += 1
                continue

            if not found:
                missed += 1
                continue

            rec = {
                "digikala_id": found.get("id"),
                "url": found.get("url"),
                "seller": found.get("seller"),
            }
            if found.get("rating") is not None:
                rec["rating"] = found["rating"]
                rec["rating_count"] = found.get("rating_count") or 0
            price = found.get("price")
            if price:
                rec["digikala_price"] = price
            if found.get("discount_pct"):
                rec["discount_pct"] = found["discount_pct"]

            # Price history is a second round trip, so only for products we
            # actually matched — it is what makes «کمترین قیمت ۳۰ روز» possible.
            if found.get("id"):
                hist = mcp.tool("dk_price_history",
                                {"product_id": found["id"]}, timeout=90)
                var = ((hist or {}).get("variants") or [{}])[0]
                if var.get("lowest") and var.get("highest"):
                    rec["price_low_30d"] = var["lowest"]
                    rec["price_high_30d"] = var["highest"]

            out[row["name"]] = rec
            matched += 1

            if i % 10 == 0 or i == len(todo):
                tmp = OUT + ".tmp"
                with open(tmp, "w", encoding="utf-8") as f:
                    json.dump(out, f, ensure_ascii=False, indent=1)
                os.replace(tmp, OUT)
                print(f"  [{i}/{len(todo)}] matched {matched}, no match {missed}",
                      flush=True)
    finally:
        mcp.close()

    tmp = OUT + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    os.replace(tmp, OUT)
    print(f"\nwrote {OUT}: {len(out)} products "
          f"(+{matched} this pass, {missed} unmatched)")


if __name__ == "__main__":
    main()