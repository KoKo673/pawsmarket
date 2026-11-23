import { Check, Clock, Package, ShoppingBag, Truck, XCircle } from 'lucide-react'

import { faDate } from '@/lib/fa'

/**
 * مسیر سفارش — «الان کجاست» و «بعدش چه می‌شود».
 *
 * ── چرا این کامپوننت هست ────────────────────────────────────────────
 * `statusLabel()` از قبل هر هفت وضعیت را به فارسی ترجمه می‌کرد، و همین
 * کافی نبود: مشتری کلمهٔ «در حال تأمین» را می‌خواند و نمی‌دانست یعنی
 * چه، چقدر طول می‌کشد، یا قدم بعدی کِی است. یک برچسب بدون مسیر، یک
 * وضعیت است بدون معنی.
 *
 * اندازه‌گیری ۲۰۲۶-۱۱-۲۳ روی یک سفارش واقعی با `status='shipped'`:
 * صفحه فقط کلمهٔ «ارسال‌شده» را نشان می‌داد، بدون کد رهگیری، بدون تاریخ
 * ارسال، بدون هیچ کاری که مشتری بتواند بکند. مهاجرت 0036 سه ستون
 * رهگیری اضافه کرد و این کامپوننت آن‌ها را نشان می‌دهد.
 *
 * ── قاعده‌ای که در طراحی رعایت شد ─────────────────────────────────
 * هر مرحله باید چیزی بگوید که **مشتری بتواند با آن کاری بکند** (کد
 * رهگیری، تاریخ، یا انتظار مشخص). مرحله‌ای که فقط اسمش را می‌گوید حذف
 * شده — «پرداخت شد» یک اتفاق است، «ارسال شد» فقط وقتی معنی دارد که
 * کد رهگیری همراهش باشد.
 */

export type OrderStatus =
  | 'pending' | 'paid' | 'sourcing' | 'shipped' | 'delivered'
  | 'cancelled' | 'refunded'

/** Only the keys that appear ON the path. `cancelled`/`refunded` leave it. */
type StepKey = 'pending' | 'paid' | 'sourcing' | 'shipped' | 'delivered'

/** مسیر عادی. `cancelled`/`refunded` مسیر جدا دارند و این‌جا نیستند. */
const PATH: { key: StepKey; label: string; hint: string }[] = [
  { key: 'pending',   label: 'ثبت سفارش',   hint: 'در انتظار پرداخت' },
  { key: 'paid',      label: 'پرداخت شد',   hint: 'سفارش شما تأیید شد' },
  { key: 'sourcing',  label: 'آماده‌سازی',  hint: 'کالا برای شما تهیه می‌شود' },
  { key: 'shipped',   label: 'ارسال شد',    hint: 'تحویل به پست یا پیک' },
  { key: 'delivered', label: 'تحویل شد',    hint: 'سفارش به دست شما رسید' },
]

// Typed on the STEP keys only, not the full OrderStatus union: `cancelled`
// and `refunded` leave the path entirely and are rendered by the separate
// branch above, so giving them an icon here would advertise a step that
// never appears in the timeline.
const ICONS: Record<StepKey, typeof Clock> = {
  pending: Clock, paid: Check, sourcing: Package, shipped: Truck,
  delivered: ShoppingBag,
}

/** جای این وضعیت در مسیر. `-1` یعنی مسیر لغو/بازپرداخت. */
function indexOf(status: string): number {
  return PATH.findIndex((s) => s.key === status)
}

export interface TimelineOrder {
  status: string
  created_at: string
  paid_at: string | null
  shipped_at?: string | null
  tracking_code?: string | null
  tracking_carrier?: string | null
  delivery_eta_days?: number | null
}

/** تاریخِ هر مرحله، تا جایی که می‌دانیم. `null` یعنی نرسیده. */
function dateFor(order: TimelineOrder, key: OrderStatus): string | null {
  if (key === 'pending') return order.created_at
  if (key === 'paid') return order.paid_at
  if (key === 'shipped') return order.shipped_at ?? null
  // تأمین و تحویل تاریخ جدا ندارند؛ تاریخ ارسال نزدیک‌ترین لنگر است.
  if (key === 'delivered') return null
  return null
}

export function OrderTimeline({ order }: { order: TimelineOrder }) {
  const cancelled = order.status === 'cancelled' || order.status === 'refunded'
  const current = indexOf(order.status)

  if (cancelled) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
        <XCircle className="mt-0.5 size-5 shrink-0 text-destructive-text" aria-hidden />
        <div>
          <p className="text-sm font-bold">
            {order.status === 'refunded' ? 'سفارش بازپرداخت شد' : 'سفارش لغو شد'}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {order.status === 'refunded'
              ? 'مبلغ به حساب شما برمی‌گردد؛ بسته به بانک تا ۷۲ ساعت کاری طول می‌کشد.'
              : 'این سفارش لغو شده و مبلغی برای آن نگه داشته نشده است.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <ol className="rounded-2xl border border-border bg-card p-4">
      {PATH.map((step, i) => {
        const done = i < current
        const active = i === current
        const Icon = ICONS[step.key]
        const when = done || active ? dateFor(order, step.key) : null

        return (
          <li key={step.key} className="relative flex gap-3 pb-4 last:pb-0">
            {/* The rail. Hidden on the last item so it does not dangle. */}
            {i < PATH.length - 1 && (
              <span
                aria-hidden
                className={`absolute right-[11px] top-6 h-full w-0.5 ${
                  done ? 'bg-primary' : 'bg-border'}`}
              />
            )}
            <span
              className={`relative z-10 grid size-6 shrink-0 place-items-center rounded-full ${
                done || active
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'}`}
            >
              <Icon className="size-3.5" aria-hidden />
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                <p className={`text-sm ${active ? 'font-extrabold' : 'font-semibold'} ${
                  done || active ? '' : 'text-muted-foreground'}`}>
                  {step.label}
                  {active && (
                    <span className="mr-2 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                      اکنون
                    </span>
                  )}
                </p>
                {when && (
                  <span className="text-[11px] text-muted-foreground">{faDate(when)}</span>
                )}
              </div>

              {/* Every line here is something the customer can act on. */}
              {(active || done) && (
                <p className="mt-0.5 text-[11px] text-muted-foreground">{step.hint}</p>
              )}

              {/* The tracking number, at the step it belongs to. */}
              {step.key === 'shipped' && (done || active) && (
                <TrackingBlock order={order} />
              )}

              {/* The expectation, on the step where the customer is waiting. */}
              {step.key === 'sourcing' && active && order.delivery_eta_days != null && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  زمان تحویل انتخابی: حدود{' '}
                  {order.delivery_eta_days.toLocaleString('fa-IR')} روز کاری
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function TrackingBlock({ order }: { order: TimelineOrder }) {
  if (!order.tracking_code) {
    // Saying so is the point. A blank line under «ارسال شد» reads as a
    // bug; this reads as «we owe you this information».
    return (
      <p className="mt-1 text-[11px] text-muted-foreground">
        کد رهگیری هنوز ثبت نشده — اگر بسته را دریافت نکردید با پشتیبانی تماس بگیرید.
      </p>
    )
  }
  return (
    <p className="mt-1 text-[11px]">
      <span className="text-muted-foreground">
        {order.tracking_carrier ? `${order.tracking_carrier} — ` : ''}کد رهگیری:{' '}
      </span>
      {/* `select-all` so one tap copies it: a tracking code is the reason
          the customer opened this page, and retyping 24 digits is where
          they give up. */}
      <span className="select-all font-mono font-bold" dir="ltr">
        {order.tracking_code}
      </span>
    </p>
  )
}