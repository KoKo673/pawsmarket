import { Heart, Loader2, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { CommentsSheet } from '@/components/social/CommentsSheet'
import { faDigits } from '@/lib/fa'
import { socialApi } from '@/lib/social-api'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'

/**
 * ردیف واکنش لحظه: لایک خوش‌بینانه (با برگشت در خطا) + بازکننده‌ی کامنت.
 * مهمان: هر دو به /login?next= هدایت می‌شوند.
 */
export function MomentActions({
  postId,
  initialLiked = false,
  initialCount = 0,
  initialComments = 0,
  className,
}: {
  postId: number
  initialLiked?: boolean
  initialCount?: number
  initialComments?: number
  className?: string
}) {
  const navigate = useNavigate()
  const status = useAuthStore((s) => s.status)
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [comments, setComments] = useState(initialComments)
  const [busy, setBusy] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)

  async function toggleLike() {
    if (status !== 'authed') {
      navigate(`/login?next=${encodeURIComponent(location.pathname)}`)
      return
    }
    if (busy) return
    const prev = { liked, count }
    setBusy(true)
    setLiked(!liked)
    setCount((c) => Math.max(0, c + (liked ? -1 : 1)))
    try {
      const res = liked ? await socialApi.unlike(postId) : await socialApi.like(postId)
      setLiked(res.liked)
      setCount(res.like_count)
    } catch {
      setLiked(prev.liked)
      setCount(prev.count)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <footer className={cn('flex items-center gap-3 p-4', className)}>
        <button
          type="button"
          onClick={toggleLike}
          disabled={busy}
          aria-label={liked ? 'برداشتن لایک' : 'پسندیدن'}
          aria-pressed={liked}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition-all active:scale-90',
            liked ? 'text-primary' : 'text-muted-foreground hover:text-primary',
          )}
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Heart className={cn('size-4 transition-transform', liked && 'scale-110 fill-current')} />
          )}
          {faDigits(count)}
        </button>

        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          aria-label="دیدن کامنت‌ها"
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold text-muted-foreground transition-colors hover:text-primary"
        >
          <MessageCircle className="size-4" />
          {faDigits(comments)}
        </button>
      </footer>

      <CommentsSheet
        postId={postId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onCountChange={setComments}
      />
    </>
  )
}
