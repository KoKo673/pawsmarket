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
    ],
  },
]

export function Footer() {
  return (
    <footer data-motion-section className="mt-auto border-t border-border bg-card/50">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_repeat(2,1fr)]">
        {/* Brand column */}
        <div data-motion-item className="max-w-xs">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <PawPrint className="size-5" />
            </span>
            <span className="text-lg font-extrabold tracking-tight">
              پاز<span className="text-primary">مارکت</span>
            </span>
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            بازار مکان‌محور حیوانات خانگی — حیوانات، لوازم و فروشگاه‌ها را در همان حوالی خانه‌تان پیدا کنید.
          </p>
        </div>

        {FOOTER_LINKS.map((col) => (
          <div key={col.title}>
            <h4 className="text-sm font-bold">{col.title}</h4>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
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
        © {new Date().getFullYear()} پازمارکت · ساخته‌شده برای حیوانات و آدم‌هایی که ازشان حسابی جا می‌زنند.
      </div>
    </footer>
  )
}
