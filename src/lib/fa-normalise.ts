/**
 * نرمال‌سازی متن فارسی — همان قاعده‌ای که سرور دارد.
 *
 * The server normalises `search_text` at write time and the query at read
 * time (app/textsearch.py). The client filters too — prices, categories and
 * kind are client-side by design — so it needs the same rule or the two
 * disagree: a visitor typing «كلينيك» would have the server return the row
 * and the client then filter it out again.
 *
 * Two copies of one rule is exactly the failure FR-5.5 records for
 * usernames. Kept as a separate file with a test so the pair is visible
 * and a change to one is obviously a change to both.
 *
 * The rule, measured on 447 stores: exact match 437, +Arabic ك→ک and ي→ی
 * gets 443, +ZWNJ→space gets 446.
 */
const ARABIC_TO_PERSIAN: Record<string, string> = {
  'ك': 'ک', // ARABIC LETTER KAF          → KEHEH
  'ي': 'ی', // ARABIC LETTER YEH          → FARSI YEH
  'ى': 'ی', // ARABIC LETTER ALEF MAKSURA → FARSI YEH
  'ة': 'ه', // ARABIC LETTER TEH MARBUTA  → HEH
  'ۀ': 'ه', // ARABIC LETTER HEH WITH YEH → HEH
}

const ZWNJ = '\u200C'

export function normaliseFa(text: string | null | undefined): string {
  if (!text) return ''
  let s = String(text)
  for (const [from, to] of Object.entries(ARABIC_TO_PERSIAN)) {
    s = s.split(from).join(to)
  }
  // ZWNJ becomes a space, not nothing: `پت‌شاپ` and `پت شاپ` are one shop
  // written two ways, and deleting the ZWNJ gives `پتشاپ` which equals
  // neither. Measured: deleting matched 443 of 447, replacing matched 446.
  s = s.split(ZWNJ).join(' ')
  return s.replace(/\s+/g, ' ').trim()
}
