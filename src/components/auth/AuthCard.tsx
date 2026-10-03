import { Loader2, PawPrint } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/auth.store'

/**
 * فرم ورود/ثبت‌نام — یک کارت شیشه‌ای، خطاهای فارسی زیر فیلد.
 * بعد از موفقیت به ?next= (یا خانه) می‌رود.
 */
export function AuthCard({ mode }: { mode: 'login' | 'register' }) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next') || '/'
  const login = useAuthStore((s) => s.login)
  const register = useAuthStore((s) => s.register)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    // اعتبارسنجی سبک سمت کلاینت (سرور هم چک می‌کند)
    if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
      setError('نام کاربری باید ۳ تا ۲۴ کاراکتر انگلیسی، عدد یا _ باشد')
      return
    }
    if (password.length < 8) {
      setError('رمز عبور باید حداقل ۸ کاراکتر باشد')
      return
    }
    setBusy(true)
    try {
      if (mode === 'register') {
        await register(username, password, displayName || undefined)
      } else {
        await login(username, password)
      }
      navigate(next, { replace: true })
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
            <PawPrint className="size-7" />
          </span>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight">
            {mode === 'register' ? 'ساخت حساب در پازمارکت' : 'خوش برگشتید'}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {mode === 'register'
              ? 'برای حیوان‌تان پروفایل بسازید، لحظه منتشر کنید و دوست پیدا کنید'
              : 'برای دیدن فید و پروفایل‌ها وارد شوید'}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === 'register' && (
            <div data-motion-item className="space-y-2">
              <Label htmlFor="display_name">نام نمایشی (اختیاری)</Label>
              <Input
                id="display_name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="مثلاً: سارا و پشمک"
                maxLength={60}
              />
            </div>
          )}

          <div data-motion-item className="space-y-2">
            <Label htmlFor="username">نام کاربری</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="فقط حروف انگلیسی، عدد و _"
              dir="ltr"
              autoComplete="username"
              required
            />
          </div>

          <div data-motion-item className="space-y-2">
            <Label htmlFor="password">رمز عبور</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="حداقل ۸ کاراکتر"
              dir="ltr"
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              required
            />
          </div>

          {error && (
            <p data-motion-item className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
              {error}
            </p>
          )}

          <Button data-motion-item type="submit" size="lg" className="w-full gap-2" disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            {mode === 'register' ? 'ساخت حساب' : 'ورود'}
          </Button>
        </form>

        <p data-motion-item className="mt-6 text-center text-sm text-muted-foreground">
          {mode === 'register' ? (
            <>
              حساب دارید؟{' '}
              <Link to="/login" className="font-bold text-primary hover:underline">
                وارد شوید
              </Link>
            </>
          ) : (
            <>
              حساب ندارید؟{' '}
              <Link to="/register" className="font-bold text-primary hover:underline">
                ثبت‌نام کنید
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
