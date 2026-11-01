import { ArrowLeft, PawPrint, Store } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'

/**
 * بنر تبدیل — گرادیانت نارنجی پاز به فیروزه‌ای با پاهای متحرک پس‌زمینه.
 * مالکان را به فرم چندمرحله‌ای ثبت آگهی هدایت می‌کند.
 */
export function CtaBanner() {
  return (
    <section data-motion-section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
      {/* ── The gradient's stops are chosen for white text ──────────────
          Everything in this banner is white, and `via-paw-500` is
          rgb(250,104,30): measured 2.97:1 against white, below the 4.5
          minimum. `to-tide-600` was 3.33:1 — also below.

          The old contrast audit called these three nodes "unresolved,
          gradient behind the text" and skipped them, so the banner has never
          appeared in a failing count. Checked by hand against every stop:
          paw-700 is 4.94:1 and tide-700 4.69:1, both pass, and the banner
          still runs orange to teal. The button's own paw-700 comment below
          was already the same measurement for the same reason. */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-paw-700 to-tide-700 px-6 py-14 text-center shadow-lifted sm:px-14">
        {/* Paw watermark */}
        <PawPrint aria-hidden className="absolute -right-10 -top-10 size-52 rotate-12 text-white/10" />
        <PawPrint aria-hidden className="absolute -bottom-14 -left-8 size-44 -rotate-12 text-white/10" />

        <div data-motion-item className="relative mx-auto max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-bold text-white backdrop-blur">
            <Store className="size-3.5" />
            برای مالکان، پرورش‌دهندگان و فروشگاه‌های محلی
          </span>
          <h2 className="mt-5 text-balance text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            فروشگاه، پرورش‌دهنده یا مالک هستید؟
          </h2>
          {/* Full white, not white/85. The 15% that faded it took the
              paragraph to 3.84:1 on the teal end — below 4.5 — while the
              heading beside it passed. Measured against every stop: white is
              4.69 at worst, white/95 is already 4.40 and fails. There is no
              opacity in between that both passes and reads as secondary, so
              the hierarchy here comes from size and weight instead. */}
          <p className="mx-auto mt-4 max-w-lg text-balance text-sm leading-relaxed text-white sm:text-base">
            روی نقشه نقطه بگذارید، عکس‌ها را بارگذاری کنید و در فهرست پازمارکت ثبت شوید؛ کمتر از دو دقیقه.
          </p>
          {/* The button is white and sits on the orange end of the gradient,
              so orange text on it measured 1.19 — the worst pair in the app,
              and the one call to action the banner exists for. paw-700 on the
              same white is 4.94 and still reads as brand. */}
          <Button
            asChild
            size="lg"
            className="mt-8 h-12 gap-2 rounded-full bg-white px-8 text-paw-700 shadow-lifted hover:bg-white/90"
          >
            <Link to="/add">
              <ArrowLeft className="size-4" />
              ثبت آگهی رایگان
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
