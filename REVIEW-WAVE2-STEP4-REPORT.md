# مرحله ۴ — مهاجرت فایل‌های state به useQuery (گزارش نهایی)

تاریخ: ۲۰۲۶-۱۰-۱۵ · شاخه: `main` · نقطهٔ شروع: `d4179a7`

---

## قیدهای پذیرش

| قید | هدف | نتیجه | وضعیت |
|---|---|---|---|
| `npx oxlint src` | از ۱۹ کمتر، هدف ≤ ۱۱ | **۹** (بهتر از هدف) | ✅ |
| `npx tsc -b` | صفر خطا | **۰** | ✅ |
| `grep -rc "setLoading(true)" src` | صفر | **۰** — و کل `src` صفر `setLoading` | ✅ |

از ۱۹ هشدار به ۹ رسید.

### تنها `set-state-in-effect` باقی‌مانده

```
src/components/layout/Navbar.tsx:48:5
```

**واقعی است و در CI هم دیده می‌شود** — ورک‌فلو همان `npx oxlint src` را
اجرا می‌کند (`.github/workflows/*.yml:30`)، و اجرای هم‌زمان روی کل `src`
و روی خود فایل، هر دو همین یک مورد را دادند.

```jsx
// Close the mobile sheet on navigation
useEffect(() => {
  setMobileOpen(false)
}, [pathname.pathname])
```

این یک `useEffect` **معتبر** است: synchronizing با یک رویداد خارجی
(ناوبری مسیر). نسخهٔ derived-value اینجا معنی ندارد چون `mobileOpen`
state واقعی کاربر است که باید با یک رخداد خارجی ریست شود. راه‌حل
«درست‌تر» یعنی انتقال به `key` روی کامپوننت یا بازنشانی در هندلرهای
`Link` — که بازطراحی است، نه رفع هشدار. **عمداً دست نخورد.**

هشت هشدار دیگر: refs (۳)، only-export-components (۲)، exhaustive-deps (۲)،
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

### پیگیری‌ها — ۳ کامیت

| کار | کامیت |
|---|---|
| اثبات `loadMore` فید | `a1f85c5` |
| MyAccountPage | `5f8ec0f` |
| BookingPage (value مشتق) | `5c7c1d2` |

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

- `.env`: `DEV_PROXY_TARGET` از `localhost:9232` (مرده) به `localhost:9650`
  اصلاح شد — **UNCOMMITTED**، تصمیمش با شماست.
- `.env.local`: موقتاً برای تست به بک‌اند محلی اشاره کرد و **برگردانده شد**
  به Railway. تغییرش **UNCOMMITTED** و git-ignored است.
- `scripts/e2e_live.py`: پارسر WebSocket حالا فریم‌های تکه‌تکه را بازمی‌چیند
  و پورت CDP از env می‌خواند. قبلاً `Page.navigate` پاسخش گم می‌شد.
- `REVIEW-WAVE2-STEP4-RESUME.md`: متن سشن قبلی، دست‌نخورده.

## خارج از محدوده (دست نخورده)

- `scripts/e2e_wave2_pages.py` · `test_bookings_correctness.py` ·
  `test_media_magic.py` — دستاوردهای موج ۱ و ۲، uncommitted.
- سه مورد تصمیمی موج‌های قبل: `init.sql` انگلیسی/دلاری، مایگریشن ۰۰۰۷،
  Railway TCP.
- فونت متغیر self-hosted.
- `Navbar.tsx` — دلیلش در بالای همین سند.
