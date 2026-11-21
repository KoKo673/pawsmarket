/**
 * One title per route, set in one place.
 *
 * ── The measured problem ──────────────────────────────────────────────
 * 2026-11-21: 31 of the app's 33 pages never set `document.title`. Every
 * tab, every bookmark, every link pasted into a chat and every
 * `page_title` sent to GA4 said «پازمارکت — حیوانات و لوازم نزدیک شما» —
 * the home page's title — whatever page the visitor was actually on:
 *
 *     /shop/2237      → «پازمارکت — حیوانات و لوازم نزدیک شما»
 *     /orders/58      → «پازمارکت — حیوانات و لوازم نزدیک شما»
 *     /terms          → «پازمارکت — حیوانات و لوازم نزدیک شما»
 *
 * Two pages did set their own (PrivacyPages and TermsPage), each with its
 * own `useEffect`, which is why they were the only two that worked.
 *
 * ── Why a table here, and not an effect in every page ─────────────────
 * Thirty-one copies of `useEffect(() => { document.title = ... })` is
 * thirty-one chances to forget the cleanup, and it splits one decision
 * across the whole tree. A table is one place to read what any route is
 * called — which is also what a sitemap or a marketing person needs.
 *
 * ── What it deliberately does not do ──────────────────────────────────
 * It does not invent a title for a detail page from an id. `/shop/2237`
 * gets «فروشگاه» rather than «محصول ۲۲۳۷»: a title naming a number is
 * worse than a category, and the pages that *can* name their subject
 * (a product, a store, a pet) still set their own once their data loads —
 * see the note on precedence below.
 */
const SITE = 'پازمارکت'

/** Exact routes. Longer paths win over shorter prefixes. */
const EXACT: Record<string, string> = {
  '/': 'حیوانات و لوازم نزدیک شما',
  '/explore': 'کاوش روی نقشه',
  '/shop': 'فروشگاه',
  '/pets': 'حیوانات',
  '/adoption': 'سرپرستی حیوانات',
  '/bookings': 'نوبت‌ها',
  '/cart': 'سبد خرید',
  '/orders': 'سفارش‌های من',
  '/me': 'حساب من',
  '/feed': 'فید',
  '/add': 'ثبت آگهی',
  '/support': 'پشتیبانی',
  '/for-business': 'مرکز شما در پازمارکت',
  '/privacy': 'حریم خصوصی',
  '/terms': 'قوانین و شرایط',
  '/login': 'ورود',
  '/register': 'ثبت‌نام',
  '/forgot': 'بازیابی رمز',
  '/set-password': 'تعیین رمز',
  '/welcome': 'خوش آمدید',
}

/** Prefix routes: the first segment names the page family. */
const PREFIX: Array<[string, string]> = [
  ['/shop/', 'محصول'],
  ['/store/', 'مرکز خدماتی'],
  ['/pet/', 'حیوان'],
  ['/orders/', 'سفارش'],
  ['/booking/', 'نوبت'],
  ['/pets/', 'حیوان'],
  ['/support/', 'تیکت'],
]

/**
 * The title for a path. `null` when nothing matches, so the caller can
 * leave the shell's title alone rather than setting a wrong one.
 */
export function titleForPath(pathname: string): string | null {
  // Trailing slash is not a different page.
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname

  const exact = EXACT[p]
  if (exact) return `${exact} — ${SITE}`

  for (const [prefix, name] of PREFIX) {
    if (p.startsWith(prefix)) return `${name} — ${SITE}`
  }
  return null
}