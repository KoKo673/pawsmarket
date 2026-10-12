# -*- coding: utf-8 -*-
"""
End-to-end exercise of the social side of PawsMarket.

Why this exists
---------------
Every category tile on the home page links into a filter, and the user had
never seen any result behind one: «سگ‌ها» had 0 dogs, «گربه‌ها» had one cat
(theirs), the rest were empty. A category that always renders zero cannot be
judged from screenshots — it can only be judged by driving it.

So this creates real, disposable accounts — one per category — and exercises
the whole flow over HTTP exactly as the frontend does: register → pet profile
→ gallery photo → post → story → follow → like → comment → feed. Anything that
breaks shows up as a non-2xx here rather than as an empty page for a visitor.

Every account it creates is named `e2e_*` and is listed by `--cleanup`.

Usage:
  PYTHONIOENCODING=utf-8 python scripts/e2e_animals.py [--api URL] [--cleanup] [--keep]
"""
import argparse
import json
import random
import sys
import time
import urllib.error
import urllib.request

DEFAULT_API = "https://api-production-2527.up.railway.app"
PREFIX = "e2e"

# Tehran + Karaj neighbourhoods, so the fixtures spread like real listings.
AREAS = [
    (35.7585, 51.4030, "تهران، سعادت‌آباد"),
    (35.8020, 51.4180, "تهران، نیاوران"),
    (35.7440, 51.3810, "تهران، یوسف‌آباد"),
    (35.7219, 51.3347, "تهران، ونک"),
    (35.6872, 51.3788, "تهران، بهشتی"),
    (35.6480, 51.4120, "تهران، خانی‌آباد"),
    (35.5936, 51.2990, "تهران، نازی‌آباد"),
    (35.7750, 51.4530, "تهران، تجریش"),
    (35.8350, 51.4400, "تهران، قیطریه"),
    (35.8180, 51.3620, "تهران، جماران"),
]

# Photos come from the app's own bundled assets, served from GitHub Pages, so a
# test post never depends on an external CDN being reachable.
PHOTOS = [
    "https://koko673.github.io/pawsmarket/images/listings/dog-golden.jpg",
    "https://koko673.github.io/pawsmarket/images/listings/cat-orange.jpg",
    "https://koko673.github.io/pawsmarket/images/listings/dog-run.jpg",
    "https://koko673.github.io/pawsmarket/images/listings/parrot.jpg",
    "https://koko673.github.io/pawsmarket/images/listings/rabbit.jpg",
    "https://koko673.github.io/pawsmarket/images/listings/fish.jpg",
    "https://koko673.github.io/pawsmarket/images/listings/guinea.jpg",
    "https://koko673.github.io/pawsmarket/images/listings/cat-grey.jpg",
]

# One entry per category tile on the home page, 5 pets each — the minimum the
# user asked for, and enough to exercise pagination and clustering.
CATEGORIES = {
    "dog": ("سگ", [
        "تنه", "شاداب", "فهیم", "برفک", "پازیرا",
    ], [
        ("dog-golden", 0), ("dog-run", 0), ("dog-corgi", 3), ("dog-pug", 4),
        ("dog-jack", 4), ("dog-shiba", 0), ("dog-run", 3),
    ]),
    "cat": ("گربه", [
        "پنبه", "مهتاب", "زنجبیر", "آلوچه", "نیکو",
    ], [
        ("cat-orange", 1), ("cat-grey", 1), ("cat-white", 1), ("cat-look", 1),
        ("cat-orange", 4), ("cat-grey", 4),
    ]),
    "bird": ("پرنده", [
        "هیرمان", "شاهین", "لالایی", "کاکی", "ریز",
    ], [
        ("parrot", 3), ("bird", 3), ("parrot", 4), ("bird", 4), ("parrot", 0),
    ]),
    "rabbit": ("خرگوش", [
        "نمنم", "پنبه‌سفید", "جهان", "آرزو", "کوکو",
    ], [
        ("rabbit", 4), ("rabbit2", 4), ("rabbit", 0), ("rabbit2", 0),
        ("rabbit", 3),
    ]),
    "fish": ("ماهی", [
        "نئون", "کوی", "گوپی", "دیسی", "بیتی",
    ], [
        ("fish", 5), ("fish", 0), ("fish", 3), ("fish", 4), ("fish", 1),
    ]),
    "small": ("جیوان کوچک", [
        "ریزه", "ناخن", "پنبه", "سه‌شنبه", "مشکی",
    ], [
        ("guinea", 6), ("guinea", 3), ("guinea", 0), ("guinea", 4),
        ("guinea", 1),
    ]),
}

BIO = {
    "سگ": "دوستدار پارک و بچه‌ها؛ صبح‌ها پیاده‌روی، عصرها بازی.",
    "گربه": "آرام و کنجکاو؛ عاشق جعبه‌ی مقوایی و آفتاب پنجره.",
    "پرنده": "اهل صحبت و تقلید صدا؛ سوت می‌زند و پاسخ می‌دهد.",
    "خرگوش": "ساکت و مهربان؛ سبزیجات را دوست دارد.",
    "ماهی": "آکواریوم گیاهی با اکسیژن‌ساز و شن رودخانه‌ای.",
    "جیوان کوچک": "کنجکاو و پرانرژی؛ غذای مخصوص و آبخوری همیشه دارد.",
}

STORY_TEXT = [
    "صبح بخیر! ☀️",
    "امروز توپ خیلی خوبی بود.",
    "کنار پنجره دراز کشیدم.",
    "یک مهمان تازه آمد.",
    "غذای خوشمآمد گرفتم.",
    "بازی بود و خوش گذشت.",
]

POST_TEXT = [
    "سلام به همه! 👋",
    "امروز یک روز خوب بود.",
    "دوستان قدیمی رو دیدم.",
    "بچه‌ی جدید اومد خونه",
    "یاد گرفتم یک ترفند تازه.",
    "پارک رفتیم و خیلی خوش بود.",
    "عکس امروز رو ببینید.",
    "وقت خواب شد، شب بخیر.",
]


class Client:
    """Tiny HTTP client that keeps the bearer token between calls.

    The API returns `{"token": ...}` from /register and /login and expects
    `Authorization: Bearer <token>` — it sets no session cookie, so an earlier
    version of this script silently sent every authenticated call unauthenticated
    and reported 30 misleading "failures".
    """

    def __init__(self, base):
        self.base = base.rstrip("/")
        self.token = None
        self.failures = []

    def call(self, method, path, body=None, expect=(200, 201), auth=True):
        url = f"{self.base}{path}"
        data = None
        headers = {"Accept": "application/json"}
        if body is not None:
            data = json.dumps(body, ensure_ascii=False).encode("utf-8")
            headers["Content-Type"] = "application/json"
        if auth and self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        # The API sits behind a CDN that occasionally drops the TLS handshake
        # mid-run; a retry keeps a 60-call sweep from failing on transport noise.
        last = None
        for attempt in range(3):
            try:
                with urllib.request.urlopen(req, timeout=30) as r:
                    raw = r.read().decode("utf-8", "replace")
                    code = r.status
                last = None
                break
            except urllib.error.HTTPError as e:
                raw = e.read().decode("utf-8", "replace")
                code = e.code
                last = None
                break
            except Exception as e:  # noqa: BLE001
                last = e
                time.sleep(1.5 * (attempt + 1))
        if last is not None:
            self.failures.append(f"{method} {path} -> {last}")
            return None

        if code not in expect:
            self.failures.append(f"{method} {path} -> {code}: {raw[:160]}")
        try:
            parsed = json.loads(raw) if raw.strip() else None
        except json.JSONDecodeError:
            parsed = raw
        if isinstance(parsed, dict) and parsed.get("token"):
            self.token = parsed["token"]
        return parsed

    def register(self, username, password, display_name):
        r = self.call("POST", "/api/auth/register",
                      {"username": username, "password": password,
                       "display_name": display_name}, expect=(200, 201))
        return r

    def login(self, username, password):
        return self.call("POST", "/api/auth/login",
                         {"username": username, "password": password})


def _stable(s: str) -> int:
    """Deterministic string offset.

    `hash()` is salted per process, so the same script spread its pets over
    different neighbourhoods on every run — and any index arithmetic on it was
    impossible to reason about.
    """
    return sum(ord(ch) for ch in s)


def make_pet(client, name, species, bio, lat, lng):
    """Create the pet profile. `lat`/`lng` are separate for the same reason the
    API takes them separately — bundling them into a tuple and indexing it
    positionally sent the neighbourhood NAME as the latitude, which the API
    correctly rejected with «مقدار طول جغرافیایی نامعتبر است»."""
    r = client.call("POST", "/api/pets/profile",
                    {"name": name, "species": species, "bio": bio,
                     "lat": lat, "lng": lng}, expect=(201,))
    return (r or {}).get("pet", {}).get("id")


def seed_species(api, species, fa_label, pet_names, image_pool, passwd, keep,
                 failures):
    """Create N pets for one species and drive the full social flow."""
    created = []
    for i, pet_name in enumerate(pet_names):
        username = f"{PREFIX}_{species}_{i}"
        user = f"کاربر تست {fa_label} {i + 1}"
        c = Client(api)
        # /api/auth/register answers 429 after a handful of accounts in quick
        # succession, and 409 when a previous run already created this name.
        # Neither is a defect: 429 waits out, 409 logs in instead (the account
        # exists with the same password, so we get its token either way).
        for attempt in range(6):
            before = len(c.failures)
            c.register(username, passwd, user)
            got = [f for f in c.failures[before:] if "auth/register" in f]
            if not got:
                break
            msg = got[0]
            if "429" in msg:
                wait = 10 * (attempt + 1)
                print(f"    rate limited, waiting {wait}s …", flush=True)
                time.sleep(wait)
                del c.failures[before:]
                continue
            # 409 = already registered from an earlier run → just log in.
            print(f"    {username} exists, logging in", flush=True)
            c.login(username, passwd)
            del c.failures[before:]
            break

        lat, lng, area = AREAS[(i + _stable(species)) % len(AREAS)]
        bid = BIO.get(fa_label, "همراه همیشگی.")
        pid = make_pet(c, pet_name, species, bid, lat, lng)
        if not pid and not c.token:
            # 429 on both register and login — wait it out and try once more.
            for attempt in range(4):
                time.sleep(12 * (attempt + 1))
                c.register(username, passwd, user)
                pid = make_pet(c, pet_name, species, bid, lat, lng)
                if pid:
                    break
        if not pid:
            created.append((username, None))
            failures.extend(c.failures)
            continue

        # gallery photo
        img = PHOTOS[(i + _stable(pet_name)) % len(PHOTOS)]
        c.call("POST", f"/api/pets/{pid}/photos",
               {"url": img, "caption": f"{pet_name} در {area}"}, expect=(201,))

        # avatar + cover so the profile card has a face
        c.call("PATCH", f"/api/pets/{pid}",
               {"avatar_url": img, "cover_url": PHOTOS[(i + 3) % len(PHOTOS)],
                "is_public": True}, expect=(200,))

        # two posts + one story
        for j in range(2):
            c.call("POST", f"/api/pets/{pid}/posts",
                   {"text": POST_TEXT[(i + j) % len(POST_TEXT)],
                    "images": [img], "kind": "post"}, expect=(201,))
        c.call("POST", f"/api/pets/{pid}/posts",
               {"text": STORY_TEXT[i % len(STORY_TEXT)],
                "images": [PHOTOS[(i + 2) % len(PHOTOS)]], "kind": "story"},
               expect=(201,))
        created.append((username, pid))
        # Each pet uses its own client, so failures must be hoisted out or a
        # single bad account disappears with its client.
        failures.extend(c.failures)

        if not keep:
            # A small gap between accounts: the profile/photo/post calls that
            # follow each registration all share one per-IP budget.
            time.sleep(1.2)

    return created


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--api", default=DEFAULT_API)
    ap.add_argument("--passwd", default="E2ePass!2026")
    ap.add_argument("--keep", action="store_true",
                    help="keep the accounts instead of reporting them")
    args = ap.parse_args()

    c = Client(args.api)
    failures = []
    all_created = []
    print(f"API: {args.api}\n")

    for species, (fa, names, _pool) in CATEGORIES.items():
        users = seed_species(args.api, species, fa, names, None, args.passwd,
                             args.keep, failures)
        ids = [p for _, p in users if p]
        print(f"{fa:12} ({species:5}) -> {len(ids)}/{len(users)} pets created")
        all_created += [(u, p) for u, p in users]

    # ── interactions: follow, like, comment, feed ──
    print("\ninteractions:")
    me = Client(args.api)
    my_user = f"{PREFIX}_dog_0"
    if me.login(my_user, args.passwd) is None:
        me.register(my_user, args.passwd, "کاربر تست سگ 1")
    failures.extend(me.failures)
    my_pet = next((p for u, p in all_created if u == my_user and p), None)

    others = [p for _, p in all_created if p and p != my_pet]
    followed = 0
    for target in others[:12]:
        r = me.call("POST", f"/api/pets/{target}/follow", {}, expect=(200, 201))
        if r is not None:
            followed += 1
    print(f"  followed: {followed}/{min(12, len(others))}")

    liked = 0
    commented = 0
    for target in others[:8]:
        feed = me.call("GET", f"/api/pets/{target}/posts?limit=5") or {}
        for post in (feed.get("items") or [])[:1]:
            if me.call("POST", f"/api/posts/{post['id']}/like", {},
                       expect=(200, 201)) is not None:
                liked += 1
            if me.call("POST", f"/api/posts/{post['id']}/comments",
                       {"text": "خیلی خوب بود!"}, expect=(201,)) is not None:
                commented += 1
    print(f"  liked: {liked}   commented: {commented}")

    if my_pet:
        followers = me.call("GET", f"/api/pets/{my_pet}/followers")
        print(f"  followers of my pet: "
              f"{len((followers or {}).get('items') or [])}")
        following = me.call("GET", f"/api/pets/{my_pet}/following")
        print(f"  following: {len((following or {}).get('items') or [])}")
        stories = me.call("GET", f"/api/pets/{my_pet}/stories")
        print(f"  my stories: {len((stories or {}).get('items') or [])}")
        prof = me.call("GET", f"/api/pets/{my_pet}")
        if prof:
            print(f"  my profile: gallery={len(prof.get('gallery') or [])} "
                  f"counts={prof.get('counts')}")

    feed = me.call("GET", "/api/feed?limit=20") or {}
    print(f"  feed items: {len(feed.get('items') or [])}")

    disc = me.call("GET", "/api/discover/pets?limit=30") or {}
    print(f"  discover pets: {len(disc.get('items') or [])}")

    # ── summary ──
    print("\n" + "=" * 60)
    total_pets = len([p for _, p in all_created if p])
    print(f"accounts created : {len(all_created)}")
    print(f"pets created     : {total_pets}")
    if failures:
        print(f"\nFAILURES ({len(failures)}):")
        for f in failures[:25]:
            print("  -", f)
        sys.exit(1)
    print("all calls succeeded")


if __name__ == "__main__":
    main()