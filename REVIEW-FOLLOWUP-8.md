# تأیید نهایی — فونت درست شد و روی سایت زنده تست کردم

> این متن را در سشن پزمارکت پیست کنید.

---

فونت متغیر را با fonttools باز کردم (نه فقط سرصفحه، چون woff2 فشرده است و
`fvar` در بایت خام دیده نمیشود):

```
has fvar : True
axis     : wght 100.0 – 900.0  (default 400)
glyphs   : 1333          ← کامل فارسی
```

محور واقعی است — فونت استاتیک نیست. تست عرض ۵ وزنِ یکتا هم درست بود، ولی
این تست قویترش بود و من خودم گرفتم.

## تست زنده — من، بدون واسطه

```
https://KoKo673.github.io/pawsmarket/fonts/vazirmatn.css  → HTTP 200
https://KoKo673.github.io/pawsmarket/fonts/Vazirmatn-var.woff2  → HTTP 200  (111152B)
```

و هیچ درخواستی به `fonts.googleapis.com` در هیچ فایل سورس باقی نمانده —
تنها یک کامنت توضیحی در `index.html` است که میگوید «قبلاً از گوگل بود»،
درسته و باید هم بماند.

مسیرها هم صحیح resolve می‌شوند:

```
dist/index.html      → /pawsmarket/fonts/vazirmatn.css   ✓ با BASE
vazirmatn.css        → url('Vazirmatn-var.woff2')         ✓ نسبی، نسبت به CSS
```

این همان تلهی root-absolute دوباره بود — تو این بار آن را درست گرفتی چون
مسیر داخلی CSS را نسبی گذاشتی. خوب باگی را بستی.

## مورد ۱ هم تأیید

`git ls-files assets/` صفر. فایل مرده از مخزن رفت و `assets/` هم ignore
شد. اکوسیستم تمیز شد.

## جمع‌بندی کل بازبینی — تأیید نهایی من

| | قبل | بعد | شاهد |
|---|---|---|---|
| باندل API | ۷۳۸KB | ۴۷۱KB | بیلد تازهٔ خودم: **دقیقاً ۴۷۰.۹۹** |
| باندل اصلی | ۴۹۶KB | ۴۴۹.۸KB | بیلد تازهٔ خودم |
| فونت | CDN گوگل، ۹× تکراری | ۱ فایل متغیر ۱۰۹KB | fvar با fonttools |
| وابستگی خارجی | fonts.googleapis | صفر | grep + تست زنده |
| lint | ۲۴۲۹ | ۱۹ | — |
| مایگریشن | دو لیست ناهماهنگ | کشف از پوشه + migrate-all | کد |
| جستجوی «مکمل» | ۰ نتیجه | ۲۸+ | باگ categories رفع شد |
| فایل مرده ۸۵۱KB | tracked | حذف | git ls-files |

این موردهای بازبینی دیگر کار تعریفشده دارند؛ هر بودی که واقعی بود بسته شد.

## باقی‌مانده‌ها — که همه تصمیم می‌خواهند نه کد

سه موردی که درست تشخیص دادی و دست نزدی:

1. **init.sql انگلیسی/دلاری** — با تصمیم دیتابیس گره خورده
2. **مایگریشن ۰۰۰۷ (فراداده به DB)** — همان گره
3. **پروکسی TCP Railway** — خارج از کنترل ما، مسیر ادمین جایگزین کار میکند

این سه را تا وقتی پلن Railway روشن نشده نبند — درست است که باز گذاشتی.

## تنها مورد کاری باقی‌مانده: CI

اگر بخواهی، این حداقلی است که پیشنهاد می‌دهم — یک فایل، سه job نه، فقط
یک:

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx tsc -b
      - run: npx oxlint src
      - run: py -3 scripts/qc_catalog.py
        # اگر qc_catalog به کتابخانه نیاز دارد، در steps قبل اضافه شود
```

فقط یک چیز را چک کن: `qc_catalog.py` با چه پایتونی اجرا میشود و به چه
نیاز دارد — اگر به pip package نیاز دارد، قبلش `pip install` بگذار. اگر
db میخواهد، آن را از CI حذف کن و فقط stub کن.

بگو شروع کنم یا خودت انجام بده.
