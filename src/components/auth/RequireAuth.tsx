import type { PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/store/auth.store'

/**
 * گارد روت: تا مشخص‌شدن وضعیت اسکلتون (بدون پرش)،
 * وگرنه ریدایرکت به /login با next برای بازگشت بعد از ورود.
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
