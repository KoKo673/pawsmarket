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
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">دسته‌بندی‌ها</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          تعدادها بر اساس شعاع جستجوی شما زنده به‌روز می‌شود
        </p>
      </div>

      <div className="space-y-9">
        {CATEGORY_GROUPS.map((group) => (
          <div key={group.id} data-motion-item>
            <div className="mb-3 flex items-baseline gap-2.5">
              <h3 className="text-base font-extrabold">{group.title}</h3>
              <p className="text-xs text-muted-foreground">{group.blurb}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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
                    className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 text-start shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lifted active:scale-[0.98]"
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
                      <span className="block truncate text-sm font-bold">{label}</span>
                      <span className="block text-xs font-medium text-muted-foreground">
                        {count > 0 ? `${faDigits(count)} مورد در اطراف` : 'کاوش کنید'}
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