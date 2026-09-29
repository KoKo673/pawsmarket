import { motion } from 'framer-motion'
import { Heart, MapPin, Menu, PawPrint, Plus, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'

import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/store/ui.store'

const NAV_LINKS = [
  { to: '/', label: 'خانه' },
  { to: '/explore', label: 'کاوش روی نقشه' },
]

/**
 * نوار ناوبری چسبان با افکت شیشه‌ی مات (frosted glass).
 * بعد از اسکرول کمی سایه و خط جداکننده می‌گیرد؛ در موبایل لینک‌ها
 * به یک برگه‌ی شیشه‌یی زیر دکمه‌ی منو جمع می‌شوند.
 */
export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = useLocation()
  const filterDrawerOpen = useUiStore((s) => s.filterDrawerOpen)

  // Close the mobile sheet on navigation
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname.pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-nav transition-all duration-300',
        scrolled || mobileOpen ? 'glass shadow-glass' : 'border-b border-transparent bg-transparent',
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Brand */}
        <Link to="/" className="group flex items-center gap-2.5" aria-label="پازمارکت — صفحه‌ی اصلی">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-glow transition-transform duration-300 group-hover:rotate-12 group-hover:scale-105">
            <PawPrint className="size-5" />
          </span>
          <span className="text-lg font-extrabold tracking-tight">
            پاز<span className="text-primary">مارکت</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                cn(
                  'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                  isActive ? 'bg-muted text-foreground shadow-soft' : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" className="hidden md:inline-flex" aria-label="آگهی‌های ذخیره‌شده">
            <Heart className="size-4" />
          </Button>
          <ThemeToggle />
          <Button asChild size="sm" className="hidden md:inline-flex gap-1.5">
            <Link to="/add">
              <Plus className="size-4" />
              ثبت آگهی
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={mobileOpen ? 'بستن منو' : 'باز کردن منو'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen || filterDrawerOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </nav>

      {/* Mobile sheet */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="glass mx-4 mb-3 rounded-2xl p-3 shadow-lifted md:hidden"
        >
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold transition-colors',
                    isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted/60',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
            <Link
              to="/add"
              className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted/60"
            >
              <Plus className="size-4 text-primary" />
              ثبت آگهی
            </Link>
            <Link
              to="/explore"
              className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted/60"
            >
              <MapPin className="size-4 text-accent" />
              آگهی‌های اطراف
            </Link>
          </div>
        </motion.div>
      )}
    </header>
  )
}
