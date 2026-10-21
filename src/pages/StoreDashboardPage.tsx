import {
  CalendarDays, Check, ChevronLeft, ChevronRight, Clock, List,
  Loader2, Phone, X,
} from 'lucide-react'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { faDigits } from '@/lib/fa'

/**
 * داشبورد کسب‌وکار — همهٔ نوبت‌های یک مرکز در یک صفحه.
 *
 * Voice notes 07/08: the per-booking link answers one request; a clinic
 * needs to see the queue. This opens with one token per store — no
 * account, for the same reason the booking link has none: these
 * businesses were harvested from maps, not signed up, and a dashboard
 * behind a login would have nobody to log in.
 *
 * Opens on `pending` because that is the only list that needs a human.
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
  counts: { pending: number; confirmed: number; done: number; today: number; total: number; last_request: string | null }
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

export function StoreDashboardPage() {
  const { token } = useParams<{ token: string }>()
  const [tab, setTab] = useState<Status>('pending')
  const [view, setView] = useState<'list' | 'week'>('list')
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
  }

  if (q.isPending) {
    return <Shell><div className="grid place-items-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div></Shell>
  }

  if (q.isError || !q.data) {
    return (
      <Shell>
        <div className="rounded-3xl border border-border bg-muted/30 px-6 py-16 text-center">
          <CalendarDays className="mx-auto size-8 text-muted-foreground" />
          <h1 className="mt-3 text-lg font-extrabold">این داشبورد پیدا نشد</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            ممکن است نشانی اشتباه باشد یا دسترسی این مرکز لغو شده باشد.
          </p>
        </div>
      </Shell>
    )
  }

  const d = q.data

  return (
    <Shell>
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight">{d.store.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{d.store.address}</p>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="در انتظار" value={d.counts.pending} tone="primary" />
        <Stat label="امروز" value={d.counts.today} />
        <Stat label="تأییدشده" value={d.counts.confirmed} />
        <Stat label="کل" value={d.counts.total} />
      </div>

      <div className="mb-4 flex items-center gap-2">
        <div role="tablist" aria-label="نمای نوبت‌ها"
             className="flex flex-1 gap-1 rounded-xl border border-border p-1">
          {TABS.map(t => (
            <button
              key={t.key}
              role="tab"
              type="button"
              aria-selected={view === 'list' && tab === t.key}
              disabled={view === 'week'}
              onClick={() => setTab(t.key)}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold transition-colors disabled:opacity-40 ${
                view === 'list' && tab === t.key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/*
          The week grid and the status tabs answer different questions —
          "when is Thursday full?" versus "who is waiting on me?" — so they
          are two views of the same data rather than another tab. The tabs
          are disabled in week view because the grid shows every status at
          once, and leaving them enabled would suggest they filter it.
        */}
        <button
          type="button"
          onClick={() => setView(view === 'list' ? 'week' : 'list')}
          aria-pressed={view === 'week'}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border
            border-border bg-card px-3 py-2 text-sm font-bold
            text-muted-foreground hover:text-foreground"
        >
          {view === 'list'
            ? <><CalendarDays className="size-4" aria-hidden="true" /> تقویم</>
            : <><List className="size-4" aria-hidden="true" /> فهرست</>}
        </button>
      </div>

      {view === 'week' ? (
        <WeekCalendar token={token!} onDecide={decide} />
      ) : d.items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-muted/30 px-6 py-14 text-center">
          <Clock className="mx-auto size-7 text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold">در این بخش چیزی نیست</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {d.items.map(b => (
            <li key={b.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-extrabold">{b.service}</span>
                <span className="text-xs text-muted-foreground">
                  {new Intl.DateTimeFormat('fa-IR', {
                    weekday: 'long', day: 'numeric', month: 'long',
                  }).format(new Date(b.preferred_at))}
                  {' · '}
                  ساعت {faDigits(new Date(b.preferred_at).getHours())}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span>{b.contact_name}</span>
                <a href={`tel:${b.contact_phone.replace(/[^+\d]/g, '')}`}
                   className="inline-flex items-center gap-1 font-semibold text-primary">
                  <Phone className="size-3.5" />
                  {faDigits(b.contact_phone)}
                </a>
                {b.pet_name && <span>برای {b.pet_name}</span>}
              </div>

              {b.note && (
                <p className="mt-2 rounded-xl bg-muted/40 px-3 py-2 text-xs">{b.note}</p>
              )}

              {b.status === 'pending' && (
                <div className="mt-3 flex gap-2">
                  <Button size="sm" className="gap-1.5" onClick={() => void decide(b.id, 'confirm')}>
                    <Check className="size-3.5" /> تأیید
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5"
                          onClick={() => void decide(b.id, 'decline')}>
                    <X className="size-3.5" /> رد
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Shell>
  )
}

/* ── نمای تقویم هفتگی ──────────────────────────────────────── */

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

/**
 * یک هفته، ستون به ستون از شنبه.
 *
 * Days are derived from the returned `week_start` rather than from the
 * browser's clock: the server snapped the date to a Saturday in Tehran, and
 * a client that recomputed the grid locally could disagree with it by a day
 * for anyone whose device timezone is not Tehran.
 */
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
      const iso = base.toISOString().slice(0, 10)
      const res = await fetch(
        `${API}/api/store/dashboard/${token}/week?start=${iso}`)
      if (!res.ok) throw new Error('هفته بارگذاری نشد')
      return await res.json() as Week
    },
    enabled: !!token,
    retry: false,
  })

  if (q.isPending) {
    return <div className="grid place-items-center py-16">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  }
  if (q.isError || !q.data) {
    return <p className="rounded-xl border border-border bg-muted/30 px-4 py-8
      text-center text-sm text-muted-foreground">تقویم بارگذاری نشد</p>
  }

  const start = new Date(q.data.week_start + 'T00:00:00')
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    return d
  })

  // Group by local calendar date. `toLocaleDateString('en-CA')` yields
  // YYYY-MM-DD, which is unambiguous to compare against the group key —
  // building the key from getMonth()/getDate() by hand gets the zero-pad
  // wrong exactly once and then silently drops a day.
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
        <button
          type="button"
          onClick={() => setOffsetWeeks(offsetWeeks - 1)}
          className="rounded-lg border border-border bg-card p-2
            text-muted-foreground hover:text-foreground"
          aria-label="هفتهٔ قبل"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>

        <p className="text-sm font-bold">
          {new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'long' })
            .format(days[0])}
          {' تا '}
          {new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'long' })
            .format(days[6])}
          {offsetWeeks === 0 && (
            <span className="ms-2 rounded-full bg-primary/10 px-2 py-0.5
              text-[10px] font-bold text-primary">این هفته</span>
          )}
        </p>

        <button
          type="button"
          onClick={() => setOffsetWeeks(offsetWeeks + 1)}
          className="rounded-lg border border-border bg-card p-2
            text-muted-foreground hover:text-foreground"
          aria-label="هفتهٔ بعد"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
      </div>

      {/*
        Horizontally scrollable rather than squeezed. Seven columns in a
        360px phone would give each day ~48px, which cannot hold a service
        name; a scroll keeps every card readable at its natural width.
      */}
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="grid min-w-[42rem] grid-cols-7 gap-2">
          {days.map((d, i) => {
            const key = d.toLocaleDateString('en-CA')
            const list = byDay.get(key) ?? []
            const isToday = key === todayKey
            // Friday is the weekend in Iran; the column is tinted so a
            // booking there is visibly unusual rather than merely present.
            const isFriday = i === 6
            return (
              <div key={key} className="min-w-0">
                <div className={`mb-1.5 rounded-lg px-1.5 py-1 text-center ${
                  isToday ? 'bg-primary text-primary-foreground'
                  : isFriday ? 'bg-muted/60 text-muted-foreground'
                  : 'text-muted-foreground'}`}>
                  <p className="text-[11px] font-bold">{DAY_FA[i]}</p>
                  <p className="text-[10px] tabular-nums">{faDigits(d.getDate())}</p>
                </div>

                <ul className="space-y-1.5">
                  {list.length === 0 && (
                    <li className="rounded-lg border border-dashed border-border/60
                      px-1.5 py-4 text-center text-[10px] text-muted-foreground/60">
                      —
                    </li>
                  )}
                  {list.map(b => {
                    const at = new Date(b.preferred_at)
                    return (
                      <li key={b.id}>
                        <div className={`rounded-lg border px-1.5 py-1.5 text-[11px]
                          ${STATUS_TONE[b.status] ?? 'border-border bg-card'}`}>
                          <p className="font-bold tabular-nums">
                            {faDigits(at.getHours())}:
                            {faDigits(String(at.getMinutes()).padStart(2, '0'))}
                          </p>
                          <p className="mt-0.5 truncate" title={b.service}>
                            {b.service}
                          </p>
                          <p className="truncate text-[10px] text-muted-foreground">
                            {b.contact_name}
                          </p>
                          {b.status === 'pending' && (
                            <div className="mt-1 flex gap-1">
                              <button
                                type="button"
                                onClick={() => void onDecide(b.id, 'confirm')}
                                className="flex-1 rounded bg-primary py-0.5 text-[10px]
                                  font-bold text-primary-foreground"
                                aria-label={`تأیید ${b.service} برای ${b.contact_name}`}
                              >
                                ✓
                              </button>
                              <button
                                type="button"
                                onClick={() => void onDecide(b.id, 'decline')}
                                className="flex-1 rounded border border-border py-0.5
                                  text-[10px] font-bold text-muted-foreground"
                                aria-label={`رد ${b.service} برای ${b.contact_name}`}
                              >
                                ✕
                              </button>
                            </div>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        همهٔ وضعیت‌ها نمایش داده می‌شوند؛ یک نوبت لغوشده هم جای خودش را
        نشان می‌دهد تا آن ساعت واقعاً خالی به نظر برسد.
      </p>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'primary' }) {
  return (
    <div className={`rounded-2xl border p-3 text-center ${
      tone === 'primary' ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'}`}>
      <p className={`text-2xl font-extrabold ${tone === 'primary' ? 'text-primary' : ''}`}>
        {faDigits(value)}
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p>
    </div>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-3xl px-4 pb-24 pt-28 sm:px-6">{children}</div>
}
