# پرامپت بازبینی کامل و بهبود PawsMarket

> این فایل برای کپی در یک سشن تازه ساخته شده. متن زیر را کامل کپی کنید.

---

تمام پروژه PawsMarket را بازبینی کن و بهبود بده: بک‌اند، فرانت‌اند، دیتابیس، و کد.

مهارت‌های Perfect-AI روی این دستگاه نصب شده‌اند (۲٬۷۰۲ اسکیل در `~/.claude/skills/`).
از آن‌ها استفاده کن. **همه را یک‌جا لود نکن** — فقط مرتبط‌ها را برای هر مرحله
فراخوانی کن. مسیریابی:

| مرحله | اسکیل‌های مرتبط |
|---|---|
| بررسی معماری و کد | `ztx-engineering-code-audit`, `ztx-engineering-architecture`, `zt-react-architecture`, `zt-debugging` |
| Persian / RTL | `zt-persian-rtl-ui`, `zt-rtl-i18n`, `zt-persian-typography`, `zt-persian-ui-copy`, `zt-design-typography` |
| رنگ و تم | `zt-color-intelligence`, `zt-color-semantic`, `zt-color-accessibility`, `zt-color-monochrome`, `ztx4-color-intelligence` |
| حالت‌ها و UI | `ztx-ux-interactions`, `ztx-ux-design-system`, `ztx-ux-component-api`, `zt-design-interactions`, `zt-design-system`, `ztx4-component-system` |
| فرم‌ها و اعتبارسنجی | `zt-forms-validation`, `zt-iran-validation`, `zt-zarinpal-payment` |
| کارایی | `zt-performance-budgets`, `zt-react-performance`, `ztx4-performance-auto` |
| دسترس‌پذیری | `zt-a11y-axe`, `zt-web-accessibility`, `ztx-ux-a11y` |
| تست و QA بصری | `ztx4-visual-qa`, `zt-e2e-playwright`, `zt-verification`, `ztx12-*` |
| نقد طراحی | `ztx4-premium-critic`, `zt-design-audit` |
| نقشه و مکان | `zt-mobile-interactions`, `zt-responsive-system` |
| SEO | `zt-persian-seo`, `zt-seo-content`, `ztx-engineering-seo`, `ztx10-seo-discoverability` |
| دیتابیس و API | `ztx-engineering-security`, `zt-dependency-audit`, `ztx12-quality-security-accessibility` |
| فرآیند کلی | `perfect-ai-master`, `ztu-router` — دست‌کمک: `ztu-verified-ultimate-master` |

برای انتخاب دقیق‌تر، `ztu-router` و `ztu-router-relevance-ranking` را ببین.

## مهارت اختصاصی همین پروژه

در `C:\Users\HP\Downloads\office\.claude\skills\web-research\SKILL.md` یک مهارت
مخصوص PawsMarket هست. **قبل از هر کاری بخوانش.** روش‌های کار با APIهای داده،
Overpass و Nominatim برای مکان‌های تهران، منابع قیمت فارسی، و معیار کیفیت
تصاویر و داده‌ها را توضیح می‌دهد. تمام قواعد «چه چیزی در دیتابیس می‌نشیند»
در آن آمده — نام فارسی، آدرس با منطقه، دسته‌بندی، عکس یکتا.

## پروژه

`C:\Users\HP\Downloads\office\pawsmarket`

**فرانت‌اند:** React 19 + TypeScript + Vite + Tailwind CSS + Radix UI + Framer Motion
+ Zustand + TanStack Query + React Router 7 + Leaflet. حدود ۷۷ فایل در `src/`.

**بک‌اند:** Flask + PostGIS — روی پورت `9232` گوش می‌دهد (پروکسی در `vite.config.ts`
از `/api/*` به `http://localhost:9232`). **بک‌اند احتمالاً داخل WSL اجرا می‌شود**؛
منشأش را پیدا کن و نخست وضعیتش را گزارش بده.

**بدون هیچ MCP** کار کن — ابزارهای محلی کافی‌اند.

## چه چیزی می‌خواهم

### ۱) بررسی، بدون تغییر
اول فقط بخوان و گزارش بده؛ دست به کد نزن. گزارش باید شامل این‌ها باشد:

- ساختار کامل: چه چیزی کجاست، چه چیزی کار می‌کند، چه چیزی نیمه‌کاره است
- وضعیت بک‌اند: آیا زنده است، کدام اندپوینت‌ها هستند، کدام‌ها بدون تست مانده‌اند
- وضعیت دیتابیس: اسکیما، مهاجرت‌ها، داده‌ی واقعی در برابر داده‌ی نمونه
- کیفیت کد: بدهی فنی، کد مرده، الگوهای متناقض، مسائل TypeScript
- RTL/فارسی: آیا منطق درست است؟ (خواص منطقی، جداسازی اعداد و URL، `<bdi>`)
- دسترس‌پذیری: کنتراست، فوکوس، کیبورد، برچسب‌ها
- کارایی: بودجه‌ی حجم باندل، رندر مجدد، ال‌سی‌پی/سی‌ال‌اس
- امنیت: XSS، مدیریت اعتبارنامه، `.env` و کلیدها، ورودی‌های API
- **صادق باش**: اگر چیزی را تست نکردی، بگو `NOT_TESTED`. موفقیت جعلی گزارش نکن

### ۲) اولویت‌بندی
فهرست یافته‌ها را به سه دسته تقسیم کن:
- **فوری** — باگ، شکست امنیتی، دسترس‌پذیری شکسته، داده‌ی گم‌شده
- **مهم** — کاربری بد، کارایی کند، RTL اشتباه
- **نیکوکاری** — صیقل، یکدستی، بازآرایی

هر مورد: فایل و شماره‌ی خط، علت، و روش درست کردن. با شاهد واقعی.

### ۳) بهبود — فقط پس از تأیید من
پس از همان گزارش صبر کن. من می‌گویم کدام موارد را درست کنی.
وقتی اجرا می‌کنی:
- رفتار موجود را حفظ کن؛ چیزی را که کار می‌کند نشکن
- هر تغییر را در مرورگر واقعاً اجرا کن و ببین (سرور dev را بالا بیاور)
- در موبایل، تبلت و دسکتاپ ببین؛ اسکرول رفت و برگشت، کیبورد، RTL، reduced-motion
- اگر چیزی را نتوانستی تست کنی، بگو — «تست شد» نگو

## قواعد تمامیت

- محتوای واقعی مهم است. دکمه و بنر و آمار جعلی نساز
- رنگ‌ها را از روی هوس عوض نکن؛ از موتور پالت استفاده کن و کنتراست را با عدد بسنج
- یک مالک برای هر ویژگی (انیمیشن + CSS + کتابخانه روی یک عنصر = تضاد)
- هر انیمیشن: حالت اول/آخر، وقفه، معکوس‌شدن، پاک‌سازی، و `prefers-reduced-motion`
- کد را در اپ واقعی بنویس، نه فقط در پاسخ چت
- در پایان، دقیقاً بگو: چه فایلی عوض شد، چه چیزی پیاده شد، کدام تست اجرا شد،
  چه چیزی اندازه‌گیری شد، و چه چیزی باقی ماند

## شروع

با این کارها شروع کن:
1. `README` و `package.json` و `vite.config.ts` و `.env*` را بخوان
2. درخت `src/` را ببین
3. بک‌اند را پیدا کن (به احتمال زیاد در WSL) و ببین زنده است یا نه
4. اسکیما و اندپوینت‌های API را از کد بیرون بکش
5. **اول گزارش بده، بعد دست به کد بزن**

خروجی‌های PDF، Excel و Word هم می‌توانی بسازی و تحویل بدهی.
