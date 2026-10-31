import {
  AlertCircle, BadgeCheck, ChevronLeft, Clock, Inbox, Loader2,
  Package, RefreshCw, Search, ShoppingBag, Users,
} from 'lucide-react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { AdminNav } from '@/components/AdminNav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { faDigits } from '@/lib/fa'
import {
  adminApi, type AdminOrderDetail, type AdminUser, type SyncRun,
} from '@/lib/admin-api'

/**
 * پنل ادمین — ویس ۰۹.
 *
 * Reads only. The destructive routes (`catalog/replace`, `migrate`) need
 * `X-Admin-Key`, which a browser never holds, so nothing on this page can
 * drop the catalogue even with a stolen session.
 *
 * Opens on the overview because the first question is always «چطور است؟»
 * and the rest are follow-ups.
 */

const STATUS_FA: Record<string, string> = {
  pending: 'در انتظار پرداخت',
  paid: 'پرداخت‌شده',
  sourcing: 'در حال تأمین',
  shipped: 'ارسال‌شده',
  delivered: 'تحویل‌شده',
  cancelled: 'لغوشده',
  refunded: 'مرجوع‌شده',
}

const PROVIDER_FA: Record<string, string> = {
  torob: 'ترب',
  digikala: 'دیجی‌کالا',
}

type Tab = 'overview' | 'orders' | 'users' | 'sync'

const TABS: { key: Tab; label: string; icon: typeof Users }[] = [
  { key: 'overview', label: 'نمای کلی', icon: BadgeCheck },
  { key: 'orders', label: 'سفارش‌ها', icon: ShoppingBag },
  { key: 'users', label: 'کاربرها', icon: Users },
  { key: 'sync', label: 'همگام‌سازی', icon: RefreshCw },
]

export function AdminPage() {
  const [tab, setTab] = useState<Tab>('overview')

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-28 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight">پنل مدیریت</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          داده‌های زنده. این صفحه فقط می‌خواند؛ کارهای ویرانگر عمداً اینجا
          نیستند.
        </p>
      </header>

      <AdminNav />

      <div
        role="tablist"
        aria-label="بخش‌های پنل"
        className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-border p-1"
      >
        {TABS.map(t => (
          <button
            key={t.key}
            role="tab"
            type="button"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap
              rounded-lg px-3 py-2 text-sm font-bold transition-colors ${
              tab === t.key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'}`}
          >
            <t.icon className="size-4" aria-hidden="true" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab />}
      {tab === 'orders' && <OrdersTab />}
      {tab === 'users' && <UsersTab />}
      {tab === 'sync' && <SyncTab />}
    </div>
  )
}

/* ── نمای کلی ──────────────────────────────────────────────── */

function OverviewTab() {
  const q = useQuery({ queryKey: ['admin', 'overview'], queryFn: adminApi.overview })

  if (q.isPending) return <Loading />
  if (q.isError) return <Failed />
  const d = q.data

  return (
    <div className="space-y-6">
      <section aria-labelledby="money-h">
        <h2 id="money-h" className="mb-3 text-sm font-bold text-muted-foreground">
          فروش
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="سفارش امروز" value={d.orders_today} tone="primary" />
          <Stat label="پرداخت‌شده" value={d.orders_paid} />
          <Stat label="کل سفارش‌ها" value={d.orders} />
          <Stat label="درآمد (تومان)" value={Number(d.revenue_toman)} plain />
        </div>
      </section>

      <section aria-labelledby="ops-h">
        <h2 id="ops-h" className="mb-3 text-sm font-bold text-muted-foreground">
          عملیات
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="تیکت‌های باز" value={d.tickets_open}
                tone={d.tickets_open > 0 ? 'warn' : undefined} />
          <Stat label="نوبت در انتظار" value={d.bookings_pending}
                tone={d.bookings_pending > 0 ? 'warn' : undefined} />
          <Stat label="کل نوبت‌ها" value={d.bookings} />
          <Stat label="محصول فعال" value={d.products} />
        </div>
      </section>

      <section aria-labelledby="base-h">
        <h2 id="base-h" className="mb-3 text-sm font-bold text-muted-foreground">
          پایه
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="کاربرها" value={d.users} />
          <Stat label="۷ روز گذشته" value={d.users_week} />
          <Stat label="مراکز خدمت" value={d.stores} />
          <Stat label="با داشبورد" value={d.stores_with_dashboard} />
        </div>
      </section>

      <p className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
        آخرین همگام‌سازی قیمت:{' '}
        {d.last_sync
          ? new Intl.DateTimeFormat('fa-IR', {
              dateStyle: 'medium', timeStyle: 'short',
            }).format(new Date(d.last_sync))
          : 'هرگز اجرا نشده'}
      </p>
    </div>
  )
}

function Stat({ label, value, tone, plain }: {
  label: string
  value: number
  tone?: 'primary' | 'warn'
  plain?: boolean
}) {
  const cls = tone === 'primary' ? 'border-primary/30 bg-primary/5'
    : tone === 'warn' ? 'border-amber-500/40 bg-amber-500/5'
    : 'border-border bg-card'
  const text = tone === 'primary' ? 'text-primary'
    : tone === 'warn' ? 'text-amber-600'
    : ''
  // `plain` is for money: fa-IR groups thousands but does not abbreviate,
  // and a Toman total with Persian digits is what the reader expects.
  return (
    <div className={`rounded-2xl border p-3 text-center ${cls}`}>
      <p className={`text-2xl font-extrabold tabular-nums ${text}`}>
        {plain
          ? new Intl.NumberFormat('fa-IR').format(value)
          : faDigits(value)}
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p>
    </div>
  )
}

/* ── سفارش‌ها ──────────────────────────────────────────────── */

const ORDER_STATUSES = ['', 'pending', 'paid', 'sourcing', 'shipped',
                        'delivered', 'cancelled', 'refunded'] as const

function OrdersTab() {
  const [status, setStatus] = useState('')
  const [openId, setOpenId] = useState<number | null>(null)
  const q = useQuery({
    queryKey: ['admin', 'orders', status],
    queryFn: () => adminApi.orders(status),
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {ORDER_STATUSES.map(s => (
          <button
            key={s || 'all'}
            type="button"
            onClick={() => setStatus(s)}
            aria-pressed={status === s}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
              status === s
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:text-foreground'}`}
          >
            {s ? STATUS_FA[s] : 'همه'}
          </button>
        ))}
      </div>

      {q.isPending && <Loading />}
      {q.isError && <Failed />}
      {q.data && q.data.items.length === 0 && (
        <Empty icon={Inbox} text="سفارشی با این وضعیت نیست" />
      )}

      {q.data && q.data.items.length > 0 && (
        <>
          <p className="text-xs text-muted-foreground">
            {new Intl.NumberFormat('fa-IR').format(q.data.total)} سفارش
          </p>
          <ul className="space-y-2">
            {q.data.items.map(o => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(openId === o.id ? null : o.id)}
                  aria-expanded={openId === o.id}
                  className="flex w-full items-center justify-between gap-3 rounded-xl
                    border border-border bg-card px-4 py-3 text-start
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold tabular-nums">
                        #{faDigits(o.id)}
                      </span>
                      <StatusBadge status={o.status} />
                    </span>
                    <span className="mt-1 block truncate text-xs text-muted-foreground">
                      {o.contact_name}
                      {o.username && ` · ${o.username}`}
                      {' · '}
                      {new Intl.DateTimeFormat('fa-IR', {
                        dateStyle: 'short', timeStyle: 'short',
                      }).format(new Date(o.created_at))}
                    </span>
                  </span>
                  <span className="shrink-0 text-end">
                    <span className="block text-sm font-extrabold tabular-nums">
                      {new Intl.NumberFormat('fa-IR').format(Number(o.total_toman))}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">
                      تومان · {faDigits(o.items)} قلم
                    </span>
                  </span>
                  <ChevronLeft
                    className={`size-4 shrink-0 text-muted-foreground transition-transform
                      ${openId === o.id ? '-rotate-90' : ''}`}
                    aria-hidden="true"
                  />
                </button>
                {openId === o.id && <OrderDetail id={o.id} />}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

function OrderDetail({ id }: { id: number }) {
  const q = useQuery({
    queryKey: ['admin', 'order', id],
    queryFn: () => adminApi.order(id),
  })

  if (q.isPending) {
    return <p className="px-4 py-3 text-xs text-muted-foreground">در حال بارگذاری…</p>
  }
  if (q.isError) {
    return <p className="px-4 py-3 text-xs text-destructive">جزئیات بارگذاری نشد</p>
  }
  const d: AdminOrderDetail = q.data

  return (
    <div className="mt-2 space-y-3 rounded-xl border border-border bg-muted/20 p-4">
      <dl className="grid gap-2 text-xs sm:grid-cols-2">
        <Row label="گیرنده" value={d.contact_name} />
        <Row label="تلفن" value={faDigits(d.contact_phone)} ltr />
        <Row label="نشانی" value={d.address} span />
        {d.note && <Row label="یادداشت" value={d.note} span />}
      </dl>

      <div>
        <p className="mb-1.5 text-[11px] font-bold text-muted-foreground">اقلام</p>
        <ul className="space-y-1">
          {d.lines.map(l => (
            <li key={l.id}
                className="flex items-baseline justify-between gap-2 rounded-lg
                  bg-card px-3 py-2 text-xs">
              <span className="min-w-0 flex-1 truncate">
                {l.product_name ?? `محصول #${l.product_id}`}
              </span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {faDigits(l.qty)} × {new Intl.NumberFormat('fa-IR').format(Number(l.unit_price))}
              </span>
              <span className="shrink-0 font-bold tabular-nums">
                {new Intl.NumberFormat('fa-IR').format(Number(l.line_total))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function Row({ label, value, ltr, span }: {
  label: string; value: string; ltr?: boolean; span?: boolean
}) {
  return (
    <div className={span ? 'sm:col-span-2' : undefined}>
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className={`mt-0.5 ${ltr ? 'tabular-nums' : ''}`} dir={ltr ? 'ltr' : undefined}>
        {value}
      </dd>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === 'paid' || status === 'delivered' ? 'bg-emerald-500/10 text-emerald-700'
    : status === 'cancelled' || status === 'refunded' ? 'bg-destructive/10 text-destructive'
    : status === 'pending' ? 'bg-amber-500/10 text-amber-700'
    : 'bg-muted text-muted-foreground'
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tone}`}>
      {STATUS_FA[status] ?? status}
    </span>
  )
}

/* ── کاربرها ───────────────────────────────────────────────── */

function UsersTab() {
  const [term, setTerm] = useState('')
  const [submitted, setSubmitted] = useState('')
  const q = useQuery({
    queryKey: ['admin', 'users', submitted],
    queryFn: () => adminApi.users(submitted),
  })

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => { e.preventDefault(); setSubmitted(term.trim()) }}
        className="flex gap-2"
      >
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="جست‌وجوی نام کاربری یا نام نمایشی…"
          aria-label="جست‌وجوی کاربر"
        />
        <Button type="submit" size="icon" aria-label="جست‌وجو">
          <Search className="size-4" aria-hidden="true" />
        </Button>
      </form>

      {q.isPending && <Loading />}
      {q.isError && <Failed />}

      {q.data && (
        <>
          <p className="text-xs text-muted-foreground">
            {new Intl.NumberFormat('fa-IR').format(q.data.total)} کاربر
          </p>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-[11px] text-muted-foreground">
                <tr>
                  <Th>کاربر</Th>
                  <Th>عضویت</Th>
                  <Th>سفارش</Th>
                  <Th>حیوان</Th>
                </tr>
              </thead>
              <tbody>
                {q.data.items.map((u: AdminUser) => (
                  <tr key={u.id} className="border-t border-border">
                    <td className="px-3 py-2">
                      <span className="font-bold">{u.username}</span>
                      {u.is_admin && (
                        <span className="ms-2 rounded-full bg-primary/10 px-1.5 py-0.5
                          text-[10px] font-bold text-primary">
                          ادمین
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-xs tabular-nums
                      text-muted-foreground">
                      {new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short' })
                        .format(new Date(u.created_at))}
                    </td>
                    <td className="px-3 py-2 tabular-nums">{faDigits(u.orders)}</td>
                    <td className="px-3 py-2 tabular-nums">{faDigits(u.pets)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th scope="col" className="px-3 py-2 text-start font-bold">{children}</th>
}

/* ── همگام‌سازی ────────────────────────────────────────────── */

function SyncTab() {
  const q = useQuery({
    queryKey: ['admin', 'sync'],
    queryFn: () => adminApi.syncRuns(30),
  })

  if (q.isPending) return <Loading />
  if (q.isError) return <Failed />
  if (q.data.items.length === 0) {
    return <Empty icon={RefreshCw} text="هنوز همگام‌سازی‌ای اجرا نشده" />
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        هر ۱۲ ساعت اجرا می‌شود. «شکست» یعنی آن منبع در دسترس نبود، نه این‌که
        همگام‌سازی متوقف شد.
      </p>
      <ul className="space-y-2">
        {q.data.items.map((r: SyncRun) => {
          const failed = Array.isArray(r.sources_failed)
            ? (r.sources_failed as string[])
            : []
          const ok = failed.length === 0
          return (
            <li key={r.id}
                className="rounded-xl border border-border bg-card px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-sm font-bold">
                  {ok
                    ? <BadgeCheck className="size-4 text-emerald-600" aria-hidden="true" />
                    : <AlertCircle className="size-4 text-amber-600" aria-hidden="true" />}
                  {new Intl.DateTimeFormat('fa-IR', {
                    dateStyle: 'medium', timeStyle: 'short',
                  }).format(new Date(r.started_at))}
                </span>
                {r.finished_at ? (
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {Math.max(1, Math.round(
                      (new Date(r.finished_at).getTime()
                        - new Date(r.started_at).getTime()) / 1000))} ثانیه
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] text-amber-600">
                    <Clock className="size-3" aria-hidden="true" /> ناتمام
                  </span>
                )}
              </div>

              <dl className="mt-2 grid grid-cols-3 gap-2 text-[11px] sm:grid-cols-5">
                <Cell label="دیده‌شده" value={r.offers_seen} />
                <Cell label="نوشته‌شده" value={r.offers_written} />
                <Cell label="محصول نو" value={r.products_created} />
                <Cell label="تغییر قیمت" value={r.products_repriced} />
                <Cell label="کوئری" value={r.queries} />
              </dl>

              {failed.length > 0 && (
                <p className="mt-2 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-700">
                  در دسترس نبود: {failed.map(f => PROVIDER_FA[f] ?? f).join('، ')}
                </p>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function Cell({ label, value }: { label: string; value: number | null }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-bold tabular-nums">
        {value === null ? '—' : faDigits(value)}
      </dd>
    </div>
  )
}

/* ── مشترک ─────────────────────────────────────────────────── */

function Loading() {
  return (
    <div className="grid place-items-center py-16">
      <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
      <span className="sr-only">در حال بارگذاری</span>
    </div>
  )
}

function Failed() {
  return (
    <div className="rounded-2xl border border-border bg-muted/30 px-6 py-12 text-center">
      <AlertCircle className="mx-auto size-7 text-muted-foreground" aria-hidden="true" />
      <p className="mt-3 text-sm font-semibold">بارگذاری نشد</p>
      <p className="mt-1 text-xs text-muted-foreground">
        اتصال را بررسی کنید و دوباره تلاش کنید.
      </p>
    </div>
  )
}

function Empty({ icon: Icon, text }: { icon: typeof Package; text: string }) {
  return (
    <div className="rounded-2xl border border-border bg-muted/30 px-6 py-14 text-center">
      <Icon className="mx-auto size-7 text-muted-foreground" aria-hidden="true" />
      <p className="mt-3 text-sm font-semibold">{text}</p>
    </div>
  )
}
