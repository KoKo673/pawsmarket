# ادامهٔ کار — و اول: حل تعارض دیتابیس (گزینهٔ درست‌تر)

> این متن را در سشن جدید پیست کنید. دو بخش دارد: حل تعارض دیتابیس، بعد ادامهٔ مرحله ۴.

---

## 🔴 اول: تعارض دیتابیس را همین لحظه حل کن

سؤالت را دیدم. **هیچ‌کدام از سه گزینه دقیقاً درست نبود** — گزینهٔ ۱
(توقف serverdash-database-1) خطرناک است. بگذار وضعیت واقعی را بگویم،
چون خودم هر دو دیتابیس را شمردم:

```
serverdash-database-1   → ۲۱۸ فروشگاه، ۷۸۲ محصول، ۱۶ کاربر، ۴ نوبت
                          alias: database + serverdash-database-1
                          IP: 172.31.0.3

pawsmarket-local-db     → ۳ فروشگاه، ۳ محصول، ۱۵ کاربر، ۵ حیوان
                          alias: database  ← ← ← تعارض اینجاست
                          IP: 172.31.0.2
```

هر دو در `serverdash_default` و **هر دو alias «database»** دارند. بک‌اند
`PGHOST=database` دارد و DNS داکر آخرین‌ثبت‌شده را برمی‌گرداند — و الان
`pawsmarket-local-db` برنده است.

**شاهد زنده که بک‌اند روی دیتابیس اشتباه است:**

```
$ curl .../api/stores/nearby?...
  id=1  PawsMarket Tehran Central    ← اسم انگلیسی init.sql!
  id=3  دامپزشکی آزمون
$ docker exec serverdash-database-1 psql ... SELECT name FROM stores LIMIT 1
  بستری و پانسیون حیوانات وت نست    ← این دیتابیس واقعی است
```

یعنی کار موج اول و دوم الان روی دیتابیس حداقلی تست می‌شود، نه آن ۲۱۸
فروشگاهی که فیلترها و جستجو رویش سنجیده شد. اگر تا اینجا چیزی با
«فروشگاه شماره N» یا اسم‌های انگلیسی دیدی، دلیلش همین است.

### دستور درست (گزینهٔ ۲ اصلاح‌شده)

خودت گزینهٔ ۲ را پیشنهاد کردی — مسیر درست است، ولی جزئیاتش فرق دارد:

۱. `pawsmarket-local-db` فقط **۳ فروشگاه** دارد، ۲۱۸ ندارد. پس:

- اگر `pawsmarket-local-db` را کاملاً حذف می‌کنی و بک‌اند را به
  `serverdash-database-1` می‌بری → **داده واقعی برمی‌گردد** (۲۱۸ فروشگاه)
  ولی pets خالی می‌شود (کاربرهایش هم فرق دارد — ۱۵ در برابر ۱۶)

- اگر برعکس می‌خواهی pawsmarket-local بماند، باید ۲۱۸+۷۸۲ رکورد را
  دوباره seed کنی — هم `seed_real.sql` و هم `apply_catalog_railway.py`

**پیشنهاد من: اولی.** چون دیتابیس `serverdash-database-1` است که هم
موج اول رویش تست زده شد و هم مایگریشن‌های ۰۰۰۲–۰۰۰۶ رویش اعمال شده.

۲. کانتینر را حذف کن یا rename بده تا alias «database» را رها کند:

```
docker stop pawsmarket-local-db
docker rename pawsmarket-local-db pawsmarket-local-db-old
```

(بهتر از حذف: اگر لازمش داشتی، برمی‌گردانی. بعد که مطمئن شدی، حذفش کن.)

۳. الیاس duplicate را روی `serverdash-database-1` بگذار اگر ندارد،
   ولی حواست باشد: **alias را دو کانتینر نداشته باشند.**

۴. بک‌اند را ری‌استارت کن تا DNS دوباره resolve شود:

```
docker restart serverdash-backend-1
```

۵. تست تأیید — **این دو باید یکی باشند:**

```
curl -s "http://localhost:9650/api/stores/nearby?lat=35.6892&lng=51.389&max_distance=50000" | ...
docker exec serverdash-database-1 psql -U myuser -d mydatabase -t -c "SELECT left(name,40) FROM stores ORDER BY id LIMIT 1;"
```

اگر هر دو «بستری و پانسیون حیوانات وت نست» را نشان دادند، حل شد.
اگر نه، به من بگو — DNS داکر گاهی ری‌استارت خود کانتینر شبکه لازم دارد.

**و در گزارش بنویس** که این تعارض از کجا آمد (کدام دستور/آزمایش آن را
ساخت) تا دوباره تکرار نشود.

---

## ▶️ بعد: ادامهٔ مرحله ۴ (مهاجرت ۸ فایل به useQuery)

### زمینه

پروژه: `C:\Users\HP\Downloads\office\pawsmarket` + `..\serverdash` (FastAPI
در Docker، پورت **۹۶۵۰**). موج ۱ و ۲ بازبینی تمام شده — امنیت، صحت، ۱۲ صفحه،
فونت متغیر، CI، همه با تست زنده و کامیت.

تکلیف: **رفع `set-state-in-effect`** — `load()` داخل `useEffect` که
`setLoading(true)` می‌زند → cascade. راه‌حل: `useQuery` از TanStack Query
(نصب است؛ نمونهٔ الگو: `src/hooks/use-listings.ts`).

### وضعیت دقیق (خودم از دیسک چک کردم)

| فایل | وضعیت |
|---|---|
| `src/pages/FollowListPage.tsx` | ✅ مهاجرت شد (`useQuery`=2، صفر setLoading) — **UNCOMMITTED**؛ اول تست و کامیت |
| ۷ فایل دیگر | ❌ هنوز دستی: `CommentsSheet.tsx` (در `src/components/social/`)، `AdoptionPage.tsx`، `BookingManagePage.tsx`، `FeedPage.tsx`، `MyBookingsPage.tsx`، `PetProfilePage.tsx`، `PetsDiscoverPage.tsx` |

سشن قبلی وسط نوشتن `MyBookingsPage.tsx` (شروع: `CalendarDays, Clock,
Loader2, X` از lucide + `useQuery, useQueryClient`) کرش کرد.

### دستور کار

۱. **اول FollowListPage** — تست زنده + `npx oxlint src`، بعد commit
۲. بعد هر فایل جدا: مهاجرت → تست → commit مستقل
۳. `loading/error/empty` هر سه حالت باید حفظ شوند — رفتار قبل را در
   مرورگر ببین، بعد تغییر بده
۴. CommentsSheet کامپوننت است نه صفحه — قضاوت کن (شاید useQuery در
   خودش، شاید state از والد)

### قید پذیرش — عددی

```
npx oxlint src   → از ۱۹ کمتر (هدف ≤۱۱)
npx tsc -b       → صفر خطا
grep -rc "setLoading(true)" src → صفر
```

هر سه را با عدد گزارش بده.

### قواعد ثابت

- یک commit در هر فایل؛ رفتارشکنی ممنوع
- سه مورد تصمیمی دست نزن: init.sql انگلیسی/دلاری، مایگریشن ۰۰۰۷، Railway TCP
- فونت متغیر self-hosted — دست نزن
- **مهم:** حالا که دیتابیس درست شد، آن ۲۱۸ فروشگاه واقعی فارسی باید در
  API دیده شود. اگر اسم انگلیسی دیدی، مرحلهٔ بالا درست حل نشده — برگرد.

### شروع

از حل تعارض دیتابیس شروع کن، شاهدش را بیاور، بعد FollowListPage.
