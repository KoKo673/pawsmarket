/**
 * Report the computed colour pair and contrast ratio for each element axe
 * flagged, so the fix can be aimed at the token rather than guessed at.
 *
 *   node scripts/_contrast_probe.mjs --base http://127.0.0.1:4173
 */
import { chromium } from 'playwright'

const BASE = process.argv[process.argv.indexOf('--base') + 1] || 'http://127.0.0.1:4173'
const TOKEN = process.env.PAWS_TOKEN ?? ''

const ROUTES = ['/', '/explore', '/pets', '/adoption', '/feed', '/bookings', '/me']

function lum(rgb) {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function ratio(a, b) {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

function parse(s) {
  const m = s.match(/rgba?\(([^)]+)\)/)
  if (!m) return null
  const parts = m[1].split(/[,\s/]+/).filter(Boolean).map(Number)
  return parts.slice(0, 3)
}

const PROBE = `(() => {
  const out = [];
  const seen = new Set();
  for (const el of document.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    const text = (el.textContent || '').trim();
    if (!text || el.children.length) continue;
    // Only leaf nodes with their own text.
    const fg = cs.color;
    // Walk up for the first non-transparent background.
    let node = el, bg = 'rgba(0, 0, 0, 0)';
    while (node && (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent')) {
      bg = getComputedStyle(node).backgroundColor;
      node = node.parentElement;
    }
    const key = fg + '|' + bg + '|' + cs.fontSize + '|' + cs.fontWeight;
    if (seen.has(key)) continue;
    seen.add(key);
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    out.push({
      fg, bg,
      size: cs.fontSize,
      weight: cs.fontWeight,
      cls: (el.className || '').toString().slice(0, 60),
      sample: text.slice(0, 26),
    });
  }
  return out;
})()`

const browser = await chromium.launch({ channel: 'chrome', headless: true })
for (const route of ROUTES) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
    isMobile: true, hasTouch: true, locale: 'fa-IR',
  })
  const page = await ctx.newPage()
  if (TOKEN) {
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 30_000 })
    await page.evaluate((t) => localStorage.setItem('pawsmarket-auth-token', t), TOKEN)
  }
  await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 30_000 })
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
  await page.waitForTimeout(600)

  const items = await page.evaluate(PROBE)
  const fails = []
  for (const it of items) {
    const fg = parse(it.fg), bg = parse(it.bg)
    if (!fg || !bg) continue
    const r = ratio(fg, bg)
    // WCAG AA: 3.0 for large text (>=18.66px bold or >=24px), else 4.5
    const px = parseFloat(it.size)
    const large = px >= 24 || (px >= 18.66 && Number(it.weight) >= 700)
    const need = large ? 3.0 : 4.5
    if (r < need) fails.push({ ...it, ratio: Math.round(r * 100) / 100, need })
  }
  await ctx.close()

  console.log(`\n=== ${route} — ${fails.length} failing pair(s) ===`)
  const byKey = new Map()
  for (const f of fails) {
    const k = `${f.fg} on ${f.bg}`
    if (!byKey.has(k)) byKey.set(k, { ...f, n: 1 })
    else byKey.get(k).n++
  }
  for (const v of byKey.values()) {
    console.log(`  ${v.ratio} (need ${v.need})  ${v.n}x  ${v.fg} on ${v.bg}`)
    console.log(`      ${v.size} w${v.weight}  .${v.cls}`)
    console.log(`      «${v.sample}»`)
  }
}
await browser.close()
