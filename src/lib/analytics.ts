/**
 * ثبت بازدید — a page view, once per route change.
 *
 * Why this exists at all: on 2026-11-03 nobody could answer "did anyone
 * come to the site last night". The only record was nginx's access log
 * inside the container, and the container had been recreated twice that
 * day, taking the log with it. Every visitor question since launch had
 * no evidence behind it.
 *
 * Why not Google Analytics or Plausible: the audience is largely in
 * Iran, where an external script is blocked or slow often enough that the
 * numbers would describe a biased slice and nothing else. It would also
 * add a consent surface for no benefit. The backend stores one row, and
 * the numbers are ours.
 *
 * What is deliberately absent from the payload: no cookie, no device
 * fingerprint, no screen size. The server adds a salted per-day hash of
 * IP + user-agent so it can count distinct visitors without ever storing
 * an address, and the client never learns that it did.
 */
import { readUtm } from './campaign'

const API = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')

/** One send per page view, even under React StrictMode's double effect. */
let lastSent = ''

export function trackView(path: string): void {
  // The dev server and the test runner must never write into the
  // production numbers — a reviewer refreshing /explore fifty times is
  // indistinguishable from traffic in the table.
  if (import.meta.env.DEV) return

  const utm = readUtm()
  const key = `${path}|${utm.utm_campaign ?? ''}`
  if (key === lastSent) return
  lastSent = key

  const body = JSON.stringify({
    path,
    // `document.referrer` is empty on a direct visit and on any browser
    // that strips it; the backend stores NULL rather than "".
    referrer: document.referrer || undefined,
    ...utm,
  })

  // sendBeacon survives the page being closed mid-navigation, which is
  // exactly when a visitor leaves — a `fetch` there is often cancelled
  // and the exit page would be systematically missing from the count.
  // The Blob carries the type so FastAPI parses it as JSON; a bare
  // string would arrive as text/plain.
  const url = `${API}/api/analytics/view`
  try {
    if (navigator.sendBeacon) {
      const ok = navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }))
      if (ok) return
    }
  } catch {
    /* fall through to fetch */
  }

  // Attribution is worth less than the page it would block: failures here
  // are silent on purpose.
  void fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {})
}
