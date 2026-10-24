import { Loader2, Lock, ShieldCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi } from '@/lib/social-api'
import { useAuthStore } from '@/store/auth.store'

/**
 * ورود اختصاصی پنل مدیریت — /admin/login
 *
 * A separate door, not a redirect to the customer login.
 *
 * Why it exists as its own page rather than reusing `/login?next=/admin`:
 *
 *   * The customer login defaults to the phone/OTP tab, because that is
 *     what an Iranian shopper expects. An admin arriving there had to
 *     switch tabs every time, and the screen said nothing about the panel.
 *   * It gave no place to state the rule that actually applies: this door
 *     is keyed to an account with `is_admin` on the row, and a correct
 *     password from an ordinary account is still refused. Saying that up
 *     front is kinder than a silent bounce to «این صفحه پیدا نشد».
 *   * A shared session is a real risk on a shared machine. Signing in
 *     here always starts a fresh session, so an operator is never silently
 *     acting inside a shopper's session.
 *
 * The password is the account password — there is no second secret. The
 * `is_admin` flag on the user row is the gate, checked server-side on every
 * admin request; this page only decides what to draw.
 */

export function AdminLoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next') || '/admin'

  const login = useAuthStore((s) => s.login)
  const logout = useAuthStore((s) => s.logout)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!username.trim() || password.length < 8) {
      setError('نام کاربری و رمز عبور را کامل وارد کنید')
      return
    }

    setBusy(true)
    try {
      // A session already belonging to someone else must not be reused:
      // signing in here is an explicit claim of "this is the operator".
      await logout().catch(() => undefined)
      await login(username.trim(), password)

      // The store has the user now, but the flag comes from /me. Verify
      // before navigating, so an ordinary account is told plainly why it
      // is being turned away instead of landing on a 404-shaped panel.
      const { user } = await authApi.me()
      if (!user.is_admin) {
        await logout().catch(() => undefined)
        setError('این حساب دسترسی مدیریتی ندارد.')
        return
      }
      navigate(next, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ورود انجام نشد')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 pb-24 pt-28 sm:px-6">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-lifted sm:p-8">
        <div className="text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-glow">
            <ShieldCheck className="size-6" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-xl font-extrabold tracking-tight">ورود به پنل مدیریت</h1>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            فقط حساب‌هایی که دسترسی مدیریتی دارند از این در وارد می‌شوند.
          </p>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="admin-user">نام کاربری</Label>
            <Input
              id="admin-user"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="admin-pass">رمز عبور</Label>
            <Input
              id="admin-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full gap-2" disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Lock className="size-4" aria-hidden="true" />}
            ورود
          </Button>
        </form>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground">
          این صفحه جدا از ورود مشتری است و نشست قبلی را می‌بندد.
        </p>
      </div>
    </div>
  )
}
