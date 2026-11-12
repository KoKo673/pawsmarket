import { chromium } from 'playwright'
import { readFileSync, writeFileSync } from 'node:fs'

const svg = readFileSync('public/favicon.svg', 'utf8')

// Maskable icon: WCAG/PWA spec requires the important content inside a
// 40% safe zone — a launcher may crop the outer edge to any shape, so a
// mark drawn to the artwork's own edge gets its corners cut off.
function maskable(svg, size) {
  const inner = Math.round(size * 0.6)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" fill="#FA5C00"/>
    <g transform="translate(${(size - inner) / 2} ${(size - inner) / 2})">
      ${svg.replace(/<svg[^>]*>/, '').replace('</svg>', '')
           .replace('rect width="64" height="64" rx="16" fill="#FA5C00"', '')}
    </g>
  </svg>`
}

const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage()

async function shot(html, size, out) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(`<style>html,body{margin:0;padding:0}svg{display:block}</style>${html}`)
  await page.screenshot({ path: out, omitBackground: true })
  console.log('wrote', out)
}

await shot(svg, 192, 'public/icons/icon-192.png')
await shot(svg, 512, 'public/icons/icon-512.png')
await shot(maskable(svg, 512), 512, 'public/icons/icon-maskable-512.png')
await shot(svg, 180, 'public/icons/apple-touch-icon.png')
await browser.close()
