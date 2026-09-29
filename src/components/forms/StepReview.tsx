import { CheckCircle2, Image as ImageIcon, MapPin, Pencil } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { faDigits, faPrice } from '@/lib/fa'
import { formatAge } from '@/lib/geo'
import type { Draft } from './steps'

const ROW_CLASS = 'flex items-start justify-between gap-4 border-b border-border/60 py-3 last:border-0'

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className={ROW_CLASS}>
      <span className="shrink-0 text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-end text-sm font-semibold">{value}</span>
    </div>
  )
}

const CATEGORY_FA: Record<string, string> = {
  food: 'غذا',
  toy: 'اسباب‌بازی',
  health: 'سلامت',
  accessories: 'لوازم',
  grooming: 'آرایشی',
}

/**
 * بازبینی نهایی — همه‌ی چیزی که ارسال می‌شود، در یک نگاه.
 * دکمه‌ی انتشار در بدنه‌ی جادوگر است (نه اینجا).
 */
export function StepReview({ draft }: { draft: Draft }) {
  return (
    <div className="space-y-5">
      {/* کاور + عنوان */}
      <div className="flex items-center gap-4 rounded-2xl border border-border/70 bg-muted/40 p-4">
        {draft.images[0] ? (
          <img
            src={draft.images[0].url}
            alt=""
            className="size-20 shrink-0 rounded-xl object-cover shadow-soft"
          />
        ) : (
          <span className="grid size-20 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
            <ImageIcon className="size-7" />
          </span>
        )}
        <div className="min-w-0">
          <Badge variant={draft.kind === 'pet' ? 'default' : 'accent'}>
            {draft.kind === 'pet' ? 'حیوان' : 'محصول'}
          </Badge>
          <h3 className="mt-1.5 truncate text-lg font-extrabold">{draft.name || 'بدون عنوان'}</h3>
          <p className="truncate text-xs text-muted-foreground">
            {draft.kind === 'pet'
              ? `${draft.breed} · ${draft.species === 'dog' ? 'سگ' : draft.species === 'cat' ? 'گربه' : 'حیوان'}`
              : `${draft.brand || 'بدون برند'} · ${CATEGORY_FA[draft.category] ?? draft.category}`}
          </p>
        </div>
      </div>

      {/* اطلاعات */}
      <div className="rounded-2xl border border-border/70 px-4">
        {draft.kind === 'pet' ? (
          <>
            <Row label="سن" value={draft.ageMonths ? formatAge(Number(draft.ageMonths)) : '—'} />
            <Row label="جنسیت" value={draft.gender === 'male' ? 'نر' : 'ماده'} />
            <Row label="قیمت" value={faPrice(Number(draft.price) || 0, 'سرپرستی رایگان')} />
            <Row
              label="وضعیت پزشکی"
              value={
                draft.medical.length > 0 ? (
                  <span className="flex flex-wrap justify-end gap-1.5">
                    {draft.medical.map((m) => (
                      <Badge key={m} variant="outline">
                        {m === 'vaccinated'
                          ? 'واکسینه'
                          : m === 'sterilized'
                            ? 'عقیم‌شده'
                            : m === 'microchipped'
                              ? 'شناسه‌گذاری'
                              : m === 'needs-care'
                                ? 'نیاز به مراقبت'
                                : 'چکاپ لازم'}
                      </Badge>
                    ))}
                  </span>
                ) : (
                  '—'
                )
              }
            />
          </>
        ) : (
          <>
            <Row label="دسته" value={CATEGORY_FA[draft.category] ?? draft.category} />
            <Row label="برند" value={draft.brand || '—'} />
            <Row label="قیمت" value={faPrice(Number(draft.price) || 0)} />
            <Row label="موجودی" value={draft.inStock ? 'موجود' : 'ناموجود'} />
          </>
        )}

        <Row label="عکس‌ها" value={`${faDigits(draft.images.length)} تصویر`} />
        <Row
          label="آدرس"
          value={
            <span className="inline-flex max-w-56 items-start gap-1">
              <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" />
              <span className="truncate">{draft.address || '—'}</span>
            </span>
          }
        />
        <Row
          label="مختصات"
          value={
            draft.location ? (
              <span className="ltr-inline font-mono text-xs">
                {faDigits(draft.location.lat.toFixed(5))}, {faDigits(draft.location.lng.toFixed(5))}
              </span>
            ) : (
              '—'
            )
          }
        />
      </div>

      {/* توضیحات */}
      <div className="rounded-2xl border border-border/70 p-4">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Pencil className="size-3.5" />
          توضیحات
        </div>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
          {draft.description || '—'}
        </p>
      </div>

      <p className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3.5 py-2 text-xs font-semibold text-accent">
        <CheckCircle2 className="size-4" />
        آماده‌ی انتشار — هر زمان بخواهید می‌توانید ویرایش یا حذفش کنید.
      </p>
    </div>
  )
}
