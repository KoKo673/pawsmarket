# -*- coding: utf-8 -*-
"""
Full visitor journey on the PUBLISHED site: sign up → build a pet profile →
post a moment → confirm it appears on the profile and in the feed.

API-level tests cannot see any of this: they bypass the wizard's validation,
its image upload, and the optimistic UI. Those are exactly the places a
new user gives up, so they are the ones worth driving through the browser.

Usage:
  PYTHONIOENCODING=utf-8 python scripts/e2e_userflow_live.py
"""
import argparse
import os
import random
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e2e_live as L  # noqa: E402

PASS = "JourneyPass!2026"


API_BASE = "https://api-production-2527.up.railway.app"


def api(p, method, path, body=None):
    """Call the API from inside the page, so it carries the stored token.

    The URL is absolute on purpose: a relative '/api/...' resolves against
    koko673.github.io, which answers 405 — the app itself prefixes
    VITE_API_BASE_URL, and a test that does not was measuring GitHub Pages
    rather than the backend.

    Always returns {status, body} with body as a dict where the response was
    JSON — Runtime.evaluate hands back whatever the promise resolved to, and a
    non-JSON error page resolves to a plain string.
    """
    raw = p.eval(f"""(async () => {{
      const r = await fetch({API_BASE + path!r}, {{
        method: {method!r},
        headers: {{'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' +
                      localStorage.getItem('pawsmarket-auth-token')}},
        {('body: JSON.stringify(' + repr(body) + '),') if body else ''}
      }});
      const t = await r.text();
      try {{ return {{ status: r.status, body: JSON.parse(t) }}; }}
      catch (e) {{ return {{ status: r.status, body: {{ raw: t.slice(0,300) }} }}; }}
    }})()""")
    if not isinstance(raw, dict):
        return {"status": 0, "body": {"raw": str(raw)[:300]}}
    body_out = raw.get("body")
    if not isinstance(body_out, dict):
        body_out = {"raw": str(body_out)[:300]}
    return {"status": raw.get("status", 0), "body": body_out}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default="https://koko673.github.io/pawsmarket/")
    ap.add_argument("--shots",
                    default="C:/Users/HP/Downloads/office/_live_shots")
    args = ap.parse_args()
    os.makedirs(args.shots, exist_ok=True)

    L.start_chrome()
    p = L.new_page(args.url)
    time.sleep(2)
    base = args.url if args.url.endswith("#") else args.url + "#"

    user = f"journey{random.randint(10000, 99999)}"
    pet_name = random.choice(["تنه", "پنبه", "نمنم", "هیرمان"])

    print(f"visitor: {user}\n")

    # ── 1. sign up through the form ──
    p.goto(base + "/register", wait=2.5)
    p.eval(f"""(() => {{
      const set = (el, v) => {{
        const d = Object.getOwnPropertyDescriptor(
          Object.getPrototypeOf(el), 'value');
        d.set.call(el, v);
        el.dispatchEvent(new Event('input', {{ bubbles: true }}));
      }};
      set(document.querySelector('#display_name'), 'سفر مشتری');
      set(document.querySelector('#username'), {user!r});
      set(document.querySelector('#password'), {PASS!r});
      document.querySelector('button[type=submit]').click();
    }})()""")
    time.sleep(4.5)
    tok = p.eval("localStorage.getItem('pawsmarket-auth-token')")
    print(f"1. signup            : {'OK' if isinstance(tok, str) else 'FAILED'}")

    # ── 2. create the pet profile ──
    r = api(p, "POST", "/api/pets/profile",
            {"name": pet_name, "species": "dog",
             "bio": "توله‌ای مهربان و بازیگوش؛ عاشق پارک و بچه‌ها.",
             "lat": 35.7585, "lng": 51.4030})
    pet = r["body"].get("pet") or {}
    pet_id = pet.get("id")
    print(f"2. pet profile       : "
          f"{'OK id=' + str(pet_id) if pet_id else 'FAILED ' + str(r['body'])[:80]}")

    if not pet_id:
        p.shot(f"{args.shots}/journey-fail.jpg")
        return 1

    # ── 3. gallery photo + profile edit ──
    r = api(p, "POST", f"/api/pets/{pet_id}/photos",
            {"url": "https://koko673.github.io/pawsmarket/images/listings/dog-golden.jpg",
             "caption": "روز اول"})
    # Compare outside the f-string: an r["status"] expression inside one is a
    # syntax error, and `sed` had left these lines unreadable.
    ok3 = r["status"] == 201
    print(f"3. gallery photo     : {'OK' if ok3 else 'FAILED'}")

    r = api(p, "PATCH", f"/api/pets/{pet_id}",
            {"avatar_url": "https://koko673.github.io/pawsmarket/images/listings/dog-golden.jpg",
             "is_public": True})
    ok4 = r["status"] == 200
    print(f"4. avatar + public   : {'OK' if ok4 else 'FAILED ' + str(r['body'])[:70]}")

    # ── 5. a moment and a story ──
    r = api(p, "POST", f"/api/pets/{pet_id}/posts",
            {"text": "سلام دنیا! 👋 امروز یک روز خوب بود.",
             "images": ["https://koko673.github.io/pawsmarket/images/listings/dog-run.jpg"],
             "kind": "post"})
    post_ok = r["status"] == 201
    print(f"5. moment posted     : {'OK' if post_ok else 'FAILED'}")

    r = api(p, "POST", f"/api/pets/{pet_id}/posts",
            {"text": "صبح بخیر ☀️", "images": [], "kind": "story"})
    ok6 = r["status"] == 201
    print(f"6. story posted      : {'OK' if ok6 else 'FAILED'}")

    # ── 7. the profile page renders all of it ──
    p.goto(base + f"/pet/{pet_id}", wait=4.0)
    shown = p.eval("document.body.innerText") or ""
    has_name = pet_name in shown
    has_bio = "مهربان" in shown
    has_post = "سلام دنیا" in shown
    imgs = p.eval("document.querySelectorAll('img').length")
    print(f"7. profile page      : name={'yes' if has_name else 'NO'} "
          f"bio={'yes' if has_bio else 'NO'} "
          f"post={'yes' if has_post else 'NO'} imgs={imgs}")
    p.shot(f"{args.shots}/journey-profile.jpg")

    # ── 8. the feed contains the moment ──
    p.goto(base + "/feed", wait=4.0)
    feed = p.eval("document.body.innerText") or ""
    print(f"8. feed has moment   : {'yes' if 'سلام دنیا' in feed else 'NO'}")
    p.shot(f"{args.shots}/journey-feed.jpg")

    # ── 9. discover lists the new pet ──
    r = api(p, "GET", f"/api/discover/pets?lat=35.7585&lng=51.403&radius=2000")
    found = any(x.get("id") == pet_id for x in (r or {}).get("body", {}).get("items", []))
    print(f"9. discoverable      : {'yes' if found else 'NO'}")

    print(f"\npet_id={pet_id}  username={user}")
    ok = all([tok, pet_id, post_ok, has_name, has_bio, has_post, found])
    print("JOURNEY OK" if ok else "JOURNEY INCOMPLETE")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())