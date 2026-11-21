import { PawPrint } from 'lucide-react'
import { Link } from 'react-router-dom'

/**
 * فوتر با فقط لینک‌های واقعی — هیچ مقصد ساختگی یا href="#" نیست.
 * لینک‌های دسته‌بندی از کوئری‌ست ring (?preset=…) استفاده می‌کنند تا
 * مستقیماً وارد نتایج فیلترشده شوید.
 */
const FOOTER_LINKS = [
  {
    title: 'بازار',
    links: [
      { label: 'کاوش روی نقشه', to: '/explore' },
      { label: 'ثبت آگهی رایگان', to: '/add' },
      { label: 'سرپرستی حیوانات', to: '/adoption' },
      { label: 'مراکز و پناهگاه‌ها', to: '/explore?preset=shelters' },
      { label: 'دامپزشکان نزدیک', to: '/explore?preset=vets' },
    ],
  },
  {
    title: 'دسترسی سریع',
    links: [
      { label: 'سگ‌های نزدیک', to: '/explore?preset=dogs' },
      { label: 'گربه‌ها', to: '/explore?preset=cats' },
      { label: 'غذای حیوان', to: '/explore?preset=food' },
      { label: 'آگهی‌های ذخیره‌شده', to: '/explore?favorites=1' },
      /* Support had no entry point anywhere - the one page a stuck
         customer needs was reachable only by typing the URL. */
      { label: 'پشتیبانی', to: '/support' },
      /* The clinic side had no entry point either. Without this, a business
         that found itself on the map had no way to say so, and access was
         only ever granted to clinics we already knew by name. */
      { label: 'مرکز شما در پازمارکت است؟', to: '/for-business' },
    ],
  },
  {
    title: 'قوانین',
    links: [
      /* Both of these pages existed with no inbound link anywhere on the
         site: /privacy since it was written, /terms not at all. A legal
         page nobody can reach is a page that does not exist for a customer
         who wants to read it before buying — and a checkout with no terms
         link is the thing a cautious buyer looks for and does not find. */
      { label: 'قوانین و شرایط', to: '/terms' },
      { label: 'حریم خصوصی', to: '/privacy' },
    ],
  },
]

export function Footer() {
  return (
    <footer data-motion-section className="mt-auto border-t border-border bg-card/50">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        {/* Brand column */}
        <div data-motion-item className="max-w-xs">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <PawPrint className="size-5" />
            </span>
            <span className="text-lg font-extrabold tracking-tight">
              پاز<span className="text-paw-700 dark:text-primary">مارکت</span>
            </span>
          </Link>
          {/* «و فروشگاه‌ها … پیدا کنید» removed (owner, 2026-11-19): it invited
              visitors to discover other stores. We are the only seller, so it
              advertised competitors in our own footer. */}
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            کالای حیوان خانگی، سرپرستی و خدمات دامپزشکی در همان حوالی خانه‌تان —
            از یک فروشگاه، با قیمت روز.
          </p>
        </div>

        {FOOTER_LINKS.map((col) => (
          <div key={col.title}>
            {/* A heading, not a styled div — a screen reader's heading list is
                how these columns are navigated. `h3`, not `h4`: the footer
                follows `<h1>` and `<h2>` sections, so starting at `h4` skipped
                a level and Lighthouse flagged the whole page's order. The
                class is unchanged; only the level was wrong. */}
            <h3 className="text-sm font-bold">{col.title}</h3>
            {/* ── Why the links have padding ──────────────────────────────
                Measured at 375px: each link was 22px tall. WCAG 2.5.5 and
                both mobile HIGs ask for 44px, and 22px is a link you miss
                with a thumb — the footer is where a phone user looks for
                support and the legal pages, which is exactly when they are
                least willing to aim carefully.

                The maths: `text-sm` is 14px with a 20px line box, and
                `py-[11px]` makes each row exactly 20 + 11 + 11 = 42px.
                `space-y-0.5` adds 2px between them so the 44px tap area
                (42 + the 2px gap counted on one side) still does not
                overlap the next link — overlapping targets are their own
                bug, because a tap near the boundary fires the wrong link.
                Measured after the change at 375px: 42px box, 0 overlaps. */}
            <ul className="mt-2 space-y-0.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="flex py-[11px] text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} پازمارکت · هر چیزی که حیوانتان لازم دارد، نزدیک خانه‌تان.
      </div>
    </footer>
  )
}
