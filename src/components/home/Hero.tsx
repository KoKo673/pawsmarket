import { motion } from 'framer-motion'
import { MapPin, PawPrint, ShieldCheck, Sparkles } from 'lucide-react'

import { QuickFilters } from '@/components/home/QuickFilters'
import { SearchBar } from '@/components/home/SearchBar'
import { asset } from '@/lib/utils'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } },
}

/** پَنج (پا) شناور تزئینی در پس‌زمینه */
function FloatingPaw({ className, delay = 0 }: { className: string; delay?: number }) {
  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.12, y: [0, -16, 0] }}
      transition={{ opacity: { duration: 1 }, y: { duration: 7, repeat: Infinity, delay, ease: 'easeInOut' } }}
      className={className}
    >
      <PawPrint className="size-full" />
    </motion.div>
  )
}

/**
 * قلبه‌ی صفحه — سربرگ تمام‌عرض زیر نوار شیشه‌ای:
 * لکه‌های رنگی ملایم، پاهای شناور، تیتر با تأکید نارنجی، نوار جستجو
 * و ردیف فیلترهای سریع.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-32 sm:pt-40">
      {/* Ambient gradient blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/4 size-[34rem] rounded-full bg-paw-300/30 blur-3xl dark:bg-paw-700/20" />
        <div className="absolute right-0 top-40 size-[28rem] rounded-full bg-tide-200/40 blur-3xl dark:bg-tide-800/20" />
        <div className="absolute bottom-0 left-0 size-[22rem] rounded-full bg-paw-200/40 blur-3xl dark:bg-paw-900/20" />
      </div>

      {/* Floating paws */}
      <FloatingPaw className="absolute left-[8%] top-28 size-10 text-primary" delay={0.5} />
      <FloatingPaw className="absolute right-[12%] top-24 size-14 text-tide-500" delay={1.6} />
      <FloatingPaw className="absolute bottom-24 left-[22%] size-8 text-paw-500" delay={2.4} />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]"
      >
        {/* ── ستون متن ── */}
        <div className="text-center lg:text-start">
          <motion.span
            variants={item}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary"
          >
            <Sparkles className="size-3.5" />
            فاصله‌ی لحظه‌ای · جستجوی مکانی روی نقشه
          </motion.span>

          <motion.h1
            variants={item}
            className="mt-6 text-balance text-4xl font-extrabold leading-[1.25] tracking-tight sm:text-5xl lg:text-6xl"
          >
            هر حیوان، هر محصول، هر فروشگاه —{' '}
            <em className="font-display font-black not-italic text-primary">روی نقشه‌ی محله‌ات</em>
          </motion.h1>

          <motion.p
            variants={item}
            className="mx-auto mt-5 max-w-xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0"
          >
            حیوانات در انتظار سرپرستی، دامپزشکان، آرایشگاه‌ها و لوازم مورد نیاز را در همان حوالی پیدا کنید — با
            شعاع دلخواه و فاصله‌ی واقعی.
          </motion.p>

          <motion.div variants={item} className="mt-8 flex flex-col items-center gap-4 lg:items-start">
            <SearchBar />
            <QuickFilters />
          </motion.div>

          {/* ردیف اعتماد */}
          <motion.ul
            variants={item}
            className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-muted-foreground lg:justify-start"
          >
            <li className="inline-flex items-center gap-1.5">
              <MapPin className="size-4 text-primary" /> هزاران آگهی فعال
            </li>
            <li className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-accent" /> فروشگاه‌های معتبر محلی
            </li>
            <li className="inline-flex items-center gap-1.5">
              <PawPrint className="size-4 text-tide-500" /> ۱۸۰+ مرکز سرپرستی
            </li>
          </motion.ul>
        </div>

        {/* ── کلاج تصاویر (دسکتاپ) ── */}
        <motion.div
          variants={item}
          className="relative mx-auto hidden aspect-[4/4.4] w-full max-w-md lg:block"
        >
          <motion.img
            src={asset('images/listings/dog-golden.jpg')}
            alt="توله‌ی گلدن رتریور"
            className="absolute inset-x-6 top-0 aspect-[4/5] w-[85%] rounded-[2.5rem] object-cover shadow-lifted"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.img
            src={asset('images/listings/cat-orange.jpg')}
            alt="گربه‌ی نارنجی"
            className="absolute bottom-14 right-0 aspect-square w-[52%] rounded-[2rem] border-4 border-card object-cover shadow-lifted"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          />
          <motion.img
            src={asset('images/listings/store2.jpg')}
            alt="سگ روی تشک راحتی"
            className="absolute bottom-0 left-0 aspect-[4/3] w-[55%] rounded-3xl border-4 border-card object-cover shadow-lifted"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          />

          {/* چیپ شیشه‌ای شناور روی کلاج */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
            transition={{
              opacity: { delay: 1, duration: 0.5 },
              scale: { delay: 1, duration: 0.5, type: 'spring' },
              y: { duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 },
            }}
            className="glass absolute right-4 top-10 flex items-center gap-2.5 rounded-2xl px-4 py-3"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-accent/15 text-accent">
              <PawPrint className="size-5" />
            </span>
            <div className="text-start leading-tight">
              <p className="text-sm font-extrabold">۱۲ حیوان تا ۲ کیلومتری</p>
              <p className="text-xs text-muted-foreground">به‌روزرسانی زنده در اطراف شما</p>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  )
}
