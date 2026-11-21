import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { trackPurchase } from '@/lib/gtag'
import { shopApi } from '@/lib/shop-api'

/**
 * بازگشت از درگاه پرداخت.
 *
 * The gateway sends the buyer back here with query parameters that are
 * only a claim — `Status=OK` means the browser says so, not that money
 * moved. The server is what settles it: this page posts the same
 * authority to the callback endpoint and reads the answer from the
 * database. A page that trusted the query string would show "پرداخت
 * موفق" to anyone who typed it.
 */
export function OrderResultPage() {
  const [params] = useSearchParams()
  const [state, setState] = useState<'checking' | 'ok' | 'failed'>('checking')
  const [message, setMessage] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<number | null>(null)

  // The two gateways name these differently; read whichever is present.
  const gateway = params.get('gateway')
    || (params.get('Authority') ? 'zarinpal' : params.get('trackId') ? 'zibal' : '')

  useEffect(() => {
    const query = params.toString()
    if (!gateway || !query) {
      setState('failed')
      setMessage('پارامترهای بازگشت از درگاه کامل نیست')
      return
    }

    let cancelled = false
    const controller = new AbortController()

    void (async () => {
      try {
        const res = await fetch(
          `/api/shop/payment/callback/${gateway}?${query}`,
          { signal: controller.signal },
        )
        const body = await res.json().catch(() => null) as
          | { ok?: boolean; order_id?: number; reason?: string; detail?: string }
          | null
        if (cancelled) return
        if (body?.ok) {
          setState('ok')
          setOrderId(body.order_id ?? null)

          // `purchase` is reported ONLY from this branch, because this is
          // the only place the server has confirmed the payment. The query
          // string the gateway returned with is a claim by the browser; a
          // page that trusted it would let anyone register a sale by typing
          // a URL, and would count every cancelled payment that looked OK.
          //
          // The order is re-read for its total and lines rather than
          // guessed from the cart: the cart is emptied by the server on a
          // verified payment (see the callback handler), so by this moment
          // it no longer describes what was bought.
          if (body.order_id != null) {
            try {
              const order = await shopApi.order(body.order_id)
              trackPurchase(String(body.order_id), {
                total_toman: order.total_toman,
                items: order.items,
              })
            } catch {
              // The payment is verified either way; a failed analytics
              // read must never turn a successful purchase into an error
              // screen. Missing one `purchase` event is a reporting gap,
              // showing the buyer a failure would be a lie.
            }
          }
        } else {
          setState('failed')
          setMessage(body?.detail ?? (
            body?.reason === 'cancelled'
              ? 'پرداخت لغو شد'
              : 'پرداخت تأیید نشد'))
        }
      } catch (err) {
        if (cancelled || (err as Error).name === 'AbortError') return
        setState('failed')
        setMessage('ارتباط با سرور برقرار نشد')
      }
    })()

    return () => { cancelled = true; controller.abort() }
  }, [gateway, params])

  return (
    <div className="mx-auto max-w-lg px-4 pb-24 pt-28 sm:px-6">
      <div className="glass rounded-3xl p-8 text-center shadow-lifted">
        {state === 'checking' && (
          <>
            <Loader2 className="mx-auto size-8 animate-spin text-muted-foreground" />
            <h1 className="mt-4 text-xl font-extrabold">در حال بررسی پرداخت…</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              نتیجه را از درگاه استعلام می‌کنیم؛ این صفحه را نبندید.
            </p>
          </>
        )}

        {state === 'ok' && (
          <>
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent text-accent-foreground">
              <CheckCircle2 className="size-7" />
            </span>
            <h1 className="mt-4 text-2xl font-extrabold">پرداخت تأیید شد</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              سفارش شما ثبت شد{orderId ? ` (شمارهٔ ${orderId})` : ''}. تأمین
              و ارسال را از همین‌جا پیگیری می‌کنیم.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Button asChild className="flex-1">
                <Link to={orderId ? `/orders/${orderId}` : '/orders'}>
                  پیگیری سفارش
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1"><Link to="/shop">ادامهٔ خرید</Link></Button>
            </div>
          </>
        )}

        {state === 'failed' && (
          <>
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-destructive/10 text-destructive-text">
              <XCircle className="size-7" />
            </span>
            <h1 className="mt-4 text-2xl font-extrabold">پرداخت انجام نشد</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {message ?? 'تراکنش تأیید نشد. اگر مبلغی کم شده، طی چند دقیقه برمی‌گردد.'}
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Button asChild className="flex-1"><Link to="/cart">بازگشت به سبد</Link></Button>
              <Button asChild variant="outline" className="flex-1"><Link to="/shop">فروشگاه</Link></Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
