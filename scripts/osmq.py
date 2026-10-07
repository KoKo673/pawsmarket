# -*- coding: utf-8 -*-
"""
Minimal, patient Overpass client.

The public mirrors (overpass-api.de, kumi.systems, …) return
"runtime error: … server is probably too busy" constantly, so this:
  * rotates every mirror
  * retries patiently with backoff
  * keeps a small on-disk cache keyed by the query, so a query that already
    succeeded is never re-fetched (this is what makes a 200-query sweep
    survivable when the mirrors flake)

Usage as a library:  from osmq import query, query_many
"""
import hashlib
import json
import os
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, ".overpass-cache")
UA = "PawsMarket/1.0 (Tehran pet services research)"

# mirrors known to be up, best first; osm.ch answers but its snapshot has no
# Iranian coverage, so it is only a liveness probe
ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
    "https://overpass.osm.jp/api/interpreter",
]


def _cache_path(q):
    return os.path.join(CACHE, hashlib.sha1(q.encode()).hexdigest() + ".json")


def cached(q):
    p = _cache_path(q)
    if os.path.exists(p):
        try:
            with open(p, encoding="utf-8") as f:
                return json.load(f)
        except Exception:  # noqa: BLE001
            return None
    return None


def _store(q, data):
    os.makedirs(CACHE, exist_ok=True)
    tmp = _cache_path(q) + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)
    os.replace(tmp, _cache_path(q))


def raw_get(endpoint, q, timeout):
    r = subprocess.run(
        ["curl", "-sS", "-G", "--max-time", str(timeout), "-A", UA,
         "--data-urlencode", f"data={q}", endpoint],
        capture_output=True)
    return r.stdout.decode("utf-8", "replace")


def query(q, tries=14, timeout=180, verbose=False):
    """Run an Overpass query, with cache + mirror rotation. None on failure."""
    hit = cached(q)
    if hit is not None:
        return hit
    last = ""
    for attempt in range(tries):
        ep = ENDPOINTS[attempt % len(ENDPOINTS)]
        body = raw_get(ep, q, timeout)
        if body.lstrip().startswith("{"):
            try:
                data = json.loads(body)
            except Exception:  # noqa: BLE001
                last = "bad json"
                continue
            _store(q, data)
            return data
        last = "busy/err"
        # mirrors are rate-limited; back off harder each round
        time.sleep(min(5 + attempt * 6, 75))
        if verbose:
            print(f"    retry {attempt+1}/{tries} ({last})", flush=True)
    if verbose:
        print(f"    GAVE UP after {tries}: {q[:70]}", flush=True)
    return None


def build(bbox, selector, timeout=120):
    """Build an Overpass query.

    `selector` is the inner filter text, e.g. '"shop"="pet"' — build() adds the
    brackets. A bracketed selector used to be stripped here, which silently
    mangled the few valid selector shapes that legitimately contain brackets
    (set-union forms) into a *different* filter that still returned rows, so
    the harvest looked fine while collecting the wrong data. Reject instead.

    Two other things that cost real debugging time, kept explicit:
      * `node`, not `nwr` — with `nwr` this mirror times out on every Tehran
        bbox while the same query returns data as `node`.
      * the bbox is a PARENTHESIS group `(s,w,n,e)`, not `[...]`; the latter
        fails with "parse error: ',' found".
    """
    s, w, n, e = bbox
    sel = selector.strip()
    if sel.startswith('[') or sel.endswith(']'):
        raise ValueError(
            f'selector must be inner filter text without brackets: {selector!r}')
    return ("[out:json][timeout:%d];" % timeout
            + f"node[{sel}]({s},{w},{n},{e});"
            + "out center tags;")


def query_many(pairs, verbose=True):
    """pairs: list of (label, selector, bbox). Returns {label: elements}."""
    out = {}
    for label, selector, bbox in pairs:
        q = build(bbox, selector)
        data = query(q, verbose=verbose)
        els = (data or {}).get("elements", []) if data else []
        out[label] = els
        if verbose:
            print(f"  {label:34} {len(els):4d}", flush=True)
    return out


if __name__ == "__main__":
    sel = sys.argv[1] if len(sys.argv) > 1 else '"shop"="pet"'
    bbox = (35.55, 51.05, 35.85, 51.65)
    if len(sys.argv) > 2:
        bbox = tuple(float(x) for x in sys.argv[2:6])
    d = query(build(bbox, sel), verbose=True)
    print(f"elements: {len((d or {}).get('elements', [])) if d else 'FAILED'}")