import { ArrowRight, Loader2, Package, ShoppingCart, Truck } from 'lucide-react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { faPrice } from '@/lib/fa'
import { shopApi } from '@/lib/shop-api'
import { useAuthStore } from '@/store/auth.store'

/**
 * صفحهٔ یک محصول.
 *
 * Says one honest thing that the card cannot: where it comes from. We buy
 * the cheapest offer from a partner and ship it ourselves, so the product
 * page names the source rather than implying we hold stock. A customer
 * who knows that is not surprised by a delivery that takes a day longer.
 *
 * Deliberately shows no competitor prices. `cost_price` and the margin
 * live in the database for reports, not for the shop window — publishing
 * them would hand our margin to anyone scraping the page.
 */
export function ProductPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [busy, setBusy] = useState(false)
  const [added, setAdded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const product = useQuery({
    queryKey: ['shop-product', id],
    queryFn: () => shopApi.product(id!),
    enabled: !!id,
    retry: false,
  })

  async function add() {
    if (!product.data) return
    if (!user) { navigate('/login?next=/shop/' + id); return }
    setBusy(true); setError(null)
    try {
      await shopApi.addToCart(product.data.id, 1)
      setAdded(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'افزودن انجام نشد')
    } finally {
      setBusy(false)
    }
  }

  if (product.isPending) {
    return (
      <Centered>
        <Loader2 className="mx-auto size-6 animate-spin text-muted-foreground" />
      </Centered>
    )
  }

  if (product.isError || !product.data) {
    return (
      <Centered>
        <Package className="mx-auto size-8 text-muted-foreground" />
        <h1 className="mt-3 text-xl font-extrabold">این محصول پیدا نشد</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          ممکن است حذف شده باشد یا نشانی درست نباشد.
        </p>
        <Button asChild variant="outline" className="mt-5">
          <Link to="/shop">بازگشت به فروشگاه</Link>
        </Button>
      </Centered>
    )
  }

  const p = product.data

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-28 sm:px-6">
      <Link
        to="/shop"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary"
      >
        <ArrowRight className="size-4" />
        فروشگاه
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        {/* The image keeps an empty alt on purpose: the H1 below already
            names the product, and repeating it here would make a screen
            reader say the name twice. */}
        <div className="overflow-hidden rounded-3xl border border-border bg-muted/30">
          {p.image ? (
            <img src={p.image} alt="" className="aspect-square size-full object-contain" />
          ) : (
            <div className="grid aspect-square place-items-center text-sm text-muted-foreground">
              بدون تصویر
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <h1 className="text-2xl font-extrabold leading-snug">{p.name}</h1>

          <p className="mt-4 text-3xl font-extrabold text-primary">
            {faPrice(p.price_toman)}
          </p>

          {!p.available && (
            <p className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">
              این محصول در حال حاضر موجود نیست
            </p>
          )}

          {error && (
            <p role="alert" className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">
              {error}
            </p>
          )}

          <div className="mt-6 space-y-2">
            {added ? (
              <Button asChild size="lg" className="w-full gap-2">
                <Link to="/cart">
                  <ShoppingCart className="size-4" />
                  رفتن به سبد خرید
                </Link>
              </Button>
            ) : (
              <Button
                onClick={() => void add()}
                disabled={busy || !p.available}
                size="lg"
                className="w-full gap-2"
              >
                {busy ? <Loader2 className="size-4 animate-spin" />
                  : <ShoppingCart className="size-4" />}
                {user ? 'افزودن به سبد خرید' : 'برای خرید وارد شوید'}
              </Button>
            )}
          </div>

          <dl className="mt-6 space-y-3 rounded-2xl border border-border bg-card p-4 text-sm">
            <div className="flex items-start gap-2">
              <Truck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div>
                <dt className="font-bold">ارسال</dt>
                <dd className="text-muted-foreground">
                  سفارش را ما تأمین و ارسال می‌کنیم؛ پس از ثبت، وضعیت در
                  «سفارش‌های من» به‌روز می‌شود.
                </dd>
              </div>
            </div>
            {p.source && (
              <div className="flex items-start gap-2">
                <Package className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <dt className="font-bold">تأمین</dt>
                  <dd className="text-muted-foreground">
                    از {p.source} — قیمت روزانه به‌روز می‌شود.
                  </dd>
                </div>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-lg px-4 pb-24 pt-28 sm:px-6">
      <div className="glass rounded-3xl p-8 text-center shadow-lifted">{children}</div>
    </div>
  )
}
