# ورود و ثبت‌نام با شماره موبایل — طرح کامل

> این متن را در سشن پزمارکت پیست کنید.

---

## آن ربات تلگرام اشتباه فهمیده شد — تصحیح

تصویر فقط نمونه بود. کاربر کدی که در آن ربات دیده، کد **ورود به
یک سرویس دیگر** (river.ai) بود که به شمارهٔ تلگرامش آمده. **نه اینکه
آن ربات کد ساخته باشد.**

پس ایدهٔ درست: **ثبت‌نام و ورود با شماره موبایل، مثل هر اپ واقعی** —
کاربر شماره می‌دهد، کد یک‌بارمصرف می‌گیرد، وارد می‌شود.

**تلگرام برای این کار کنار می‌رود** — چون فقط کاربران تلگرام را پوشش
می‌دهد. جایگزین‌های جدی‌تر پایین.

## وضعیت فعلی احراز هویت

راستی‌آزمایی کردم:

```
جدول users:
  id, username, username_lower, password_hash, display_name,
  bio, avatar_url, email, is_active, created_at

  UNIQUE: username_lower, email
  ← ستون phone نیست
```

و `accounts.py` سه مسیر دارد: `/register`، `/login`، `/recover`.
`recover` رمز موقت می‌سازد و روی صفحه نشان می‌دهد (چون mail نیست).

**پس ورود با موبایل نیاز به مایگریشن جدید دارد** — و یک تصمیم مهم.

---

## تصمیم اصلی: کدام درگاه پیامک؟

سه گزینهٔ واقعی برای ایران. بگذار با عدد بگویم:

| درگاه | وضعیت شبکه | هزینه | یادداشت |
|---|---|---|---|
| **Kavenegar** | `api.kavenegar.com` → **HTTP 200** (تست‌شده) | پولی، اعتباری | مستندات فارسی، پایتون SDK دارد |
| **SMS.ir** | `api.sms.ir` → 404 روی root (یعنی سرور جواب می‌دهد) | پولی | |
| **Bale messenger** | `api.bale.ai` → **503** (سرور بالاست ولی در دسترس) | مجانی | فقط کاربران بله |

**پیشنهاد من: Kavenegar** چون:
- از این شبکه تست شد و پاسخ داد
- الگوی «کد خدماتی» دارد (template-based) که برای OTP استاندارد ایران است
- SDK پایتون رسمی + شکست‌پذیری («اگر قالب نبود، fallback به پیامک ساده»)

**ولی حتی Kavenegar هم به تصمیم شما نیاز دارد:** خط خدماتی و قالب
«کد ورود» باید از پنل Kavenegar درخواست و تأیید شود — این یک روز
کاری ادمین است، نه یک خط کد.

### گزینهٔ مکمل: موبایل **اختیاری**، نه اجباری

مهم‌ترین تصمیم طراحی: **آیا موبایل اجباری می‌شود یا اختیاری؟**

**پیشنهاد من: هر دو مسیر زنده بماند.**

- کاربر می‌تواند با `username + password` ثبت‌نام کند (مثل الان)
- **یا** با شماره موبایل + کد یک‌بارمصرف
- هر حساب یک `phone` اختیاری دارد؛ اگر خالی باشد، ورود موبایلی برایش
  غیرفعال است

**چرا؟** چون:
1. الان کاربر داری (۱۶ نفر در DB) — اجباری‌کردن یعنی همه باید مهاجرت کنند
2. اگر Kavenegar یک روز قطع/تمام‌اعتبار شد، سایت نباید بخوابد
3. فروشگاه‌هایی که نوبت می‌گیرند می‌توانند `phone` را بعداً وصل کنند

---

## طرح فنی — چهار جزء

### ۱. مایگریشن `0008_phone_auth.sql`

```sql
-- 0008: ورود با شماره موبایل — افزودنی، روی دادهٔ موجود بی‌خطر.
--
-- چرا: ثبت‌نام با نام کاربری برای کاربر ایرانی طبیعی نیست؛ هر اپ واقعی
-- با شماره موبایل کار می‌کند. ولی مسیر قدیمی حفظ می‌شود چون حساب‌های
-- موجود و پشتیبان‌پذیری.

BEGIN;

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ;

-- شماره یکتا، ولی فقط برای شماره‌های غیرخالی (کاربران قدیمی phone ندارند)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone
    ON users (phone) WHERE phone IS NOT NULL;

-- کدهای یک‌بارمصرف. کد **خام** ذخیره نمی‌شود — فقط هش آن.
CREATE TABLE IF NOT EXISTS otp_codes (
    id           SERIAL PRIMARY KEY,
    phone        TEXT NOT NULL,
    code_hash    TEXT NOT NULL,          -- pbkdf2، نه plain
    purpose      TEXT NOT NULL           -- 'signup' | 'login' | 'recover'
                 CHECK (purpose IN ('signup', 'login', 'recover')),
    attempts     SMALLINT NOT NULL DEFAULT 0,
    max_attempts SMALLINT NOT NULL DEFAULT 5,
    expires_at   TIMESTAMPTZ NOT NULL,
    consumed_at  TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ایندکس جستجو: «آخرین کد فعال این شماره برای این هدف»
CREATE INDEX IF NOT EXISTS idx_otp_lookup
    ON otp_codes (phone, purpose, created_at DESC)
    WHERE consumed_at IS NULL;

COMMIT;
```

**دو نکتهٔ امنیتی که در طرح هست:**

1. **کد خام ذخیره نمی‌شود** — `code_hash` با همان
   `hash_password` که در `security.py` هست. اگر DB درز کرد، کدها
   قابل استفاده نیستند.

2. **`attempts` و `max_attempts` در DB، نه در حافظه** — ۵ تلاش
   اشتباه و کد می‌سوزد. بدون این، یک کد ۶ رقمی در ۱٬۰۰۰٬۰۰۰ حالت
   با brute-force چند دقیقه‌ای می‌شکند.

### ۲. جدول تطبیق: `phone` ↔ `users`

مسیر `/register` فعلی `username`+`password` می‌خواهد. با شماره موبایل:

```
اگر phone در users هست → login (کد بفرست، تأیید کن، نشست بده)
اگر phone نیست        → signup (کد بفرست، تأیید کن، حساب بساز)
```

برای `signup`، `username` چه شود؟ سه گزینه:

- **الف)** کاربر خودش انتخاب کند (فورم دو مرحله‌ای)
- **ب)** سرور از شماره بسازد: `user_0913xxxxxxx`
- **ج)** `username` را اختیاری کن

**پیشنهاد من: ب.** چون UX ساده‌تر است و کاربر بعداً می‌تواند عوض کند.
ولی `display_name` باید گرفته شود (اسم نمایشی همانی است که در UI دیده
می‌شود).

### ۳. `app/otp.py` — منطق مشترک

```python
def request_otp(phone, purpose) -> None:
    # ۱. normalise: ۰۹۱۲… → 0912…، +98912 → 0912
    #    (اسکیل zt-iran-validation: اعداد فارسی/عربی را بپذیر)
    # ۲. rate limit: per phone و per IP (همان ratelimit.py موجود)
    # ۳. اگر purpose='signup' و phone در users هست → بی‌صدا رد کن
    #    (بدون افشای «این شماره ثبت شده» — همان الگوی recover)
    # ۴. کد ۶ رقمی با secrets.randbelow
    # ۵. ذخیرهٔ هش + انقضای ۲ دقیقه (کد پیامکی در ایران معمولاً ۵ دقیقه،
    #    ولی برای OTP امن‌تر ۲ دقیقه)
    # ۶. ارسال با provider (Kavenegar)

def verify_otp(phone, code, purpose) -> bool:
    # ۱. آخرین کد فعال را بگیر
    # ۲. اگر منقضی، یا attempts > max → رد
    # ۳. verify_password(code, code_hash)
    # ۴. اگر غلط: attempts += 1 و رد (بدون افشای تعداد باقی‌مانده)
    # ۵. اگر درست: consumed_at = now() و True
```

**قید مهم از اسکیل `zt-kavenegar-otp`:**
> «Secure random OTP, short TTL, hashed storage, throttle user/IP,
> **no phone enumeration**, delete after success»

هر پنج تا در طرح هست.

### ۴. `app/providers/sms.py` — لایهٔ درگاه

```
class SmsProvider(Protocol):
    def send(self, phone: str, code: str, purpose: str) -> None: ...

class KavenegarProvider:  # واقعی
class ConsoleProvider:    # dev: کد را در لاگ چاپ می‌کند
class NullProvider:       # اگر کلید نبود: خطا با پیام فارسی
```

انتخاب با `SMS_PROVIDER` env. **`ConsoleProvider` برای dev حیاتی است** —
سشن توسعه نباید برای هر تست یک پیامک واقعی بفرستد.

```env
SMS_PROVIDER=kavenegar
KAVENEGAR_API_KEY=
KAVENEGAR_TEMPLATE=                   # قالب «کد ورود» که تأیید شده
KAVENEGAR_SENDER=                     # خط خدماتی
OTP_TTL_SECONDS=120
OTP_MAX_ATTEMPTS=5
```

### ۵. اندپوینت‌ها

```
POST /api/auth/otp/request
  body: {phone, purpose: 'signup'|'login'}
  200: {ok: true, message: 'اگر شماره معتبر باشد، کد فرستاده شد'}
       ← همیشه همین پاسخ، حتی اگر شماره غلط/تکراری (no enumeration)

POST /api/auth/otp/verify
  body: {phone, code, purpose, display_name?}   ← display_name فقط برای signup
  200: {token, user, is_new: true|false}
  401: {detail: 'کد نادرست یا منقضی است'}       ← همان پیام برای همهٔ خطاها
```

**دو چیز که باید مواظبش باشی:**

1. **`/otp/request` برای `signup` روی شمارهٔ گرفته‌شده** → باید بی‌صدا
   ۲۰۰ بدهد ولی کد نفرستد. اگر ۴۰۹ بدهد، مهاجم می‌فهمد این شماره
   ثبت شده. (همان الگوی `recover` که درست پیاده شده.)

2. **rate limit باید سخت باشد**: ۳ درخواست در ۵ دقیقه به‌ازای هر
   شماره، و **۱۰ درخواست در ۵ دقیقه به‌ازای هر IP**. بدون این،
   یک مهاجم با ۱٬۰۰۰ شماره پنجرهٔ SMS تو را در ۱۰ دقیقه تمام می‌کند
   و **هزینهٔ واقعی** روی دستت می‌گذارد. این جدی‌ترین ریسک این
   قابلیت است.

---

## فرانت — آنچه لازم است

### `PhoneAuthPage` یا تب در `AuthCard`

```
مرحلهٔ ۱: شماره موبایل
  - input با dir="ltr" و placeholder «۰۹۱۲ ۳۴۵ ۶۷۸۹»
  - اعداد فارسی را قبول کن و به لاتین نرمال کن
  - اعتبارسنجی زنده: ۰۹ + ۹ رقم
  - دکمهٔ «دریافت کد»

مرحلهٔ ۲: کد ۶ رقمی
  - ۶ خانهٔ جدا (OTP input) با paste پشتیبانی
  - شمارش معکوس ۲:۰۰ برای انقضا
  - «ارسال دوباره» بعد از ۶۰ ثانیه
  - auto-submit وقتی ۶ رقم کامل شد
```

**چیزهایی که اینجا رعایت شود (از اسکیل‌های موج‌های قبل):**

- `dir="ltr"` روی input شماره (وگرنه در RTL وارونه نمایش داده می‌شود)
- `inputMode="numeric"` و `autoComplete="one-time-code"` — iOS کد را
  خودکار پر می‌کند
- اعداد ورودی: `۰۹۱۲`، `٠٩١٢`، `0912` همه قبول شوند ولی ذخیره فقط
  `0912` — اسکیل `zt-iran-validation`
- خطاها با `role="alert"` اعلام شوند
- روی موبایل، کیبورد عددی باز شود
- **reduced-motion** روی شمارش معکوس (اگر انیمیشن دارد)

**حتماً در ورودی‌های موجود `AuthCard` هم ادغام شود** — نه یک صفحهٔ
جدا. کاربر نباید دو مسیر جدا ببیند.

---

## آنچه در `recover` عوض می‌شود

الان رمز موقت را روی صفحه نشان می‌دهد. با `phone` موجود:

```
اگر user.phone هست → کد OTP بفرست (امن‌تر)
اگر نیست          → همان رمز موقت روی صفحه (fallback)
```

این **بهبود امنیتی** است که حالا ممکن شد.

---

## قیودی که نباید نقض شوند

1. **مسیر قدیمی `username`+`password` نمی‌شکند.** حساب‌های موجود
   باید بدون هیچ تغییری کار کنند. این یک افزودن است، نه جایگزینی.

2. **کد خام هرگز ذخیره نمی‌شود.** نه در DB، نه در لاگ.
   `ConsoleProvider` تنها جایی است که کد چاپ می‌شود و آن هم
   **فقط وقتی `SMS_PROVIDER=console`** — هرگز در تولید.

3. **`no phone enumeration`**: پاسخ `/otp/request` همیشه یکسان.
   کد را با `secrets` بساز، نه `random`.

4. **بدون پکیج جدید Python اگر ممکن است.** `urllib.request` برای
   Kavenegar کافی است — SDK رسمی هم فقط wrapper همان است. کد وابسته
   کمتر، سرور سبک‌تر.

5. **SMS هزینه دارد.** rate limit جدی است، نه تزئینی.

---

## ترتیب کار

| # | کار | کامیت |
|---|---|---|
| ۱ | `0008_phone_auth.sql` + تست روی دیتابیس محلی | جدا |
| ۲ | `app/otp.py` (request/verify) + تست واحد | جدا |
| ۳ | `app/providers/sms.py` با `ConsoleProvider` | جدا |
| ۴ | اندپوینت‌های `/otp/request` و `/otp/verify` | جدا |
| ۵ | `KavenegarProvider` (تست با شمارهٔ خودت) | جدا |
| ۶ | فرانت: تب موبایل در `AuthCard` | جدا |
| ۷ | `recover` با OTP برای شماره‌دارها | جدا |
| ۸ | axe + Lighthouse روی صفحهٔ جدید | جدا |

**اول ۱ تا ۴ با `ConsoleProvider`** — یعنی کل جریان بدون یک ریال
هزینه تست شود. بعد از اینکه جریان پاس شد، Kavenegar.

## تصمیم‌هایی که قبل از شروع از شما می‌خواهم

1. **کدام درگاه؟** پیشنهاد من Kavenegar. اگر خط پنل آماده دارید،
   بگویید کلیدش را کجا بگذاریم.
2. **موبایل اجباری یا اختیاری؟** پیشنهاد من اختیاری (هر دو مسیر).
3. **`username` سرور بسازد یا کاربر؟** پیشنهاد من سرور (`user_0912xxxxxxx`).

بدون این سه، شروع نکن. با جواب، از ۱ شروع کن.

## NOT_TESTED که باید ثبت شود

- پیامک واقعی به شمارهٔ ایرانی از ایران (این را باید خودت با
  شمارهٔ خودت تست کنی)
- تأخیر واقعی رسیدن پیامک (Kavenegar معمولاً ۵–۳۰ ثانیه)
- رفتار با خطوط مخابراتی (۰۲۱…) — آیا پیامک می‌رسد؟
