import { Heart, PawPrint } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { faDigits } from '@/lib/fa'
import type { Post } from '@/lib/social-api'

function faTime(iso: string): string {
  const d = new Date(iso)
  const mins = Math.floor((Date.now() - d.getTime()) / 60000)
  if (mins < 1) return 'همین حالا'
  if (mins < 60) return `${faDigits(mins)} دقیقه پیش`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${faDigits(hours)} ساعت پیش`
  return `${faDigits(Math.floor(hours / 24))} روز پیش`
}

/** کارت یک لحظه — آواتار + نام + زمان + متن + گالری تصاویر */
export function MomentCard({ post }: { post: Post }) {
  return (
    <article
      data-motion-item
      className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft"
    >
      <header className="flex items-center gap-3 p-4">
        <Link to={`/pet/${post.pet_id}`} className="shrink-0">
          {post.pet_avatar ? (
            <img
              src={post.pet_avatar}
              alt={post.pet_name ?? ''}
              className="size-11 rounded-full border-2 border-primary/30 object-cover"
            />
          ) : (
            <span className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
              <PawPrint className="size-5" />
            </span>
          )}
        </Link>
        <div className="min-w-0">
          <Link to={`/pet/${post.pet_id}`} className="block truncate text-sm font-extrabold hover:text-primary">
            {post.pet_name ?? 'حیوان'}
          </Link>
          <p className="text-xs text-muted-foreground">{faTime(post.created_at)}</p>
        </div>
      </header>

      {post.text && <p className="px-4 pb-3 text-sm leading-relaxed">{post.text}</p>}

      {post.images.length > 0 && (
        <div className={post.images.length === 1 ? '' : 'grid grid-cols-2 gap-0.5'}>
          {post.images.slice(0, 4).map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              loading="lazy"
              className={
                post.images.length === 1
                  ? 'max-h-[28rem] w-full object-cover'
                  : 'aspect-square w-full object-cover'
              }
            />
          ))}
        </div>
      )}

      <footer className="flex items-center gap-2 p-4 text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
          <Heart className="size-4" />
          {faDigits(post.like_count)}
        </span>
      </footer>
    </article>
  )
}

/** فید خالی — با CTA به کشف حیوانات */
export function EmptyFeed({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-border/60 bg-card px-6 py-14 text-center shadow-soft">
      <span className="grid size-16 place-items-center rounded-full bg-muted">
        <PawPrint className="size-7 text-muted-foreground/60" />
      </span>
      <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">{message}</p>
      <Button asChild className="mt-5">
        <Link to="/pets">دیدن حیوانات نزدیک</Link>
      </Button>
    </div>
  )
}
