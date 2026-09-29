import { ChevronLeft, ChevronRight, Images } from 'lucide-react'
import { useState } from 'react'

import { faDigits } from '@/lib/fa'
import { cn } from '@/lib/utils'

/**
 * گالری تصاویر: صحنه‌ی بزرگ + نوار بندانگشتی.
 * کلیدهای چپ/راست حین فوکوس کار می‌کنند؛ شمارنده وضعیت را نشان می‌دهد.
 * در RTL دکمه‌ی «بعدی» سمت چپ می‌نشیند (آینه‌ی رفتار LTR).
 */
export function ImageGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0)
  const count = images.length
  const go = (dir: -1 | 1) => setActive((i) => (i + dir + count) % count)

  return (
    <div className="space-y-3">
      {/* صحنه */}
      <div
        className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-muted"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') go(1) // در RTL، چپ = بعدی
          if (e.key === 'ArrowRight') go(-1)
        }}
        role="group"
        aria-roledescription="گالری تصویر"
        aria-label={alt}
      >
        <img
          key={images[active]}
          src={images[active]}
          alt={`${alt} — عکس ${faDigits(active + 1)} از ${faDigits(count)}`}
          className="size-full object-cover"
          onError={(e) => {
            e.currentTarget.style.opacity = '0.4'
          }}
        />

        {/* شمارنده */}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">
          <Images className="size-3.5" />
          {faDigits(active + 1)} / {faDigits(count)}
        </span>

        {/* دکمه‌ها (وقتی جایی برای رفتن هست) */}
        {count > 1 && (
          <>
            {/* قبلی — سمت راست در RTL */}
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="عکس قبلی"
              className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-foreground shadow-soft transition hover:scale-105 active:scale-95"
            >
              <ChevronRight className="size-5" />
            </button>
            {/* بعدی — سمت چپ در RTL */}
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="عکس بعدی"
              className="absolute left-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-foreground shadow-soft transition hover:scale-105 active:scale-95"
            >
              <ChevronLeft className="size-5" />
            </button>
          </>
        )}
      </div>

      {/* بندانگشتی‌ها */}
      {count > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`نمایش عکس ${faDigits(i + 1)}`}
              className={cn(
                'size-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all',
                i === active
                  ? 'border-primary shadow-glow'
                  : 'border-transparent opacity-60 hover:opacity-100',
              )}
            >
              <img src={src} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
