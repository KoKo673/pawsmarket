import { ShieldAlert } from 'lucide-react'
import type { PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useAuthStore } from '@/store/auth.store'

/**
 * گارد ادمین — برخلاف RequireAuth، تا روشن‌شدن وضعیت چیزی رندر نمی‌کند.
 *
 * `RequireAuth` deliberately renders its children while the session is
 * still `loading`, because each page owns its own loading shape and a
 * generic skeleton caused measurable layout shift. That reasoning does not
 * transfer here, and the difference is worth stating plainly:
 *
 *   RequireAuth protects *data*, and every guarded page fetches its own
 *   data with a bearer token the server checks. Rendering early only ever
 *   shows an empty shell that fills in.
 *
 *   This guard protects *the existence of a page*. It has nothing to fetch
 *   to prove the right to be there, so if it rendered early it would paint
 *   the admin chrome — tab names, stat labels, the word "پنل مدیریت" — for
 *   anyone who typed /admin, then yank it away when `/me` came back without
 *   the flag. Telling a curious user that an admin panel exists is exactly
 *   the 404-not-403 rule the server follows, undone on the client.
 *
 * So: anon redirects to login, `loading` renders nothing, non-admin gets a
 * plain not-found. The server is still the real gate — a user who forges
 * `is_admin` in the store gets an empty page of 404s.
 */
export function RequireAdmin({ children }: PropsWithChildren) {
  const status = useAuthStore((s) => s.status)
  const user = useAuthStore((s) => s.user)
  const location = useLocation()

  if (status === 'anon') {
    // The admin door, not the customer one. Sending an operator to the
    // shopper login lands them on a phone/OTP tab that says nothing about
    // the panel, and the two paths then look like one feature that is
    // broken rather than two doors that are different.
    return <Navigate to={`/admin/login?next=${encodeURIComponent(location.pathname)}`} replace />
  }

  // Nothing drawn until the flag is known. `min-h` keeps the page from
  // collapsing to zero height and reading as a broken render.
  if (status === 'loading') {
    return <div className="min-h-[60vh]" aria-busy="true" />
  }

  if (!user?.is_admin) {
    return (
      <div className="mx-auto max-w-2xl px-4 pb-24 pt-28 sm:px-6">
        <div className="rounded-2xl border border-border bg-muted/30 px-6 py-16 text-center">
          <ShieldAlert className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
          <h1 className="mt-3 text-lg font-extrabold">این صفحه پیدا نشد</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            نشانی را بررسی کنید.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
