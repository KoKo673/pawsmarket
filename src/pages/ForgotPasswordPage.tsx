import { Check, KeyRound, Loader2, MessageSquare, PawPrint } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi } from '@/lib/social-api'

/**
 * بازیابی رمز — فقط با پیامک.
 *
 * This page used to ask for «نام کاربری + ایمیل ثبت‌شده» and then draw a
 * temporary password on screen. That could never work for anyone here:
 *
 *   · No SMTP is configured, so nothing was ever emailed.
 *   · All 20 active accounts have an empty email column — the field was
 *     optional at signup and nobody filled it.
 *   · The password it drew was, for any account without a matching email,
 *     the *placeholder* password — which by design is never hashed and
 *     never verifies. So the screen showed a code that looked real and was
 *     guaranteed not to work.
 *
 * Reported exactly like that from the product: «از من ایمیل گرفت و یک کد
 * نشانم داد که وارد کردم کار نمی‌کرد، ایمیل هم نیامد.»
 *
 * Now it asks for the phone. The server sends a real password by SMS to a
 * number that must already be *verified*, and nothing sensitive comes back
 * in the response. The response is identical whether or not the account
 * exists, so this page cannot be used to discover who has an account —
 * which is why it says "if that number is registered" rather than
 * "wrong number".
 */
export function ForgotPasswordPage() {
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const digits = phone.replace(/\D/g, '')
    if (digits.length < 10) {
      setError('شمارهٔ موبایل را کامل وارد کنید')
      return
    }

    setBusy(true)
    try {
      await authApi.recover(phone.trim())
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'مشکلی پیش آمد')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-20 pt-28 sm:px-6">
      <div data-motion-section className="glass rounded-3xl p-8 shadow-lifted">
        <div data-motion-item className="mb-7 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-glow">
            <KeyRound className="size-7" />
          </span>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight">
            بازیابی رمز عبور
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            شمارهٔ موبایلی که با آن ثبت‌نام کرده‌اید را بنویسید تا رمز تازه
            با پیامک برسد.
          </p>
        </div>

        {done ? (
          <div data-motion-item className="space-y-4">
            <div className="rounded-2xl border border-accent/30 bg-accent/10 p-4 text-center">
              <MessageSquare className="mx-auto size-7 text-accent" aria-hidden="true" />
              <p className="mt-2 text-sm font-bold text-accent">
                اگر این شماره در پازمارکت ثبت شده باشد، رمز تازه پیامک شد
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                پیامک ممکن است چند دقیقه طول بکشد. با رمز جدید وارد شوید و
                بعد از «حساب من» رمز دلخواهتان را بگذارید.
              </p>
            </div>

            <Button asChild size="lg" className="w-full">
              <Link to="/login">رفتن به صفحه‌ی ورود</Link>
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              پیامک نرسید؟ مطمئن شوید شماره همان است که با آن ثبت‌نام
              کرده‌اید، و{' '}
              <Link to="/support" className="font-bold text-primary hover:underline">
                به پشتیبانی پیام بدهید
              </Link>
              .
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div data-motion-item className="space-y-2">
              <Label htmlFor="rp">شمارهٔ موبایل</Label>
              <Input
                id="rp"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                dir="ltr"
                inputMode="numeric"
                autoComplete="tel"
                required
              />
            </div>

            {error && (
              <p data-motion-item role="alert"
                 className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
                {error}
              </p>
            )}

            <Button data-motion-item type="submit" size="lg"
                    className="w-full gap-2" disabled={busy}>
              {busy
                ? <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                : <MessageSquare className="size-4" aria-hidden="true" />}
              ارسال رمز با پیامک
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              رمزتان را به یاد آوردید؟{' '}
              <Link to="/login" className="font-bold text-primary hover:underline">
                وارد شوید
              </Link>
            </p>
          </form>
        )}
      </div>

      {done && (
        <p data-motion-item className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <Check className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden="true" />
          به‌خاطر امنیت، همهٔ دستگاه‌هایی که با این حساب وارد بودند از حساب
          خارج شدند.
        </p>
      )}
      {!done && (
        <p data-motion-item className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <PawPrint className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
          بازیابی فقط با پیامک است، چون ایمیلی برای هیچ حسابی ثبت نشده. اگر
          شماره‌تان عوض شده، از پشتیبانی بخواهید.
        </p>
      )}
    </div>
  )
}
