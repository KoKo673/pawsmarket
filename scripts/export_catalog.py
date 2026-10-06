# -*- coding: utf-8 -*-
"""
Export the catalog snapshot to public/catalog.json for published builds
(GitHub Pages can't reach localhost:9232).

Primary path: direct PostGIS query via `docker exec … psql --json`
(fetches ALL rows; the HTTP /api/stores/nearby endpoint caps at 10).
Fallback: HTTP aggregation from the API (same wire shape).

Run before the production build:
    python scripts/export_catalog.py
"""
import datetime
import json
import subprocess
import sys
import urllib.request

API = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:9232"
ORIGIN = "lat=35.6892&lng=51.389&radius=100"
CONTAINER = "serverdash-database-1"

SQL = r"""
SELECT json_build_object(
  'pets', COALESCE((SELECT json_agg(t) FROM (
     SELECT id, name, species,
            ST_Y(location) AS lat, ST_X(location) AS lng, created_at
     FROM pets) t), '[]'::json),
  'products', COALESCE((SELECT json_agg(t) FROM (
     SELECT id, name, price, store_id,
            ST_Y(location) AS lat, ST_X(location) AS lng, created_at
     FROM products) t), '[]'::json),
  'stores', COALESCE((SELECT json_agg(t) FROM (
     SELECT id, name, address, category,
            ST_Y(location) AS lat, ST_X(location) AS lng, created_at
     FROM stores) t), '[]'::json)
);
"""


def from_db():
    out = subprocess.run(
        ["docker", "exec", CONTAINER, "psql", "-U", "myuser", "-d", "mydatabase",
         "-t", "-A", "-c", SQL],
        capture_output=True, timeout=30,
    )
    # Windows subprocess defaults to cp1252 — force UTF-8 for Persian rows
    stdout = out.stdout.decode("utf-8")
    stderr = out.stderr.decode("utf-8", errors="replace")
    if out.returncode != 0:
        raise RuntimeError(stderr.strip() or "psql failed")
    data = json.loads(stdout.strip())
    for k in ("pets", "products", "stores"):
        if not isinstance(data.get(k), list):
            raise RuntimeError(f"db payload missing list: {k}")
    return data


def get(path):
    url = f"{API}{path}?{ORIGIN}"
    with urllib.request.urlopen(url, timeout=30) as r:
        data = json.loads(r.read().decode("utf-8"))
    if not isinstance(data, list):
        raise RuntimeError(f"unexpected payload from {url}")
    return data


def main():
    try:
        catalog = from_db()
        source = "postgresql:serverdash-database-1 (full tables)"
    except Exception as exc:  # noqa: BLE001 — fall back to HTTP
        print(f"db export failed ({exc}); falling back to API", file=sys.stderr)
        catalog = {"pets": get("/api/pets"), "products": get("/api/products"),
                   "stores": get("/api/stores/nearby")}
        source = API

    catalog["_generatedAt"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    catalog["_source"] = source
    with open("public/catalog.json", "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False, indent=1)
    print(f"wrote public/catalog.json [{source}]: "
          f"{len(catalog['stores'])} stores, {len(catalog['products'])} products, {len(catalog['pets'])} pets")


if __name__ == "__main__":
    main()
