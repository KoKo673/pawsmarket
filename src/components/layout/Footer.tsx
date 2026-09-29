import { AtSign, Globe, MessageCircle, PawPrint } from 'lucide-react'
import { Link } from 'react-router-dom'

const FOOTER_LINKS = [
  {
    title: 'بازار',
    links: [
      { label: 'کاوش روی نقشه', to: '/explore' },
      { label: 'ثبت آگهی', to: '/add' },
      { label: 'مراکز سرپرستی', to: '/explore' },
    ],
  },
  {
    title: 'درباره ما',
    links: [
      { label: 'معرفی پازمارکت', to: '/' },
      { label: 'فرصت‌های شغلی', to: '/' },
      { label: 'کیت مطبوعاتی', to: '/' },
    ],
  },
  {
    title: 'پشتیبانی',
    links: [
      { label: 'راهنما', to: '/' },
      { label: 'نکات ایمنی', to: '/' },
      { label: 'تماس با ما', to: '/' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-card/50">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        {/* Brand column */}
        <div className="max-w-xs">
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
          <div className="mt-5 flex gap-2">
            {[Globe, MessageCircle, AtSign].map((Icon, i) => (
              <a
                key={i}
                href="#"
                aria-label="شبکه‌های اجتماعی"
                className="grid size-9 place-items-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>
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
