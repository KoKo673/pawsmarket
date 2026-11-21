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
 *
 * ── Consent Mode, added 2026-11-21 ────────────────────────────────────
 * The paragraph above described the *intent*; the code did not implement
 * it. `gtag('config', …)` alone sets cookies, so `/privacy` — which says
 * we set no tracking cookie and therefore need no banner — was a false
 * statement. Google's docs are explicit that its tags "set and read
 * cookies to identify unique users".
 *
 * initAnalytics() now sends `consent default` with analytics_storage,
 * ad_storage, ad_user_data and ad_personalization all 'denied' before the
 * first config call. Analytics runs cookieless: events still arrive, no
 * client identifier is stored on the device, and the sentence on /privacy
 * becomes true instead of the page being softened to match the code.
 */

// Read defensively: Vite always provides `import.meta.env`, but this module
// is also imported by the test runner, which does not. A bare
// `import.meta.env.VITE_GA4_ID` throws there and takes the whole test file
// with it — the failure looks like a broken test, not a missing shim.
const ENV = ((import.meta as unknown as { env?: Record<string, string> }).env) ?? {}
const GA4_ID = (ENV.VITE_GA4_ID || '').trim()
const GTM_ID = (ENV.VITE_GTM_ID || '').trim()

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

let started = false

/**
 * One console line per reason, ever. This fires in the browser, and an
 * operator opening the console should see why a configured tag is not
 * running — once, not on every route change.
 */
function logOnce(key: string, message: string): void {
  const w = window as unknown as { __pawsLogged?: Set<string> }
  w.__pawsLogged ??= new Set()
  if (w.__pawsLogged.has(key)) return
  w.__pawsLogged.add(key)
  console.info(`[analytics] ${message}`)
}

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
  if (started || ENV.DEV) return
  if (!GA4_ID && !GTM_ID) return
  started = true

  window.dataLayer = window.dataLayer || []

  // ── GTM is NOT loaded, and that is deliberate ─────────────────────
  //
  // It used to load here, first, before the consent default existed. Two
  // measured consequences (2026-11-21):
  //
  //   1. gtm.js runs whatever container is configured server-side, and this
  //      site's container is not under review by this code — a tag added in
  //      the GTM UI changes what the site does without a commit.
  //   2. It writes to storage on its own schedule, and that schedule is
  //      not governed by the GA4 `config` call below.
  //
  // /privacy states that no tracking cookie is set. A tag written by
  // someone else in a web UI, that can change between two page loads, is
  // impossible to keep that promise about. GA4 direct (below) can be.
  //
  // If GTM is genuinely needed later, its container has to be configured
  // with the same consent settings AND this comment has to be revisited —
  // turning VITE_GTM_ID back on is not enough.
  if (GTM_ID) {
    logOnce(
      'gtm-skipped',
      `GTM (${GTM_ID.slice(0, 8)}…) is configured but not loaded: it would ` +
      'run container tags off-repo and break the no-cookie promise on /privacy.',
    )
  }

  if (GA4_ID) {
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer!.push(args)
    }
    // ── Consent Mode v2, analytics-only, cookies off ──────────────────
    //
    // This site's privacy page says, in so many words, that it sets no
    // tracking cookie and sets no cookie banner. Google's own documentation
    // (developers.google.com/analytics/…/cookies-user-id) says its tags
    // "set and read cookies to identify unique users across browsing
    // sessions" — so without the two calls below, that page is false.
    //
    // The fix is to make the page true rather than to weaken the page:
    //   analytics_storage: 'denied' → GA4 runs cookieless. Google still
    //     receives the event, but no client identifier is stored on the
    //     device, which is what the sentence on /privacy describes.
    //   ad_storage / ad_user_data / ad_personalization: 'denied' → no
    //     advertising signals at all. We do not run ads.
    //
    // `wait_for_update` is deliberately absent: there is no banner to wait
    // for, and a timeout here would only delay the first page_view.
    //
    // ── Order, measured the hard way (2026-11-21) ────────────────────
    // This must be the FIRST call, before `js` and before `config`. An
    // earlier version sent `gtag('js', new Date())` first, and gtag.js then
    // wrote a real client id:
    //
    //     document.cookie → _ga=GA1.1.66179524.1795292278
    //
    // with `analytics_storage: 'denied'` and `client_storage: 'none'` both
    // present in the dataLayer. The settings were right; the order was not.
    // A minimal page that sends ONLY `consent default` before the tag loads
    // sets no cookie at all — that is the control that identified this.
    //
    // `js` therefore comes after consent, not before it.
    window.gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
    })

    window.gtag('js', new Date())

    // `send_page_view: false` because the SPA reports its own page views on
    // every route change (see trackPageView). Leaving it on would count the
    // landing page twice and miss every navigation after it.
    window.gtag('config', GA4_ID, {
      send_page_view: false,
      client_storage: 'none',
      // GA4's own IP anonymisation. On by default in recent properties, but
      // stated here so a property created with an older default cannot make
      // /privacy wrong again.
      anonymize_ip: true,
    })
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

// ── Conversion events ─────────────────────────────────────────────────
//
// Before this, the only thing reported anywhere was `page_view`. A shop can
// count visits all day and still not answer "how many people put something
// in a cart and then left", which is the question that says where money is
// being lost. These are the three GA4 recommends as the minimum purchase
// funnel:
//
//   add_to_cart     → product card and product page
//   begin_checkout  → the moment the order is submitted, before the
//                     gateway takes over
//   purchase        → ONLY after the server has verified the payment
//
// ── Why `purchase` is not fired from the gateway's query string ───────
// The gateway sends the buyer back with `Status=OK`, and that is a claim
// made by the browser. `OrderResultPage` posts the authority to the
// callback endpoint and shows what the *server* answers. Reporting
// `purchase` from the query string would let anyone typing the URL
// register a sale, and would inflate revenue with every cancelled payment
// that merely looked successful.
//
// ── What is deliberately not sent ─────────────────────────────────────
// No name, phone, address or email. GA4 needs `transaction_id` and `value`
// to attribute revenue; it does not need the customer. PII in an analytics
// property is a data-protection problem — and on a site whose privacy page
// says we do not send it, also a false statement.

export interface AnalyticsItem {
  item_id: string
  item_name: string
  price: number
  quantity: number
}

function toItem(line: {
  product_id: number; name: string; qty: number; unit_price: number
}): AnalyticsItem {
  return {
    item_id: String(line.product_id),
    item_name: line.name,
    price: line.unit_price,
    quantity: line.qty,
  }
}

function send(event: string, params: Record<string, unknown>): void {
  sendWith(Boolean(GA4_ID), window.gtag, event, params)
}

/**
 * The gate and the dispatch, with both dependencies passed in.
 *
 * Split out from `send` so the payload shape and the "do not report when
 * unconfigured" rule can be tested without a browser, a build, or a
 * configured property. An analytics event has no return value and no UI,
 * so a test is the only thing that can tell a working funnel from one that
 * silently reports nothing.
 */
export function sendWith(
  configured: boolean,
  gtag: ((...args: unknown[]) => void) | undefined,
  event: string,
  params: Record<string, unknown>,
): void {
  if (!configured || !gtag) return
  gtag('event', event, params)
}

/** The payload for one `add_to_cart`, without sending it. */
export function addToCartPayload(
  product: { id: number; name: string; price_toman: number }, qty = 1,
): Record<string, unknown> {
  return {
    currency: 'IRR',
    // GA4 multiplies price × quantity for the item; `value` is the line
    // total and must not also be multiplied downstream.
    value: product.price_toman * qty,
    items: [{
      item_id: String(product.id),
      item_name: product.name,
      price: product.price_toman,
      quantity: qty,
    }],
  }
}

export function trackAddToCart(
  product: { id: number; name: string; price_toman: number }, qty = 1,
): void {
  send('add_to_cart', addToCartPayload(product, qty))
}

/** The payload for `begin_checkout`: every line, and the cart's own total. */
export function beginCheckoutPayload(cart: {
  items: Array<{ product_id: number; name: string; qty: number; unit_price: number }>
  total_toman: number
}): Record<string, unknown> {
  return {
    currency: 'IRR',
    value: cart.total_toman,
    items: cart.items.map(toItem),
  }
}

export function trackBeginCheckout(cart: {
  items: Array<{ product_id: number; name: string; qty: number; unit_price: number }>
  total_toman: number
}): void {
  send('begin_checkout', beginCheckoutPayload(cart))
}

/**
 * The payload for `purchase`. `transaction_id` is not optional and is not
 * derived: GA4 uses it to deduplicate, and a buyer who refreshes the
 * result page would otherwise book the same sale twice.
 */
export function purchasePayload(
  transactionId: string,
  order: {
    total_toman: number
    items: Array<{ name: string; qty: number; unit_price: number }>
  },
): Record<string, unknown> {
  return {
    transaction_id: transactionId,
    currency: 'IRR',
    value: order.total_toman,
    // Order lines carry no product_id (see OrderDetail on the backend), so
    // the name is the only stable identifier available here. Inventing an
    // id would correlate unrelated products in GA4's item report.
    items: order.items.map((l) => ({
      item_id: l.name,
      item_name: l.name,
      price: l.unit_price,
      quantity: l.qty,
    })),
  }
}

export function trackPurchase(
  transactionId: string,
  order: {
    total_toman: number
    items: Array<{ name: string; qty: number; unit_price: number }>
  },
): void {
  send('purchase', purchasePayload(transactionId, order))
}
