import { CalendarDays, Check, Clock, Loader2, Phone, X } from 'lucide-react'
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

      <div className="mb-4 flex gap-1 rounded-xl border border-border p-1">
        {TABS.map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold transition-colors ${
              tab === t.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {d.items.length === 0 ? (
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
