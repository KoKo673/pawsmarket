import { Clock, ImagePlus, Loader2, Send } from 'lucide-react'
import { useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/input'
import { socialApi } from '@/lib/social-api'

/**
 * دیالوگ انتشار لحظه — متن + تا ۴ تصویر.
 * تصاویر اول به /api/media آپلود و بعد پست ساخته می‌شود.
 */
export function CreateMomentDialog({
  open,
  onOpenChange,
  petId,
  petName,
  initialKind = 'post',
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  petId: number
  petName: string
  initialKind?: 'post' | 'story'
  onCreated: () => void
}) {
  const [text, setText] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [asStory, setAsStory] = useState(initialKind === 'story')
  const inputRef = useRef<HTMLInputElement>(null)

  async function submit() {
    if (!text.trim() && files.length === 0) {
      setError('متن یا تصویر لازم است')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const urls: string[] = []
      for (const f of files.slice(0, 4)) {
        const { url } = await socialApi.uploadMedia(f)
        urls.push(url)
      }
      await socialApi.createPost(petId, text.trim(), urls, asStory ? 'story' : 'post')
      setText('')
      setFiles([])
      setAsStory(false)
      onOpenChange(false)
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'انتشار انجام نشد')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {asStory ? 'استوری ۲۴ ساعته' : 'لحظه‌ی تازه'} — {petName}
          </DialogTitle>
        </DialogHeader>

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="چه خبر؟ چه بازی‌ای کردید؟"
          rows={4}
          maxLength={1000}
        />

        <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border/70 bg-muted/40 px-4 py-3">
          <span className="inline-flex items-center gap-2 text-sm font-bold">
            <Clock className="size-4 text-primary" />
            به‌صورت استوری ۲۴ ساعته
          </span>
          <input
            type="checkbox"
            checked={asStory}
            onChange={(e) => setAsStory(e.target.checked)}
            className="size-4 accent-[hsl(var(--primary))]"
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            hidden
            onChange={(e) => {
              setFiles(Array.from(e.target.files ?? []).slice(0, 4))
              e.target.value = ''
            }}
          />
          <Button variant="outline" size="sm" className="gap-2" onClick={() => inputRef.current?.click()}>
            <ImagePlus className="size-4" />
            افزودن تصویر
          </Button>
          {files.length > 0 && (
            <div className="flex gap-2">
              {files.map((f, i) => (
                <img
                  key={i}
                  src={URL.createObjectURL(f)}
                  alt=""
                  className="size-14 rounded-xl border border-border object-cover"
                />
              ))}
            </div>
          )}
        </div>

        {error && (
          <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            انصراف
          </Button>
          <Button onClick={submit} disabled={busy} className="gap-2">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            انتشار
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
