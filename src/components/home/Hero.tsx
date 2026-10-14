import { MapPin, PawPrint, ShieldCheck, Sparkles } from 'lucide-react'

import { QuickFilters } from '@/components/home/QuickFilters'
import { SearchBar } from '@/components/home/SearchBar'
import { useNearbyListings } from '@/hooks/use-listings'
import { faDigits } from '@/lib/fa'
import { asset } from '@/lib/utils'

/** پَنج (پا) شناور تزئینی — حرکت پیوسته‌ی تزئینی است (خارج از قرارداد ورود) */
function FloatingPaw({ className }: { className: string }) {
  return (
    <div aria-hidden className={`animate-float ${className}`} style={{ animationDuration: '7s' }}>
      <PawPrint className="size-full" />
    </div>
  )
}

/**
 * قلبه‌ی صفحه — سربرگ تمام‌عرض زیر نوار شیشه‌ای:
 * لکه‌های رنگی ملایم، پاهای شناور، تیتر با تأکید نارنجی، نوار جستجو
 * و ردیف فیلترهای سریع.
 */
export function Hero() {
  // آمار واقعی از همان کوئری زنده (کش React Query مشترک — بدون درخواست اضافه)
  const { data } = useNearbyListings()
  const realStores = (data ?? []).filter((l) => l.kind === 'store').length
  const realListings = (data ?? []).length

  return (
    <section className="relative overflow-hidden pb-20 pt-32 sm:pt-40">
      {/* Ambient gradient blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/4 size-[34rem] rounded-full bg-paw-300/30 blur-3xl dark:bg-paw-700/20" />
        <div className="absolute right-0 top-40 size-[28rem] rounded-full bg-tide-200/40 blur-3xl dark:bg-tide-800/20" />
        <div className="absolute bottom-0 left-0 size-[22rem] rounded-full bg-paw-200/40 blur-3xl dark:bg-paw-900/20" />
      </div>

      {/* Floating paws */}
      <FloatingPaw className="absolute left-[8%] top-28 size-10 text-primary" />
      <FloatingPaw className="absolute right-[12%] top-24 size-14 text-tide-500" />
      <FloatingPaw className="absolute bottom-24 left-[22%] size-8 text-paw-500" />

      {/* محتوای هیرو — یک «بخش گروهی» با پله‌بندی ۳۳ms طبق قرارداد مشترک */}
      <div
        data-motion-section="group"
        className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]"
      >
        {/* ── ستون متن ──
            min-w-0: grid itemها نباید min-content (جمع عرض پیل‌های
            اسکرول‌بار) را به ستون grid تحمیل کنند — وگرنه در موبایل
            ستون از viewport عریض‌تر می‌شود و محتوا به‌خاطر overflow-hidden
            والد بریده و غیرقابل‌اسکرول می‌شد (باگ گزارش‌شده). */}
        <div className="min-w-0 text-center lg:text-start">
          <span
            data-motion-item
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary"
          >
            <Sparkles className="size-3.5" />
            فروشگاه، خدمات دامپزشکی و سرپرستی — یک‌جا
          </span>

          <h1
            data-motion-item
            className="mt-6 text-balance text-4xl font-extrabold leading-[1.25] tracking-tight sm:text-5xl lg:text-6xl"
          >
            بازار تخصصی حیوانات خانگی{' '}
            <em className="font-display font-black not-italic text-primary">در محدوده‌ی شما</em>
          </h1>

          <p
            data-motion-item
            className="mx-auto mt-5 max-w-xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0"
          >
            کالا و خوراک، کلینیک و آرایشگاه، و حیوانات در انتظار سرپرستی —
            همراه با قیمت، فاصله و امتیاز هر مرکز، در یک نقشه.
          </p>

          <div data-motion-item className="mt-8 flex w-full min-w-0 flex-col items-center gap-4 lg:items-start">
            <SearchBar />
            <QuickFilters />
          </div>

          {/* ردیف اعتماد */}
          <ul
            data-motion-item
            className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-muted-foreground lg:justify-start"
          >
            <li className="inline-flex items-center gap-1.5">
              <MapPin className="size-4 text-primary" />
              {realListings > 0
                ? `${faDigits(realListings)} مورد ثبت‌شده در محدوده`
                : 'اقلام ثبت‌شده در تهران'}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-accent" />
              {realStores > 0
                ? `${faDigits(realStores)} مرکز و فروشگاه فعال`
                : 'فروشگاه‌ها و مراکز فعال'}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <PawPrint className="size-4 text-tide-500" /> فهرست‌شده بر اساس فاصله
            </li>
          </ul>
        </div>

        {/* ── کلاج تصاویر ──
            Two different layouts, not one scaled down.

            The absolute-positioned collage only works at a fixed aspect ratio.
            On a 390px phone every image is a percentage of a much narrower box,
            so the 4/5 portrait grew taller than its container and the cat and
            the running dog landed on top of the retriever's face — a mobile
            screenshot showed three photos overlapping into a smear. Below sm
            this is a plain 2×2 grid (the dog spanning the full width), which
            cannot overlap at any width; the collage is kept from sm up, where
            the container is wide enough for the percentages to hold. */}
        <div
          data-motion-item
          className="order-first mx-auto w-full max-w-xs sm:hidden"
        >
          <div className="grid grid-cols-2 gap-2.5">
            <img
              src={asset('images/listings/dog-golden.jpg')}
              alt="توله‌ی گلدن رتریور"
              className="col-span-2 aspect-[16/11] w-full rounded-[1.75rem] object-cover object-top shadow-lifted"
            />
            <img
              src={asset('images/listings/cat-orange.jpg')}
              alt="گربه‌ی نارنجی"
              className="aspect-square w-full rounded-3xl border-2 border-card object-cover shadow-lifted"
            />
            <img
              src={asset('images/listings/dog-run.jpg')}
              alt="سگ در حال دویدن در پارک"
              className="aspect-square w-full rounded-3xl border-2 border-card object-cover object-top shadow-lifted"
            />
          </div>
          <div className="glass mt-2.5 flex items-center justify-center gap-2.5 rounded-2xl px-4 py-2.5">
            <span className="grid size-8 place-items-center rounded-xl bg-accent/15 text-accent">
              <PawPrint className="size-4" />
            </span>
            <p className="text-sm font-extrabold">
              {realStores > 0
                ? `${faDigits(realStores)} فروشگاه واقعی تهران`
                : 'فروشگاه‌های واقعی تهران'}
            </p>
          </div>
        </div>

        {/* کلاج شناور — از sm به بالا که ظرف به‌قدر کافی عریض است */}
        <div
          data-motion-item
          className="relative hidden aspect-[4/4.4] w-full max-w-md motion-reduce:animate-none sm:block sm:max-w-md lg:order-none"
        >
          <img
            src={asset('images/listings/dog-golden.jpg')}
            alt="توله‌ی گلدن رتریور"
            /* object-top keeps the head in frame; the default centre crop cut
               the face off, which is what "چهره‌ی سگ معلوم نیست" referred to. */
            className="absolute inset-x-6 top-0 aspect-[4/5] w-[85%] rounded-[2.5rem] object-cover object-top shadow-lifted sm:animate-float"
            style={{ animationDuration: '6s' }}
          />
          <img
            src={asset('images/listings/cat-orange.jpg')}
            alt="گربه‌ی نارنجی"
            className="absolute bottom-14 right-0 aspect-square w-[52%] rounded-[2rem] border-4 border-card object-cover shadow-lifted sm:animate-float"
            style={{ animationDuration: '7s', animationDelay: '-1s' }}
          />
          <img
            src={asset('images/listings/dog-run.jpg')}
            alt="سگ در حال دویدن در پارک"
            className="absolute bottom-0 left-0 aspect-[4/3] w-[55%] rounded-3xl border-4 border-card object-cover object-top shadow-lifted sm:animate-float"
            style={{ animationDuration: '5.5s', animationDelay: '-0.5s' }}
          />

          {/* چیپ شیشه‌ای شناور روی کلاج */}
          <div className="glass absolute right-4 top-10 sm:animate-float flex items-center gap-2.5 rounded-2xl px-4 py-3" style={{ animationDuration: '5s' }}>
            <span className="grid size-9 place-items-center rounded-xl bg-accent/15 text-accent">
              <PawPrint className="size-5" />
            </span>
            <div className="text-start leading-tight">
              <p className="text-sm font-extrabold">
                {realStores > 0 ? `${faDigits(realStores)} فروشگاه واقعی تهران` : 'فروشگاه‌های واقعی تهران'}
              </p>
              <p className="text-xs text-muted-foreground">داده‌ی زنده از نقشه‌ی شهر</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
