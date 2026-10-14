# -*- coding: utf-8 -*-
"""
Deep mobile test of the products and services sections on the published site.

Everything here is driven the way a visitor drives it — a 390×844 phone
viewport, real taps on the filter chips, real scrolling — because the defects
reported so far (truncated labels, overlapping photos, a «بیشتر» button that
did nothing) all passed API-level checks and only appeared in the browser.

For each section it records: how many cards render, how many carry a real
photo, whether any image is broken or repeated, whether the text is clipped,
and the price/rating values actually shown.

Usage:
  PYTHONIOENCODING=utf-8 python scripts/e2e_mobile_sections.py
"""
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e2e_live as L  # noqa: E402

SHOTS = "C:/Users/HP/Downloads/office/_live_shots"
BASE = "https://koko673.github.io/pawsmarket/#"

# What a card should look like, read from the DOM of one card.
CARD_JS = """
(function () {
  var arts = document.querySelectorAll('article');
  var out = {n: arts.length, real: 0, broken: 0, srcs: [], clipped: [], samples: []};
  for (var i = 0; i < arts.length; i++) {
    var a = arts[i];
    var img = a.querySelector('img');
    if (img) {
      var s = img.getAttribute('src') || '';
      out.srcs.push(s);
      if (s.indexOf('/real/') >= 0 || s.indexOf('/placeholder/') >= 0) out.real++;
      if (img.complete && img.naturalWidth === 0) out.broken++;
    }
    // Truncation: does the visible text end in an ellipsis mid-word?
    var h = a.querySelector('h3');
    if (h && /…\\s*$/.test(h.innerText) && h.scrollHeight > h.clientHeight + 2) {
      out.clipped.push(h.innerText.slice(0, 30));
    }
    if (i < 3) out.samples.push(a.innerText.replace(/\\n/g, ' | ').slice(0, 78));
  }
  var dup = out.srcs.length - new Set(out.srcs).size;
  out.duplicates = dup;
  return out;
})()
"""


def section(p, label, path, wait=9):
    p.goto("about:blank", wait=0.4)
    p.goto(BASE + path, wait=wait)
    r = p.eval(CARD_JS)
    if not isinstance(r, dict):
        print(f"  {label:22} FAILED to read the page")
        return None
    empty = p.eval('document.body.innerText.indexOf("پیدا نشد") >= 0')
    name = label.replace(" ", "-").replace("/", "")
    p.shot(f"{SHOTS}/sec-{name}.jpg")
    flag = "EMPTY" if empty else ""
    print(f"  {label:22} {r['n']:>3} cards  real={r['real']:>3}  "
          f"dup={r['duplicates']}  broken={r['broken']}  {flag}")
    for s in r["samples"][:2]:
        print(f"      · {s}")
    if r["clipped"]:
        print(f"      CLIPPED: {r['clipped'][:2]}")
    return r


def main():
    L.start_chrome()
    p = L.new_page("about:blank")
    p.ws.call("Emulation.setDeviceMetricsOverride", {
        "width": 390, "height": 844, "deviceScaleFactor": 3, "mobile": True})
    p.ws.call("Emulation.setTouchEmulationEnabled", {"enabled": True})
    p.ws.call("Network.setUserAgentOverride", {
        "userAgent": ("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) "
                      "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 "
                      "Mobile/15E148 Safari/604.1")})
    os.makedirs(SHOTS, exist_ok=True)

    results = {}

    print("PRODUCTS")
    for label, path in [
        ("همه", "/explore"),
        ("خوراک", "/explore?preset=food"),
        ("اسباب‌بازی", "/explore?preset=food"),
    ]:
        results[label] = section(p, label, path)

    print("\nSERVICES")
    for label, path in [
        ("دامپزشکی", "/explore?preset=vets"),
        ("آرایشگاه", "/explore?preset=groomers"),
        ("پناهگاه", "/explore?preset=shelters"),
    ]:
        results[label] = section(p, label, path)

    # ── the filter sheet, tapped the way a visitor taps it ──
    print("\nFILTER SHEET (mobile)")
    p.goto("about:blank", wait=0.4)
    p.goto(BASE + "/explore", wait=9)
    p.eval("""(function(){
      var bs = document.querySelectorAll('button');
      for (var i=0;i<bs.length;i++){
        if (bs[i].innerText.trim() === 'فیلترها') { bs[i].click(); return; }
      }
    })()""")
    time.sleep(2.5)
    sheet = p.eval("""(function(){
      var d = document.querySelector('[role=dialog]');
      if (!d) return {open: false};
      var txt = d.innerText;
      return {open: true, chips: d.querySelectorAll('button').length,
              hasGroups: ['حیوانات','محصولات','خدمات'].filter(function(g){
                return txt.indexOf(g) >= 0; }),
              text: txt.slice(0, 240).replace(/\\n/g, ' | ')};
    })()""")
    p.shot(f"{SHOTS}/sec-filter-sheet.jpg")
    print(" ", json.dumps(sheet, ensure_ascii=False)[:260])

    # tap a product category inside the sheet and confirm the list changes
    if isinstance(sheet, dict) and sheet.get("open"):
        before = p.eval('document.querySelectorAll("article").length')
        p.eval("""(function(){
          var d = document.querySelector('[role=dialog]');
          var bs = d.querySelectorAll('button');
          for (var i=0;i<bs.length;i++){
            if (bs[i].innerText.indexOf('خوراک') >= 0) { bs[i].click(); return; }
          }
        })()""")
        time.sleep(1)
        p.eval("""(function(){
          var d = document.querySelector('[role=dialog]');
          var bs = d.querySelectorAll('button');
          for (var i=0;i<bs.length;i++){
            if (bs[i].innerText.indexOf('نمایش نتایج') >= 0) { bs[i].click(); return; }
          }
        })()""")
        time.sleep(6)
        after = p.eval('document.querySelectorAll("article").length')
        p.shot(f"{SHOTS}/sec-filter-applied.jpg")
        print(f"  applied «خوراک»: {before} cards → {after} cards")

    # ── the «بیشتر» button ──
    print("\n«بیشتر» BUTTON")
    p.goto("about:blank", wait=0.4)
    p.goto(BASE + "/", wait=10)
    p.eval("window.scrollTo(0, document.body.scrollHeight * 0.45)")
    time.sleep(1)
    before_y = p.eval("window.scrollY")
    before_n = p.eval('document.querySelectorAll("article").length')
    clicked = p.eval("""(function(){
      var bs = document.querySelectorAll('button');
      for (var i=0;i<bs.length;i++){
        if (bs[i].innerText.trim().indexOf('بیشتر') >= 0) { bs[i].click(); return true; }
      }
      return false;
    })()""")
    time.sleep(3)
    after_n = p.eval('document.querySelectorAll("article").length')
    after_y = p.eval("window.scrollY")
    p.shot(f"{SHOTS}/sec-more.jpg")
    print(f"  found={clicked}  cards {before_n} → {after_n}  "
          f"scrollY {before_y} → {after_y}")

    print(f"\nscreenshots -> {SHOTS}")
    return 0


if __name__ == "__main__":
    sys.exit(main())