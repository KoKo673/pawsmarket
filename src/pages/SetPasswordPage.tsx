import { Check, KeyRound, Loader2, PawPrint, ShieldCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi } from '@/lib/social-api'
import { useAuthStore } from '@/store/auth.store'

/**
 * گذاشتن رمز برای حسابی که با کد یک‌بارمصرف ساخته شده.
 *
 * ── The gap this closes ──────────────────────────────────────────────
 * Signing up with a phone code creates the account with no password at
 * all. Every screen that changes a password asks for the current one —
 * correctly, so a borrowed phone cannot lock the owner out — so a
 * phone-only account could never get one. It stayed reachable only by SMS,
 * and losing the SIM meant losing the account.
 *
 * This page is the one-time way out: it only works while no password
 * exists. The server enforces that (409 otherwise), so this cannot be used
 * to replace somebody else's password from a borrowed session.
 */
const MIN_LENGTH = 8

export function SetPasswordPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < MIN_LENGTH) {
      setError(`رمز باید دست‌کم ${MIN_LENGTH} نویسه باشد`)
      return
    }
    if (password !== confirm) {
      setError('دو رمز با هم یکی نیستند')
      return
    }

    setBusy(true)
    try {
      await authApi.setPassword(password)
      setDone(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'مشکلی پیش آمد'
      // The 409 case has a fixed meaning and a better next step than a retry.
      setError(
        message.includes('از قبل رمز دارد')
          ? 'این حساب از قبل رمز دارد. برای عوض کردنش از صفحهٔ حساب من استفاده کنید.'
          : message,
      )
    } finally {
      setBusy(false)
    }
  }

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-md px-4 pb-20 pt-28 sm:px-6">
        <div className="glass rounded-3xl p-8 text-center shadow-lifted">
          <p className="text-sm leading-relaxed text-muted-foreground">
            برای گذاشتن رمز، اول وارد حساب شوید.
          </p>
          <Button asChild size="lg" className="mt-5 w-full">
            <Link to="/login">رفتن به صفحهٔ ورود</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-20 pt-28 sm:px-6">
      <div className="glass rounded-3xl p-8 shadow-lifted">
        <div className="mb-7 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-glow">
            <KeyRound className="size-7" />
          </span>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight">
            گذاشتن رمز عبور
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            حساب شما با پیامک ساخته شده و رمز ندارد. یک رمز بگذارید تا
            دفعهٔ بعد بتوانید بدون پیامک هم وارد شوید.
          </p>
        </div>

        {done ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-accent/30 bg-accent/10 p-4 text-center">
              <ShieldCheck className="mx-auto size-7 text-accent" aria-hidden="true" />
              <p className="mt-2 text-sm font-bold text-accent">
                رمز شما گذاشته شد
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                از این پس می‌توانید با نام کاربری و همین رمز وارد شوید.
                ورود با پیامک هم مثل قبل کار می‌کند.
              </p>
            </div>
            <Button size="lg" className="w-full" onClick={() => navigate('/me')}>
              رفتن به حساب من
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="np">رمز تازه</Label>
              <Input
                id="np"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <p className="text-xs text-muted-foreground">
                دست‌کم {MIN_LENGTH} نویسه.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cp">تکرار رمز</Label>
              <Input
                id="cp"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>

            {error && (
              <p role="alert"
                 className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full gap-2" disabled={busy}>
              {busy
                ? <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                : <KeyRound className="size-4" aria-hidden="true" />}
              گذاشتن رمز
            </Button>
          </form>
        )}
      </div>

      {!done && (
        <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <PawPrint className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
          اگر ترجیح می‌دهید همیشه با پیامک وارد شوید، لازم نیست رمزی بگذارید.
        </p>
      )}
      {done && (
        <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <Check className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden="true" />
          به‌خاطر امنیت، بقیهٔ دستگاه‌هایی که با این حساب وارد بودند از حساب خارج شدند.
        </p>
      )}
    </div>
  )
}
