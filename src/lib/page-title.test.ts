/**
 * One title per route.
 *
 * Measured 2026-11-21: 31 of 33 pages never set `document.title`, so every
 * tab, bookmark and GA4 `page_title` said «پازمارکت — حیوانات و لوازم
 * نزدیک شما» — the home page's title — whatever page the visitor was on.
 *
 * These tests pin the two things that were actually wrong: a route with no
 * title, and a title that does not say which page it is.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { titleForPath } from './page-title.ts'

const SITE = 'پازمارکت'

test('every exact route names itself', () => {
  const routes = [
    ['/', 'حیوانات و لوازم نزدیک شما'],
    ['/shop', 'فروشگاه'],
    ['/explore', 'کاوش روی نقشه'],
    ['/cart', 'سبد خرید'],
    ['/terms', 'قوانین و شرایط'],
    ['/privacy', 'حریم خصوصی'],
    ['/support', 'پشتیبانی'],
  ]
  for (const [path, name] of routes) {
    assert.equal(titleForPath(path), `${name} — ${SITE}`, path)
  }
})

test('a detail route names its family, not the id', () => {
  // «محصول ۲۲۳۷» would be a title naming a number, which is worse than a
  // category. The page overwrites this with the real name once loaded.
  assert.equal(titleForPath('/shop/2237'), `محصول — ${SITE}`)
  assert.equal(titleForPath('/store/some-clinic'), `مرکز خدماتی — ${SITE}`)
  assert.equal(titleForPath('/pet/12'), `حیوان — ${SITE}`)
  assert.equal(titleForPath('/orders/58'), `سفارش — ${SITE}`)
})

test('a trailing slash is the same page', () => {
  assert.equal(titleForPath('/shop/'), titleForPath('/shop'))
  assert.equal(titleForPath('/terms/'), titleForPath('/terms'))
})

test('an unknown route returns null rather than a wrong title', () => {
  // The caller leaves the shell's title alone. Inventing «صفحه» for an
  // unknown path would make 404s indistinguishable from real pages.
  assert.equal(titleForPath('/no-such-thing'), null)
  assert.equal(titleForPath('/x/y/z'), null)
})

test('no two routes share a title, so a tab is never ambiguous', () => {
  const paths = ['/', '/shop', '/explore', '/cart', '/terms', '/privacy',
    '/support', '/pets', '/adoption', '/bookings', '/orders', '/me', '/feed']
  const titles = paths.map((p) => titleForPath(p))
  assert.equal(new Set(titles).size, titles.length,
    'two routes resolve to the same tab title')
})
