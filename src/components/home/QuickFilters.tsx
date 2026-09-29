import { Cat, Dog, Home, Scissors, ShoppingBasket, Stethoscope } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { cn } from '@/lib/utils'
import { useFiltersStore } from '@/store/filters.store'
import type { Filters } from '@/types'

/** هر چیپ یک پیش‌مجموعه‌ی فیلتر منسجم می‌سازد و به صفحه‌ی کاوش می‌رود. */
const PILLS: Array<{
  label: string
  icon: typeof Dog
  preset: Partial<Filters>
}> = [
  { label: 'سگ‌های نزدیک', icon: Dog, preset: { kinds: ['pet'], species: ['dog'] } },
  { label: 'گربه‌ها', icon: Cat, preset: { kinds: ['pet'], species: ['cat'] } },
  { label: 'غذای حیوان', icon: ShoppingBasket, preset: { kinds: ['product'], categories: ['food'], query: '' } },
  { label: 'دامپزشکان', icon: Stethoscope, preset: { kinds: ['store'], categories: ['vet'] } },
  { label: 'آرایشگاه‌ها', icon: Scissors, preset: { kinds: ['store'], categories: ['groomer'] } },
  { label: 'پناهگاه‌ها', icon: Home, preset: { kinds: ['store'], categories: ['shelter'] } },
]

/** ردیف فیلترهای سریع زیر نوار جستجو (اسکن افقی در موبایل). */
export function QuickFilters() {
  const navigate = useNavigate()
  const applyPreset = useFiltersStore((s) => s.applyPreset)

  return (
    <div className="no-scrollbar -mx-4 flex w-full gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0">
      {PILLS.map(({ label, icon: Icon, preset }) => (
        <button
          key={label}
          type="button"
          onClick={() => {
            applyPreset(preset)
            navigate('/explore')
          }}
          className={cn(
            'chip shrink-0 border border-border bg-card/80 text-foreground backdrop-blur',
            'shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary hover:shadow-glow',
            'active:scale-95',
          )}
        >
          <Icon className="size-4 text-primary" />
          {label}
        </button>
      ))}
    </div>
  )
}
