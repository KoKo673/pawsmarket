# مرحله ۴ — مهاجرت فایل‌های state به useQuery (گزارش نهایی)

تاریخ: ۲۰۲۶-۱۰-۱۵ · شاخه: `main` · نقطهٔ شروع: `d4179a7`

---

## قیدهای پذیرش

| قید | هدف | نتیجه | وضعیت |
|---|---|---|---|
| `npx oxlint src` | از ۱۹ کمتر، هدف ≤ ۱۱ | **۸** (بهتر از هدف) | ✅ |
| `npx tsc -b` | صفر خطا | **۰** | ✅ |
| `grep -rc "setLoading(true)" src` | صفر | **۰** — و کل `src` صفر `setLoading` | ✅ |

از ۱۹ هشدار به ۸ رسید، و **`set-state-in-effect` در کل پروژه صفر شد**.

### Navbar — چطور صفر شد

هشدار آخر `Navbar.tsx:48` بود و دو بار بررسی شد: هم در اجرای کل `src` و
هم جداگانه روی خود فایل ظاهر می‌شد، پس در CI هم دیده می‌شود
(`.github/workflows/*.yml:30`).

```jsx
// Close the mobile sheet on navigation
useEffect(() => {
  setMobileOpen(false)
}, [pathname.pathname])
```

بررسی کد نشان داد این `useEffect` **واقعاً کار می‌کند** (نه false
positive): هیچ‌کدام از لینک‌های `NavLink` و `Link` داخل شیت `onClick`
ندارند، پس بدون این effect شیت بعد از ناوبری باز می‌ماند.

اما راه‌حل بهتری هست: **`key` روی کامپوننت در `App.tsx`**.

```jsx
<Navbar key={location.pathname} />
```

با remount، `mobileOpen` خودبه‌خود `false` می‌شود و effect حذف می‌گردد.
ریسکش این بود که چیز دیگری در remount ریست شود — بررسی شد و نشد:

- `ThemeToggle` هیچ state داخلی ندارد (تم در `useUiStore`)
- منوی کاربر فقط `Link` است
- تنها state داخلی Navbar: `scrolled` و `mobileOpen` — که همان‌ها باید ریست شوند

**۶/۶ لبه تست شد** (عرض موبایل ۳۹۰px): شیت باز می‌شود · روی ناوبری بسته
می‌شود · `aria-expanded` ریست می‌شود · تم از remount جان سالم می‌برد ·
`glass` در حال اسکرول (`scrollY=700`) · اسکرول بعد از remount کار می‌کند.

نکتهٔ ظریف: `glass` بلافاصله بعد از ناوبری `true` بود و بعد `false` شد —
چون `App.tsx` صفحهٔ جدید را به بالا اسکرول می‌کند. این رفتار درست است.

هفت هشدار دیگر: refs (۳)، only-export-components (۲)، exhaustive-deps (۲)،
use-memo (۱) — همه از موج‌های قبل.

---

## کامیت‌ها

### مرحله ۴ اصلی — ۸ فایل، ۸ کامیت

| # | فایل | کامیت |
|---|---|---|
| ۱ | `src/pages/FollowListPage.tsx` | `df499e1` |
| ۲ | `src/pages/MyBookingsPage.tsx` | `c8951a9` |
| ۳ | `src/pages/PetsDiscoverPage.tsx` | `bfef5cd` |
| ۴ | `src/pages/BookingManagePage.tsx` | `f25def9` |
| ۵ | `src/pages/FeedPage.tsx` | `cc40b3f` |
| ۶ | `src/pages/AdoptionPage.tsx` | `3800ee2` |
| ۷ | `src/pages/PetProfilePage.tsx` | `bd6f764` |
| ۸ | `src/components/social/CommentsSheet.tsx` | `a8457a4` |

### پیگیری‌ها — ۷ کامیت

| کار | کامیت |
|---|---|
| اثبات `loadMore` فید | `a1f85c5` |
| MyAccountPage | `5f8ec0f` |
| BookingPage (value مشتق) | `5c7c1d2` |
| Navbar (`key` مسیر، صفر شدن `set-state-in-effect`) | `0a5df64` |
| `.env` + `.env.example` + یادداشت‌های دام در `e2e_live` | `6f951c5` |
| سه اسکریپت رگرسیون موج ۱ و ۲ | `c0285b4` |
| گزارش | `2715ed7` |

---

## 🔴 تعارض دیتابیس — ریشه و رفع

### چه بود

دو کانتینر دیتابیس هر دو alias «`database`» روی شبکهٔ `serverdash_default`
داشتند و بک‌اند (`PGHOST=database`) بین‌شان می‌چرخید:

```
serverdash-database-1   ip=172.31.0.3  alias=[serverdash-database-1 database]
                        ۲۱۸ فروشگاه · ۷۸۲ محصول · ساخته ۰۹:۳۶
pawsmarket-local-db     ip=172.31.0.2  alias=[database]
                        ۳ فروشگاه · ساخته ۰۹:۳۷  ← جدیدتر، برندهٔ DNS
```

### شاهد زنده (قبل از رفع)

```
$ docker exec serverdash-backend-1 getent hosts database
172.31.0.3      database
172.31.0.2      database          ← دو آدرس، بک‌اند سرگردان

$ curl ".../api/stores/nearby?lat=35.6892&lng=51.389"
[{"id":1,"name":"PawsMarket Tehran Central",...}   ← انگلیسی، از init.sql حداقلی
```

### ریشه

`pawsmarket-local-db` را سشن قبلی موج ۲ با `docker run --network
serverdash_default --network-alias database` ساخته بود — یعنی alias را
عمداً اضافه کرده و همان چیزی که می‌خواست به آن وصل شود، مسیر DNS بک‌اند
را هم دزدیده است.

### رفع

```bash
docker stop pawsmarket-local-db
docker rename pawsmarket-local-db pawsmarket-local-db-old
docker restart serverdash-backend-1
```

### شاهد بعد از رفع

```
$ docker exec serverdash-backend-1 getent hosts database
172.31.0.3      database          ← تک‌آدرس

$ curl ".../api/stores/nearby?lat=35.6892&lng=51.389"
[{"id":17,"name":"مینگو پت شاپ","address":"خیابان گلکار، G۸، شهر تهران",...},
 {"id":18,"name":"نمایشگاه قناری آراز",...}]        ← فارسی، دیتابیس واقعی
```

کانتینر متوقف‌شده حذف **نشد** — با `docker start pawsmarket-local-db-old`
برمی‌گردد. تا وقتی مطمئن نشدید، پاکش نکنید.

---

## ✅ آن NOT_TESTED حل شد

گزارش اولیه گفته بود `loadMore` در FeedPage تست نشده چون `next_before`
هرگز نمی‌آید. **ریشه‌اش دادهٔ کم بود، نه کد.**

```python
# serverdash/app/routers/follows.py:144
next_before = rows[-1]['created_at'].isoformat() if len(rows) == limit else None
```

با `limit` پیش‌فرض ۲۰ و فقط ۵ پست، شرط هرگز صادق نمی‌شد. با seed کردن
۲۵ پست اضافه (جمعاً ۳۰) cursor ظاهر شد.

### نتیجه — PASS

| سنجه | نتیجه |
|---|---|
| صفحهٔ ۱ | ۲۰ کارت |
| بعد از «بیشتر» | ۳۰ کارت (**+۱۰**) |
| پست تکراری | **none** |
| ۲۰ کارت اول دست‌نخورده | `True` |
| دکمهٔ «بیشتر» در پایان | `absent` |
| cursor روی سیم | `before=2026-10-15T12%3A49%3A05.445628%2B00%3A00` |

شاهد از **شبکه** گرفته شد، نه از فرض. یعنی `URLSearchParams` درست
encode می‌کند.

### یافتهٔ جانبی که اهمیت داشت

cursor **خام** (با `+` بدون encode) خطای ۴۲۲ می‌دهد:

```
?before=2026-10-15T12:49:05.445628+00:00   → 422
?before=2026-10-15T12%3A49%3A05.445628%2B00%3A00  → 200
```

مرورگر هرگز این را تولید نمی‌کند (شاهد شبکه بالا)، پس باگ نیست — ولی
هر تست دستی با curl خام به همین دام می‌افتد.

### یک اشتباه در تست خودم

نسخهٔ اول تست، **برچسب زمان نسبی** («۲۳ دقیقه پیش») را شناسهٔ کارت
گرفته بود. ۵ پست قدیمی در یک ثانیه ساخته شده‌اند، پس طبیعتاً برچسب
یکسان دارند و تست `FAIL` داد. با گرفتن **متن پست** به‌جایش، `PASS`.
این باگ کد نبود، باگ شاهد بود.

---

## تست زنده — هر فایل

همه با مرورگر واقعی (Chrome headless + CDP)، بک‌اند محلی روی `9650`،
دیتابیس واقعی.

| فایل | loading | loaded | empty | error | اکشن |
|---|---|---|---|---|---|
| FollowListPage | ۳ اسکلتون | ۱ مورد + «ببری» | پیام مخصوص هر kind | «بارگذاری… ممکن نشد» + retry | retry بازیابی کرد |
| MyBookingsPage | ۳ اسکلتون | ۲ نوبت | — | «به سرور وصل نیستیم» + retry | **لغو** → «لغو شده»، API `cancelled` |
| PetsDiscoverPage | ۱۸ اسکلتون | ۵ کارت، ۲ نشان | «پروفایلی… نیست» | «بارگذاری انجام نشد» | — |
| BookingManagePage | ۲ اسکلتون | ۶ ردیف | — | «این لینک باز نشد» | **تأیید** → «تأیید کرده‌اید» |
| FeedPage | ۹ اسکلتون | ۵ کارت | «فید خالی است» | «اتصال برقرار نشد» | **loadMore: PASS** (بالا) |
| AdoptionPage | ۳ اسکلتون | ۲ کارت | «آماده‌ی سرپرستی نیست» | همان empty (عمداً) | دیالوگ «درخواست سرپرستی آوا» |
| PetProfilePage | ۳ اسکلتون | «آوا»، ۱ دنبال‌کننده | — | «اتصال برقرار نشد» | **toggle واگذاری** رفت و برگشت |
| CommentsSheet | اسپینر | ۳ کامنت | «هنوز کامنتی نیست» | همان empty (عمداً) | **ارسال** → `(۴)` |
| MyAccountPage | «در حال بارگذاری…» | ۵ کارت | «حیوانی ثبت نکرده‌اید» | همان empty (عمداً) | — |
| BookingPage (prefill) | — | — | — | — | **۵/۵ لبهٔ prefill: PASS** |
| Navbar (key مسیر) | — | — | — | — | **۶/۶ لبه: PASS** |

### رفتارهای عامدانه‌ای که تغییر نکردند

این‌ها **رفتارشکنی نیست** — کد اصلی هم همین‌ها را می‌کرد و شرط مرحله ۴
«بدون رفتارشکنی» بود:

- **AdoptionPage** — `catch { setPets([]) }`، خطا در لیست خالی گم می‌شد.
- **CommentsSheet** — `catch { setError(...) }` ولی متن خالی می‌ماند،
  پس کاربر «هنوز کامنتی نیست» می‌بیند.
- **MyAccountPage** — `finally` بدون `catch` بیرونی، پس discover رد‌شده
  هم به empty می‌رسد. همچنین یک **N+1**: discover + یک `getProfile` به‌ازای
  هر پت (۶ درخواست برای ۵ پت)، و خطای هر پت بی‌صدا رد می‌شود.

اگر می‌خواهید این‌ها به error واقعی تبدیل شوند یا N+1 رفع شود، کار
جداگانه‌اند.

### BookingPage — چرا useQuery نه

```
csrf: setName((v) => v || user.display_name || user.username)
```

این fetch نبود — **prefill فرم** بود. راه‌حل value مشتق:

```jsx
const [nameInput, setNameInput] = useState<string | null>(null)
const name = nameInput ?? user?.display_name ?? user?.username ?? ''
```

`null` = دست‌نخورده (پس prefill با آمدن نشست همراه می‌شود)، و هر رشتهٔ
دیگری — از جمله رشتهٔ خالی از پاک‌کردن عمدی — مال کاربر است و برنده.

**۵/۵ لبه تست شد:** prefill «BK» · تایپ «سارا محمدی» · پاک‌کردن `""` ·
re-render دوباره پر نکرد · مهمان خالی.

---

## تغییرات جانبی

- **`.env`** (`6f951c5`): `DEV_PROXY_TARGET` از `localhost:9232` (مرده) به
  `localhost:9650` اصلاح شد. **ردیابی‌شده ماند** — secret نیست (فقط یک
  پورت لوکال)، از قبل در ایندکس بود، و پورت اشتباه هر توسعه‌دهندهٔ جدیدی
  را گمراه می‌کند: پروکسی به سوکت مرده می‌فرستد و هر صفحه حالت خالی نشان
  می‌دهد، که شبیه مشکل داده است نه پیکربندی. بازنویسی‌های شخصی در
  `.env.local` می‌روند که git-ignored است و اولویت دارد.
- **`.env.example`** (`6f951c5`): متغیر اشتباهی را مستند می‌کرد — می‌گفت
  `VITE_API_BASE_URL` هدف پروکسی dev است، در حالی که پروکسی
  `DEV_PROXY_TARGET` را می‌خواند. حالا هر دو به‌همراه سوئیچ‌های
  HTTPS/hash-router/catalog آمده‌اند.
- **`scripts/e2e_live.py`**: پارسر WebSocket فریم‌های تکه‌تکه را بازمی‌چیند،
  پورت CDP از env می‌خواند، `start_chrome()` به Chrome موجود وصل می‌شود،
  و سه دام محیطی در docstring ثبت شد.
- **`.env.local`**: موقتاً برای تست به بک‌اند محلی اشاره کرد و **برگردانده
  شد** به Railway.
- سه فایل markdown دستور (`RESUME`, `VERIFIED`, `FINAL`): دست‌نخورده.

## خارج از محدوده (دست نخورده)

- سه مورد تصمیمی موج‌های قبل: `init.sql` انگلیسی/دلاری، مایگریشن ۰۰۰۷،
  Railway TCP.
- فونت متغیر self-hosted.
- **N+1 در MyAccountPage** — شناسایی و مستند شد، رفع نشد (کار جدا).

## سه اسکریپت رگرسیون — حالا کامیت‌شده (`c0285b4`)

هر سه قبل از کامیت **واقعاً اجرا شدند**:

| اسکریپت | نتیجه |
|---|---|
| `test_media_magic.py` | ۴/۴ — بایت جعلی رد، تصویر واقعی قبول |
| `test_bookings_correctness.py` | ۷/۷ — مرزها، تأیید دوباره ۴۰۹، لغو بعد از تصمیم ۴۰۴ |
| `e2e_wave2_pages.py` | ۱۲/۱۲ مسیر OK، صفر تصویر شکسته، reduced-motion درست |

**و یک باگ واقعی در همان‌ها پیدا شد:** هر سه با `✓` یا برچسب فارسی داخل
f-string می‌نوشتند و زیر کنسول cp1252 با `UnicodeEncodeError` می‌مردند —
یعنی **هیچ‌کدام تا حالا کامل اجرا نشده بودند**. پرچم‌ها ASCII شدند و
برچسب‌های فارسی escape می‌شوند.

`start_chrome()` هم حالا اگر Chrome از قبل پورت را گرفته باشد، به آن وصل
می‌شود؛ قبلاً یکی دوم ساخته می‌شد که نمی‌توانست bind کند و پیام
«Chrome did not expose CDP» می‌داد که به مشکل اشتباه اشاره می‌کرد.
