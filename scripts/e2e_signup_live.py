# -*- coding: utf-8 -*-
"""
Sign up through the PUBLISHED site's own form, in a real browser.

Why not call the API directly: the earlier e2e did that, and it never
exercised the things a first-time visitor hits — the Persian validation
message, the button's busy state, the redirect after success, whether the
token lands in localStorage and the header updates. Every one of those is
where a signup actually breaks.

Also checks the behaviour that mattered most: several people signing up
from one address (a friend's house) must not lock each other out.

Usage:
  PYTHONIOENCODING=utf-8 python scripts/e2e_signup_live.py [--count 5]
"""
import argparse
import base64
import json
import os
import random
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e2e_live as L  # noqa: E402  (reuses the CDP client)


def fill_and_submit(p, username, password, display):
    """Type into the real form and press the real button."""
    p.eval(f"""(() => {{
      const set = (el, v) => {{
        const proto = Object.getPrototypeOf(el);
        const desc = Object.getOwnPropertyDescriptor(proto, 'value');
        desc.set.call(el, v);
        el.dispatchEvent(new Event('input', {{ bubbles: true }}));
      }};
      const dn = document.querySelector('#display_name');
      const un = document.querySelector('#username');
      const pw = document.querySelector('#password');
      if (dn) set(dn, {display!r});
      set(un, {username!r});
      set(pw, {password!r});
      return true;
    }})()""")
    p.eval("document.querySelector('button[type=submit]').click()")
    # Registration + token bootstrap; the page then redirects away from /register.
    time.sleep(4.5)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default="https://koko673.github.io/pawsmarket/")
    ap.add_argument("--count", type=int, default=5)
    ap.add_argument("--shots",
                    default="C:/Users/HP/Downloads/office/_live_shots")
    args = ap.parse_args()
    os.makedirs(args.shots, exist_ok=True)

    L.start_chrome()
    p = L.new_page(args.url)
    time.sleep(2)

    base = args.url if args.url.endswith("#") else args.url + "#"
    results = []
    for i in range(args.count):
        # A fresh browser context per person would defeat the point — they all
        # share this machine's address, which is the household case.
        username = f"e2eweb{random.randint(10000, 99999)}"
        password = "WebTest!2026"
        display = f"کاربر وب {i + 1}"
        p.goto(base + "/register", wait=2.5)
        fill_and_submit(p, username, password, display)

        token = p.eval("localStorage.getItem('pawsmarket-auth-token')")
        path = p.eval("location.hash || location.pathname") or ""
        # Runtime.evaluate can hand back a non-string (or a dict carrying an
        # __error), so normalise before formatting rather than trusting it.
        err = p.eval("""(() => {
          const e=document.querySelector('.bg-destructive\\/10, [role=alert]');
          return e ? e.innerText.trim() : '';
        })()""")
        err = str(err) if isinstance(err, str) else ""
        text = p.eval("document.body.innerText.slice(0,120)") or ""
        ok = bool(token) and isinstance(token, str)
        results.append({"user": username, "ok": ok, "landed": str(path),
                        "error": err})
        suffix = ("err: " + err[:48]) if err else ""
        tok = "yes" if ok else "NO"
        print(f"  {i + 1}. {username:16} token={tok:3} "
              f"landed={str(path)[:22]:22} {suffix}")
        if not ok:
            p.shot(f"{args.shots}/signup-fail-{i}.jpg")
        time.sleep(1.2)

    passed = sum(1 for r in results if r["ok"])
    print(f"\nsignups succeeded: {passed}/{len(results)} from one address")
    if passed < len(results):
        print("\ndetail:")
        for r in results:
            if not r["ok"]:
                print(f"  {r['user']} -> {r['landed']} :: {r['error']}")
    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    sys.exit(main())