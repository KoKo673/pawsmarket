import { ArrowRight, Loader2, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { OtpInput } from '@/components/auth/OtpInput'
import { formatPhoneForDisplay, isValidIranMobile, normalisePhone } from '@/components/auth/phone'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi, setToken } from '@/lib/social-api'
import { useAuthStore } from '@/store/auth.store'

/**
 * ورود و ثبت‌نام با شماره موبایل.
 *
 * مسیر دوم است، نه جایگزین: `username + password` سر جایش می‌ماند. کاربر
 * با هر کدام راحت‌تر است انتخاب می‌کند، و کسی که شماره‌اش را نمی‌خواهد
 * بدهد هم می‌تواند حساب بسازد.
 *
 * دو مرحله: شماره، بعد کد. `purpose` در مرحلهٔ اول تعیین می‌شود —
 * «signup» حساب می‌سازد اگر نبود، «login» فقط وارد می‌کند. سرور هر دو
 * را به یک شکل پاسخ می‌دهد (بدون افشای وجود شماره)، پس فرانت از روی
 * پاسخ حدس نمی‌زند؛ فقط `is_new` را بعد از تأیید موفق می‌بیند.
 */
export function PhoneAuthForm() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next') || '/'
  const hydrate = useAuthStore((s) => s.hydrate)

  const [stage, setStage] = useState<'phone' | 'code'>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  // شمارش معکوس ارسال دوباره — ۶۰ ثانیه، همان که در طرح بود.
  const [resendIn, setResendIn] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (resendIn <= 0) return
    timerRef.current = setInterval(() => {
      setResendIn((s) => (s <= 1 ? 0 : s - 1))
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [resendIn])

  const normalised = normalisePhone(phone)
  const phoneOk = isValidIranMobile(phone)

  async function requestCode(e?: React.FormEvent) {
    e?.preventDefault()
    setError(null)
    setNotice(null)
    if (!phoneOk) {
      setError('شماره موبایل معتبر نیست؛ مثل ۰۹۱۲۳۴۵۶۷۸۹')
      return
    }
    setBusy(true)
    try {
      /* هدف از همان اول «signup» است: سرور اگر شماره حساب داشته باشد
         کد ورود می‌فرستد، و اگر نداشته باشد کد ثبت‌نام. یعنی کاربر
         لازم نیست بداند حساب دارد یا نه — و همین «نمی‌داند» همان چیزی
         است که شمارش شماره را غیرممکن می‌کند. */
      await authApi.otpRequest(normalised, 'signup')
      setStage('code')
      setCode('')
      setResendIn(60)
      setNotice(`کد به ${formatPhoneForDisplay(normalised)} فرستاده شد`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ارسال کد انجام نشد')
    } finally {
      setBusy(false)
    }
  }

  async function verify(fullCode: string) {
    setError(null)
    setBusy(true)
    try {
      const r = await authApi.otpVerify(normalised, fullCode, 'signup')
      // توکن را همان‌جا می‌نشانیم و store را تازه می‌کنیم، تا کاربر
      // بدون یک درخواست اضافه به /me مستقیم وارد شود.
      setToken(r.token)
      await hydrate()
      navigate(r.is_new ? '/me' : next, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'کد تأیید نشد')
      setCode('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      {stage === 'phone' ? (
        <form onSubmit={requestCode} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp-phone">شماره موبایل</Label>
            <Input
              id="otp-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="۰۹۱۲ ۳۴۵ ۶۷۸۹"
              /* `dir="ltr"` حیاتی است: بدون آن «۰۹۱۲…» در چیدمان راست‌به‌چپ
                 وارونه نمایش داده می‌شود و کاربر عدد اشتباه می‌خواند. */
              dir="ltr"
              inputMode="numeric"
              autoComplete="tel"
              autoFocus
              /* مقدار خام می‌مانَد تا کاربر بتواند با اعداد فارسی تایپ کند؛
                 نرمال‌سازی هنگام ارسال انجام می‌شود. */
              aria-describedby="otp-phone-hint"
            />
            {phone.length > 0 && (
              <p id="otp-phone-hint" className="text-[11px] text-muted-foreground">
                {phoneOk
                  ? `کد به ${formatPhoneForDisplay(normalised)} فرستاده می‌شود`
                  : 'شماره باید با ۰۹ شروع شود و ۱۱ رقم باشد'}
              </p>
            )}
          </div>

          {error && <ErrorLine message={error} />}

          <Button type="submit" size="lg" className="w-full gap-2" disabled={busy || !phoneOk}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
            دریافت کد
          </Button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3 text-center">
            <p className="text-sm text-muted-foreground">
              کد شش‌رقمی را وارد کنید
            </p>
            {/* شماره‌ای که کد به آن رفت، با دکمهٔ برگشت — تا کاربری که
                شمارهٔ اشتباه زده گیر نکند و مجبور نشود صفحه را نبندد. */}
            <button
              type="button"
              onClick={() => { setStage('phone'); setError(null); setNotice(null) }}
              className="text-sm font-bold text-primary hover:underline"
            >
              {formatPhoneForDisplay(normalised)} — تغییر شماره
            </button>
          </div>

          <OtpInput
            value={code}
            onChange={setCode}
            onComplete={(full) => void verify(full)}
            disabled={busy}
            label="کد پیامک"
          />

          {busy && (
            <p className="flex items-center justify-center gap-2 text-sm font-semibold text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              در حال بررسی…
            </p>
          )}

          {!busy && notice && !error && (
            <p role="status" className="text-center text-xs text-muted-foreground">
              {notice}
            </p>
          )}

          {error && <ErrorLine message={error} />}

          <div className="text-center">
            {resendIn > 0 ? (
              <p className="text-xs text-muted-foreground">
                ارسال دوباره تا {toFa(resendIn)} ثانیه دیگر
              </p>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={busy}
                onClick={() => void requestCode()}
              >
                <RotateCcw className="size-3.5" />
                ارسال دوبارهٔ کد
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/** خطا با `role="alert"` تا screen reader همان لحظه اعلامش کند. */
function ErrorLine({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive"
    >
      {message}
    </p>
  )
}

function toFa(n: number): string {
  return String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])
}
