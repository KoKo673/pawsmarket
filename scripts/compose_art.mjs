/**
 * Compose the Persian overlay onto generated artwork.
 *
 * Why the browser and not Pillow: Pillow has no shaping engine, so Persian
 * rendered with it comes out with disconnected letterforms — «پ ا ز م ا ر ک ت»
 * instead of «پازمارکت». It also cannot read .woff2, the only font format in
 * public/fonts. Chromium shapes correctly and loads the app's own font file,
 * so the wordmark here is pixel-identical to the one in the navbar.
 *
 * No generated image contains text; every letter on the output is drawn here.
 *
 *   node scripts/compose_art.mjs
 */
import { chromium } from 'playwright'
import { readdir, mkdir, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '..')
const ART = path.join(ROOT, 'artifacts', 'art')
const OUT = path.join(ROOT, 'artifacts', 'final')
const FONT_CSS = path.join(ROOT, 'public', 'fonts', 'vazirmatn.css')

/** Kinds that carry a wordmark. Store art is a stand-in for a photo. */
const COMPOSED = { banner: 'banner', poster: 'poster', 'poster-alt': 'poster' }

function html(kind, dataUrl, fontUrl) {
  const isBanner = kind === 'banner'
  return `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8">
<style>
  @font-face{
    font-family:Vazirmatn;
    src:url("${fontUrl}") format("woff2-variations");
    font-weight:100 900;
  }
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:100%;height:100%}
  body{font-family:Vazirmatn,sans-serif;-webkit-font-smoothing:antialiased}
  .stage{position:relative;width:100%;height:100%;overflow:hidden}
  .pic{position:absolute;inset:0;background:url("${dataUrl}") center/cover no-repeat}
  .wash{position:absolute;inset:0}
  /* A quiet area for the type, so it never lands on whatever the model
     happened to put there. */
  .${isBanner ? 'washL' : 'washT'}{
    background:${
      isBanner
        // A long, even ramp. The first version jumped 0 → .86 across a short
        // span, and on a photo with its own vertical edge (a curtain, a wall
        // corner) the two lined up into a visible seam down the middle.
        ? 'linear-gradient(to left, rgba(250,247,240,0) 0%, rgba(250,247,240,.55) 26%, rgba(250,247,240,.90) 48%, rgba(250,247,240,.97) 62%, rgba(250,247,240,.99) 100%)'
        : 'linear-gradient(to bottom, rgba(250,247,240,.96) 0%, rgba(250,247,240,.92) 20%, rgba(250,247,240,.55) 30%, rgba(250,247,240,0) 40%)'
    };
  }
  .type{position:absolute;color:#261f1a}
  ${isBanner
    ? `.type{left:0;right:auto;width:44%;top:50%;transform:translateY(-50%);text-align:right;padding:0 5%}
       .wm{font-weight:900;font-size:calc(100vh * .215);line-height:1.0;letter-spacing:-.02em}
       .sub{font-weight:500;font-size:calc(100vh * .068);line-height:1.55;margin-top:.62em;color:#4a3f36}`
    // `right:0` as well as `left:0` is what makes the box full width. With
    // only `left`, an absolutely-positioned block shrinks to fit its text and
    // is then anchored at the left edge — which is why the subtitle ran off
    // the canvas and every line started hard against the right border.
    //
    // Sized in container units, not vw: the canvas is 1024 wide and the
    // longest line is ~34 Persian characters, so .052em of the width was
    // simply wider than the poster. The box also gets padding to keep the
    // type off the edge even when a line is long.
    : `.type{left:0;right:0;top:5.2%;padding:0 7%}
       .wm{font-weight:900;font-size:calc(100vw * .095);line-height:1.1;letter-spacing:-.02em}
       .sub{font-weight:700;font-size:calc(100vw * .040);margin-top:.55em}
       .fine{font-weight:400;font-size:calc(100vw * .027);margin-top:.5em;color:#6e6054}`}
  .o{color:#e94e04}
</style></head>
<body><div class="stage">
  <div class="pic"></div><div class="wash ${isBanner ? 'washL' : 'washT'}"></div>
  <div class="type">
    <div class="wm">پاز<span class="o">مارکت</span></div>
    ${isBanner
      ? `<div class="sub">حیوانات، لوازم و فروشگاه‌های اطراف شما</div>`
      : `<div class="sub">همه‌ی نیازهای حیوان شما، یک‌جا</div>
         <div class="fine">خرید · فروشگاه‌های اطراف · نوبت مراکز خدماتی</div>`}
  </div>
</div></body></html>`
}

const browser = await chromium.launch({ headless: true })
try {
  const fontB64 = (await readFile(path.join(ROOT, 'public', 'fonts', 'Vazirmatn-var.woff2')))
    .toString('base64')
  const fontUrl = `data:font/woff2;base64,${fontB64}`

  await mkdir(OUT, { recursive: true })
  const files = (await readdir(ART)).filter((f) => f.endsWith('.png')).sort()
  if (!files.length) {
    console.error(`no generated art in ${ART}; run scripts/gen_art.py first`)
    process.exit(1)
  }

  for (const file of files) {
    const stem = path.basename(file, '.png')
    const src = path.join(ART, file)
    const kind = COMPOSED[stem]
    const dest = path.join(OUT, file)

    if (!kind) {
      // Store photography: nothing added, and resized down because it stands
      // in for a thumbnail in a card, not a poster.
      const b64 = (await readFile(src)).toString('base64')
      const page = await browser.newPage({ viewport: { width: 1024, height: 768 } })
      await page.setContent(`<body style="margin:0"><img src="data:image/png;base64,${b64}"
        style="width:1024px;height:768px;object-fit:cover"></body>`)
      await page.screenshot({ path: dest, type: 'jpeg', quality: 86 })
      await page.close()
      console.log(`plain  ${file}`)
      continue
    }

    const size = kind === 'banner' ? { width: 1536, height: 640 } : { width: 1024, height: 1536 }
    const b64 = (await readFile(src)).toString('base64')
    const page = await browser.newPage({ viewport: size, deviceScaleFactor: 1 })
    await page.setContent(html(kind, `data:image/png;base64,${b64}`, fontUrl),
      { waitUntil: 'load' })
    await page.evaluate(() => document.fonts.ready)

    // Refuse to save an image whose type runs off the canvas. The first
    // poster shipped with a subtitle wider than the 1024px poster itself, and
    // it was only caught by looking at the result. Measuring is cheaper than
    // noticing.
    const overflow = await page.evaluate(() => {
      const W = document.documentElement.clientWidth
      const bad = []
      for (const el of document.querySelectorAll('.type *')) {
        const r = el.getBoundingClientRect()
        if (r.left < -1 || r.right > W + 1) {
          bad.push(`${el.className}: ${Math.round(r.left)}..${Math.round(r.right)} of ${W}`)
        }
      }
      return bad
    })
    if (overflow.length) {
      console.error(`OVERFLOW in ${file}:`)
      for (const line of overflow) console.error('   ' + line)
      await page.close()
      process.exitCode = 1
      continue
    }

    await page.screenshot({ path: dest, type: 'jpeg', quality: 92 })
    await page.close()
    console.log(`composed ${file}`)
  }
  console.log(`\ndone → ${OUT}`)
} finally {
  await browser.close()
}

if (!existsSync(FONT_CSS)) console.error('warning: vazirmatn.css not found')
