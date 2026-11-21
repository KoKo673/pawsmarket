/**
 * Conversion events: the payload shapes GA4 wants, and the gate that keeps
 * them silent when no property is configured.
 *
 * ── Why these are worth testing at all ────────────────────────────────
 * An analytics event is the most silent thing in a codebase: no return
 * value, no visible UI, and when it is wrong the only symptom is a number
 * in a dashboard that is slightly off — which nobody notices until a
 * decision has already been made on it. The two failures that matter:
 *
 *   1. An event fires when it should not — a failed add-to-cart counted as
 *      a conversion — and the funnel says people convert more than they do.
 *   2. An event never fires, and the funnel is empty forever while the
 *      site looks perfectly healthy.
 *
 * ── How this is tested ────────────────────────────────────────────────
 * The payload builders and the send gate are exported as pure functions,
 * so the assertions below do not need a browser, a configured property, or
 * a module re-import. That is deliberate: this module reads `GA4_ID` once
 * at load, and a test that depends on re-evaluating it is testing Node's
 * module cache as much as the code.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  addToCartPayload,
  beginCheckoutPayload,
  purchasePayload,
  sendWith,
} from './gtag.ts'

// ── the gate ─────────────────────────────────────────────────────────
test('with no property configured, not one event is sent', () => {
  const calls: unknown[][] = []
  const gtag = (...args: unknown[]) => { calls.push(args) }

  sendWith(false, gtag, 'purchase', { value: 1 })
  sendWith(false, undefined, 'purchase', { value: 1 })

  assert.equal(calls.length, 0, 'a preview build must not report anywhere')
})

test('a configured property receives exactly one call per event', () => {
  const calls: unknown[][] = []
  const gtag = (...args: unknown[]) => { calls.push(args) }

  sendWith(true, gtag, 'add_to_cart', { value: 1 })

  assert.equal(calls.length, 1)
  assert.deepEqual(calls[0].slice(0, 2), ['event', 'add_to_cart'])
})

// ── add_to_cart ──────────────────────────────────────────────────────
test('add_to_cart carries id, name, unit price and quantity', () => {
  const p = addToCartPayload(
    { id: 42, name: 'خاک بستر گربه', price_toman: 720874 }, 2)

  // GA4 multiplies price × quantity itself; `value` is the line total.
  assert.equal(p.value, 720874 * 2)
  const items = p.items as Array<Record<string, unknown>>
  assert.equal(items.length, 1)
  assert.equal(items[0].item_id, '42')
  assert.equal(items[0].item_name, 'خاک بستر گربه')
  assert.equal(items[0].price, 720874)
  assert.equal(items[0].quantity, 2)
})

test('add_to_cart defaults to a quantity of one', () => {
  const p = addToCartPayload({ id: 1, name: 'x', price_toman: 500 })
  assert.equal(p.value, 500)
  assert.equal((p.items as Array<Record<string, unknown>>)[0].quantity, 1)
})

// ── begin_checkout ───────────────────────────────────────────────────
test('begin_checkout reports every line, not just the first', () => {
  const p = beginCheckoutPayload({
    items: [
      { product_id: 1, name: 'a', qty: 1, unit_price: 100 },
      { product_id: 2, name: 'b', qty: 3, unit_price: 200 },
    ],
    total_toman: 700,
  })

  assert.equal(p.value, 700)
  const items = p.items as Array<Record<string, unknown>>
  assert.equal(items.length, 2)
  assert.equal(items[1].item_id, '2')
  assert.equal(items[1].quantity, 3)
})

// ── purchase ─────────────────────────────────────────────────────────
test('purchase always carries a transaction_id', () => {
  const p = purchasePayload('987', {
    total_toman: 5000,
    items: [{ name: 'x', qty: 1, unit_price: 5000 }],
  })

  // Without this GA4 cannot deduplicate, and a buyer who refreshes the
  // result page books the same sale twice.
  assert.equal(p.transaction_id, '987')
  assert.equal(p.value, 5000)
  assert.equal((p.items as unknown[]).length, 1)
})

// ── privacy ──────────────────────────────────────────────────────────
test('no customer identity is ever in a payload', () => {
  const blob = JSON.stringify([
    addToCartPayload({ id: 1, name: 'p', price_toman: 1 }),
    purchasePayload('1', {
      total_toman: 1,
      items: [{ name: 'p', qty: 1, unit_price: 1 }],
    }),
  ])
  for (const forbidden of ['phone', 'address', 'email', 'contact_name', '0912']) {
    assert.ok(!blob.includes(forbidden), `analytics payload leaked ${forbidden}`)
  }
})

// ── consent ──────────────────────────────────────────────────────────
test('the consent default denies storage, and does so before config', async () => {
  // This is the mechanism, not a cosmetic detail: gtag applies a `consent
  // default` only to tags loaded AFTER it. Emitting it after `config` leaves
  // cookies on, while /privacy says there are none.
  //
  // Read from the source rather than by running initAnalytics(), which
  // needs a DOM and a configured property. The order is the claim.
  const { readFileSync } = await import('node:fs')
  const src = readFileSync(new URL('./gtag.ts', import.meta.url), 'utf8')

  // Match the CALL, at the start of a line with only indentation before it.
  // A plain indexOf found the word inside a comment that says
  // "tag loaded after it" ... "config" and reported the wrong order.
  const consentAt = src.search(/^\s*window\.gtag\('consent', 'default'/m)
  const configAt = src.search(/^\s*window\.gtag\('config'/m)
  const jsAt = src.search(/^\s*window\.gtag\('js'/m)

  assert.ok(consentAt !== -1, 'no consent default is ever sent')
  assert.ok(configAt !== -1, 'no config call found')
  assert.ok(jsAt !== -1, 'no gtag js call found')

  // Consent must come before BOTH. Measured 2026-11-21: with `js` first,
  // gtag.js wrote a real client id (GA1.1.66179524.…) even though
  // analytics_storage was denied and client_storage was 'none'. Both
  // settings were present in the dataLayer; only the order was wrong.
  assert.ok(consentAt < jsAt, 'consent must be set before gtag js')
  assert.ok(consentAt < configAt, 'consent must be set before config')

  // And GTM must not be loaded at all: it runs container tags from a web
  // UI, which no cookie promise in the code can cover.
  assert.ok(
    !/injectScript\(`https:\/\/www\.googletagmanager\.com\/gtm\.js/.test(src),
    'gtm.js is being injected, which makes /privacy unenforceable',
  )

  // The whole consent call, from its start to the closing `})`. Slicing a
// fixed 400 characters cut off before analytics_storage, so the window is
// taken from the call itself rather than guessed.
  const callEnd = src.indexOf('})', consentAt)
  const block = src.slice(consentAt, callEnd)

  for (const key of ['ad_storage', 'ad_user_data', 'ad_personalization', 'analytics_storage']) {
    assert.ok(block.includes(key), `consent default does not set ${key}`)
    // Tabs and spaces both appear depending on the formatter, so this
    // collapses whitespace before looking for the denied value rather than
    // betting on one regex that survives one formatter.
    const flat = block.replace(/\s+/g, ' ')
    assert.ok(
      flat.includes(`${key}: 'denied'`) || flat.includes(`${key}:'denied'`),
      `${key} is not denied`,
    )
  }
})
