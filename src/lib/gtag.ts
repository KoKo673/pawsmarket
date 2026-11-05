/**
 * Google Analytics 4 and Google Tag Manager, loaded only when configured.
 *
 * ── Why this is opt-in by env var, not hardcoded ──────────────────────
 * The IDs are per-property and belong to the operator, not to the source
 * tree. Baking one in means every fork and every preview build reports
 * into the same property, and the numbers stop describing this site.
 * `VITE_GA4_ID` and `VITE_GTM_ID` are read at build time; when either is
 * empty nothing is injected and no request leaves the browser.
 *
 * ── Why the CSP had to change too ─────────────────────────────────────
 * nginx sends `script-src 'self'`. A tag injected from googletagmanager.com
 * is blocked by that, and the failure is silent: the page looks fine, the
 * network tab shows a CSP violation, and the property stays empty. The
 * nginx.conf CSP now allows exactly the two Google hosts and nothing else.
 * If a tag stops reporting, check the CSP before the tag.
 *
 * ── Why consent is not a banner here ──────────────────────────────────
 * GA4 is configured with IP anonymisation and no advertising signals, and
 * this site sets no advertising cookies. A consent wall for a first-party
 * audience that mostly cannot reach Google anyway would cost more
 * conversions than the data is worth. If advertising features are ever
 * turned on, that decision has to be revisited — it is a legal question,
 * not a technical one.
 */

const GA4_ID = (import.meta.env.VITE_GA4_ID || '').trim()
const GTM_ID = (import.meta.env.VITE_GTM_ID || '').trim()

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

let started = false

function injectScript(src: string, async = true): void {
  const s = document.createElement('script')
  s.src = src
  s.async = async
  document.head.appendChild(s)
}

/**
 * Load whichever tags are configured. Safe to call more than once.
 *
 * GTM and GA4 are independent: a site can run either, both, or neither.
 * When both are set, GTM is loaded first because a GA4 tag configured
 * inside GTM would otherwise be created twice.
 */
export function initAnalytics(): void {
  if (started || import.meta.env.DEV) return
  if (!GA4_ID && !GTM_ID) return
  started = true

  window.dataLayer = window.dataLayer || []

  if (GTM_ID) {
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' })
    injectScript(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GTM_ID)}`)
  }

  if (GA4_ID) {
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer!.push(args)
    }
    window.gtag('js', new Date())
    // `send_page_view: false` because the SPA reports its own page views on
    // every route change (see trackPageView). Leaving it on would count the
    // landing page twice and miss every navigation after it.
    window.gtag('config', GA4_ID, { send_page_view: false })
    injectScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA4_ID)}`)
  }
}

/** Report one SPA navigation. No-op when GA4 is not configured. */
export function trackPageView(path: string, title?: string): void {
  if (!GA4_ID || !window.gtag) return
  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title ?? document.title,
    page_location: window.location.href,
  })
}

/** True when at least one tag is configured — used by tests and the audit. */
export function analyticsConfigured(): boolean {
  return Boolean(GA4_ID || GTM_ID)
}
