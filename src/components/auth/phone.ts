/**
 * نرمال‌سازی شمارهٔ موبایل ایران — آینهٔ `otp.normalise_phone` در سرور.
 *
 * چرا در هر دو طرف: سرور **مرجع** است و بدون آن کسی می‌تواند شکل خام
 * بفرستد و دو حساب با یک شماره بسازد. این نسخه در فرانت فقط برای
 * تجربهٔ کاربر است — تا «۰۹۱۲…» همان لحظه به «09123456789» تبدیل شود و
 * کاربر ببیند چه فرستاده می‌شود.
 *
 * اگر روزی این دو از هم جدا شدند، **سرور** درست است.
 */

// فارسی و عربی → لاتین. بدون این، «۰۹۱۲» و «0912» دو شمارهٔ جدا به نظر
// می‌رسند در حالی که یک‌اند.
const DIGIT_MAP: Record<string, string> = {
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
}

export function normalisePhone(raw: string): string {
  let s = raw.replace(/[۰-۹٠-٩]/g, (d) => DIGIT_MAP[d] ?? d)
  // جداکننده‌ها: فاصله، خط تیره، نقطه، پرانتز — همه در تایپ واقعی دیده می‌شوند
  s = s.replace(/[\s\-().]/g, '')
  if (s.startsWith('+98')) s = '0' + s.slice(3)
  else if (s.startsWith('0098')) s = '0' + s.slice(4)
  else if (s.startsWith('98') && s.length === 12) s = '0' + s.slice(2)
  else if (s.length === 10 && s.startsWith('9')) s = '0' + s
  return s
}

/** ۰۹XXXXXXXXX — موبایل ایران. خط ثابت (۰۲۱…) رد می‌شود. */
export function isValidIranMobile(raw: string): boolean {
  return /^09\d{9}$/.test(normalisePhone(raw))
}

/**
 * «۰۹۱۲ ۳۴۵ ۶۷۸۹» — برای نمایش، با فاصله.
 *
 * ورودی می‌تواند ناقص باشد (کاربر در حال تایپ است) و این نباید استثنا
 * بدهد؛ هر چه هست را گروه‌بندی می‌کند.
 */
export function formatPhoneForDisplay(raw: string): string {
  const s = normalisePhone(raw)
  if (s.length <= 4) return s
  if (s.length <= 7) return `${s.slice(0, 4)} ${s.slice(4)}`
  if (s.length <= 9) return `${s.slice(0, 4)} ${s.slice(4, 7)} ${s.slice(7)}`
  return `${s.slice(0, 4)} ${s.slice(4, 7)} ${s.slice(7, 11)}`
}
