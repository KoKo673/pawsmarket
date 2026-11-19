/**
 * Guard: the site must never claim to be a marketplace of other stores.
 *
 * Why this is a gate and not a one-time sweep (owner, 2026-11-19):
 * «۱۶۰ فروشگاه واقعی تهران», «مراکز و پناهگاه‌ها» next to «لوازم و
 * فروشگاه‌ها را … پیدا کنید», and the «موجودی خود پازمارکت» badge all came
 * from the ORIGINAL prototype, when pawsmarket aggregated other sellers.
 * Three of them survived into a shipping product and reached a user's phone.
 * A copy sweep fixes today's three; only a check catches tomorrow's fourth.
 *
 * What is forbidden, precisely — because a first attempt matched the bare
 * plural «فروشگاه‌ها» and failed on /explore's «خدمات و فروشگاه‌ها», which
 * is about SERVICE CENTRES and is true. Over-broad gates get ignored, so the
 * rules are narrow enough that every hit is worth reading:
 *
 *   (a) a NUMBER in front of فروشگاه/بازار — that counts other shops;
 *   (b) an invitation to FIND/SEARCH for stores — there are none to find;
 *   (c) a "our own stock" badge — with one seller it answers no question.
 *
 * Allowed: our own store named in the singular, and counting مراکز خدمات
 * (clinics and groomers really are many).
 *
 * Run: node scripts/check-store-claims.mjs      (exit 1 = violations)
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

// fileURLToPath, not `.pathname`: on Windows that yields `/C:/…/src/`, which
// no fs call accepts and which disagrees with join() on every separator.
const SRC = fileURLToPath(new URL('../src/', import.meta.url))

// Both rules below were written too narrowly the first time and MISSED the
// real bug when mutation-tested — which is the only reason a gate exists:
//
//   · «${faDigits(realStores)} فروشگاه واقعی تهران» has no literal digits in
//     the source at all; the count arrives from an expression. Matching only
//     `[۰-۹0-9]` let the original violation through untouched.
//   · The footer's old line ran «…لوازم و فروشگاه‌ها را در همان حوالی
//     خانه‌تان پیدا کنید» — 40+ characters between the noun and the verb, so
//     a {0,40} window never saw both halves.
//
// So: an interpolated count OR a literal one; and the find/see verbs match
// anywhere on the same rendered line as a store noun.

// A count that comes from data, e.g. {faDigits(n)} or {n}, vs. literal digits.
const COUNT = /(?:\{[a-zA-Z$_][\w.()*]*\}|[۰-۹0-9][۰-۹0-9٬,\s]*)/
const STORE_NOUN = /(فروشگاه|بازار)/
// Verbs that turn "there are stores" into "go look at someone else's".
const SEEK = /(پیدا\s+کنید|جستجو\s+کنید|مشاهده\s+کنید|بخرید|انتخاب\s+کنید)/
// Words that make a store noun OURS rather than somebody else's.
const OWN = /(پازمارکت|خودمان|یک فروشگاه)/

// A line that CLASSIFIES one place as a shop rather than a clinic is a true
// statement about a single listing, not a claim that many stores sell here.
// BookingPage says exactly this («${store.name} فروشگاه است، نه مرکز
// خدماتی») and the first version of this gate flagged it — a false positive
// that would teach an editor to ignore the check. Exempting the SHAPE, not
// the file, so a real violation elsewhere still fails.
const IS_A_SHOP = /(فروشگاه\s+است|فروشگاه\s+نیست|مرکز\s+خدماتی)/

// A WORD BOUNDARY FOR PERSIAN, and why the obvious `\\b` cannot be used:
// `\b` is defined in terms of `[A-Za-z0-9_]`, so in «۱۶۰ فروشگاه واقعی» there
// is no word character at all after «فروشگاه» — the next thing is a space,
// which IS a boundary… but the preceding glyph «اه» is not a word character
// either, so `\b` finds none and the rule matched nothing. Verified directly:
// `/([۰-۹0-9])\s*(فروشگاه)\b/` is false on that line, without `\b` it is true.
// The gate silently passed two real mutations for exactly this reason.
// So: a negative lookahead over the letters that can extend the noun in
// Persian (its own diacritics, the half-width joins, Latin).
const END = '(?![ًٌَّـْٔa-zً-ْ])'

const RULES = [
  { re: new RegExp(COUNT.source + '\\s*' + STORE_NOUN.source + END),
    why: 'a number counting stores',
    // «۸۲۳ کالا» and «۱۶۰ مرکز خدمات» are true counts of things we do have.
    // Only a count attached to فروشگاه/بازار is a claim about other sellers,
    // unless the noun is qualified as our own store.
    ok: (_m, line) => OWN.test(line) || IS_A_SHOP.test(line) },
  { re: new RegExp(`${STORE_NOUN.source}${END}[^\\n]*${SEEK.source}|${SEEK.source}[^\\n]*${STORE_NOUN.source}${END}`),
    why: 'inviting the reader to find or buy at other stores',
    ok: (_m, line) => OWN.test(line) || IS_A_SHOP.test(line) },
  { re: /موجودی\s+خود/, why: "a redundant 'our own stock' badge", ok: () => false },
  // A BARE PLURAL — no count in front of it, no seek verb after it. The two
  // rules above each need one of those; this one needs only the noun to be
  // plural, because «فروشگاه‌های واقعی تهران» asserts that other stores exist
  // whether or not anyone invites the reader to them. Found by mutation: with
  // only the first two rules, that exact string passed the gate clean.
  //
  // The marker is the ZWNJ (U+200C) before «ها». Persian plurality without it
  // («فروشگاه ها») is a spacing slip, not the same word.
  //
  // NOT every plural is a claim. Mutation-testing this rule against the clean
  // tree produced three hits, all true statements, so the exemptions are the
  // shapes rather than a file allow-list:
  //   · FilterSidebar «خدمات و فروشگاه‌ها»  — a CATEGORY of places on the map,
  //     alongside clinics; nothing about who sells.
  //   · CtaBanner «برای مالکان، پرورش‌دهندگان و فروشگاه‌های محلی» — WHO THE
  //     OFFER IS FOR (inviting shops to register), the opposite of sending our
  //     customers elsewhere.
  //   · BookingPage «در حال اصلاح اطلاعات فروشگاه‌ها…» — an internal notice
  //     about listing DATA we maintain.
  // So: exempt when the plural is addressed TO shops (for/to/owners), names a
  // map category, or talks about their DATA. A bare «N فروشگاه» or
  // «فروشگاه‌های … تهران» with none of those still fails.
  { re: /(فروشگاه|بازار)‌ها/,
    why: 'a plural claiming other stores sell here',
    ok: (m, line) =>
      /(^|[\s{])((برای|به)\s+)|مالکان|پرورش‌دهنده/.test(line) ||          // audience
      /(خدمات|مراکز|نقشه|دسته|فیلتر|اطلاعات|در حال)/.test(line),         // category or our data
  },
]

// Strip comments before scanning, so only RENDERED text is judged.
//
// A per-line prefix test (`/^\s*\/\//`) is not enough and this gate proved it:
// the sweep that fixed the original bugs left a JSX block comment whose middle
// lines begin with Persian text, not `{` or `*`, so the scanner treated the
// explanation as copy and failed on the very phrase it was documenting. The
// fix is to remove the ranges, not to guess which lines look like comments.
//
// Both syntaxes matter: `//` and `/* */` in .ts, and `{/* … */}` in .tsx —
// where the delimiters straddle lines and every interior line is prose.
function stripComments(src) {
  return src
    // Block comments (and JSX's {/* … */}) become the SAME NUMBER OF NEWLINES,
    // not nothing: deleting them would shift every following line up and make
    // the reported line numbers point at the wrong code. Positions stay true.
    .replace(/\{?\/\*[\s\S]*?\*\/\}?/g, (m) => m.replace(/[^\n]/g, ''))
    // line comments, but not inside a string: require them to start a line or
    // follow whitespace/`(`/`{`, which keeps `http://` and paths intact.
    .replace(/(^|[(){\s])\/\/[^\n]*/g, '$1')
}

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (['.tsx', '.ts'].includes(extname(p)) && !e.endsWith('.test.ts')) out.push(p)
  }
  return out
}

const files = walk(SRC)
if (files.length === 0) {
  // Exiting clean having scanned nothing is the failure mode that hid the
  // original three bugs for weeks. No input is an error, not a pass.
  console.error(`check-store-claims: found no sources under ${SRC}`)
  process.exit(2)
}

const hits = []
for (const f of files) {
  const lines = stripComments(readFileSync(f, 'utf8')).split('\n')
  lines.forEach((line, i) => {
    for (const { re, why, ok } of RULES) {
      const m = line.match(re)
      // relpath via the resolved paths, not a string slice: `f` comes from
      // join() and carries BACKSLASHES on Windows, while SRC came from a URL
      // with forward ones. Slicing by length cut mid-word and printed
      // «omponents\home\ProductRail.tsx» — a path the reader cannot open.
      const rel = f.startsWith(SRC) ? f.slice(SRC.length).replace(/^[\\/]/, '') : f
      if (m && !ok(m, line)) hits.push({ f: rel, line: i + 1, why, text: m[0].trim().slice(0, 60) })
    }
  })
}

console.log(`check-store-claims: ${files.length} files scanned`)
if (hits.length === 0) {
  console.log('  no claims of other stores')
  process.exit(0)
}
console.error(`  ${hits.length} VIOLATION(S) — we are the only store:`)
for (const h of hits) console.error(`    ${h.f}:${h.line}  ${h.why}: «${h.text}»`)
process.exit(1)
