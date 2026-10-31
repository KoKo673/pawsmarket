import { CalendarDays, Check, Clock, Loader2, Phone, ShieldCheck, User, X } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { faDigits } from '@/lib/fa'
import { bookingApi } from '@/lib/booking-api'

/**
 * صفحه‌ی مرکز — از لینکی که در پیام دریافت می‌کند باز می‌شود.
 *
 * This is the whole point of the design: a clinic that has never heard of
 * PawsMarket opens a link on its phone and answers a request. No sign-up, no
 * password, nothing to install. The token in the URL is the credential, and
 * the server only ever stores its hash.
 */
export function BookingManagePage() {
  const { token } = useParams<{ token: string }>()
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['booking-manage', token],
    queryFn: () => bookingApi.viewForBusiness(token!),
    enabled: !!token,
  })

  const booking = query.data ?? null
  const error = actionError ?? (query.isError
    ? (query.error instanceof Error ? query.error.message : 'این لینک باز نشد')
    : null)

  async function decide(action: 'confirm' | 'decline' | 'done' | 'cancel') {
    if (!token) return
    setBusy(true)
    setActionError(null)
    try {
      await bookingApi.decide(token, action, note.trim() || undefined)
      await queryClient.invalidateQueries({ queryKey: ['booking-manage', token] })
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'ثبت پاسخ انجام نشد')
    } finally {
      setBusy(false)
    }
  }

  if (query.isLoading) {
    return (
      <div className="mx-auto max-w-lg space-y-4 px-4 pb-24 pt-28 sm:px-6">
        <Skeleton className="h-8 w-2/3 rounded-xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="mx-auto max-w-lg px-4 pb-24 pt-28 text-center sm:px-6">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-destructive/10 text-destructive">
          <X className="size-8" />
        </span>
        <h1 className="mt-5 text-xl font-extrabold">این لینک باز نشد</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {error || 'ممکن است لینک کامل کپی نشده باشد.'}
        </p>
      </div>
    )
  }

  const when = new Date(booking.preferred_at)
  const dateLabel = new Intl.DateTimeFormat('fa-IR', {
    weekday: 'long', day: 'numeric', month: 'long',
  }).format(when)
  const hourLabel = faDigits(
    String(when.getHours()).padStart(2, '0')) + ':۰۰'

  const answered = booking.status !== 'pending'

  return (
    <div className="mx-auto max-w-lg px-4 pb-24 pt-28 sm:px-6">
      <div className="mb-6 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-glow">
          <CalendarDays className="size-7" />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight">
          درخواست نوبت جدید
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          برای <strong>{booking.store_name}</strong>
        </p>
      </div>

      {/* جزئیات درخواست */}
      <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <Row icon={<CalendarDays className="size-4" />} label="روز درخواستی" value={dateLabel} />
        <Row icon={<Clock className="size-4" />} label="ساعت" value={hourLabel} />
        <Row icon={<ShieldCheck className="size-4" />} label="خدمت" value={booking.service} />
        <Row icon={<User className="size-4" />} label="مشتری" value={booking.contact_name} />
        <Row
          icon={<Phone className="size-4" />}
          label="تماس"
          value={
            <a
              href={`tel:${booking.contact_phone.replace(/[^+\d]/g, '')}`}
              dir="ltr"
              className="font-extrabold text-primary underline"
            >
              {faDigits(booking.contact_phone)}
            </a>
          }
        />
        {booking.note && (
          <div className="rounded-xl bg-muted/50 p-3 text-sm leading-relaxed">
            {booking.note}
          </div>
        )}
      </div>

      {answered ? (
        <div
          className={
            'mt-5 rounded-2xl border p-5 text-center ' +
            (booking.status === 'confirmed'
              ? 'border-accent/40 bg-accent/10'
              : 'border-border bg-muted/40')
          }
        >
          <p className="text-sm font-extrabold">
            {booking.status === 'confirmed'
              ? 'این نوبت را تأیید کرده‌اید'
              : booking.status === 'declined'
                ? 'این درخواست را رد کرده‌اید'
                : 'این درخواست دیگر در انتظار پاسخ نیست'}
          </p>
          {booking.decision_note && (
            <p className="mt-2 text-xs text-muted-foreground">
              یادداشت شما: {booking.decision_note}
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="mt-5 space-y-2">
            <label htmlFor="decide-note" className="text-sm font-bold">
              یادداشت برای مشتری{' '}
              <span className="font-normal text-muted-foreground">(اختیاری)</span>
            </label>
            <textarea
              id="decide-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={300}
              placeholder="مثلاً: ساعت ۱۰ بیایید، یا: آن روز تعطیل هستیم."
              className="w-full resize-none rounded-xl border border-input bg-card px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              className="flex-1 gap-2"
              disabled={busy}
              onClick={() => void decide('confirm')}
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              تأیید نوبت
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="flex-1 gap-2"
              disabled={busy}
              onClick={() => void decide('decline')}
            >
              <X className="size-4" />
              رد درخواست
            </Button>
          </div>
        </>
      )}

      <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
        این صفحه بدون ثبت‌نام کار می‌کند و فقط برای همین درخواست است. اگر
        پازمارکت را نمی‌شناسید، این نوبت را از طرف یکی از مشتریان‌تان گرفته‌اند.
      </p>
    </div>
  )
}

function Row({
  icon, label, value,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="inline-flex shrink-0 items-center gap-1.5 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="min-w-0 text-end font-bold">{value}</span>
    </div>
  )
}