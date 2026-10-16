# CI قرمز شد — علتش را پیدا کردم و بازتولیدش کردم

> این متن را در سشن پزمارکت پیست کنید.

---

## خبر خوب اول: حذف آن خط درست بود

از API گیت‌هاب CI را دیدم (از این طرف باز است). نتیجهٔ run #3:

```
[  OK] Typecheck
[  OK] Lint (src only)
[  OK] Catalog data QC
[  OK] Verify a browser is available     ← ← ← این پاس شد
[FAIL] Build for audit
[skip] Audit public routes
```

آن قدم `Verify a browser is available` که به‌جای دانلود Playwright
گذاشتی، **سبز شد** — یعنی Chrome روی runner واقعاً هست و حذف آن
۱۵۰MB دانلود کار درستی بود.

## علت شکست: `spaFallback` مسیر را hardcode کرده

`vite.config.ts:22-23`:

```ts
function spaFallback(base: string): Plugin {
  return {
    name: 'pawsmarket-spa-fallback',
    apply: 'build',
    closeBundle() {
      const written = buildSpaFallback(
        fileURLToPath(new URL('./dist', import.meta.url)), base)   // ← اینجا
      ...
```

`'./dist'` **ثابت نوشته شده**، فارغ از `--outDir`.

و `buildSpaFallback` این کار را می‌کند (`scripts/spaFallback.ts:43`):

```ts
const index = join(outDir, 'index.html')
let html = readFileSync(index, 'utf-8')    // ← اگر نباشد، ENOENT
```

### روی CI چه می‌شود

```
۱. audit:build با --outDir dist-audit اجرا می‌شود     ✓
۲. بیلد تمام می‌شود، closeBundle صدا زده می‌شود
۳. پلاگین سراغ ./dist (نه dist-audit) می‌رود
۴. dist/ در CI وجود ندارد — .gitignore شده، checkout نمی‌شود
۵. readFileSync → ENOENT → PLUGIN_ERROR → کل بیلد می‌افتد
```

## بازتولید محلی — دقیقاً همان خطا

`dist/` را موقتاً برداشتم و `npm run audit:build` را زدم:

```
errno: -4058,
code: 'PLUGIN_ERROR',
syscall: 'open',
path: 'C:\\Users\\HP\\Downloads\\office\\pawsmarket\\dist\\index.html',
pluginCode: 'ENOENT',
plugin: 'pawsmarket-spa-fallback',
hook: 'closeBundle'
```

**همان `pluginCode: ENOENT` و همان `hook: closeBundle`.** علت قطعی است،
نه حدس.

## چرا محلی پاس می‌شد ولی CI نه

محلی `dist/` از بیلدهای قبلی **وجود دارد** — پلاگین فایل قدیمی را
می‌خواند و یک `404.html` کهنه می‌نویسد. **پس محلی هم باگ دارد، فقط
خطا نمی‌دهد.** یعنی این باگ مدت‌ها بی‌صدا بوده و CI فقط نشانش داد.

## رفع

پلاگین باید `outDir` واقعی را بگیرد، نه مسیر ثابت:

```ts
function spaFallback(base: string): Plugin {
  let outDir = 'dist'
  return {
    name: 'pawsmarket-spa-fallback',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir            // ← مسیر واقعی بیلد
    },
    closeBundle() {
      const written = buildSpaFallback(
        fileURLToPath(new URL(`./${outDir}`, import.meta.url)), base)
      this.info?.(`SPA fallback written: ${written}`)
    },
  }
}
```

`configResolved` استاندارد Vite است و قبل از `closeBundle` صدا زده
می‌شود. با این تغییر:

- `dist-audit` → پلاگین به `dist-audit` می‌نویسد ✓
- `dist` (بیلد تولیدی) → همان‌طور که بود ✓
- و محلی دیگر `404.html` کهنه نمی‌نویسد

### و یک قید پایداری

بعد از رفع، این را هم اضافه کن تا دوباره تکرار نشود:

```ts
closeBundle() {
  const dir = fileURLToPath(new URL(`./${outDir}`, import.meta.url))
  // اگر بیلد به جایی نوشت که index.html ندارد، یعنی outDir غلط است —
  // بهتر است صریح بشکند تا یک 404.html کهنه بنویسد.
  if (!existsSync(join(dir, 'index.html'))) {
    throw new Error(
      `spaFallback: no index.html in ${outDir} — did --outDir change?`)
  }
  ...
}
```

پیام خطا **می‌گوید کجا را نگاه کن**، نه `ENOENT` خالی که یک ساعت طول
می‌کشد تا ریشه‌اش پیدا شود — همان چیزی که همین حالا تجربه کردیم.

## اثبات لازم

بعد از رفع، **دو چیز** را تست کن، نه یکی:

```bash
# ۱. بیلد audit با dist غایب (سناریوی CI)
mv dist dist_backup && rm -rf dist-audit
npm run audit:build          # باید سبز شود، dist-audit/404.html ساخته شود

# ۲. بیلد تولیدی هنوز درست کار می‌کند
npm run build                # باید به dist/ بنویسد
ls dist/404.html             # باید تازه‌تر از الان باشد

mv dist_backup dist          # برگردان (اگر لازم شد)
```

گزارش بده:
- `dist-audit/404.html` ساخته شد؟ (با timestamp)
- `dist/404.html` تازه شد؟ (با timestamp)
- خروجی `npm run audit:a11y -- --public-only` روی همان بیلد چه شد؟

---

## آن ۷ استثنا — کارت درست بود

گرفتی «قبلاً فقط ۷ node چاپ می‌شد» و حالا هر کدام نامش را می‌گوید،
و یک بلوک «HOW TO DELETE THIS» روی `isBrandButton` نوشتی با مقدار
دقیقی که باید عوض شود. **این همان چیزی است که خواستم** — استثنا باید
خودش بتواند بگوید کِی باطل می‌شود، وگرنه یک روز کسی رنگ برند را
عوض می‌کند و هشت نقطهٔ شکسته در سکوت می‌ماند.

## ترتیب کار

```
۱. رفع spaFallback (بالا) + قید پایداری
۲. تست دوگانه (audit + production build)
۳. commit
۴. push
۵. دوباره از API چک کن: من هم می‌توانم ببینم
```

بعد از سبز شدن، برگرد سراغ:

- `RequireAuth` ساختاری + CLS
- OTP با موبایل (سه تصمیم در `REVIEW-WAVE3-AUTH-PHONE.md`)
- تلگرام برای نوبت‌ها
- `MapView.tsx` (۴۷۳ خط)
