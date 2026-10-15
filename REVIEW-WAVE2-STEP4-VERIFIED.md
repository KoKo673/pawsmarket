# مرحله ۴ تأیید شد — و راه‌حل آن NOT_TESTED را پیدا کردم

> این متن را در سشن پزمارکت پیست کنید.

---

گزارشت را کامل راستی‌آزمایی کردم. **هر ادعا درست بود** — با بازتولید
مستقل، نه اعتماد:

```
$ grep -rn "setLoading(true)" src          → 0 ✓
$ npx oxlint src | grep -c "^src/"          → 11 ✓ (دقیقاً هدف)
$ npx tsc -b; echo $?                       → 0 ✓
$ git log --oneline -8
  a8457a4 migrate CommentsSheet to useQuery
  bd6f764 migrate PetProfilePage to useQuery
  3800ee2 migrate AdoptionPage to useQuery
  cc40b3f migrate FeedPage to useQuery
  f25def9 migrate BookingManagePage to useQuery
  bfef5cd migrate PetsDiscoverPage to useQuery
  c8951a9 migrate MyBookingsPage to useQuery
  df499e1 migrate FollowListPage to useQuery
  → هر ۸ کامیت، یکی برای هر فایل ✓
```

و تعارض دیتابیس هم واقعاً رفع شده:

```
$ docker exec serverdash-backend-1 getent hosts database
172.31.0.3      database      ← تک‌آدرس

$ curl ".../api/stores/nearby?..."
stores returned: 150            ← داده واقعی
  17 | مینگو پت شاپ
  18 | نمایشگاه قناری آراز
```

کانتینر متوقف‌شده هم با نام `-old` باقی است، نه حذف — درست.

**مرحله ۴ بسته می‌شود.**

---

## اما یک چیز: آن NOT_TESTED واقعاً قابل حل است

گفتی `loadMore` در FeedPage تست نشد چون `next_before` هرگز نمی‌آید.
من ریشه را پیدا کردم:

```python
# serverdash/app/routers/follows.py:144
next_before = rows[-1]['created_at'].isoformat() if len(rows) == limit else None
```

شرط `len(rows) == limit` است. و:

```
$ docker exec serverdash-database-1 psql ... -c "SELECT count(*) FROM posts;"
5
```

فقط **۵ پست** در دیتابیس است. اگر `limit` پیش‌فرض ۲۰ باشد، شرط هرگز
صادق نمی‌شود پس `next_before` همیشه `null` است.

**پس NOT_TESTED لازم نیست — فقط داده کم است.**

### راه‌حل: ۲۵ پست بساز و دوباره تست کن

```sql
-- با پت موجود و کاربر موجود
INSERT INTO posts (pet_id, kind, text)
SELECT 1, 'post', 'تست صفحه‌بندی شماره ' || g
FROM generate_series(1, 25) g;
```

بعد فید را باز کن. اگر `next_before` آمد و دکمهٔ «بیشتر» ظاهر شد،
`loadMore` را بزن و این دو را گزارش بده:

1. صفحهٔ اول چند پست آورد، بعد از loadMore چند تا؟ (جمع باید > limit اولیه باشد)
2. آیا پست‌های تکراری آمد یا `before` درست فیلتر کرد؟

اگر پاس شد، NOT_TESTED را از گزارش حذف کن و بجایش بنویس «تست‌شده با ۲۵
پست seed». اگر شکست، **این یک باگ واقعی است در صفحه‌بندی فید** که تا
حالا پنهان مانده بود — چه بسا در تولید با ۲۰+ پست کاربران هم بشکند.

نکته: `posts` به `pets` FK دارد و `follows` هم باید پت را دنبال کرده
باشد تا در فید بیاید — پس قبل از INSERT مطمئن شو پت ۱ در followهای
کاربر تستی هست.

---

## سه هشدار باقی‌مانده — همه از یک جنس نیستند، درست دسته‌بندی کردی

گفتی «خارج از محدوده». موافقم که در محدودهٔ مرحله ۴ نبودند، ولی چون
ادعا کردی بررسی‌شان کردم و **هر سه از یک جنس متفاوت با ۸ فایل قبلی‌اند**:

```
MyAccountPage:56   setLoadingPets(false) در finally — fetch-based
                   ولی الگویش fetch نیست: loadPets از بیرون می‌آید
                   (خارج از effect تعریف شده). مهاجرش ممکن است
                   خودِ اثر را حذف کند

BookingPage:76     setState مشتق: if (user) setName(v => v || user.display_name)
                   این fetch نیست — prefill فرم است. راه‌حل:
                   useState(user?.display_name ?? '') مستقیماً

Navbar             oxlint جداگانه اجرا شد، ولی خروجی set-state نداد —
                   احتمالاً alias resolution لازم دارد. اگر در CI هم
                   خطا نداد، خط اول گزارش را با شماره‌اش بیاور
```

پیشنهاد: **MyAccountPage** شبیه‌ترین به ۸ فایل قبلی است — همان را
اول بزن (یک فایل، یک کامیت). BookingPage را جدا با راه‌حل value مشتق
حل کن، نه useQuery.

---

## وضعیت پس از این مرحله

| موج | وضعیت |
|---|---|
| موج ۱ (build: باندل، فونت، lint، مایگریشن، CI) | بسته |
| موج ۲ مرحله ۱ (امنیت ۹ ماژول) | بسته |
| موج ۲ مرحله ۲ (صحت ۹ ماژول) | بسته |
| موج ۲ مرحله ۳ (۱۲ صفحه) | بسته |
| موج ۲ مرحله ۴ (۸ فایل state) | **بسته — همین گزارش** |
| باز‌مانده | ۳ هشدار lint (توصیه بالا)، NOT_TESTED فید (توصیه بالا)، ۳ مورد تصمیمی، NOT_TESTED محیطی |

اگر بخواهی، همان دو توصیهٔ بالا را بزن — بعد این پروژه از نظر بازبینی
به نقطهٔ پایان می‌رسد: نه «کاملاً بی‌باگ»، بلکه **هر باقی‌مانده
سند و تصمیم دارد**.
