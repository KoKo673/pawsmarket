/**
 * Campaign attribution — which message brought this visitor here.
 *
 * The outreach links look like
 *   /store/<slug>?utm_source=sms&utm_medium=sms&utm_campaign=outreach-2026-11
 *
 * A visitor does not land on the claim form directly: the SMS opens a store
 * page, they read it, then click «درخواست دسترسی» and fill in a form. By
 * that point `location.search` is gone — the hop to /for-business is a new
 * navigation with no query string. So the tags are read once, wherever the
 * visitor first arrives, and kept in sessionStorage until a claim is filed.
 *
 * sessionStorage, not localStorage: a campaign belongs to one visit. A
 * clinic that comes back next month by typing the address should not be
 * credited to an SMS it read once.
 *
 * Every failure here is swallowed. Attribution is a nice-to-have; a clinic
 * unable to file a claim because a storage quota was full would be a real
 * bug caused by a measurement feature.
 */
export const UTM_KEY = 'pawsmarket:utm'

const FIELDS = ['utm_source', 'utm_medium', 'utm_campaign'] as const

/**
 * Read the tags from the current URL, merge them into the session, return
 * everything known about this visit.
 *
 * The stored value is included even when the URL has nothing: a visitor
 * who opened `/s/abc` (tag bound to the row, not the query string) and
 * then hops to the claim form has no `?utm_*` left to read, and returning
 * only what the URL held would lose the campaign at exactly the moment it
 * is about to be filed.
 */
export function readUtm(): Record<string, string> {
  const q = new URLSearchParams(window.location.search)
  const found: Record<string, string> = {}
  for (const k of FIELDS) {
    const v = q.get(k)
    if (v) found[k] = v.slice(0, 80) // a hostile URL must not fill the column
  }

  try {
    const prev = JSON.parse(sessionStorage.getItem(UTM_KEY) || '{}') as Record<string, string>
    // Merge rather than overwrite: a second tagged link should fill in a
    // missing field, not erase the campaign the visit started with.
    const merged = { ...prev, ...found }
    if (Object.keys(found).length) {
      sessionStorage.setItem(UTM_KEY, JSON.stringify(merged))
    }
    return merged
  } catch {
    return found
  }
}

/**
 * Record tags that came from somewhere other than the URL — currently the
 * `code_utm` bound to a `/s/<code>` short link.
 *
 * Merged, never overwriting: a visitor who arrived from a tagged Instagram
 * link and then opened a texted short link keeps the first campaign,
 * because that is the one that actually brought them.
 */
export function bindUtm(found: Record<string, string>): void {
  try {
    const prev = JSON.parse(sessionStorage.getItem(UTM_KEY) || '{}') as Record<string, string>
    sessionStorage.setItem(UTM_KEY, JSON.stringify({ ...found, ...prev }))
  } catch {
    /* Attribution is worth less than the claim it would block. */
  }
}

/**
 * The path with the campaign tags appended, for a hop.
 *
 * `path` may already carry its own query — `/for-business?store=12` — so
 * the separator has to depend on that. Appending `?` unconditionally
 * produced `/for-business?store=12?utm_source=sms`: one malformed
 * parameter, and the store id was silently lost with it.
 */
export function withUtm(path: string): string {
  const utm = readUtm()
  const qs = new URLSearchParams(utm).toString()
  if (!qs) return path
  return `${path}${path.includes('?') ? '&' : '?'}${qs}`
}
