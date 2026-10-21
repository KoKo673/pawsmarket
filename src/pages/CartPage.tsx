import { CreditCard, Loader2, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { faPrice } from '@/lib/fa'
import { shopApi } from '@/lib/shop-api'
import { useAuthStore } from '@/store/auth.store'

/**
 * سبد خرید و پرداخت.
 *
 * The gateway is chosen here rather than in the backend because it is the
 * customer's choice, not a policy: Zibal and ZarinPal differ in what they
 * accept and who pays the fee, and both are wired.
 *
 * The price the customer sees is what the server will charge — checkout
 * re-reads every product and refuses with 409 if it moved. So a total
 * that differs from what this page showed is a real event, not a glitch,
 * and its message is surfaced rather than swallowed.
 */
export function CartPage() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)

  const cart = useQuery({
    queryKey: ['cart'],
    queryFn: shopApi.cart,
    enabled: !!user,
  })

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [note, setNote] = useState('')
  const [gateway, setGateway] = useState<'zibal' | 'zarinpal'>('zibal')
  const [error, setError] = useState<string | null>(null)

  // Prefill from the account so a signed-in customer does not retype
  // their own name on a phone.
  useEffect(() => {
    if (user) {
      setName((v) => v || user.display_name || user.username || '')
    }
  }, [user])

  const setQty = useMutation({
    mutationFn: ({ id, qty }: { id: number; qty: number }) => shopApi.setQty(id, qty),
    onSuccess: (data) => queryClient.setQueryData(['cart'], data),
  })

  const remove = useMutation({
    mutationFn: (id: number) => shopApi.remove(id),
    onSuccess: (data) => queryClient.setQueryData(['cart'], data),
  })

  const checkout = useMutation({
    mutationFn: () => shopApi.checkout({
      contact_name: name.trim(),
      contact_phone: phone.trim(),
      address: address.trim(),
      note: note.trim() || undefined,
      gateway,
    }),
    onSuccess: (res) => {
      // The gateway owns the next screen. Nothing here is "paid" until it
      // sends the customer back and the server verifies.
      window.location.href = res.redirect_url
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : 'ثبت سفارش انجام نشد')
    },
  })

  if (!user) {
    return (
      <Shell>
        <div className="rounded-3xl border border-border bg-muted/30 px-6 py-16 text-center">
          <ShoppingCart className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold">برای دیدن سبد خرید وارد شوید</p>
          <Button asChild className="mt-4">
            <Link to="/login?next=/cart">ورود</Link>
          </Button>
        </div>
      </Shell>
    )
  }

  if (cart.isPending) {
    return <Shell><div className="grid place-items-center py-24"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div></Shell>
  }

  const items = cart.data?.items ?? []
  const total = cart.data?.total_toman ?? 0

  if (items.length === 0) {
    return (
      <Shell>
        <div className="rounded-3xl border border-border bg-muted/30 px-6 py-16 text-center">
          <ShoppingCart className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold">سبد خرید خالی است</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/shop">رفتن به فروشگاه</Link>
          </Button>
        </div>
      </Shell>
    )
  }

  const invalid = name.trim().length < 2
    || phone.replace(/\D/g, '').length < 8
    || address.trim().length < 10

  return (
    <Shell>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* ── items ───────────────────────────────────────────── */}
        <section aria-label="اقلام سبد">
          <ul className="space-y-3">
            {items.map((it) => (
              <li key={it.id}
                  className="flex gap-3 rounded-2xl border border-border bg-card p-3">
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-bold">{it.name}</p>
                  <p className="mt-1 text-sm font-extrabold text-primary">
                    {faPrice(it.unit_price)}
                  </p>
                  {it.price_changed && (
                    <p className="mt-1 text-[11px] font-semibold text-destructive">
                      قیمت از {faPrice(it.price_when_added)} تغییر کرده است
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-1 rounded-xl border border-border">
                    <Button
                      type="button" size="icon" variant="ghost" className="size-8"
                      aria-label="کم کردن"
                      disabled={it.qty <= 1 || setQty.isPending}
                      onClick={() => setQty.mutate({ id: it.id, qty: it.qty - 1 })}
                    >
                      <Minus className="size-3.5" />
                    </Button>
                    <span className="min-w-6 text-center text-sm font-bold">{it.qty}</span>
                    <Button
                      type="button" size="icon" variant="ghost" className="size-8"
                      aria-label="زیاد کردن"
                      disabled={it.qty >= 20 || setQty.isPending}
                      onClick={() => setQty.mutate({ id: it.id, qty: it.qty + 1 })}
                    >
                      <Plus className="size-3.5" />
                    </Button>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove.mutate(it.id)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-3" />
                    حذف
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* ── checkout ────────────────────────────────────────── */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold text-muted-foreground">جمع</span>
              <span className="text-xl font-extrabold text-primary">{faPrice(total)}</span>
            </div>
          </div>

          <form
            className="space-y-3 rounded-2xl border border-border bg-card p-4"
            onSubmit={(e) => {
              e.preventDefault()
              setError(null)
              if (!invalid) checkout.mutate()
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="c-name">نام و نام خانوادگی</Label>
              <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)}
                     autoComplete="name" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-phone">شماره تماس</Label>
              <Input id="c-phone" value={phone} onChange={(e) => setPhone(e.target.value)}
                     inputMode="numeric" dir="ltr" autoComplete="tel" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-addr">نشانی</Label>
              <textarea
                id="c-addr" value={address} onChange={(e) => setAddress(e.target.value)}
                rows={3} required
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-note">یادداشت (اختیاری)</Label>
              <Input id="c-note" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>

            <fieldset className="space-y-2 pt-2">
              <legend className="text-sm font-bold">درگاه پرداخت</legend>
              {([
                ['zibal', 'زیبال'],
                ['zarinpal', 'زرین‌پال'],
              ] as const).map(([value, label]) => (
                <label key={value}
                       className="flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm">
                  <input
                    type="radio" name="gateway" value={value}
                    checked={gateway === value}
                    onChange={() => setGateway(value)}
                  />
                  {label}
                </label>
              ))}
            </fieldset>

            {error && (
              <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full gap-2"
                    disabled={invalid || checkout.isPending}>
              {checkout.isPending
                ? <Loader2 className="size-4 animate-spin" />
                : <CreditCard className="size-4" />}
              پرداخت و ثبت سفارش
            </Button>

            <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
              پرداخت در صفحهٔ درگاه انجام می‌شود. سفارش فقط پس از تأیید
              سرور ثبت می‌شود.
            </p>
          </form>
        </aside>
      </div>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 pt-28 sm:px-6">
      <h1 className="mb-6 text-2xl font-extrabold tracking-tight">سبد خرید</h1>
      {children}
    </div>
  )
}
