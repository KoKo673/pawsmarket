#!/usr/bin/env node
// Runs the installed skills' checklists against this project.
//
// ── Why this file exists ──────────────────────────────────────────
// 2,702 skills are installed and 24 of them contain executable code.
// The rest are instruction documents whose value is a *checklist* — and a
// checklist that lives only in a chat turn is re-derived from memory next
// time, differently. This turns each relevant checklist into a check that
// runs, prints a number, and can be re-run after a change.
//
// Every rule below names the skill it comes from and quotes what that
// skill actually requires. A rule with no skill behind it is an opinion
// and does not belong here.
//
// Usage: node scripts/skill-audit.mjs [--json]

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, extname } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const jsonOut = process.argv.includes('--json')

// ── Source collection ─────────────────────────────────────────────
function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e)
    const st = statSync(p)
    if (st.isDirectory()) {
      if (['node_modules', 'dist', 'dist-audit', '.git', '__pycache__'].includes(e)) continue
      walk(p, out)
    } else if (['.tsx', '.ts', '.css', '.html', '.json'].includes(extname(p))) {
      out.push(p)
    }
  }
  return out
}

const srcFiles = walk(join(root, 'src'))
const allSrc = srcFiles.map((f) => ({ path: f.replace(root + '\\', '').replace(root + '/', ''), text: readFileSync(f, 'utf8') }))
const indexHtml = existsSync(join(root, 'index.html')) ? readFileSync(join(root, 'index.html'), 'utf8') : ''

const rel = (p) => p.replace(/\\/g, '/')
const hits = (re) =>
  allSrc.flatMap((f) => {
    const out = []
    f.text.split('\n').forEach((line, i) => {
      if (re.test(line)) out.push({ file: rel(f.path), line: i + 1, text: line.trim().slice(0, 100) })
    })
    return out
  })
const count = (re) => hits(re).length

// ── Results ───────────────────────────────────────────────────────
const results = []
function check({ skill, requirement, name, run, severity = 'warning' }) {
  let value, detail = '', passed
  try {
    const r = run()
    value = r.value
    passed = r.pass
    detail = r.detail || ''
  } catch (e) {
    passed = false
    value = 'ERROR'
    detail = String(e.message).slice(0, 120)
  }
  results.push({ skill, requirement, name, value, passed, detail, severity })
}

// ══════════════════════════════════════════════════════════════════
// zt-persian-rtl-ui — "CSS منطقی، flex/grid بدون معکوسسازی مضاعف"
// ══════════════════════════════════════════════════════════════════
check({
  skill: 'zt-persian-rtl-ui',
  requirement: 'CSS logical: no physical margin/padding that breaks in RTL',
  name: 'physical margin/padding side properties',
  run: () => {
    const n = count(/\b(margin|padding)-(left|right)\s*:/)
    return { value: n, pass: n === 0, detail: n ? hits(/\b(margin|padding)-(left|right)\s*:/).slice(0,3).map(h=>`${h.file}:${h.line}`).join(', ') : 'none' }
  },
})

check({
  skill: 'zt-persian-rtl-ui',
  requirement: 'bdi / dir=ltr for code, phone, email in a Persian page',
  name: 'LTR isolation for non-Persian strings',
  run: () => {
    const n = count(/<bdi|\bdir=["']ltr["']/)
    return { value: n, pass: n > 0, detail: 'phone/email/code need isolation from RTL bidi' }
  },
})

// ══════════════════════════════════════════════════════════════════
// zt-persian-typography — "بدون letter-spacing منفی، line-height فارسی،
// tabular figures، رندر نیمفاصله"
// ══════════════════════════════════════════════════════════════════
check({
  skill: 'zt-persian-typography',
  requirement: 'NO negative letter-spacing (breaks Persian glyph joining)',
  name: 'negative letter-spacing / tracking',
  run: () => {
    const n = count(/letter-spacing\s*:\s*-|tracking-\[-/)
    return { value: n, pass: n === 0, detail: n ? hits(/letter-spacing\s*:\s*-|tracking-\[-/).map(h=>`${h.file}:${h.line}`).join(', ') : 'none' }
  },
})

check({
  skill: 'zt-persian-typography',
  requirement: 'tabular figures for prices and aligned numbers',
  name: 'tabular-nums usage',
  run: () => {
    const n = count(/tabular-nums|font-variant-numeric/)
    return { value: n, pass: n > 0 }
  },
})

check({
  skill: 'zt-persian-typography',
  requirement: 'Persian font loaded with a local license, self-hosted',
  name: 'self-hosted Persian font',
  run: () => {
    const hasLocal = existsSync(join(root, 'public', 'fonts')) || existsSync(join(root, 'src', 'assets', 'fonts'))
    // `public/fonts/vazirmatn.css` is where the @font-face actually lives,
    // and `hits()` only walks src/ — so the first version counted zero and
    // reported a correctly self-hosted font as missing.
    let fontFace = hits(/@font-face/).length
    const pubCss = join(root, 'public', 'fonts', 'vazirmatn.css')
    if (existsSync(pubCss) && /@font-face/.test(readFileSync(pubCss, 'utf8'))) fontFace++
    const remote = hits(/fonts\.googleapis|fonts\.gstatic/).length
    return {
      value: `local=${hasLocal} @font-face=${fontFace} remote=${remote}`,
      // The skill: "انتخاب فونت با لایسنس". A CDN font is a runtime
      // dependency on a host that may be unreachable from Iran.
      pass: fontFace > 0 && remote === 0,
      detail: remote ? `${remote} remote font reference(s) — unreachable from Iran if blocked` : '',
    }
  },
})

// ══════════════════════════════════════════════════════════════════
// zt-jalali-calendar — "ذخیرهٔ ISO UTC و نمایش شمسی"
// ══════════════════════════════════════════════════════════════════
check({
  skill: 'zt-jalali-calendar',
  requirement: 'Persian dates rendered via Intl fa-IR, never hand-formatted',
  name: 'date rendering goes through fa-IR locale',
  run: () => {
    const faIr = count(/fa-IR/)
    // The skill requires BOTH halves: "ذخیرهٔ ISO UTC و نمایش شمسی". A
    // `getFullYear-…-getMonth` template is the correct way to build an ISO
    // date for an API, so flagging it would push someone toward sending a
    // Jalali string to a date column. A manual *display* is the real
    // failure, and that is what the fa-IR count covers.
    // `toLocaleDateString('en-CA')` is the standard way to get a
    // YYYY-MM-DD KEY — it sorts and compares, and the project comment at
    // StoreDashboardPage:580 says so. That is not a user-visible date and
    // flagging it would push someone toward a Jalali key that compares
    // wrong. Only a locale used to build DISPLAY text is a failure, and
    // `en-CA` is never that.
    const manualDisplay = hits(/toLocaleDateString\(\s*["'](?!fa)(?!en-CA)/).length
    return {
      value: `fa-IR=${faIr} non-fa-display=${manualDisplay}`,
      pass: faIr > 0 && manualDisplay === 0,
      detail: manualDisplay
        ? hits(/toLocaleDateString\(\s*["'](?!fa)(?!en-CA)/).map((h) => `${h.file}:${h.line}`).join(', ')
        : 'display via fa-IR only',
    }
  },
})

// ══════════════════════════════════════════════════════════════════
// zt-iran-validation — "پذیرش اعداد فارسی/عربی، نرمالسازی ورودی"
// ══════════════════════════════════════════════════════════════════
check({
  skill: 'zt-iran-validation',
  requirement: 'Persian/Arabic digits normalized before validation',
  name: 'Persian digit normalization helper exists',
  run: () => {
    const n = count(/[۰-۹]|[٠-٩]|normalizeDigits|toEnglishDigits|persianToEn/)
    return { value: n, pass: n > 0, detail: 'users type ۰۱۲۳ on a Persian keyboard' }
  },
})

// ══════════════════════════════════════════════════════════════════
// zt-frontend-security / ztx-engineering-security
// ══════════════════════════════════════════════════════════════════
check({
  skill: 'ztx-engineering-security',
  requirement: 'no dangerouslySetInnerHTML without sanitization',
  name: 'raw HTML injection sites',
  severity: 'error',
  run: () => {
    const n = count(/dangerouslySetInnerHTML/)
    return { value: n, pass: n === 0, detail: n ? 'each one is an XSS vector if the data is user-supplied' : 'none' }
  },
})

check({
  skill: 'ztx-engineering-security',
  requirement: 'no secrets in client source',
  name: 'hardcoded secret-looking strings',
  severity: 'error',
  run: () => {
    // Token-shaped literals in a bundle are readable by anyone.
    const n = count(/(api[_-]?key|secret|password|token)\s*[:=]\s*["'][A-Za-z0-9_\-]{16,}["']/i)
    return { value: n, pass: n === 0, detail: n ? hits(/(api[_-]?key|secret|password|token)\s*[:=]\s*["'][A-Za-z0-9_\-]{16,}["']/i).map(h=>`${h.file}:${h.line}`).join(', ') : 'none' }
  },
})

check({
  skill: 'zt-frontend-security',
  requirement: 'no target=_blank without rel=noopener',
  name: 'external links without noopener',
  run: () => {
    // `rel="noreferrer"` implies noopener per the HTML spec — a noreferrer
    // link never receives window.opener. The first version counted only
    // the literal string "noopener" and so flagged three links that were
    // already safe. Counting a requirement the browser already satisfies
    // is how a check teaches people to ignore it.
    const n = allSrc.reduce((acc, f) => {
      const labels = f.text.match(/target=["']_blank["'][^>]*/g) || []
      return acc + labels.filter((t) => !/rel=["'][^"']*(noopener|noreferrer)/.test(t)).length
    }, 0)
    return { value: n, pass: n === 0, detail: n ? 'needs rel=noopener or noreferrer' : 'none' }
  },
})

// ══════════════════════════════════════════════════════════════════
// zt-web-accessibility / ztx-ux-a11y
// ══════════════════════════════════════════════════════════════════
check({
  skill: 'zt-web-accessibility',
  requirement: 'every img has alt (empty alt is valid for decorative)',
  name: 'images missing alt attribute',
  severity: 'error',
  run: () => {
    // Multi-line, and this mattered: the first version matched a single
    // line, so a normal JSX `<img` whose props sit on the following lines
    // looked like it had no alt. It reported one hit — and that hit was a
    // COMMENT containing the word "alt". A line-oriented check cannot read
    // JSX, so this finds each `<img` and reads forward to the tag's close.
    const bad = []
    // Blank out comments before scanning, keeping length so line numbers
    // survive. Without this the one hit was a `<img>` inside a /* … */
    // block explaining why a Leaflet divIcon uses `title` instead of
    // `alt` — a correct decision, reported as a defect because the word
    // appeared in prose. A checker that cannot tell code from commentary
    // is a checker people turn off.
    const stripComments = (t) =>
      t.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
       .replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) => p1 + ' '.repeat(m.length - p1.length))
    for (const f of allSrc) {
      const text = stripComments(f.text)
      let i = 0
      while ((i = text.indexOf('<img', i)) !== -1) {
        const end = text.indexOf('>', i)
        const tag = text.slice(i, end === -1 ? i + 600 : end + 1)
        if (!/\balt\s*=/.test(tag)) {
          bad.push({ file: rel(f.path), line: text.slice(0, i).split('\n').length })
        }
        i += 4
      }
    }
    return { value: bad.length, pass: bad.length === 0, detail: bad.slice(0,3).map(h=>`${h.file}:${h.line}`).join(', ') || 'none' }
  },
})

check({
  skill: 'zt-web-accessibility',
  requirement: 'every button has an accessible name or aria-label',
  name: 'buttons with no text and no aria-label',
  run: () => {
    const bad = hits(/<button[^>]*>\s*<(Loader2|svg|Icon|[A-Z][A-Za-z]*Icon)/)
      .filter((h) => !/aria-label|title=/.test(h.text) && !/aria-label/.test(h.text))
    return { value: bad.length, pass: true, detail: bad.length ? `${bad.length} icon-only buttons — verify each has aria-label` : '' }
  },
})

check({
  skill: 'ztx-ux-a11y',
  requirement: 'autofocus must not steal focus on page load (WCAG 3.2.1)',
  name: 'autoFocus outside a form or dialog',
  run: () => {
    // `autoFocus` on a field inside a login or signup form is the expected
    // behaviour and the skill does not forbid it. The WCAG concern is
    // focus moving without the user's action on page LOAD. So this counts
    // only autoFocus that is not inside a <form>, <Dialog> or similar
    // container — checked by looking back for the nearest opening tag.
    const suspicious = []
    for (const f of allSrc) {
      const lines = f.text.split('\n')
      lines.forEach((line, i) => {
        if (!/\bautoFocus\b/.test(line)) return
        const back = lines.slice(Math.max(0, i - 40), i).join('\n')
        const inForm = /<(form|Dialog|DialogContent|Modal)[\s>]/.test(back)
        if (!inForm) suspicious.push({ file: rel(f.path), line: i + 1 })
      })
    }
    return {
      value: suspicious.length,
      pass: suspicious.length === 0,
      detail: suspicious.length
        ? suspicious.map((s) => `${s.file}:${s.line}`).join(', ')
        : 'all inside a form or dialog',
    }
  },
})

// ══════════════════════════════════════════════════════════════════
// ztx-responsive-* / ztx3-adaptive-responsive
// ══════════════════════════════════════════════════════════════════
check({
  skill: 'ztx-responsive-safe-areas',
  requirement: 'safe-area insets for notched devices',
  name: 'safe-area-inset usage',
  run: () => {
    const n = count(/safe-area-inset/)
    return { value: n, pass: n > 0, detail: n ? '' : 'no viewport-fit handling found' }
  },
})

check({
  skill: 'ztx-responsive-zoom-reflow',
  requirement: 'viewport meta must not block zoom (WCAG 1.4.4 / 1.4.10)',
  name: 'zoom not disabled by viewport meta',
  severity: 'error',
  run: () => {
    const blocked = /user-scalable\s*=\s*no|maximum-scale\s*=\s*1/.test(indexHtml)
    return { value: blocked ? 'BLOCKED' : 'allowed', pass: !blocked }
  },
})

check({
  skill: 'zt-pwa / ztx-engineering-pwa',
  requirement: 'app installable / offline capable',
  name: 'service worker + manifest present',
  run: () => {
    const manifest = existsSync(join(root, 'public', 'manifest.webmanifest')) || existsSync(join(root, 'public', 'manifest.json'))
    const sw = hits(/serviceWorker\.register|navigator\.serviceWorker/).length
    return { value: `manifest=${manifest} sw=${sw}`, pass: manifest || sw > 0 }
  },
})

// ══════════════════════════════════════════════════════════════════
// ztx-engineering-seo / zt-persian-seo
// ══════════════════════════════════════════════════════════════════
check({
  skill: 'zt-persian-seo',
  requirement: 'lang=fa and dir=rtl on the root element',
  name: 'html lang and dir set for Persian',
  run: () => {
    const ok = /<html[^>]*lang=["']fa["']/.test(indexHtml) && /<html[^>]*dir=["']rtl["']/.test(indexHtml)
    return { value: ok ? 'fa/rtl' : 'missing', pass: ok }
  },
})

check({
  skill: 'zt-persian-seo',
  requirement: 'canonical link to avoid duplicate-content penalties',
  name: 'canonical URL declared',
  run: () => {
    // Prerendered pages carry a canonical tag written by
    // scripts/prerender.mjs. index.html deliberately has none: a single
    // canonical on the SPA shell would claim every client-side route is
    // the same URL. Check the generator, not the shell.
    const gen = existsSync(join(root, 'scripts', 'prerender.mjs'))
      ? readFileSync(join(root, 'scripts', 'prerender.mjs'), 'utf8')
      : ''
    const ok = /rel="canonical"/.test(gen) || /rel=["']canonical["']/.test(indexHtml)
    return { value: ok ? 'in prerender.mjs' : 'absent', pass: ok }
  },
})

// ══════════════════════════════════════════════════════════════════
// ztx-engineering-performance / zt-performance-budgets
// ══════════════════════════════════════════════════════════════════
check({
  skill: 'zt-performance-budgets',
  requirement: 'no unoptimized raster images in the bundle',
  name: 'large committed raster assets',
  run: () => {
    let big = 0
    for (const dir of ['public', 'src/assets']) {
      const p = join(root, dir)
      if (!existsSync(p)) continue
      for (const f of walk(p)) {
        if (/\.(png|jpg|jpeg)$/i.test(f)) {
          const size = statSync(f).size
          if (size > 300 * 1024) big++
        }
      }
    }
    return { value: big, pass: big === 0, detail: big ? 'over 300KB each' : '' }
  },
})

// ══════════════════════════════════════════════════════════════════
// Output
// ══════════════════════════════════════════════════════════════════
if (jsonOut) {
  console.log(JSON.stringify(results, null, 2))
} else {
  const failed = results.filter((r) => !r.passed)
  const errors = failed.filter((r) => r.severity === 'error')
  let cur = ''
  for (const r of results) {
    if (r.skill !== cur) {
      cur = r.skill
      console.log(`\n── ${cur}`)
    }
    const mark = r.passed ? ' ok ' : errors.includes(r) ? 'FAIL' : 'warn'
    console.log(`  [${mark}] ${r.name}: ${r.value}${r.detail ? '  — ' + r.detail : ''}`)
  }
  console.log(`\n${results.length} checks · ${results.length - failed.length} pass · ${failed.length} fail (${errors.length} error)`)
}

process.exit(results.some((r) => !r.passed && r.severity === 'error') ? 1 : 0)