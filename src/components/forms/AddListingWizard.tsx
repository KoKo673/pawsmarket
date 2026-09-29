import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Loader2, PawPrint, Rocket } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { EMPTY_DRAFT, StepBasics, StepDetails, type Draft } from '@/components/forms/steps'
import { StepLocation } from '@/components/forms/StepLocation'
import { StepReview } from '@/components/forms/StepReview'
import { Button } from '@/components/ui/button'
import { createListing } from '@/lib/api'
import { faDigits } from '@/lib/fa'
import { cn } from '@/lib/utils'
import type { MedicalFlag, NewListingDraft } from '@/types'

const STEPS = [
  { title: 'پایه', hint: 'نوع و نام' },
  { title: 'جزئیات', hint: 'عکس و اطلاعات' },
  { title: 'مکان', hint: 'سنجاق روی نقشه' },
  { title: 'بررسی', hint: 'انتشار' },
] as const

/** اعتبارسنجی هر مرحله؛ آرایه‌ی خالی = مرحله معتبر است. */
function validateStep(step: number, draft: Draft): string[] {
  const errors: string[] = []
  if (step === 0) {
    if (!draft.name.trim()) errors.push('به آگهی‌ات یک نام بده.')
    if (draft.kind === 'pet' && !draft.breed.trim()) errors.push('نژاد برای حیوان خانگی الزامی است.')
  }
  if (step === 1) {
    if (draft.description.trim().length < 15) errors.push('توضیحات باید حداقل ۱۵ حرف باشد.')
    if (draft.images.length === 0) errors.push('حداقل یک عکس اضافه کن.')
    if (draft.price === '' || Number.isNaN(Number(draft.price)) || Number(draft.price) < 0) {
      errors.push('قیمت معتبر وارد کن (صفر برای سرپرستی رایگان).')
    }
    if (draft.kind === 'pet' && (draft.ageMonths === '' || Number(draft.ageMonths) < 0)) {
      errors.push('سن به ماه الزامی است.')
    }
  }
  if (step === 2) {
    if (!draft.address.trim()) errors.push('آدرس خیابان الزامی است.')
    if (!draft.location) errors.push('روی نقشه یک نقطه بگذار.')
  }
  return errors
}

function buildPayload(draft: Draft): NewListingDraft {
  const base = {
    name: draft.name.trim(),
    description: draft.description.trim(),
    images: draft.images.map((img) => img.url),
    address: draft.address.trim(),
    location: draft.location!,
    price: Number(draft.price),
  }

  return draft.kind === 'pet'
    ? {
        ...base,
        kind: 'pet',
        species: draft.species,
        breed: draft.breed.trim(),
        ageMonths: Number(draft.ageMonths),
        gender: draft.gender,
        adoptable: Number(draft.price) === 0,
        medical: draft.medical as MedicalFlag[],
        ownerName: 'شما',
      }
    : {
        ...base,
        kind: 'product',
        category: draft.category,
        brand: draft.brand.trim() || 'بدون برند',
        inStock: draft.inStock,
        storeName: 'فروشگاه شما',
      }
}

/**
 * جادوگر چهارمرحله‌ای ثبت آگهی:
 *   پایه → جزئیات و عکس → پین مکان → بازبینی و انتشار
 * جابه‌جایی مراحل با اسلاید افقی (AnimatePresence)؛ نشانگر مرحله فعال
 * با یک `layoutId` مشترک حرکت می‌کند.
 */
export function AddListingWizard() {
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [errors, setErrors] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const update = (patch: Partial<Draft>) => {
    setDraft((prev) => ({ ...prev, ...patch }))
    setErrors([]) // با هر ویرایش، خطاهای کهنه پاک شوند
  }

  const goNext = () => {
    const errs = validateStep(step, draft)
    if (errs.length > 0) {
      setErrors(errs)
      return
    }
    setErrors([])
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const goBack = () => {
    setErrors([])
    setStep((s) => Math.max(s - 1, 0))
  }

  const submit = async () => {
    const allErrors = [0, 1, 2].flatMap((s) => validateStep(s, draft))
    if (allErrors.length > 0) {
      // برگشت به اولین مرحله‌ی خطادار
      const firstBad = [0, 1, 2].find((s) => validateStep(s, draft).length > 0) ?? 0
      setStep(firstBad)
      setErrors(validateStep(firstBad, draft))
      return
    }
    setSubmitting(true)
    try {
      await createListing(buildPayload(draft))
      setSuccess(true)
    } catch (err) {
      setErrors([
        'خطایی در انتشار پیش آمد — بک‌اند پاسخ نداد.',
        err instanceof Error ? err.message : '',
      ].filter(Boolean))
    } finally {
      setSubmitting(false)
    }
  }

  /* ── صفحه‌ی موفقیت ── */
  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', bounce: 0.35, duration: 0.6 }}
        className="flex flex-col items-center rounded-3xl bg-card p-10 text-center shadow-lifted"
      >
        <span className="grid size-20 place-items-center rounded-full bg-accent/15 text-accent">
          <CheckCircle2 className="size-10" />
        </span>
        <h2 className="mt-6 text-2xl font-extrabold tracking-tight">آگهی منتشر شد!</h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          «{draft.name}» داخل شعاع شما فعال شد — پاسخ از بک‌اند پازمارکت دریافت شد.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/explore">
              <PawPrint className="size-4" />
              مشاهده روی نقشه
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              setDraft(EMPTY_DRAFT)
              setStep(0)
              setSuccess(false)
            }}
          >
            ثبت آگهی دیگر
          </Button>
        </div>
      </motion.div>
    )
  }

  /* ── جادوگر ── */
  return (
    <div className="overflow-hidden rounded-3xl bg-card shadow-lifted">
      {/* سربرگ مراحل */}
      <div className="border-b border-border/70 px-5 py-5 sm:px-8">
        <ol className="flex items-center">
          {STEPS.map((s, i) => {
            const done = i < step
            const active = i === step
            return (
              <li key={s.title} className={cn('flex items-center', i > 0 && 'flex-1')}>
                {i > 0 && (
                  <span
                    className={cn(
                      'mx-2 h-0.5 flex-1 rounded-full transition-colors duration-300 sm:mx-4',
                      i <= step ? 'bg-primary' : 'bg-muted',
                    )}
                  />
                )}
                <div className="flex flex-col items-center gap-1.5">
                  <span
                    className={cn(
                      'relative grid size-9 place-items-center rounded-full text-xs font-extrabold transition-all duration-300',
                      done && 'bg-primary text-primary-foreground',
                      active && 'bg-primary text-primary-foreground shadow-glow',
                      !done && !active && 'bg-muted text-muted-foreground',
                    )}
                  >
                    {done ? <Check className="size-4" /> : faDigits(i + 1)}
                    {active && (
                      <motion.span
                        layoutId="step-ring"
                        className="absolute -inset-1 rounded-full border-2 border-primary/40"
                        transition={{ type: 'spring', bounce: 0.3, duration: 0.5 }}
                      />
                    )}
                  </span>
                  <span
                    className={cn(
                      'hidden text-[11px] font-bold sm:block',
                      active ? 'text-primary' : 'text-muted-foreground',
                    )}
                  >
                    {s.title}
                  </span>
                </div>
              </li>
            )
          })}
        </ol>
      </div>

      {/* بدنه‌ی مرحله */}
      <div className="min-h-96 px-5 py-7 sm:px-8">
        {/*
          popLayout (نه "wait"): مرحله‌ی جدید فوری mount می‌شود و مرحله‌ی
          قبلی از جریان خارج می‌شود — حتی اگر انیمیشن خروج عقب بیفتد،
          محتوا هرگز پشت آن گیر نمی‌کند.
        */}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -32 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="mb-5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              مرحله‌ی {faDigits(step + 1)} از {faDigits(4)} · {STEPS[step].hint}
            </p>

            {step === 0 && <StepBasics draft={draft} update={update} />}
            {step === 1 && <StepDetails draft={draft} update={update} />}
            {step === 2 && <StepLocation draft={draft} update={update} />}
            {step === 3 && <StepReview draft={draft} />}
          </motion.div>
        </AnimatePresence>

        {/* خطاهای اعتبارسنجی */}
        <AnimatePresence>
          {errors.length > 0 && (
            <motion.ul
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-5 space-y-1.5 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3"
            >
              {errors.map((err) => (
                <li key={err} className="flex items-center gap-2 text-sm font-semibold text-destructive">
                  <span className="size-1.5 shrink-0 rounded-full bg-destructive" />
                  {err}
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      {/* ناوبری پایین — در RTL «ادامه» به سمت چپ و «بازگشت» به راست */}
      <div className="flex items-center justify-between gap-3 border-t border-border/70 bg-muted/30 px-5 py-4 sm:px-8">
        <Button variant="ghost" onClick={goBack} disabled={step === 0 || submitting} className="gap-1.5">
          بازگشت
          <ArrowRight className="size-4" />
        </Button>

        {step < STEPS.length - 1 ? (
          <Button onClick={goNext} className="gap-1.5">
            ادامه
            <ArrowLeft className="size-4" />
          </Button>
        ) : (
          <Button onClick={submit} size="lg" className="gap-2" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                در حال انتشار…
              </>
            ) : (
              <>
                <Rocket className="size-4" />
                انتشار آگهی
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
