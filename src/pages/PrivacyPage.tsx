import { useEffect } from 'react'
import { Link } from 'react-router-dom'


/**
 * سیاست حریم خصوصی — نوشته‌شده از روی کد، نه از روی یک الگوی آماده.
 *
 * Every claim below was checked against what the system actually does
 * (2026-11-17), because a privacy policy that describes a different
 * system is worse than none: it is a written promise that is false.
 *
 * The specifics that made this page worth writing carefully:
 *
 *   - `page_views` stores NO raw IP. It stores `ip_hash`, a salted
 *     SHA-256 that changes with the salt, so it can answer "how many
 *     distinct visitors today" and cannot identify anyone. There is no
 *     cookie and nothing in localStorage for analytics.
 *   - The phone number is the identity. It is marked verified only after
 *     an SMS code, and that is what makes password recovery possible.
 *   - The data export endpoint is the same data this page describes, so
 *     the section on "your rights" points at a feature that exists.
 *   - Orders and bookings stay after account deletion with `user_id`
 *     NULL — said plainly here rather than discovered by a customer.
 */
export function PrivacyPage() {
  useEffect(() => {
    // Title and description matter here more than on other pages: this is
    // a page people reach from a search engine or a trust badge, not from
    // browsing inside the site.
    const prev = document.title
    document.title = 'سیاست حریم خصوصی — پازمارکت'
    return () => {
      document.title = prev
    }
  }, [])

  return (
    <div className="mx-auto max-w-3xl px-4 py-10" dir="rtl">
      <h1 className="text-2xl font-extrabold">سیاست حریم خصوصی</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        آخرین به‌روزرسانی: ۲۶ آبان ۱۴۰۵
      </p>

      <section className="mt-8 space-y-3 text-sm leading-relaxed">
        <h2 className="pt-4 text-lg font-extrabold">چه چیزی جمع می‌کنیم</h2>
        <p>
          فقط چیزی که برای کار کردن سایت لازم است:
        </p>
        <ul className="ms-5 list-disc space-y-2">
          <li>
            <strong>شمارهٔ موبایل</strong> — هویت حساب شما. تا وقتی کد پیامکی
            را تأیید نکنید، «تأییدشده» علامت نمی‌خورد.
          </li>
          <li>
            <strong>نام کاربری و رمز عبور</strong> — رمز هرگز به‌صورت متن
            ذخیره نمی‌شود؛ فقط هش آن (PBKDF2 با نمک تصادفی).
          </li>
          <li>
            <strong>آنچه خودتان می‌نویسید</strong> — پروفایل، پست‌ها،
            دیدگاه‌ها، پروفایل حیوان‌ها و متن تیکت پشتیبانی.
          </li>
          <li>
            <strong>سفارش‌ها و نوبت‌ها</strong> — نام، تلفن تماس، نشانی و
            اقلام، تا سفارش به دستتان برسد.
          </li>
          <li>
            <strong>بازدید صفحه‌ها</strong> — مسیر صفحه، شهر، و یک هشِ
            نمک‌دار از IP. <strong>IP خام ذخیره نمی‌شود</strong> و این هش با
            عوض شدن نمک تغییر می‌کند؛ یعنی فقط «چند بازدیدکنندهٔ متمایز
            امروز» را می‌شمارد و کسی را شناسایی نمی‌کند.
          </li>
        </ul>

        <h2 className="pt-6 text-lg font-extrabold">چه چیزی جمع نمی‌کنیم</h2>
        <ul className="ms-5 list-disc space-y-2">
          <li>کوکی ردیابی. برای همین بنر کوکی هم نداریم.</li>
          <li>اثر انگشت دستگاه، اندازهٔ صفحه یا فهرست افزونه‌ها.</li>
          <li>شمارهٔ کارت بانکی. پرداخت در درگاه زرین‌پال انجام می‌شود و
            اطلاعات کارت هرگز به سرور ما نمی‌رسد.</li>
        </ul>

        <h2 className="pt-6 text-lg font-extrabold">تحلیل بازدید</h2>
        <p>
          برای فهمیدن اینکه کدام صفحه‌ها کار می‌کنند و کدام نه، از Google
          Analytics 4 استفاده می‌کنیم. <strong>این ابزار را طوری تنظیم
          کرده‌ایم که هیچ کوکی نگذارد</strong> (Consent Mode با
          <code className="mx-1 rounded bg-muted px-1">analytics_storage: denied</code>).
          یعنی رویدادها ارسال می‌شوند ولی شناسه‌ای روی دستگاه شما ذخیره
          نمی‌شود و در بازدیدهای بعدی شناسایی نمی‌شوید. علاوه بر این:
        </p>
        <ul className="ms-5 list-disc space-y-2">
          <li>
            <strong>IP ناشناس می‌شود</strong> (IP anonymisation) و هیچ
            سیگنال تبلیغاتی — نه <code>ad_storage</code> و نه
            <code className="mx-1">ad_user_data</code> — فرستاده نمی‌شود.
          </li>
          <li>
            در رویدادها فقط شناسهٔ محصول، مبلغ و تعداد می‌رود. نام، تلفن،
            نشانی و ایمیل هرگز به Google نمی‌رسد.
          </li>
          <li>
            این اسکریپت وقتی باز می‌شود که سایت analytics را تنظیم کرده
            باشد؛ اگر <code>VITE_GA4_ID</code> خالی باشد هیچ درخواستی به
            Google نمی‌رود.
          </li>
        </ul>

        <h2 className="pt-6 text-lg font-extrabold">چرا جمع می‌کنیم</h2>
        <p>
          برای همان کاری که انتظار دارید: تحویل سفارش، هماهنگی نوبت،
          بازیابی رمز، و پاسخ به تیکت. بس. چیزی برای فروش نداریم و نمی‌فروشیم.
        </p>

        <h2 className="pt-6 text-lg font-extrabold">چه کسی می‌بیند</h2>
        <p>
          کارکنان پشتیبانی برای رسیدگی به تیکت، و فروشگاهی که سفارش یا
          نوبت به او مربوط است — فقط همان اطلاعاتی که برای انجام کار لازم
          است.
        </p>

        <h2 className="pt-6 text-lg font-extrabold">حقوق شما</h2>
        <p>
          از صفحهٔ <Link to="/me" className="text-primary underline">حساب من</Link>{' '}
          می‌توانید همهٔ داده‌تان را در یک فایل JSON دانلود کنید، یا حساب را
          برای همیشه حذف کنید. هر دو بدون تماس با پشتیبانی کار می‌کنند.
        </p>
        <p>
          <strong>یک نکتهٔ صادقانه دربارهٔ حذف:</strong> وقتی حساب را حذف
          می‌کنید، پروفایل، حیوان‌ها، پست‌ها و دیدگاه‌ها پاک می‌شوند. ولی
          سفارش‌ها و نوبت‌های گذشته به‌عنوان سابقهٔ مالی و کاری باقی
          می‌مانند — دیگر به نام شما نیستند، ولی ردیف‌شان می‌ماند. علتش
          ساده است: سابقهٔ مالی که به درخواست مشتری خودش را پاک کند،
          سابقه نیست.
        </p>

        <h2 className="pt-6 text-lg font-extrabold">پیگیری</h2>
        <p>
          برای هر پرسشی دربارهٔ داده‌تان، از صفحهٔ{' '}
          <Link to="/support" className="text-primary underline">پشتیبانی</Link>{' '}
          تیکت بزنید. پاسخ می‌دهیم.
        </p>
      </section>

    </div>
  )
}
