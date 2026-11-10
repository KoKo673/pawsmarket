# SRS — پازمارکت

> سند نیازمندی‌های نرم‌افزار · نسخهٔ ۲٫۰ · ۲۰۲۶-۱۰-۲۸

---

## ۰. روش این سند

نسخهٔ اول این سند فقط فرانت‌اند را دیده بود و در نتیجه، نیمی از سیستم را
به‌عنوان «بیرون از مخزن» علامت زده بود. آن اشتباه بود. بک‌اند روی همان
سرور است، در `/srv/pawsmarket/pawsmarket-serverdash`، و **بالا و سالم**:

```
pawsmarket-backend-1    Up 3 days (healthy)
pawsmarket-frontend-1   Up 27 hours (healthy)
pawsmarket-database-1   Up 9 days (healthy)
pawsmarket-redis-1      Up 7 days (healthy)
```

این نسخه از سه منبع ساخته شده، و هر عدد یکی از این سه را دارد:

| منبع | چه چیزی از آن |
|---|---|
| **کد، خوانده‌شده کامل** | ۲۷٬۱۲۱ خط TypeScript در `src/` · ۶٬۹۴۵ خط Python در `app/` · ۳٬۳۶۳ خط تست Python |
| **سیستم زنده، سنجیده‌شده** | شمای ۳۰ جدول · شمارش ردیف‌ها · اجرای واقعی سینک · نرخ‌محدودی · هدرها · پیکربندی کانتینر |
| **اسناد پروژه** | `PROJECT-STATUS`، `REVIEW-*`، `HANDOFF-*` |

جایی که کد و کامنت با هم نمی‌خوانند، **کد حاکم است** و تناقض صریح ثبت شده.
جایی که عددی نداشتم، ننوشتم.

---

## ۱. دامنه و اهداف

### ۱.۱ سیستم چیست

پازمارکت یک بازارگاه مکانی‌محور خدمات و کالای حیوانات خانگی در ایران است:

1. **کشف** مراکز خدمت نزدیک روی نقشه
2. **رزرو نوبت** از مراکز، بدون تماس تلفنی
3. **خرید کالا** با قیمتی که از بازارگاه‌های ایرانی خوانده می‌شود
4. **لایهٔ اجتماعی** — پروفایل حیوان، فید، لایک، کامنت، استوری
5. **سرپرستی** — آگهی و درخواست و تصمیم

### ۱.۲ در دامنه

| زیرسیستم | شرح |
|---|---|
| کاتالوگ جغرافیایی | جستجوی شعاعی PostGIS روی سه نوع آگهی |
| احراز هویت | رمز عبور + OTP پیامکی، نشست Bearer |
| نوبت‌دهی | درخواست → تصمیم → مدیریت، با دو توکن مستقل |
| فروشگاه | سبد، پرداخت دو درگاهی، تأیید تراکنش |
| قیمت‌گذاری | الگوریتم پله‌ای + سینک روزانه از دو منبع |
| اجتماعی | پروفایل، فالو، فید، لایک، کامنت، استوری |
| سرپرستی | درخواست و تصمیم مالک |
| پشتیبانی | تیکت با توکن دسترسی + دستیار مبتنی بر قاعده |
| ادمین | پنل + درب مخفی + اندپوینت‌های کلیدی |

### ۱.۳ خارج از دامنه

- اپلیکیشن موبایل بومی (وب ریسپانسیو جای آن را می‌گیرد)
- انبارداری و لجستیک (سفارش‌به‌سفارش از بازارگاه مبدأ)
- درگاه پرداخت اختصاصی، کیف پول، اعتبار داخلی
- ایمیل تراکنشی (هیچ SMTP پیکربندی نشده)

---

## ۲. تعریف‌ها

| اصطلاح | معنی دقیق |
|---|---|
| **مرکز** (store) | کسب‌وکار فیزیکی: `shop` \| `vet` \| `groomer` \| `shelter` \| `cafe` \| `boarding` |
| **آگهی** (listing) | ردیف قابل جستجو: `pet` \| `product` \| `store` |
| **پروفایل حیوان** | ردیف جانبی ۱:۱ روی `pets` که مالکیت و حریم خصوصی را نگه می‌دارد |
| **حیوان عامل** | حیوانی که کاربر «به‌جای» آن عمل می‌کند — پارامتر `?as=<petId>` |
| **داشبورد توکن** | توکن ۲۵۶ بیتی برای یک مرکز؛ همهٔ نوبت‌های آن مرکز را باز می‌کند |
| **manage token** | توکن ۱۹۲ بیتی برای یک نوبت؛ فقط همان نوبت را باز می‌کند |
| **access token** | توکن ۱۹۲ بیتی برای یک تیکت پشتیبانی |
| **پیشنهاد** (offer) | قیمت یک منبع بیرونی برای یک کالا، در `offers` |
| **محصول بازارگاه** | ردیف `marketplace_products` — آنچه واقعاً فروخته می‌شود |
| **pinned** | محصولی که سینک به آن دست نمی‌زند |
| **کاتالوگ** | `public/catalog.json` — عکس فوری از دیتابیس |
| **حالت ایستا** | `VITE_CATALOG_MODE=static` — فرانت فقط از کاتالوگ می‌خواند |

---

## ۳. ذی‌نفعان و نقش‌ها

| نقش | احراز هویت | دامنهٔ دسترسی |
|---|---|---|
| **مهمان** | — | خانه، کاوش، نقشه، جزئیات مرکز، جستجوی کسب‌وکار، ثبت تیکت، دستیار |
| **کاربر** | Bearer token (۳۰ روز) | بالا + سبد، سفارش، رزرو، پروفایل حیوان، فید، لایک، کامنت |
| **مالک حیوان** | همان کاربر | عملیات روی پروفایل خودش |
| **مرکز** | داشبورد توکن در URL | نوبت‌های خودش + تقویم هفتگی |
| **مشتری لینک‌دار** | manage token یا access token | یک نوبت، یا یک تیکت |
| **اپراتور** | session + `users.is_admin` | پنل، کاربران، سفارش‌ها، صف پشتیبانی، تأیید ادعا |
| **کلیدگردان** | `X-Admin-Key` | مهاجرت، جایگزینی کاتالوگ، اجرای سینک |

**نکتهٔ مهم:** ادمین **دو گیت مستقل** دارد. اپراتوری که با نشست وارد شده
می‌تواند پنل را ببیند و تیکت جواب بدهد، ولی **نمی‌تواند** مهاجرت اجرا کند،
کاتالوگ را جایگزین کند، یا سینک را صدا بزند — آن‌ها کلید می‌خواهند. دلیلش
در کد: مرورگر نمی‌تواند کلید را أمن نگه دارد.

---

## ۴. معماری

### ۴.۱ اجزای مستقر

```
اینترنت
   │
   ▼
┌──────────────────────────────────────────────────────┐
│  pawsmarket-frontend-1   (nginx + React SPA)         │
│                                                      │
│   /            → فایل‌های استاتیک + SPA fallback      │
│   /api/        → proxy به backend:5000               │
│   /media/      → volume، read-only                   │
│   /health      → proxy به backend                    │
│                                                      │
│   تنها سرویسی که پورت میزبان را می‌گیرد: 80           │
└───────────────┬──────────────────────────────────────┘
                │ network داخلی
                ▼
┌──────────────────────────────┐   ┌──────────────────┐
│  pawsmarket-backend-1        │   │  pawsmarket-     │
│  FastAPI + uvicorn           │◀─▶│  redis-1         │
│  expose 5000 — بدون پورت     │   │  rate-limit      │
└──────────────┬───────────────┘   └──────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────┐
│  pawsmarket-database-1   PostGIS 16-3.4               │
│  بدون پورت. هیچ‌چیز بیرون از این شبکه به Postgres    │
│  نمی‌رسد.                                            │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  pawsmarket-migrate-1   (یک‌باره، Exited 0)          │
│  همهٔ migrations/*.sql را با ON_ERROR_STOP=1 اجرا     │
│  می‌کند، سپس خارج می‌شود. backend منتظر               │
│  service_completed_successfully آن است.              │
└──────────────────────────────────────────────────────┘

خارج از compose:
  systemd timer        → اجرای سینک قیمت روزانه
  torob-mcp-probe      → سرور MCP ترب، Up 7 days
  torob-mcp            → هرگز اجرا نشده (Created)  ← بن‌بست
```

### ۴.۲ چرا این شکل

**یک دامنه، سه مسئولیت.** مرورگر همه‌چیز را same-origin می‌گیرد، پس
CORS روی مسیر داغ وجود ندارد و کوکی cross-site هم نیست. فرانت هیچ تغییری
نمی‌خواهد چون URLها را نسبی می‌سازد وقتی `VITE_API_BASE_URL` خالی است.

**`expose` نه `ports`.** پورت منتشرشده یعنی تماس‌گیرنده می‌تواند پروکسی را
دور بزند و `X-Forwarded-For` را مستقیم جعل کند — همان حفره‌ای که
`TRUST_PROXY` می‌بندد. همچنین نرخ‌محدودی را از دید اینترنت بی‌فایده می‌کند.

**healthcheck فرانت کل زنجیره را می‌سنجد.** `/health` به بک‌اند proxy
می‌شود، و بدنه‌اش grep می‌شود:

```sh
wget -qO- http://127.0.0.1/health | grep -q '"status"'
```

دلیل اندازه‌گیری‌شده: `wget -qO- ... >/dev/null` روی یک 502 هم موفق
گزارش می‌کند، چون صفحهٔ 502 خودش یک انتقال موفق است. با بک‌اند خاموش،
شکل قدیمی همچنان container را سالم می‌گفت.

### ۴.۳ مسیرهای استقرار

```bash
# فرانت
cd /srv/pawsmarket/pawsmarket && git pull --ff-only
cd /srv/pawsmarket/pawsmarket-serverdash
sudo -n docker compose -f docker-compose.prod.yml up -d --build frontend

# راستی‌آزمایی: هش asset باید عوض شود
curl -s https://pawsmarket.ir/ | grep -oE 'assets/index-[A-Za-z0-9_-]+\.js'
```

**وضعیت سنجیده در این تاریخ:** فرانت روی `fd425e1` است — آخرین کامیت
`main`. هش مستقر `index-pR8JXsHb.js`. دو کامیت محلی پوش‌نشده فقط آیکون
و اسکریپت کپشن‌اند و روی سایت اثر ندارند.

### ۴.۴ دو مسیر داده در فرانت

| مسیر | چه وقت | منبع |
|---|---|---|
| **زنده** | پیش‌فرض | `/api/pets`, `/api/products`, `/api/stores/nearby` |
| **ایستا** | `VITE_CATALOG_MODE=static` | `public/catalog.json` |

در حالت زنده، فرانت **هر دو** را موازی می‌گیرد و کاتالوگ را مبنا می‌گذارد:

```ts
const [snapshot, live] = await Promise.allSettled([
  catalogSnapshot(),
  Promise.allSettled([getPetsRaw(...), getProductsRaw(...), getStoresRaw(...)]),
])
```

**قاعدهٔ حیاتی — هویت مرکز با `id` نیست:**

```ts
function businessKey(row) {
  return `${name.trim().replace(/\s+/g,' ')}|${lat.toFixed(4)}|${lng.toFixed(4)}`
}
```

با تطبیق روی `id` تنها، **۴۳۱ از ۴۴۷** مرکز دو بار رندر می‌شدند، چون
کاتالوگ `id` ۱–۷۶۱ دارد و API زنده `id`هایی مثل `10102` می‌دهد. مختصات
تا ۴ رقم اعشار (≈۱۱ متر) گرد می‌شود.

**راهبرد ادغام — زنده فقط چیز *جدید* می‌آورد:**

```ts
petRows   = appendNew(petRows,   okRows(live.value[0]))
storeRows = appendNew(storeRows, okRows(live.value[2]).filter(isServiceStore))
// محصولات از API کاتالوگ گرفته نمی‌شوند — پایین را ببینید
```

دلیل ثبت‌شده: ردیف API نازک است (نام، آدرس، دستهٔ خام) ولی کاتالوگ
غنی‌شده (تلفن، ساعت، عکس، `categories`، امتیاز). اگر ردیف زنده جای
کاتالوگ را می‌گرفت، `category` غنی‌شده از بین می‌رفت و «پناهگاه» هیچ
نتیجه‌ای نمی‌داد در حالی که یازده پناهگاه در داده بود.

**محصولات هرگز از `/api/products` نمی‌آیند.** جدول `products` فهرست
قدیمی موجودی *فروشگاه‌های دیگر* است؛ آنچه این فروشگاه می‌فروشد در
`marketplace_products` است و از `/api/shop` خوانده می‌شود. کد صریح
می‌گوید: «مخلوط کردن این دو همان راهی است که مشتری چیزی می‌خرد که
نمی‌توانیم تأمین کنیم.»

### ۴.۵ تقسیم کد

`src/App.tsx` مسیرها را تنبل بار می‌کند؛ فقط `HomePage` در باندل اول است.
دلیل ثبت‌شده: قبلاً همه‌چیز eager بود و بازدیدکنندهٔ یک صفحه **۱٫۴
مگابایت** جاوااسکریپت دانلود می‌کرد.

`RouteFallback` دو شکل دارد، نه یکی — از یک اشتباه اندازه‌گیری‌شده:

| مسیر | شکل | CLS قبل | CLS بعد |
|---|---|---|---|
| `/pets`, `/adoption` | گرید سه‌ستونه | ۰٫۲۴۲ / ۰٫۱۵۵ | ۰٫۰۰۰ |
| بقیه | ستون `max-w-2xl` | ۰٫۰۹۵ | ۰٫۰۰۰ |

### ۴.۶ پشته

```
Backend   FastAPI · uvicorn · Python 3.11-slim · psycopg2-binary
          redis · uv (برای اجرای سرورهای MCP)
Data      PostgreSQL 16 + PostGIS 3.4
Front     React 19.2 · TypeScript 6.0 · Vite 8.3 · React Router 7.18
          TanStack Query 5.104 · Zustand 5.0 · framer-motion 13.4
          Tailwind 3.4 · Radix UI · Leaflet 1.9 · lucide-react
Quality   oxlint · tsc -b · Playwright · Lighthouse · axe-core · pytest
```

---

## ۵. مدل داده

### ۵.۱ شمای زنده — ۳۰ جدول/ویو

همه از `information_schema` روی دیتابیس زنده در تاریخ این سند.

```
هویت        users · sessions · otp_codes · admin_door_attempts
کاتالوگ     stores · products · marketplace_products · offers · sources
            sync_runs
اجتماعی     pets · pet_profiles · pet_photos · posts · comments · follows
            likes
معامله      bookings · orders · order_items · payments · cart_items
پشتیبانی    support_tickets · support_messages
کسب‌وکار    store_claims
ویو         store_booking_stats
سیستمی      geography_columns · geometry_columns · spatial_ref_sys
```

### ۵.۲ هویت

**`users`** — ۱۳ ستون
```
id                SERIAL PK
username          TEXT NOT NULL
username_lower    TEXT NOT NULL              ← ستون یکتای مقایسه
password_hash     TEXT                        ← NULL = حساب بدون رمز
display_name      TEXT
bio, avatar_url   TEXT
email             TEXT
is_active         BOOLEAN NOT NULL DEFAULT true
created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
phone             TEXT
phone_verified_at TIMESTAMPTZ                 ← این است که تلفن را مدرک می‌کند
is_admin          BOOLEAN NOT NULL DEFAULT false
```

> `password_hash` عمداً nullable است. کامنت مهاجرت `0008`: NULL صادقانه
> است («این حساب رمز ندارد») در برابر ذخیرهٔ یک هش جعلی که هرگز تطبیق
> نمی‌دهد.

**`sessions`** — ۵ ستون
```
token_hash  TEXT PK          ← فقط sha256(token)، هرگز خودِ توکن
user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
expires_at  TIMESTAMPTZ NOT NULL
user_agent  TEXT
```

**`otp_codes`** — ۹ ستون
```
id           SERIAL PK
phone        TEXT NOT NULL
code_hash    TEXT NOT NULL              ← PBKDF2، نه متن ساده
purpose      TEXT NOT NULL
attempts     SMALLINT NOT NULL DEFAULT 0
max_attempts SMALLINT NOT NULL DEFAULT 5
expires_at   TIMESTAMPTZ NOT NULL
consumed_at  TIMESTAMPTZ
created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
```

**`admin_door_attempts`** — ۶ ستون: `id, username, ok, ip, user_agent, created_at`.
رمز و عبارت عبور هرگز ذخیره نمی‌شوند؛ فقط نام کاربریِ تلاش‌شده.

### ۵.۳ کاتالوگ و معامله

**`stores`** — ۱۴ ستون
```
id             SERIAL PK
name           TEXT NOT NULL
address        TEXT NOT NULL
location       geometry(Point,4326) NOT NULL
created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
category       TEXT                ← vet|shop|groomer|boarding|shelter|cafe
phone          TEXT
description    TEXT
rating         NUMERIC
review_count   INTEGER
opens_at       TEXT                ← «09:00»
closes_at      TEXT
website        TEXT
dashboard_hash TEXT UNIQUE         ← sha256 توکن داشبورد
```

**`marketplace_products`** — ۱۱ ستون
```
id, slug, name, our_price NUMERIC NOT NULL, chosen_offer BIGINT,
margin_toman NUMERIC NOT NULL DEFAULT 0, margin_pct NUMERIC NOT NULL DEFAULT 0,
active BOOLEAN NOT NULL DEFAULT true, pinned BOOLEAN NOT NULL DEFAULT false,
created_at, updated_at
```

**`offers`** — ۹ ستون: `id, source_id, external_id, title, cost_price,
in_stock, url, image_url, fetched_at`. یکتایی روی `(source_id, external_id)`.

**`orders`** — ۱۱ ستون: `id, user_id, status DEFAULT 'pending', total_toman,
contact_name, contact_phone, address, note, created_at, paid_at, updated_at`.

**`payments`** — ۱۲ ستون
```
id, order_id, gateway, authority, amount_toman NUMERIC NOT NULL,
request_amount BIGINT NOT NULL, request_currency TEXT NOT NULL,
status TEXT NOT NULL DEFAULT 'pending', ref_id, failure,
created_at, verified_at
```
یکتایی روی `(gateway, authority)` — کلید idempotency.

> `request_amount` و `request_currency` **عیناً** آن چیزی است که آداپتور
> فرستاد. دلیل در کد: یک خطای واحد باید خودش را به‌شکل دو ستون ناسازگار
> نشان بدهد، نه به‌شکل یک شارژ ۱۰ برابری بی‌صدا.

**`bookings`** — ۱۶ ستون: `id, user_id, store_id, pet_id, service,
preferred_at, window_minutes DEFAULT 60, note, contact_name, contact_phone,
status DEFAULT 'pending', decided_at, decision_note, manage_hash UNIQUE,
created_at, updated_at`.

**`cart_items`** — ۶ ستون: `id, user_id, product_id, qty, unit_price,
added_at`. یکتایی روی `(user_id, product_id)`.

### ۵.۴ اجتماعی

**`pets`** (از `init.sql`) — ۵ ستون: `id, name, species,
location geometry(Point,4326), created_at`.
**مالک ندارد.** مالکیت در جدول جانبی است.

**`pet_profiles`** — ۱۱ ستون: `pet_id PK REFERENCES pets ON DELETE CASCADE,
owner_id → users, bio, avatar_url, cover_url, birth_date, gender,
is_public DEFAULT true, adoption_status, adoption_note, created_at`.

**`posts`** — ۹ ستون: `id, pet_id REFERENCES pets ON DELETE SET NULL,
kind CHECK IN ('post','story'), text, images JSONB DEFAULT '[]',
like_count, expires_at, created_at, ...`.

**`follows`** — ۳ ستون: `follower_pet_id, followee_pet_id, created_at`.
PK مرکب، `CHECK follower <> followee`. **گراف حیوان→حیوان است، نه کاربر→کاربر.**

**`likes`** — ۳ ستون: `post_id, user_id, created_at`. **کاربر→پست.**

**`comments`** — ۵ ستون: `id, post_id, user_id, text, created_at`. تخت، بدون پاسخ.

### ۵.۵ وضعیت دادهٔ زنده

```
users                 1          stores                 447
sessions              1            vet 293 · shop 93 · groomer 28
pets                  1            boarding 26 · shelter 7
pet_profiles          1          products               782   ← بازنشسته
posts                 1          marketplace_products   277   (همه فعال)
comments              0          offers                 277   (همه موجود)
follows / likes       0          sync_runs              21
bookings              0          store_claims           0
orders                0          support_tickets        0
payments              0          cart_items             6
payments verified     0          otp_codes              1 (مصرف‌شده)
```

**تازگی:** آخرین سینک `2026-10-28 13:28 UTC`. آخرین `offers.fetched_at`
همان لحظه. **داده تازه است.**

**کامل‌بودن مراکز — این را باید بدانید:**

```
دارای مختصات       447 از 447
دارای تلفن           0 از 447   ← صفر
دارای ساعت کاری      0 از 447   ← صفر
دارای داشبورد        1 از 447
```

> **یعنی API هیچ‌گاه شماره تلفن نمی‌دهد.** شماره‌ها فقط در
> `src/data/shops.ts` فرانت‌اند هستند (۷۵۷ کلید، کلید = نام مرکز).
> دکمهٔ «تماس» فقط از لایهٔ غنی‌سازی کار می‌کند، نه از دیتابیس.


---

## ۶. نیازمندی‌های کارکردی

### ۶.۱ کاتالوگ جغرافیایی

**FR-1.1** جستجوی شعاعی روی سه نوع آگهی با `lat, lng` و شعاع.

**FR-1.2** تنها اندپوینت‌های شعاعی که واقعاً کار می‌کنند:

| اندپوینت | پارامتر فاصله | پیش‌فرض | سقف ردیف |
|---|---|---|---|
| `/api/stores/nearby` | `max_distance` | ۵۰۰۰ متر | `limit` پیش‌فرض ۱۵۰، حداکثر **۲۰۰۰** |
| `/api/products/nearby` | `max_distance` | ۵۰۰۰ متر | `limit` پیش‌فرض ۱۲۰، حداکثر **۱۰۰۰** |
| `/api/pets` (شعاعی) | `radius` | الزامی | **هیچ سقفی ندارد** |

**FR-1.3** واحد فاصله **متر** است، نه کیلومتر و نه درجه. SQL:

```sql
WHERE ST_DWithin(location::geography,
                 ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography, %s)
ORDER BY ST_Distance(location::geography, ...) AS distance_m
```

`::geography` تعیین‌کننده است: روی spheroid WGS84 اندازه می‌گیرد و واحدش
متر است. **اثر جانبی:** این cast باعث می‌شود ایندکس GiST روی ستون
geometry استفاده **نشود** — کوئری یک scan با محاسبهٔ spheroidal است.
همین دلیل نرخ‌محدودی روی این اندپوینت‌هاست.

**FR-1.4** `lat` اول، `lng` دوم در `ST_MakePoint`. خواندن با
`ST_Y → lat` و `ST_X → lng`.

**FR-1.5** `/api/pets` اگر بعضی از سه پارامتر بیاید و بعضی نه → `400`
`lat, lng and radius must be provided together`.

**FR-1.6** `/api/products` **بازنشسته** است: `410 Gone` با
`این فهرست بازنشسته شده است؛ از /api/shop/products استفاده کنید`.
۷۸۲ ردیف عمداً در جدول مانده (هزینهٔ صفر، شاید واردات آینده) ولی سرو
نمی‌شود. `410` نه `404`: مسیر وجود داشت و کار می‌کرد.

**FR-1.7** فیلتر متنی **سمت سرور وجود ندارد**. پارامتر `q` که فرانت
می‌فرستد نادیده گرفته می‌شود — نه خطا، نه فیلتر.

> **سنجش زنده:** `/api/stores/nearby?...&q=دامپزشکی` → **۴۴۷ ردیف**،
> که ۱۹۹ تا کلمهٔ جستجو را در نام ندارند. جستجو تماماً در
> `src/lib/search.ts` روی کلاینت انجام می‌شود.

**FR-1.8** فیلتر کلاینت (`applyFilters`) به این ترتیب اعمال می‌شود:
فاصله → نوع → گونه → دسته → بازهٔ قیمت → کلیدواژه. سپس مرتب‌سازی.

**FR-1.9** انتخاب دستهٔ محصول/مرکز، **حیوانات را کاملاً حذف می‌کند**:

```ts
if (filters.categories.length > 0) {
  if (item.kind === 'pet') return false
  ...
}
```
دلیل: چیپ «غذای گربه» نباید یک گربهٔ فروشی نشان بدهد.

**FR-1.10** مرتب‌سازی قیمت، مراکز را آخر می‌برد (`POSITIVE_INFINITY`)
چون قیمت ندارند.

**FR-1.11** کلیدواژه روی سطح قابل‌جستجوی هر نوع:

```
pet     → name + breed + species + description
product → name + brand + category + storeName + description
store   → name + storeLabel(category) + address + categories[]
```

شاخهٔ store صریح نوشته شده چون `item.category` کد است («vet») و
بازدیدکننده «دامپزشکی» می‌زند. برچسب فارسی + فهرست `categories` جای
`description` تولیدشده را می‌گیرند.

### ۶.۲ نقشه

| شناسه | نیازمندی | مبنا |
|---|---|---|
| FR-2.1 | پین‌ها فقط در ویوپورت رندر شوند | ✅ |
| FR-2.2 | خوشه‌بندی با اندازهٔ سلولی که در زوم بالا پین‌ها را جدا کند | ✅ |
| FR-2.3 | پین‌ها با کیبورد قابل دسترسی باشند | ✅ `map_audit` |
| FR-2.4 | نقطهٔ مبدأ برچسب دسترسی‌پذیر داشته باشد | ✅ |

### ۶.۳ احراز هویت

**FR-3.1** ثبت‌نام با نام کاربری/رمز — `POST /api/auth/register`، پاسخ **200** (نه 201).

| فیلد | قید |
|---|---|
| `username` | ۳–۲۴ · `^[a-zA-Z0-9_]+$` |
| `password` | ۸–۱۲۸ |
| `display_name` | ≤۶۰ · پیش‌فرض = نام کاربری |
| `email` | ≤۱۶۰ · اختیاری |

اعتبارسنجی ایمیل **فقط** این است: `@` دارد، نه اول و نه آخر. هیچ چیز دیگری.

**FR-3.2** ورود — `POST /api/auth/login`. **هیچ قید طولی روی ورودی نیست.**
رشتهٔ خالی به 401 می‌رسد، نه 422.

**FR-3.3** پیام یکسان برای کاربر ناموجود و رمز غلط:
`نام کاربری یا رمز عبور اشتباه است` — تست، برابری بایتی دو رشته را می‌سنجد.

**FR-3.4** نشست: `secrets.token_urlsafe(32)` — ۲۵۶ بیت. فقط `sha256` ذخیره
می‌شود. عمر **۳۰ روز**. `expires_at > now()` با ساعت دیتابیس.

**FR-3.5** توکن فقط از `Authorization: Bearer <token>`. هیچ کوکی، هیچ
پارامتر query.

**FR-3.6** دو پیام 401 متمایز:
- بدون هدر → `برای این کار باید وارد شوید`
- نامعتبر/منقضی/غیرفعال → `نشست شما معتبر نیست؛ دوباره وارد شوید`

عمداً «منقضی» نمی‌گوید، چون آن به حدس‌زننده می‌گوید نشست‌ها وجود دارند.

**FR-3.7** `is_active = false` همهٔ نشست‌های موجود را در درخواست بعدی باطل می‌کند.

**FR-3.8** `/change-password` همهٔ نشست‌ها **به‌جز نشست خودِ تماس‌گیرنده** را
حذف می‌کند. دلیل: گوشی بازِ قرض‌داده‌شده نباید بتواند صاحب را قفل کند،
ولی تغییر رمز باید دسترسی را همه‌جا ببندد.

**FR-3.9** `/recover` همهٔ نشست‌های کاربر را حذف می‌کند.

**FR-3.10** بازیابی — `POST /api/auth/recover`. **شاخهٔ ایمیل وجود ندارد.**
فقط تلفن.

شرط کامل (هر چهار لازم):
```python
via_phone = bool(
    user and given_phone and user.get('phone')
    and user.get('phone_verified_at')
    and hmac.compare_digest(user['phone'], given_phone))
```

`phone_verified_at` همان چیزی است که تلفن را مدرک می‌کند — داشتن شماره
در ردیف کافی نیست.

**FR-3.11** پاسخ بازیابی در **همهٔ** شاخه‌ها یکسان است:

```json
{"ok": true, "username": "<آنچه تایپ شد>", "message":
 "اگر این شماره در پازمارکت ثبت شده باشد، رمز تازه با پیامک ارسال شد."}
```

سه نشت شمارش که در تاریخ ثبت شده و بسته شد:
1. شاخهٔ شکست دو کلید برمی‌گرداند و موفقیت پنج کلید
2. موفقیت `user['username']` را برمی‌گرداند و شکست ورودی تایپ‌شده را —
   «جواب با ورودی من فرق دارد» خودش سیگنال بود
3. `sent_to_phone` حذف شد چون حضورش سیگنال بود

**FR-3.12** رمز موقت: سه گروه چهارنویسه با خط تیره، الفبای ۳۱ نویسه
(`0/O/1/l/I` حذف شده تا رمز خوانده‌شده از صفحه غلط نشود). ≈۶۰ بیت.

**FR-3.13** `[شکاف]` `TEMP_PASSWORD_MINUTES = 30` تعریف شده و **هیچ‌جا
اجرا نمی‌شود**. رمز بازیابی‌شده تا ابد معتبر می‌ماند تا عوض شود.

**FR-3.14** `[شکاف]` `_recover_with_temp_password` کد مرده است و هنوز
`temp_password` برمی‌گرداند. اگر دوباره وصل شود، شکل پاسخ را می‌شکند.

### ۶.۴ OTP

**FR-4.1** نرمال‌سازی شماره، سمت سرور:

1. ارقام فارسی `۰-۹` و عربی `٠-٩` → ASCII
2. حذف `[\s\-().]` در هر جای رشته
3. `+98` → `0` · `0098` → `0` · `98` با طول ۱۲ → `0` + ۱۰ رقم آخر ·
   `9XXXXXXXXX` → `0` پیشوند
4. باید `^09\d{9}$` را کامل تطبیق دهد

خط زمینی عمداً رد می‌شود: کد ورود پیامکی به خط ثابت بی‌معنی است.

**FR-4.2** ثابت‌ها:

```
OTP_TTL_SECONDS   = 120
OTP_MAX_ATTEMPTS  = 5
OTP_LENGTH        = 6
OTP_PER_PHONE     = 3   (در accounts.py)
```

TTL دو دقیقه، نه پنج: کد کوتاه‌تر امن‌تر است و دو دقیقه برای تایپ کافی است.

**FR-4.3** کد با `secrets.randbelow(10)` ساخته می‌شود، نه `random` — چون
`random` از خروجی‌های قبلی قابل پیش‌بینی است. ۱۰⁶ ≈ ۱۹٫۹۳ بیت.

**FR-4.4** ذخیره:
- همهٔ کدهای زندهٔ همان `(phone, purpose)` اول `consumed_at = now()` می‌شوند
- سپس INSERT با `code_hash = hash_password(code)` — همان PBKDF2 رمز عبور
- کد خام فقط از `store_code` بیرون می‌آید و **فقط** به `request_code`

**FR-4.5** `request_code(...) -> None`. عمداً چیزی برنمی‌گرداند.

> کامنت: نسخهٔ قبلی کد را برمی‌گرداند، که روتر را مجبور می‌کرد آن را
> نگه دارد — و هر جا کد نگه داشته شود، جایی است که می‌تواند به لاگ یا
> پاسخ HTTP برسد.

**FR-4.6** کد با **PBKDF2-HMAC-SHA256** هش می‌شود، نه متن ساده.

> **سنجش زنده در دیتابیس:** `code_hash` پیشوند `pbkdf2_sha256$` دارد،
> طول ۹۰. تنها ردیف موجود، `consumed_at` دارد.

**FR-4.7** هفت لایه که کد را از لاگ بیرون نگه می‌دارد:

1. دیتابیس فقط هش دارد
2. `request_code` هیچ برنمی‌گرداند
3. پیش‌فرض provider `null` است، نه `console`
4. `ConsoleProvider` در تولید **ساخت نمی‌شود** — raise می‌کند
5. `ENV` ناشناخته = تولید (جهت امن)
6. Kavenegar فقط HTTP status و پیام provider را لاگ می‌کند
7. پاسخ HTTP هرگز کد ندارد

**FR-4.8** `[باقی‌مانده]` Kavenegar کد را در **query string** می‌فرستد و کلید
API را در **مسیر URL**. هر access log روی پای خروجی، کد را می‌بیند.

**FR-4.9** `[باقی‌مانده]` لاگ کنسول در توسعه کد واقعی را دارد — عمدی.

**FR-4.10** تأیید، `POST /api/auth/otp/verify`:

| فیلد | قید |
|---|---|
| `phone` | ۱–۳۲ |
| `code` | ۴–۸ |
| `purpose` | `^(signup\|login\|recover)$` |
| `display_name` | ≤۶۰ |

**FR-4.11** `code.isdigit()` قبل از مصرف تلاش بررسی می‌شود — `"abcdef"` و
`"1 2 3 4"` یک تلاش هم نمی‌سوزانند.

**FR-4.12** هر شکست — غلط، منقضی، ناموجود — یک پیام: `کد نادرست یا منقضی است`.

**FR-4.13** شمارندهٔ تلاش **در دیتابیس** است، نه حافظه. دلیل: شمارندهٔ
درون‌فرآیندی با ری‌استارت صفر می‌شود و کد ۶ رقمی فقط ۱۰⁶ حالت دارد.

**FR-4.14** `[باقی‌مانده]` افزایش تلاش اتمیک نیست (`SELECT` سپس
`UPDATE attempts + 1`). یک انفجار موازی می‌تواند کمی از پنج رد شود.
سقف بیرونی ۲۰ در ۳۰۰ ثانیه است.

**FR-4.15** `purpose='recover'` در اسکیما پذیرفته می‌شود و **هرگز موفق
نمی‌شود** — هیچ مسیری کد `recover` نمی‌سازد. اثر باقی‌مانده.

**FR-4.16** عدم شمارش — `/otp/request` بدنه و وضعیت یکسان برمی‌گرداند برای:
ثبت‌نام روی شمارهٔ موجود (بدون SMS)، ورود روی شمارهٔ ناشناس (بدون SMS)،
و هر درخواست پذیرفته‌شده که SMS می‌فرستد.

پیام: `اگر این شماره معتبر باشد، کد تا لحظاتی می‌رسد.`

**FR-4.17** `[باقی‌مانده]` بدنه یکسان است، **تأخیر یکسان نیست**: فقط شاخهٔ
«بفرست» تماس شبکه‌ای می‌زند (timeout 10 ثانیه).

**FR-4.18** `purge_expired()` وجود دارد و **هیچ‌جا زمان‌بندی نشده**. بدون
آن، جدول با هر ورود یک ردیف رشد می‌کند.

### ۶.۵ نام کاربری

**FR-5.1** دو قاعدهٔ متفاوت در دو لحظهٔ متفاوت:

| لحظه | قاعده |
|---|---|
| ثبت‌نام | ۳–۲۴ · `^[a-zA-Z0-9_]+$` — فارسی **ممکن نیست** |
| انتخاب بعدی | ۳–۳۰ · لاتین **یا** فارسی |

**FR-5.2** قاعدهٔ فارسی، دقیق:

```python
_LATIN_USERNAME   = re.compile(r'[A-Za-z0-9_]{3,30}')
_PERSIAN_USERNAME = re.compile(r'[ء-غف-يپچژکگی۰-۹‌]{3,30}')
```

با `.fullmatch`. معتبر اگر **یکی** تطبیق دهد. بازه‌ها عمدی‌اند:

- `ء-غ` و `ف-ي` بلوک عربی را **دور U+0640 کشیده** جدا می‌کنند تا «محـــمد»
  به‌جای «محمد» رد نشود
- حروف فارسی `پ چ ژ ک گ ی`
- ارقام فارسی `۰-۹` — bidi class AN، پس در متن RTL ترتیب خواندن را
  به‌هم نمی‌زنند
- **ZWNJ** `U+200C` — برای «پت‌آرا»

**FR-5.3** **خط مخلوط رد می‌شود.** `علی92` و `ali_علی` هر دو `format`.
دلیل: `@علی92` در خط RTL بازآرایی می‌شود و هر جا `@{username}` چاپ شود
bidi isolation می‌خواهد.

**FR-5.4** نام‌های رزرو، مقایسه با `lower()`:

```
admin administrator root support pawsmarket api me shop cart login
register official moderator
مدیر مدیرکل پشتیبانی راهنما ادمین مرکزی فروشگاه حساب ورود ثبت‌نام
```

معادل‌های فارسی عمداً هستند: وگرنه «مدیر» و «پشتیبانی» آزاد می‌ماندند
در حالی که `admin` و `support` نبودند.

**FR-5.5** بررسی زنده و نوشتن، **یک تابع** را صدا می‌زنند (`_username_problem`).
دلیل ثبت‌شده: فرم یک‌بار تیک سبز برای نامی زد که سرور بعداً رد کرد، چون
دو نسخهٔ جدا از قاعده داشتند.

**FR-5.6** تغییر نام کاربری فقط یک‌بار. اگر نام با `user_` شروع نشود → `409`
`نام کاربری یک بار انتخاب شده و قابل تغییر نیست`.

**FR-5.7** `display_name` فقط وقتی دنبال نام جدید می‌آید که **هنوز** برابر
نام قدیمی بوده باشد.

**FR-5.8** نام تولیدشده از تلفن: `user_{phone}`، و اگر گرفته باشد
`_2` تا `_99`، وگرنه `503`.

### ۶.۶ نرخ‌محدودی

**FR-6.1** پیاده‌سازی دست‌نویس است، بدون کتابخانه. تنها وابستگی اختیاری
کلاینت `redis` است.

**FR-6.2** دو پشتیبان با **معنای پنجرهٔ متفاوت**:

| پشتیبان | نوع پنجره | رد شدن |
|---|---|---|
| حافظه (پیش‌فرض) | **sliding** — فهرست زمان‌ها | timestamp اضافه نمی‌کند |
| Redis | **fixed** — `INCR` + `EXPIRE` | شمارش شده ولی TTL بازنشانی نمی‌شود |

**FR-6.3** بودجه‌ها، دقیق:

| action | حد | پنجره |
|---|---:|---:|
| `browse` | ۲۴۰ | ۶۰s |
| `auth` | ۳۰ | ۶۰s |
| `nearby` | ۳۰ | ۶۰s |
| `assistant` | ۱۲۰ | ۶۰s |
| `social` | ۶۰ | ۶۰s |
| `cart` | ۶۰ | ۶۰s |
| `payment_callback` | ۶۰ | ۶۰s |
| `booking_decision` | ۴۰ | ۶۰۰s |
| `login` | ۲۰ | ۶۰s |
| `otp_verify` | ۲۰ | ۳۰۰s |
| `payment` | ۱۵ | ۶۰۰s |
| `booking` | ۱۲ | ۶۰۰s |
| `register` | ۱۰ | ۳۰۰s |
| `listing` | ۱۰ | ۳۰۰s |
| `checkout` | ۱۰ | ۶۰۰s |
| `otp_request` | ۱۰ | ۳۰۰s |
| `recover` | ۸ | ۳۶۰۰s |
| `admin_door` | ۶ | ۶۰s |
| `media` | ۳۰ | ۳۰۰s |

ناشناخته → `social` (۶۰/۶۰). `payment` تعریف شده و **هرگز استفاده نمی‌شود**.

**FR-6.4** سه معنای «اشتراکی» که همه در کد هستند:

1. **اشتراک بین workerها** — بدون `REDIS_URL`، هر worker بودجهٔ خودش را دارد
2. **per-IP و per-subject** — با `subject`، **هر دو** مستقل اجرا می‌شوند
3. **اشتراک بین نام‌ها** — `_BUCKET_ALIAS` وجود دارد و **خالی** است

**FR-6.5** هر رد شدن: `429` + `Retry-After` که **زمان باقی‌مانده** را می‌دهد،
نه طول پنجره.

**FR-6.6** `TRUST_PROXY=1` یعنی `X-Forwarded-For` **آخرین** hop خوانده شود.
nginx با `$proxy_add_x_forwarded_for` همتای واقعی را به چیزی که کلاینت
فرستاد **اضافه** می‌کند، پس `[0]` در کنترل مهاجم است.

**FR-6.7** override با `RATE_LIMIT_<ACTION>`، قالب `N` یا `N:window`.

**FR-6.8 `[شکاف]`** اندپوینت‌های نوشتن **همه** محدود نیستند. بدون هیچ محدودیتی:

```
POST /api/pets                    ← ساخت حیوان بدون احراز هویت
PUT/DELETE /api/products/{id}
همهٔ نوشتن‌های profiles.py
همهٔ نوشتن‌های follows.py (فالو، پست)
like/unlike
adoption decision
booking cancel
admin reply / admin status
```

**FR-6.9** Redis در این استقرار **واقعاً وصل است** — سنجیده:

```
redis module imported: True
_redis client: SET
```

**FR-6.10** `[تناقض]` کامنت compose می‌گوید «عمداً یک worker» چون باکت‌ها
در حافظه‌اند. ولی `REDIS_URL` تنظیم است و Redis وصل است. کامنت برای
زمانی نوشته شده که `redis` در `requirements.txt` نبود و مسیر Redis
**هرگز اجرا نشده بود**. کد می‌گوید: «مسیری که reachable نیست fallback
نیست، کامنت است.»

### ۶.۷ نوبت‌دهی

**FR-7.1** وضعیت‌ها (CHECK در دیتابیس):
```
pending | confirmed | declined | cancelled | done
```

**FR-7.2** جدول کامل گذار:

| از | به | چه کسی | گارد |
|---|---|---|---|
| — | `pending` | مشتری (حتی مهمان) | مرکز موجود، دستهٔ خدماتی، زمان و تلفن معتبر |
| `pending` | `cancelled` | مالک وارد‌شده | `id AND user_id AND status='pending'` |
| `pending` | `confirmed` | دارندهٔ manage token | `manage_hash AND status='pending'` |
| `pending` | `declined` | دارندهٔ manage token | همان |
| `pending` | `confirmed` | دارندهٔ داشبورد توکن | `id AND store_id AND status='pending'` |
| `pending` | `declined` | دارندهٔ داشبورد توکن | همان |
| `*` | `done` | **هیچ اندپوینتی** | — |

**FR-7.3** `confirmed`, `declined`, `cancelled` **پایانه‌اند**. تصمیم دوم
→ `409`. لغو پس از تصمیم → `404`. بازگشایی، جابه‌جایی زمان، و no-show
وجود ندارد.

**FR-7.4** **`done` از HTTP دستیافتنی نیست.** در CHECK، در فهرست وضعیت‌ها،
و در ویو `store_booking_stats` هست، ولی هیچ روتری آن را نمی‌نویسد.
فقط با SQL بیرونی.

**FR-7.5** **هیچ اندپوینت ادمین برای نوبت وجود ندارد.** ادمین می‌تواند
مراکز را فهرست کند و توکن بسازد، ولی نمی‌تواند تأیید/رد/لغو کند.

**FR-7.6** اعتبارسنجی درخواست:

| فیلد | قید |
|---|---|
| `store_id` | ≥۱ |
| `service` | ۲–۸۰ |
| `preferred_at` | **رشتهٔ** ۱۰–۴۰ نویسه |
| `window_minutes` | پیش‌فرض ۶۰ · ۱۵–۴۸۰ |
| `note` | ≤۵۰۰ |
| `contact_name` | ۲–۶۰ |
| `contact_phone` | ۸–۲۴ |
| `pet_id` | ≥۱ · اختیاری |

> `preferred_at` عمداً **رشته** است، نه `datetime`: تا خطای 422 فارسی
> بماند و به انگلیسی Pydantic نیفتد.

**FR-7.7** زمان:
- `Z` پایانی → `+00:00` · `fromisoformat`
- زمان **naive** به‌عنوان تهران تفسیر می‌شود (`+03:30`) و **UTC** ذخیره می‌شود
- بیش از **۳۰ دقیقه در گذشته** → رد
- بیش از **۶۰ روز آینده** → رد
- ساعت محلی تهران بیرون از `7 ≤ h < 23` → رد

> این‌ها کران بیرونی‌اند، نه ساعت کاری: «کلینیکی که ۲۰:۰۰ می‌بندد نباید
> درخواست ۲۳:۰۰ بگیرد که فقط می‌تواند ردش کند.»

**FR-7.8** تلفن: رقم‌ها جدا، `98…`→`0…`، `9`+۹ رقم → `0…`، سپس باید
`09\d{9}` (موبایل) یا `0[1-8]\d{9}` (ثابت) باشد.

> دلیل ثبت‌شده: `«00000000»` از بررسی طولی قدیم رد می‌شد و نوبتی می‌ساخت
> که هیچ‌کس نمی‌توانست انجام دهد، در حالی که مشتری فکر می‌کرد فرستاده شده.

**FR-7.9** `pet_id` اگر داده شود: ورود لازم (`401`) و مالکیت لازم (`403`).

**FR-7.10** دو توکن، دو دامنهٔ متفاوت:

| | **manage token** | **داشبورد توکن** |
|---|---|---|
| ستون | `bookings.manage_hash UNIQUE` | `stores.dashboard_hash UNIQUE` |
| تولید | `token_urlsafe(24)` — ۱۹۲ بیت | `token_urlsafe(32)` — ۲۵۶ بیت |
| ذخیره | `sha256` هگز | `sha256` هگز |
| به چه کسی | مشتری، یک‌بار، در پاسخ ساخت | اپراتور، یک‌بار، در `url` |
| چه می‌دهد | **یک** نوبت + تأیید/رد آن | **همهٔ** نوبت‌های مرکز + تقویم هفتگی |
| انقضا | **هیچ** | **هیچ** |
| ابطال | هیچ راهی نیست | بازنویسی `dashboard_hash` |

**FR-7.11** جلوگیری از نشت — **یک** شکل‌دهنده وجود دارد:
`_public_booking(row, include_secret=False)`. فقط **یک** فراخوانی با
`True` هست: اندپوینت ساخت. هیچ SQL فهرستی `manage_hash` را select نمی‌کند.

**FR-7.12** `[تناقض]` پیام 404 روی `/api/bookings/manage/{token}` می‌گوید
`این لینک معتبر نیست یا منقضی شده` — ولی **هیچ مکانیزم انقضایی وجود
ندارد**. همین‌طور مهاجرت `0011` توکن داشبورد را «قابل ابطال» می‌خواند،
که فقط به معنای بازنویسی درست است و برای manage token اصلاً درست نیست.

**FR-7.13** داشبورد: فهرست با `preferred_at ASC LIMIT 200`. فیلتر وضعیت
با فهرست سفید؛ هر چیز دیگر → `pending`.

**FR-7.14** شمارش‌ها از ویو `store_booking_stats`:
`pending, confirmed, done, today, total, last_request`. اگر مرکز نوبتی
نداشته باشد، همه صفر.

**FR-7.15** تقویم هفتگی به **شنبه‌ای** می‌چسبد که هفتهٔ ایرانی را شروع می‌کند:
```python
offset = (day.weekday() + 2) % 7
week_start = day - offset
```
همهٔ وضعیت‌ها شامل‌اند — نوبت لغوشده هم اسلاتی را اشغال می‌کند که کلینیک
باید آزادشده ببیند. `LIMIT 500`.

**FR-7.16** «امروز» در SQL محاسبه می‌شود:
```sql
(now() AT TIME ZONE 'Asia/Tehran')::date
```
دلیل: ساعت کانتینر UTC است و ساعت ۰۱:۰۰ محلی، تاریخ UTC هنوز دیروز است.

**FR-7.17** `[شکاف]` `declined` و `cancelled` در ویو شمارش **نمی‌شوند**
(فقط `pending, confirmed, done, today, total`)، هرچند با `?status=`
فهرست‌شدنی‌اند.

### ۶.۸ قیمت‌گذاری

**FR-8.1** پله‌ها، دقیق:

```python
MARGIN_TIERS = [
    {'below':    200_000, 'pct': 15.0},
    {'below':  2_000_000, 'pct': 10.0},
    {'below': 10_000_000, 'pct':  6.0},
    {'below':        None, 'pct':  3.0},
]
MARGIN_FLOOR_TOMAN = 10_000
```

`below` **کران بالای انحصاری** است.

| قیمت (تومان) | پله | درصد |
|---|---|---|
| ۰ – ۱۹۹٬۹۹۹ | ۱ | ۱۵ |
| ۲۰۰٬۰۰۰ – ۱٬۹۹۹٬۹۹۹ | ۲ | ۱۰ |
| ۲٬۰۰۰٬۰۰۰ – ۹٬۹۹۹٬۹۹۹ | ۳ | ۶ |
| ≥ ۱۰٬۰۰۰٬۰۰۰ | ۴ | ۳ |

**FR-8.2** محاسبهٔ دقیق:

```python
from_pct = int(cost * pct / 100)        # برش، نه گرد کردن
toman    = max(from_pct, 10_000)        # کف ثابت
our_price = cost + toman
```

- منفی → ۰ (`max(0, int(...))`)
- `int()` **برش** می‌دهد. هیچ `round()`، هیچ نیم‌به‌بالا، هیچ بانکر.
- `pct` برگشتی همیشه نرخ **پلهٔ خودش** است، حتی وقتی کف اعمال شده —
  «مدیری که ردیف را می‌خواند باید ببیند کدام قاعده اجرا شد»

**FR-8.3** `margin_toman` و `margin_pct` **هر دو** در
`marketplace_products` ذخیره می‌شوند — تصمیم بعد از واقع قابل حسابرسی
است، نه استنتاجی.

**FR-8.4** تنها تومان کامل. `payments.request_amount` عدد صحیح است، پس
گرد کردن یک‌بار و آشکارا اینجا انجام می‌شود.

**FR-8.5** `our_price > cost` همیشه. تست روی ۱ / ۹۹۹ / ۵۰٬۰۰۰ / ۷٬۷۷۷٬۷۷۷
می‌سنجد.

**FR-8.6** قیمت ناموجود → `in_stock = False`، **نه** قیمت صفر.
- Torob: غیرعددی → `cost = 0` → `in_stock = cost > 0`
- Digikala: غیرعددی → `rial = 0` → `in_stock = toman >= 10_000`

**FR-8.7** صفر از `cheapest_offer` حذف می‌شود — **دو بار**: یک‌بار با
`not in_stock`، یک‌بار با `cost_price <= 0`.

> دلیل: ترب ردیف فروشنده با قیمت ۰ برمی‌گرداند یعنی «این فروشگاه ندارد».
> «صفر کم‌ترین عدد جدول است و کم‌قابل‌خریدترین.»

**FR-8.8** اگر صفر به سینک برسد، `_price_product` محصول موجود را
**غیرفعال** می‌کند، نه اینکه با کف ۱۰٬۰۰۰ قیمت بدهد.

**FR-8.9** **هیچ انقضای زمانی وجود ندارد.** `offers.fetched_at` فقط
ثبت می‌کند قیمت کِی دیده شد. هدف طراحی، صریح:

> «منبع مرده یعنی «قیمت دیروز را نگه دار» نه حذف محصول. افتادن یک منبع
> نباید مغازه را خالی کند.»

مشتری ممکن است قیمت کهنه ببیند، بدون TTL و بدون آستانهٔ «آخرین
به‌روزرسانی».

**FR-8.10** **`pinned`** یعنی «به این ردیف دست نزن». در سه جا اثر دارد:

1. محصول موجود و `pinned` → شمارش `products_pinned`، **بدون نوشتن**
2. مسیر غیرفعال‌سازی، `AND p.pinned = false` دارد
3. محصول جدید همیشه `pinned = false`

> مهاجرت `0010`: «قیمتی که ادمین با دست گذاشته. سینک به آن دست نمی‌زند:
> وگرنه هر اجرای روزانه بی‌صدا یک تصمیم عمدی را برمی‌گرداند و تنها راه
> فهمیدنش این است که مشتری قیمت دیروز را ببیند.»

### ۶.۹ همگام‌سازی قیمت

**FR-9.1** روزانه. `sync_cli.py` خودش را «نقطهٔ ورود cron» می‌خواند.

**FR-9.2** **دو زمان‌بند وجود دارد** — یک systemd timer و یک Cloudflare
worker که `POST /api/admin/sync` می‌زند. پس همپوشانی «مسئلهٔ کِی است،
نه آیا».

**FR-9.3** قفل: `pg_try_advisory_lock(hashtext('pawsmarket:catalog-sync'))`.
**غیرمسدودکننده.** فراخوان دوم `{'skipped': 'already-running', ...}` تمام‌صفر
می‌گیرد.

> دلیل: دو اجرای همپوشان آفرها را خراب نمی‌کنند (UPSERT اتمیک است) ولی
> می‌توانند قیمت را با یک fetch قدیمی‌تر که دیرتر رسیده بازنویسی کنند.

**FR-9.4** ده کوئری پیش‌فرض:
`غذای خشک سگ` · `غذای خشک گربه` · `غذای تر گربه` · `تشویقی سگ` ·
`قلاده سگ` · `اسباب بازی گربه` · `شامپو سگ` · `خاک گربه` ·
`ظرف آب گربه` · `قفس پرنده`

**FR-9.5** دو منبع، و **هر دو در این تاریخ فعال‌اند**:

```
torob     → TorobMcpSource     enabled = bool(TOROB_MCP_URL)
digikala  → DigikalaMcpSource  enabled = DIGIKALA_MCP != '0'
```

`TorobSource` مستقیم `enabled = False` دارد: `api.torob.com` از هر IP
دیتاسنتر HTTP 490 با چالش arcaptcha می‌دهد.

**FR-9.6** `[تصحیح مهم نسبت به اسناد قبلی]` اسناد
`PROJECT-STATUS-2026-10-24` و `REVIEW-*` می‌گویند «ترب مسدود است
(`torob:disabled`)». **این منقضی شده است.**

اجرای واقعی در این تاریخ:
```json
{"queries": 20, "offers_seen": 60, "offers_written": 60,
 "products_created": 0, "products_repriced": 0,
 "products_deactivated": 0, "products_pinned": 0,
 "sources_failed": []}
```

صفر منبع شکست‌خورده. علت تناقض: آخرین سینکِ ثبت‌شده ساعت ۱۳:۲۸ UTC
بود ولی کانتینر ساعت ۱۳:۴۸ ری‌استارت شد — سینک با نمونه‌ای اجرا شد که
`TOROB_MCP_URL` نداشت.

**FR-9.7** `sources_failed` فهرستی از رشته‌هاست، در دو حالت:

1. `f'{slug}:disabled'` — کامنت اصرار دارد که گزارش شود
2. `f'{slug}:{query}'` — `search()` خالی برگرداند

> ابهام پذیرفته‌شده در کد: «یا چیزی تطبیق نداد یا منبع افتاده. هر دو یعنی
> «آنچه داریم را نگه دار».»

**FR-9.8** `[شکاف]` **هیچ مرز تراکنشی وجود ندارد.**

`db.py` اتصال‌ها را با `autocommit = True` باز می‌کند و `run_query` هر
دستور را تراکنش جدا می‌فرستد. `catalog_sync` هرگز `transaction()` را
صدا نمی‌زند.

پیامدها:
- کرش وسط اجرا کاتالوگ را **نیمه‌به‌روز** می‌گذارد. rollback نیست.
- ردیف `sync_runs` **در پایان** نوشته می‌شود، پس کرش **هیچ چیزی ثبت
  نمی‌کند** — شکست در جدول حسابرسی نامرئی است.
- تسکین، همگرایی با idempotency است نه اتمیک‌بودن.

**FR-9.9** `[شکاف]` `products_deactivated` و `products_pinned` در stats
برگردانده می‌شوند ولی **ستونی برایشان وجود ندارد** — ذخیره نمی‌شوند.

**FR-9.10** `[تناقض]` `test_marketplace_products_have_a_live_offer` می‌گوید
هر محصول فعال باید آفر `in_stock` با `cost_price > 0` داشته باشد. ولی
غیرفعال‌سازیِ سینک `AND p.pinned = false` دارد. پس یک محصول **pinned و
فعال** که آفرش ناموجود شود، فعال می‌ماند و این تست را می‌شکند.

**FR-9.11** کد خروج CLI:

```
0  اجرا شد، حداقل یک منبع آفر داد   (dry-run همیشه ۰)
1  اجرا شد، همهٔ منابع افتادند یا خاموش بودند
2  کرش
```

> «کاری که با کد ۰ خارج شود ولی چیزی تازه نکرده باشد، همان شکستی است که
> کل این فایل برای جلوگیری از آن وجود دارد: قیمت‌ها بی‌صدا کهنه می‌شوند
> و هیچ‌کس نمی‌فهمد تا مشتری قیمت دیروز را بپردازد.»

**FR-9.12** `[باقی‌مانده]` کلید API سینک `ADMIN_CATALOG_KEY` است و در این
استقرار **تنظیم نشده**. یعنی `POST /api/admin/sync` برای همه 404 می‌دهد.
سینک فقط از طریق systemd timer یا worker اجرا می‌شود.

### ۶.۱۰ فروشگاه و سبد

**FR-10.1** یکتایی `(user_id, product_id)`. افزودن دوباره، تعداد را
زیاد می‌کند، ردیف جدید نمی‌سازد.

**FR-10.2** `MAX_QTY_PER_ITEM = 20`، هم در Pydantic و هم در SQL:
```sql
SET qty = LEAST(cart_items.qty + EXCLUDED.qty, 20)
```

**FR-10.3** `unit_price` هنگام افزودن ثبت می‌شود و **هرگز بازنشانی
نمی‌شود**. `price_when_added` دائماً قیمت اولیه را نگه می‌دارد.

**FR-10.4** `GET /api/shop/cart` برمی‌گرداند:
- `unit_price` = **قیمت فعلی**
- `price_when_added` = ذخیره‌شده
- `price_changed` = نابرابری
- `total_toman` از **قیمت فعلی**

پس جمع سبد همیشه «چیزی که checkout می‌گیرد» است، نه آنچه مشتری اول دید.

**FR-10.5** `PATCH /api/shop/cart/{item_id}` با `item_id` غلط، **بی‌صدا
هیچ‌کاری نمی‌کند**. همین برای DELETE.

### ۶.۱۱ پرداخت

**FR-11.1** checkout، گام به گام:

1. `rate_limit('checkout')` — ۱۰ در ۶۰۰ ثانیه
2. **قفل مشورتی**: `pg_advisory_lock(hashtext('checkout:{user_id}'))`
3. سبد خالی → `422 سبد خرید خالی است`
4. محصول غیرفعال → `409 این محصولات دیگر موجود نیستند: …`
5. قیمت عوض‌شده → `409 قیمت این محصولات تغییر کرده است؛ صفحه را تازه کنید: …`
6. `total = Σ int(our_price) × int(qty)`
7. INSERT `orders` با `status='pending'`
8. هر ردیف: INSERT `order_items` با `offer_id` که **در لحظهٔ سفارش**
   resolve می‌شود — «ارزان‌ترین آفر امروز ممکن است تا وقتی سفارش را
   ثبت می‌کنیم رفته باشد»
9. **حذف سبد همین‌جا**، نه در callback
10. `get_gateway()` · `PaymentError` → `503`
11. `INSERT payments` با `amount_toman = total` و `request_amount` عیناً
    آنچه آداپتور فرستاد
12. برگرداندن `{order_id, total_toman, gateway, redirect_url}`

> **گام ۹ — چرا:** با پاک‌کردن فقط در callback، سبد تمام مدت حضور در
> صفحهٔ درگاه زنده می‌ماند و یک ارسال دوباره **سفارش دوم** می‌ساخت.
> اندازه‌گیری: «دو سفارش، ۵۰ میلی‌ثانیه فاصله، از یک سبد تک‌قلمی.»

> **گام ۲ — چرا:** در ۲۰۲۶-۱۰-۲۱ دو درخواست همزمان همان سبد تک‌قلمی را
> خواندند و هر دو سفارش نوشتند. `run_query` autocommit است و هیچ‌چیز
> خواندن+INSERT را سریال نمی‌کرد.

**FR-11.2** **دو درگاه، دو واحد پول متفاوت.**

> زبال (Zibal) فقط **ریال** می‌گیرد؛ زرین‌پال **تومان** وقتی `currency:
> "IRT"` بگویی. فرستادن همان عدد به هر دو، یک خطای بی‌صدای ۱۰ برابری
> است در یک جهت یا جهت دیگر.

پس «هیچ عدد خامی از سیم عبور نمی‌کند» — `amount_toman` مرجع است و
**هر درگاه تبدیل خودش را در `_wire_amount` انجام می‌دهد**.

| | **Zibal** | **ZarinPal** |
|---|---|---|
| تبدیل | `toman × 10, 'IRR'` | `toman, 'IRT'` |
| درخواست | `POST /v1/request` | `POST /pg/v4/payment/request.json` |
| موفقیت | `result == 100` و `trackId` | `data.code == 100` و `authority` |
| بازگشت | `?trackId=&success=1` | `?Authority=&Status=OK` |
| تأیید | `POST /v1/verify {merchant, trackId}` | `POST /pg/v4/payment/verify.json {merchant_id, amount, authority}` |
| کد موفق | `100` یا `201` | `100` یا `101` |
| **بررسی مبلغ** | **خیر** | **بله** |

**FR-11.3** `[شکاف امنیتی]` **تأیید زبال مبلغ را بررسی نمی‌کند.**
`/v1/verify` فقط `{merchant, trackId}` می‌گیرد. یعنی اثبات می‌کند «این
trackId پرداخت شد»، نه «چقدر». فیلد `amount` که پاسخ برمی‌گرداند
**نادیده گرفته می‌شود**.

تنها دفاع مبلغ روی زبال، جفت `amount_toman` / `request_amount` است که
کنار هم ذخیره شده‌اند — یعنی **کشف بعدی**، نه جلوگیری.

**FR-11.4** `[شکاف]` **`is_sandbox()` تعریف شده و هرگز صدا زده نمی‌شود.**

```
./app/providers/payments.py:249:def is_sandbox(gateway):
```
بدون هیچ call site. docstring می‌گوید هدفش «برای اینکه سفارش واقعی ثبت
نشود» است، ولی هیچ کدی از آن نمی‌پرسد.

پیامد: با مرچنت تستی زبال، checkout یک ردیف **واقعی** در `orders` و
یک ردیف **واقعی** در `payments` می‌سازد، و callback سفارش را `paid`
می‌کند دقیقاً مثل تولید. **پرداخت سندباکس از واقعی در دیتابیس قابل
تشخیص نیست.**

**FR-11.5** `[شکاف]` `get_gateway` بررسی «تنظیم نشده» را روی **نام خام**
انجام می‌دهد، نه کلید نرمال‌شده. فراخوان با `'ZIBAL'` کلاس را از lookup
حروف‌کوچک می‌گیرد ولی بررسی مرچنت را دور می‌زند.

**FR-11.6** وضعیت پرداخت:

| مقدار | کِی |
|---|---|
| `pending` | INSERT، و پس از خطای انتقال در verify |
| `failed` | `cancelled_by_user` یا `gateway_code_<n>` |
| `verified` | فقط در تراکنش پس از verify |

**FR-11.7** callback، دقیق:

1. درگاه ناشناخته → **404** (نه 503)
2. شناسه نیامد → `422 شناسهٔ تراکنش نیامد`
3. ردیف نبود → `404 این تراکنش پیدا نشد`
4. **`status == 'verified'`** → `{ok, already: true}` **بدون تماس با درگاه**
5. **پرچم موفقیت `false`** → `status='failed'`, `failure='cancelled_by_user'`،
   پاسخ **HTTP 200** `{ok: false, reason: 'cancelled'}`. سفارش `pending` می‌ماند.
6. **`verify()`** با **همان `request_amount` ذخیره‌شده**
   - خطای انتقال → ردیف `pending` می‌ماند، `502`. کامنت: «درگاه ممکن است
     در callback بعدی در دسترس باشد، و `failed` کردن یک سفارش پرداخت‌شده
     را رها می‌کند»
   - `ok` غلط → `status='failed'`, `failure=f'gateway_code_{code}'`
7. **`ok` درست → یک تراکنش واقعی**:

```sql
UPDATE payments SET status='verified', ref_id=%s, verified_at=now()
  WHERE id=%s AND status <> 'verified';
UPDATE orders SET status='paid', paid_at=now() WHERE id=%s AND status='pending';
DELETE FROM cart_items WHERE user_id = (SELECT user_id FROM orders WHERE id=%s);
```

> دلیل تراکنش: «یک 503 بین دو UPDATE پول را گرفته، پرداخت را verified
> کرده، و سفارش را pending گذاشته — برای همیشه، چون هیچ‌چیز بعداً
> آشتی‌شان نمی‌دهد.»

**FR-11.8** `[شکاف]` `payments.failure = 'amount_mismatch'` در اسکیما
مستند شده و **هرگز نوشته نمی‌شود**.

**FR-11.9** `[شکاف]` گام‌های ۷–۹ checkout سه دستور autocommit جدا هستند.
شکست میانشان سفارشی بی‌قلم یا سفارشی با سبد دست‌نخورده می‌گذارد.

**FR-11.10** `[شکاف]` وضعیت‌های `sourcing`, `shipped`, `delivered`,
`cancelled`, `refunded` در اسکیما مجازند و **هیچ روتری نمی‌نویسد**. دستی‌اند.

**FR-11.11** **تحویل مشخص (اپراتور، ۲۰۲۶-۱۱-۰۷؛ اصلاح ۲۰۲۶-۱۱-۱۰):**

- مشتری در checkout **تعداد روز کاری تحویل را خودش انتخاب می‌کند**
  (۲، ۳، ۴، ۵ یا ۷ روز؛ پیش‌فرض ۳). **حداقل ۲ تا ۳ روز کاری** است، پس
  انتخاب «فوری» یا «فردا» ممکن نیست.
- `delivery_eta_days` در `orders` با `CHECK (BETWEEN 2 AND 30)` ذخیره
  می‌شود؛ در `CheckoutIn` با `Field(..., ge=2, le=30)` اجباری است و در
  `CartPage` متن «حداقل ۲ تا ۳ روز کاری» نمایش داده می‌شود.
- **`delivery_slot` حذف شد.** نسخهٔ اول این بند از مشتری می‌خواست از
  «sloteهای موجود در `booking_slots`» انتخاب کند — جدولی که در **هیچ
  مایگریشنی وجود ندارد**. مقدارش هم هیچ اعتبارسنجی نداشت: هر عدد صحیحی
  ذخیره و همان‌طور به مشتری برگردانده می‌شد، و عددی بزرگ‌تر از بُرد
  `int4` به‌جای `422` یک `500` می‌داد. سند به کد اشاره می‌کرد و کد
  وجود نداشت؛ هر دو اصلاح شدند.
- زمان تحویل از **روز ثبت سفارش** شمرده می‌شود، نه از روز پرداخت.
  وضعیت‌ها: `pending → paid → sourcing → shipped → delivered`.
- **پیگیری سفارش (۲۰۲۶-۱۱-۱۰):** `GET /api/shop/orders` و
  `GET /api/shop/orders/{id}` وجود داشتند ولی **هیچ صفحه‌ای به آن‌ها
  وصل نبود**؛ صفحهٔ محصول به مشتری می‌گفت «وضعیت در سفارش‌های من به‌روز
  می‌شود» و چنین مسیری `404` می‌داد. حالا `/orders` و `/orders/:id`
  وجود دارند و `delivery_eta_days` را به مشتری نشان می‌دهند، و صفحهٔ
  نتیجهٔ پرداخت دکمهٔ «پیگیری سفارش» دارد.
- **اگر درگاه در همان لحظهٔ checkout خطا بدهد، سبد خرید بازگردانده
  می‌شود.** پیش از این سبد داخل تراکنش خالی می‌شد و اگر درگاه `502`
  می‌داد، مشتری با سبد خالی و سفارشی `pending` می‌ماند که **هیچ مسیری
  برای پرداخت دوباره‌اش وجود نداشت**.
- **منبع تأمین به مشتری نشان داده نمی‌شود.** نسخهٔ اول صفحهٔ محصول
  می‌نوشت «تأمین: از دیجی‌کالا، قیمت روزانه به‌روز می‌شود». این اطلاعات
  داخلی کسب‌وکار است و اعتماد خریدار را کم می‌کند؛ حذف شد و جای آن فقط
  قاعدهٔ زمان ارسال ماند.
- **`?q=%` در جست‌وجو دیگر همهٔ ردیف‌ها را برنمی‌گرداند.**
  `escape_like` در چهار روتر import شده و **صدا زده نمی‌شد**
  (`shop`, `claims`, `bookings`, `admin`)، در حالی که `catalog` همین
  باگ را قبلاً رفع کرده بود. یک `%` خام کل جدول را برمی‌گرداند در حالی
  که صفحه می‌گفت فیلتر کرده است.
- **`/health/deep` وقتی Redis قطع باشد `503` می‌دهد، نه `200`.**
  نسخهٔ اول با Redisِ از کار افتاده `{"status":"ok"}` برمی‌گرداند و
  نسخهٔ «دیتابیس قطع» آن هم کد مرده بود (چون `run_query` خودش
  `HTTPException` می‌دهد، نه `OperationalError`).

### ۶.۱۲ اجتماعی

**FR-12.1** `pets` مالک ندارد. مالکیت در `pet_profiles.owner_id` است.
یک حیوان می‌تواند **بدون پروفایل** وجود داشته باشد.

**FR-12.2** `POST /api/pets` (کاتالوگ) **احراز هویت نمی‌خواهد**. حیوان
بی‌مالک می‌سازد، فقط با نرخ‌محدودی `listing`.

**FR-12.3** `POST /api/pets/profile` **هر دو** ردیف را می‌سازد، در **دو
دستور autocommit جدا**. کرش میانشان حیوان بی‌مالک می‌گذارد.

**FR-12.4** حریم خصوصی: `is_public` پیش‌فرض `true`. پروفایل خصوصی برای
غیرمالک **404** می‌دهد (نه 403) تا وجود تأیید نشود.

**FR-12.5** `[شکاف]` `is_public` **فقط** در `_profile_payload` اجرا می‌شود.

بدون بررسی می‌مانند:
```
GET /api/pets/{id}/posts
GET /api/pets/{id}/stories
GET /api/pets/{id}/followers|following
GET /api/posts/{id}
```
محتوای پروفایل خصوصی با `id` قابل خواندن است.

**FR-12.6** `?as=<petId>` سه رفتار متفاوت دارد:

| جای | رفتار |
|---|---|
| `GET /api/pets/{id}?as=` | اگر مالک نباشد، **بی‌صدا نادیده گرفته می‌شود** (`is_following=false`) |
| follow / unfollow / feed | اگر مالک نباشد → **403** `این حیوان متعلق به شما نیست` |
| `as` داده نشود | `SELECT ... WHERE owner_id=%s ORDER BY pet_id LIMIT 1` — اگر هیچ حیوانی نباشد → `409` |

> کد صریح می‌گوید این دفاع IDOR است: «عمل بی‌صدا به‌جای حیوان دیگر، همان
> راهی است که ناهم‌خوانی بالا دیده نشد؛ پس اینجا 403 است.»

**FR-12.7** گراف فالو **حیوان→حیوان** است، نه کاربر→کاربر.
`CHECK follower <> followee`. خودفالو → `400`.

**FR-12.8** لایک **کاربر→پست** است. شمارنده با تریگر دیتابیس
(`trg_bump_like`) نگه داشته می‌شود و `GREATEST(like_count-1, 0)` است.

**FR-12.9** کامنت تخت است، بدون پاسخ. ۱–۵۰۰ نویسه، `strip`، خالی → 422.

**FR-12.10** `[باگ]` **صفحه‌بندی کامنت خراب است.**

فهرست `ORDER BY created_at ASC` است ولی نشانگر `created_at < before`
از **آخرین** (جدیدترین) ردیف گرفته می‌شود. صفحهٔ ۲ کامنت‌های **قدیمی‌تر**
از جدیدترین صفحهٔ ۱ برمی‌گرداند — یعنی همان صفحهٔ اول منهای دنباله.
**هرگز جلو نمی‌رود.** تستی ندارد.

**FR-12.11** استوری: `expires_at = now() + interval '24 hours'`.
`GET /api/pets/{id}/stories` اول ردیف‌های منقضی را **حذف** می‌کند، سپس
۲۰ تای جدید را برمی‌گرداند. یک GET با اثر جانبی.

**FR-12.12** فید: `kind='post'` فقط، پست‌های حیوان عامل + حیوان‌هایی که
دنبال می‌کند. نشانگر `before` یک **ISO datetime** است، نه `id`.
بدون tiebreaker روی `created_at`.

### ۶.۱۳ سرپرستی

**FR-13.1** فقط حیوانی که مالکش `adoption_status='available'` گذاشته
درخواست‌پذیر است. مالک نمی‌تواند برای حیوان خودش درخواست بدهد (`400`).
یک درخواست برای هر `(حیوان، کاربر)` — `UNIQUE` در دیتابیس.

**FR-13.2** وضعیت‌ها: `pending | accepted | rejected`.

**FR-13.3** پذیرش:
1. این درخواست `accepted`
2. **همهٔ** درخواست‌های `pending` دیگر همان حیوان `rejected`
3. `pet_profiles.adoption_status = 'adopted'`

**FR-13.4** `[شکاف]` **پذیرش، مالکیت را منتقل نمی‌کند.** هیچ دستوری
`pet_profiles.owner_id` را عوض نمی‌کند. «adopted» فقط یک برچسب وضعیت
است و مالک اصلی پروفایل (و همهٔ اندپوینت‌های مالکانه) را نگه می‌دارد.

**FR-13.5** `[شکاف]` سه UPDATE مسیر پذیرش **تراکنش نیستند**. ۵۰۳ در
میانه می‌تواند درخواست را accepted بگذارد در حالی که خواهرها masih
pending اند یا پروفایل adopted نشده.

**FR-13.6** درخواست‌دهندهٔ ردشده **نمی‌تواند دوباره درخواست بدهد** —
بررسی تکراری به وضعیت کاری ندارد.

**FR-13.7** `[باگ کوچک]` `message` بین ۱۰ و ۵۰۰ اعتبارسنجی می‌شود، سپس
`strip` می‌شود. ده فاصله از اعتبارسنجی رد می‌شود و `''` ذخیره می‌کند.

### ۶.۱۴ پشتیبانی

**FR-14.1** تیکت **بی‌نام** ممکن است. دلیل در کد: «کسی که تحویلش خراب
شده ممکن است حساب نداشته باشد... رد کردن او در آن لحظه، بدترین زمان
برای مطالبهٔ ورود است.»

**FR-14.2** توکن دسترسی، فقط برای مهمان:
`token_urlsafe(24)` — ۱۹۲ بیت. فقط `sha256` در `access_hash UNIQUE`.
متن خام **یک‌بار** در پاسخ ۲۰۱ به‌عنوان `access` برمی‌گردد. کاربر وارد‌شده
`access: null` می‌گیرد.

**FR-14.3** توکن چه می‌دهد: خواندن **یک** تیکت + افزودن پیام `customer`.
هیچ چیز دیگر. توکن غلط → **404**، نه 403 — «وضعیت متمایز تأیید می‌کند
که تیکت دیگری پشت توکن دیگری هست.»

**FR-14.4** `[باقی‌مانده]` توکن **انقضا ندارد**، چرخش ندارد، ابطال ندارد.
برای عمر ردیف تیکت معتبر است. در **مسیر URL** سفر می‌کند، پس در
access log پروکسی، تاریخ مرورگر، و احتمالاً `Referer` دیده می‌شود. هیچ
تسکینی در کد نیست.

**FR-14.5** تیکت کاربر وارد‌شده: `_mine` فیلتر `id AND user_id` می‌زند.
تیکت دیگران → **404**، نه 403.

**FR-14.6** وضعیت: ساخته می‌شود `open`. پاسخ مشتری `open` می‌کند
`WHERE status <> 'closed'`. پاسخ ادمین `open → pending` فقط.
اندپوینت وضعیت ادمین هر چهارتا را می‌پذیرد و یک پیام `system` اضافه
می‌کند: `وضعیت به <status> تغییر کرد`.

**FR-14.7** `order_id` فقط وقتی بررسی می‌شود که کاربر حاضر باشد. اگر
مالک نباشد **بی‌صدا `None` می‌شود** — وگرنه «راهی برای خواندن id سفارش
دیگری از طریق رشته» می‌شد.

**FR-14.8** `[شکاف]` برای کاربر مهمان و برای `booking_id` در **همهٔ**
موارد هیچ بررسی مالکیتی نیست. مقدار همان‌طور که داده شده ذخیره و به
ادمین نشان داده می‌شود.

### ۶.۱۵ دستیار

**FR-15.1** **هیچ LLM و هیچ تماس شبکه‌ای وجود ندارد.** دلیل ثبت‌شده:

1. درگاه مدل از IP ایران `RegionError: This model is not available in
   your country` می‌داد، و کلاینتی دستکاری‌شده بود — «کانال پشتیبانی‌ای
   که با یک patch هدر بالادست از کار می‌افتد، بدتر از نبودنش است»
2. Ollama محلی روی ۳٫۹ گیگابایت با ~۱ گیگابایت فضای آزاد فقط مدل
   ۰٫۶–۱٫۸B می‌گیرد، «تقریباً ۸–۲۰ توکن بر ثانیه روی دو vCPU... کافی
   نیست برای نوشتن جملهٔ فارسی‌ای که کسی وقتی پولش گم شده بخواند»

پس: «دستیار از واقعیت جواب می‌دهد نه از نثر تولیدشده. هر پاسخ زیر از
یک ردیف دیتابیس یا یک ثابت ساخته می‌شود.»

**FR-15.2** نه نیّت، به **ترتیب ارزیابی**:

```
0. human          ← override، قبل از همه
1. delivery
2. refund
3. payment_failed
4. booking
5. account
6. sell
7. order_status   ← آخر، چون عمومی‌ترین کلمات را دارد
8. greeting       ← آخرین، بدون ^
```

**FR-15.3** `_HUMAN_ONLY`:
`دو بار | دوبار | کم شد | برنگشت | برنگشته | کلاه | تقلب | شکایت | پلیس | قانونی`

**FR-15.4** ترتیب عمدی و مستند است: `order_status` شامل «سفارش» و
«ارسال» است، عمومی‌ترین کلمات. وقتی اول بود، «هزینه ارسال چقدره؟» و
«سفارشمو پس بدم» با «شماره سفارشت را بگو» جواب می‌گرفتند.

**FR-15.5** greeting **بدون `^`** است چون سلام واقعی داخل جمله می‌آید
(«سلام، سفارش من کجاست؟») و چون آخر است، هرگز موضوع واقعی را نمی‌بلعد.

**FR-15.6** `order_status`:
- با `order_id` **و** کاربر وارد‌شده → `WHERE id=%s AND user_id=%s`
- وگرنه اگر وارد شده → جدیدترین سفارش او
- مهمان یا پیدا نشد → `None`
- با سفارش: وضعیت، `#id`، و `total_toman` با `f"{total:,}".replace(',','،')`
- بدون سفارش: درخواست شماره / ورود

> «تنها پاسخ فعالانه آسیب‌زا اینجا، وضعیت مطمئن برای سفارشی است که
> دستیار نمی‌تواند ببیند.»

**FR-15.7** `booking` اگر کاربر وارد شده باشد، **۳ نوبت آخر** را از
`bookings JOIN stores` ضمیمه می‌کند.

**FR-15.8** خارج از نیّت‌ها → `unknown`:
«مطمئن نیستم این را درست بفهمم. اگر شمارهٔ سفارش را دارید بنویسید؛
وگرنه همین پیام را به‌عنوان تیکت بفرستید تا یک نفر بخواند.»

و **`handoff` برابر `false`** است. تیکت نمی‌سازد؛ می‌گوید بسازید.

**FR-15.9** `handoff` فقط یک بولی مشورتی در پاسخ است. برای `human`
`true` می‌شود و باز هم چیزی نمی‌سازد.

**FR-15.10** منابع داده: `orders (id, status, total_toman)` و
`bookings JOIN stores`. **هیچ دسترسی به تیکت‌ها، سبد، محصولات، پرداخت‌ها
یا شبکه ندارد.**

### ۶.۱۶ ادمین

**FR-16.1** دو گیت مستقل:

**الف — `require_admin`: کلید API، برای مسیرهای مخرب**

```python
def require_admin(x_admin_key: str = Header(default='')):
    expected = (os.environ.get('ADMIN_CATALOG_KEY') or '').strip()
    if not expected:
        raise HTTPException(404, 'Not Found')
    if not hmac.compare_digest(x_admin_key.strip(), expected):
        raise HTTPException(403, 'کلید مدیریتی نادرست است')
```

مسیرها: `/migrate` · `/migrate-all` · `/catalog/stats` ·
`/catalog/replace` · `/sync`.

> «استقرار تنظیم‌نشده نباید اصلاً اعلام کند این مسیر وجود دارد. پس
> تنظیم‌نشده = خاموش، نه باز.»

**ب — `require_admin_user`: نشست + پرچم، برای خواندن و پشتیبانی**

`is_admin` در **هر درخواست** از دیتابیس دوباره خوانده می‌شود، نه از
عکس فوری نشست.

مسیرها: `/overview` · `/users` · `/orders` · `/orders/{id}` ·
`/sync-runs` · چهار مسیر `/api/support/admin/*` · تأیید/رد ادعا.

**FR-16.2** قاعدهٔ دقیق 404 در برابر 403:

| موقعیت | وضعیت |
|---|---|
| بدون نشست/نامعتبر روی مسیر نشستی | **401** |
| وارد‌شده ولی `is_admin = false` | **404** `Not Found` |
| `ADMIN_CATALOG_KEY` تنظیم نشده | **404** `Not Found` |
| کلید تنظیم شده، هدر غلط | **403** `کلید مدیریتی نادرست است` |
| مسیر مخفی غلط / درب تنظیم‌نشده | **404** `Not Found` |
| مسیر درب درست، اعتبار غلط | **401** `ورود ناموفق` |

**قاعده در یک جمله:** ۴۰۴ یعنی «این سطح برای تو وجود ندارد»؛ ۴۰۳ یعنی
«یک سطح واقعی و فعال پیدا کردی و مدرک صریح غلط دادی».

**FR-16.3** اعطای ادمین فقط با SQL دستی است. **هیچ اندپوینتی ادمین
نمی‌دهد** — «اندپوینتی که می‌تواند ادمین بدهد، اندپوینتی است که مهاجم
می‌خواهد».

**FR-16.4** `/catalog/replace`، گارد قدرتمند:

```python
GUARDED_TABLES = ('pets','pet_profiles','posts','follows','comments',
                  'likes','sessions','users')
```
شمارش این‌ها **قبل** و **داخل** تراکنش گرفته می‌شود؛ هر تغییری raise
می‌کند و همه‌چیز rollback می‌شود.

> `[باقی‌مانده]` گارد فقط **شمارش** را می‌سنجد، نه محتوا. همچنین یک
> ثبت‌نام یا ورود عادی که هم‌زمان `users`/`sessions` را عوض کند،
> جایگزینی را کاملاً لغو می‌کند.

**FR-16.5** `/overview`، `orders_today` در **نیمه‌شب Asia/Tehran** بریده
می‌شود، نه منطقهٔ زمانی کانتینر — داشبورد صبح در ایران خوانده می‌شود.

**FR-16.6** `/users` عمداً `password_hash`, `phone`, توکن‌ها را
**برنمی‌گرداند**.

**FR-16.7** `/orders/{id}` کلیدش `lines` است، نه `items` — عمداً، تا
`items` در یک اندپوینت تعداد و در اندپوینت دیگر آرایه نباشد.

**FR-16.8** `/catalog/replace` سقف: ۵۰۰۰ مرکز، ۲۰۰۰۰ محصول؛ بیشتر → `413`.

**FR-16.9** `/migrate` فقط فایل‌های موجود در `migrations/` را می‌پذیرد
(allow-list)، کشف‌شده **یک‌بار در import** — فایل تازه ری‌استارت می‌خواهد.

**FR-16.10** `/migrate-all` خطایی که detail آن `already exists` دارد را
موفق می‌گیرد و به `skipped` می‌برد.

### ۶.۱۷ درب پشتی

**FR-17.1** مسیر واقعی `/api/{secret_path}/enter` است — با پیشوند `/api`.

> کامنت `main.py:148-150` می‌گوید «بدون پیشوند» و با کد در تناقض است.
> `backdoor.py:61` صریح می‌گوید پیشوند `/api` است چون تنها پیشوندی است
> که nginx فوروارد می‌کند.

**FR-17.2** جریان دقیق:

1. **بررسی مسیر اول** (`compare_digest`)، قبل از دست‌زدن به بدنه.
   غلط یا تنظیم‌نشده → `404 {"detail":"Not Found"}` — **همان شکلی که
   FastAPI برای مسیر ناموجود می‌دهد**
2. **بدنه دستی parse می‌شود** (`_read_body`)، نه با Pydantic

> دلیل: با مدل Pydantic در امضا، FastAPI بدنه را **قبل از** handler
> اعتبارسنجی می‌کرد، پس «مسیر غلط + بدنهٔ بد» → 422 و «مسیر درست» →
> 404. همان تفاوت تنها به یک کاوشگر می‌گفت کدام نیمه را حدس زده است.

3. **عبارت عبور تنظیم شده؟** اگر مسیر درست ولی `ADMIN_BACKDOOR_PASSPHRASE`
   خالی → `404`. «این یک اشتباه استقرار است و باید بسته شکست بخورد نه
   که هر عبارتی را بپذیرد»
4. **دو نرخ‌محدودی**: `admin_door` per-IP، سپس `admin_door` per-username
   (`6/60s` هر کدام)، **قبل از** lookup کاربر
5. **اعتبارسنجی — سه چیز لازم**: رمز درست (PBKDF2) **و** عبارت درست
   (`compare_digest`) **و** `is_admin = true`
6. **هر شکست** → INSERT در `admin_door_attempts` (`ok=false`) و
   `401 ورود ناموفق`
7. **موفقیت** → `create_session` (**همان کارخانهٔ نشست عادی**) و
   `{token, user: {..., is_admin: true}}`

**FR-17.3** چه می‌دهد: یک ردیف عادی در `sessions`، **۳۰ روز**، و
همهٔ آنچه هر نشست `is_admin` می‌تواند بکند + همهٔ قابلیت‌های کاربر عادی.

**چه نمی‌دهد:** مسیرهای کلیدی (`/migrate`, `/migrate-all`,
`/catalog/replace`, `/catalog/stats`, `/sync`). **نمی‌تواند SQL اجرا
کند، کاتالوگ را جایگزین کند، یا سینک را صدا بزند.**

**FR-17.4** آیا دور زدن ورود است؟ **نه.** هیچ مدرکی دور زده نمی‌شود:
رمز واقعی یک حساب فعال **به‌علاوهٔ** یک عبارت استقرار لازم است، و
حساب باید از قبل `is_admin = true` داشته باشد. یک **مسیر** دوم به
همان نوع نشست است، نه راهی بدون راز.

**FR-17.5** `[تناقض]` docstring می‌گوید «نشستی با عمر بسیار کوتاه‌تر از
ورود عادی». کد همان `create_session` با **۳۰ روز** را صدا می‌زند.
هیچ کد نشست کوتاه‌مدتی وجود ندارد.

**FR-17.6** `[باقی‌مانده]` `[بدون]` **افشای اطلاعات در `/attempts`:**

`GET /api/{secret_path}/attempts` **فقط** با دانستن مسیر مخفی باز
می‌شود — نشست لازم ندارد. هر کسی که مسیر را یاد بگیرد، ۵۰ تلاش آخر
را با نام کاربری، موفقیت، IP و زمان می‌خواند.

**FR-17.7** `[باقی‌مانده]` کانال جانبی زمان: `ok = bool(rows) and
verify_password(...)` اتصال کوتاه می‌کند، پس نام کاربری ناموجود
PBKDF2 ۱۲۰٬۰۰۰ دوره‌ای را رد می‌کند و **محسوساً سریع‌تر** برمی‌گردد.
پیام یکسان است، زمان یکسان نیست.

**FR-17.8** `[باقی‌مانده]` ثبت تلاش از `request.client.host` استفاده
می‌کند، نه `client_ip()` — پشت nginx، آدرس پروکسی را ثبت می‌کند.

**FR-17.9** در این استقرار `ADMIN_BACKDOOR_PATH` **تنظیم شده** است
(سنجیده: `ADMIN_BACKDOOR_PATH_SET=yes`). مقدارش ثبت نشد.

### ۶.۱۸ آپلود تصویر

**FR-18.1** ثابت‌ها:
```
MAX_BYTES  = 5 * 1024 * 1024      (5,242,880)
ALLOWED    = {image/jpeg: .jpg, image/png: .png, image/webp: .webp}
سقف دیسک   = 2_000_000_000        (2 GB)
```

**FR-18.2** ترتیب اعتبارسنجی:
1. `content_type` در فهرست سفید، وگرنه 422
2. **کل بدنه خوانده می‌شود** — سقف جریانی وجود ندارد
3. `len > MAX_BYTES` → 422 · `len == 0` → 422
4. **بررسی امضای فایل**:
   - `.jpg` → `\xff\xd8\xff`
   - `.png` → `\x89PNG\r\n\x1a\n`
   - `.webp` → `RIFF` و `data[8:12] == b'WEBP'`
5. `name = secrets.token_hex(16) + ext` — **۳۲ کاراکتر هگز**

**FR-18.3** نام فایل سمت کلاینت **کاملاً دور ریخته می‌شود**.
**path traversal از طریق نام فایل غیرممکن است.**

**FR-18.4** `[باقی‌مانده]` بررسی امضا **فقط پیشوند** است. تصویر هرگز
decode نمی‌شود، ابعاد سنجیده نمی‌شود، باز-کدگذاری نمی‌شود. فایلی که
با سه بایت درست شروع شود و بعدش HTML/JS باشد **پذیرفته می‌شود**.
تسکین: پسوند انتخاب‌شده توسط سرور و `Content-Type` از آن.

**FR-18.5** `[باقی‌مانده]` هیچ `X-Content-Type-Options: nosniff` در
کد اپ وجود ندارد، هرچند nginx آن را تنظیم می‌کند (سنجیده: هدر
موجود است).

**FR-18.6** `[باقی‌مانده]` جدول مالکیت وجود ندارد. هر کاربر وارد‌شده
می‌تواند آپلود کند و هیچ‌چیز فایل را به آپلودکننده وصل نمی‌کند.

**FR-18.7** `[باقی‌مانده]` بررسی ۲ گیگابایت یک `os.listdir` + `getsize`
**O(n) روی هر آپلود** است. آپلودهای همزمان می‌توانند از سقف رد شوند.

### ۶.۱۹ ادعای کسب‌وکار

**FR-19.1** جستجو **بی‌نام** است: «کسی که کلینیک را می‌گرداند نباید
قبل از پیدا کردن آگهی خودش حساب بسازد.» حداقل ۳ نویسه، وگرنه ۲۰۰ با
فهرست خالی و یادداشت فارسی.

**FR-19.2** جستجو `name ILIKE` **یا** `address ILIKE`، محدود به چهار
دستهٔ خدماتی. خروجی: `id, name, address, category` — فقط چیزی که
همین حالا روی نقشه است.

**FR-19.3** عمداً **برنمی‌گرداند:** `has_dashboard`.

> «تأیید نمی‌کند که آیا مرکز از قبل داشبورد دارد یا نه، چون آن به یک
> غریبه می‌گوید کدام کلینیک‌ها قبلاً ادعا شده‌اند.»

**FR-19.4** مدرک لازم:

| فیلد | قید | چرا |
|---|---|---|
| `national_id` | ۸–۱۰ رقم بعد از نرمال‌سازی | قابل مقایسه با نام روی جواز |
| `licence_no` | ۳–۴۰ | «تنها چیزی که نمی‌توان جعل کرد» |
| `proof` | ≤۱۰۰۰، اختیاری | سربرگ، تلفن موجود، صفحهٔ اجتماعی |
| `note` | ≤۱۰۰۰، اختیاری | چه می‌خواهد بکند |

> **هیچ‌کدام خودکار اعتبارسنجی نمی‌شوند. برای این هستند که بازبینِ
> انسان چیزی برای مقایسه داشته باشد.**

**FR-19.5** ادعای `pending` موجود → `409`.

**FR-19.6** `[باقی‌مانده]` «یک ادعای باز در هر مرکز» با ایندکس یکتای
جزئی اجرا می‌شود، ولی 409 از یک **SELECT پیش‌بررسی** می‌آید نه از
گرفتن constraint. دو ارسال هم‌زمان هر دو از بررسی رد می‌شوند و بازنده
`UniqueViolation` بی‌مدیریت → **500** می‌گیرد، نه 409.

**FR-19.7** تأیید، **دو نوشتن در یک عمل**:
1. `token = token_urlsafe(32)` → `UPDATE stores SET dashboard_hash = ...`
2. `UPDATE store_claims SET status='approved', ...`

> «ادعایی که approved شود بدون لینک، کسب‌وکاری است که به او بله گفته
> شده و هرگز خبری نگرفته، و از یک ادعای نادیده‌گرفته‌شده قابل تشخیص نیست.»

**FR-19.8** `[شکاف]` این دو UPDATE **در `transaction()` نیستند**.
شکست میانشان یا لینک زنده با ادعای pending می‌گذارد، یا ادعای approved
بدون لینک.

---

## ۷. نیازمندی‌های غیرکارکردی

### ۷.۱ کارایی

| شناسه | نیازمندی | مبنا |
|---|---|---|
| NFR-1.1 | `HomePage` تنبل نباشد | مسیر فرود است |
| NFR-1.2 | ۲۷ مسیر دیگر تنبل باشند | ✅ |
| NFR-1.3 | سقف زمانی **۲۰ ثانیه** روی هر درخواست | `REQUEST_TIMEOUT_MS` |
| NFR-1.4 | CLS در مسیرهای محافظت‌شده = ۰ | ✅ سنجیده |
| NFR-1.5 | صفحه در بارگذاری خودش را اسکرول نکند | گیت `scroll_audit` |
| NFR-1.6 | صفحهٔ پیش‌فرض `/stores/nearby` = ۱۵۰ ردیف (~۱۵ KB) | برای لینک ~۲۰۰ B/s |

> **NFR-1.3 — چرا ۲۰ ثانیه:** اندازه‌گیری شد که توان عبوری از تهران به
> استقرار ~۲۰۰ بایت بر ثانیه بود، که پاسخ ۱۵ کیلوبایتی بیش از یک دقیقه
> می‌برد. بدون deadline، fetch بی‌نهایت آویزان می‌ماند: نه خطا، نه
> تلاش دوباره. «کند» اکنون شکست عادی و قابل‌اقدام است.

**NFR-1.7** `[تضاد اندازه‌گیری‌شده]` فرانت `limit=2000` را **پین** می‌کند:

```ts
const NEARBY_MAX_LIMIT = 2000
```

با ۴۴۷ مرکز و پاسخ ~۱۳۰ بایت هر ردیف، این **~۵۸ کیلوبایت** در هر
درخواست است. روی لینک ۲۰۰ B/s حدود **۵ دقیقه**. سقف ۲۰ ثانیهٔ
NFR-1.3 با این اندازه در تضاد است.

> کامنت کد دلیل آوردن ۲۰۰۰ را توضیح می‌دهد: پیش‌فرض ۱۵۰ باعث می‌شد
> ۶۸ مرکز غایب باشند و صفحه‌ای که مرکز را با `id` جستجو می‌کند «پیدا
> نشد» بدهد — که «پاسخ غلط دربارهٔ یک کسب‌وکار واقعی» است. اما این
> مشکل با **جستجوی id** حل می‌شود، نه با آوردن همهٔ ۴۴۷.

### ۷.۲ دسترسی‌پذیری

| شناسه | نیازمندی | ابزار |
|---|---|---|
| NFR-2.1 | صفر تخلف axe در مسیرهای عمومی | `a11y_audit.mjs` |
| NFR-2.2 | صفر تخلف کنتراست | `contrast_audit.mjs` |
| NFR-2.3 | پین‌های نقشه با کیبورد | `map_audit.mjs` |
| NFR-2.4 | ۱۱۵ توقف کیبورد در ۵ مسیر، همه نام‌دار و دیده‌شدنی | `tab_order_audit.mjs` |
| NFR-2.5 | پنهان‌کردن معیوب با overlay ممنوع | گارد `axe incomplete` |

**وضعیت سنجیده:** axe روی ۴ صفحهٔ موبایل = **۰ تخلف**.
کنتراست: **۱۴۴ تخلف در مسیرهای عمومی** باقی مانده (کار باز #T-3).

### ۷.۳ بومی‌سازی

| شناسه | نیازمندی | وضعیت |
|---|---|---|
| NFR-3.1 | فارسی RTL سراسری | `dir="rtl"` · `lang="fa"` |
| NFR-3.2 | فونت **متغیر خودمیزبان** | Vazirmatn `.woff2` — **قاعدهٔ ثابت پروژه** |
| NFR-3.3 | ارقام فارسی در ورودی و نمایش | ✅ |
| NFR-3.4 | هزارگان فارسی | `replace(',', '،')` در دستیار |
| NFR-3.5 | تاریخ شمسی در نوبت‌ها | `fa-IR` |
| NFR-3.6 | هفته از **شنبه** | `(weekday + 2) % 7` |

> **NFR-3.2:** فونت متغیر self-hosted نباید عوض شود یا از CDN بیاید.

**NFR-3.7** هر عدد داخل متن RTL باید `direction:ltr` +
`unicode-bidi:bidi-override` بگیرد، وگرنه «۴۴۷» به‌شکل «VYY» درمی‌آید.

### ۷.۴ نگهداری

| شناسه | نیازمندی | ابزار |
|---|---|---|
| NFR-4.1 | تایپ‌چک | `tsc -b` |
| NFR-4.2 | لینت | `oxlint src` |
| NFR-4.3 | QC دادهٔ کاتالوگ | `qc_catalog.py` |
| NFR-4.4 | بیلد و استقرار Docker | ✅ |
| NFR-4.5 | پشتیبان روزانه، نگهداری ۷ روز | `backup_db.sh` |
| NFR-4.6 | PWA / آفلاین | ✅ |
| NFR-4.7 | مهاجرت‌های idempotent | `CREATE TABLE IF NOT EXISTS` |

**NFR-4.8** هر مهاجرت با `ON_ERROR_STOP=1` اجرا می‌شود و `backend` منتظر
`service_completed_successfully` سرویس `migrate` است. مهاجرتی که شکست
بخورد، stack را متوقف می‌کند — نه اینکه اپ را روی شمای نیمه‌ساخته بگذارد.

### ۷.۵ مرورگر و دستگاه

- هدف: مرورگر مدرن موبایل و دسکتاپ.
- Playwright روی **Chrome سیستمی**، نه Chromium باندل — چون
  `cdn.playwright.dev` از ایران ۴۰۳ می‌دهد.
- `[شکاف]` **روی گوشی واقعی تست نشده.**

### ۷.۶ رصد (Monitoring) و هشدار

معماری رصد **سه لایه** است. لایه‌ها عمداً مستقل‌اند: شکست یکی، کوری
کامل ایجاد نمی‌کند.

#### لایهٔ ۱ — کاوش سلامت (همیشه روشن، بدون وابستگی بیرونی)

| شناسه | نیازمندی | مبنا |
|---|---|---|
| NFR-6.1 | `GET /health` — زنده‌بودن فرایند، بدون I/O | `app/routers/catalog.py` |
| NFR-6.2 | `GET /health/deep` — بررسی واقعیِ DB و Redis | همان |
| NFR-6.3 | کاوش هر ۵ دقیقه با `systemd timer`، گزارش به Bale | `health-watch.timer` |

**NFR-6.4** `/health/deep` وقتی **هر** وابستگی از کار افتاده باشد
`503` برمی‌گرداند با `detail` ساختاری:

```json
{"status": "degraded",
 "checks": {"database": "down", "redis": "ok"},
 "reason": "database: ..."}
```

> دلیل وجود این endpoint در کنار `/health`: کاوشِ سبک فقط می‌گوید
> «پروسه زنده است». یک API با اتصال دیتابیس مرده، هم `200` می‌دهد هم
> کل فروشگاه را از کار می‌اندازد.

**NFR-6.5** شاخهٔ `except` **باید** `HTTPException` را بگیرد، نه
`psycopg2.OperationalError` را. تابع `run_query` خودش `OperationalError`
را به `HTTPException(503)` تبدیل می‌کند؛ نسخهٔ اول این endpoint شاخه‌ای
داشت که هرگز اجرا نمی‌شد.

**NFR-6.6** `InterfaceError` در همان `except` است. یک اتصال pooled که
بین دو درخواست قطع شود این را می‌اندازد و **خواهرِ**
`OperationalError` است نه فرزندش — بدون آن، این حالت `500` می‌شد نه `503`.

**NFR-6.7** `/health/deep` از طریق nginx با `location =` دقیق پروکسی
می‌شود، نه `prefix`، تا با `/health` قاطی نشود. `access_log off`.

#### لایهٔ ۲ — متریک و داشبورد (Prometheus + Grafana خودمیزبان)

| شناسه | نیازمندی | پیاده‌سازی |
|---|---|---|
| NFR-6.8 | متریک در `/metrics`، **فقط** روی شبکهٔ داکر | `prometheus_fastapi_instrumentator` |
| NFR-6.9 | `/metrics` از اینترنت **قابل دسترس نیست** | nginx فقط `/api/`, `/health*`, `/media/` را می‌فرستد |
| NFR-6.10 | متریک‌های هاست (CPU/RAM/disk/network) | `node-exporter:v1.8.2` |
| NFR-6.11 | متریک‌های کانتینر (CPU/RAM/net/pids) | `monitoring/docker-exporter.py` |
| NFR-6.12 | داشبورد ۱۰ پنل، Datasource خودکار | `monitoring/grafana-dashboard.py` |

**NFR-6.13** Instrumentator **اختیاری** است (`try/except ImportError`).
یک وابستگی رصدی نباید بتواند بوت فروشگاه را بشکند — نسخهٔ اول
بدون گارد بود، پس یک نصب ناموفق از mirror، کل API را — از جمله
`/health` را — پایین می‌آورد.

**NFR-6.14** برچسب‌گذاری با **قالب مسیر** (`should_ignore_untemplated`)،
نه مسیر پرشده. در غیر این صورت هر `product_id` یک مقدار برچسب
جداگانه می‌شود و تعداد سری‌ها با کاتالوگ رشد می‌کند.

**NFR-6.15** cAdvisor روی این هاست **ساختاراً ناممکن** است و نباید
دوباره امتحان شود (اندازه‌گیری‌شده ۲۰۲۶-۱۱-۱۰):

| مسیر | نتیجه |
|---|---|
| `gcr.io/cadvisor/cadvisor` | `403` (تحریم) |
| `google/cadvisor` روی Docker Hub | `v0.32.0` — پیش از cgroup v2 |
| `zcube/cadvisor:v0.45.0` | `failed to identify the read-write layer ID` |

دلیل: این Docker از `io.containerd.snapshotter.v1` استفاده می‌کند،
نه درایور گراف `overlay2` — و cAdvisor مسیر
`/image/overlayfs/layerdb/...` را می‌خواند.

**NFR-6.16** `docker-exporter.py` فقط از کتابخانهٔ استاندارد و
Docker API روی `/var/run/docker.sock` استفاده می‌کند. حافظه را مثل
`docker stats` با کسر `inactive_file` حساب می‌کند.

**NFR-6.17** کانتینر exporter با `USER 65534:999` اجرا می‌شود، چون
`socket` مالک `root:docker` با مود `0660` است. `nobody` تنها، `EACCES`
می‌گیرد.

**NFR-6.18** Grafana روی `127.0.0.1:3000` bind می‌شود، نه `0.0.0.0`.
دسترسی فقط با SSH tunnel. رمز **اجباری** است:
`${GF_ADMIN_PASSWORD:?}` — نه مقدار پیش‌فرض.

**NFR-6.19** نسخهٔ Grafana **پین‌شده به `11.2.3`** است. `11.4.0` در
حالت view پنل‌ها را با بدنهٔ خالی رندر می‌کند (در Edit درست است)؛
`GF_FEATURE_TOGGLES_dashboardSceneForViewers=false` هم کمکی نکرد.

**NFR-6.20** پرس‌وجوهای داشبورد که ممکن است سری نداشته باشند با
`or vector(0)` پوشش داده می‌شوند — وگرنه یک پنل خالی از یک خطای
پیکربندی قابل تشخیص نیست.

**NFR-6.21** سنجه‌های http با برچسب وضعیت `http_requests_total` هستند،
نه هیستوگرام. `p95` از `http_request_duration_seconds_bucket` با
`histogram_quantile` می‌آید.

**NFR-6.22** `verify-dashboard.py` هر ۱۰ پرس‌وجو را از مسیر
`/api/datasources/proxy` اجرا و OK/EMPTY گزارش می‌کند. داشبوردِ
تأییدنشده، داشبورد نیست.

**NFR-6.23** Compose جدا (`pawsmon`) است، نه بخشی از stack اپ.
`pawsmarket_default` را `external` می‌گیرد تا اپ بدون رصد هم بالا بیاید.

#### لایهٔ ۳ — Grafana Cloud (رد شد)

**NFR-6.24** Grafana Cloud برای IP ایران **قابل استفاده نیست**:

> «Your connection appears to be coming from a region where Grafana Labs
> cannot provide Grafana Cloud... U.S. sanctions»

این ثبت شده تا دوباره تلاش نشود. جایگزین: Grafana خودمیزبان روی همان
VPS (لایهٔ ۲).

#### شکاف‌های شناخته‌شدهٔ رصد

- `[شکاف]` **هیچ هشدار خودکاری از Prometheus نیست.** Alertmanager
  مستقر نشده؛ هشدارها فقط از لایهٔ ۱ (کاوش ۵ دقیقه‌ای) می‌آیند.
- `[شکاف]` دادهٔ Prometheus **۷ روز / ۱ گیگابایت** نگه داشته می‌شود.
  تحلیل روند بلندمدت ممکن نیست.
- `[شکاف]` هیچ مانیتورینگ **بیرونی**‌ای وجود ندارد. اگر کل VPS پایین
  بیاید، کاوشگر هم روی همان VPS است و هشدار نمی‌آید.

### ۷.۷ تغییرات ۲۰۲۶-۱۱-۱۰ (پس از FR-11.11)

این تغییرات در بازبینی چندروزه اعمال شدند و بخشی از قرارداد فعلی‌اند:

| شناسه | تغییر | دلیل |
|---|---|---|
| NFR-7.1 | `delivery_slot` از چک‌اوت **حذف** شد | جدول `booking_slots` در هیچ مهاجرتی وجود نداشت |
| NFR-7.2 | `delivery_eta_days` (۲..۳۰، پیش‌فرض ۳) جای آن آمد | کاربر باید بازهٔ تحویل انتخاب کند |
| NFR-7.3 | صفحه‌های `/orders` و `/orders/:id` ساخته شدند | «سفارش‌های من» قبلاً به مسیر ناموجود اشاره می‌کرد |
| NFR-7.4 | شکست درگاه، **سبد را برمی‌گرداند** | قبلاً سبد پاک می‌شد و کاربر خریدش را از دست می‌داد |
| NFR-7.5 | `order_items` با `rowcount == 0` → `409` | بی‌صدا کالای گم‌شده نمی‌پذیریم |
| NFR-7.6 | `escape_like` در ۴ روتر اعمال شد | `?q=%` همهٔ ردیف‌ها را برمی‌گرداند |
| NFR-7.7 | اطلاعات «تأمین‌کننده» از صفحهٔ محصول حذف شد | مشتری نباید بداند کالا از کجا می‌آید |
| NFR-7.8 | Instrumentator اختیاری شد | بوت نباید به بستهٔ رصدی وابسته باشد |

---

## ۸. مدل امنیت

### ۸.۱ قواعد اجراشده

| شناسه | قاعده | مبنا |
|---|---|---|
| SR-1 | PBKDF2-HMAC-SHA256 · ۱۲۰٬۰۰۰ دوره · نمک ۱۶ بایتی تصادفی | `security.py` |
| SR-2 | توکن نشست ۲۵۶ بیتی؛ فقط `sha256` ذخیره می‌شود | ✅ |
| SR-3 | کد OTP با همان PBKDF2 هش می‌شود | ✅ سنجیده |
| SR-4 | توکن هرگز در پاسخ فهرست نمی‌آید | `_public_booking` |
| SR-5 | مسیر غیرمجاز → ۴۰۴، نه ۴۰۳ | ✅ |
| SR-6 | ۴۰۴ برای پروفایل خصوصی | ✅ |
| SR-7 | ۴۰۴ برای تیکت دیگران | ✅ |
| SR-8 | `hmac.compare_digest` برای مقایسهٔ راز | ۵ جا |
| SR-9 | `is_admin` در هر درخواست از دیتابیس خوانده شود | ✅ |
| SR-10 | نام فایل آپلود سمت سرور ساخته شود | ✅ |
| SR-11 | امضای فایل بررسی شود | ✅ |
| SR-12 | CSP · HSTS · nosniff · SAMEORIGIN · Referrer-Policy | ✅ سنجیده |
| SR-13 | `EXPOSED` پورت‌ها: فقط ۸۰ | ✅ سنجیده |
| SR-14 | Postgres و Redis **بدون پورت میزبان** | ✅ |
| SR-15 | CORS: `''` و `'  ,  '` مثل تنظیم‌نشده رفتار کنند | تست دارد |

**SR-16** CORS: `allow_credentials` تنظیم نشده و همهٔ نشست‌ها Bearer اند،
پس `'*'` درخواست credentialed را لو نمی‌دهد.

**SR-17** هدرهای زنده، سنجیده:
```
Content-Security-Policy: default-src 'self'; script-src 'self';
  style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:
  https://tile.openstreetmap.org https://dkstatics-public.digikala.com
  https://image.torob.com; connect-src 'self'; font-src 'self';
  object-src 'none'; base-uri 'self'; form-action 'self';
  frame-ancestors 'self'; upgrade-insecure-requests
Strict-Transport-Security: max-age=5184000; preload
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin
```

### ۸.۲ شکاف‌های امنیتی

| شناسه | شکاف | شدت |
|---|---|---|
| SEC-1 | `is_sandbox()` هرگز صدا زده نمی‌شود — پرداخت سندباکس از واقعی قابل تشخیص نیست | **بالا** |
| SEC-2 | تأیید زبال مبلغ را بررسی نمی‌کند | **بالا** |
| SEC-3 | `/api/{secret}/attempts` فقط با دانستن مسیر باز می‌شود — ۵۰ IP و نام کاربری تلاش‌شده | **متوسط** |
| SEC-4 | `is_public` فقط در پروفایل اجرا می‌شود؛ پست/استوری/فالوور خصوصی با `id` خواندنی است | **متوسط** |
| SEC-5 | کد OTP در query string پای خروجی Kavenegar؛ کلید API در مسیر URL | **متوسط** |
| SEC-6 | توکن تیکت انقضا و ابطال ندارد، در URL سفر می‌کند | **متوسط** |
| SEC-7 | `get_gateway` بررسی «تنظیم نشده» را روی نام خام می‌زند | پایین |
| SEC-8 | کانال جانبی زمان در درب پشتی و در `/recover` و `/otp/request` | پایین |
| SEC-9 | بررسی امضای تصویر فقط پیشوند است | پایین |
| SEC-10 | افزایش تلاش OTP اتمیک نیست | پایین |
| SEC-11 | `POST /api/pets` بدون احراز هویت و بدون سقف حیوان | پایین |
| SEC-12 | `[فایل]` `.env` روی سرور مقادیر واقعی `ADMIN_BACKDOOR_PATH` و `ADMIN_BACKDOOR_PASSPHRASE` را دارد | عملیاتی |

> **SEC-12 بررسی شد:** `.env` در گیت **tracked نیست** (فقط
> `.env.example` و `.env.production.example`). صفر فایل شبیه راز در
> مخزن بک‌اند. خطر فقط اگر آن فایل از میزبان بیرون برود.

### ۸.۳ رازهای سوخته

| راز | وضعیت |
|---|---|
| کلید deAPI `sk-dp-…` | در چت لو رفت — **باید عوض شود**؛ در هیچ فایلی نوشته نشد |
| توکن ربات تلگرام | در چت لو رفت، **دوباره در چت آمد** — ربات وبهوک زنده دارد؛ باطل‌کردنش محصول را می‌شکند |
| رمز root سرور | در چت لو رفت — **سوخته**؛ ورود با کلید فقط |

---

## ۹. ملاحظات ایران

| شناسه | محدودیت | پیامد |
|---|---|---|
| IR-1 | `api.telegram.org` → `10.10.34.36` (DNS مسدود) | همهٔ تماس‌های تلگرام از `socks5h://127.0.0.1:10808` |
| IR-2 | `cdn.playwright.dev` → ۴۰۳ | تست روی Chrome سیستمی |
| IR-3 | `api.torob.com` از IP دیتاسنتر → HTTP 490 + arcaptcha | `TorobSource.enabled = False`؛ فقط MCP |
| IR-4 | درگاه مدل از IP ایران → `RegionError` | دستیار بدون LLM |
| IR-5 | `npm ci` روی bind mount ویندوز → EIO | کار در کپی `/tmp` |
| IR-6 | `node_modules` ترکیب باینری ویندوز/لینوکس | `npm ci` در پوشهٔ پروژه نشکند |
| IR-7 | توان عبوری ~۲۰۰ B/s | deadline ۲۰ ثانیه |
| IR-8 | ارقام RTL | `bidi-override` |
| IR-9 | دو درگاه ایرانی با واحد پول متفاوت | تبدیل در `_wire_amount` |
| IR-10 | Kavenegar، محدودیت نرخ | `otp_request` ۱۰/IP و ۳/تلفن |

---

## ۱۰. آزمون و کیفیت

### ۱۰.۱ فرانت — CI (`.github/workflows/ci.yml`)

```
tsc -b                          تایپ‌چک
oxlint src                      لینت
python scripts/qc_catalog.py    QC داده
serve_dist → audits:
  contrast_audit   --public-only
  a11y_audit       --public-only
  map_audit
  tab_order_audit  --public-only
  scroll_audit
  phone_theme_audit
  booking_guard_audit
```

**چرا مسیرهای محافظت‌شده در CI نیستند:** CI نه دیتابیس دارد، نه بک‌اند،
نه session. `/feed`, `/bookings`, `/me` هر سه به `/login` می‌پریدند و
audit سه بار صفحهٔ ورود را زیر سه نام گزارش می‌کرد. `--public-only`
آن‌ها را **حذف** می‌کند نه skip — چون skip هنوز اجرا را قرمز می‌کند و
آن قرمزی دربارهٔ محیط است نه محصول.

**آنچه واقعاً سنجیده می‌شود، با API مرده:**

| مسیر | کارت | گرهٔ متنی | حکم |
|---|---|---|---|
| `/` | ۱۴ | ۱۹۴ | محتوای واقعی |
| `/explore` | ۴۸ | ۴۰۵ | محتوای واقعی |
| `/explore?preset=vets` | ۴۸ | ۴۰۳ | محتوای واقعی |
| `/adoption` | ۲ | ۳۸ | نازک ولی واقعی |
| `/pets` | ۰ | ۵۵ | **فقط هدر** |

**`/pets` تنها شکاف CI است.** نقصی که فقط روی پروفایل حیوان زنده
ظاهر شود اینجا گرفته نمی‌شود.

**`nearby_limit_audit.mjs` عمداً در CI نیست** — بک‌اند واقعی می‌خواهد.

### ۱۰.۲ بک‌اند — pytest

**۱۷۷ تابع تست در ۱۹ فایل**، روی `TestClient` به **دیتابیس واقعی** کانتینر.

```
test_otp.py              21    test_sources.py         15
test_otp_endpoints.py    17    test_kavenegar.py       14
test_sms.py              15    test_shop.py            12
test_catalog_regression  12    test_pricing.py         11
test_data_integrity.py    9    test_catalog_sync.py     9
test_social.py            8    test_recover.py          6
test_username_rules.py    5    test_reactions.py        5
test_ratelimit_ip.py      5    test_auth.py             4
test_adoption.py          4    test_assistant.py        3
test_ratelimit_shared.py  2
```

**`pytest` در `requirements-dev.txt` است، نه `requirements.txt`.**
سنجیده: `docker exec pawsmarket-backend-1 python -m pytest` →
`No module named pytest`. **عمدی** — تست‌ها در ایمیج تولید نیستند.

فایل `conftest.py` خودش توضیح می‌دهد که چرا: «pytest روی سرور تولید
یعنی کد تست هم آنجاست».

**یعنی ادعای «۱۸۷ پاس» را نمی‌توان روی این سرور راستی‌آزمایی کرد.**
۱۷۷ تابع تست شمارش شد؛ عدد اجرا تأیید نشد.

### ۱۰.۳ گیت‌های رفتارمحور

هر کدام **mutation-test شده‌اند** — یعنی با کد قدیمی، شکست می‌خورند:

| گیت | چه می‌سنجد | با کد قدیمی |
|---|---|---|
| `scroll_audit` | **فراخوانی** `scrollIntoView`، نه موقعیت استراحت | ۱ فراخوانی → شکست |
| `phone_theme_audit` | ارقام فارسی + اعتبارسنجی + تم | ۶ از ۸ شکست |
| `booking_guard_audit` | مسیر بسته وقتی id ناسازگار است | ۲ فیلد فرم → شکست |
| `map_audit` | پین‌های کیبوردپذیر | ۲ نقص واقعی پیدا کرد |
| `tab_order_audit` | نام در هر توقف، نه فقط وجود | ۱۱۵ توقف |

### ۱۰.۴ اصل «تست باید چیزی را ثابت کند»

از `REVIEW-FULL-E2E-2026-10-24`:

> نسخهٔ اول تست سفر **۱۷/۱۷ موفق** داد ولی تقریباً **هیچ‌چیز را ثابت
> نمی‌کرد**:
>
> ```js
> check(/کد|ثبت|ورود/.test(bodyText))   // یک خطای ۵۰۰ هم پاس می‌شد
> check(/سبد/.test(after))              // آیکون سبد همیشه هست
> ```

بازنویسی شد تا فقط وضعیتی را چک کند که **تنها با موفقیت عوض می‌شود**.

### ۱۰.۵ پوشش واقعی

| نوع | وضعیت |
|---|---|
| تایپ‌چک | ✅ CI |
| لینت | ✅ CI |
| دسترسی‌پذیری عمومی | ✅ CI |
| کنتراست عمومی | ⚠️ ۱۴۴ تخلف باز |
| E2E فرانت | ✅ `tests/e2e/` + ۱۵ اسکریپت `e2e_*.py` |
| تست بک‌اند | ✅ ۱۷۷ تابع (خارج از ایمیج) |
| **تست واحد فرانت** | ❌ **هیچ** |
| **روی دستگاه واقعی** | ❌ Chromium تنها |

**تست‌نشده در بک‌اند** (طبق بازبینی):
`?as=` ownership · media upload · توکن دسترسی پشتیبانی · کل روتر ادمین ·
کل درب پشتی · `is_public` · صفحه‌بندی کامنت · سقف ۲ گیگ · تراکنش‌بودن پذیرش سرپرستی

---

## ۱۱. ریسک‌ها

### ۱۱.۱ ریسک بالا — فروش کالایی که در دست نیست

۲۷۷ محصول فعال از بازارگاه مبدأ قیمت گرفته و با حاشیهٔ ~۱۰٪ فروخته
می‌شود. اگر کسی بخرد، **باید از بازارگاه مبدأ خرید و ارسال شود**.

**CRITICAL:** بخش ۶.۸ FR-8.9 — **هیچ انقضای زمانی وجود ندارد.** قیمت
ممکن است ساعت‌ها کهنه باشد. الگوریتم روزانه است ولی بین دو اجرا
می‌تواند منفی شود.

### ۱۱.۲ ریسک متوسط — سفارش بدون تأمین‌کننده

`products` ۷۸۲ ردیف بازنشسته دارد و `marketplace_products` ۲۷۷.
شفاف‌سازی: فروش فقط از دومی است. ولی اگر منبع قیمت بمیرد، `pinned`
محصول را زنده نگه می‌دارد در حالی که آفرش مرده — و تست
`test_marketplace_products_have_a_live_offer` را می‌شکند.

### ۱۱.۳ ریسک متوسط — ۴۴۷ مرکز بدون تأیید هویت

۵۶۹ مرکز (سند) / ۴۴۷ (زنده) از Google Maps و OSM جمع شده‌اند.
**هیچ‌کدام نگفته‌اند «بله، من هستم».** اگر کسی نوبت بگیرد و مرکز خبر
نداشته باشد، مشتری جلوی در بسته می‌ایستد.

سایت صادقانه نشان می‌دهد: نوبت تا تأیید مرکز «قطعی» نیست.

**زنده:** ۱ مرکز از ۴۴۷ داشبورد فعال دارد.

### ۱۱.۴ ریسک پایین — دستیار بدون مدل

۹ نیّت تعریف‌شده. سؤال خارج از آن‌ها → «مطمئن نیستم» → تیکت.
پشتیبانی ۲۴ساعته بدون آدم وجود ندارد.

### ۱۱.۵ ریسک پایین — نیمه‌به‌روز شدن

سه مسیر چندنوشتنی بدون تراکنش: همگام‌سازی کاتالوگ، checkout، تأیید ادعا.
هر سه با idempotency همگرا می‌شوند، نه با اتمیک‌بودن.

---

## ۱۲. شکاف‌ها و کارهای باز

### ۱۲.۱ مسدودکننده‌های محصول (نه کد)

| # | شکاف | لازم |
|---|---|---|
| G-1 | **مرچنت واقعی پرداخت** | ۱ روز کاری (انتظار تأیید درگاه) |
| G-2 | ۱ از ۴۴۷ مرکز داشبورد فعال دارد | ۱۰ کلینیک واقعی را فعال کنید |
| G-3 | تصمیم تأمین کالا | تصمیم کسب‌وکار |

**وضعیت پیکربندی زنده، سنجیده:**
```
ZIBAL_MERCHANT      = [zibal]     ← حساب تستی رسمی
ZARINPAL_MERCHANT_ID= []          ← خالی
SMS_PROVIDER        = [kavenegar]
ENV                 = [production]
REDIS_URL           = redis://redis:6379/0
CORS_ORIGINS        = https://pawsmarket.ir,https://www.pawsmarket.ir
ADMIN_BACKDOOR_PATH = yes (تنظیم شده)
ADMIN_CATALOG_KEY   = (تنظیم نشده)
TOROB_MCP_URL       = yes
KAVENEGAR_API_KEY   = yes
```

**یعنی هیچ پولی هرگز وارد نشده.** زبال روی درگاه تستی است و
`is_sandbox()` هرگز پرسیده نمی‌شود، پس یک پرداخت تستی یک سفارش واقعی
`paid` می‌سازد که از واقعی قابل تشخیص نیست.

### ۱۲.۲ کارهای فنی باز

| # | کار | مرجع |
|---|---|---|
| T-1 | وصل‌کردن شاخهٔ پیامکی `/recover` به `ForgotPasswordPage` | FR-3.10 |
| T-2 | `Add /set-password` تا حساب OTP رمز بگیرد | FR-3.13 |
| T-3 | کنتراست: ۱۴۴ → ۰ در مسیرهای عمومی | NFR-2.2 |
| T-4 | هیچ تست واحدی در فرانت نیست | ۱۰.۵ |
| T-5 | تست روی دستگاه واقعی انجام نشده | ۱۰.۵ |
| T-6 | `is_sandbox()` را صدا بزن | SEC-1 |
| T-7 | بررسی مبلغ در تأیید زبال | SEC-2 |
| T-8 | صفحه‌بندی کامنت: `ORDER BY ASC` با نشانگر `<` | FR-12.10 |
| T-9 | `is_public` را در پست/استوری/فالوور/پست‌تک اجرا کن | SEC-4 |
| T-10 | `TEMP_PASSWORD_MINUTES` را اجرا کن یا حذف کن | FR-3.13 |
| T-11 | کد مردهٔ `_recover_with_temp_password` را حذف کن | FR-3.14 |
| T-12 | مرز تراکنش برای سینک، checkout، تأیید ادعا | FR-9.8, 11.9, 19.8 |
| T-13 | `products_deactivated`/`products_pinned` را ذخیره کن | FR-9.9 |
| T-14 | تضاد `pinned` با تست آفر زنده | FR-9.10 |
| T-15 | `?as=` پروفایل: بی‌صدا نادیده گرفتن در برابر ۴۰۳ | FR-12.6 |
| T-16 | باگ ترجمهٔ اعتبارسنجی: «کاراکتر» برای یک عدد | §۱۳.۲ |
| T-17 | `POST /api/pets` احراز هویت و سقف | SEC-11 |
| T-18 | نرخ‌محدودی برای نوشتن‌های بدون محدودیت | FR-6.8 |
| T-19 | `orders_today` را در اسناد درست کن (Asia/Tehran) | ✅ هست |
| T-20 | شمارهٔ تماس: ۰ از ۴۴۷ در دیتابیس | §۵.۵ |
| T-21 | `purge_expired()` را زمان‌بندی کن | FR-4.18 |
| T-22 | کامنت «بدون پیشوند» در `main.py` را تصحیح کن | FR-17.1 |
| T-23 | docstring عمر کوتاه درب پشتی را تصحیح کن | FR-17.5 |
| T-24 | کامنت «یک worker» در compose را تصحیح کن | FR-6.10 |
| T-25 | اسناد «ترب مسدود» را تصحیح کن | FR-9.6 |

### ۱۲.۳ مغایرت حل‌شده که باید حل‌شده بماند

**`REVIEW-CATALOG-DB-MISMATCH-2026-10-19`** گزارش داده بود سایت از
`catalog.json` با ۷۶۱ مرکز می‌خواند و API از دیتابیس با ۲۱۸ — و همان
`id` در این دو، کسب‌وکار متفاوتی است. نتیجه: صفر از ۳۵۱ دکمهٔ نوبت به
کسب‌وکار درست نمی‌رسید.

**وضعیت کنونی:** `businessKey` (بخش ۴.۴) با تطبیق روی
`name|lat4|lng4` حلش کرده و `booking_guard_audit` در CI نگهبانش است.

**این را برنگردانید به تطبیق روی `id`.**

---

## ۱۳. پیوست

### ۱۳.۱ نگاشت اندپوینت‌ها — ۹۴ مسیر

**کاتالوگ** (`catalog.py`، بدون پیشوند)
```
GET  /health
GET  /api/pets                     radius · بدون سقف
POST /api/pets                     بدون احراز هویت
GET  /api/products                 410 Gone
GET  /api/products/nearby          max_distance · limit ≤1000
POST /api/products/sort
POST /api/products
GET/PUT/DELETE /api/products/{id}
GET  /api/stores/nearby            max_distance · limit ≤2000
```

**احراز هویت** (`/api/auth`)
```
POST /recover · /change-password · /register · /login · /logout
GET  /me · /username/available
POST /username
POST /otp/request · /otp/verify
```

**پروفایل** (`/api/pets`)
```
POST /profile
GET/PATCH /{id}
POST/DELETE /{id}/photos
GET  /{id}/stories
GET/POST /{id}/posts
```

**اجتماعی**
```
POST/DELETE /api/pets/{id}/follow
GET  /api/pets/{id}/followers · /following
GET  /api/feed
GET  /api/me/pets
GET  /api/discover/pets
GET  /api/posts/{id}
POST /api/posts
POST/DELETE /api/posts/{id}/like
GET/POST /api/posts/{id}/comments
```

**سرپرستی**
```
POST /api/pets/{id}/adoption-requests
GET  /api/pets/{id}/adoption-requests
GET  /api/me/adoption-requests
POST /api/adoption-requests/{id}/decision
```

**نوبت**
```
POST /api/bookings
GET  /api/bookings/mine
POST /api/bookings/{id}/cancel
GET  /api/bookings/manage/{token}
POST /api/bookings/manage/{token}/decision
GET  /api/store/dashboard/{token}
GET  /api/store/dashboard/{token}/week
POST /api/store/dashboard/{token}/booking/{id}/decision
GET  /api/admin/stores
POST /api/store/{id}/dashboard-link
```

**فروشگاه**
```
GET  /api/shop/products · /api/shop/products/{id}
GET/POST /api/shop/cart
PATCH/DELETE /api/shop/cart/{item_id}
POST /api/shop/checkout
GET  /api/shop/payment/callback/{gateway}
GET  /api/shop/orders · /api/shop/orders/{id}
```

**پشتیبانی**
```
POST /api/support/tickets
GET  /api/support/tickets · /{id}
POST /api/support/tickets/{id}/reply
GET/POST /api/support/tickets/access/{access}
GET  /api/support/admin/tickets · /{id}
POST /api/support/admin/tickets/{id}/reply · /status
```

**دستیار · ادعا · رسانه**
```
POST /api/assistant/ask
GET  /api/business/stores
POST /api/business/claims
GET  /api/admin/claims
POST /api/admin/claims/{id}/approve · /reject
POST /api/media
```

**ادمین**
```
POST /api/admin/migrate · /migrate-all · /catalog/replace · /sync
GET  /api/admin/catalog/stats
GET  /api/admin/overview · /users · /orders · /orders/{id} · /sync-runs
```

**درب پشتی**
```
POST /api/{secret_path}/enter
GET  /api/{secret_path}/attempts
```

### ۱۳.۲ باگ‌های واقعی که در این سند کشف شد

**۱. پیام اعتبارسنجی می‌گوید «کاراکتر» برای چیزی که عدد است.**

```
GET /api/stores/nearby?...&limit=5000
→ {"detail":"limit حداکثر 2000 کاراکتر می‌تواند باشد"}
```

`_translate_msg` الگوی `less than or equal to (\d+)` را می‌گیرد و برای
**هر** فیلدی «کاراکتر» می‌نویسد. `limit` یک عدد است. سنجیده.

**۲. `purpose` که enum است، «الزامی است» می‌گیرد.**

```
POST /api/auth/otp/request  {"phone":"09120000000"}
→ {"detail":"purpose الزامی است"}
```

`purpose` **داده نشده** بود، پس پیام درست است ولی گمراه‌کننده — کاربر
نمی‌داند مقدار مجاز چیست.

**۳. `q` سمت سرور نادیده گرفته می‌شود.**

سنجیده: ۴۴۷ ردیف با `q=دامپزشکی`، ۱۹۹ تا بدون کلمه. جستجو کلاینتی است.

**۴. صفحه‌بندی کامنت هرگز جلو نمی‌رود.** (FR-12.10)

**۵. `?as=` در پروفایل بی‌صدا نادیده گرفته می‌شود، در فالو ۴۰۳ می‌دهد.**
ناسازگاری، هرچند هر دو ایمن‌اند.

### ۱۳.۳ نگاشت فایل

**فرانت — ۲۷ مسیر**
```
/                    HomePage              /bookings          MyBookingsPage
/explore             ExplorePage           /booking/:storeId  BookingPage
/add                 AddPage               /booking/manage/:t BookingManagePage
/register /login     AuthCard              /store/dashboard/:t StoreDashboardPage
/forgot              ForgotPasswordPage    /support           SupportPage
/welcome             CompleteSignupPage    /support/ticket/:a TicketAccessPage
/me                  MyAccountPage         /for-business      ForBusinessPage
/shop /shop/:id      ShopPage              /admin/login       AdminLoginPage
/cart                CartPage              /admin             AdminPage
/order/result        OrderResultPage       /admin/stores      AdminStoresPage
/pets /adoption      PetsDiscoverPage      /admin/support     AdminSupportPage
/pet/:id             PetProfilePage        /:secret/enter     SecretAdminPage
/pet/:id/followers   FollowListPage        *                  NotFoundPage
/feed                FeedPage
```

**فرانت — کتابخانه‌ها**
```
lib/api.ts        710   کشف، businessKey، appendNew، حالت ایستا
lib/social-api.ts 419   احراز هویت، فالو، فید، کامنت
lib/admin-api.ts  219
lib/booking-api.ts120
lib/shop-api.ts   109
lib/taxonomy.ts   216
lib/search.ts           applyFilters — جستجوی کلاینتی
lib/motion.ts     170   توکن‌های انیمیشن
```

**بک‌اند — ۱۰٬۷۶۷ خط**
```
app/routers/accounts.py   696    app/ratelimit.py         388
app/routers/bookings.py   481    app/routers/shop.py      450
app/routers/admin.py      446    app/providers/sources.py 458
app/routers/assistant.py  284    app/catalog_sync.py      279
app/routers/support.py    277    app/providers/payments.py253
app/routers/follows.py    235    app/routers/profiles.py  229
app/routers/catalog.py    224    app/otp.py               222
app/routers/claims.py     209    app/schemas.py           203
app/routers/backdoor.py   190    app/security.py          141
app/db.py                 133    app/main.py              157
app/providers/kavenegar.py214    app/providers/sms.py     200
```

**مهاجرت‌ها — ۱۷ فایل** (`0002` تا `0018`) + `init.sql`

**اسکریپت‌ها — ۱۰۵ فایل**

---

## ضمیمهٔ الف — بیانیهٔ صحت

هر عدد یکی از این سه منبع را دارد:

| منبع | نمونه |
|---|---|
| **خوانده‌شده از فایل** | ۲۷٬۱۲۱ خط TS · ۶٬۹۴۵ خط Python · ۱۷۷ تست · ۹۴ اندپوینت · ۳۰ جدول |
| **سنجیده روی سیستم زنده** | ۴۴۷ مرکز · ۲۷۷ محصول · ۰ پرداخت · ۴۲۹ در درخواست ۲۴ · ۶۰ آفر در سینک |
| **نقل از سند** | ۰٫۰۹۵ → ۰٫۰۰۰ CLS · ۴۳۱ از ۴۴۷ دو-بار |

**چهار ادعای اسناد قبلی که در این سند تصحیح شد:**

| ادعا | واقعیت |
|---|---|
| «بک‌اند در این مخزن نیست» | هست، روی همان سرور، `Up 3 days healthy` |
| «ترب مسدود است» | **کار می‌کند** — ۲۰ کوئری، ۶۰ آفر، صفر شکست |
| «۰ از ۵۶۹ داشبورد» | ۱ از ۴۴۷ |
| «pytest ۱۸۷ پاس» | ۱۷۷ تابع شمارش شد؛ pytest در ایمیج نیست، اجرا تأیید نشد |

جایی که عددی نداشتم، ننوشتم. **حدس به‌عنوان اندازه‌گیری ارائه نشده.**

---

## ضمیمهٔ ب — چهار قاعده‌ای که این پروژه گران یاد گرفت

**۱. تست باید چیزی را ثابت کند.**
یک تست سبز که یک خطای ۵۰۰ هم پاس می‌کند، بدتر از نبودنش است.
`REVIEW-FULL-E2E` این را با «۱۷/۱۷ موفق ولی بی‌ارزش» ثبت کرده.

**۲. توصیف کتبی از یک چیز، دربارهٔ شکل آن ساکت است.**
چهار تلاش برای کشیدن یک نشانهٔ شهری شکست خورد چون از توصیف کشیده شد؛
پنجمی با اندازه‌گیری روی عکس درست شد. همین در قیمت، فاصله، و CLS هم
صادق است.

**۳. اندازه‌گیری را در مقیاسی بگیر که نقص در آن دیده شود.**
پیش‌نمایش آیکون در اندازهٔ نهایی، سه دراف شکسته را قبول کرده بود.

**۴. سند کهنه، خطرناک‌تر از سند نبودن است.**
«ترب مسدود است» سه سند را آلوده کرده بود و هیچ‌کس دوباره نسنجیده بود.
هر ادعای وضعیت باید تاریخ داشته باشد و بعد از آن تاریخ دوباره سنجیده
شود، وگرنه تبدیل به افسانه می‌شود.
