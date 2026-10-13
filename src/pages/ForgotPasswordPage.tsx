import { Check, Copy, KeyRound, Loader2, PawPrint } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi } from '@/lib/social-api'

/**
 * بازیابی رمز — دو مرحله است، چون در این استقرار سرویس ایمیل وجود ندارد.
 *
 * The server answers identically whether or not the account exists, so the
 * screen cannot reveal which usernames are real. When it does succeed the
 * temporary password is shown once, with a copy button — there is no mail to
 * send it to, so this screen IS the delivery.
 */
export function ForgotPasswordPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ temp?: string; minutes?: number;
                                        username?: string } | null>(null)
  const [copied, setCopied] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!username.trim() || !email.trim()) {
      setError('نام کاربری و ایمیل هر دو لازم است')
      return
    }
    setBusy(true)
    try {
      const r = await authApi.recover(username.trim(), email.trim())
      setResult({
        temp: r.temp_password,
        minutes: r.expires_in_minutes,
        username: r.username,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'مشکلی پیش آمد')
    } finally {
      setBusy(false)
    }
  }

  async function copy() {
    if (!result?.temp) return
    try {
      await navigator.clipboard.writeText(result.temp)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard blocked — the password is on screen to read out */
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
            نام کاربری و ایمیلی که هنگام ثبت‌نام دادید را بنویسید تا یک رمز
            موقت بگیرید.
          </p>
        </div>

        {result?.temp ? (
          <div data-motion-item className="space-y-4">
            <div className="rounded-2xl border border-accent/30 bg-accent/10 p-4">
              <p className="text-sm font-bold text-accent">
                رمز موقت شما (فقط همین یک‌بار نشان داده می‌شود)
              </p>
              <div className="mt-3 flex items-center gap-2">
                <code
                  dir="ltr"
                  className="min-w-0 flex-1 rounded-xl bg-card px-4 py-3 text-center text-lg font-extrabold tracking-wider"
                >
                  {result.temp}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copy}
                  aria-label="کپی رمز موقت"
                >
                  {copied ? <Check className="size-4 text-accent" />
                          : <Copy className="size-4" />}
                </Button>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                {result.minutes
                  ? `تا ${result.minutes} دقیقه اعتبار دارد. `
                  : ''}
                با آن وارد شوید، بعد از «حساب من» رمز تازه بگذارید.
              </p>
            </div>

            <Button asChild size="lg" className="w-full gap-2">
              <Link to="/login">رفتن به صفحه‌ی ورود</Link>
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              به‌خاطر امنیت، همه‌ی دستگاه‌های دیگری که با این حساب وارد بودند
              از حساب خارج شدند.
            </p>
          </div>
        ) : result ? (
          <div data-motion-item className="space-y-4">
            <p className="rounded-xl bg-muted px-4 py-3 text-sm leading-relaxed text-muted-foreground">
              اگر این نام کاربری و ایمیل با هم بخوانند، رمز موقت ساخته می‌شود.
              اگر رمز نگرفتید، یعنی ایمیل با ثبت‌نام نمی‌خواند — با پشتیبانی
              تماس بگیرید.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link to="/login">بازگشت به ورود</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div data-motion-item className="space-y-2">
              <Label htmlFor="ru">نام کاربری</Label>
              <Input
                id="ru"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="فقط حروف انگلیسی، عدد و _"
                dir="ltr"
                autoComplete="username"
                required
              />
            </div>
            <div data-motion-item className="space-y-2">
              <Label htmlFor="re">ایمیل ثبت‌شده</Label>
              <Input
                id="re"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="همان ایمیلی که در ثبت‌نام دادید"
                dir="ltr"
                autoComplete="email"
                required
              />
            </div>

            {error && (
              <p data-motion-item className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
                {error}
              </p>
            )}

            <Button data-motion-item type="submit" size="lg"
                    className="w-full gap-2" disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" />}
              گرفتن رمز موقت
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

      {!result && (
        <p data-motion-item className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <PawPrint className="mt-0.5 size-3.5 shrink-0 text-primary" />
          اگر هنگام ثبت‌نام ایمیلی وارد نکردید، بازیابی خودکار ممکن نیست —
          از «حساب من» بعد از ورود می‌توانید ایمیل اضافه کنید.
        </p>
      )}
    </div>
  )
}