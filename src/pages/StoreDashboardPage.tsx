import {
  AlertCircle, CalendarDays, Check, CheckCheck, ChevronLeft, ChevronRight,
  Clock, Loader2, List, Phone, TrendingUp, User, X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { faDigits } from '@/lib/fa'

/**
 * داشبورد کسب‌وکار — میز کار مرکز، نه یک جدول.
 *
 * The first version was four small counters, three tabs and one large empty
 * box. It answered "how many" and nothing else. A clinic opening this at
 * 9am needs three questions answered in order:
 *
 *   ۱. چه کسی امروز می‌آید؟      → today's schedule, with a time column
 *   ۲. چه چیزی منتظر من است؟     → the pending queue, one tap to decide
 *   ۳. چقدر کار داشته‌ام؟        → counts that mean something
 *
 * So the layout is a work surface: a header that names the clinic, a
 * today strip, the pending queue as the primary object, and the week grid
 * as a secondary view. Counters stay, but they sit where a summary belongs
 * rather than occupying the top third of the screen.
 */

type Status = 'pending' | 'confirmed' | 'declined' | 'cancelled' | 'done'

interface DashboardBooking {
  id: number
  service: string
  preferred_at: string
  window_minutes: number
  status: Status
  contact_name: string
  contact_phone: string
  note: string | null
  created_at: string
  decision_note: string | null
  pet_name: string | null
}

interface Dashboard {
  store: { id: number; name: string; address: string; category: string; phone: string | null }
  counts: {
    pending: number; confirmed: number; done: number
    today: number; total: number; last_request: string | null
  }
  status: Status
  items: DashboardBooking[]
}

const API = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) throw new Error((body as { detail?: string })?.detail || 'درخواست انجام نشد')
  return body as T
}

const TABS: { key: Status; label: string }[] = [
  { key: 'pending', label: 'در انتظار' },
  { key: 'confirmed', label: 'تأییدشده' },
  { key: 'done', label: 'انجام‌شده' },
]

const FA_MONTH = new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'long' })
const FA_WEEKDAY = new Intl.DateTimeFormat('fa-IR', { weekday: 'long' })
const FA_TIME = (d: Date) =>
  `${faDigits(d.getHours())}:${faDigits(String(d.getMinutes()).padStart(2, '0'))}`

export function StoreDashboardPage() {
  const { token } = useParams<{ token: string }>()
  const [tab, setTab] = useState<Status>('pending')
  const [view, setView] = useState<'queue' | 'week'>('queue')
  const qc = useQueryClient()

  const q = useQuery({
    queryKey: ['store-dashboard', token, tab],
    queryFn: () => getJson<Dashboard>(`/api/store/dashboard/${token}?status=${tab}`),
    enabled: !!token,
    retry: false,
  })

  async function decide(id: number, action: 'confirm' | 'decline') {
    await getJson(`/api/store/dashboard/${token}/booking/${id}/decision`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    })
    await qc.invalidateQueries({ queryKey: ['store-dashboard', token] })
    await qc.invalidateQueries({ queryKey: ['store-week', token] })
  }

  if (q.isPending) {
    return (
      <Shell>
        <div className="grid place-items-center py-24">
          <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
          <span className="sr-only">در حال بارگذاری</span>
        </div>
      </Shell>
    )
  }

  if (q.isError || !q.data) {
    return (
      <Shell>
        <div className="rounded-3xl border border-border bg-muted/30 px-6 py-20 text-center">
          <AlertCircle className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
          <h1 className="mt-3 text-lg font-extrabold">این داشبورد پیدا نشد</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            ممکن است نشانی اشتباه باشد یا دسترسی این مرکز لغو شده باشد.
          </p>
        </div>
      </Shell>
    )
  }

  const d = q.data
  const needsAttention = d.counts.pending > 0

  return (
    <Shell>
      {/* ── سربرگ ── */}
      <header className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
              {d.store.name}
            </h1>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {d.store.address}
            </p>
          </div>
          {d.store.phone && (
            <a
              href={`tel:${d.store.phone.replace(/[^+\d]/g, '')}`}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border
                border-border bg-card px-3 py-2 text-sm font-bold text-primary"
            >
              <Phone className="size-4" aria-hidden="true" />
              {faDigits(d.store.phone)}
            </a>
          )}
        </div>
      </header>

      {/* ── نوار امروز — اولین چیزی که صبح لازم است ── */}
      <section aria-labelledby="today-h" className="mb-6">
        <h2 id="today-h" className="mb-2 flex items-center gap-1.5 text-xs font-bold
          text-muted-foreground">
          <CalendarDays className="size-3.5" aria-hidden="true" />
          امروز
        </h2>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Tile
            label="منتظر تأیید"
            value={d.counts.pending}
            tone={needsAttention ? 'warn' : 'plain'}
            hint={needsAttention ? 'نیاز به اقدام' : 'چیزی نیست'}
          />
          <Tile label="نوبت امروز" value={d.counts.today} tone="primary" />
          <Tile label="تأییدشده" value={d.counts.confirmed} />
          <Tile label="کل" value={d.counts.total} hint={
            d.counts.last_request
              ? `آخرین: ${new Intl.RelativeTimeFormat('fa', { numeric: 'auto' })
                  .format(-Math.max(1, Math.round(
                    (Date.now() - new Date(d.counts.last_request).getTime()) / 60000)), 'minute')}`
              : undefined
          } />
        </div>
      </section>

      {/* ── صف کار ── */}
      <section aria-labelledby="queue-h">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 id="queue-h" className="flex items-center gap-1.5 text-xs font-bold
            text-muted-foreground">
            <List className="size-3.5" aria-hidden="true" />
            نوبت‌ها
          </h2>

          <button
            type="button"
            onClick={() => setView(view === 'queue' ? 'week' : 'queue')}
            aria-pressed={view === 'week'}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border
              bg-card px-2.5 py-1.5 text-xs font-bold text-muted-foreground
              hover:text-foreground"
          >
            {view === 'queue'
              ? <><CalendarDays className="size-3.5" aria-hidden="true" /> نمای هفته</>
              : <><List className="size-3.5" aria-hidden="true" /> فهرست</>}
          </button>
        </div>

        {view === 'queue' ? (
          <>
            <div role="tablist" aria-label="وضعیت نوبت"
                 className="mb-3 flex gap-1 rounded-xl border border-border p-1">
              {TABS.map(t => (
                <button
                  key={t.key}
                  role="tab"
                  type="button"
                  aria-selected={tab === t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold
                    transition-colors ${tab === t.key
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {t.label}
                  {t.key === 'pending' && d.counts.pending > 0 && (
                    <span className={`ms-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${
                      tab === t.key ? 'bg-primary-foreground/20' : 'bg-primary/15 text-primary'}`}>
                      {faDigits(d.counts.pending)}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {d.items.length === 0 ? (
              <EmptyState tab={tab} />
            ) : (
              <ul className="space-y-2.5">
                {d.items.map(b => (
                  <BookingRow key={b.id} b={b} onDecide={decide} />
                ))}
              </ul>
            )}
          </>
        ) : (
          <WeekCalendar token={token!} onDecide={decide} />
        )}
      </section>
    </Shell>
  )
}

/* ── یک نوبت ───────────────────────────────────────────────── */

function BookingRow({ b, onDecide }: {
  b: DashboardBooking
  onDecide: (id: number, action: 'confirm' | 'decline') => Promise<void>
}) {
  const [busy, setBusy] = useState<'confirm' | 'decline' | null>(null)
  const at = new Date(b.preferred_at)
  const today = new Date().toDateString() === at.toDateString()

  async function run(action: 'confirm' | 'decline') {
    setBusy(action)
    try { await onDecide(b.id, action) } finally { setBusy(null) }
  }

  return (
    <li className={`rounded-2xl border bg-card p-4 transition-colors ${
      b.status === 'pending' ? 'border-primary/30' : 'border-border'}`}>
      <div className="flex items-start gap-3">
        {/* ستون زمان — چشم اول روی ساعت می‌افتد، نه روی نام */}
        <div className={`shrink-0 rounded-xl px-2.5 py-2 text-center ${
          today ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
          <p className="text-sm font-extrabold tabular-nums leading-none">
            {FA_TIME(at)}
          </p>
          <p className={`mt-1 text-[10px] leading-none ${
            today ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
            {today ? 'امروز' : FA_WEEKDAY.format(at)}
          </p>
        </div>

        <div className="min-w-0 flex-1 basis-0">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-extrabold">{b.service}</span>
            <span className="whitespace-nowrap text-xs text-muted-foreground">
              {FA_MONTH.format(at)} · {faDigits(b.window_minutes)} دقیقه
            </span>
          </div>

          {/*
            Two rows, not one wrapping row.

            Measured: with name + phone + pet in a single `flex-wrap` row,
            the phone's LTR digit run laid itself over the Persian name at
            this width. The number is the one thing a clinic taps first, so
            it gets its own line rather than competing for space.
          */}
          <div className="mt-1.5 flex items-center gap-1 text-sm text-muted-foreground">
            <User className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="min-w-0 truncate">{b.contact_name}</span>
            {b.pet_name && (
              <span className="shrink-0 text-xs">· برای {b.pet_name}</span>
            )}
          </div>
          <a href={`tel:${b.contact_phone.replace(/[^+\d]/g, '')}`}
             className="mt-1 inline-flex items-center gap-1 text-sm font-semibold
               text-primary">
            <Phone className="size-3.5" aria-hidden="true" />
            <span dir="ltr" className="whitespace-nowrap">{faDigits(b.contact_phone)}</span>
          </a>

          {b.note && (
            <p className="mt-2 rounded-lg bg-muted/50 px-2.5 py-1.5 text-xs leading-relaxed">
              {b.note}
            </p>
          )}

          {b.status === 'pending' && (
            <div className="mt-3 flex gap-2">
              <Button size="sm" className="flex-1 gap-1.5 sm:flex-none"
                      disabled={busy !== null}
                      onClick={() => void run('confirm')}>
                {busy === 'confirm'
                  ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  : <Check className="size-3.5" aria-hidden="true" />}
                تأیید
              </Button>
              <Button size="sm" variant="outline" className="flex-1 gap-1.5 sm:flex-none"
                      disabled={busy !== null}
                      onClick={() => void run('decline')}>
                {busy === 'decline'
                  ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  : <X className="size-3.5" aria-hidden="true" />}
                رد
              </Button>
            </div>
          )}

          {b.decision_note && (
            <p className="mt-2 text-xs text-muted-foreground">
              یادداشت شما: {b.decision_note}
            </p>
          )}
        </div>

        <StatusDot status={b.status} />
      </div>
    </li>
  )
}

function StatusDot({ status }: { status: Status }) {
  const map: Record<Status, { cls: string; label: string }> = {
    pending: { cls: 'bg-amber-500', label: 'در انتظار' },
    confirmed: { cls: 'bg-emerald-500', label: 'تأییدشده' },
    done: { cls: 'bg-primary', label: 'انجام‌شده' },
    declined: { cls: 'bg-muted-foreground/40', label: 'رد‌شده' },
    cancelled: { cls: 'bg-muted-foreground/40', label: 'لغو‌شده' },
  }
  const m = map[status]
  return (
    <span className="mt-1 shrink-0" title={m.label}>
      <span className={`block size-2 rounded-full ${m.cls}`} aria-hidden="true" />
      <span className="sr-only">{m.label}</span>
    </span>
  )
}

function Tile({ label, value, tone, hint }: {
  label: string
  value: number
  tone?: 'primary' | 'warn'
  hint?: string
}) {
  const cls = tone === 'primary' ? 'border-primary/30 bg-primary/5'
    : tone === 'warn' ? 'border-amber-500/40 bg-amber-500/5'
    : 'border-border bg-card'
  const num = tone === 'primary' ? 'text-primary'
    : tone === 'warn' ? 'text-amber-600'
    : ''
  return (
    <div className={`rounded-2xl border px-3 py-2.5 ${cls}`}>
      <p className={`text-2xl font-extrabold tabular-nums leading-none ${num}`}>
        {faDigits(value)}
      </p>
      <p className="mt-1 text-[11px] font-medium text-muted-foreground">{label}</p>
      {hint && (
        <p className={`mt-0.5 truncate text-[10px] ${tone === 'warn' ? 'text-amber-600' : 'text-muted-foreground/70'}`}>
          {hint}
        </p>
      )}
    </div>
  )
}

function EmptyState({ tab }: { tab: Status }) {
  const copy = {
    pending: { icon: CheckCheck, title: 'صف خالی است', body: 'هیچ درخواستی منتظر تأیید شما نیست.' },
    confirmed: { icon: Clock, title: 'نوبت تأییدشده‌ای نیست', body: 'وقتی درخواستی را تأیید کنید، اینجا می‌آید.' },
    done: { icon: TrendingUp, title: 'هنوز کاری ثبت نشده', body: 'نوبت‌های انجام‌شده اینجا جمع می‌شوند.' },
  }[tab as 'pending' | 'confirmed' | 'done'] ?? {
    icon: Clock, title: 'چیزی نیست', body: '',
  }
  const Icon = copy.icon
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-14 text-center">
      <Icon className="mx-auto size-7 text-muted-foreground/60" aria-hidden="true" />
      <p className="mt-3 text-sm font-bold">{copy.title}</p>
      {copy.body && (
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{copy.body}</p>
      )}
    </div>
  )
}

/* ── نمای هفته ──────────────────────────────────────────── */

interface WeekBooking {
  id: number
  service: string
  preferred_at: string
  status: Status
  contact_name: string
  contact_phone: string
  note: string | null
  pet_name: string | null
}

interface Week {
  week_start: string
  week_end: string
  items: WeekBooking[]
}

const DAY_FA = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه']

const STATUS_TONE: Record<string, string> = {
  pending: 'border-amber-500/50 bg-amber-500/10',
  confirmed: 'border-primary/40 bg-primary/10',
  done: 'border-emerald-500/40 bg-emerald-500/10',
  declined: 'border-border bg-muted/50 opacity-60',
  cancelled: 'border-border bg-muted/50 opacity-60 line-through',
}

function WeekCalendar({ token, onDecide }: {
  token: string
  onDecide: (id: number, action: 'confirm' | 'decline') => Promise<void>
}) {
  const [offsetWeeks, setOffsetWeeks] = useState(0)

  const q = useQuery({
    queryKey: ['store-week', token, offsetWeeks],
    queryFn: async () => {
      const base = new Date()
      base.setDate(base.getDate() + offsetWeeks * 7)
      const res = await fetch(
        `${API}/api/store/dashboard/${token}/week?start=${base.toISOString().slice(0, 10)}`)
      if (!res.ok) throw new Error('هفته بارگذاری نشد')
      return await res.json() as Week
    },
    enabled: !!token,
    retry: false,
  })

  const days = useMemo(() => {
    if (!q.data) return []
    const start = new Date(q.data.week_start + 'T00:00:00')
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      return d
    })
  }, [q.data])

  if (q.isPending) {
    return (
      <div className="grid place-items-center py-16">
        <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
    )
  }
  if (q.isError || !q.data || days.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-muted/30 px-4 py-10 text-center
        text-sm text-muted-foreground">
        تقویم بارگذاری نشد
      </p>
    )
  }

  // Group by local calendar date. `toLocaleDateString('en-CA')` yields
  // YYYY-MM-DD, which compares cleanly — hand-built month/day keys get the
  // zero-pad wrong exactly once and then silently drop a day.
  const byDay = new Map<string, WeekBooking[]>()
  for (const b of q.data.items) {
    const key = new Date(b.preferred_at).toLocaleDateString('en-CA')
    const list = byDay.get(key) ?? []
    list.push(b)
    byDay.set(key, list)
  }
  const todayKey = new Date().toLocaleDateString('en-CA')

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={() => setOffsetWeeks(w => w - 1)}
                aria-label="هفتهٔ قبل"
                className="rounded-lg border border-border bg-card p-2
                  text-muted-foreground hover:text-foreground">
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
        <p className="text-sm font-bold">
          {FA_MONTH.format(days[0])} تا {FA_MONTH.format(days[6])}
          {offsetWeeks === 0 && (
            <span className="ms-2 rounded-full bg-primary/10 px-2 py-0.5
              text-[10px] font-bold text-primary">این هفته</span>
          )}
        </p>
        <button type="button" onClick={() => setOffsetWeeks(w => w + 1)}
                aria-label="هفتهٔ بعد"
                className="rounded-lg border border-border bg-card p-2
                  text-muted-foreground hover:text-foreground">
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="grid min-w-[42rem] grid-cols-7 gap-2">
          {days.map((day, i) => {
            const key = day.toLocaleDateString('en-CA')
            const list = byDay.get(key) ?? []
            const isToday = key === todayKey
            const isFriday = i === 6
            return (
              <div key={key} className="min-w-0">
                <div className={`mb-1.5 rounded-lg px-1.5 py-1 text-center ${
                  isToday ? 'bg-primary text-primary-foreground'
                  : isFriday ? 'bg-muted/60 text-muted-foreground'
                  : 'text-muted-foreground'}`}>
                  <p className="text-[11px] font-bold">{DAY_FA[i]}</p>
                  <p className="text-[10px] tabular-nums">{faDigits(day.getDate())}</p>
                </div>
                <ul className="space-y-1.5">
                  {list.length === 0 && (
                    <li className="rounded-lg border border-dashed border-border/60
                      px-1.5 py-4 text-center text-[10px] text-muted-foreground/50">
                      —
                    </li>
                  )}
                  {list.map(b => (
                    <li key={b.id}>
                      <WeekCard b={b} onDecide={onDecide} />
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        همهٔ وضعیت‌ها نمایش داده می‌شوند؛ یک نوبت لغوشده هم جای خودش را
        نشان می‌دهد تا آن ساعت واقعاً خالی به نظر برسد.
      </p>
    </div>
  )
}

function WeekCard({ b, onDecide }: {
  b: WeekBooking
  onDecide: (id: number, action: 'confirm' | 'decline') => Promise<void>
}) {
  const at = new Date(b.preferred_at)
  return (
    <div className={`rounded-lg border px-1.5 py-1.5 text-[11px]
      ${STATUS_TONE[b.status] ?? 'border-border bg-card'}`}>
      <p className="font-bold tabular-nums">{FA_TIME(at)}</p>
      <p className="mt-0.5 truncate" title={b.service}>{b.service}</p>
      <p className="truncate text-[10px] text-muted-foreground">{b.contact_name}</p>
      {b.status === 'pending' && (
        <div className="mt-1 flex gap-1">
          <button type="button" onClick={() => void onDecide(b.id, 'confirm')}
                  aria-label={`تأیید ${b.service} برای ${b.contact_name}`}
                  className="flex-1 rounded bg-primary py-0.5 text-[10px]
                    font-bold text-primary-foreground">
            ✓
          </button>
          <button type="button" onClick={() => void onDecide(b.id, 'decline')}
                  aria-label={`رد ${b.service} برای ${b.contact_name}`}
                  className="flex-1 rounded border border-border py-0.5 text-[10px]
                    font-bold text-muted-foreground">
            ✕
          </button>
        </div>
      )}
    </div>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-3xl px-4 pb-24 pt-28 sm:px-6">{children}</div>
}
