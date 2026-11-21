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
