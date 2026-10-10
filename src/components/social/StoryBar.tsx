import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { faDigits } from '@/lib/fa'
import { mediaUrl, socialApi, type Story } from '@/lib/social-api'
import { cn } from '@/lib/utils'

/**
 * نوار استوری پروفایل — حلقه‌ی گرادیانی برای «خوانده‌نشده»،
 * خاکستری برای خوانده‌شده. کلیک = نمایشگر تمام‌صفح (استوری۲۴ ساعته).
 */
export function StoryBar({
  petId,
  petName,
  avatarUrl,
  canPublish,
  onPublish,
}: {
  petId: number
  petName: string
  avatarUrl?: string | null
  canPublish: boolean
  onPublish: () => void
}) {
  const [stories, setStories] = useState<Story[]>([])
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [seen, setSeen] = useState<number[]>([])

  useEffect(() => {
    let alive = true
    socialApi
      .petStories(petId)
      .then((d) => alive && setStories(d.items))
      .catch(() => alive && setStories([]))
    return () => {
      alive = false
    }
  }, [petId])

  const hasUnseen = stories.some((s) => !seen.includes(s.id))
  const active = openIndex != null ? stories[openIndex] : null
  // TS narrowing در closureها قابل‌اعتماد نیست — مقدار محلی می‌گیریم
  const idx = openIndex ?? 0
  const total = stories.length

  return (
    <div data-motion-item className="border-b border-border/60 px-5 py-4 sm:px-7">
      <div className="flex items-center gap-4 overflow-x-auto pb-1 no-scrollbar">
        {canPublish && (
          <button
            type="button"
            onClick={onPublish}
            className="group flex shrink-0 flex-col items-center gap-1.5"
            aria-label="افزودن استوری"
          >
            <span className="relative grid size-16 place-items-center rounded-full border-2 border-dashed border-primary/50 bg-background">
              <img
                src={mediaUrl(avatarUrl) || '/images/listings/dog-pug.jpg'}
                alt=""
                className="size-full rounded-full object-cover opacity-70"
              />
              <span className="absolute -bottom-0.5 grid size-6 place-items-center rounded-full bg-primary text-white shadow-glow">
                <span className="text-base leading-none">+</span>
              </span>
            </span>
            <span className="max-w-16 truncate text-[10px] font-bold text-muted-foreground">استوری تازه</span>
          </button>
        )}

        {stories.map((story, i) => {
          const unread = !seen.includes(story.id)
          return (
            <button
              key={story.id}
              type="button"
              onClick={() => setOpenIndex(i)}
              className="group flex shrink-0 flex-col items-center gap-1.5"
              aria-label={`استوری ${faDigits(i + 1)}`}
            >
              <span
                className={cn(
                  'grid size-16 place-items-center rounded-full p-0.5 transition-transform group-hover:scale-105',
                  unread
                    ? 'bg-gradient-to-tr from-paw-400 via-primary to-tide-400'
                    : 'bg-muted',
                )}
              >
                <span className="grid size-full place-items-center rounded-full bg-card p-0.5">
                  <img
                    src={mediaUrl(story.images[0]) || mediaUrl(avatarUrl) || '/images/listings/dog-pug.jpg'}
                    alt=""
                    className="size-full rounded-full object-cover"
                  />
                </span>
              </span>
              <span className="max-w-16 truncate text-[10px] font-bold text-muted-foreground">
                {i === 0 && hasUnseen ? 'تازه' : faDigits(i + 1)}
              </span>
            </button>
          )
        })}

        {stories.length === 0 && !canPublish && (
          <p className="py-2 text-xs text-muted-foreground">هنوز استوری‌ای نیست</p>
        )}
      </div>

      {/* نمایشگر تمام‌صفح */}
      {active && (
        <div
          className="fixed inset-0 z-[1500] flex items-center justify-center bg-black/92 backdrop-blur-sm"
          role="dialog"
          aria-label={`استوری ${petName}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpenIndex(null)
          }}
        >
          <button
            type="button"
            onClick={() => setOpenIndex(null)}
            aria-label="بستن"
            className="absolute left-4 top-4 z-10 grid size-10 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"
          >
            <X className="size-5" />
          </button>

          {idx > 0 && (
            <button
              type="button"
              onClick={() => setOpenIndex(idx - 1)}
              aria-label="استوری قبلی"
              className="absolute right-4 z-10 grid size-10 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"
            >
              <ChevronRight className="size-5" />
            </button>
          )}
          {idx < total - 1 && (
            <button
              type="button"
              onClick={() => setOpenIndex(idx + 1)}
              aria-label="استوری بعدی"
              className="absolute left-4 z-10 grid size-10 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"
            >
              <ChevronLeft className="size-5" />
            </button>
          )}

          <figure className="relative aspect-[9/16] w-[min(92vw,26rem)] overflow-hidden rounded-3xl bg-card shadow-lifted">
            {active.images[0] ? (
              <img src={mediaUrl(active.images[0])} alt="" className="size-full object-cover" />
            ) : (
              <div className="grid size-full place-items-center bg-muted/40 p-8">
                <p className="text-center text-lg leading-relaxed">{active.text}</p>
              </div>
            )}
            {active.images[0] && active.text && (
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5 pt-16">
                <p className="text-sm leading-relaxed text-white">{active.text}</p>
              </figcaption>
            )}
            <span className="absolute right-4 top-4 rounded-full bg-black/55 px-3 py-1 text-xs font-bold text-white backdrop-blur">
              {petName}
            </span>
          </figure>

          <p className="absolute bottom-6 text-xs font-medium text-white/70">
            {faDigits(idx + 1)} از {faDigits(total)} · استوری‌ها ۲۴ ساعت فعال‌اند
          </p>

          {/* بازدید = خوانده‌شدن (فقط در همین نشست) */}
          <span
            className="sr-only"
            ref={(el) => {
              if (el && active) setSeen((s) => (s.includes(active.id) ? s : [...s, active.id]))
            }}
          />
        </div>
      )}
    </div>
  )
}
