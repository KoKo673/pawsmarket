import { forwardRef, type HTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

/** Loading placeholder with a slow, calming shimmer. */
export const Skeleton = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('animate-pulse rounded-xl bg-muted', className)}
    {...props}
  />
))
Skeleton.displayName = 'Skeleton'
