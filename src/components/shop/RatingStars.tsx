import { Star } from 'lucide-react'

import { faDigits } from '@/lib/fa'

/**
 * امتیاز محصول — from the source's own rating, never invented.
 *
 * The rule this component enforces, and the reason it is a component
 * rather than inline markup in two places:
 *
 *   `rating === null` renders NOTHING.
 *
 * Roughly 60% of the catalogue has no rating at all (measured
 * 2026-11-17: 319 of 801 offers carry one). A card that shows «۰.۰» or
 * an empty star row for those tells the shopper "this was rated badly"
 * when the truth is "nobody rated it" — a different and much worse
 * statement. Absence has to look like absence.
 *
 * `count` is the number of ratings, shown in parentheses the way every
 * large storefront does: a 5.0 from 3 people and a 4.2 from 900 are not
 * the same claim.
 */
export function RatingStars({
  rating,
  count,
  size = 'sm',
  showCount = true,
}: {
  rating: number | null | undefined
  count?: number | null
  size?: 'sm' | 'md'
  showCount?: boolean
}) {
  if (rating === null || rating === undefined) return null

  const px = size === 'md' ? 'size-4' : 'size-3.5'
  // Round to the nearest half so the drawn stars agree with the number
  // beside them; a 4.3 rendered as five solid stars is a small lie the
  // eye catches.
  const rounded = Math.round(rating * 2) / 2

  return (
    <span className="inline-flex items-center gap-1" dir="ltr">
      <span className="inline-flex" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={
              px +
              (i <= rounded
                ? ' fill-amber-400 text-amber-400'
                : ' text-muted-foreground/30')
            }
          />
        ))}
      </span>
      <span className={size === 'md' ? 'text-sm font-bold' : 'text-xs font-bold'}>
        {faDigits(rating.toFixed(1))}
      </span>
      {showCount && count != null && count > 0 && (
        <span className="text-xs text-muted-foreground">
          ({faDigits(count)})
        </span>
      )}
      {/* The visual stars are decorative; this is what a screen reader
          announces, because "five unlabelled icons" is not a rating. */}
      <span className="sr-only">
        امتیاز {faDigits(rating.toFixed(1))} از ۵
        {count != null && count > 0 ? ` از ${faDigits(count)} رأی` : ''}
      </span>
    </span>
  )
}
