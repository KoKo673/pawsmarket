import { motion } from 'framer-motion'
import { Heart, Home, LogIn, MapPin, Menu, Newspaper, PawPrint, Plus, ShieldCheck, ShoppingCart, User, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'

import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { Button } from '@/components/ui/button'
import { faDigits } from '@/lib/fa'
import { mediaUrl } from '@/lib/social-api'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import { useFavoritesStore } from '@/store/favorites.store'
import { useFiltersStore } from '@/store/filters.store'
import { useUiStore } from '@/store/ui.store'

const NAV_LINKS = [
  { to: '/', label: 'خانه' },
  // The shop is second on purpose: it is the half of the business where we
  // sell our own stock, and it was reachable only by typing the URL until
  // this line existed.
  { to: '/shop', label: 'فروشگاه' },
  { to: '/explore', label: 'کاوش روی نقشه' },
  { to: '/pets', label: 'حیوانات' },
  { to: '/adoption', label: 'سرپرستی' },
  { to: '/bookings', label: 'نوبت‌ها' },
]

/**
 * نوار ناوبری چسبان با افکت شیشه‌ی مات (frosted glass).
 * بعد از اسکرول کمی سایه و خط جداکننده می‌گیرد؛ در موبایل لینک‌ها
 * به یک برگه‌ی شیشه‌یی زیر دکمه‌ی منو جمع می‌شوند.
 */
export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
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

  // The mobile sheet closes on navigation because App remounts this navbar
  // with a per-route `key` — resetting it here instead would be a
  // setState-in-effect.

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
      {/*
        The nav must survive every width between the mobile menu (below md)
        and a comfortably wide desktop. Measured on production: at 768–900px
        the desktop link group has no shrink strategy, `justify-between`
        lets it push the action cluster out of the viewport, and «ثبت آگهی»
        lands at x = -176 — entirely off-screen, not merely clipped. The
        earlier `nowrap` on the links did nothing about it because the
        overflow was the flex container's, not the text's.

        Three things fix it together, and each is load-bearing:
          · `min-w-0` on the link group so it may shrink below its
            min-content width instead of forcing the row wider
          · `shrink-0` on brand and actions so only the links give way
          · tighter link padding and a higher breakpoint for the long
            «کاوش روی نقشه» label, which is what makes the group wide
      */}
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        {/* Brand */}
        <Link to="/" className="group flex shrink-0 items-center gap-2.5" aria-label="پازمارکت — صفحه‌ی اصلی">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-glow transition-transform duration-300 group-hover:rotate-12 group-hover:scale-105">
            <PawPrint className="size-5" />
          </span>
          <span className="text-lg font-extrabold tracking-tight">
            {/* --primary is a 50%-lightness orange meant for fills; as 18px
                text on the light card it measures 3.13:1, short of the 4.5
                the word needs at that size. paw-700 is the same hue two
                steps darker (4.74:1); the dark theme keeps --primary, which
                already passes there at 6.05:1. */}
            پاز<span className="text-paw-700 dark:text-primary">مارکت</span>
          </span>
        </Link>

        {/* Desktop links.
            `min-w-0` lets this group shrink rather than push the actions
            out; `overflow-hidden` clips a link that still does not fit
            instead of letting it slide under the buttons. Padding steps
            down at md and back up at lg, because 6 links at px-4 need
            ~560px and at 768 there is only ~420px to give. */}
        <div className="hidden min-w-0 items-center gap-0.5 overflow-hidden md:flex lg:gap-1">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              /* `whitespace-nowrap` is what the report asked for, and it is
                 needed even now: without it «کاوش روی نقشه» breaks at its
                 spaces and the row grows to two lines of text. */
              className={({ isActive }) =>
                cn(
                  'whitespace-nowrap rounded-full px-2.5 py-2 text-sm font-semibold transition-colors lg:px-4',
                  isActive ? 'bg-muted text-foreground shadow-soft' : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* Actions.
            `shrink-0`: these are the controls a visitor needs, so they keep
            their size and the link group gives way instead. Every child that
            is not a primary action is hidden below lg — at 768 there is room
            for either four icon buttons or the six links, not both, and a
            clipped «ثبت آگهی» was the reported symptom. */}
        <div className="flex shrink-0 items-center gap-1.5">
          {/* فید لحظه‌ها (فقط برای کاربر وارد‌شده) */}
          {authStatus === 'authed' && (
            <Button asChild variant="ghost" size="icon" className="hidden lg:inline-flex" aria-label="فید لحظه‌ها">
              <Link to="/feed">
                <Newspaper className="size-4" />
              </Link>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="relative hidden lg:inline-flex"
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

          {/* سبد خرید — بدون این، محصولی که «افزودن به سبد» می‌خورد
              جایی برای دیده‌شدن نداشت. */}
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="relative hidden lg:inline-flex"
          >
            <Link to="/cart" aria-label="سبد خرید">
              <ShoppingCart className="size-4" />
            </Link>
          </Button>

          {/* حساب کاربری */}
          {authStatus === 'authed' ? (
            <Button asChild variant="ghost" size="icon" aria-label="حساب من" className="hidden lg:inline-flex">
              <Link to="/me">
                {authUser?.avatar_url ? (
                  <img src={mediaUrl(authUser.avatar_url)} alt="" className="size-6 rounded-full object-cover" />
                ) : (
                  <User className="size-4" />
                )}
              </Link>
            </Button>
          ) : authStatus === 'anon' ? (
            <Button asChild variant="outline" size="sm" className="hidden lg:inline-flex gap-1.5">
              <Link to="/login">
                <LogIn className="size-4" />
                ورود
              </Link>
            </Button>
          ) : null}

          {/*
            Only rendered when the server said this account is an admin.
            A non-admin never sees the word «مدیریت» here, which is the
            same rule the API follows by answering 404 rather than 403.
          */}
          {authStatus === 'authed' && authUser?.is_admin && (
            <Button asChild variant="outline" size="sm" className="hidden lg:inline-flex gap-1.5">
              <Link to="/admin">
                <ShieldCheck className="size-4" />
                مدیریت
              </Link>
            </Button>
          )}

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
            <Link
              to="/adoption"
              className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted/60"
            >
              <Home className="size-4 text-primary" />
              سرپرستی
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
