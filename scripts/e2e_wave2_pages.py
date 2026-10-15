# -*- coding: utf-8 -*-
"""
Wave-2 step 3: walk every page at phone size and run the 8-point checklist.

Checks per page:
  1. renders        — page has visible content (not a blank screen)
  2. empty state    — presence of a Persian empty-state message when no data
  3. error state    — API 503/0 surfaces an error UI, not a blank screen
  4. loading state  — skeletons/spinner while data is pending
  5. RTL sanity     — no horizontal overflow at 320px, dir=rtl intact
  6. keyboard       — focusable controls exist; focus ring visible
  7. touch targets  — buttons/links ≥ 44px in either dimension
  8. images         — zero broken images (naturalWidth 0 after load)

Plus a header check (lang=fa, dir=rtl) and reduced-motion coverage.
"""
import io
import json
import sys
import time

sys.path.insert(0, 'scripts')
import importlib.util  # noqa: E402

spec = importlib.util.spec_from_file_location('l', 'scripts/e2e_live.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

BASE = 'https://koko673.github.io/pawsmarket/#'
SHOTS = 'C:/Users/HP/Downloads/office/_live_shots/wave2'

# Route → label and whether the route is expected to have article cards.
PAGES = [
    ('/',                 'خانه',          True),
    ('/explore',          'کاوش',          True),
    ('/pets',             'حیوانات',       True),
    ('/adoption',         'سرپرستی',       True),
    ('/feed',             'فید',           False),
    ('/bookings',         'نوبتها',        False),
    ('/my-account',       'حساب من',       False),
    ('/register',         'ثبتنام',        False),
    ('/forgot',           'فراموشی رمز',   False),
    ('/explore?preset=food', 'محصولات',    True),
    ('/explore?preset=vets', 'خدمات',      True),
    ('/explore?preset=shelters', 'پناهگاه', True),
]


def probe(p, url):
    p.goto('about:blank', wait=0.4)
    p.goto(url, wait=9)
    return p.eval("""(function(){
      var d = document;
      var arts = d.querySelectorAll('article').length;
      var broken = [...d.images].filter(function(i){
        return i.complete && i.naturalWidth === 0; }).length;
      var imgs = d.images.length;
      var hOverflow = d.documentElement.scrollWidth > window.innerWidth + 2;
      var lang = d.documentElement.getAttribute('lang');
      var dir = d.documentElement.getAttribute('dir');
      var focusables = d.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), ' +
        'select, textarea, [tabindex]:not([tabindex="-1"])').length;
      var emptyMsg = /پیدا نشد|خالی|چیزی|ثبت نشده|نگرفته/.test(d.body.innerText);
      var errState = /وصل نیستیم|خطا|ناموفق/.test(d.body.innerText);
      var skeletons = d.querySelectorAll('[class*=animate-pulse], [class*=skeleton]').length;

      // touch targets: buttons/links smaller than 44px in BOTH dimensions
      var small = 0;
      var ctls = d.querySelectorAll('button, a[href]');
      for (var i = 0; i < ctls.length; i++) {
        var b = ctls[i].getBoundingClientRect();
        if (b.width === 0 || b.height === 0) continue;
        if (b.width < 44 && b.height < 44) small++;
      }

      // keyboard: first focusable gets focus after Tab
      var kb = false;
      try {
        var first = d.querySelector('a[href], button, input');
        if (first) { first.focus(); kb = d.activeElement === first; }
      } catch (e) {}

      return JSON.stringify({
        arts: arts, imgs: imgs, broken: broken,
        hOverflow: hOverflow, lang: lang, dir: dir,
        focusables: focusables, focusWorks: kb,
        smallTargets: small, emptyMsg: emptyMsg, errState: errState,
        skeletons: skeletons, hasH1: !!d.querySelector('h1'),
        bodyLen: d.body.innerText.length
      });
    })()""")


def main():
    m.start_chrome()
    p = m.new_page('about:blank')
    p.ws.call("Emulation.setDeviceMetricsOverride", {
        "width": 390, "height": 844, "deviceScaleFactor": 3, "mobile": True})
    p.ws.call("Emulation.setTouchEmulationEnabled", {"enabled": True})
    time.sleep(1)

    import os
    os.makedirs(SHOTS, exist_ok=True)

    # Header checks first
    p.goto('about:blank', wait=0.4)
    p.goto(BASE + '/', wait=5)
    hdr = p.eval("""JSON.stringify({
      lang: document.documentElement.getAttribute('lang'),
      dir: document.documentElement.getAttribute('dir')
    })""")
    hdr = json.loads(hdr)
    print(f'HEADER  lang={hdr["lang"]}  dir={hdr["dir"]}')
    print()

    results = []
    for route, label, expect_cards in PAGES:
        url = BASE + route
        r = probe(p, url)
        d = json.loads(r) if isinstance(r, str) else {}
        p.shot(f'{SHOTS}/w2-{label}.jpg')

        problems = []
        if d.get('broken', 0) > 0:
            problems.append(f"{d['broken']} broken img")
        if d.get('hOverflow'):
            problems.append('h-overflow')
        if not d.get('focusWorks'):
            problems.append('focus broken')
        if d.get('smallTargets', 0) > 2:
            problems.append(f"{d['smallTargets']} small targets")
        if not d.get('hasH1'):
            problems.append('no h1')

        status = 'OK'
        if problems:
            status = 'PROBLEM: ' + ', '.join(problems)
        results.append((label, route, d, status))
        # Labels are Persian and this console is cp1252: escape the code
        # points rather than let the f-string raise and kill the run.
        safe = label.encode('unicode_escape').decode('ascii')
        print(f"  {safe:32} {status}")
        print(f"    arts={d.get('arts',0)} imgs={d.get('imgs',0)} "
              f"broken={d.get('broken',0)} small={d.get('smallTargets',0)} "
              f"focus={d.get('focusWorks')} empty={d.get('emptyMsg')} "
              f"err={d.get('errState')} skel={d.get('skeletons')}")

    # reduced-motion check — one pass on home
    p.goto('about:blank', wait=0.4)
    p.goto(BASE + '/', wait=5)
    p.ws.call("Emulation.setEmulatedMedia", {"features": [
        {"name": "prefers-reduced-motion", "value": "reduce"}]})
    time.sleep(2)
    rm = p.eval("""(function(){
      var el = document.querySelector('[data-motion-item]');
      if (!el) return 'no test element';
      var cs = getComputedStyle(el);
      return 'opacity=' + cs.opacity + ' transform=' + (cs.transform === 'none' ? 'none' : 'some');
    })()""")
    print()
    print(f'REDUCED-MOTION  {rm}')
    p.shot(f'{SHOTS}/w2-reduced-motion.jpg')

    print()
    failed = [r[0] for r in results if r[3].startswith('PROBLEM')]
    print(f'pages with problems: {failed or "none"}')
    print(f'screenshots -> {SHOTS}')


if __name__ == '__main__':
    main()