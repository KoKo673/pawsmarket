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
/*
 * Turned back on 2026-10-29, in the commit that made the ids agree.
 *
 * The condition this waited for is now met and measured: catalog.json is
 * generated from the database by app/export_catalog.py, and a live check
 * compared the two:
 *
 *     catalog ids 447 · api ids 447 · intersection 447
 *     only in catalog 0 · only in api 0
 *
 * Before that the snapshot held ids 1-761 from an October export while
 * /stores/nearby returned ids like 10102 for the same businesses, so 0 of
 * 218 shared ids named the same business — a booking could land on an
 * unrelated clinic. That is why the whole route was shut, not just the
 * button: a hidden button with a live URL is not a closed door.
 *
 * The guard in BookingPage stays. It now protects against the id-mismatch
 * class returning (a stale snapshot shipped by mistake), which is still
 * possible even with one source today.
 */
export const BOOKING_ENABLED = true

/** True when this category may be booked at all. */
export function isBookableCategory(category: string | undefined): boolean {
  return BOOKABLE.includes(category as (typeof BOOKABLE)[number])
}
