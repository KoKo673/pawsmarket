import { Loader2, PawPrint } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { PhoneAuthForm } from '@/components/auth/PhoneAuthForm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  // Optional, and only for account recovery — the hint under the field says so
  // rather than leaving people to wonder what it will be used for.
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  /* تب پیش‌فرض «موبایل» است، چون برای کاربر ایرانی آشناتر است و
     ثبت‌نام با نام کاربری برایش غیرطبیعی است. مسیر قدیمی سر جایش است و
     کسی که رمز دارد یک کلیک فاصله دارد. */
  const [method, setMethod] = useState<'phone' | 'password'>('phone')

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
    if (mode === 'register' && email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError('ایمیل درست نیست')
      return
    }
    setBusy(true)
    try {
      if (mode === 'register') {
        await register(username, password, displayName || undefined,
                       email || undefined)
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
              // این صفحه حسابِ *شما* را می‌سازد، نه پروفایل حیوان. جملهٔ
              // قبلی همه را به ساختن پروفایل حیوان دعوت می‌کرد، که یعنی
              // جمله دربارهٔ کسی حرف می‌زد که هنوز حساب ندارد.
              ? 'حساب‌تان را بسازید تا پروفایل، آگهی و نوبت‌ها یک‌جا در دسترس باشند'
              : 'برای دیدن فید و پروفایل‌ها وارد شوید'}
          </p>
        </div>

        {/* دو مسیر، نه دو صفحه: کاربر انتخاب می‌کند با شماره وارد شود یا
            با رمز. تب پیش‌فرض موبایل است چون برای کاربر ایرانی آشناتر
            است، ولی مسیر قدیمی یک کلیک فاصله دارد و چیزی از دست نمی‌رود. */}
        <Tabs
          value={method}
          onValueChange={(v) => { setMethod(v as 'phone' | 'password'); setError(null) }}
          className="mb-1"
        >
          <TabsList className="w-full">
            <TabsTrigger value="phone" className="flex-1">شماره موبایل</TabsTrigger>
            <TabsTrigger value="password" className="flex-1">
              نام کاربری و رمز
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {method === 'phone' ? (
          <PhoneAuthForm />
        ) : (
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

          {mode === 'register' && (
            <div data-motion-item className="space-y-2">
              <Label htmlFor="email">
                ایمیل <span className="font-normal text-muted-foreground">(اختیاری)</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="برای بازیابی رمز، اگر آن را فراموش کردید"
                dir="ltr"
                autoComplete="email"
              />
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                فقط برای بازیابی رمز استفاده می‌شود. اگر ندهید، برای بازیابی
                باید با پشتیبانی تماس بگیرید.
              </p>
            </div>
          )}

          <div data-motion-item className="space-y-2">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="password">رمز عبور</Label>
              {mode === 'login' && (
                <Link
                  to="/forgot"
                  className="text-xs font-bold text-primary hover:underline"
                >
                  رمز را فراموش کرده‌اید؟
                </Link>
              )}
            </div>
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
        )}

        <p data-motion-item className="mt-6 text-center text-sm text-muted-foreground">
          {mode === 'register' ? (
            <>
              حساب دارید؟{' '}
              <Link to="/login" className="font-bold text-paw-700 dark:text-paw-300 hover:underline">
                وارد شوید
              </Link>
            </>
          ) : (
            <>
              حساب ندارید؟{' '}
              {/* paw-700 and not --primary: the brand orange as 14px text on
                  this card is 3.24, under the 4.5 that size needs. paw-700 is
                  the same hue at 4.89. The same shade the rest of the app's
                  text links already use. */}
              <Link to="/register" className="font-bold text-paw-700 dark:text-paw-300 hover:underline">
                ثبت‌نام کنید
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
