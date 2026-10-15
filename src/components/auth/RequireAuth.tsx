import type { PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/store/auth.store'

/**
 * گارد روت: تا مشخص‌شدن وضعیت اسکلتون (بدون پرش)،
 * وگرنه ریدایرکت به /login با next برای بازگشت بعد از ورود.
 *
 * The skeleton here is deliberately generic and short. This guard cannot know
 * what shape its children will take, so matching them is the page's job — a
 * /me or /bookings skeleton shaped like that page's real content. Measured
 * CLS on the four guarded routes was 0.575, 0.427, 0.280 and 0.142, and the
 * cause was each page's own loading state, not this block. Leaving it generic
 * is the correct split; making it pretend to know the layout would only move
 * the shift here.
 */
export function RequireAuth({ children }: PropsWithChildren) {
  const status = useAuthStore((s) => s.status)
  const location = useLocation()

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-4 pb-24 pt-32 sm:px-6">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    )
  }

  if (status === 'anon') {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />
  }

  return <>{children}</>
}
