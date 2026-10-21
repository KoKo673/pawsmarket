/**
 * What may be booked, and whether booking is open at all.
 *
 * Lives in one place because two very different surfaces enforce it: the
 * detail sheet decides whether to show the button, and the booking page
 * decides whether to render a form. When those two carried their own copies
 * they disagreed — the button was hidden while /booking/:storeId still
 * rendered the form and posted it.
 */

/** The four categories the server accepts (`bookings.py:126`). */
export const BOOKABLE = ['vet', 'groomer', 'boarding', 'shelter'] as const

/**
 * ⛔ TEMPORARILY OFF — the catalog and the API name different businesses
 * with the same id.
 *
 * Measured against the live site: the snapshot built itself while the
 * database was unreachable, numbering stores by their position in
 * `seed_real.sql`; the database was separately restored from an older
 * dump. 0 of 218 shared ids carry the same name.
 *
 * Both surfaces gate on this, not just the button: a hidden button with a
 * live URL is not a closed door. A booking that silently lands on an
 * unrelated clinic is worse than no booking at all, because the visitor
 * believes it succeeded.
 *
 * Turn this back on in the commit that makes the ids agree — not before.
 */
export const BOOKING_ENABLED = false

/** True when this category may be booked at all. */
export function isBookableCategory(category: string | undefined): boolean {
  return BOOKABLE.includes(category as (typeof BOOKABLE)[number])
}
