import type { PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useAuthStore } from '@/store/auth.store'

/**
 * گارد روت: فقط وقتی وضعیت مشخص شد و کاربر ناشناس بود، ریدایرکت می‌کند.
 *
 * ── چرا اینجا اسکلتون نیست ───────────────────────────────────────────────
 * This guard used to render its own skeleton while the session was being
 * checked. It cannot know what shape its children will take, so the skeleton
 * was generic — a short block of two bars — and every guarded page then
 * replaced it with real content of a different height. Lighthouse measured the
 * result at 0.280 (feed), 0.280 (bookings) and 0.286 (me), against a 0.1
 * budget, while the five public routes sat at 0.000. Three pages with nothing
 * in common but this wrapper, all landing within 0.006 of each other, is the
 * signature of a shared cause rather than shared content.
 *
 * So `loading` now renders the page. The page owns its own loading shape and
 * can match its real content exactly, which the guard never could. Making the
 * generic skeleton taller would only have moved the jump here.
 *
 * ── چرا این امن است ──────────────────────────────────────────────────────
 * Rendering children before `status` settles means each page mounts while
 * `user` is still null, and with an empty `activePetId`. Checked before making
 * the change:
 *
 *   - the token is read straight from localStorage (`getToken` in
 *     lib/social-api.ts), not from this store, so a page's first request
 *     already carries the right Authorization header — the request is not
 *     sent unauthenticated and does not 401 on the way in
 *   - MyAccountPage reads `user?.display_name ?? user?.username`, so it
 *     renders an empty heading rather than throwing
 *   - MyBookingsPage does not read `user` at all
 *   - FeedPage reads only `activePetId`, which is null until hydrate lands —
 *     and the feed's own query already handles that (`activePetId ?? undefined`)
 *
 * The alternative — keeping the guard's skeleton — is what produced the CLS.
 * If a page cannot render before the session settles, that page needs to say
 * so itself, not have the answer guessed for it here.
 */
export function RequireAuth({ children }: PropsWithChildren) {
  const status = useAuthStore((s) => s.status)
  const location = useLocation()

  // 'loading' falls through to the children: the page decides what to show.
  if (status === 'anon') {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />
  }

  return <>{children}</>
}
