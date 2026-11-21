import { Download, KeyRound, Loader2, LogOut, PawPrint, Plus, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { FollowButton } from '@/components/social/FollowButton'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { faDigits } from '@/lib/fa'
import { authApi, mediaUrl, socialApi, type PetProfile } from '@/lib/social-api'
import { useAuthStore } from '@/store/auth.store'
import { useGeoStore } from '@/store/geo.store'

/**
 * حساب من — پروفایل کاربر + پروفایل(های) حیوان + خروج.
 * اگر کاربر حیوانی ندارد، فرم «افزودن حیوان» را می‌بیند.
 */
export function MyAccountPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const origin = useGeoStore((s) => s.origin)

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [species, setSpecies] = useState('dog')
  const [bio, setBio] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const [showPwForm, setShowPwForm] = useState(false)
  const [pwBusy, setPwBusy] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [pwDone, setPwDone] = useState<string | null>(null)

  // دادهٔ من — دانلود فایل JSON حساب.
  const [exportBusy, setExportBusy] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const downloadMyData = async () => {
    setExportError(null)
    setExportBusy(true)
    try {
      await authApi.exportAccount()
    } catch (err) {
      setExportError((err as Error).message || 'دانلود داده انجام نشد')
    } finally {
      setExportBusy(false)
    }
  }

  // حذف حساب — فروریخته و پیش‌فرض بسته. یک بخش مخرب نباید با یک اسکرول
  // اتفاقی دیده شود، و «تأیید» هم باید تایپ شود، نه کلیک.
  const [showDelete, setShowDelete] = useState(false)
  const [delPassword, setDelPassword] = useState('')
  const [delConfirm, setDelConfirm] = useState('')
  const [delBusy, setDelBusy] = useState(false)
  const [delError, setDelError] = useState<string | null>(null)

  const submitDelete = async (e: FormEvent) => {
    e.preventDefault()
    setDelError(null)
    // A cheap local check so an obvious typo does not cost a round trip.
    // The server re-checks it; this is not the control.
    if (delConfirm.trim().toLowerCase() !== (user?.username ?? '').toLowerCase()) {
      setDelError('نام کاربری را دقیقاً مثل بالای صفحه بنویسید')
      return
    }
    setDelBusy(true)
    try {
      await authApi.deleteAccount(delPassword, delConfirm)
      // Local sign-out, then home. `logout()` also clears the token, so a
      // stale one cannot keep calling the API as a deleted account.
      await logout()
      navigate('/', { replace: true })
    } catch (err) {
      setDelError((err as Error).message || 'حذف حساب انجام نشد')
      setDelBusy(false)
    }
  }

  const submitPassword = async (e: FormEvent) => {
    e.preventDefault()
    setPwError(null)
    if (pwNew.length < 8) {
      setPwError('رمز جدید دست‌کم ۸ نویسه باشد')
      return
    }
    if (pwNew !== pwConfirm) {
      setPwError('رمز جدید و تکرارش یکسان نیست')
      return
    }
    setPwBusy(true)
    try {
      // A session is enough for the first setting; an existing password
      // needs the current one. The server answers 409 once a password
      // exists, which tells the user to use the "change" shape instead.
      let message: string | null = null
      try {
        message = (await socialApi.setPassword(pwNew)).message
      } catch (err) {
        const status = (err as Error & { status?: number }).status
        if (status !== 409) throw err
        message = (await socialApi.changePassword(pwCurrent, pwNew)).message
      }
      setPwDone(message)
      setPwNew('')
      setPwConfirm('')
      setPwCurrent('')
      setShowPwForm(false)
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'مشکلی پیش آمد')
    } finally {
      setPwBusy(false)
    }
  }

  const petsQuery = useQuery({
    queryKey: ['my-pet-profiles', origin.lat, origin.lng],
    queryFn: async () => {
      // پروفایل‌های خودم: با discover روی موقعیت خودم و فیلتر is_owner در بهترین حالت؛
      // ساده‌تر: فید پروفایل من از طریق discover + getProfile انجام می‌شود.
      const me = await socialApi.discover(origin.lat, origin.lng, 30000)
      const mine: PetProfile[] = []
      for (const item of me.items) {
        try {
          const p = await socialApi.getProfile(item.id)
          if (p.is_owner) mine.push(p)
        } catch {
          /* رد شو */
        }
      }
      return mine
    },
  })

  const pets = petsQuery.data ?? []

  async function createPet(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    setError(null)
    try {
      await socialApi.createProfile({
        name: name.trim(),
        species,
        bio: bio.trim() || undefined,
        lat: origin.lat,
        lng: origin.lng,
      })
      setName('')
      setBio('')
      setShowForm(false)
      await queryClient.invalidateQueries({ queryKey: ['my-pet-profiles'] })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ساخت پروفایل انجام نشد')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-28 sm:px-6">
      {/* کارت حساب */}
      <section data-motion-section className="glass rounded-3xl p-6 shadow-lifted">
        <div data-motion-item className="flex items-center gap-4">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-glow">
            <PawPrint className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-extrabold">{user?.display_name ?? user?.username}</h1>
            {/* `dir="auto"`, not `ltr`. The handle may now be Persian, and a
                hardcoded LTR layout puts the `@` on the wrong side of
                «@علی» — it reads as an e-mail address rather than a handle. */}
            <p className="text-xs text-muted-foreground" dir="auto">
              @{user?.username}
            </p>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={async () => {
              await logout()
              navigate('/')
            }}
          >
            <LogOut className="size-4" />
            خروج
          </Button>
        </div>

        {/*
          حسابی که هنوز نام انتخاب نکرده.

          A phone signup names the account `user_09123456789`. /welcome is
          where that gets fixed, but it was reachable only in the seconds
          right after the SMS — a user who navigated away, reloaded, or came
          back later had no link to it and kept the phone number as their
          public name forever. The server allows the rename exactly once
          while the name still starts with `user_`, so this link only
          appears in that window.
        */}
        {user?.username.startsWith('user_') && (
          <div data-motion-item className="mt-4 flex flex-wrap items-center gap-3
            rounded-2xl border border-primary/25 bg-primary/10 px-4 py-3">
            <p className="min-w-0 flex-1 text-xs leading-relaxed">
              نام کاربری شما موقتی است و شمارهٔ موبایلتان را نشان می‌دهد.
              یک نام برای خودتان انتخاب کنید.
            </p>
            <Button size="sm" onClick={() => navigate('/welcome')}>
              انتخاب نام کاربری
            </Button>
          </div>
        )}
      </section>

      {/* حیوانات من */}
      <section data-motion-section className="mt-8">
        <div data-motion-item className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-extrabold">حیوانات من</h2>
          <Button size="sm" className="gap-1.5" onClick={() => setShowForm((v) => !v)}>
            <Plus className="size-4" />
            افزودن حیوان
          </Button>
        </div>

        {showForm && (
          <form
            data-motion-item
            onSubmit={createPet}
            className="mb-6 space-y-4 rounded-2xl border border-border/60 bg-card p-5 shadow-soft"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pet_name">نام حیوان</Label>
                <Input
                  id="pet_name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثلاً پشمک"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pet_species">گونه</Label>
                <select
                  id="pet_species"
                  value={species}
                  onChange={(e) => setSpecies(e.target.value)}
                  className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-input bg-card px-4 text-sm font-semibold shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="dog">سگ</option>
                  <option value="cat">گربه</option>
                  <option value="rabbit">خرگوش</option>
                  <option value="bird">پرنده</option>
                  <option value="fish">ماهی</option>
                  <option value="small">حیوان کوچک</option>
                  <option value="other">سایر</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pet_bio">درباره</Label>
              <Textarea
                id="pet_bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="شخصیت، عادت‌ها، علاقه‌مندی‌ها…"
                rows={3}
                maxLength={500}
              />
            </div>
            {error && (
              <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive-text">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)} disabled={busy}>
                انصراف
              </Button>
              <Button type="submit" disabled={busy} className="gap-2">
                {busy && <Loader2 className="size-4 animate-spin" />}
                ساخت پروفایل
              </Button>
            </div>
          </form>
        )}

        {petsQuery.isLoading ? (
          // Same grid, same row shape and same 90px height as the cards
          // below — measured in the browser, not guessed. A one-line «در حال
          // بارگذاری…» was what this page showed before, and it shifted the
          // content by 0.575 CLS when the pets arrived.
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-4 shadow-soft"
              >
                <Skeleton className="size-14 shrink-0 rounded-2xl" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : pets.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-card px-6 py-10 text-center shadow-soft">
            <p className="text-sm font-semibold text-muted-foreground">
              هنوز حیوانی ثبت نکرده‌اید، با «افزودن حیوان» شروع کنید.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {pets.map((p) => (
              <Link
                key={p.pet.id}
                to={`/pet/${p.pet.id}`}
                data-motion-item
                className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-4 shadow-soft transition-[color,background-color,border-color,box-shadow,transform,opacity] hover:-translate-y-0.5 hover:shadow-lifted"
              >
                {p.profile.avatar_url ? (
                  <img
                    src={mediaUrl(p.profile.avatar_url)}
                    alt={p.pet.name}
                    className="size-14 rounded-2xl object-cover"
                  />
                ) : (
                  <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <PawPrint className="size-6" />
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate font-bold">{p.pet.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {faDigits(p.counts.posts)} لحظه · {faDigits(p.counts.followers)} دنبال‌کننده
                  </p>
                </div>
                <FollowButton
                  petId={p.pet.id}
                  initialFollowing={p.is_following}
                  initialCount={p.counts.followers}
                  className="ms-auto hidden sm:inline-flex"
                />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* رمز عبور — این‌جا بود که حلقه‌ی بازیابی کامل می‌شد.
          `/recover` یک رمز موقت می‌فرستد که ۳۰ دقیقه عمر دارد و صفحه‌ی
          فراموشی به کاربر می‌گوید «بعد از حساب من رمز دلخواه را بگذارید» —
          اما هیچ فرمتی وجود نداشت. بعد از ۳۰ دقیقه، حساب کاملاً قفل
          می‌شد، چون `/change-password` رمز فعلی می‌خواهد و `/set-password`
          وقتی رمز هست (409) رد می‌کند.

          حالا همین فرم همان دو راه را پوشش می‌دهد: اول امتحان
          `/set-password`، اگر سرور گفت «از قبل رمز دارد» خودکار به
          `/change-password` می‌زند. کاربر همیشه در همین صفحه می‌ماند،
          بدون پرش به صفحه‌ی دیگر. */}

      <section data-motion-section className="mt-8">
        <div data-motion-item className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-extrabold">
            <KeyRound className="size-5 text-primary" />
            رمز عبور
          </h2>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => setShowPwForm((v) => !v)}
            aria-expanded={showPwForm}
          >
            {showPwForm ? 'بستن' : 'تغییر رمز'}
          </Button>
        </div>

        {pwDone && (
          <p data-motion-item role="status"
             className="mb-4 rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm font-bold text-tide-800">
            {pwDone}
          </p>
        )}

        {showPwForm && (
          <form
            data-motion-item
            onSubmit={submitPassword}
            className="mb-6 space-y-4 rounded-2xl border border-border/60 bg-card p-5 shadow-soft"
          >
            <p className="text-xs leading-relaxed text-muted-foreground">
              اگر هنوز رمز ندارید، فقط رمز تازه را بنویسید. اگر رمز دارید،
              رمز فعلی‌تان هم لازم است.
            </p>

            <div className="space-y-2">
              <Label htmlFor="pw_current">رمز فعلی (اختیاری)</Label>
              <Input
                id="pw_current"
                type="password"
                value={pwCurrent}
                onChange={(e) => setPwCurrent(e.target.value)}
                autoComplete="current-password"
                dir="ltr"
                className="text-left"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pw_new">رمز تازه</Label>
              <Input
                id="pw_new"
                type="password"
                value={pwNew}
                onChange={(e) => setPwNew(e.target.value)}
                autoComplete="new-password"
                dir="ltr"
                className="text-left"
                minLength={8}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pw_confirm">تکرار رمز تازه</Label>
              <Input
                id="pw_confirm"
                type="password"
                value={pwConfirm}
                onChange={(e) => setPwConfirm(e.target.value)}
                autoComplete="new-password"
                dir="ltr"
                className="text-left"
                required
              />
            </div>

            {pwError && (
              <p role="alert"
                 className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive-text">
                {pwError}
              </p>
            )}

            <div className="flex gap-2">
              <Button type="submit" size="lg" className="flex-1 gap-2" disabled={pwBusy}>
                {pwBusy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                ذخیرهٔ رمز
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setShowPwForm(false)}
              >
                لغو
              </Button>
            </div>
          </form>
        )}
      </section>

      {/* دادهٔ من — جفتِ «حذف حساب» و بالای آن.

          Ordering is deliberate: a person who wants out should see that
          they can take their data BEFORE they see the destructive
          button, not after. Reading top-to-bottom, "export" answers
          "what will I lose?" and only then does "delete" appear.

          It sits next to delete rather than buried in a settings menu
          because it is the same decision from the user's point of view. */}
      <section data-motion-section className="mt-8">
        <div data-motion-item className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-extrabold">
            <Download className="size-5 text-primary" />
            دادهٔ من
          </h2>
        </div>

        <div data-motion-item className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
          <p className="text-sm leading-relaxed text-muted-foreground">
            همهٔ چیزی که از شما داریم — پروفایل، حیوانات، پست‌ها، دیدگاه‌ها،
            سفارش‌ها و پشتیبانی — در یک فایل JSON. رمز عبور در آن نیست.
          </p>
          <div className="mt-4">
            <Button
              variant="outline"
              className="gap-2"
              onClick={downloadMyData}
              disabled={exportBusy}
            >
              {exportBusy
                ? <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                : <Download className="size-4" aria-hidden="true" />}
              دانلود داده‌های من
            </Button>
          </div>
          {exportError && (
            <p role="alert"
               className="mt-3 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive-text">
              {exportError}
            </p>
          )}
        </div>
      </section>

      {/* حذف حساب — آخرین بخش صفحه، و به‌عمد کم‌رنگ.

          Why it exists at all: the checklist item «حذف حساب کاربر» is a
          legal expectation (a person can take their data and leave) and
          a practical one — without it, the only way out of an account is
          to ask an admin, and the account is never really gone.

          Why it looks like this: an accidental tap must not be able to
          end an account, so the destructive button is behind BOTH a
          disclosure and a typed username. `danger` colouring is applied
          only to the final button, not to the section, so the page does
          not read as an error. */}
      <section data-motion-section className="mt-8">
        <div data-motion-item className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-extrabold">
            <Trash2 className="size-5 text-destructive-text" />
            حذف حساب
          </h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowDelete((v) => !v)}
            aria-expanded={showDelete}
          >
            {showDelete ? 'بستن' : 'حذف حساب من'}
          </Button>
        </div>

        {showDelete && (
          <form
            data-motion-item
            onSubmit={submitDelete}
            className="space-y-4 rounded-2xl border border-destructive/40 bg-destructive/5 p-5"
          >
            <p className="text-sm leading-relaxed">
              این کار <strong>برگشت‌پذیر نیست</strong>. پروفایل، حیوانات،
              پست‌ها و دیدگاه‌های شما پاک می‌شوند. سفارش‌ها و نوبت‌های
              گذشته به‌عنوان سابقهٔ مالی و کاری باقی می‌مانند، ولی دیگر به
              نام شما نیستند.
            </p>

            <div className="space-y-2">
              <Label htmlFor="del_pw">رمز عبور</Label>
              <Input
                id="del_pw"
                type="password"
                value={delPassword}
                onChange={(e) => setDelPassword(e.target.value)}
                autoComplete="current-password"
                dir="ltr"
                className="text-left"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="del_confirm">
                برای تأیید، نام کاربری خود را بنویسید
                <span className="ms-1 font-mono text-xs text-muted-foreground" dir="ltr">
                  {user?.username}
                </span>
              </Label>
              <Input
                id="del_confirm"
                value={delConfirm}
                onChange={(e) => setDelConfirm(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                required
              />
            </div>

            {delError && (
              <p role="alert"
                 className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive-text">
                {delError}
              </p>
            )}

            <div className="flex gap-2">
              <Button
                type="submit"
                size="lg"
                variant="destructive"
                className="flex-1 gap-2"
                disabled={
                  delBusy ||
                  !delPassword ||
                  delConfirm.trim().toLowerCase() !== (user?.username ?? '').toLowerCase()
                }
              >
                {delBusy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                حذف همیشگی حساب
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setShowDelete(false)}
              >
                لغو
              </Button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}
