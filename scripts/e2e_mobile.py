# -*- coding: utf-8 -*-
"""
Mobile-viewport check of the published site.

The home page looked wrong on a phone for several rounds while every desktop
check passed, because none of them ever set a phone viewport. This drives
Chrome at 390×844 (iPhone-class) with a touch user agent and reports what is
actually on screen: element boxes, which images failed, and a screenshot per
route.

Usage:
  PYTHONIOENCODING=utf-8 python scripts/e2e_mobile.py [--url URL]
"""
import argparse
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e2e_live as L  # noqa: E402

MOBILE_UA = ("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) "
             "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 "
             "Mobile/15E148 Safari/604.1")


def set_mobile(p, w=390, h=844):
    p.ws.call("Emulation.setDeviceMetricsOverride", {
        "width": w, "height": h, "deviceScaleFactor": 3, "mobile": True})
    p.ws.call("Emulation.setTouchEmulationEnabled", {"enabled": True})
    p.ws.call("Network.setUserAgentOverride", {"userAgent": MOBILE_UA})


def box(p, selector):
    return p.eval(f"""(() => {{
      const el = document.querySelector({selector!r});
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {{x:Math.round(r.x), y:Math.round(r.y),
               w:Math.round(r.width), h:Math.round(r.height),
               display:cs.display, opacity:cs.opacity,
               src:(el.currentSrc||el.src||'').slice(-46),
               nw:el.naturalWidth||0}};
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
    # Device metrics must be set BEFORE the document loads: applied afterwards
    # the page keeps its desktop layout, which is why an earlier run reported
    # every selector missing.
    set_mobile(p)
    base = args.url if args.url.endswith("#") else args.url + "#"
    p.goto(base, wait=5.0)

    # Wait for the app to actually mount rather than trusting a fixed sleep.
    for _ in range(30):
        if p.eval("!!document.querySelector('section') && document.images.length > 0"):
            break
        time.sleep(1)
    time.sleep(2)

    print(f"viewport: {p.eval('window.innerWidth')}x{p.eval('window.innerHeight')}"
          f"   imgs on page: {p.eval('document.images.length')}")
    print("home (390×844):")
    p.shot(f"{args.shots}/mobile-home.jpg")

    vp_h = p.eval("window.innerHeight")
    for sel, label in [
        ("section img", "first hero img"),
        ("h1", "headline"),
        ("input[type=search], input[placeholder*='جستجو']", "search field"),
        ("a[href*='explore'], button", "first button"),
    ]:
        b = box(p, sel)
        print(f"  {label:16} {b}")

    # what is visible in the first screenful, and in what order
    order = p.eval(f"""(() => {{
      const out=[];
      const vh = {vp_h};
      for (const el of document.querySelectorAll('section *')) {{
        const r = el.getBoundingClientRect();
        if (r.height < 40 || r.width < 80) continue;
        if (r.top > vh) continue;
        const tag = el.tagName.toLowerCase();
        if (!['img','h1','h2','p','input','button','form'].includes(tag)) continue;
        out.push({{tag, top: Math.round(r.top), h: Math.round(r.height),
                  text: (el.innerText||el.alt||'').slice(0,28)}});
      }}
      return out.slice(0, 12);
    }})()""")
    print("\n  first screenful (top → bottom):")
    for o in (order or []):
        print(f"    y={o['top']:>4} h={o['h']:>3} {o['tag']:6} {o['text']!r}")

    print("\nother routes:")
    for path in ["/explore", "/explore?preset=food", "/register"]:
        p.goto(base + path, wait=3.5)
        name = path.strip("/").replace("?", "-").replace("=", "_") or "home"
        p.shot(f"{args.shots}/mobile-{name}.jpg")
        imgs = p.eval("document.querySelectorAll('img').length")
        broken = p.eval("""(() => [...document.images]
          .filter(i=>i.complete && i.naturalWidth===0)
          .map(i=>(i.getAttribute('src')||'').slice(-40)))()""")
        overflow = p.eval(
            "document.documentElement.scrollWidth > window.innerWidth + 2")
        print(f"  {path:24} imgs={imgs:<3} broken={len(broken or [])} "
              f"h-overflow={overflow}")
        for b in (broken or [])[:3]:
            print(f"      BROKEN {b}")

    print(f"\nscreenshots -> {args.shots}")
    return 0


if __name__ == "__main__":
    sys.exit(main())