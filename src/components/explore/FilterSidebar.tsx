import { Bone, Heart, Home, PawPrint, SlidersHorizontal, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { faDigits, faPriceShort } from '@/lib/fa'
import { CATEGORY_GROUPS, type CategoryTile } from '@/lib/taxonomy'
import { cn } from '@/lib/utils'
import { useFavoritesStore } from '@/store/favorites.store'
import { useFiltersStore } from '@/store/filters.store'
import { useUiStore } from '@/store/ui.store'
import type { ListingKind, ProductCategory, Species, StoreCategory } from '@/types'

const KIND_CHIPS: Array<{ id: ListingKind; label: string; icon: LucideIcon }> = [
  { id: 'pet', label: 'حیوانات', icon: PawPrint },
  { id: 'product', label: 'محصولات', icon: Bone },
  { id: 'store', label: 'خدمات و فروشگاه‌ها', icon: Home },
]

/** برچسب مقادیر قیمت (تومان) با خلاصه‌سازی میلیونی */
const priceLabel = (v: number, isMax: boolean) =>
  isMax && v >= 8_000_000 ? `${faPriceShort(v)}+` : faPriceShort(v)

/* ── نگاشت کاشی دسته‌بندی به فیلترهای واقعی ─────────────────────
   A tile's id is a Species in the حیوانات pillar and a Product/Store
   category in the other two, so the sidebar has to know which list to
   toggle. Reading it off the tile's own preset keeps the two in step
   instead of hard-coding a third mapping here. */

function tileFacetIds(tile: CategoryTile): Species[] {
  return (tile.preset.species ?? []) as Species[]
}

function tileCategoryIds(tile: CategoryTile): (ProductCategory | StoreCategory)[] {
  return (tile.preset.categories ?? []) as (ProductCategory | StoreCategory)[]
}

function isTileActive(
  tile: CategoryTile,
  state: { species: Species[]; categories: (ProductCategory | StoreCategory)[] },
): boolean {
  const species = tileFacetIds(tile)
  const cats = tileCategoryIds(tile)
  if (species.length === 0 && cats.length === 0) return false
  return (
    species.every((s) => state.species.includes(s)) &&
    cats.every((c) => state.categories.includes(c))
  )
}

function toggleTile(
  tile: CategoryTile,
  toggleSpecies: (s: Species) => void,
  toggleCategory: (c: ProductCategory | StoreCategory) => void,
) {
  for (const s of tileFacetIds(tile)) toggleSpecies(s)
  for (const c of tileCategoryIds(tile)) toggleCategory(c)
}

/* ── دکمه‌ی چیپ ───────────────────────────────────────────────── */

function Chip({
  active,
  onClick,
  icon: Icon,
  children,
  tint,
}: {
  active: boolean
  onClick: () => void
  icon: LucideIcon
  children: React.ReactNode
  /** Colour that stays legible once the chip fills with the brand colour. */
  tint?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        // Inline-flex with no max-width: a `truncate` here clipped chips to
        // «خرگوش و ...», which names a category nobody can pick.
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-150 active:scale-95',
        active
          ? 'border-primary bg-primary text-primary-foreground shadow-glow'
          : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground',
      )}
    >
      <Icon className={cn('size-3.5', !active && tint)} />
      {children}
    </button>
  )
}

/* ── محتوای پنل (مشترک بین ریل دسکتاپ و شیت موبایل) ─────────── */

function FilterPanel() {
  const {
    radiusKm,
    priceRange,
    kinds,
    species,
    categories,
    sort,
    favoritesOnly,
    setRadiusKm,
    setPriceRange,
    setSort,
    setFavoritesOnly,
    toggleKind,
    toggleSpecies,
    toggleCategory,
    resetFilters,
  } = useFiltersStore()
  const favCount = useFavoritesStore((s) => s.ids.length)

  const activeCount =
    kinds.length + species.length + categories.length + (radiusKm !== 10 ? 1 : 0) + (favoritesOnly ? 1 : 0)

  return (
    <div className="space-y-7 p-5">
      {/* سربرگ */}
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-extrabold">
          <SlidersHorizontal className="size-4 text-primary" />
          فیلترها
          {activeCount > 0 && (
            <span className="grid size-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {faDigits(activeCount)}
            </span>
          )}
        </h2>
        <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={resetFilters}>
          <X className="size-3.5" />
          پاک کردن
        </Button>
      </div>

      {/* فقط ذخیره‌شده‌ها */}
      <button
        type="button"
        onClick={() => setFavoritesOnly(!favoritesOnly)}
        aria-pressed={favoritesOnly}
        className={cn(
          'flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-bold transition-all active:scale-[0.98]',
          favoritesOnly
            ? 'border-primary bg-primary/10 text-primary shadow-glow'
            : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground',
        )}
      >
        <span className="inline-flex items-center gap-2">
          <Heart className={cn('size-4', favoritesOnly && 'fill-current')} />
          فقط ذخیره‌شده‌ها
        </span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
          {faDigits(favCount)}
        </span>
      </button>

      {/* نوع آگهی — the three pillars, shown alone */}
      <section>
        <Label className="mb-3 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
          نمایش
        </Label>
        <div className="flex flex-wrap gap-2">
          {KIND_CHIPS.map((chip) => (
            <Chip
              key={chip.id}
              active={kinds.includes(chip.id)}
              onClick={() => toggleKind(chip.id)}
              icon={chip.icon}
            >
              {chip.label}
            </Chip>
          ))}
        </div>
      </section>

      {/* ── سه ستون دسته‌بندی ──
          The sidebar used to show one flat row mixing «دامپزشک» with «غذا»
          under a generic «دسته‌بندی» heading, which read as if a clinic and a
          bag of kibble were the same sort of thing. Each pillar is now
          labelled and only offers its own facets, matching the home grid. */}
      {CATEGORY_GROUPS.map((group) => (
        <section key={group.id}>
          <div className="mb-1 flex items-baseline gap-2">
            <h3 className="text-sm font-extrabold">{group.title}</h3>
            <p className="text-[11px] text-muted-foreground">{group.blurb}</p>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {group.tiles
              /* «سرپرستی» is a navigation shortcut, not a filter — the store
                 has no adoptable facet, so it is not offered as a chip. */
              .filter((tile) => tile.id !== 'adoptable')
              .map((tile) => (
                <Chip
                  key={tile.id}
                  active={isTileActive(tile, { species, categories })}
                  onClick={() => toggleTile(tile, toggleSpecies, toggleCategory)}
                  icon={tile.icon}
                  tint={tile.tint}
                >
                  {tile.label}
                </Chip>
              ))}
          </div>
        </section>
      ))}

      {/* شعاع جستجو */}
      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <Label htmlFor="radius" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            شعاع جستجو
          </Label>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-extrabold text-primary">
            تا {faDigits(radiusKm)} کیلومتر
          </span>
        </div>
        <Slider
          id="radius"
          value={[radiusKm]}
          onValueChange={([v]) => setRadiusKm(v)}
          min={0.5}
          max={30}
          step={0.5}
          aria-label="شعاع جستجو به کیلومتر"
        />
        <div className="mt-1 flex justify-between text-[10px] font-medium text-muted-foreground">
          <span>۰٫۵ کیلومتر</span>
          <span>۳۰ کیلومتر</span>
        </div>
      </section>

      {/* محدوده‌ی قیمت (تومان) */}
      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <Label htmlFor="price" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            محدوده‌ی قیمت
          </Label>
          {/* Same fix as the other tide badges: 600 on a 10% tide wash is
              2.94:1, 800 makes it 5.93:1. Dark keeps tide-400. */}
          <span className="rounded-full bg-tide-500/10 px-2.5 py-0.5 text-xs font-extrabold text-tide-800 dark:text-tide-400">
            {priceLabel(priceRange[0], false)} تا {priceLabel(priceRange[1], true)} تومان
          </span>
        </div>
        <Slider
          id="price"
          value={priceRange}
          onValueChange={([min, max]) => setPriceRange([min, max])}
          min={0}
          max={8_000_000}
          step={250_000}
          aria-label="محدوده‌ی قیمت به تومان"
        />
        <div className="mt-1 flex justify-between text-[10px] font-medium text-muted-foreground">
          <span>{faDigits(0)} تومان</span>
          <span>{faDigits(8)} میلیون+</span>
        </div>
      </section>

      {/* مرتب‌سازی */}
      <section>
        <Label
          htmlFor="sort"
          className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground"
        >
          مرتب‌سازی
        </Label>
        <select
          id="sort"
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-input bg-card px-4 text-sm font-semibold shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="distance">نزدیک‌ترین</option>
          <option value="price-asc">کمترین قیمت</option>
          <option value="price-desc">بیشترین قیمت</option>
          <option value="newest">جدیدترین آگهی‌ها</option>
        </select>
      </section>
    </div>
  )
}

/* ── ریل دسکتاپ ───────────────────────────────────────────────── */

export function FilterSidebar() {
  return (
    <aside className="hidden h-full overflow-y-auto border-r border-border bg-card/40 lg:block">
      <FilterPanel />
    </aside>
  )
}

/* ── شیت پایین موبایل ────────────────────────────────────────── */

export function FilterSheet() {
  const open = useUiStore((s) => s.filterDrawerOpen)
  const setOpen = useUiStore((s) => s.setFilterDrawerOpen)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-none">
        <DialogHeader>
          <DialogTitle className="sr-only">فیلترها</DialogTitle>
        </DialogHeader>
        <FilterPanel />
        <div className="sticky bottom-0 -mx-6 -mb-6 border-t border-border bg-card px-6 py-4 pb-safe">
          <Button className="w-full" onClick={() => setOpen(false)}>
            نمایش نتایج
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
