import { Check, Loader2, PawPrint, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi } from '@/lib/social-api'
import { useAuthStore } from '@/store/auth.store'

/**
 * تکمیل ثبت‌نام — بعد از کد پیامک، قبل از هر چیز دیگر.
 *
 * Voice note 02: signing up with a phone silently names you
 * `user_09123456789`, and that is the name on your profile, your listings
 * and everything you share. The screen after the SMS should let you pick.
 *
 * The pet profile below it is deliberately **skippable** and visually
 * secondary. The note was explicit: «ممکنه اصلا نخوایم برای حیوانمون
 * پروفایل بسازیم» — plenty of people are here to buy something. Making
 * that step feel mandatory loses them at the door.
 *
 * This page cannot be returned to. The server refuses a second rename, so
 * a user who reloads it after finishing is sent on rather than shown a
 * form that will fail.
 */
export function CompleteSignupPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const hydrate = useAuthStore((s) => s.hydrate)

  const [name, setName] = useState('')
  const [checking, setChecking] = useState(false)
  const [verdict, setVerdict] = useState<'idle' | 'ok' | 'taken' | 'reserved' | 'format'>('idle')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // A name the account already chose means this step is behind them.
  const alreadyNamed = !!user && !user.username.startsWith('user_')

  useEffect(() => {
    if (alreadyNamed) navigate('/me', { replace: true })
  }, [alreadyNamed, navigate])

  // Debounced availability check: typing «ali» should not fire a request
  // per keystroke, and the answer has to be the server's, not a guess.
  useEffect(() => {
    const trimmed = name.trim()
    if (trimmed.length < 3) { setVerdict('idle'); return }
    setChecking(true)
    const id = setTimeout(() => {
      void (async () => {
        try {
          const r = await authApi.usernameAvailable(trimmed)
          setVerdict(!r.available && r.reason ? r.reason : 'ok')
        } catch {
          setVerdict('idle')
        } finally {
          setChecking(false)
        }
      })()
    }, 400)
    return () => { clearTimeout(id); setChecking(false) }
  }, [name])

  async function save(e?: React.FormEvent) {
    e?.preventDefault()
    setError(null)
    const trimmed = name.trim()
    if (trimmed.length < 3) return setError('نام کاربری حداقل ۳ نویسه است')
    if (verdict !== 'ok') return setError('این نام کاربری در دسترس نیست')

    setBusy(true)
    try {
      await authApi.setUsername(trimmed)
      await hydrate()
      navigate('/me', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ذخیره انجام نشد')
    } finally {
      setBusy(false)
    }
  }

  /*
    جهت فیلد از خودِ ورودی می‌آید، نه از یک مقدار ثابت.

    «علی» در کادری با `dir="ltr"` از سمت چپ چیده می‌شود و همان‌جا می‌ماند،
    ولی تیک در همان `end` می‌نشیند که در LTR سمت راست است — یعنی تیک
    می‌افتد روی آخرین حرف نام. برعکسش هم همین‌طور: نام انگلیسی در کادر
    RTL. یک `dir` که با اسکریپت تایپ‌شده هم‌جهت باشد، تیک و متن و پدینگ
    را همیشه در یک سمت نگه می‌دارد.

    `auto` به مرورگر می‌گوید از نخستین نویسهٔ قوی تعیین کند؛ چون سرور
    نامِ ترکیبی را رد می‌کند (فقط همه‌لاتین یا همه‌فارسی)، جهت وسط تایپ
    عوض نمی‌شود و تیک جا نمی‌پرد.
  */
  const dir: 'ltr' | 'rtl' =
    /[؀-ۿ]/.test(name) ? 'rtl'
    : name.length > 0 ? 'ltr'
    : 'ltr'

  const hint =
    checking ? 'در حال بررسی…'
    : verdict === 'ok' ? 'این نام آزاد است'
    : verdict === 'taken' ? 'این نام قبلاً گرفته شده'
    : verdict === 'reserved' ? 'این نام رزرو شده است'
    : verdict === 'format' ? 'همه انگلیسی (حروف، رقم، _) یا همه فارسی'
    : 'انگلیسی یا فارسی، ۳ تا ۳۰ نویسه'

  return (
    <div className="mx-auto max-w-lg px-4 pb-24 pt-28 sm:px-6">
      <div className="glass rounded-3xl p-6 shadow-lifted sm:p-8">
        <h1 className="text-2xl font-extrabold tracking-tight">خوش آمدید</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          یک نام کاربری برای خودتان انتخاب کنید. این نام در پروفایل و
          آگهی‌هایتان دیده می‌شود.
        </p>

        <form onSubmit={save} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cu-name">نام کاربری</Label>
            {/*
              جهت روی هر دو جعبه است، و از `dir`ِ بالای صفحه می‌آید.

              The wrapper used to be RTL while the input alone carried
              `dir="ltr"`, so `end-3` resolved to the LEFT edge but `pe-9`
              was a RIGHT padding: the tick sat over the first letter with
              no gap («✓Koko»).

              Hardcoding `ltr` on both fixed the Latin case and broke the
              Persian one — «علی» in an LTR box put the tick on its last
              letter instead. The direction has to follow the script that
              was actually typed, which is what `dir` above does; both
              `pe-9` and `end-3` are logical properties and flip with it.
            */}
            <div className="relative" dir={dir}>
              <Input
                id="cu-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                dir={dir}
                autoComplete="username"
                autoFocus
                aria-describedby="cu-hint"
                /* `pe-9` and `end-3` are logical, so they follow `dir`:
                   the padding and the icon always end up on the same side
                   as the end of the text, whichever script that is. */
                className="pe-9"
              />
              <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2">
                {checking ? <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  : verdict === 'ok' ? <Check className="size-4 text-accent" />
                  : verdict === 'idle' ? null
                  : <X className="size-4 text-destructive" />}
              </span>
            </div>
            <p
              id="cu-hint"
              className={`text-[11px] ${
                verdict === 'ok' ? 'text-accent'
                : verdict === 'idle' ? 'text-muted-foreground'
                : 'text-destructive'}`}
            >
              {hint}
            </p>
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full"
                  disabled={busy || verdict !== 'ok'}>
            {busy && <Loader2 className="me-2 size-4 animate-spin" />}
            ذخیره و ادامه
          </Button>
        </form>

        {/*
          پروفایل حیوان — فقط یک یادداشت، نه یک انتخاب.

          This was a card with a «فعلاً نه، بعداً» button that called
          `navigate('/me')` directly. A name typed into the field above was
          therefore discarded: the server never saw it, the account kept
          `user_09123456789`, and the button that looked like "skip the pet"
          actually skipped the whole page. Reported as
          «وقتی دکمه حیوان را بعدا اضافه میکنم ... بدون سیو شدن نام کاربری».

          There is no decision to make here — the pet profile lives on
          «حساب من» and is reachable from there. So there is no skip button,
          because there is nothing to skip: the only way off this page is
          saving the name.
        */}
        <div className="mt-8 rounded-2xl border border-border bg-muted/30 p-4">
          <div className="flex items-start gap-2">
            <PawPrint className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-sm font-bold">پروفایل حیوان خانگی</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                اگر حیوان دارید، بعد از ذخیرهٔ نام کاربری از «حساب من» برایش
                پروفایل بسازید. برای خرید از فروشگاه یا گرفتن نوبت، لازم نیست.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
