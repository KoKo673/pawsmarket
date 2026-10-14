# -*- coding: utf-8 -*-
"""
End-to-end test of the booking flow against the deployed API.

Drives the whole path a real booking takes — customer requests, business
opens its link, confirms, customer sees the answer — because the interesting
failures here are in the handoff, not in any single call. It also checks the
guard rails: a request in the past, at 3am, at a pet shop, or with a bad
phone number must all be refused.

Usage:
  PYTHONIOENCODING=utf-8 python scripts/e2e_booking.py
"""
import json
import os
import sys
import time
import urllib.error
import urllib.request

API = os.environ.get(
    "PAWSMARKET_API", "https://api-production-2527.up.railway.app")

FAILS: list[str] = []


def call(method, path, body=None, token=None, expect=(200,)):
    url = f"{API}{path}"
    headers = {"Accept": "application/json"}
    data = None
    if body is not None:
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    last = None
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=45) as r:
                raw = r.read().decode("utf-8", "replace")
                code = r.status
            last = None
            break
        except urllib.error.HTTPError as e:
            raw = e.read().decode("utf-8", "replace")
            code = e.code
            last = None
            break
        except Exception as e:  # noqa: BLE001 — the link is slow and drops
            last = e
            time.sleep(2 * (attempt + 1))
    if last is not None:
        return 0, {"error": str(last)[:100]}
    try:
        parsed = json.loads(raw) if raw.strip() else None
    except json.JSONDecodeError:
        parsed = {"raw": raw[:200]}
    if code not in expect:
        FAILS.append(f"{method} {path} -> {code}: {str(parsed)[:120]}")
    return code, parsed


def main():
    # A real service business to book at.
    code, stores = call("GET", "/api/stores/nearby"
                               "?lat=35.72&lng=51.39&max_distance=30000&limit=400")
    if not isinstance(stores, list) or not stores:
        print("could not list stores:", str(stores)[:120])
        return 1
    vet = next((s for s in stores if s.get("category") == "vet"), None)
    shop = next((s for s in stores if s.get("category") == "shop"), None)
    print(f"target: {vet['name']} (id {vet['id']})")

    future = time.strftime("%Y-%m-%dT10:00:00",
                           time.localtime(time.time() + 3 * 86400))
    base = {
        "store_id": vet["id"],
        "service": "واکسیناسیون",
        "preferred_at": future,
        "window_minutes": 60,
        "contact_name": "کاربر تست",
        "contact_phone": "09120000000",
        "note": "توله‌ی سه‌ماهه است.",
    }

    # Each guard is judged on the code IT returned, not on the global failure
    # list — the earlier version compared running totals, so a single failure
    # anywhere made every later check print the same verdict.
    print("\n— guard rails —")

    def guard(label, body, want):
        n = len(FAILS)
        code, _ = call("POST", "/api/bookings", body, expect=(want,))
        ok = code == want and len(FAILS) == n
        print(f"  {label:23}: {'ok' if ok else f'NO (got {code})'}")

    past = time.strftime("%Y-%m-%dT10:00:00",
                         time.localtime(time.time() - 3 * 86400))
    guard("past date refused", {**base, "preferred_at": past}, 422)
    guard("3am refused",
          {**base, "preferred_at": f"{future[:11]}03:00:00"}, 422)
    if shop:
        guard("pet shop refused", {**base, "store_id": shop["id"]}, 422)
    guard("bad phone refused", {**base, "contact_phone": "12"}, 422)
    guard("unknown store refused", {**base, "store_id": 999999}, 404)

    print("\n— happy path —")
    fails_before = len(FAILS)
    code, created = call("POST", "/api/bookings", base, expect=(201,))
    if code != 201:
        print("  create failed:", str(created)[:160])
        return 1
    bid = created.get("id")
    tok = created.get("manage_token")
    print(f"  created booking #{bid}  status={created.get('status')}")
    print(f"  manage token issued   : {'yes' if tok else 'NO'}")

    # The business side: open the link, no account.
    code, seen = call("GET", f"/api/bookings/manage/{tok}", expect=(200,))
    print(f"  business sees it      : {seen.get('store_name')} / "
          f"{seen.get('service')} / {seen.get('contact_name')}")
    if seen.get("status") != "pending":
        FAILS.append(f"new booking not pending: {seen.get('status')}")

    code, dec = call("POST", f"/api/bookings/manage/{tok}/decision",
                     {"action": "confirm", "decision_note": "ساعت ۱۰ بیایید."})
    print(f"  business confirms     : {dec.get('status')}")

    # A second answer must not overwrite the first.
    n = len(FAILS)
    call("POST", f"/api/bookings/manage/{tok}/decision",
         {"action": "decline"}, expect=(409,))
    print(f"  re-answer refused     : {'ok' if len(FAILS) > n else 'NO'}")

    code, bad = call("GET", "/api/bookings/manage/not-a-real-token",
                     expect=(404,))
    print(f"  bad token refused     : {'ok' if code == 404 else 'NO'}")

    print("\nresult:", "ALL PASSED" if len(FAILS) == fails_before
          else f"{len(FAILS) - fails_before} FAILURE(S)")
    if FAILS:
        for f in FAILS:
            print("  ✗", f)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())