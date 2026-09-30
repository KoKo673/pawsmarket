/**
 * سیستم واحد انیمیشن ورود (طبق قرارداد entrance-motion)
 * ─────────────────────────────────────────────────────
 * · مدت: ۱۰۰ms · ایزینگ cubic-bezier(.16,1,.3,1) · فقط opacity/transform
 * · شروع هر آیتم بعدی = یک‌سوم مدت قبلی (۳۳ms) — هم‌پوشانی عمدی
 * · محتوا به‌صورت پیش‌فرض نمایان است؛ کلاس مخفی فقط با تأیید JS اعمال
 *   می‌شود (بدون JS، هیچ‌چیز پنهان نمی‌ماند)
 * · بسته‌شدن سطح‌های گذرا: ۶۶ms، «فشرده‌تر»
 * · prefers-reduced-motion: نمایان‌سازی فوری، بدون جابه‌جایی/استگر
 *
 * CSS متناظر در index.css (بخش motion) تعریف شده و کلاس‌ها همان‌جا
 * به‌صورت data-attribute فعال می‌شوند تا این ماژول فقط «زمان‌بندی» باشد.
 */

export const MOTION = {
  duration: 100,
  easing: 'cubic-bezier(.16, 1, .3, 1)',
  /** شروع آیتم بعدی = duration / 3 */
  lead: 33,
  distance: 20,
  closeDuration: 66,
  closeEasing: 'cubic-bezier(.4, 0, 1, 1)',
  closeDistance: 8,
  /** سقف زمان انتظار برای transitionend (fallback محدود) */
  fallbackMs: 400,
} as const

/** نتیجه‌ی بازگشتی راه‌انداز — برای تست‌پذیری */
export interface MotionBoot {
  enabled: boolean
  dispose: () => void
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * راه‌اندازی تدریجی:
 * ۱) ریشه با `data-motion="ready"` علامت می‌خورد (CSS فقط آن‌گاه حالات
 *    اولیه‌ی پنهان را اعمال می‌کند — بدون JS چیزی پنهان نیست).
 * ۲) هر `[data-motion-item]` با IntersectionObserver یک‌بار صف می‌شود؛
 *    ترتیب از DOM است، نه ترتیب کال‌بک‌ها.
 * ۳) آیتم‌های داخل/بالای viewport در اولین فریم با تأخیر پله‌ای ظاهر می‌شوند.
 */
export function initEntranceMotion(root: HTMLElement = document.documentElement): MotionBoot {
  if (typeof window === 'undefined') return { enabled: false, dispose: () => undefined }
  // احترام کامل به کاهش حرکت: هیچ پنهان‌سازی، هیچ صف
  if (prefersReducedMotion()) {
    return { enabled: false, dispose: () => undefined }
  }

  let disposed = false
  const revealed = new WeakSet<Element>()

  // ۱) گیت JS — از این لحظه CSS مجاز است آیتم‌ها را پنهان نگه دارد
  root.dataset.motion = 'ready'

  const reveal = (el: Element, delayIndex: number) => {
    if (disposed) return
    const item = el as HTMLElement
    // idempotent: هر آیتم دقیقاً یک‌بار نمایان می‌شود (IO یا اسکن یا event)
    if (item.dataset.motionRevealed === '1') return
    item.dataset.motionRevealed = '1'
    // تأخیر پله‌ای فقط اگر عنصر خودش تعیین نکرده باشد (کارت‌ها index خودشان را دارند)
    if (!item.style.getPropertyValue('--motion-delay')) {
      item.style.setProperty('--motion-delay', `${Math.min(delayIndex, 12) * MOTION.lead}ms`)
    }
    item.dataset.motionState = 'in'
  }

  /**
   * صف‌بندی بخش‌ها: هنگام ورود، آیتم‌های واجد شرطِ داخل بخش به ترتیب
   * DOM و پله‌ای (۳۳ms) نمایان می‌شوند. اگر بخش آیتمی نداشته باشد، خودش.
   * محتوای دیرهنگام (نتایج بعد از لود) با MutationObserver مستقیم
   * نمایان می‌شود — نه اینکه پشت بخشِ رفته‌رفته گیر کند.
   */
  const queuedSections = new WeakSet<Element>()
  const revealedSections = new WeakSet<Element>()

  const itemsOf = (section: Element): HTMLElement[] => {
    const inner = Array.from(section.querySelectorAll<HTMLElement>('[data-motion-item]'))
    return inner.length > 0 ? inner : [section as HTMLElement]
  }

  const observer = new IntersectionObserver(
    (entries) => {
      // ترتیب قطعی بر اساس موقعیت سند (نه ترتیب رسیدن کال‌بک)
      const sorted = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => {
          const rel = a.target.compareDocumentPosition(b.target)
          return rel & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
        })
      for (const entry of sorted) {
        const section = entry.target
        observer.unobserve(section) // هرگز دوباره پخش نشود
        revealedSections.add(section)
        itemsOf(section).forEach((el, i) => reveal(el, i))
        // به کامپوننت‌های داخل بخش (مثل ردیف پیل‌ها با React) خبر بده تا
        // آیتم‌هایشان که بعد از reveal مانت می‌شوند هم نمایان شوند
        section.dispatchEvent(new CustomEvent('motion:reveal', { bubbles: false }))
      }
    },
    { threshold: 0.08, rootMargin: '0px 0px -4% 0px' },
  )

  const registerSections = () => {
    const sections = document.querySelectorAll<HTMLElement>('[data-motion-section]')
    sections.forEach((s) => {
      if (queuedSections.has(s)) return
      queuedSections.add(s)
      // بخش‌های داخل viewport اولیه هم از IO عبور می‌کنند (first paint با double-rAF)
      observer.observe(s)
    })
    // محتوای تازه در بخش‌هایی که قبلاً (و در حال حاضر) در viewportاند:
    // بدون این، آیتم‌هایی که بعد از لحظه‌ی ورود mount می‌شوند نامرئی می‌ماندند.
    document.querySelectorAll<HTMLElement>('[data-motion-item]').forEach((el) => {
      if (revealed.has(el)) return
      const own = el.closest<HTMLElement>('[data-motion-section]')
      if (!own) return
      const r = own.getBoundingClientRect()
      const vh = window.innerHeight || document.documentElement.clientHeight
      const inViewport = r.height > 0 ? r.top < vh && r.bottom > 0 : r.top < vh
      if (revealedSections.has(own) || inViewport) reveal(el, 0)
    })
  }

  // اولین صف: پس از دو فریم (شروع هم‌زمان با paint، بدون پرش فونت/چیدمان)
  let raf1 = 0
  let raf2 = 0
  raf1 = requestAnimationFrame(() => {
    raf2 = requestAnimationFrame(() => {
      if (!disposed) registerSections()
    })
  })

  // محتوای پویا (نتایج جستجو، کارت‌های تازه) بدون پخش دوباره‌ی بخش‌های دیده‌شده
  const mutation = new MutationObserver(() => {
    if (!disposed) registerSections()
  })
  mutation.observe(document.body, { childList: true, subtree: true })

  // اگر ترجیح کاربر وسط نشست عوض شد، همه‌چیز فوراً نمایان شود
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  const onPref = (e: MediaQueryListEvent) => {
    if (e.matches) {
      observer.disconnect()
      mutation.disconnect()
      root.removeAttribute('data-motion')
      document.querySelectorAll<HTMLElement>('[data-motion-item]').forEach((el) => {
        el.dataset.motionState = 'in'
      })
    }
  }
  mq.addEventListener('change', onPref)

  return {
    enabled: true,
    dispose: () => {
      disposed = true
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      observer.disconnect()
      mutation.disconnect()
      mq.removeEventListener('change', onPref)
      root.removeAttribute('data-motion')
    },
  }
}
