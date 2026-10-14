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

Usage:
  PYTHONIOENCODING=utf-8 python scripts/make_placeholders.py
Writes: public/images/stores/placeholder/<hash>.svg + scripts/store_placeholders.json
"""
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

# Distinct brand-adjacent gradients, chosen per shop so a list has variety
# without drifting off-palette.
GRADIENTS = [
    ("#FF8A3D", "#E24700"),
    ("#2DD4BF", "#0E8F87"),
    ("#F59E0B", "#B45309"),
    ("#60A5FA", "#1D4ED8"),
    ("#A78BFA", "#6D28D9"),
    ("#34D399", "#047857"),
    ("#F472B6", "#BE185D"),
    ("#FB923C", "#C2410C"),
]


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


def card(name: str, category: str, area: str) -> str:
    h = hashlib.sha1(f"{name}|{category}".encode("utf-8")).hexdigest()
    c1, c2 = GRADIENTS[int(h[:8], 16) % len(GRADIENTS)]
    icon = ICONS.get(category, ICONS["shop"])
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360" width="480" height="360" role="img" aria-label="{esc(name)}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/>
    </linearGradient>
  </defs>
  <rect width="480" height="360" fill="url(#g)"/>
  <circle cx="400" cy="60" r="120" fill="#fff" opacity=".07"/>
  <circle cx="70" cy="320" r="90" fill="#000" opacity=".06"/>
  <g transform="translate(240 138)">
    <circle r="52" fill="#fff" opacity=".16"/>
    <g transform="translate(-24 -24) scale(2)" fill="none" stroke="#fff"
       stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
       opacity=".95">
      <path d="{icon}"/>
    </g>
  </g>
  <text x="240" y="248" text-anchor="middle" fill="#fff"
        font-family="Vazirmatn, Tahoma, sans-serif" font-size="27"
        font-weight="800" direction="rtl">{esc(fit_name(name))}</text>
  <text x="240" y="284" text-anchor="middle" fill="#fff" opacity=".82"
        font-family="Vazirmatn, Tahoma, sans-serif" font-size="16"
        direction="rtl">{esc(area)}</text>
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
        if not os.path.exists(path):
            with open(path, "w", encoding="utf-8") as f:
                f.write(card(name, cat, area))
            made += 1
        mapping[name] = f"images/stores/placeholder/{fname}"

    with open(MAP, "w", encoding="utf-8") as f:
        json.dump(mapping, f, ensure_ascii=False, indent=1)
    print(f"cards: {made} new, {len(mapping)} shops mapped")
    print(f"wrote {MAP}")


if __name__ == "__main__":
    main()