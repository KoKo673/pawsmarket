/**
 * The one rule that, when it broke, rendered 431 of 447 stores twice.
 *
 * `REVIEW-CATALOG-DB-MISMATCH-2026-10-19` recorded the original failure: the
 * site read 761 stores from `catalog.json` while the API returned 218 from
 * the database, and the same `id` meant a different business in each — so
 * every booking button pointed at the wrong clinic. The fix was to stop
 * treating `id` as identity.
 *
 * These cases are the contract. Each one was run against the real function
 * before being written down, and the "mutation" note records what a broken
 * implementation looks like — a test whose green survives the bug proves
 * nothing (REVIEW-FULL-E2E-2026-10-24).
 *
 * Run with: npm test   (node --test, no dependencies)
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { businessKey } from './business-key.ts'

test('id does not matter — the same shop in two rows is one shop', () => {
  // This is the 431-of-447 case: ids 68 and 10102, one business.
  const fromCatalog = { id: 68, name: 'کلینیک مهر', lat: 35.7575, lng: 51.4103 }
  const fromApi = { id: 10102, name: 'کلینیک مهر', lat: 35.7575, lng: 51.4103 }
  assert.equal(businessKey(fromCatalog), businessKey(fromApi))
})

test('float drift below the fourth decimal is absorbed', () => {
  // The export and a fresh read disagree in the noise of a float. ~1e-8
  // degrees is a fraction of a millimetre; it must not split one shop.
  const a = { name: 'کلینیک مهر', lat: 35.75750001, lng: 51.41030001 }
  const b = { name: 'کلینیک مهر', lat: 35.7575, lng: 51.4103 }
  assert.equal(businessKey(a), businessKey(b))
})

test('two shops ~111 m apart stay two shops', () => {
  // The other half of the trade-off: 4 decimals is ~11 m, so rounding must
  // not be so coarse that neighbours on one street collapse into one.
  //
  // Mutation check: with `.toFixed(0)` both keys become "name|36|51" and
  // this assertion fails — which is exactly how the guard was verified.
  const a = { name: 'کلینیک مهر', lat: 35.7575, lng: 51.4103 }
  const b = { name: 'کلینیک مهر', lat: 35.7585, lng: 51.4103 }
  assert.notEqual(businessKey(a), businessKey(b))
})

test('stray and repeated whitespace in the name does not split a shop', () => {
  const a = { name: '  کلینیک   مهر  ', lat: 35.7575, lng: 51.4103 }
  const b = { name: 'کلینیک مهر', lat: 35.7575, lng: 51.4103 }
  assert.equal(businessKey(a), businessKey(b))
})

test('two businesses at one address stay two businesses', () => {
  // A clinic and the pet shop in its lobby share coordinates and must not
  // be merged — the name is the half that tells them apart.
  const a = { name: 'کلینیک مهر', lat: 35.7575, lng: 51.4103 }
  const b = { name: 'پت‌شاپ مهر', lat: 35.7575, lng: 51.4103 }
  assert.notEqual(businessKey(a), businessKey(b))
})

test('missing fields do not throw', () => {
  // Rows arrive from three sources with different shapes. A missing name
  // or coordinate must produce a key, not an exception — the merge decides
  // later whether such a row is comparable at all.
  assert.equal(typeof businessKey({}), 'string')
  assert.equal(businessKey({ name: 'x' }), 'x|0.0000|0.0000')
})
