import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react'

import { cn } from '@/lib/utils'

/**
 * شش خانهٔ جدا برای کد یک‌بارمصرف.
 *
 * چرا شش اینپوت و نه یکی: کاربر کد را از پیامک می‌خواند و رقم‌به‌رقم
 * تایپ می‌کند؛ شش خانه یعنی می‌بیند کجا رسیده و اشتباه را می‌گیرد.
 * و با `autoComplete="one-time-code"` روی خانهٔ اول، iOS کد را از
 * پیامک خودش پر می‌کند.
 *
 * چهار رفتار که در یک اینپوت تنها سخت می‌شوند:
 *   · چسباندن (paste) — کد از پیامک کپی می‌شود، نه تایپ
 *   · Backspace روی خانهٔ خالی → برگرد به خانهٔ قبل، نه بی‌اثر
 *   · فلش چپ/راست → جابه‌جایی، چون کاربر انتظارش را دارد
 *   · پر شدن ششمین رقم → ثبت خودکار، بدون زدن دکمه
 */
export function OtpInput({
  value,
  onChange,
  onComplete,
  disabled = false,
  length = 6,
  label,
}: {
  value: string
  onChange: (next: string) => void
  /** وقتی هر شش رقم پر شد. برای ثبت خودکار. */
  onComplete?: (code: string) => void
  disabled?: boolean
  length?: number
  /** نام قابل‌خواندن برای screen reader — «کد پیامک». */
  label: string
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([])

  const digits = Array.from({ length }, (_, i) => value[i] ?? '')

  function setAt(index: number, digit: string) {
    const next = digits.slice()
    next[index] = digit
    const joined = next.join('')
    onChange(joined)
    /* `every(Boolean)` و نه `joined.length === length`: خانه‌های خالی
       رشتهٔ خالی می‌گذارند که طول را کوتاه نمی‌کند، پس یک کد ناقص مثل
       «12_456» می‌توانست طولِ درست داشته باشد و زودثبت شود. */
    if (next.every(Boolean) && onComplete) onComplete(joined)
    return joined
  }

  function handleChange(index: number, raw: string) {
    // کاربر ممکن است یک‌جا چند رقم بچسباند (paste از پیامک) — یا یک
    // کاراکتر غیررقمی بزند که باید دور ریخته شود.
    const digitsOnly = raw.replace(/\D/g, '')
    if (!digitsOnly) {
      setAt(index, '')
      return
    }
    if (digitsOnly.length > 1) {
      fill(index, digitsOnly)
      return
    }
    setAt(index, digitsOnly)
    // برو به خانهٔ بعد، مگر اینکه آخرین باشد
    if (index < length - 1) refs.current[index + 1]?.focus()
  }

  /** چند رقم از این خانه به بعد — مشترک بین paste و تایپ پشت‌سرهم. */
  function fill(start: number, incoming: string) {
    const next = digits.slice()
    for (let i = 0; i < incoming.length && start + i < length; i++) {
      next[start + i] = incoming[i]
    }
    const joined = next.join('')
    onChange(joined)
    // فوکوس روی آخرین خانهٔ پر‌شده، نه اولی
    const lastFilled = Math.min(start + incoming.length, length - 1)
    refs.current[lastFilled]?.focus()
    if (next.every((d) => d) && onComplete) onComplete(next.join(''))
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>, index: number) {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '')
    if (text) fill(index, text.slice(0, length - index))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key === 'Backspace') {
      // روی خانهٔ پر: پاکش کن و همان‌جا بمان.
      // روی خانهٔ خالی: برو عقب و آن را پاک کن — بدون این، کاربر
      // گیر می‌کند و باید با ماوس جای خودش را پیدا کند.
      if (digits[index]) {
        setAt(index, '')
      } else if (index > 0) {
        refs.current[index - 1]?.focus()
        setAt(index - 1, '')
      }
      e.preventDefault()
      return
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      refs.current[index - 1]?.focus()
      e.preventDefault()
    }
    if (e.key === 'ArrowRight' && index < length - 1) {
      refs.current[index + 1]?.focus()
      e.preventDefault()
    }
  }

  return (
    /* `dir="ltr"` روی کل گروه: کد یک دنبالهٔ عددی است و در RTL وارونه
       نمایش داده می‌شود. خانهٔ اول باید چپ‌ترین باشد، همان‌طور که کاربر
       کد را می‌خواند. */
    <div dir="ltr" className="flex justify-center gap-2" role="group" aria-label={label}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el }}
          value={digit}
          onChange={(e) => handleChange(i, e.target.value)}
          onPaste={(e) => handlePaste(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          /* فقط خانهٔ اول autoComplete می‌گیرد: iOS کد پیامک را یک‌جا در
             همان می‌ریزد و `fill` بقیه را پر می‌کند. روی هر شش‌تا، iOS
             شش بار تلاش می‌کند و نتیجه بی‌قاعده می‌شود. */
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          inputMode="numeric"
          /* `type="text"` و نه `number`: با number، مرورگر «۰۱۲» را
             صفرِ ابتدایی حساب می‌کند و خالی نشان می‌دهد. */
          type="text"
          maxLength={1}
          aria-label={`${label} — رقم ${i + 1}`}
          className={cn(
            'h-12 w-10 rounded-xl border border-input bg-card text-center',
            'text-lg font-extrabold shadow-soft',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'disabled:opacity-60',
          )}
        />
      ))}
    </div>
  )
}
