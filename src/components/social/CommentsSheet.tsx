import { Loader2, Send } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { faDigits } from '@/lib/fa'
import { mediaUrl, socialApi, type Comment } from '@/lib/social-api'
import { useAuthStore } from '@/store/auth.store'

function faAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'همین حالا'
  if (mins < 60) return `${faDigits(mins)} دقیقه پیش`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${faDigits(hours)} ساعت پیش`
  return `${faDigits(Math.floor(hours / 24))} روز پیش`
}

/** برگه‌ی کامنت‌های یک لحظه — فقط مالکانِ واردشده می‌نویسند، همه می‌بینند. */
export function CommentsSheet({
  postId,
  open,
  onOpenChange,
  onCountChange,
}: {
  postId: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onCountChange?: (count: number) => void
}) {
  const status = useAuthStore((s) => s.status)
  const [items, setItems] = useState<Comment[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await socialApi.listComments(postId)
      setItems(data.items)
      onCountChange?.(data.items.length)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'بارگذاری کامنت‌ها نشد')
    } finally {
      setLoading(false)
    }
  }, [postId, onCountChange])

  useEffect(() => {
    if (open) void load()
  }, [open, load])

  async function submit(e: FormEvent) {
    e.preventDefault()
    const body = text.trim()
    if (!body || sending) return
    setSending(true)
    setError(null)
    try {
      const created = await socialApi.addComment(postId, body)
      setItems((prev) => [...prev, created])
      onCountChange?.(items.length + 1)
      setText('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ارسال نشد')
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>کامنت‌ها ({faDigits(items.length)})</DialogTitle>
        </DialogHeader>

        <div className="max-h-72 space-y-3 overflow-y-auto">
          {loading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              <Loader2 className="mx-auto size-5 animate-spin" />
            </p>
          ) : items.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              هنوز کامنتی نیست — اولین نفر باشید
            </p>
          ) : (
            items.map((c) => (
              <div key={c.id} className="flex gap-3">
                {c.avatar_url ? (
                  <img src={mediaUrl(c.avatar_url)} alt="" className="size-9 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                    {(c.display_name || c.username).slice(0, 1)}
                  </span>
                )}
                <div className="min-w-0 rounded-2xl bg-muted/50 px-3.5 py-2">
                  <p className="text-xs font-bold">
                    {c.display_name || c.username}
                    <span className="ms-2 font-normal text-muted-foreground">{faAgo(c.created_at)}</span>
                  </p>
                  <p className="mt-0.5 break-words text-sm leading-relaxed">{c.text}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {status === 'authed' ? (
          <form onSubmit={submit} className="flex items-center gap-2 border-t border-border pt-4">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="کامنت شما…"
              maxLength={500}
              className="h-11 min-w-0 flex-1 rounded-xl border border-input bg-card px-3.5 text-sm shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button type="submit" size="icon" disabled={sending || !text.trim()} aria-label="ارسال کامنت">
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </form>
        ) : (
          <p className="border-t border-border pt-4 text-center text-xs text-muted-foreground">
            برای نوشتن کامنت باید وارد شوید
          </p>
        )}

        {error && (
          <p className="rounded-xl bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
            {error}
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
