import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import { useNearbyListings } from '@/hooks/use-listings'
import { faDigits } from '@/lib/fa'
import { CATEGORY_GROUPS, countTiles } from '@/lib/taxonomy'
import { cn } from '@/lib/utils'
import { useFiltersStore } from '@/store/filters.store'

export function CategoryGrid() {
  const navigate = useNavigate()
  const applyPreset = useFiltersStore((s) => s.applyPreset)
  const { data } = useNearbyListings()
  const listings = data ?? []

  const counts = useMemo(() => countTiles(listings), [listings])

  return (
    <section data-motion-section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          دسته‌بندی‌ها
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          سه گروه اصلی: حیوانات، محصولات و خدمات — تعدادها با جستجوی شما
          به‌روز می‌شوند
        </p>
      </div>

      <div className="space-y-9">
        {CATEGORY_GROUPS.map((group) => (
          <div key={group.id} data-motion-item>
            <div className="mb-3 flex items-baseline gap-2.5">
              <h3 className="text-base font-extrabold">{group.title}</h3>
              <p className="text-xs text-muted-foreground">{group.blurb}</p>
            </div>
            {/*
              auto-fit, not a fixed four.

              With `lg:grid-cols-4` and six tiles the second row holds two
              and leaves two empty cells — measured on production as a 4+2
              split for «حیوانات» and 4+1 for «محصولات», which reads as a
              broken row rather than a group. The tile count per group is
              not a multiple of four and should not have to be, so the
              track count is left to the content: the browser fits as many
              `12rem` columns as will go, and the tiles stretch to fill.
            */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(12rem,1fr))]">
              {group.tiles.map((tile, i) => {
                const { label, icon: Icon, tint, preset } = tile
                const count = counts.get(tile) ?? 0
                return (
                  <button
                    key={tile.id}
                    type="button"
                    onClick={() => {
                      applyPreset(preset)
                      navigate('/explore')
                    }}
                    style={{ animationDelay: `${i * 60}ms` }}
                    /* Stacked on phones: a 2-up grid leaves ~7rem beside the 44px icon, and any
   label longer than one line was either clipped or squeezed. Full-width rows
   on a phone give the Persian names room to breathe; the icon moves above the
   text so it stays a clear anchor rather than eating horizontal space. */
className="group flex flex-col items-start gap-2.5 rounded-2xl border border-border/60 bg-card p-4 text-start shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lifted active:scale-[0.98] sm:flex-row sm:items-center sm:gap-3"
                  >
                    <span
                      className={cn(
                        'grid size-11 shrink-0 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110',
                        tint,
                      )}
                    >
                      <Icon className="size-5" />
                    </span>
                    <span className="min-w-0">
                      {/* No `truncate`: on the 2-up mobile grid it clipped
                          every multi-word label to «خرگوش و ...» — the tile
                          then named a category nobody could identify. Labels
                          wrap to a second line instead. */}
                      <span className="block text-sm font-bold leading-snug">{label}</span>
                      <span className="mt-0.5 block text-xs font-medium leading-snug text-muted-foreground">
                        {count > 0
                          ? `${faDigits(count)} مورد در محدوده`
                          : 'مشاهده‌ی موارد'}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}