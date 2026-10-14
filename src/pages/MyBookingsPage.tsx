import { CalendarDays, Clock, Loader2, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { faDigits } from '@/lib/fa'
import { bookingApi, type Booking } from '@/lib/booking-api'

/**
 * «نوبت‌های من» — وضعیت هر درخواست.
 *
 * The point of this screen is honesty about state: «در انتظار پاسخ» until the
 * business answers, then what they said. It never shows a request as a
 * confirmed appointment on its own, because the customer would otherwise
 * arrive to a closed door.
 */
const STATUS_META: Record<Booking['status'], { label: string; tone: string }> = {
  pending: { label: 'در انتظار پاسخ مرکز', tone: 'bg-amber-500/15 text-amber-600' },
  confirmed: { label: 'تأییدشده', tone: 'bg-accent/15 text-accent' },
  declined: { label: 'رد شده', tone: 'bg-destructive/10 text-destructive' },
  cancelled: { label: 'لغو شده', tone: 'bg-muted text-muted-foreground' },
  done: { label: 'انجام شده', tone: 'bg-tide-500/15 text-tide-700 dark:text-tide-300' },
}

export function MyBookingsPage() {
  const [items, setItems] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await bookingApi.mine()
      setItems(r.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'بارگذاری انجام نشد')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function cancel(id: number) {
    setBusyId(id)
    try {
      await bookingApi.cancel(id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'لغو انجام نشد')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-28 sm:px-6">
      <div className="mb-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          <CalendarDays className="size-3.5" />
          نوبت‌ها
        </span>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight">نوبت‌های من</h1>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-destructive/25 bg-destructive/5 p-6 text-center">
          <p className="text-sm font-bold">{error}</p>
          <Button className="mt-4" variant="outline" onClick={() => void load()}>
            تلاش دوباره
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-muted">
            <CalendarDays className="size-6 text-muted-foreground/60" />
          </span>
          <h2 className="mt-4 text-lg font-extrabold">هنوز نوبتی نگرفته‌اید</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            از صفحه‌ی هر کلینیک یا آرایشگاه می‌توانید درخواست نوبت بدهید.
          </p>
          <Button asChild className="mt-5">
            <Link to="/explore">جستجوی مراکز</Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-4">
          {items.map((b) => {
            const when = new Date(b.preferred_at)
            const meta = STATUS_META[b.status] ?? STATUS_META.pending
            return (
              <li
                key={b.id}
                className="rounded-2xl border border-border bg-card p-5 shadow-soft"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-extrabold">{b.store_name}</h3>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="size-3.5" />
                        {new Intl.DateTimeFormat('fa-IR', {
                          weekday: 'long', day: 'numeric', month: 'long',
                        }).format(when)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3.5" />
                        {faDigits(String(when.getHours()).padStart(2, '0'))}:۰۰
                      </span>
                    </p>
                    <p className="mt-1.5 text-sm">{b.service}</p>
                  </div>
                  <Badge className={meta.tone}>{meta.label}</Badge>
                </div>

                {b.decision_note && (
                  <p className="mt-3 rounded-xl bg-muted/50 p-3 text-xs leading-relaxed">
                    پاسخ مرکز: {b.decision_note}
                  </p>
                )}

                {b.status === 'pending' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 gap-1.5"
                    disabled={busyId === b.id}
                    onClick={() => void cancel(b.id)}
                  >
                    {busyId === b.id
                      ? <Loader2 className="size-3.5 animate-spin" />
                      : <X className="size-3.5" />}
                    لغو درخواست
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}