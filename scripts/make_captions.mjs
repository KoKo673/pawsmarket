/**
 * Burn the ad copy into transparent 576x1024 caption PNGs, then hand them to
 * ffmpeg to composite over the generated clips.
 *
 * Two rules earned the hard way:
 *
 *  1. **Persian text is rendered in Chromium, never in Pillow.** Pillow cannot
 *     join Persian letters and cannot read .woff2, so text comes out detached
 *     and reversed. The app's own Vazirmatn variable font is loaded here.
 *  2. **Digits inside an RTL line render in the wrong order.** «۴۴۷» comes out
 *     as «VYY» because bidi treats the digits as an LTR run inside an RTL
 *     paragraph. Every number is wrapped in `.n`, which forces
 *     direction:ltr + bidi-override.
 *
 * Layout, measured off the previous accepted caption so the rebuild changes
 * only the artwork and nothing else:
 *     icon      y  52..202   (150 px tall, centred)
 *     headline  y 214..269   (font 46 px, weight 900)
 *     stats     y 282..302   (numbers orange, labels white)
 *     brand     y 919..944   weight 900, orange
 *     domain    y 962..976
 *
 * The icon band is 150 px rather than the 100 px Azadi used: Milad is a
 * needle at 1:5, so a 100 px tower is 20 px wide and the dish, cone and
 * shaft all collapse into one line. Height is what makes it legible.
 *
 *   node scripts/make_captions.mjs [--icon-only]
 */
import { chromium } from 'playwright'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '..')
const OUT = path.join(ROOT, 'artifacts', 'captions')
const ICON = path.join(ROOT, 'artifacts', 'tehran-icon.svg')

const W = 576
const H = 1024

/** One headline and one stat pair per clip. Nothing else. */
const COPY = {
  'video-city': {
    head: 'تهران، روی نقشه',
    stats: [['۴۴۷', 'مرکز'], ['۲۵۹', 'کالا']],
  },
  'video-dog':  { head: 'همه‌چیز، یک‌جا',   stats: [] },
  'video-phone':{ head: 'مرکزهای اطراف، یک لیست', stats: [] },
}

/**
 * Persian digits written in visual order, forced to LTR.
 * Bidi reorders a digit run inside an RTL paragraph, so «۴۴۷» ships as «VYY»
 * unless the element overrides the direction and the glyphs are laid out the
 * way the eye reads them.
 */
const num = (s) =>
  `<span class="n">${s}</span>`

// ---------------------------------------------------------------- icon test
/**
 * Render the icon on its own, big, before it is burned into anything.
 *
 * Sized by HEIGHT, not width. Milad Tower is a needle — at the caption's real
 * size it is ~150 px tall and ~36 px wide, where a defect in the head is
 * invisible. Previewing at caption size would have passed the pagoda-headed
 * draft that failed at full size. Height 520 shows the head clearly.
 */
const ICON_PROBE = `<!doctype html><html><head><meta charset="utf-8">
<style>
 html,body{margin:0;background:#191612}
 .t{width:100%;height:100vh;display:flex;align-items:center;justify-content:center}
 img{height:520px;width:auto}
</style></head><body><div class="t"><img src="DATA"></div></body></html>`

async function iconProbe(browser) {
  const svg = await readFile(ICON, 'utf8')
  const url = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64')
  const p = await browser.newPage({ viewport: { width: 360, height: 600 } })
  await p.setContent(ICON_PROBE.replace('DATA', url), { waitUntil: 'load' })
  await p.waitForTimeout(120)
  const out = path.join(ROOT, 'artifacts', 'icon-check.png')
  await p.screenshot({ path: out })
  await p.close()
  console.log('icon probe ->', out)
}

// ---------------------------------------------------------------- captions
function page(fontUrl, svgUrl, spec) {
  const statsHtml = spec.stats.length
    ? `<div class="stats">` + spec.stats.map(([n, label]) =>
        `<span class="st">${num(n)} <span class="lb">${label}</span></span>`).join('') + `</div>`
    : ''
  return `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8">
<style>
 @font-face{font-family:V;src:url("${fontUrl}") format("woff2-variations");font-weight:100 900}
 *{margin:0;padding:0;box-sizing:border-box}
 html,body{width:${W}px;height:${H}px;background:transparent;
           font-family:V,sans-serif;-webkit-font-smoothing:antialiased}
 .stage{position:relative;width:${W}px;height:${H}px;overflow:hidden}
 /* Scrim: dark at the very top and very bottom only, fully clear through the
    middle so the clip is never hidden. The previous build washed the whole
    frame with peach and the city disappeared underneath it. */
 .scrim{position:absolute;inset:0;background:linear-gradient(to bottom,
   rgba(25,22,18,.62) 0%, rgba(25,22,18,.42) 9%, rgba(25,22,18,.12) 18%,
   rgba(25,22,18,0) 26%, rgba(25,22,18,0) 68%,
   rgba(25,22,18,.30) 80%, rgba(25,22,18,.66) 90%, rgba(25,22,18,.78) 100%)}
 /* Sized by HEIGHT, not width. Milad Tower is a needle — its viewBox is
    80x400, so the old width:74px rule rendered it 370 px tall and drove it
    straight through the headline. A fixed height keeps the band the same
    whatever landmark the SVG happens to contain. */
 .icon{position:absolute;top:52px;left:0;right:0;text-align:center}
 .icon img{height:150px;width:auto}
 .head{position:absolute;top:214px;left:0;right:0;text-align:center;
       font-weight:900;font-size:46px;line-height:1.2;color:#fff;
       text-shadow:0 3px 22px rgba(0,0,0,.55)}
 .stats{position:absolute;top:282px;left:0;right:0;text-align:center;
        font-size:23px;font-weight:800;color:#fff;
        text-shadow:0 2px 14px rgba(0,0,0,.6)}
 .st{margin:0 13px;white-space:nowrap}
 .n{color:#FA5C00;direction:ltr;unicode-bidi:bidi-override;display:inline-block}
 .lb{font-weight:700;color:#fff}
 .brand{position:absolute;bottom:80px;left:0;right:0;text-align:center}
 .word{font-weight:900;font-size:36px;color:#FA5C00;
       text-shadow:0 2px 16px rgba(0,0,0,.6)}
 .dot{display:inline-block;width:.30em;height:.30em;border-radius:50%;
      background:#FA5C00;vertical-align:.14em;margin:0 .38em}
 .url{font-weight:600;font-size:23px;color:#fff;margin-top:6px;direction:ltr;
      text-shadow:0 1px 12px rgba(0,0,0,.65)}
</style></head><body><div class="stage">
 <div class="scrim"></div>
 <div class="icon"><img src="${svgUrl}"></div>
 <div class="head">${spec.head}</div>
 ${statsHtml}
 <div class="brand">
   <div class="word">پازمارکت<span class="dot"></span></div>
   <div class="url">pawsmarket.ir</div>
 </div>
</div></body></html>`
}

async function build(browser, name, spec, fontUrl, svgUrl) {
  const p = await browser.newPage({ viewport: { width: W, height: H } })
  await p.setContent(page(fontUrl, svgUrl, spec), { waitUntil: 'load' })
  await p.waitForFunction(() => document.fonts.status === 'loaded')
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(150)

  // Nothing may touch the frame edge, and the copy must not run into the
  // middle third where the clip carries the message.
  const over = await p.evaluate(() => {
    const Wc = document.documentElement.clientWidth
    const Hc = document.documentElement.clientHeight
    const bad = []
    for (const el of document.querySelectorAll('.icon img, .head, .stats, .brand *')) {
      const r = el.getBoundingClientRect()
      if (r.left < -2 || r.right > Wc + 2 || r.top < -2 || r.bottom > Hc + 2) {
        bad.push(el.className || el.tagName)
      }
    }
    const hd = document.querySelector('.head').getBoundingClientRect()
    if (hd.bottom > 340) bad.push('head-into-picture')
    return bad
  })
  if (over.length) {
    console.error(`  OVERFLOW ${name}: ${over.join(', ')}`)
    await p.close()
    return false
  }
  await p.screenshot({ path: path.join(OUT, `${name}.png`), omitBackground: true })
  await p.close()
  console.log(`caption ${name} ${W}x${H}`)
  return true
}

const args = process.argv.slice(2)
const browser = await chromium.launch({ headless: true })
try {
  await mkdir(OUT, { recursive: true })
  await iconProbe(browser)
  if (!args.includes('--icon-only')) {
    const fontUrl = 'data:font/woff2;base64,' +
      (await readFile(path.join(ROOT, 'public/fonts/Vazirmatn-var.woff2'))).toString('base64')
    const svg = await readFile(ICON, 'utf8')
    const svgUrl = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64')
    for (const [name, spec] of Object.entries(COPY)) {
      await build(browser, name, spec, fontUrl, svgUrl)
    }
  }
} finally {
  await browser.close()
}
