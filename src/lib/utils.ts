import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Class-name merge helper (shadcn convention).
 * `clsx` handles conditionals; `tailwind-merge` resolves conflicting
 * utilities so later classes always win (`cn('p-2', 'p-4') === 'p-4'`).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Base-aware asset URL.
 * Production (GitHub Pages) serves under `/pawsmarket/`, so root-absolute
 * `/images/...` paths would 404. BASE_URL is "/" in dev and
 * "/pawsmarket/" in the published build — always join through this.
 */
export const asset = (path: string): string =>
  `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`
