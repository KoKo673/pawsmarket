import { AddListingWizard } from '@/components/forms/AddListingWizard'

export function AddPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-20 pt-28 sm:px-6">
      <header data-motion-section className="mb-8 text-center">
        <span data-motion-item className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary">
          حدود ۲ دقیقه وقت می‌گیرد
        </span>
        <h1 data-motion-item className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
          ثبت حیوان خانگی یا محصول
        </h1>
        <p data-motion-item className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          چهار مرحله‌ی ساده — عکس، اطلاعات و یک پین دقیق روی نقشه برای جستجوی مکانی.
        </p>
      </header>

      <AddListingWizard />
    </div>
  )
}
