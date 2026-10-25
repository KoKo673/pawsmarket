"""Generate PawsMarket artwork through deAPI.

Two jobs:
  * marketing — a banner and a poster for advertising
  * stores    — replacement photography for the categories whose stock image
                is generic, used wherever a shop has no usable photo of its
                own (`STORE_IMAGE` in src/lib/api.ts)

**No text is ever asked of the model.** Image models mangle Persian script;
the wordmark is composed on top afterwards with the real Vazirmatn file that
already ships in public/fonts. A prompt containing «پازمارکت» produced a
worse image than one containing nothing.

The key is read from DEAPI_KEY. It is never written to disk, never logged,
and never committed — the root password on this project was pasted into chat
once and had to be treated as burned.

Usage:
    DEAPI_KEY=... python scripts/gen_art.py --set marketing
    DEAPI_KEY=... python scripts/gen_art.py --set stores
    DEAPI_KEY=... python scripts/gen_art.py --set marketing --only banner
"""
import argparse
import json
import os
import sys
import time
import urllib.request

BASE = "https://api.deapi.ai"
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/131.0 Safari/537.36")
HERE = os.path.dirname(os.path.abspath(__file__))
OUTDIR = os.path.join(HERE, "..", "artifacts", "art")

# The same palette the app uses: warm paper, Paw-Orange, soft teal.
STYLE = (
    "warm editorial photography, muted terracotta and cream palette, "
    "soft natural window light, shallow depth of field, calm and premium, "
    "high detail, no text, no letters, no watermark, no logo"
)

# The banner is the one image where the subject must survive being read at
# thumbnail size. "Shallow depth of field" in STYLE is what made the dog and
# cat look hazy on the first pass, so it is replaced rather than appended to —
# naming both would just let the model pick the one it prefers.
STYLE_SHARP = STYLE.replace(
    "shallow depth of field",
    "the subjects sharply in focus with crisp fur and clear eyes, "
    "background falling away softly behind them",
)

# The app's actual tokens, not an approximation of them. src/index.css has
# --primary 20 96% 37% (#FA5C00) and a paper background near #FBE9E1; the
# earlier "muted terracotta and cream" was close enough to look right and far
# enough to feel like a different brand when the image sat next to the UI.
# Hex values are named explicitly because colour names drift between prompts
# and between runs.
BRAND = (
    "palette locked to these exact colours: background #FBE9E1 warm peach, "
    "accents and any ribbon or textile #FA5C00 vivid orange, deep shadow tone "
    "#191612 near-black brown, secondary accent #21BAA6 soft teal used only "
    "sparingly. No other hues.",
)

JOBS = {
    # ── marketing ────────────────────────────────────────────────────
    "banner": {
        "size": (1536, 640),
        "prompt": (
            "A sunlit wide scene of a happy dog and a cat together on a warm "
            "cream sofa in a modern Iranian apartment, soft terracotta wall, "
            "a few pet care items nearby, generous empty space on the left "
            "third for a wordmark. "
            "The animals are brightly lit with clear catchlights in their "
            "eyes, " + STYLE_SHARP
        ),
    },
    "poster": {
        "size": (1024, 1536),
        "prompt": (
            "A vertical portrait of a dog and a cat sitting close together, "
            "looking at the camera, soft studio light against a warm cream "
            "backdrop, calm and affectionate, empty space at the top for a "
            "headline, " + STYLE
        ),
    },
    "poster-alt": {
        "size": (1024, 1536),
        "prompt": (
            "A vertical flat-lay of pet care essentials on a warm cream "
            "surface: a ceramic pet bowl, a knotted rope chew toy, a small "
            "rubber ball, a folded cream blanket, a sprig of greenery, soft "
            "daylight, generous empty space at the top. "
            "No brushes of any kind — the first attempt returned a human "
            "nail brush and a human hairbrush, which say nothing about pets, "
            + STYLE
        ),
    },
    # ── store stock photography ──────────────────────────────────────
    "vet": {
        "size": (1024, 768),
        "prompt": (
            "A bright modern veterinary examination room: a calm golden "
            "retriever sitting on a clean steel table, a stethoscope resting "
            "beside it, stainless cabinets and warm wood, soft daylight from "
            "a window. No people at all — no vet, no hands, no faces. " + STYLE
        ),
    },
    # Rewritten from scratch, not patched. Two earlier versions both put the
    # dog on a grooming table, and both drew the overhead restraint arm —
    # saying "no arm" in the prompt kept describing an arm.
    #
    # So the scene no longer contains a table, a bar, a strap or a salon.
    # It is a finished groom photographed as a portrait: the animal on a rug
    # beside a window, a ribbon in the brand orange tying it to the site.
    # With no furniture to hang anything from, there is nothing to model it as.
    "groomer": {
        "size": (1024, 768),
        "prompt": (
            "A small freshly-groomed white bichon frise sitting upright on a "
            "soft cream rug beside a sunlit window, fur still fluffy and "
            "styled, a bright orange silk ribbon tied at its collar (#FA5C00). "
            "The dog looks straight at the camera, ears perked, mouth relaxed "
            "and slightly open — content and well cared for. Behind it, out of "
            "focus, a domestic living room with a potted plant. "
            "A calm, warm, friendly portrait of a dog that has just been "
            "pampered. No table, no counter, no bar, no strap, no collar loop, "
            "no cage, no salon equipment, no human being in frame. " + BRAND
        ),
    },
    "boarding": {
        "size": (1024, 768),
        "prompt": (
            "Inside a pet boarding kennel: a raised mesh panel cot on a steel "
            "leg frame, like a veterinary recovery cot, with a folded grey "
            "fleece on it. A second identical cot beside it. A stainless "
            "water bowl on the tiled floor, a slatted wooden run divider. "
            "No bed, no mattress, no pillow, no duvet, no bedding, "
            "no domestic furniture of any kind — this is a kennel, not a "
            "bedroom. " + STYLE
        ),
    },
    "shelter": {
        "size": (1024, 768),
        "prompt": (
            "An animal shelter room seen from standing height: on a tiled "
            "floor, three flat cushioned mats lie directly on the ground in a "
            "row, each about the size of a large dog, each with a folded "
            "fleece blanket on top. A dog curled asleep on the nearest mat. "
            "Crates and food bins along the back wall, a clipboard hanging on "
            "a hook, warm cream walls, soft daylight from a high window. "
            "The mats are flat pads — no legs, no frame, no headboard, no "
            "raised platform, nothing that resembles a human bed, mattress, "
            "pillow or duvet. " + STYLE
        ),
    },
    "shop": {
        "size": (1024, 768),
        "prompt": (
            "An inviting pet shop interior, wooden shelves of food bags and "
            "toys, neatly arranged, warm cream walls, soft daylight, tidy and "
            "premium, no people, " + STYLE
        ),
    },
    "cafe": {
        "size": (1024, 768),
        "prompt": (
            "A pet-friendly cafe corner, a cat resting on a low bench beside "
            "a window, warm wood and cream, plants, soft light, welcoming and "
            "quiet, no people, " + STYLE
        ),
    },
}

# ── pool: several shots per category ────────────────────────────────
#
# 570 shops have no photo of their own. Giving all of them one identical
# stock image would put the same picture on 219 clinics, which is the exact
# "pixel-identical photos read as fake data" problem store_images.py was
# written to fix. So each category gets a small pool and the shops are dealt
# out across it — not a unique photo each (impossible at this cost), but no
# two neighbours sharing one either.
POOL = {
    "vet-a": ("A bright veterinary reception desk in warm wood and cream, a "
              "potted plant, soft daylight, tidy and calm, no people, "),
    "vet-b": ("A veterinary consultation room with a scale, an otoscope and "
              "a computer on a clean counter, a cat carrier open on the floor, "
              "soft teal and cream, warm daylight, no people, no faces, "),
    "vet-c": ("A veterinary clinic hallway with framed animal posters, warm "
              "wood floor, natural light from a side window, no people, "),
    "shop-a": ("A tidy pet shop checkout counter with jars of treats, warm "
               "cream walls, soft daylight, no people, "),
    "shop-b": ("Shelves of stacked pet food bags in a bright pet shop, neatly "
               "aligned, warm neutral tones, soft daylight, no people, "),
    "shop-c": ("A pet shop shelf of aquariums and bird cages, small fish "
               "tanks glowing softly, seed and supply boxes beside them, warm "
               "cream and terracotta, no people, "),
    "groomer-a": ("A grooming salon washing tub in warm grey tile, folded "
                  "cream towels stacked beside it, bottles on a ledge, soft "
                  "daylight, no people, "),
    "groomer-b": ("A grooming station with brushes, scissors and bottles laid "
                  "out neatly on a warm wooden counter, soft daylight, "),
    "boarding-a": ("A pet boarding suite with a raised mesh cot, fleece "
                   "blanket, food and water bowls, warm cream walls, soft "
                   "daylight, no people, "),
    "boarding-b": ("An outdoor pet boarding yard, artificial grass and a "
                   "low fence, a shaded kennel run, warm afternoon light, "
                   "no people, "),
    "shelter-a": ("A clean animal shelter corridor with numbered kennel doors "
                  "and soft lighting, warm cream and timber, orderly and "
                  "hopeful, no animals, no people, "),
}

for name, prompt in POOL.items():
    JOBS[name] = {"size": (1024, 768), "prompt": prompt + STYLE}


def req(method, path, body=None, timeout=90):
    key = os.environ.get("DEAPI_KEY")
    if not key:
        sys.exit("DEAPI_KEY is not set")
    data = json.dumps(body).encode() if body is not None else None
    headers = {"Authorization": "Bearer " + key, "Accept": "application/json",
               "User-Agent": UA}
    if data:
        headers["Content-Type"] = "application/json"
    r = urllib.request.Request(BASE + path, data=data, headers=headers,
                               method=method)
    with urllib.request.urlopen(r, timeout=timeout) as res:
        return json.loads(res.read())


def generate(name, spec, outdir):
    w, h = spec["size"]
    print(f"[{name}] {w}x{h}")
    d = req("POST", "/api/v2/images/generations", {
        "model": "ZImageTurbo_INT8", "prompt": spec["prompt"],
        "width": w, "height": h, "steps": 16, "seed": -1,
    })
    rid = d["data"]["request_id"]
    start = time.time()
    while time.time() - start < 900:
        j = req("GET", f"/api/v2/jobs/{rid}")["data"]
        status = j.get("status")
        if status == "done":
            url = j["result_url"]
            dest = os.path.join(outdir, f"{name}.png")
            u = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(u, timeout=240) as r, open(dest, "wb") as f:
                f.write(r.read())
            price = (j.get("price") or {}).get("amount")
            print(f"[{name}] done  {os.path.getsize(dest)//1024} KB  ${price}")
            return dest
        if status in ("error", "failed"):
            print(f"[{name}] FAILED {j.get('error_code')} {j.get('error_reason')}")
            return None
        time.sleep(2)
    print(f"[{name}] timed out")
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--set", default="marketing",
                    choices=["marketing", "stores", "all"])
    ap.add_argument("--only", default=None, help="one job name")
    ap.add_argument("--out", default=OUTDIR)
    args = ap.parse_args()

    names = ([args.only] if args.only else
             ["banner", "poster", "poster-alt"] if args.set == "marketing" else
             ["vet", "groomer", "boarding", "shelter", "shop", "cafe"]
             if args.set == "stores" else list(JOBS))
    os.makedirs(args.out, exist_ok=True)
    for n in names:
        if n not in JOBS:
            sys.exit(f"unknown job {n}")
        generate(n, JOBS[n], args.out)
    bal = req("GET", "/api/v2/account/balance")["data"]["balance"]
    print(f"\nremaining balance: ${float(bal):.4f}")


if __name__ == "__main__":
    main()
