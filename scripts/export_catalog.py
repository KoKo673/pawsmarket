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
import io
import json
import os
import re
import subprocess
import sys
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "public", "catalog.json")
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
    # Prefer the deployed database: the local Docker Postgres is optional and
    # often absent, and the published catalog must match what the API serves.
    if os.environ.get("RAILWAY_PGPASSWORD"):
        return from_railway()
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


def from_railway():
    import psycopg2

    conn = psycopg2.connect(
        host=os.environ.get("RAILWAY_DB_HOST", "iriguchi.proxy.rlwy.net"),
        port=int(os.environ.get("RAILWAY_DB_PORT", "49437")),
        dbname=os.environ.get("RAILWAY_DB_NAME", "railway"),
        user=os.environ.get("RAILWAY_DB_USER", "postgres"),
        password=os.environ["RAILWAY_PGPASSWORD"],
        connect_timeout=30,
    )
    try:
        with conn.cursor() as cur:
            cur.execute(SQL)
            data = cur.fetchone()[0]
    finally:
        conn.close()
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


def from_seed_sql():
    """Parse scripts/seed_real.sql.

    Fallback when the database cannot be reached at all — Railway's TCP proxy
    closes when the free tier runs out, and the published catalog still has to
    match what the API serves. The seed SQL is the same data that was applied,
    so a catalog built from it is equivalent rather than approximate.

    Store rows carry their point inline; products inherit the point of the
    store they belong to, exactly as the INSERT does.
    """
    sql = os.path.join(HERE, "seed_real.sql")
    if not os.path.isfile(sql):
        return None
    text = io.open(sql, encoding="utf-8").read()

    def unq(s):
        return s.replace("''", "'")

    stores = []
    pat = re.compile(
        r"INSERT INTO stores \(name, address, category, location, created_at\) "
        r"VALUES \('((?:[^']|'')*)', '((?:[^']|'')*)', '([a-z]+)', "
        r"ST_SetSRID\(ST_MakePoint\(([-\d.]+), ([-\d.]+)\), 4326\), now\(\)\);")
    for i, (name, addr, cat, lng, lat) in enumerate(pat.findall(text), 1):
        stores.append({
            "id": i, "name": unq(name), "address": unq(addr), "category": cat,
            "lat": float(lat), "lng": float(lng), "created_at": "",
        })

    products = []
    ppat = re.compile(
        r"INSERT INTO products \(name, price, store_id, location, created_at\) "
        r"VALUES \('((?:[^']|'')*)', (\d+), (\d+), "
        r"ST_SetSRID\(ST_MakePoint\(([-\d.]+), ([-\d.]+)\), 4326\), now\(\)\);")
    for i, (name, price, sid, lng, lat) in enumerate(ppat.findall(text), 1):
        products.append({
            "id": i, "name": unq(name), "price": int(price),
            "store_id": int(sid),
            "lat": float(lat), "lng": float(lng), "created_at": "",
        })

    pets = [{"id": i, "name": n, "species": s, "lat": la, "lng": lo,
             "created_at": ""}
            for i, (n, s, lo, la) in enumerate(
                re.findall(
                    r"INSERT INTO pets \(name, species, location, created_at\) "
                    r"VALUES \('((?:[^']|'')*)', '([a-z]+)', "
                    r"ST_SetSRID\(ST_MakePoint\(([-\d.]+), ([-\d.]+)\), 4326\), "
                    r"now\(\)\);", text), 1)]

    if not stores:
        return None
    return {"pets": pets, "products": products, "stores": stores}


def main():
    catalog = None
    source = ""
    try:
        catalog = from_db()
        source = "postgresql:railway (full tables)"
    except Exception as exc:  # noqa: BLE001
        print(f"db export failed ({exc}); trying seed_real.sql", file=sys.stderr)
        try:
            catalog = from_seed_sql()
            source = "seed_real.sql (db unreachable)"
        except Exception as exc2:  # noqa: BLE001
            print(f"seed sql parse failed ({exc2}); falling back to API",
                  file=sys.stderr)
            catalog = {"pets": get("/api/pets"), "products": get("/api/products"),
                       "stores": get("/api/stores/nearby")}
            source = API

    catalog["_generatedAt"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    catalog["_source"] = source
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False, indent=1)
    print(f"wrote public/catalog.json [{source}]: "
          f"{len(catalog['stores'])} stores, {len(catalog['products'])} products, "
          f"{len(catalog['pets'])} pets")


if __name__ == "__main__":
    main()
