# -*- coding: utf-8 -*-
"""
Self-host Vazirmatn so the app stops depending on fonts.googleapis.com.

Why
---
index.html pulls Vazirmatn from Google's CDN. From Tehran that host measured
0.8 s when healthy — and it is a foreign dependency for a domestic audience,
the same class of fragility as the Digikala CDN (which 403s and blanks photo
cards). Self-hosting removes the round trip, the third-party term of service,
and the failure mode together.

Which files
-----------
Only the weights the app actually requests (400/500/600/700/800 + 900 for the
single font-black), in woff2 — every modern browser and the file is far
smaller than ttf. Vazirmatn is SIL OFL 1.1, so hosting and shipping it is
explicitly permitted; the licence file is kept alongside.

Usage:
  PYTHONIOENCODING=utf-8 python scripts/fetch_fonts.py
Writes: public/fonts/*.woff2, public/fonts/OFL.txt; rewrites index.html.
"""
import io
import os
import re
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..")
FONTS = os.path.join(ROOT, "public", "fonts")
INDEX = os.path.join(ROOT, "index.html")

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")

CSS_URL = ("https://fonts.googleapis.com/css2"
           "?family=Vazirmatn:wght@400;500;600;700;800;900&display=swap")
BASE = "https://fonts.gstatic.com"


def fetch(url, binary=False):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=40) as r:
                data = r.read()
                return data if binary else data.decode("utf-8", "replace")
        except Exception:                     # noqa: BLE001 — network is flaky
            if attempt == 2:
                raise
    return None


def main():
    os.makedirs(FONTS, exist_ok=True)

    # Google serves different css per UA; a modern UA gets woff2 + unicode-range
    # subsets. We want the arabic (Persian) and latin ones only.
    css = fetch(CSS_URL)
    if not css:
        raise SystemExit("could not fetch the font CSS")

    # blocks look like:
    #   /* arabic */
    #   @font-face { font-family: 'Vazirmatn'; font-style: normal;
    #     font-weight: 400; ... src: url(...woff2) format('woff2');
    #     unicode-range: U+0600-06FF, ...; }
    blocks = re.findall(r"/\*\s*([\w-]+)\s*\*/\s*@font-face\s*\{(.*?)\}",
                        css, re.S)
    keep = [b for b in blocks if b[0] in ("arabic", "latin")]
    print(f"subsets kept: {sorted(set(b[0] for b in keep))} "
          f"({len(keep)} faces of {len(blocks)})")

    licences = []
    seen_files = set()
    for subset, body in keep:
        weight = re.search(r"font-weight:\s*(\d+)", body).group(1)
        url = re.search(r"url\((https://[^)]+\.woff2)\)", body).group(1)
        fname = f"vazirmatn-{subset}-{weight}.woff2"
        dest = os.path.join(FONTS, fname)
        rel = f"fonts/{fname}"
        if fname not in seen_files:
            data = fetch(url, binary=True)
            if not data or len(data) < 1000:
                print(f"  skip {fname} (fetch failed)")
                continue
            with open(dest, "wb") as f:
                f.write(data)
            seen_files.add(fname)
            print(f"  {fname:34} {len(data) / 1024:6.1f} KB")
        # a face may share a file across ranges; emit each @font-face anyway.
        # The URL is relative to the CSS file, not site-root: the published
        # app lives under /pawsmarket/, so a root-absolute /fonts/... resolved
        # against the domain root and every face except the preloaded one came
        # back 404. Relative to the CSS (which sits in /fonts/ itself) the
        # correct form is just the bare filename.
        licences.append(
            f"""@font-face {{
  font-family: 'Vazirmatn';
  font-style: normal;
  font-weight: {weight};
  font-display: swap;
  src: url('{os.path.basename(rel)}') format('woff2');
  unicode-range: U+0600-06FF, U+200C-200E, U+2010-2011, U+204F, U+2E41,
    U+FB50-FDFF, U+FE80-FEFC;
}}""")
        # latin face — fewer ranges, one rule per weight
        if subset == "latin":
            licences[-1] = licences[-1].replace(
                "U+0600-06FF, U+200C-200E, U+2010-2011, U+204F, U+2E41,\n"
                "    U+FB50-FDFF, U+FE80-FEFC",
                "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA,\n"
                "    U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193,\n"
                "    U+2212, U+2215, U+FEFF, U+FFFD")

    if not seen_files:
        raise SystemExit("no font files were downloaded")

    # The OFL licence must ship with the font.
    lic = fetch("https://raw.githubusercontent.com/rastikerdar/vazirmatn/"
                "master/OFL.txt")
    if lic:
        with open(os.path.join(FONTS, "OFL.txt"), "w", encoding="utf-8") as f:
            f.write(lic)
        print("licence preserved: OFL.txt")

    css_out = (
        "/* Self-hosted Vazirmatn (SIL OFL 1.1) — generated by "
        "scripts/fetch_fonts.py.\n"
        "   Replaces the fonts.googleapis.com dependency so loading does not "
        "depend\n   on reaching Google from Iran. */\n" + "\n".join(licences))
    with open(os.path.join(FONTS, "vazirmatn.css"), "w",
              encoding="utf-8") as f:
        f.write(css_out)

    size = sum(os.path.getsize(os.path.join(FONTS, f)) for f in
               os.listdir(FONTS)) / 1024
    print(f"\ntotal: {size:.0f} KB in public/fonts/")
    print("next: add <link rel=stylesheet href=fonts/vazirmatn.css> to "
          "index.html and drop the Google Fonts links")


if __name__ == "__main__":
    main()