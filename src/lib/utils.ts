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
