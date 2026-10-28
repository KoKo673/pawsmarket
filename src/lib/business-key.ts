/**
 * Identity of a business, independent of which row it arrived in.
 *
 * ── What the id alone got wrong ──────────────────────────────────────────
 * `catalog.json` is a build-time export; the database keeps growing. The
 * snapshot holds ids 1-761 from a 447-store era, while /stores/nearby returns
 * the same businesses with ids like 10102. Matching only on `id` therefore
 * found no overlap at all and appended a second copy of every one of them:
 * measured, 431 of 447 stores rendered twice — «بیمارستان تخصصی دانشکده
 * دامپزشکی دانشگاه تهران» twice on the home page, at the same distance.
 *
 * A business is identified by what it *is*, not by the row it happens to sit
 * in: the same name at the same coordinates is the same shop. Coordinates are
 * rounded to 4 decimals (~11 m), which absorbs the float drift between the
 * export and a fresh read without merging two neighbours on one street.
 *
 * ── Why this lives in its own file ───────────────────────────────────────
 * So the rule can be tested without loading the module it is used from.
 * `api.ts` pulls in ten imports, half of them path-aliased, and the test
 * runner does not resolve `@/` aliases — importing it just to reach this
 * function made the test fail on module resolution rather than on the
 * function, which is the wrong reason for a test to fail.
 *
 * This function has no imports on purpose. Keep it that way.
 */
export function businessKey(row: {
  name?: unknown
  lat?: unknown
  lng?: unknown
}): string {
  const name = String(row.name ?? '').trim().replace(/\s+/g, ' ')
  const lat = Number(row.lat ?? 0).toFixed(4)
  const lng = Number(row.lng ?? 0).toFixed(4)
  return `${name}|${lat}|${lng}`
}
