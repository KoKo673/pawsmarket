import { MapPin, PawPrint, ShieldCheck, Sparkles } from 'lucide-react'

import { QuickFilters } from '@/components/home/QuickFilters'
import { SearchBar } from '@/components/home/SearchBar'
import { useQuery } from '@tanstack/react-query'

import { useNearbyListings } from '@/hooks/use-listings'
import { shopApi } from '@/lib/shop-api'
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

  // The shop's own stock, from the endpoint that owns it. `useNearbyListings`
  // deliberately returns no products — that list is other shops' scraped
  // inventory — so counting it here would either be zero or a lie.
  const { data: shop } = useQuery({
    queryKey: ['hero-product-count'],
    queryFn: () => shopApi.products('', 1),
    staleTime: 5 * 60_000,
  })
  const productCount = shop?.total ?? 0

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
        /* `items-stretch`, not `items-center`. Centring each column left the
           text block floating: measured at 1440, the image column ran to
           ~820px while the copy ended near 740, so the right side finished
           80px early and the eye fell into the gap below the trust row.
           Stretching makes both columns the same height, and the copy's own
           `justify-center` then distributes the slack above and below
           instead of dumping all of it at the bottom. */
        className="mx-auto grid max-w-7xl items-stretch gap-14 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]"
      >
        {/* ── ستون متن ──
            min-w-0: grid itemها نباید min-content (جمع عرض پیل‌های
            اسکرول‌بار) را به ستون grid تحمیل کنند — وگرنه در موبایل
            ستون از viewport عریض‌تر می‌شود و محتوا به‌خاطر overflow-hidden
            والد بریده و غیرقابل‌اسکرول می‌شد (باگ گزارش‌شده). */}
        <div className="flex min-w-0 flex-col justify-center text-center lg:text-start">
          <span
            data-motion-item
            /* paw-800, not primary and not paw-700: --primary measured
               2.79:1 here and paw-700 only reached 4.22:1, because this chip
               sits on the hero's peach wash (#fbeae1) rather than a neutral
               card — the same shade that passes elsewhere falls short on the
               tint. paw-800 gives 5.82:1 on the wash and 4.43:1 against its
               own border. */
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-paw-800 dark:text-paw-300"
          >
            <Sparkles className="size-3.5" />
            فروشگاه، خدمات دامپزشکی و سرپرستی — یک‌جا
          </span>

          <h1
            data-motion-item
            className="mt-6 text-balance text-4xl font-extrabold leading-[1.25] tracking-tight sm:text-5xl lg:text-6xl"
          >
            پلتفرم اختصاصی حیوانات خانگی{' '}
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

          {/* ردیف اعتماد.
              foreground/80, not muted-foreground: this row sits on the hero's
              peach wash (#fceae1), not on a neutral card, and the muted tone
              measures 3.98:1 there — under AA. The tint is warm enough to eat
              the contrast that the same grey clears everywhere else. */}
          <ul
            data-motion-item
            className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-foreground/80 lg:justify-start"
          >
            {/*
              «موارد ثبت‌شده» removed.

              It counted `realListings` — every row the nearby query
              returned — and with pets and scraped products both at zero,
              that number was *only* service centres. So the hero said
              «۲۲۱ مورد ثبت‌شده در محدوده» next to a second line saying
              «۷۳ مرکز», and a visitor would read the first as products or
              animals that do not exist.

              Two true numbers beat one vague one: how many centres are
              nearby, and how many products the shop actually sells.
            */}
            <li className="inline-flex items-center gap-1.5">
              <MapPin className="size-4 text-primary" />
              {realStores > 0
                ? `${faDigits(realStores)} مرکز در محدوده`
                : 'مراکز فعال در تهران'}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-accent" />
              {productCount > 0
                ? `${faDigits(productCount)} کالا برای فروش`
                : 'فروشگاه در حال آماده‌سازی'}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <PawPrint className="size-4 text-tide-500" /> فهرست‌شده بر اساس فاصله
            </li>
          </ul>
        </div>

        {/* ── کلاج تصاویر ──
            یک گرید، نه یک کلاج شناور.

            What was here: three `absolute`-positioned photos with percentage
            widths inside a fixed aspect-ratio box, plus a floating glass chip.
            It only held together at the width it was designed at. Measured on
            production at 1024px, the cat card (w-52%, bottom-14, right-0) sat
            on top of the retriever's face *and* the running dog's paws — the
            percentages were of a box that was narrower than they assumed, so
            the two lower cards pulled inward and collided with the portrait
            behind them. At 1440 the same code looked fine, which is why it
            survived review.

            Percentages inside an absolutely-positioned parent cannot be made
            safe for every width, because the layout has no knowledge of where
            the photos actually are. So this is a plain CSS grid now: every
            cell is laid out by the grid, nothing overlaps at any width, and
            the only thing that changes with the breakpoint is how many columns
            there are. Images use `aspect-[…]` + `object-cover` so each keeps a
            stable shape while the grid decides its size.

            `object-top` on the two animal portraits keeps ears and eyes in
            frame; a centred crop of a full-body photo cuts the head off, which
            is the "چهره معلوم نیست" complaint. */}
        <div
          data-motion-item
          className="order-first mx-auto w-full max-w-md sm:max-w-none lg:order-none"
        >
          {/*
            The stat chip is now part of the grid rather than floated over a
            photo. It was the thing most likely to land on a face, and it reads
            better as a caption than as an overlay.
          */}
          {/*
            The stat chip is a sibling of the photo, not an overlay on it.
            As an absolute overlay it landed on the retriever's muzzle at
            1024px — the same class of bug as the collage it replaced, just
            smaller. In the flow it cannot cover anything at any width.
          */}
          <div className="mb-2.5 flex items-center gap-2.5 rounded-2xl border border-border/60 bg-card px-3 py-2 shadow-soft">
            <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent">
              <PawPrint className="size-4" />
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-xs font-extrabold">
                {realStores > 0
                  ? `${faDigits(realStores)} فروشگاه واقعی تهران`
                  : 'فروشگاه‌های واقعی تهران'}
              </p>
              <p className="truncate text-[10px] font-medium text-muted-foreground">
                داده‌ی زنده از نقشه‌ی شهر
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {/*
              The wide cell is 16:10 (ratio 1.60), so it needs a landscape
              photograph. dog-golden is 511×820 — ratio 0.62, a portrait —
              and `object-cover` inside a 1.60 box therefore kept only ~39%
              of its height. With `object-top` that 39% was the top of the
              frame: the dog's head and nothing else, which is exactly what
              «فقط کله به بالاش معلومه» described. The photo was never the
              problem; the frame never matched it.

              dog-shiba is 820×547, ratio 1.50, warm and face-on — within
              7% of the cell's shape, so cover crops almost nothing.
            */}
            <div className="col-span-2 overflow-hidden rounded-[1.75rem] shadow-lifted">
              <img
                src={asset('images/listings/dog-shiba.jpg')}
                alt="سگ با زبان بیرون، در نور غروب"
                className="aspect-[16/10] w-full object-cover object-center"
              />
            </div>

            {/*
              cat-look, not cat-orange. The orange cat photo is shot against a
              saturated blue backdrop (measured average RGB 61,117,148 — a
              warmth of -87, the only cold image in the set). Dropped into the
              hero's peach/amber wash it read as a foreign element, and in the
              old collage it was the card whose edges cut across the dog. This
              one is warm (+22) and tonally continuous with the dogs.
            */}
            <div className="overflow-hidden rounded-3xl border-2 border-card shadow-lifted">
              <img
                src={asset('images/listings/cat-look.jpg')}
                alt="گربه‌ی نشسته روی پله"
                className="aspect-square w-full object-cover object-top"
              />
            </div>
            <div className="overflow-hidden rounded-3xl border-2 border-card shadow-lifted">
              <img
                src={asset('images/listings/dog-run.jpg')}
                alt="سگ در حال دویدن در پارک"
                className="aspect-square w-full object-cover object-center"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
