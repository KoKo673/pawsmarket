import { useQuery } from '@tanstack/react-query'
import { BadgeCheck } from 'lucide-react'

// Same base every other module uses; there is no http.ts in this project.
const API = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

/**
 * یک بخش «اعتماد مشتری»، ساخته‌شده از سفارش‌های **واقعاً پرداخت‌شده**.
 *
 * ── چرا این کامپوننت اغلب هیچ چیز رندر نمی‌کند ──────────────────────
 * اندازه‌گیری ۲۰۲۶-۱۱-۲۲ روی production:
 *
 *     orders ever 0 · payments ever 0 · non-admin users 0
 *
 * هیچ مشتری‌ای وجود ندارد که نقل‌قولش را بیاوریم. یک بخش testimonials که
 * اینجا پر می‌شد، یا خالی بود یا جمله‌هایی داشت که هیچ‌کس نگفته بود —
 * و جمله‌ای که هیچ‌کس نگفته، در قوانین تبلیغات ایران (کمسیون مادهٔ ۲۹)
 * تبلیغ گمراه‌کننده است، نه «ذوق بازاریابی». این پروژه در SRS §۳۷ یک
 * فهرست از ادعاهای مطمئنی دارد که اندازه‌گیری ردشان کرد؛ عدد «۷۳ کاربر»
 * که ۷۲ حساب تستی بود تازه‌ترینشان.
 *
 * پس قاعده: **متن از ستون‌ها ساخته می‌شود، نوشته نمی‌شود.** هر جمله‌ای که
 * اینجا می‌خوانید یک فیلد در دیتابیس است — نام، شهر، تعداد سفارش، محصول.
 * اگر سفارش پرداخت‌شده‌ای نباشد، `items` خالی است و این کامپوننت
 * `null` برمی‌گرداند: نه باکس خالی، نه متن جانشین.
 *
 * ── چرا `error` جدا از `items` خالی است ─────────────────────────────
 * «هنوز مشتری نداریم» و «کوئری شکست خورد» هر دو لیست خالی می‌دهند، ولی
 * یکی وضعیت است و دیگری باگ. سرور `error: true` می‌فرستد و اینجا در آن
 * حالت هم چیزی رندر نمی‌شود — یک صفحهٔ اصلی نباید به‌خاطر یک بخش تزئینی
 * خطا نشان دهد — ولی در کنسول ثبت می‌شود تا در Loki دیده شود.
 */
type Testimonial = {
  name: string
  city?: string
  paid_orders: number
  since: string | null
  products: string[]
}

export function Testimonials() {
  const q = useQuery({
    queryKey: ['shop-testimonials'],
    queryFn: async () => {
      const r = await fetch(`${API}/api/shop/testimonials`)
      if (!r.ok) throw new Error(`testimonials ${r.status}`)
      return (await r.json()) as { items: Testimonial[]; error?: boolean }
    },
    // Ten minutes: a new paid order is not going to arrive between two page
    // views, and this must never be the thing that slows the home page.
    staleTime: 10 * 60_000,
    retry: 1,
  })

  if (q.data?.error) {
    // Visible in logs, invisible to the visitor — the home page must not
    // break over a decorative section.
    console.warn('[testimonials] server reported an error; section hidden')
  }

  const items = q.data?.items ?? []
  if (items.length === 0) return null

  return (
    <section aria-labelledby="testimonials-title" className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
      <header className="mb-5">
        <h2 id="testimonials-title" className="text-lg font-extrabold tracking-tight">
          مشتریان ما
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          هر مورد از یک سفارش پرداخت‌شده ساخته شده — نه از یک متن تبلیغاتی.
        </p>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((t, i) => (
          <li key={`${t.name}-${i}`} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <BadgeCheck className="size-4 text-primary" aria-hidden />
              <p className="text-sm font-bold">{t.name}</p>
              {t.city && (
                <span className="text-[11px] text-muted-foreground">· {t.city}</span>
              )}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {/* The sentence is assembled from facts, in this component,
                  and every clause below is a column. */}
              {t.paid_orders === 1
                ? 'یک سفارش ثبت‌شده'
                : `${t.paid_orders} سفارش ثبت‌شده`}
              {t.products.length > 0 && (
                <> · {t.products.slice(0, 2).join('، ')}</>
              )}
            </p>
            {t.since && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                آخرین خرید: {new Date(t.since).toLocaleDateString('fa-IR')}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}