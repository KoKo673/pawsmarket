import { CalendarDays, Check, Clock, Loader2, PawPrint, Phone, User } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useNearbyListings } from '@/hooks/use-listings'
import { faDigits } from '@/lib/fa'
import { bookingApi } from '@/lib/booking-api'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'

/**
 * درخواست نوبت برای یک مرکز خدماتی.
 *
 * The customer picks a day and an hour, says what the visit is for, and
 * leaves a phone number — no account required, because requiring one loses
 * most people at exactly the moment they have decided to book. The request
 * is delivered to the business, which answers through its own link; nothing
 * here claims a slot is held until they do.
 */

/** Services differ by what the business actually does. */
const SERVICES: Record<string, string[]> = {
  vet: ['معاینه و ویزیت', 'واکسیناسیون', 'درمان و پیگیری', 'جراحی', 'آزمایش و تصویربرداری', 'دندان‌پزشکی'],
  groomer: ['حمام و خشک‌کردن', 'اصلاح و کوتاهی مو', 'کوتاه‌کردن ناخن', 'شست‌وشوی گوش', 'آرایش کامل'],
  boarding: ['اقامت کوتاه‌مدت', 'اقامت بلندمدت', 'اقامت روزانه', 'بازدید و آشنایی'],
  shelter: ['بازدید از پناهگاه', 'مشاوره‌ی سرپرستی', 'اکراه و تحویل'],
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7) // 07:00 … 21:00

/** Next 21 days, as {value, label} in the visitor's own locale. */
function upcomingDays(): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = []
  const now = new Date()
  for (let i = 0; i < 21; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const label = i === 0 ? 'امروز' : i === 1 ? 'فردا'
      : new Intl.DateTimeFormat('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' }).format(d)
    out.push({ value, label })
  }
  return out
}

export function BookingPage() {
  const { storeId } = useParams<{ storeId: string }>()
  const [params] = useSearchParams()
  const { data } = useNearbyListings()
  const user = useAuthStore((s) => s.user)
  const myPets = useAuthStore((s) => s.myPets)

  const store = useMemo(
    () => (data ?? []).find((l) => l.id === `store:${storeId}`),
    [data, storeId],
  )

  const days = useMemo(upcomingDays, [])
  const [day, setDay] = useState(days[0]?.value ?? '')
  const [hour, setHour] = useState<number | null>(null)
  const [service, setService] = useState(params.get('service') ?? '')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [note, setNote] = useState('')
  const [petId, setPetId] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<{ id: number; token?: string } | null>(null)

  // Prefill from the signed-in account — nobody wants to retype their own
  // name on a phone.
  useEffect(() => {
    if (user) {
      setName((v) => v || user.display_name || user.username)
    }
  }, [user])

  const services = store && store.kind === 'store'
    ? SERVICES[store.category] ?? SERVICES.vet
    : SERVICES.vet

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!store) return
    if (!service) return setError('نوع خدمت را انتخاب کنید')
    if (hour === null) return setError('ساعت مراجعه را انتخاب کنید')
    if (name.trim().length < 2) return setError('نام را بنویسید')
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 8) return setError('شماره تماس درست نیست')

    setBusy(true)
    try {
      const res = await bookingApi.create({
        store_id: Number(storeId),
        service,
        preferred_at: `${day}T${String(hour).padStart(2, '0')}:00:00`,
        window_minutes: 60,
        note: note.trim() || undefined,
        contact_name: name.trim(),
        contact_phone: phone.trim(),
        ...(petId ? { pet_id: petId } : {}),
      })
      setDone({ id: res.id, token: res.manage_token })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ثبت درخواست انجام نشد')
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    const link = done.token
      ? `${window.location.origin}${import.meta.env.BASE_URL}#/booking/manage/${done.token}`
      : null
    return (
      <div className="mx-auto max-w-lg px-4 pb-24 pt-28 sm:px-6">
        <div className="glass rounded-3xl p-8 text-center shadow-lifted">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent text-accent-foreground">
            <Check className="size-7" />
          </span>
          <h1 className="mt-4 text-2xl font-extrabold">درخواست ثبت شد</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            درخواست شما برای <strong>{store?.name}</strong> ثبت شد. این مرکز
            هنوز آن را ندیده؛ به‌محض پاسخ، وضعیت در «نوبت‌های من» به‌روز می‌شود.
          </p>

          <div className="mt-5 rounded-2xl border border-border bg-muted/40 p-4 text-start text-sm">
            <p><strong>وضعیت:</strong> در انتظار پاسخ مرکز</p>
            <p className="mt-1">
              <strong>زمان درخواستی:</strong>{' '}
              {new Intl.DateTimeFormat('fa-IR', {
                weekday: 'long', day: 'numeric', month: 'long',
              }).format(new Date(`${day}T12:00:00`))}{' '}
              ساعت {faDigits(hour!)}:۰۰
            </p>
          </div>

          {link && (
            <div className="mt-4 rounded-2xl border border-dashed border-border p-4 text-start">
              <p className="text-xs font-bold text-muted-foreground">
                لینک پاسخ برای خودِ مرکز
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                اگر با این مرکز تماس گرفتید و خواستید خودتان هم تأییدشان کنید،
                این لینک را برایشان بفرستید — بدون ثبت‌نام باز می‌شود.
              </p>
              <div className="mt-2 flex gap-2">
                <Input readOnly value={link} dir="ltr" className="text-xs" />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void navigator.clipboard.writeText(link)}
                >
                  کپی
                </Button>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button asChild className="flex-1">
              <Link to="/bookings">نوبت‌های من</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link to="/explore">بازگشت به جستجو</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-24 pt-28 sm:px-6">
      <div className="mb-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          <CalendarDays className="size-3.5" />
          درخواست نوبت
        </span>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight">
          {store ? store.name : 'مرکز مورد نظر'}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          زمان دلخواه را انتخاب کنید؛ خودِ مرکز درخواست را تأیید می‌کند.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        {/* خدمت */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <Label className="mb-3 block text-sm font-bold">نوع خدمت</Label>
          <div className="flex flex-wrap gap-2">
            {services.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setService(s)}
                className={cn(
                  'rounded-full border px-3.5 py-2 text-xs font-semibold transition-all active:scale-95',
                  service === s
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground',
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        {/* روز */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <Label className="mb-3 flex items-center gap-1.5 text-sm font-bold">
            <CalendarDays className="size-4 text-primary" />
            روز مراجعه
          </Label>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {days.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => setDay(d.value)}
                className={cn(
                  'shrink-0 rounded-xl border px-3 py-2 text-xs font-semibold transition-all',
                  day === d.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground',
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        </section>

        {/* ساعت */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <Label className="mb-3 flex items-center gap-1.5 text-sm font-bold">
            <Clock className="size-4 text-primary" />
            ساعت مراجعه
          </Label>
          <div className="grid grid-cols-4 gap-2">
            {HOURS.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setHour(h)}
                className={cn(
                  'rounded-xl border py-2 text-sm font-bold transition-all',
                  hour === h
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground',
                )}
              >
                {faDigits(String(h).padStart(2, '0'))}:۰۰
              </button>
            ))}
          </div>
        </section>

        {/* مشخصات */}
        <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
          {myPets.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm font-bold">
                <PawPrint className="size-4 text-primary" />
                برای کدام حیوان؟ <span className="font-normal text-muted-foreground">(اختیاری)</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {myPets.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPetId(petId === p.id ? null : p.id)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs font-semibold',
                      petId === p.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground',
                    )}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="bk-name" className="flex items-center gap-1.5 text-sm font-bold">
              <User className="size-4 text-primary" />
              نام شما
            </Label>
            <Input
              id="bk-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="نام و نام خانوادگی"
              maxLength={60}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bk-phone" className="flex items-center gap-1.5 text-sm font-bold">
              <Phone className="size-4 text-primary" />
              شماره تماس
            </Label>
            <Input
              id="bk-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="۰۹۱۲…"
              dir="ltr"
              inputMode="tel"
              required
            />
            <p className="text-[11px] text-muted-foreground">
              مرکز برای تأیید یا هماهنگی با این شماره تماس می‌گیرد.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bk-note" className="text-sm font-bold">
              توضیح <span className="font-normal text-muted-foreground">(اختیاری)</span>
            </Label>
            <textarea
              id="bk-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="مثلاً: توله‌ی ۳ ماهه است و واکسن اول را زده."
              className="w-full resize-none rounded-xl border border-input bg-card px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </section>

        {error && (
          <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full gap-2" disabled={busy}>
          {busy && <Loader2 className="size-4 animate-spin" />}
          ارسال درخواست نوبت
        </Button>
        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          این درخواست هنوز قطعی نیست؛ بعد از تأیید مرکز، نوبت شما ثبت می‌شود.
        </p>
      </form>
    </div>
  )
}