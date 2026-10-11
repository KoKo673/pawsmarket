/**
 * Persian (Farsi) formatting helpers.
 *
 * Iranian UIs render user-facing numbers with Eastern-Arabic digits
 * (۰۱۲۳۴۵۶۷۸۹), the ٫ decimal separator and ٬ group separator.
 * Keep technical fields (input[type=number], tel: hrefs, lat/lng) in
 * Latin digits and convert only at the presentation layer.
 */

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹'

/** Convert every Latin digit in a string/number to its Persian glyph. */
export function faDigits(value: string | number): string {
  return String(value).replace(/\d/g, (d) => FA_DIGITS[Number(d)])
}

/** Group-separated Persian number: 25000000 → «۲۵٬۰۰۰٬۰۰۰» */
export function faNum(value: number): string {
  return new Intl.NumberFormat('fa-IR').format(value)
}

/** Persian decimal (rating etc.): 4.8 → «۴٫۸» */
export function faDecimal(value: number, digits = 1): string {
  return faDigits(value.toFixed(digits)).replace('.', '٫')
}

/** Price in Iranian Toman. `0` is shown as free/adoption. */
export function faPrice(value: number, freeLabel = 'رایگان'): string {
  if (value === 0) return freeLabel
  return `${faNum(value)} تومان`
}

/**
 * «۰۹:۰۰ تا ۲۱:۰۰» — opening hours the way Iranian shopfronts write them.
 * 24h input (`opensAt`/`closesAt`), Persian digits, `تا` instead of a hyphen.
 * A 00:00–23:59/24:00 span means the place never closes and is reported as
 * «شبانه‌روزی» rather than the literal «۰۰:۰۰ تا ۲۴:۰۰», which reads as a bug.
 */
export function faTimeRange(from?: string, to?: string): string {
  if (!from || !to) return 'ساعات ثبت نشده'
  const wrapsMidnight = (t: string) => t === '00:00' || t === '24:00'
  if (wrapsMidnight(from) && (wrapsMidnight(to) || to === '23:59')) return 'شبانه‌روزی'
  return `${faDigits(from)} تا ${faDigits(to)}`
}

/** Phone numbers keep their separators but show Persian digits: 021-88105091 → «۰۲۱-۸۸۱۰۵۰۹۱» */
export function faPhone(phone: string): string {
  return faDigits(phone.trim())
}

/**
 * Compact price for tight spaces (map pins, chips):
 * 2150000 → «۲٫۲م» · 420000 → «۴۲۰ه» (میلیون / هزار)
 * Millions keep one decimal below 10M so 2.15M never rounds to «۲م».
 */
export function faPriceShort(value: number): string {
  if (value === 0) return 'رایگان'
  if (value >= 1_000_000) {
    // Round via integer 100k steps — avoids float quirks (2.15M → «۲٫۲م»)
    const m = Math.round(value / 100_000) / 10
    return m < 10 ? `${faDigits(m.toFixed(1)).replace('.', '٫')}م` : `${faDigits(Math.round(m))}م`
  }
  if (value >= 1_000) return `${faDigits(Math.round(value / 1_000))}ه`
  return faDigits(value)
}
