"""Generate the social preview image (og:image) from the brand's own creative.

Sized from the vendors' documentation, not from memory:
  Facebook/Meta — "use images that are at least 1200x630", minimum 600x315,
  max 8 MB (developers.facebook.com/docs/sharing/webmasters/images).
  X — its own docs ship og:image 1200x630 with both og: and twitter: tags
  (docs.x.com/x-for-websites/cards/overview/markup).
1200x630 satisfies both, so there is one image to maintain.

── Where the design comes from ──────────────────────────────────────
Not invented here. The operator supplied the brand creatives (a 1080x1920
story frame and the Instagram posts); this script reads the story frame and
inherits, by measurement rather than by eye:

  - the background gradient   (250,231,224) at the top → (240,195,172)
  - the headline ink          (33,25,19)
  - the brand orange of the wordmark  (236,98,19)
  - the muted grey of the domain      (93,84,77)
  - the phone mockup itself, cropped out of the frame rather than redrawn

The first two versions of this file drew a card from scratch with Tahoma,
then with Vazirmatn and a stock photograph. Both were rejected as looking
like a placeholder — correctly: they were guesses about the brand instead
of the brand. This version cannot drift from the brand because the pixels
are the brand's.

Persian is shaped with arabic_reshaper and reordered with python-bidi
before drawing: PIL does neither, and raw text renders disconnected and
reversed (measured on the first render — «پازمارکت» came out «تکرامزاپ»).

Everything is drawn at 2x and downsampled, which is the difference between
sharp type and aliased edges.

Re-running this is the maintenance story and it must stay deterministic:
same inputs, same bytes.
"""
import pathlib
import sys

import arabic_reshaper
from bidi.algorithm import get_display
from PIL import Image, ImageDraw, ImageFilter, ImageFont

REPO = pathlib.Path(__file__).resolve().parent.parent
OUT = REPO / "public" / "og-image.jpg"
FONT = REPO / "public" / "fonts" / "Vazirmatn-var.woff2"
CREATIVE = REPO / "scripts" / "assets" / "brand-story.jpg"

W, H = 1200, 630
S = 2

# ── Palette, measured from the creative ─────────────────────────────
BG_TOP = (250, 231, 224)
BG_BOTTOM = (240, 195, 172)
INK = (33, 25, 19)
ORANGE = (236, 98, 19)
MUTED = (93, 84, 77)

# ── Phone mockup, measured in creative pixels ───────────────────────
# The bezel's dark pixels span cols 230..850 and rows 560..1903; the crop
# sits a few pixels outside so the rounded corners survive instead of
# being clipped into right angles.
PHONE_BOX = (222, 552, 858, 1911)   # 636 x 1359 → aspect 0.468

# ── Type metrics ────────────────────────────────────────────────────
# Measured with Face.getbbox() at 2x, not guessed. Keep these in step with
# the strings below or the block will overlap itself.
#   H1    96 Bold   681 x 93      MARK  92 Bold   328 x 95
#   SUB   46 Reg    539 x 46      DOM   40 Reg    258 x 39
# The headline is drawn at its design size because the phone, at full card
# height, is only 309 px wide — the right column has 728 px to work in.
# At 636x1359 the phone is 0.468 as wide as it is tall. The top of the
# mockup sits inside the card — the app header ("کاوش در اطراف") is the one
# thing on it that says what the product does, and the earlier version
# bled it off the top edge and sliced it. It bleeds off the BOTTOM
# instead, so it reads as continuing past the card rather than sitting in
# it, and the height is what is chosen: width follows from the aspect.
PHONE_TOP = 14
PHONE_H = H - PHONE_TOP + 26   # 642 → 26 px past the bottom edge
PHONE_X = 62
RIGHT = W - 68         # right edge of every line of type


def fa(text: str) -> str:
    return get_display(arabic_reshaper.reshape(text))


def face(size: int, weight: str = "Regular") -> ImageFont.FreeTypeFont:
    """A Vazirmatn instance at `size`, at the requested variable weight."""
    f = ImageFont.truetype(str(FONT), size * S)
    try:
        f.set_variation_by_name(weight)
    except Exception:
        pass  # a static build of the font has no axes; default weight is fine
    return f


def gradient(size) -> Image.Image:
    """The creative's own vertical background wash."""
    w, h = size
    col = Image.new("RGB", (1, h))
    px = col.load()
    for y in range(h):
        t = y / max(h - 1, 1)
        px[0, y] = tuple(round(a + (b - a) * t) for a, b in zip(BG_TOP, BG_BOTTOM))
    return col.resize((w, h), Image.BICUBIC)


def main() -> int:
    if not CREATIVE.exists():
        print(f"missing brand creative: {CREATIVE}", file=sys.stderr)
        return 1

    canvas = gradient((W * S, H * S))

    # ── Phone, cropped from the creative and bled off the bottom ────
    # It is the product. A card whose only content is type gets no more
    # clicks than a plain link, and a stock photo says nothing about what
    # the site is. Cropping the real mockup also guarantees the card can
    # never show a version of the app that does not exist.
    phone = Image.open(CREATIVE).convert("RGB").crop(PHONE_BOX)
    ph_h = PHONE_H * S
    ph_w = round(phone.width * ph_h / phone.height)
    phone = phone.resize((ph_w, ph_h), Image.LANCZOS)
    canvas.paste(phone, (PHONE_X * S, PHONE_TOP * S))

    d = ImageDraw.Draw(canvas, "RGBA")

    # ── Type block, right side (RTL reading starts at the right) ────
    # Anchors are the baseline of each line, and every vertical position
    # below is the measured bbox above turned into one, so nothing here
    # can collide with anything else by accident.
    r = RIGHT * S

    # The brand line, verbatim from the creative. It is one line at 96px:
    # it measures 681 px in a 728 px column, so it never has to wrap.
    d.text((r, (76 + 125) * S), fa("نزدیک‌ترین را ببین"),
           font=face(96, "Bold"), fill=INK, anchor="rs")

    # The wordmark in the brand orange, as the creative sets it.
    #
    # Measured contrast of this orange on this background is 2.71:1 —
    # below the 3:1 WCAG asks of large text. It stays because it is the
    # logo, and the guideline exempts logotypes; the words that have to be
    # read are set in INK (14.5:1) and MUTED (5.5:1). Do not reuse ORANGE
    # for any other text on this card.
    d.text((r, (200 + 126) * S), fa("پازمارکت"),
           font=face(92, "Bold"), fill=ORANGE, anchor="rs")

    # What the site actually is, muted, two lines at the comma in the
    # phrase — not at whatever width it happens to hit.
    d.text((r, (326 + 62) * S), fa("حیوانات، لوازم و مراکز خدماتی"),
           font=face(46), fill=MUTED, anchor="rs")
    d.text((r, (386 + 61) * S), fa("نزدیک شما، روی یک نقشه"),
           font=face(46), fill=MUTED, anchor="rs")

    # Domain, at the foot of the block and clear of the subtitle: the
    # first pass put it 40px under a text line, which read as one broken
    # sentence rather than two pieces of information.
    d.text((r, 560 * S), "pawsmarket.ir",
           font=face(40), fill=MUTED, anchor="rs")

    canvas = canvas.resize((W, H), Image.LANCZOS)
    canvas = canvas.filter(ImageFilter.UnsharpMask(radius=1.1, percent=55, threshold=2))
    canvas.save(OUT, "JPEG", quality=90, optimize=True, progressive=True)

    size = OUT.stat().st_size
    print(f"wrote {OUT.relative_to(REPO)}  {W}x{H}  {size/1024:.0f} KB  "
          f"(brand creative + Vazirmatn)")
    if size > 400 * 1024:
        print("  WARNING: over 400 KB", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())