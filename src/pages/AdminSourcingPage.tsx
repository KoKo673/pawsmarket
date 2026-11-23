import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Bell, Check, Loader2, Package, Truck } from 'lucide-react'
import { useState } from 'react'

import { AdminNav } from '@/components/AdminNav'
import { Button } from '@/components/ui/button'
import { faDigits } from '@/lib/fa'
import { adminApi, type SourcingRow } from '@/lib/admin-api'

/**
 * صف تأمین — سفارش‌هایی که پولشان رسیده و باید کالا از جایی خریداری شود.
 *
 * ── چرا این صفحه هست ────────────────────────────────────────────────
 * اندازه‌گیری ۲۰۲۶-۱۱-۲۳ روی production:
 *
 *     orders ever 0
 *     هر مسیری از پرداخت به فروشنده   هیچ
 *
 * یعنی وقتی پرداخت تأیید می‌شد، `orders.status` می‌شد `paid` و **تمام**.
 * پنل ادمین فیلتر `sourcing` را از روز اول داشت و هیچ کدی هرگز آن را
 * نمی‌نوشت. یک سفارش پرداخت‌شده فقط یک ردیف بود که خوانده می‌شد و
 * مشتری باید پول می‌داد و منتظر می‌ماند.
 *
 * ── چرا مرورگر سفارش خودکار نمی‌دهد ──────────────────────────────
 * PawsMarket aggregator است؛ کالا مال خودش نیست و فروشنده هر ردیف یک
 * سایت شخص ثالث است. سفارش خودکار یعنی دادن آدرس مشتری به یک شخص ثالثِ
 * نامشخص و پرداخت به کسی که API عمومی سفارش ندارد. پایین صفحه همیشه
 * یک انسان است. پس این صفحه **گم‌نشدن** را تضمین می‌کند، نه خودکارسازی
 * را: هر سفارش یک لینک خرید مستقیم دارد و یک دکمهٔ «مرحلهٔ بعد».
 *
 * ── ترتیب ────────────────────────────────────────────────────────
 * قدیمی‌ترین اول. سفارشی که بیشتر صبر کرده، بیشتر احتمال دارد فراموش
 * شود، و فهرستی که از تازه به قدیم مرتب باشد دقیقاً همان را پنهان می‌کند.
 */

const STATUS_FA: Record<string, string> = {
  paid: 'پرداخت‌شده — منتظر تأمین',
  sourcing: 'در حال تأمین',
}

/** مرحلهٔ بعدی، و برچسبش. `null` یعنی اینجا آخر خط است. */
function nextStep(status: string): { to: string; label: string } | null {
  if (status === 'paid') return { to: 'sourcing', label: 'شروع تأمین' }
  if (status === 'sourcing') return { to: 'shipped', label: 'ارسال شد' }
  return null
}

/** «۳۰ ساعت» را «۱ روز و ۶ ساعت» می‌کند — برای تصمیم، نه برای دقت. */
function waiting(hours: number | null): string {
  if (hours === null || Number.isNaN(hours)) return '—'
  const h = Math.max(0, Math.round(hours))
  if (h < 24) return `${faDigits(h)} ساعت`
  const d = Math.floor(h / 24)
  const rest = h % 24
  return rest === 0 ? `${faDigits(d)} روز` : `${faDigits(d)} روز و ${faDigits(rest)} ساعت`
}

/** یک روز کاری یعنی ۲۴ ساعت؛ بیشتر از آن رنگ هشدار می‌گیرد. */
const LATE_HOURS = 24

function Row({ row }: { row: SourcingRow }) {
  const qc = useQueryClient()
  const [opened, setOpened] = useState(false)
  // The ship form. Kept closed until «ارسال شد» is pressed, because a
  // carrier field sitting on every row invites someone to fill it for an
  // order that has not shipped yet.
  const [shipping, setShipping] = useState(false)
  const [code, setCode] = useState('')
  const [carrier, setCarrier] = useState('')

  const detail = useQuery({
    queryKey: ['admin-order', row.id],
    queryFn: () => adminApi.order(row.id),
    enabled: opened,
  })

  const advance = useMutation({
    mutationFn: (vars: { to: string; code?: string; carrier?: string }) =>
      adminApi.setOrderStatus(
        row.id, vars.to,
        vars.code ? { code: vars.code, carrier: vars.carrier } : undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-sourcing'] })
      qc.invalidateQueries({ queryKey: ['admin-order', row.id] })
      setShipping(false)
      setCode('')
      setCarrier('')
    },
  })

  const renudge = useMutation({
    mutationFn: () => adminApi.notifyOrder(row.id),
  })

  const late = (row.hours_since_paid ?? 0) > LATE_HOURS
  const step = nextStep(row.status)

  return (
    <li className={`rounded-2xl border bg-card p-4 ${
      late ? 'border-destructive/50' : 'border-border'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold">سفارش #{faDigits(row.id)}</p>
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
              {STATUS_FA[row.status] ?? row.status}
            </span>
            {late && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-destructive">
                <AlertCircle className="size-3" aria-hidden />
                {waiting(row.hours_since_paid)} منتظر
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {row.contact_name} · {faDigits(row.contact_phone)}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{row.address}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setOpened((v) => !v)}
          >
            <Package className="size-3.5" aria-hidden />
            {opened ? 'بستن اقلام' : 'اقلام و لینک خرید'}
          </Button>

          {step && (
            <Button
              size="sm"
              disabled={advance.isPending}
              /* «ارسال شد» opens the form instead of firing: the tracking
                 code is the whole point of the shipped state, and a
                 one-click ship without it leaves the customer with a word.
                 Every other step has nothing extra to ask. */
              onClick={() =>
                step.to === 'shipped'
                  ? setShipping((v) => !v)
                  : advance.mutate({ to: step.to })}
            >
              {advance.isPending
                ? <Loader2 className="size-3.5 animate-spin" aria-hidden />
                : <Truck className="size-3.5" aria-hidden />}
              {step.label}
            </Button>
          )}

          {/* The automatic notice already ran at the payment callback. This
              is the retry for the case where Bale was down at that moment —
              the order is already paid, so nothing else would resend it. */}
          <Button
            size="sm"
            variant="ghost"
            disabled={renudge.isPending}
            onClick={() => renudge.mutate()}
            title="فرستادن دوبارهٔ اعلان تأمین به بله"
          >
            <Bell className="size-3.5" aria-hidden />
          </Button>
        </div>
      </div>

      {/* The ship form. Its own row so it reads as a decision, not as more
          buttons. Enter submits; the code field is focused on open because
          that is the only thing anyone types here. */}
      {shipping && (
        <form
          className="mt-3 flex flex-wrap items-end gap-2 border-t border-border pt-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (!code.trim()) return
            advance.mutate({ to: 'shipped', code: code.trim(), carrier: carrier.trim() })
          }}
        >
          <label className="flex-1 text-[11px] font-semibold text-muted-foreground">
            کد رهگیری
            <input
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              dir="ltr"
              inputMode="numeric"
              placeholder="مثلاً 24301999888777665544"
              className="mt-1 block w-full rounded-lg border border-border bg-background px-2 py-1.5 font-mono text-sm text-foreground"
            />
          </label>
          <label className="text-[11px] font-semibold text-muted-foreground">
            حامل
            <input
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              placeholder="پست، تیپاکس، …"
              className="mt-1 block w-28 rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground"
            />
          </label>
          <Button type="submit" size="sm" disabled={!code.trim() || advance.isPending}>
            {advance.isPending
              ? <Loader2 className="size-3.5 animate-spin" aria-hidden />
              : <Check className="size-3.5" aria-hidden />}
            ثبت ارسال
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => { setShipping(false); setCode(''); setCarrier('') }}
          >
            انصراف
          </Button>
          {!code.trim() && (
            <p className="w-full text-[11px] text-muted-foreground">
              بدون کد رهگیری، مشتری فقط کلمهٔ «ارسال‌شده» را می‌بیند.
            </p>
          )}
        </form>
      )}

      {advance.isError && (
        <p className="mt-2 text-xs text-destructive">
          {(advance.error as Error).message}
        </p>
      )}
      {renudge.isSuccess && (
        <p className="mt-2 text-xs text-muted-foreground">
          {renudge.data.sent ? 'اعلان فرستاده شد.' : 'اعلان فرستاده نشد — لاگ را ببینید.'}
        </p>
      )}

      {opened && (
        <div className="mt-3 border-t border-border pt-3">
          {detail.isLoading && (
            <p className="text-xs text-muted-foreground">در حال خواندن…</p>
          )}
          {detail.data && (
            <ul className="space-y-2">
              {detail.data.lines.map((line) => (
                <li key={line.id} className="text-xs">
                  <span className="font-bold">
                    {faDigits(line.qty)}× {line.product_name}
                  </span>
                  {/* The supplier link is the whole point of this screen: it
                      is what turns "a paid order" into "go buy this here". */}
                  {line.supplier_url ? (
                    <a
                      href={line.supplier_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 block truncate text-primary underline"
                    >
                      {line.supplier ?? 'لینک فروشنده'}
                    </a>
                  ) : (
                    <span className="mt-0.5 block text-destructive">
                      لینک فروشنده ثبت نشده — دستی تهیه شود
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  )
}

export function AdminSourcingPage() {
  const q = useQuery({
    queryKey: ['admin-sourcing'],
    queryFn: () => adminApi.sourcing(),
    refetchInterval: 60_000,
  })

  const rows = q.data?.items ?? []

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-28 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight">صف تأمین</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          سفارش‌هایی که پرداختشان تأیید شده و باید کالا از فروشنده تهیه شود.
          قدیمی‌ترین بالا؛ هر قلم یک لینک خرید مستقیم دارد.
        </p>
      </header>

      <AdminNav />

      {q.isLoading && (
        <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden /> در حال خواندن…
        </p>
      )}
      {q.isError && (
        <p className="mt-6 text-sm text-destructive">
          {(q.error as Error).message}
        </p>
      )}
      {q.isSuccess && rows.length === 0 && (
        // Says which empty this is. "No orders waiting" after the first real
        // sale would be the wrong thing to print if the query had failed —
        // and this project has been bitten by exactly that before.
        <p className="mt-6 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          هیچ سفارشی منتظر تأمین نیست.
        </p>
      )}

      {rows.length > 0 && (
        <ul className="mt-4 space-y-3">
          {rows.map((row) => <Row key={row.id} row={row} />)}
        </ul>
      )}
    </div>
  )
}