import { motion } from 'framer-motion'
import { Heart, LogIn, MapPin, Menu, Newspaper, PawPrint, Plus, User, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'

import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { Button } from '@/components/ui/button'
import { faDigits } from '@/lib/fa'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import { useFavoritesStore } from '@/store/favorites.store'
import { useFiltersStore } from '@/store/filters.store'
import { useUiStore } from '@/store/ui.store'

const NAV_LINKS = [
  { to: '/', label: 'خانه' },
  { to: '/explore', label: 'کاوش روی نقشه' },
  { to: '/pets', label: 'حیوانات' },
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
  const navigate = useNavigate()
  const filterDrawerOpen = useUiStore((s) => s.filterDrawerOpen)
  const favCount = useFavoritesStore((s) => s.ids.length)
  const setFavoritesOnly = useFiltersStore((s) => s.setFavoritesOnly)
  const authStatus = useAuthStore((s) => s.status)
  const authUser = useAuthStore((s) => s.user)

  /** قلب نوار ناوبری: رفتن به کاوش با فیلتر «فقط ذخیره‌شده‌ها» */
  const openFavorites = () => {
    setFavoritesOnly(true)
    navigate('/explore')
  }

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
          {/* فید لحظه‌ها (فقط برای کاربر وارد‌شده) */}
          {authStatus === 'authed' && (
            <Button asChild variant="ghost" size="icon" className="hidden md:inline-flex" aria-label="فید لحظه‌ها">
              <Link to="/feed">
                <Newspaper className="size-4" />
              </Link>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="relative hidden md:inline-flex"
            aria-label={`آگهی‌های ذخیره‌شده${favCount > 0 ? ` (${faDigits(favCount)} مورد)` : ''}`}
            onClick={openFavorites}
          >
            <Heart className={cn('size-4', favCount > 0 && 'fill-current text-primary')} />
            {favCount > 0 && (
              <span className="absolute -left-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-extrabold leading-4 text-primary-foreground shadow-glow">
                {favCount > 9 ? '۹+' : faDigits(favCount)}
              </span>
            )}
          </Button>

          {/* حساب کاربری */}
          {authStatus === 'authed' ? (
            <Button asChild variant="ghost" size="icon" aria-label="حساب من" className="hidden md:inline-flex">
              <Link to="/me">
                {authUser?.avatar_url ? (
                  <img src={authUser.avatar_url} alt="" className="size-6 rounded-full object-cover" />
                ) : (
                  <User className="size-4" />
                )}
              </Link>
            </Button>
          ) : authStatus === 'anon' ? (
            <Button asChild variant="outline" size="sm" className="hidden md:inline-flex gap-1.5">
              <Link to="/login">
                <LogIn className="size-4" />
                ورود
              </Link>
            </Button>
          ) : null}

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
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false)
                openFavorites()
              }}
              className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-left text-sm font-semibold text-foreground transition-colors hover:bg-muted/60"
            >
              <Heart className={cn('size-4 text-primary', favCount > 0 && 'fill-current')} />
              آگهی‌های ذخیره‌شده
              {favCount > 0 && (
                <span className="ms-auto rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                  {faDigits(favCount)}
                </span>
              )}
            </button>

            {authStatus === 'authed' && (
              <Link
                to="/feed"
                className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted/60"
              >
                <Newspaper className="size-4 text-accent" />
                لحظه‌ها (فید)
              </Link>
            )}

            <Link
              to="/explore"
              className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted/60"
            >
              <MapPin className="size-4 text-accent" />
              آگهی‌های اطراف
            </Link>

            {authStatus === 'authed' ? (
              <Link
                to="/me"
                className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted/60"
              >
                <User className="size-4 text-tide-500" />
                حساب من
              </Link>
            ) : authStatus === 'anon' ? (
              <Link
                to="/login"
                className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted/60"
              >
                <LogIn className="size-4 text-primary" />
                ورود / ثبت‌نام
              </Link>
            ) : null}
          </div>
        </motion.div>
      )}
    </header>
  )
}
