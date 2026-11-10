import { ArrowRight, Loader2, Package } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { faPrice } from '@/lib/fa'
import { shopApi } from '@/lib/shop-api'
import { statusLabel } from '@/pages/MyOrdersPage'

const faDate = (iso: string) =>
  new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' })
    .format(new Date(iso))

/**
 * یک سفارش، با اقلام و پنجرهٔ تحویل.
 *
 * The delivery window appears here because it is the part of the order the
 * customer cannot otherwise recover: they chose it, and nothing was showing
 * it back to them.
 */
export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()

  const order = useQuery({
    queryKey: ['order', id],
    queryFn: () => shopApi.order(id!),
    enabled: !!id,
    retry: false,
  })

  if (order.isPending) {
    return <Shell><div className="grid place-items-center py-24">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div></Shell>
  }

  if (order.isError || !order.data) {
    return (
      <Shell>
        <div className="rounded-3xl border border-border bg-muted/30 px-6 py-14 text-center">
          <Package className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold">این سفارش پیدا نشد</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/orders">بازگشت به سفارشها</Link>
          </Button>
        </div>
      </Shell>
    )
  }

  const o = order.data

  return (
    <Shell>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-extrabold">سفارش #{o.id}</h2>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold">
          {statusLabel(o.status)}
        </span>
      </div>

      <dl className="mt-5 space-y-2 rounded-2xl border border-border bg-card p-4 text-sm">
        <Row label="تاریخ ثبت" value={faDate(o.created_at)} />
        {o.paid_at && <Row label="تاریخ پرداخت" value={faDate(o.paid_at)} />}
        {o.delivery_eta_days != null && (
          <Row label="زمان تحویل"
               value={`حدود ${o.delivery_eta_days.toLocaleString('fa-IR')} روز کاری`} />
        )}
        <Row label="نام گیرنده" value={o.contact_name} />
        <Row label="شماره تماس" value={o.contact_phone} />
        <Row label="نشانی" value={o.address} />
        {o.note && <Row label="یادداشت" value={o.note} />}
      </dl>

      <h3 className="mb-2 mt-6 text-sm font-bold">اقلام</h3>
      <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
        {o.items.map((it, i) => (
          <li key={i} className="flex items-baseline justify-between gap-3 p-3 text-sm">
            <span className="min-w-0 flex-1">
              <span className="line-clamp-2 font-semibold">{it.name}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {it.qty.toLocaleString('fa-IR')} × {faPrice(it.unit_price)}
              </span>
            </span>
            <span className="font-bold">{faPrice(it.qty * it.unit_price)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-baseline justify-between rounded-2xl border border-border bg-card p-4">
        <span className="text-sm font-semibold text-muted-foreground">جمع کل</span>
        <span className="text-lg font-extrabold text-primary">{faPrice(o.total_toman)}</span>
      </div>
    </Shell>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 font-semibold text-muted-foreground">{label}</dt>
      <dd className="text-left">{value}</dd>
    </div>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-28 sm:px-6">
      <Link to="/orders"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary">
        <ArrowRight className="size-4" />
        سفارشهای من
      </Link>
      {children}
    </div>
  )
}