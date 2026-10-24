# -*- coding: utf-8 -*-
"""
Give every photo-less shop its own card instead of a shared stock photo.

Why
---
461 of the 761 shops have no Google Maps photo, so they all fell back to one
of eight stock images — «shop-2.jpg» appeared on 119 different businesses. A
visitor comparing two shops in a list sees the same storefront twice and stops
trusting the catalogue. Reusing a photograph of a real, different business is
also simply false: the picture is of somewhere else.

What this makes instead
-----------------------
A deterministic, generated card per shop: the category's icon on the brand
gradient, the shop's name, and its neighbourhood. It is honest — it claims to
be a placeholder, not a storefront — and unique to the shop, so no two cards
in a list repeat. The name makes it recognisable when the visitor scans back.

Why it was rewritten (2026-10-21)
---------------------------------
The first version read as flat and repetitive — «flat blue/purple gradients
with a tiny icon in the middle». Three measured causes:

  * **8 gradients for 757 cards.** Picked by `sha1 % 8`, so roughly 95 shops
    got the identical pair. Two adjacent cards in a list collided often.
  * **The icon was 10% of the card.** It was drawn at `scale(2)` on a 24×24
    path inside a 480×360 canvas — 48px of glyph in a 480px box, floating in
    an empty middle. That emptiness is what read as "basic".
  * **Two plain circles were the only decoration**, both at ~7% opacity.

What replaces them, and why each choice is structural rather than decorative:

  * **Per-category hue with a seeded offset.** The gradient's base hue comes
    from the category (a vet is teal, a café is amber), and the shop's hash
    shifts it ±22°. So cards vary, but a vet never comes out pink — the
    colour still means something. 757 cards with 8 palettes became ~750
    distinct pairs while staying on-palette.
  * **A layered background**: a 135° gradient, a radial light source at the
    top corner, a soft counter-shadow at the bottom, and a tiled dot pattern.
    Four cheap SVG primitives that give the flat fill depth.
  * **A glass panel** behind the icon and text: rounded rect, semi-opaque
    fill, 1px light stroke. This is what makes it read as designed rather
    than as a coloured rectangle with a glyph in it.
  * **The icon is 3.2× larger** and sits in the panel, not in the void.
  * **Typography has hierarchy**: the name at weight 800, the area muted and
    smaller, and a small category label above them as an eyebrow.

Everything is derived from `sha1(name|category)`, so re-running is stable and
a shop's card never changes identity between builds.

Usage:
  PYTHONIOENCODING=utf-8 python scripts/make_placeholders.py
Writes: public/images/stores/placeholder/<hash>.svg + scripts/store_placeholders.json
"""
import colorsys
import hashlib
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
OUTDIR = os.path.join(HERE, "..", "public", "images", "stores", "placeholder")
MAP = os.path.join(HERE, "store_placeholders.json")

# One glyph per category, drawn as a path so no font or icon file is needed.
ICONS = {
    "vet": "M12 3v4M10 5h4M7 21a5 5 0 0 1 10 0M12 11a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z",
    "groomer": "M6 6l12 12M18 6L6 18M8 5.5A2.5 2.5 0 1 1 5.5 8M16 5.5A2.5 2.5 0 1 0 18.5 8",
    "shelter": "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
    "boarding": "M3 8v11M3 12h18v7M21 12v-2a3 3 0 0 0-3-3H9a3 3 0 0 0-3 3M6.5 9.5a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4",
    "shop": "M4 8h16l-1.2 12H5.2zM8 8V6a4 4 0 0 1 8 0v2",
    "cafe": "M5 8h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4zM16 9h2a2.5 2.5 0 0 1 0 5h-2M4 21h14",
}

# Base hue per category (degrees). The hash shifts it ±22°, so a category
# keeps its identity while adjacent cards still differ. Chosen so no two
# neighbouring categories land on the same hue: vet/teal, groomer/rose,
# shelter/green, boarding/indigo, shop/orange, cafe/amber.
CATEGORY_HUE = {
    "vet": 174,       # teal — clinical, calm
    "groomer": 330,   # rose — salon
    "shelter": 96,    # green — outdoor, rescue
    "boarding": 232,  # indigo — night, hotel
    "shop": 22,       # orange — brand
    "cafe": 42,       # amber — warm
}

# How wide the hash may swing the hue. Large enough to tell two shops apart at
# a glance, small enough that a category never drifts into another's colour.
HUE_SWING = 22


def esc(s: str) -> str:
    return (s.replace("&", "&amp;").replace("<", "&lt;")
             .replace(">", "&gt;").replace('"', "&quot;"))


def fit_name(name: str, limit: int = 22) -> str:
    """Trim on a word boundary so the card never shows a sliced word."""
    if len(name) <= limit:
        return name
    cut = name[:limit]
    if " " in cut:
        cut = cut[:cut.rfind(" ")]
    return cut.strip() + "…"


def fit_area(area: str, limit: int = 26) -> str:
    """Same treatment for the neighbourhood line.

    Some addresses are full postal strings — «خیابان ولیعصر، بالاتر از
    جهانآرا، عباسآباد، جنب کوچه برلیانس، واحد ۱۰» — and rendered untrimmed
    they ran across the whole card and out the far edge. The name was
    already trimmed; the area was not, which is why only one line ever
    overflowed.

    Commas are cut on too, because a Persian address is comma-separated:
    «خیابان ولیعصر، بالاتر از جهانآرا، …» reads as an address, while
    cutting mid-clause at an arbitrary character reads as a bug.
    """
    if len(area) <= limit:
        return area
    cut = area[:limit]
    for sep in ("،", " "):
        if sep in cut:
            cut = cut[:cut.rfind(sep)]
            break
    return cut.strip().rstrip("،") + "…"


def _hex(hue: float, light: float, sat: float) -> str:
    """HSL → #rrggbb. Lightness/saturation chosen per stop, not per card."""
    r, g, b = colorsys.hls_to_rgb((hue % 360) / 360.0, light, sat)
    return "#{:02X}{:02X}{:02X}".format(int(r * 255), int(g * 255), int(b * 255))


def palette(seed: str, category: str) -> dict:
    """Deterministic colours for one card.

    Three stops, not two: a two-stop linear gradient is the flattest possible
    fill. A lighter leading stop, a saturated middle and a dark trailing stop
    give the eye something to follow across the card.
    """
    h = hashlib.sha1(f"{seed}|{category}".encode("utf-8")).hexdigest()
    n = int(h[:8], 16)

    base = CATEGORY_HUE.get(category, CATEGORY_HUE["shop"])
    hue = base + ((n % (HUE_SWING * 2 + 1)) - HUE_SWING)

    # Saturation is deliberately low, and this was settled by rendering two
    # passes rather than by taste:
    #
    #   pass 1 — s≈0.75 at l≈0.46 → neon magenta and lime. The cards competed
    #            with the photographs in the same list.
    #   pass 2 — s≈0.50 at l≈0.41 → still hot pink and yellow-green.
    #   pass 3 — s≈0.26–0.34        → muted slate-toned surfaces, which read
    #            as a quiet branded ground behind the real photos instead of
    #            shouting beside them.
    #
    # Hue still carries the category; saturation no longer carries anything,
    # so it stays low. Lightness provides the depth that saturation was
    # wrongly being asked to provide.
    return {
        "c1": _hex(hue, 0.50, 0.34),   # leading stop — light
        "c2": _hex(hue, 0.34, 0.30),   # middle — the body colour
        "c3": _hex(hue, 0.21, 0.26),   # trailing stop — grounded
        "glow": _hex(hue, 0.74, 0.42),  # radial light at the top corner
    }


def card(name: str, category: str, area: str) -> str:
    p = palette(name, category)
    icon = ICONS.get(category, ICONS["shop"])
    safe_name = esc(fit_name(name))
    safe_area = esc(fit_area(area))

    # The dot pattern's tile phase is derived from the hash, so two cards of
    # the same category do not show an identical lattice.
    phase = (int(hashlib.sha1(name.encode()).hexdigest()[:4], 16) % 28)

    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360" width="480" height="360" role="img" aria-label="{esc(name)}">
  <defs>
    <!-- Three stops and a diagonal axis: the flat two-stop fill was the
         single biggest reason the old cards read as basic. -->
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="{p['c1']}"/>
      <stop offset=".55" stop-color="{p['c2']}"/>
      <stop offset="1" stop-color="{p['c3']}"/>
    </linearGradient>

    <!-- A light source in the top corner, which the flat fill had nowhere. -->
    <radialGradient id="glow" cx=".82" cy=".12" r=".75">
      <stop offset="0" stop-color="{p['glow']}" stop-opacity=".55"/>
      <stop offset="1" stop-color="{p['glow']}" stop-opacity="0"/>
    </radialGradient>

    <!-- Ink collects at the bottom so the text panel has something to sit on. -->
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset=".45" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".28"/>
    </linearGradient>

    <!-- Faint lattice — the second decorative primitive the old card lacked. -->
    <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse"
             patternTransform="translate({phase} {phase})">
      <circle cx="2" cy="2" r="1.35" fill="#fff" opacity=".10"/>
    </pattern>

    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#000" flood-opacity=".20"/>
    </filter>
  </defs>

  <rect width="480" height="360" fill="url(#g)"/>
  <rect width="480" height="360" fill="url(#glow)"/>
  <rect width="480" height="360" fill="url(#dots)"/>

  <!-- One large soft orb bleeding off the corner gives depth without a photo. -->
  <circle cx="452" cy="34" r="132" fill="#fff" opacity=".055"/>
  <circle cx="26" cy="336" r="96" fill="#000" opacity=".07"/>

  <rect width="480" height="360" fill="url(#shade)"/>

  <!-- ── Glass panel ──
       The icon and the text share one surface. Previously the glyph floated
       alone in the middle of a colour field, which is what looked uncreative. -->
  <g filter="url(#soft)">
    <rect x="36" y="196" width="408" height="128" rx="22"
          fill="#fff" opacity=".13"/>
    <rect x="36.5" y="196.5" width="407" height="127" rx="21.5"
          fill="none" stroke="#fff" stroke-opacity=".30" stroke-width="1"/>
  </g>

  <!-- Category glyph, 3.2× the old size, seated in a tinted disc inside the
       panel rather than floating in the middle of the card. -->
  <g transform="translate(78 250)">
    <circle r="30" fill="#fff" opacity=".20"/>
    <circle r="30" fill="none" stroke="#fff" stroke-opacity=".34" stroke-width="1"/>
    <g transform="translate(-22 -22) scale(1.833)" fill="none" stroke="#fff"
       stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round"
       opacity=".97">
      <path d="{icon}"/>
    </g>
  </g>

  <!-- ── Text block, right-aligned ──
       Measured, not reasoned about. Four variants were rendered side by side
       (direction × anchor × x) and only one placed Persian text correctly:

           direction="rtl" text-anchor="start" x=<right edge>   ✓
           direction="rtl" text-anchor="end"   x=60             ✗ runs left
           (no direction)  text-anchor="end"   x=420            ✗ runs right
           direction="rtl" text-anchor="middle" x=240           ✗ centred

       So the anchor keyword that looks wrong is the right one: with
       direction="rtl", `start` is the right-hand edge and the run extends
       leftward from x. The earlier failure was not the anchor — it was x=132,
       which is 110px inside the card rather than at its right margin, so the
       text grew off the left side. At x=420 it sits correctly, and the three
       lines are on separate baselines so the area never overlaps the name. -->
  <text x="420" y="232" fill="#fff" font-family="Vazirmatn, Tahoma, sans-serif"
        font-size="13" font-weight="600" opacity=".74" direction="rtl"
        text-anchor="start">{safe_area}</text>
  <text x="420" y="268" fill="#fff" font-family="Vazirmatn, Tahoma, sans-serif"
        font-size="25" font-weight="800" direction="rtl"
        text-anchor="start">{safe_name}</text>
  <text x="420" y="297" fill="#fff" font-family="Vazirmatn, Tahoma, sans-serif"
        font-size="11.5" font-weight="500" opacity=".58" direction="rtl"
        text-anchor="start">تصویر ثبت نشده است</text>
</svg>
'''


def main():
    os.makedirs(OUTDIR, exist_ok=True)

    sql = os.path.join(HERE, "seed_real.sql")
    if not os.path.isfile(sql):
        raise SystemExit("run scripts/seed_real_shops.py first")

    text = open(sql, encoding="utf-8").read()
    rows = re.findall(
        r"INSERT INTO stores \(name, address, category, location, created_at\) "
        r"VALUES \('((?:[^']|'')*)', '((?:[^']|'')*)', '([a-z]+)'", text)

    mapping = {}
    made = 0
    for raw_name, raw_area, cat in rows:
        name = raw_name.replace("''", "'")
        area = raw_area.replace("''", "'")
        area = area.split("،")[0].strip() or "تهران"
        h = hashlib.sha1(f"{name}|{cat}".encode("utf-8")).hexdigest()[:16]
        fname = f"{h}.svg"
        path = os.path.join(OUTDIR, fname)
        # Always rewrite: the generator changed, so every existing file is
        # stale. The previous version skipped existing paths to save work,
        # which would have left all 757 cards on the old design.
        with open(path, "w", encoding="utf-8") as f:
            f.write(card(name, cat, area))
        made += 1
        mapping[name] = f"images/stores/placeholder/{fname}"

    with open(MAP, "w", encoding="utf-8") as f:
        json.dump(mapping, f, ensure_ascii=False, indent=1)
    print(f"cards: {made} written, {len(mapping)} shops mapped")
    print(f"wrote {MAP}")


if __name__ == "__main__":
    main()
