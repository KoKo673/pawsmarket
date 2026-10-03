# پازمارکت — پلتفرم اجتماعی حیوانات خانگی — طرح فنی

تاریخ: ۲۰۲۶-۱۰-۰۳ (2026-10-03) · وضعیت: در انتظار بازبینی نهایی مالک محصول
دامنه: بک‌اند `serverdash` (FastAPI + PostGIS) + فرانت `pawsmarket` (Vite/React)

---

## ۱. هدف و معیار موفقیت

ساخت شبکه‌ی اجتماعی حیوانات خانگی به‌سبک اینستاگرام/تلگرام: هر حیوان یک **پروفایل** دارد، می‌تواند عکس/لحظه منتشر کند، حیوانات دیگر را **دنبال** کند و فید ببیند؛ به‌علاوه بخش **واگذاری/سرپرستی** متصل به همان پروفایل.

**تصمیم‌های تاییدشده‌ی مالک محصول:**
- داده‌ها **سمت سرور** (PostGIS موجود + جدول‌های جدید).
- احراز هویت: **نام کاربری + رمز عبور**، با کیفیت «محصول واقعی».
- اجرا به‌صورت **فازبندی‌شده**: A (هسته) → B (استوری/لایک/کامنت) → C (واگذاری).

**معیار موفقیت:**
1. همه‌ی endpointهای موجود کاتالوگ — `GET /api/pets`، `GET /api/products`، `GET /api/products/nearby`، `POST /api/products/sort`، `POST /api/products`، `GET|PUT|DELETE /api/products/{id}`، `POST /api/pets`، `GET /api/stores/nearby` — بدون هیچ تغییر رفتاری پاسخ دهند (تست رگرسیون).
2. ثبت‌نام/ورود/خروج واقعی و تست‌شده با نشست سروری.
3. جریان کامل: ثبت‌نام → ساخت پروفایل حیوان → انتشار لحظه → دنبال‌کردن → دیدن در فید.
4. کل UI فارسی/RTL، موبایل‌محور، بدون خطای کنسول، با سیستم motion موجود.
5. تست‌های pytest سبز + بازبینی کاربرمحور مرورگری (طبق اسکیل browser-use).

---

## ۲. معماری

### ۲.۱ بازیابی سورس بک‌اند (پیش‌نیاز فاز A)
سورس فعال FastAPI فقط داخل ایمیج است و دایرکتوری compose روی هاست وجود ندارد.

- سورس `/app` کانتینر `serverdash-backend-1` → استخراج به `office/serverdash/` روی هاست.
- `git init` + کامیت اولیه (نسخه‌بندی از این لحظه).
- `docker-compose.yml` جدید با **bind-mount** (`./app:/app/app`) و `uvicorn --reload`.
- **همان** نام پروژه‌ی compose (`serverdash`)، همان نام سرویس‌ها و همان volume (`serverdash_dbdata`) → دیتای فعلی دست‌نخورده می‌ماند. نام سرویس `database` باید حفظ شود تا `PGHOST=database` کار کند.
- سرویس‌های `frontend` و `worker` در کامپوز جدید حذف می‌شوند؛ PawsMarket به آن‌ها وابسته نیست (nginx و worker بلااستفاده‌اند).

### ۲.۲ ساختار ماژولار بک‌اند (بازسازی نمی‌کنیم، تفکیک می‌کنیم)
```
serverdash/
├── app/
│   ├── main.py            # FastAPI app + CORS + ثبت routerها
│   ├── db.py              # run_query موجود (psycopg2, RealDictCursor)
│   ├── security.py        # PBKDF2-HMAC-SHA256 + توکن جلسه (کتابخانه استاندارد)
│   ├── schemas.py         # Pydantic models (موجود + جدید)
│   └── routers/
│       ├── catalog.py     # products/stores/pets — عیناً رفتار فعلی
│       ├── accounts.py    # ثبت‌نام/ورود/خروج/me
│       ├── profiles.py    # پروفایل حیوان + گالری + لحظات
│       ├── follows.py     # دنبال‌کردن + فید + کشف
│       ├── media.py       # آپلود تصویر (volume + استاتیک)
│       └── adoption.py    # فاز C
├── migrations/
│   ├── 0001_init.sql      # اسکیمای فعلی (برای مستندسازی)
│   └── 0002_social.sql    # جدول‌های جدید (IF NOT EXISTS)
├── tests/                 # pytest
├── Dockerfile             # موجود، بدون تغییر بنیادی
├── docker-compose.yml     # جدید: bind-mount + reload
└── requirements.txt       # فقط: fastapi, uvicorn, psycopg2-binary, pydantic (بدون افزونه‌ی جدید)
```
همه‌ی مسیرها زیر `/api` می‌مانند (پراکسی فرانت موجود).

### ۲.۳ مرزها
- **در محدوده:** بک‌اند لوکال داکر + فرانت pawsmarket.
- **خارج از محدوده:** استقرار عمومی بک‌اند روی اینترنت؛ بازیابی رمز با ایمیل (SMTP نداریم)؛ OTP پیامکی.
- نسخه‌ی منتشرشده‌ی GitHub Pages فعلاً فقط کاتالوگ استاتیک دارد و قابلیت‌های اجتماعی روی آن فعال نیست (همان تفکیک فعلی).

---

## ۳. مدل داده (migration: `0002_social.sql`)

همه با `IF NOT EXISTS`؛ افزونه‌ی `pg_trgm` برای جست‌وجوی نرم فارسی (در ایمیج PostGIS موجود است).

### users
| ستون | نوع | توضیح |
|---|---|---|
| id | serial PK | |
| username_lower | text UNIQUE NOT NULL | کلید یکتایی (case-insensitive) |
| username | text NOT NULL | نمایشی (با حروف اصلی) |
| password_hash | text NOT NULL | قالب `pbkdf2_sha256$<iter>$<salt_b64>$<hash_b64>` |
| display_name | text | |
| bio | text | |
| avatar_url | text | |
| email | text UNIQUE NULL | فقط رزرو برای آینده؛ در v1 استفاده نمی‌شود |
| is_active | boolean NOT NULL DEFAULT true | |
| created_at | timestamptz NOT NULL DEFAULT now() | |

### sessions
| ستون | نوع | توضیح |
|---|---|---|
| token_hash | text PK | sha256 توکن خام — توکن خام هرگز ذخیره نمی‌شود |
| user_id | int FK users(id) ON DELETE CASCADE | |
| created_at | timestamptz NOT NULL DEFAULT now() | |
| expires_at | timestamptz NOT NULL | ۳۰ روز پس از ایجاد |
| user_agent | text | |

### pet_profiles (۱:۱ با pets)
| ستون | نوع | توضیح |
|---|---|---|
| pet_id | int PK FK pets(id) ON DELETE CASCADE | |
| owner_id | int NOT NULL FK users(id) | |
| bio | text | |
| avatar_url | text | |
| cover_url | text | |
| birth_date | date NULL | |
| gender | text NULL | `male`/`female` |
| is_public | boolean NOT NULL DEFAULT true | |
| adoption_status | text NULL | `available` یا NULL |
| adoption_note | text NULL | |
| created_at | timestamptz NOT NULL DEFAULT now() | |

### pet_photos
`id serial PK`, `pet_id FK pets ON DELETE CASCADE`, `url text NOT NULL`, `caption text`, `position int NOT NULL DEFAULT 0`, `created_at`. فهرست `BTREE(pet_id, position)`.

### follows  (گراف حیوان→حیوان)
`follower_pet_id int FK pets ON DELETE CASCADE`, `followee_pet_id int FK pets ON DELETE CASCADE`, `created_at`, PK(follower, followee), CHECK(follower != followee). ایندکس `BTREE(followee_pet_id)`.

### posts  (لحظات و پست‌ها)
`id serial PK`, `author_user_id FK users ON DELETE CASCADE`, `pet_id FK pets NULL`, `kind text NOT NULL CHECK (kind IN ('post','story'))`, `text text`, `images jsonb NOT NULL DEFAULT '[]'`, `like_count int NOT NULL DEFAULT 0`, `created_at`, `expires_at timestamptz NULL` (استوری = now()+24h). ایندکس‌ها: `BTREE(pet_id, created_at DESC)`، `BTREE(created_at DESC)`، جزئی روی `expires_at WHERE expires_at IS NOT NULL`.

### likes (فاز B)
PK(`post_id`, `user_id`)، `created_at`. تریگر به‌روزرسانی `posts.like_count`.

### comments (فاز B)
`id`, `post_id FK ON DELETE CASCADE`, `user_id FK`, `text NOT NULL`, `created_at`. ایندکس `(post_id, created_at)`.

### adoption_requests (فاز C)
`id`, `pet_id FK`, `user_id FK` (متقاضی), `message text`, `status text NOT NULL DEFAULT 'pending' CHECK IN ('pending','accepted','rejected')`, `created_at`. یکتایی `(pet_id, user_id)`.

### ایندکس‌های مکانی
`GIST(pets.location)` اگر وجود ندارد اضافه شود (اگر هست، رد شود).

---

## ۴. طراحی API

احراز هویت: `Authorization: Bearer <token>`. خطا یکنواخت: `{"detail":"<پیام فارسی>"}`.

### ۴.۱ accounts
| متد/مسیر | ورودی → خروجی | قواعد |
|---|---|---|
| POST /api/auth/register | {username, password, display_name?} → {token, user} | یوزرنیم `^[a-z0-9_]{3,24}$` (lower)، رمز ≥۸؛ تکراری → ۴۰۹ «این نام کاربری قبلاً گرفته شده»؛ محدودیت نرخ درون‌حافظه ۵/دقیقه/IP |
| POST /api/auth/login | {username, password} → {token, user} | مقایسه‌ی زمان‌ثابت؛ پیام یکسان برای «کاربر نیست» و «رمز غلط» (۴۰۱) |
| POST /api/auth/logout | — → {ok:true} | حذف همان نشست |
| GET /api/auth/me | — → {user} | ۴۰۱ با پیام «نشست شما منقضی شده؛ دوباره وارد شوید» |

### ۴.۲ پروفایل حیوان
| متد/مسیر | توضیح |
|---|---|
| POST /api/pets/profile | {name, species, bio?, birth_date?, gender?, lat, lng} → {pet, profile}; ثبت‌کننده مالک می‌شود |
| GET /api/pets/{id} | پروفایل کامل: pet + profile + gallery + counts(followers/following/posts) + is_following + is_owner؛ اگر حیوان پروفایل اجتماعی نداشته باشد → ۴۰۴ با پیام «این حیوان هنوز پروفایل اجتماعی ندارد» |
| PATCH /api/pets/{id} | ویرایش فیلدهای مجاز (bio/avatar/cover/birth_date/gender/is_public/adoption_status/adoption_note)؛ فقط مالک (۴۰۳) |
| POST /api/pets/{id}/photos | {url, caption?} → photo؛ position خودکار (۰=کاور)؛ فقط مالک |
| DELETE /api/pets/{id}/photos/{photo_id} | فقط مالک؛ در صورت حذف کاور، positionها بازچینش می‌شوند |
| GET /api/pets/{id}/posts?before&limit | صفحه‌بندی cursor: `{items, next_before}` |

### ۴.۳ اجتماعی
| متد/مسیر | توضیح |
|---|---|
| POST /api/pets/{id}/follow · DELETE | idempotent؛ فقط حیوانِ کاربر؛ خوددنبال‌کردن → ۴۰۰؛ خروجی {following, followers} |
| GET /api/pets/{id}/followers · /following | cursor |
| GET /api/feed?before&limit | پست‌های حیواناتِ دنبال‌شده + خودِ حیوان کاربر؛ ورود الزامی |
| GET /api/discover/pets?lat&lng&radius&before | ST_DWithin + ST_Distance مرتب؛ عمومی |
| POST /api/posts | {text, images[], pet_id?, kind?} → post؛ اگر kind=story → expires_at=now()+24h |
| GET /api/posts/{id} | تک‌پست + liked_by_me |

### ۴.۴ مدیا
| متد/مسیر | توضیح |
|---|---|
| POST /api/media | multipart یک فایل تصویر (حداکثر ۵MB؛ jpeg/png/webp) → {url:"/media/<name>"}؛ ذخیره در volume `serverdash_media`؛ FastAPI استاتیک سرو می‌کند |
| (فاز B) POST /api/posts/{id}/like · DELETE | تریگر شمارنده |

### ۴.۵ adoption (فاز C)
- `POST /api/pets/{id}/adoption-requests` {message}
- `GET /api/me/adoption-requests` (مالک: دریافت‌شده؛ متقاضی: فرستاده‌شده)
- `POST /api/adoption-requests/{id}/decision` {accept|reject} → accepted: `adoption_status='adopted'` + رد خودکار بقیه.

### ۴.۶ قواعد مشترک
- مالکیت: هر مسیر نوشتنی `owner_id == current_user` (۴۰۳ فارسی).
- صفحه‌بندی همه‌جا **cursor-based** (`before` = ISO timestamp).
- `/api/pets` فعلی (کاتالوگ) **دست‌نخورده**؛ مسیرهای جدید پروفایل زیر `/api/pets/{id}` هستند ولی روت `GET /api/pets/{id}` جدید است — تداخل با `GET /api/pets` (بدون id) ندارد.
- هر پاسخ لیست در قالب `{items, next_before}` است (به‌جز endpointهای قدیمی که آرایه‌ی خام می‌دهند).

---

## ۵. طراحی فرانت‌اند

### ۵.۱ روت‌های جدید (کنار ۴ روت فعلی)
| روت | صفحه | دسترسی |
|---|---|---|
| /register · /login | AuthCard | اگر authed → ریدایرکت `/` |
| /pets | کشف پروفایل‌ها (گرید + «نزدیک من») | عمومی |
| /pet/:id | پروفایل حیوان | دیدن عمومی؛ عمل → `/login?next=` |
| /feed | لحظات دنبال‌شده‌ها + خودم | ورود الزامی (RequireAuth) |
| /me | حساب کاربری: بیو، حیوانات من، خروج | ورود |
| /adoption | فهرست واگذاری + درخواست | عمومی دیدن |

`RequireAuth`: در `status==='loading'` اسکلتون (بدون پرش)؛ نامعتبر → `/login?next=<pathname>`.

### ۵.۲ استورها
- `auth.store`: `{status: 'loading'|'anon'|'authed', user, token, login(), register(), logout(), hydrate()}` — persist فقط توکن (کلید `pawsmarket-auth`)؛ hydrate در App با `GET /api/auth/me`.
- `social.store` (UI-only): تب فعال پروفایل، دیالوگ ساخت لحظه، وضعیت خوش‌بینانه‌ی دنبال‌کردن.
- داده‌ی سرور: React Query — `useProfile(id)`، `usePetPosts(id, cursor)`، `useFeed(cursor)`، `useDiscoverPets(origin)`؛ الگو و `keepPreviousData` مثل `useNearbyListings`.

### ۵.۳ اجزای جدید
`components/auth/AuthCard.tsx` · `components/social/{ProfileHeader, PhotoGrid, MomentsFeed, FollowButton, CreateMomentDialog, PetCard, DiscoverGrid}.tsx` — همه با قراردادهای موجود (RTL، `faDigits`، توکن‌های motion، توست/خطای استاندارد).

### ۵.۴ اتصال حداقلی به موجود
- Navbar: authed → آواتار + منو (پروفایل من، فید، خروج)؛ anon → دکمه «ورود».
- DetailModal: اگر حیوان پروفایل دارد → دکمه «پروفایل» → `/pet/:id`.
- Explore: نشان «دارای پروفایل» روی کارت‌ها.
- `favorites` دست‌نخورده (ذخیره‌ی شخصی ≠ دنبال‌کردن اجتماعی).
- حرکت: همان `data-motion-section/group` و توکن‌های ۱۰۰ms/۳۳ms؛ Dialogها ۱۰۰ms/۶۶ms.

---

## ۶. جریان‌های کلیدی

1. **ثبت‌نام → اولین لحظه:** `/register` → توکن → `/me` خالی → «افزودن حیوان» (نام، گونه، بیو، آواتار، موقعیت) → پروفایل → انتشار اولین لحظه → هدایت به `/feed`.
2. **کشف → دنبال → فید:** `/pets` (مرتب بر فاصله از location کاربر) → پروفایل → «دنبال‌کردن» → شمارنده لایو → `/feed`.
3. **واگذاری (C):** ویرایش پروفایل → «آماده‌ی واگذاری» → `/adoption` → درخواست با پیام → صندوق مالک → پذیرش/رد.

## ۷. جدول خطاها

| کد | بدنه | رفتار UI |
|---|---|---|
| ۴۰۱ | «نشست شما منقضی شده؛ دوباره وارد شوید» | پاک‌کردن توکن + ریدایرکت `/login?next=` بدون حلقه |
| ۴۰۳ | «این عملیات فقط برای صاحب این پروفایل است» | توست قرمز، دکمه غیرفعال |
| ۴۰۹ | «این نام کاربری قبلاً گرفته شده» | خطای زیر فیلد یوزرنیم |
| ۴۲۲ | پیام فارسی Pydantic | زیر فیلد |
| شبکه/۵xx | «اتصال به سرور برقرار نشد» | کارت خطای موجود + تلاش دوباره |

## ۸. تست و اعتبارسنجی

- **pytest (serverdash/tests/):**
  - `test_catalog_regression.py` — پنج endpoint فعلی: شکل JSON سازگار.
  - `test_auth.py` — ثبت‌نام، ۴۰۹ تکراری، ورود غلط ۴۰۱، انقضای نشست، خروج، هدر نامعتبر.
  - `test_social.py` — دنبال idempotent، فید فقط دنبال‌شده‌ها، مالکیت ۴۰۳، cursor صفحه‌بندی، محدودیت خوددنبال‌کردن.
- **فرانت:** `tsc -b && vite build` + بازبینی مرورگری کاربرمحور (اسکیل browser-use): مسیر طلایی + موبایل ۳۹۰px (با شبیه‌سازی فونت‌بوستینگ) + کنسول صفر خطا.
- **قبل از کامیت نهایی هر فاز:** پاس code-review روی diff.

## ۹. فازبندی تحویل

| فاز | محتوا | شرط خروج |
|---|---|---|
| **A** | بازیابی سورس + احراز هویت + پروفایل + گالری + دنبال/فید + کشف + مدیا + لحظه (post) | تست‌ها سبز + دموی واقعی مرورگری + تایید کاربر |
| **B** | استوری ۲۴ساعته + نوار استوری + لایک/کامنت + پاک‌سازی خودکار | همان |
| **C** | واگذاری: درخواست/صندوق/تصمیم + اتصال به پروفایل | همان |

## ۱۰. ریسک‌ها و کاهنده‌ها

| ریسک | کاهنده |
|---|---|
| داکر/دیسک روی ماشین کاربر | پایش؛ هیچ حذفی بدون تایید صریح؛ کامپوز جدید همان volume را نگه می‌دارد |
| مدیا روی لوکال (بدون S3) | volume جدا + استاتیک FastAPI؛ مهاجرت ابری بعداً adapter کوچک |
| بک‌اند لوکال یعنی شبکه‌ی اجتماعی فقط روی شبکه‌ی کاربر | مستندسازی شفاف؛ Pages فعلاً کاتالوگ استاتیک می‌ماند |
| تداخل روت جدید با `/api/pets` قدیم | مسیرهای جدید `/api/pets/{id}` و رگرسیون تست |
| آپلود فایل مخرب | محدودیت نوع/حجم + نام‌گذاری تصادفی + ذخیره خارج web-root + سرو فقط با محتوای تصویر |

## ۱۱. مستندسازی
این سند منبع‌حقیقت طراحی است؛ در `docs/superpowers/specs/` نسخه‌بندی و کامیت می‌شود. برنامه‌ی اجرایی جداگانه (writing-plans) ساخته خواهد شد.
