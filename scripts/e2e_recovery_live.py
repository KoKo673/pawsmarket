# -*- coding: utf-8 -*-
"""
Drive the forgot-password flow through the published site.

The API was already verified directly; what this catches is the parts only the
real UI has — the link on the login card, the two-field form, the one-time
display of the temporary password, and whether the pasted value actually signs
in afterwards.

Usage:
  PYTHONIOENCODING=utf-8 python scripts/e2e_recovery_live.py
"""
import argparse
import json
import os
import random
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e2e_live as L  # noqa: E402

API = "https://api-production-2527.up.railway.app"


def api(p, method, path, body=None):
    raw = p.eval(f"""(async () => {{
      const r = await fetch({API + path!r}, {{
        method: {method!r},
        headers: {{'Content-Type': 'application/json'}},
        {('body: JSON.stringify(' + repr(body) + '),') if body else ''}
      }});
      const t = await r.text();
      try {{ return {{s: r.status, b: JSON.parse(t)}}; }}
      catch (e) {{ return {{s: r.status, b: {{raw: t.slice(0,200)}}}}; }}
    }})()""")
    if not isinstance(raw, dict):
        return {"s": 0, "b": {}}
    return {"s": raw.get("s", 0), "b": raw.get("b") or {}}


def set_field(p, selector, value):
    p.eval(f"""(() => {{
      const el = document.querySelector({selector!r});
      const d = Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(el), 'value');
      d.set.call(el, {value!r});
      el.dispatchEvent(new Event('input', {{ bubbles: true }}));
    }})()""")


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

    user = f"rec{random.randint(10000, 99999)}"
    email = f"{user}@example.com"
    old_pw = "OriginalPass!2026"
    new_pw = "BrandNewPass!2026"

    print(f"account: {user}\n")

    # 1. sign up WITH an email, through the form
    p.goto(base + "/register", wait=3.0)
    set_field(p, "#display_name", "کاربر بازیابی")
    set_field(p, "#email", email)
    set_field(p, "#username", user)
    set_field(p, "#password", old_pw)
    p.eval("document.querySelector('button[type=submit]').click()")
    time.sleep(5)
    tok = p.eval("localStorage.getItem('pawsmarket-auth-token')")
    print(f"1. register with email : {'OK' if isinstance(tok, str) else 'FAILED'}")

    # 2. the login card links to the recovery page
    p.goto(base + "/login", wait=3.0)
    has_link = p.eval(
        "!!document.querySelector('a[href*=\"forgot\"]')")
    print(f"2. 'forgot' link shown : {'OK' if has_link else 'NO'}")
    if has_link:
        p.eval("document.querySelector('a[href*=\"forgot\"]').click()")
        time.sleep(3)
        print(f"   navigated to        : {p.eval('location.hash')}")

    # 3. wrong email must not reveal anything
    if not p.eval("!!document.querySelector('#ru')"):
        p.goto(base + "/forgot", wait=3.0)
    set_field(p, "#ru", user)
    set_field(p, "#re", "someone-else@example.com")
    p.eval("document.querySelector('button[type=submit]').click()")
    time.sleep(6)
    body = p.eval("document.body.innerText") or ""
    leaked = "رمز موقت شما" in body
    print(f"3. wrong email leaks?  : {'YES (bad)' if leaked else 'no (good)'}")

    # 4. the real pair yields a temporary password on screen
    p.goto(base + "/forgot", wait=3.0)
    set_field(p, "#ru", user)
    set_field(p, "#re", email)
    p.eval("document.querySelector('button[type=submit]').click()")
    time.sleep(7)
    shown = p.eval("""(() => {
      const c = document.querySelector('code');
      return c ? c.innerText.trim() : '';
    })()""")
    shown = shown if isinstance(shown, str) else ""
    p.shot(f"{args.shots}/recovery-temp.jpg")
    print(f"4. temp password shown : {'OK ' + shown if shown else 'NOT SHOWN'}")

    if not shown:
        return 1

    # 5. it actually signs in
    r = api(p, "POST", "/api/auth/login",
            {"username": user, "password": shown})
    print(f"5. temp signs in       : {r['s']}")

    # 6. the old password must no longer work
    r = api(p, "POST", "/api/auth/login",
            {"username": user, "password": old_pw})
    print(f"6. old password denied : {r['s']} (401 expected)")

    print(f"\nrecovery account: {user} / {email}")
    ok = (isinstance(tok, str) and bool(has_link) and not leaked and shown)
    print("RECOVERY OK" if ok else "RECOVERY INCOMPLETE")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())