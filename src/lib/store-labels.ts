/**
 * The Persian name of each store category code.
 *
 * Lives in lib, not in a component, because two unrelated things need it:
 * `ListingCard` shows it on the badge, and `search.ts` matches against it.
 * A visitor types «دامپزشکی», never «vet» — `item.category` holds the code,
 * so without this list that word can match nothing. Importing it from the
 * card component would drag React and the icon set into the search path for
 * six short strings.
 */
export const STORE_LABEL: Record<string, string> = {
  vet: 'دامپزشکی',
  groomer: 'آرایشگاه',
  boarding: 'پانسیون',
  shelter: 'پناهگاه',
  shop: 'فروشگاه',
  cafe: 'کافه',
}

/** Category code → its Persian label, or '' when unknown. */
export function storeLabel(code: string | undefined | null): string {
  return (code && STORE_LABEL[code]) || ''
}
