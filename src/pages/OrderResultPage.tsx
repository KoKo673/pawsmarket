import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'

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
              <Button asChild className="flex-1"><Link to="/shop">ادامهٔ خرید</Link></Button>
              <Button asChild variant="outline" className="flex-1"><Link to="/">خانه</Link></Button>
            </div>
          </>
        )}

        {state === 'failed' && (
          <>
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
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
