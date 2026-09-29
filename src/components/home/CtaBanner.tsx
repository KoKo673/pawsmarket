import { ArrowLeft, PawPrint, Store } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'

/**
 * بنر تبدیل — گرادیانت نارنجی پاز به فیروزه‌ای با پاهای متحرک پس‌زمینه.
 * مالکان را به فرم چندمرحله‌ای ثبت آگهی هدایت می‌کند.
 */
export function CtaBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-paw-500 to-tide-600 px-6 py-14 text-center shadow-lifted sm:px-14">
        {/* Paw watermark */}
        <PawPrint aria-hidden className="absolute -right-10 -top-10 size-52 rotate-12 text-white/10" />
        <PawPrint aria-hidden className="absolute -bottom-14 -left-8 size-44 -rotate-12 text-white/10" />

        <div className="relative mx-auto max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-bold text-white backdrop-blur">
            <Store className="size-3.5" />
            برای مالکان، پرورش‌دهندگان و فروشگاه‌های محلی
          </span>
          <h2 className="mt-5 text-balance text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            حیوان خانگی، محصول یا فروشگاهی برای معرفی دارید؟
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-balance text-sm leading-relaxed text-white/85 sm:text-base">
            روی نقشه یک نقطه بگذارید، عکس‌ها را بارگذاری کنید و به همه‌ی دوستداران حیوانات داخل شعاعتان دیده
            شوید — در کمتر از دو دقیقه.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 h-12 gap-2 rounded-full bg-white px-8 text-primary shadow-lifted hover:bg-white/90"
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
