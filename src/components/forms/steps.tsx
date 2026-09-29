import { Cat, Dog, Package } from 'lucide-react'

import { Dropzone, type DraftImage } from '@/components/forms/Dropzone'
import { Input, Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { faDigits } from '@/lib/fa'
import { cn } from '@/lib/utils'
import type { GeoPoint, ProductCategory, Species } from '@/types'

/**
 * مدل پیش‌نویس مشترک بین مراحل جادوگر ثبت آگهی.
 * `location` همان payload پست‌جی‌آی‌اس است: عرض/طول جغرافیایی از روی نقشه.
 */
export interface Draft {
  kind: 'pet' | 'product'
  name: string
  species: Species
  breed: string
  gender: 'male' | 'female'
  ageMonths: string
  price: string
  adoptable: boolean
  category: ProductCategory
  brand: string
  inStock: boolean
  description: string
  medical: string[]
  images: DraftImage[]
  address: string
  location: GeoPoint | null
}

export const EMPTY_DRAFT: Draft = {
  kind: 'pet',
  name: '',
  species: 'dog',
  breed: '',
  gender: 'male',
  ageMonths: '',
  price: '',
  adoptable: false,
  category: 'food',
  brand: '',
  inStock: true,
  description: '',
  medical: [],
  images: [],
  address: '',
  location: null,
}

export interface StepProps {
  draft: Draft
  update: (patch: Partial<Draft>) => void
}

/* ════════════════ مرحله ۱ · اطلاعات پایه ════════════════ */

export function StepBasics({ draft, update }: StepProps) {
  return (
    <div className="space-y-6">
      {/* انتخاب نوع */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { id: 'pet' as const, label: 'حیوان خانگی', desc: 'سرپرستی یا فروش', icon: Dog },
          { id: 'product' as const, label: 'محصول', desc: 'غذا، اسباب‌بازی، لوازم', icon: Package },
        ].map(({ id, label, desc, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => update({ kind: id })}
            className={cn(
              'flex items-center gap-3 rounded-2xl border-2 p-4 text-start transition-all active:scale-[0.98]',
              draft.kind === id
                ? 'border-primary bg-primary/5 shadow-glow'
                : 'border-border bg-card hover:border-primary/40',
            )}
          >
            <span
              className={cn(
                'grid size-11 place-items-center rounded-xl transition-colors',
                draft.kind === id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
              )}
            >
              <Icon className="size-5" />
            </span>
            <span>
              <span className="block text-sm font-extrabold">{label}</span>
              <span className="block text-xs text-muted-foreground">{desc}</span>
            </span>
          </button>
        ))}
      </div>

      {/* نام */}
      <div className="space-y-2">
        <Label htmlFor="draft-name">
          {draft.kind === 'pet' ? 'نام حیوان' : 'نام محصول'} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="draft-name"
          value={draft.name}
          onChange={(e) => update({ name: e.target.value })}
          placeholder={draft.kind === 'pet' ? 'مثلاً بیسکویت' : 'مثلاً غذای خشک توله سگ — ۳ کیلوگرم'}
        />
      </div>

      {draft.kind === 'pet' ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>گونه</Label>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: 'dog', label: 'سگ', icon: Dog },
                  { id: 'cat', label: 'گربه', icon: Cat },
                  { id: 'rabbit', label: 'خرگوش' },
                  { id: 'bird', label: 'پرنده' },
                  { id: 'fish', label: 'ماهی' },
                  { id: 'small', label: 'کوچک' },
                  { id: 'other', label: 'سایر' },
                ] as const
              ).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => update({ species: s.id })}
                  className={cn(
                    'rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95',
                    draft.species === s.id
                      ? 'border-primary bg-primary text-primary-foreground shadow-glow'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/40',
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="draft-breed">
              نژاد <span className="text-destructive">*</span>
            </Label>
            <Input
              id="draft-breed"
              value={draft.breed}
              onChange={(e) => update({ breed: e.target.value })}
              placeholder="مثلاً گلدن رتریور"
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="draft-category">دسته‌بندی</Label>
            <select
              id="draft-category"
              value={draft.category}
              onChange={(e) => update({ category: e.target.value as ProductCategory })}
              className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-input bg-card px-4 text-sm font-semibold shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="food">غذا</option>
              <option value="toy">اسباب‌بازی</option>
              <option value="health">سلامت</option>
              <option value="accessories">لوازم</option>
              <option value="grooming">آرایشی</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="draft-brand">برند</Label>
            <Input
              id="draft-brand"
              value={draft.brand}
              onChange={(e) => update({ brand: e.target.value })}
              placeholder="مثلاً هاروست گرینز"
            />
          </div>
        </div>
      )}
    </div>
  )
}

/* ════════════════ مرحله ۲ · جزئیات + عکس ════════════════ */

const MEDICAL_OPTIONS = ['vaccinated', 'sterilized', 'microchipped', 'needs-care', 'checkup-due'] as const

const MEDICAL_LABELS: Record<(typeof MEDICAL_OPTIONS)[number], string> = {
  vaccinated: 'واکسینه',
  sterilized: 'عقیم‌شده',
  microchipped: 'شناسه‌گذاری',
  'needs-care': 'نیاز به مراقبت',
  'checkup-due': 'چکاپ لازم',
}

export function StepDetails({ draft, update }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="draft-desc">
          توضیحات <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="draft-desc"
          value={draft.description}
          onChange={(e) => update({ description: e.target.value })}
          placeholder="خلق‌وخو، اسباب‌بازی مورد علاقه، رژیم غذایی — بگذارید کسی عاشقش شود…"
          rows={4}
        />
        <p className="text-end text-xs text-muted-foreground">
          {faDigits(draft.description.length)}/۶۰۰
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {draft.kind === 'pet' ? (
          <>
            <div className="space-y-2">
              <Label>جنسیت</Label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: 'male' as const, label: 'نر' },
                    { id: 'female' as const, label: 'ماده' },
                  ]
                ).map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => update({ gender: g.id })}
                    className={cn(
                      'h-11 rounded-xl border text-sm font-bold transition-all active:scale-[0.98]',
                      draft.gender === g.id
                        ? 'border-primary bg-primary/10 text-primary shadow-glow'
                        : 'border-border bg-card text-muted-foreground',
                    )}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="draft-age">
                سن (ماه) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="draft-age"
                type="number"
                min={0}
                value={draft.ageMonths}
                onChange={(e) => update({ ageMonths: e.target.value })}
                placeholder="مثلاً 8"
              />
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="draft-price">
                قیمت (تومان) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="draft-price"
                type="number"
                min={0}
                step="1000"
                value={draft.price}
                onChange={(e) => update({ price: e.target.value })}
                placeholder="مثلاً 2500000"
              />
            </div>
            <div className="flex items-end">
              <label className="flex h-11 w-full cursor-pointer items-center justify-between rounded-xl border border-border bg-card px-4 text-sm font-semibold shadow-soft">
                موجود در انبار
                <input
                  type="checkbox"
                  checked={draft.inStock}
                  onChange={(e) => update({ inStock: e.target.checked })}
                  className="size-4 accent-[hsl(var(--primary))]"
                />
              </label>
            </div>
          </>
        )}
      </div>

      {draft.kind === 'pet' && (
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="draft-price">قیمت (تومان) — صفر برای سرپرستی رایگان</Label>
            <Input
              id="draft-price"
              type="number"
              min={0}
              step="1000"
              value={draft.price}
              onChange={(e) => update({ price: e.target.value })}
              placeholder="مثلاً 0"
            />
          </div>
          <div className="space-y-2">
            <Label>وضعیت پزشکی</Label>
            <div className="flex flex-wrap gap-2">
              {MEDICAL_OPTIONS.map((flag) => {
                const active = draft.medical.includes(flag)
                return (
                  <button
                    key={flag}
                    type="button"
                    onClick={() =>
                      update({
                        medical: active ? draft.medical.filter((m) => m !== flag) : [...draft.medical, flag],
                      })
                    }
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs font-semibold transition-all active:scale-95',
                      active
                        ? 'border-accent bg-accent text-accent-foreground shadow-soft'
                        : 'border-border bg-card text-muted-foreground hover:border-accent/50',
                    )}
                  >
                    {MEDICAL_LABELS[flag]}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>
          عکس‌ها <span className="text-destructive">*</span>
        </Label>
        <Dropzone images={draft.images} onChange={(images) => update({ images })} />
      </div>
    </div>
  )
}
