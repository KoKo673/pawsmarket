# موج سوم — پوشش کامپوننت‌محور + ابزارهای سنجش + آماده‌سازی VPS

> این متن را در سشن پزمارکت پیست کنید.

---

## چرا موج سوم

موج ۱ خط لولهٔ build را دید. موج ۲ سطح محصول را دید (۹ روتر بک‌اند،
‏۱۲ صفحهٔ فرانت، امنیت، صحت). **ولی یک شکاف ساختاری مانده:**

نقشهٔ موج ۲ «۱۲ صفحه × ۸ چک» بود — یعنی کامپوننت‌هایی که زیر صفحات‌اند
و مشترک استفاده می‌شوند هرگز ستون نداشتند. اعداد واقعی:

```
src/components/   →  ۴۰ فایل، ~۵٬۱۸۵ خط
تست‌شده در موج ۲   →  ~۱۰ فایل (فقط آن‌هایی که صفحهٔ اختصاصی داشتند)

بزرگ‌ترین‌های تست‌نشده:
  473 خط  explore/MapView.tsx           ← بزرگ‌ترین کامپوننت پروژه
  340 خط  forms/steps.tsx
  318 خط  explore/FilterSidebar.tsx
  301 خط  forms/AddListingWizard.tsx
  261 خط  explore/ListingCard.tsx
  255 خط  layout/Navbar.tsx             ← جزئی (key route)
  243 خط  detail/DetailModal.tsx
  194 خط  detail/StatsGrid.tsx
  192 خط  home/Hero.tsx
  183 خط  social/StoryBar.tsx
  183 خط  auth/AuthCard.tsx
```

**و نقطهٔ کور اصلی: `MapView.tsx`.** Leaflet، ۴۷۳ خط، در Explore و
PetsDiscover استفاده می‌شود، و هیچ تست رفتاری از آن نداریم — نه با صفر
نشان، نه در موبایل، نه با RTL، نه با از دست دادن GPS.

---

## تصمیم‌های شما (ثبت‌شده — از این‌ها عبور نکن)

| # | تصمیم | یعنی چه |
|---|---|---|
| ۱ | **همه‌چیز تومان** | واحد پول در کل سیستم تومان. هیچ ریالی، هیچ نمایش مردد |
| ۲ | **مایگریشن ۰۰۰۷ لازم است** | فراداده از TS به DB منتقل شود (جزئیات پایین) |
| ۳ | **Railway می‌ماند** | فعلاً برای توسعه و تست. **به‌زودی روی VPS واقعی** |

## تصمیم ۱ — تومان: وضعیت فعلی

راستی‌آزمایی کردم. خبر خوب: **تبدیل از قبل درست است.**

```python
# scripts/fetch_digikala.py:111
# The API quotes Rial; the catalog is in Toman.
toman = int(rial) // 10
if toman < 10_000:   # implausible after the conversion
    return None
```

و نمایش هم درست:

```ts
// src/lib/fa.ts:19
new Intl.NumberFormat('fa-IR').format(value)   // → «۲٬۹۵۰٬۰۰۰»
```

پس کار لازم نیست — فقط باید **قفل شود** تا کسی سهواً ریال اضافه نکند:

- در `0007` نام ستون را `price_toman` بگذار (نه `price`) — خودش سند است
- یک تست اضافه کن: هر قیمت در API باید ≤ ۱۰۰میلیون باشد (بالاتر از آن
  یعنی ریال آمده). این تلهٔ رایج تبدیل دوباره را می‌گیرد
- در `CLAUDE.md` یا `AGENTS.md` پروژه یک خط: «همهٔ قیمت‌ها تومان هستند،
  در DB و API و UI. منبع اکسترنال اگر ریال بود، تقسیم بر ۱۰.»

## تصمیم ۲ — مایگریشن ۰۰۰۷: چه چیزی و چرا

**مسئله:** فرادادهٔ فروشگاه‌ها دو جا زندگی می‌کند و هیچ‌کدام پایدار نیست:

```
src/data/shops.ts          → phone, category, opensAt, closesAt,
                             image, categories, rating, reviewCount   (۲۵۸KB)
src/data/shops-detail.ts   → description, website                      (۳۰۸KB)
src/data/products.ts       → rating, priceLow30d, digikalaPrice, …    (۲۶۷KB)
```

این‌ها **دادهٔ محصولی** هستند که در باندل جاوااسکریپت نشسته‌اند. یعنی:
کاربر در ایران ۸۳۳KB فراداده دانلود می‌کند که فقط بخشی‌اش را می‌بیند؛
DBA نمی‌تواند تلفن اشتباه را بدون deploy عوض کند؛ و API هیچ‌وقت
نمی‌تواند فیلتر «فقط کلینیک‌های باز» بسازد چون `opensAt` در DB نیست.

**راه‌حل: ستون‌ها به DB بروند، API منبع حقیقت شود.**

### طرح `0007_store_metadata.sql`

```sql
-- 0007: فرادادهٔ فروشگاه از باندل جاوااسکریپت به دیتابیس.
--
-- چرا: این فیلدها در src/data/shops.ts و shops-detail.ts زندگی می‌کردند —
-- یعنی ۵۶۶KB دادهٔ محصولی داخل باندل. با این مایگریشن، API تنها منبع
-- حقیقت می‌شود، DBA می‌تواند بدون deploy عوض کند، و صفحهٔ اول فقط
-- چند ستون سبک می‌گیرد.
--
-- همه افزودنی (IF NOT EXISTS) — روی دیتابیس موجود بی‌خطر است.

BEGIN;

ALTER TABLE stores ADD COLUMN IF NOT EXISTS phone          TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS opens_at       TEXT;   -- '09:00'
ALTER TABLE stores ADD COLUMN IF NOT EXISTS closes_at      TEXT;   -- '21:00'
ALTER TABLE stores ADD COLUMN IF NOT EXISTS website        TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS image          TEXT;   -- مسیر یکی از عکس‌ها
ALTER TABLE stores ADD COLUMN IF NOT EXISTS scope          TEXT[]; -- «پانسیون سگ»، «واکسیناسیون»
ALTER TABLE stores ADD COLUMN IF NOT EXISTS rating         NUMERIC(2,1);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS review_count   INTEGER;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS description    TEXT;   -- از shops-detail

-- محصولات
ALTER TABLE products ADD COLUMN IF NOT EXISTS rating          NUMERIC(2,1);
ALTER TABLE products ADD COLUMN IF NOT EXISTS rating_count    INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_low_30d   NUMERIC(12,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_high_30d  NUMERIC(12,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS digikala_price  NUMERIC(12,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_pct    NUMERIC(5,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS seller          TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_url     TEXT;

-- ایندکس‌هایی که کوئری واقعی لازم دارد (نه حدس)
CREATE INDEX IF NOT EXISTS idx_stores_scope    ON stores USING GIN (scope);
CREATE INDEX IF NOT EXISTS idx_stores_rating   ON stores (rating DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_products_rating ON products (rating DESC NULLS LAST);

COMMIT;
```

**نام ستون‌ها به عمد `price_low_30d` (اسنیک) — نه camelCase**؛ چون
PSQL حساس نیست ولی `priceLow30d` در کوئری باید quote شود و کسی یادش
می‌رود. API در لایهٔ serialize تبدیل می‌کند.

### طرح `scripts/push_metadata.py`

اسکریپتی که همان فایل‌های TS را می‌خواند و به DB می‌ریزد:

- `shops.ts` → `UPDATE stores SET phone=… , opens_at=… WHERE name = …`
- `shops-detail.ts` → `UPDATE stores SET description=…, website=…`
- `products.ts` → `UPDATE products SET rating=… WHERE name = …`
- **idempotent**: اجرای دوباره بی‌خطر (فقط UPDATE)
- **dry-run پیش‌فرض**: بدون `--execute` فقط می‌گوید چند ردیف تطبیق شد
- **گزارش عدم‌تطبیق**: اسمی که در DB نیست (تفاوت نقل‌قول/نیم‌فاصله) را
  چاپ کند — انتظار می‌رود ~۱٪ عدم تطبیق باشد؛ اگر بیشتر بود بایست

### سپس (فاز دوم همین مایگریشن)

بعد از اینکه داده در DB نشست و تست‌ها سبز ماندند:

1. `toStoreListing` در `api.ts` مقدار را از `raw.phone` بخواند (الان
   `meta?.phone ?? str(raw.phone, '')`)
2. اندپوینت `/api/stores/{id}` را گسترش بده که `description` هم بدهد
3. `shops.ts` و `shops-detail.ts` → حذف از باندل. اگر لازم شد،
   `catalog.json` (که همین حالا ۷۶۱ فروشگاه دارد) fallback آفلاین باشد
4. تست: باندل اولیه باید حداقل **۵۰۰KB دیگر** کم شود

**قیود:**
- `catalog.json` **حذف نشود** مگر وقتی که fallback جایگزین آماده است —
  قطعی Railway = سایت خالی، و این ریسک را قبلاً دیدیم
- هر سه مرحله با کامیت جدا؛ اگر هر کدام برگشت‌پذیر نبود، نگه‌دار قبلش

## تصمیم ۳ — آماده‌سازی VPS

مسیر فعلی: GitHub Pages (فرانت) + Railway (DB) + پروکسی TCP بسته.
مقصد: یک VPS با Docker.

این **سوئیچ بزرگ** است انجام نده — ولی موج سوم باید **بستر** را بسازد:

### کارهایی که همین حالا مفیدند (بدون سوئیچ)

1. **`docker-compose.prod.yml`** — نسخهٔ تولیدی با:
   - `backend` (بدون `--reload`، با چند worker؟ *نه* — rate limiter
     in-memory است، یک worker بمان تا Redis اضافه شود)
   - `frontend` (فقط فایل‌های `dist`، نه vite dev)
   - `nginx` (ریورس‌پروکسی: `/` → فرانت، `/api` → بک‌اند، `/media` → volume)
   - `db` (PostGIS، volume نام‌دار)
   - **هیچ پورتی جز ۸۰/۴۴۳ به بیرون** — بک‌اند `expose` نه `ports`

2. **`nginx.conf`** با چیزهایی که در VPS لازم است:
   `gzip`/`brotli`، `client_max_body_size 6m` (برای آپلود ۵MB)،
   هدر امنیتی، و `try_files … /index.html` برای SPA

3. **`.env.production.example`** — فهرست *کامل* متغیرها با توضیح:
   `POSTGRES_*`، `MEDIA_DIR`، `ADMIN_KEY`، `TRUST_PROXY=1` (پشت nginx
   باید روشن باشد وگرنه rate limit همه را یک IP می‌بیند)،
   `CORS_ORIGINS`، `MEDIA_MAX_BYTES`

4. **`scripts/backup_db.sh`** — `pg_dump` روزانه با نگه‌داشت ۷ نسخه.
   روی VPS حیاتی است؛ Railway خودش backup دارد ولی خودت خواهی داشت

5. **`Dockerfile` را بازبینی کن**: قبلاً `COPY . .` دارد؟ اگر بله،
   `.dockerignore` بنویس تا `node_modules`، `dist`، `.git`،
   `scripts/*.json` داخل ایمیج نروند

6. **`HEALTHCHECK`** به هر سرویس: بک‌اند `/health` دارد (تست شد)،
   فرانت یک فایل `healthz`، و nginx به هر دو

7. **`MEDIA_DIR` روی volume نام‌دار** — الان روی `./media` نسبی است
   که با هر rebuild پاک می‌شود. روی VPS این یعنی از دست دادن همهٔ
   عکس‌های آپلودی

**هیچ‌کدام از این‌ها به VPS وصل نمی‌شود** — فقط فایل‌ها آماده می‌شوند.
سوئیچ خودش یک کار جدا با تصمیم شماست.

---

## مرحله‌های موج سوم

### مرحله ۱ — ابزارهای سنجش (اول این، چون بقیه به آن نیاز دارد)

هر سه نصب می‌شوند — npm در دسترس است (تست شد، PONG در ۵۳۹ms):

```
npm i -D lighthouse @axe-core/cli
npm i -D playwright && npx playwright install chromium
```

بعد:

1. **`scripts/a11y_audit.mjs`** — axe روی ۸ مسیر اصلی
   (`/`, `/explore`, `/explore?preset=vets`, `/pets`, `/adoption`, `/feed`,
   `/bookings`, `/account`)، خروجی JSON + خلاصهٔ فارسی. صفر violation جدی
   (`critical`+`serious`) هدف است.

2. **`scripts/lighthouse_audit.mjs`** — روی همان ۸ مسیر، موبایل و دسکتاپ.
   اهداف عددی (بر پایهٔ بودجه‌ای که پروژه خودش دارد):
   ```
   Performance      ≥ 90
   Accessibility    ≥ 95
   LCP              < 2.5s
   CLS              < 0.1
   INP              < 200ms
   ```
   خروجی: جدول با اعداد — نه قضاوت. اگر ردیفی کمتر بود، **عدد را گزارش
   بده**، بعد ببین علتش چیست.

3. **`scripts/screen_reader_smoke.md`** — چون NVDA خودکار نیست، یک
   چک‌لیست دستی دقیق برای ۵ مسیر اصلی: ترتیب tab، اعلام متن‌ها،
   حالت خالی، مودال. اگر کاربر NVDA دارد اجرا می‌کند؛ اگر نه، می‌ماند
   `NOT_TESTED` ولی حداقل روالش ثبت شده.

**نکتهٔ iOS/Safari:** در دسترس نیست، پس `NOT_TESTED` می‌ماند. ولی
می‌توانی با Playwright روی WebKit تست کنی (`npx playwright install webkit`) —
کاملاً iOS نیست ولی خیلی نزدیک‌تر از Chrome است. اگر webkit نصب شد،
۶ مسیر اصلی را رویش بزن و گزارش بده.

### مرحله ۲ — کامپوننت‌های بزرگ (هستهٔ موج سوم)

برای هرکدام از ۱۱ کامپوننت بالای ۱۵۰ خط، **۶ چک**:

```
□ حالت خالی — بدون داده چه می‌بینم؟
□ حالت خطا — API قطع → پیام درست؟ retry دارد؟
□ موبایل ۳۹۰px — بدون overflow افقی؟ اهداف ≥۴۴px؟
□ RTL — اعداد، مخلوط فارسی/انگلیسی، جهت‌ها درست؟
□ کیبورد — همه چیز tab-able؟ focus visible؟ Escape بسته می‌شود؟
□ reduced-motion — انیمیشن‌ها خاموش می‌شوند؟
```

**اولویت از بالا:**

1. `MapView.tsx` (۴۷۳) — **بزرگ‌ترین، و نادیده‌ترین.** تست‌های خاصش:
   GPS رد شد (کاربر «نه» بزند) · دیتابیس خالی از مختصات ·
   clamp شدن به مرز تهران · pinch/zoom روی لمسی · marker با اسم فارسی
2. `steps.tsx` (۳۴۰) — فرم چندمرحله‌ای: برگشت به عقب، داده حفظ می‌شود؟
3. `FilterSidebar.tsx` (۳۱۸) — با اسلایدر قیمت به تومان: مرزها، reset
4. `AddListingWizard.tsx` (۳۰۱) — اعتبارسنجی هر مرحله، آپلود عکس
5. `ListingCard.tsx` (۲۶۱) — چهار نوع کارت (pet/product/store/adoption)
6. `DetailModal.tsx` (۲۴۳) — کلاً lazy شد؛ حالا محتوایش هم باید تست شود
7. بقیه (Hero، StoryBar، AuthCard، StatsGrid، Navbar)

هر باگ: فایل:خط + شاهد + رفع + تست مجدد با عدد.

### مرحله ۳ — هشدارهای lint + N+1

```
۸ هشدار باقی‌مانده:
  3× refs              → MapView? CategoryGrid?
  2× only-export-components  → button.tsx, steps.tsx
  2× exhaustive-deps   → BookingPage
  1× use-memo          → BookingPage
```

هیچ‌کدام `set-state-in-effect` نیستند (آن صفر شد). این‌ها کیفیت‌اند نه
باگ — ولی چون خواستهٔ شما «پروژهٔ حرفه‌ای» است، صفرشان کن. هر کدام
یک کامیت.

و **N+1 در `MyAccountPage`**: `discover` + `getProfile` به‌ازای هر پت =
۶ درخواست برای ۵ پت. راه‌حل بک‌اند: `/api/me/pets` که پت‌ها را با
آمارشان در یک کوئری برگرداند.

### مرحله ۴ — آماده‌سازی VPS (فایل‌ها بالا)

هفت فایل بخش تصمیم ۳. هیچ‌کدام deploy نمی‌شود.

### مرحله ۵ — اجرای هر سه سنجه و جدول نهایی

بعد از مراحل ۱–۴، دوباره اجرا کن: axe، Lighthouse، WebKit. جدول:

```
مسیر              axe(crit)  LCP   CLS   INP   A11y  Perf
/                 0          …     …     …     …     …
/explore          …
```

هر عدد که هدف را رد کرد: علت + رفع + عدد جدید. اگر علت خارج از دسترس
(شبکهٔ ایران، Railway، محدودیت ابزار) بود، صریح بنویس.

---

## استانداردهای گزارش (همان که تا حالا بود — این‌ها را حفظ کن)

- **عدد، نه صفت.** «۹ هشدار» نه «هشدارها کم شد». «LCP 2.1s» نه «سریع بود».
- **شاهد از شبکه/دیسک.** بیلد، `git log -S`، خروجی curl — نه حافظه.
- **`NOT_TESTED` صادقانه.** هر چه تست نشد، همان‌طور بماند.
- **تفکیک باگ کد از باگ شاهد.** قبلاً در تست فید این را درست انجام دادی.
- **یک کامیت در هر تغییر.** برگشت ساده‌تر.
- **هر ساعت یک گزارش کوتاه.** نه مونولیت — سشن قبلی به‌خاطر حجم context کرش کرد.
  **گزارش‌ها را در فایل بنویس** (`REVIEW-WAVE3-REPORT.md` و به‌روزش کن)،
  نه فقط در چت. چت سنگین می‌شود و context می‌خورد.

## محدودیت‌ها — دست نزن

- `catalog.json` تا وقتی fallback آماده نشده (تصمیم ۲ فاز ۲)
- فونت متغیر self-hosted
- سه چیز که هنوز `NOT_TESTED` است: screen reader واقعی، iOS واقعی، بار همزمان
- Railway تا اعلام سوئیچ

## شروع کن

از **مرحله ۱ (نصب ابزارها)** شروع کن. هدف این مرحله یک عدد است:
اولین جدول axe و Lighthouse روی ۸ مسیر. بعد از آن موج سوم واقعاً شروع
می‌شود، چون دیگر حدس نمی‌زنیم — می‌سنجیم.
