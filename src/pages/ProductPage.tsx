import { ArrowRight, Loader2, Package, ShoppingCart, Store, Truck } from 'lucide-react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { RatingStars } from '@/components/shop/RatingStars'
import { Button } from '@/components/ui/button'
import { faDigits, faPrice } from '@/lib/fa'
import { shopApi } from '@/lib/shop-api'
import { useAuthStore } from '@/store/auth.store'

/**
 * صفحهٔ یک محصول.
 *
 * Shows name, price and a single honest shipping note. No sourcing or
 * supplier details are shown to the customer. Competitor prices stay in
 * the database — publishing them would hand the margin to anyone
 * scraping the page.
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

          {/* Social proof, from the source's own rating.
              Rendered only when a rating exists — `RatingStars` returns
              null for null, because «۰.۰» would say "rated badly" about
              a product nobody rated. Measured: 319 of 801 have one. */}
          {(p.rating !== null || (p.shop_count ?? 0) > 1) && (
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              <RatingStars rating={p.rating} count={p.rating_count} size="md" />
              {(p.shop_count ?? 0) > 1 && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Store className="size-3.5" aria-hidden="true" />
                  این کالا در {faDigits(p.shop_count!)} فروشگاه عرضه می‌شود
                </span>
              )}
            </div>
          )}

          <p className="mt-4 text-3xl font-extrabold text-primary">
            {faPrice(p.price_toman)}
          </p>

          {!p.available && (
            <p className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive-text">
              این محصول در حال حاضر موجود نیست
            </p>
          )}

          {error && (
            <p role="alert" className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive-text">
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
            {/* A <dl> may only contain <dt>, <dd>, <div> or <script>
                directly. The <dt> sat inside a nested div, so axe counted
                it as having no <dl> parent - 4 dlitems and the list itself.
                The icon moves into the <dt> so the structure is legal and
                the description still reads as one row.
                No source/sourcing text here: naming the supplier to the
                customer is neither required nor desirable. */}
            <div className="flex items-start gap-2">
              <dt className="flex items-center gap-2 font-bold">
                <Truck className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                ارسال
              </dt>
              <dd className="flex-1 text-muted-foreground">
                حداقل ۲ تا ۳ روز کاری پس از ثبت سفارش؛ وضعیت در
                «سفارش‌های من» به‌روز می‌شود.
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* ── محصولات مشابه ───────────────────────────────────────────
          The pattern every large storefront has and this page lacked:
          "if this is not the one, what else is there". It sits BELOW the
          buy area so it never competes with the decision, and it renders
          NOTHING when the list is empty — a strip of unrelated products
          is what makes a shop look amateur.

          `similar` comes from `product_key`, the only real relationship
          this catalogue has: same item, different source. Not from a
          name similarity, which would put an unrelated «سگ» product next
          to this one because the word appears in both. */}
      {p.similar.length > 0 && (
        <section className="mt-12" aria-labelledby="similar-heading">
          <h2 id="similar-heading" className="text-lg font-extrabold">
            محصولات مشابه
          </h2>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {p.similar.map((s) => (
              <li key={s.id}>
                <Link
                  to={`/shop/${s.id}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-lifted"
                >
                  <span className="block aspect-square overflow-hidden bg-muted/40">
                    {s.image ? (
                      <img
                        src={s.image}
                        alt=""
                        loading="lazy"
                        className="size-full object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <span className="grid size-full place-items-center text-[11px] text-muted-foreground">
                        بدون تصویر
                      </span>
                    )}
                  </span>
                  <span className="flex flex-1 flex-col p-3">
                    <span className="line-clamp-2 text-xs font-bold leading-snug">
                      {s.name}
                    </span>
                    <span className="mt-auto pt-2 text-sm font-extrabold text-primary">
                      {faPrice(s.price_toman)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
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
