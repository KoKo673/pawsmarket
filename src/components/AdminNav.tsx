import { BadgeCheck, ClipboardCheck, LifeBuoy, Store } from 'lucide-react'
import { NavLink } from 'react-router-dom'

/**
 * نوار کنار-بالای پنل مدیریت — تا زیرصفحه‌ها پیدا شوند.
 *
 * ── Why this is a new file ────────────────────────────────────────────
 * Measured 2026-10-31: `/admin/stores`, `/admin/support` and the new
 * `/admin/claims` had no inbound link anywhere in the app. They were
 * reachable only by typing the URL, which means the person who does not
 * already know a page exists will never find it. That is the same failure
 * shape as the feature these pages implement: complete, tested, deployed,
 * and unreachable.
 *
 * `end` on the index link so `/admin` does not stay highlighted on
 * `/admin/claims` — NavLink matches by prefix otherwise, and a nav bar with
 * two active items reads as two current pages.
 *
 * `aria-current="page"` is what NavLink sets on the active one; the styling
 * hangs off that rather than off a second state variable, so the visual
 * state and the announced state cannot disagree.
 */

const LINKS = [
  { to: '/admin', label: 'نمای کلی', icon: BadgeCheck, end: true },
  { to: '/admin/claims', label: 'درخواست‌ها', icon: ClipboardCheck, end: false },
  { to: '/admin/stores', label: 'داشبورد مراکز', icon: Store, end: false },
  { to: '/admin/support', label: 'پشتیبانی', icon: LifeBuoy, end: false },
] as const

export function AdminNav() {
  return (
    <nav aria-label="بخش‌های پنل مدیریت" className="mb-5 -mx-1">
      <ul className="flex gap-1 overflow-x-auto rounded-xl border border-border p-1">
        {LINKS.map((l) => (
          <li key={l.to} className="contents">
            <NavLink
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap
                 rounded-lg px-3 py-2 text-xs font-bold transition-colors
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                 ${isActive
                   ? 'bg-primary text-primary-foreground'
                   : 'text-muted-foreground hover:text-foreground'}`}
            >
              <l.icon className="size-3.5" aria-hidden="true" />
              {l.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
