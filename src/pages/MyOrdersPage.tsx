import { Loader2, Package, ShoppingBag } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { faPrice } from '@/lib/fa'
import { shopApi } from '@/lib/shop-api'
import { useAuthStore } from '@/store/auth.store'

// Same formatter the admin and booking pages use, so a date reads the same
// everywhere in the product.
const faDate = (iso: string) =>
  new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date(iso))

/**
 * سفارشهای من.
 *
 * The product page has always told the buyer that order status appears here
 * («وضعیت در سفارشهای من بهروز میشود») and no such page existed — the
 * promise led to a 404. This is that page.
 *
 * The delivery window is shown because it is the thing the customer chose
 * at checkout and the only part of the order they can still act on.
 */
export function MyOrdersPage() {
  const user = useAuthStore((s) => s.user)

  const orders = useQuery({
    queryKey: ['orders'],
    queryFn: shopApi.orders,
    enabled: !!user,
  })

  if (!user) {
    return (
      <Shell>
        <div className="rounded-3xl border border-border bg-muted/30 px-6 py-16 text-center">
          <ShoppingBag className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold">برای دیدن سفارشها وارد شوید</p>
          <Button asChild className="mt-4">
            <Link to="/login?next=/orders">ورود</Link>
          </Button>
        </div>
      </Shell>
    )
  }

  if (orders.isPending) {
    return <Shell><div className="grid place-items-center py-24">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div></Shell>
  }

  if (orders.isError) {
    return (
      <Shell>
        <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive-text">
          {orders.error instanceof Error ? orders.error.message : 'خواندن سفارشها انجام نشد'}
        </p>
      </Shell>
    )
  }

  const items = orders.data?.items ?? []

  if (items.length === 0) {
    return (
      <Shell>
        <div className="rounded-3xl border border-border bg-muted/30 px-6 py-16 text-center">
          <ShoppingBag className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold">هنوز سفارشی ثبت نکردهاید</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/shop">رفتن به فروشگاه</Link>
          </Button>
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <ul className="space-y-3">
        {items.map((o) => (
          <li key={o.id}
              className="rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-sm font-bold">سفارش #{o.id}</span>
              <StatusPill status={o.status} />
            </div>

            <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2 text-sm">
              <span className="text-muted-foreground">{faDate(o.created_at)}</span>
              <span className="font-extrabold text-primary">{faPrice(o.total_toman)}</span>
            </div>

            {o.delivery_eta_days != null && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Package className="size-3.5 shrink-0" aria-hidden />
                زمان تحویل: حدود {o.delivery_eta_days.toLocaleString('fa-IR')} روز کاری
              </p>
            )}

            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link to={`/orders/${o.id}`}>جزئیات</Link>
            </Button>
          </li>
        ))}
      </ul>
    </Shell>
  )
}

/**
 * Order status in the customer's language. The database values are English
 * identifiers (`pending`, `paid`, `sourced`, …); showing those raw to a
 * Persian customer says nothing.
 */
export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'در انتظار پرداخت',
    paid: 'پرداختشده',
    sourcing: 'در حال تأمین',
    shipped: 'ارسالشده',
    delivered: 'تحویلشده',
    cancelled: 'لغوشده',
    refunded: 'بازپرداختشده',
  }
  return map[status] ?? status
}

function StatusPill({ status }: { status: string }) {
  const tone: Record<string, string> = {
    pending: 'bg-muted text-muted-foreground',
    paid: 'bg-primary/10 text-primary',
    sourcing: 'bg-primary/10 text-primary',
    shipped: 'bg-primary/10 text-primary',
    delivered: 'bg-green-500/10 text-green-700 dark:text-green-400',
    cancelled: 'bg-destructive/10 text-destructive-text',
    refunded: 'bg-destructive/10 text-destructive-text',
  }
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${tone[status] ?? 'bg-muted text-muted-foreground'}`}>
      {statusLabel(status)}
    </span>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-28 sm:px-6">
      <h1 className="mb-6 text-2xl font-extrabold tracking-tight">سفارشهای من</h1>
      {children}
    </div>
  )
}