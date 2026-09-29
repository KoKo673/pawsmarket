import { ImagePlus, UploadCloud, X } from 'lucide-react'
import { useCallback, useRef, useState, type DragEvent } from 'react'

import { faDigits } from '@/lib/fa'
import { cn } from '@/lib/utils'

export interface DraftImage {
  id: string
  url: string
  name: string
}

const MAX_IMAGES = 6

/**
 * بارگذاری عکس با کشیدن و رها کردن (+ کلیک به‌عنوان جایگزین).
 * برای پیش‌نمایش فوری Object URL ساخته می‌شود؛ هنگام ارسال نهایی
 * همین‌ها به‌صورت multipart آپلود می‌شوند.
 */
export function Dropzone({
  images,
  onChange,
}: {
  images: DraftImage[]
  onChange: (images: DraftImage[]) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const addFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return
      const next: DraftImage[] = [...images]
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue
        if (next.length >= MAX_IMAGES) break
        next.push({ id: `${file.name}-${crypto.randomUUID()}`, url: URL.createObjectURL(file), name: file.name })
      }
      onChange(next)
    },
    [images, onChange],
  )

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }

  return (
    <div className="space-y-3">
      {/* ناحیه‌ی رها کردن */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'flex w-full flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-all duration-200',
          dragging
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : 'border-border bg-muted/30 hover:border-primary/50 hover:bg-primary/[0.03]',
        )}
        aria-label="بارگذاری تصویر"
      >
        <span
          className={cn(
            'grid size-14 place-items-center rounded-2xl transition-colors',
            dragging ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary',
          )}
        >
          {dragging ? <ImagePlus className="size-6" /> : <UploadCloud className="size-6" />}
        </span>
        <span className="text-sm font-bold">
          {dragging ? 'اینجا رها کنید!' : 'عکس‌ها را بکشید یا برای انتخاب کلیک کنید'}
        </span>
        <span className="text-xs text-muted-foreground">
          JPG / PNG / WebP · تا {faDigits(MAX_IMAGES)} تصویر · اولین عکس کاور می‌شود
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          addFiles(e.target.files)
          e.target.value = '' // امکان انتخاب دوباره‌ی همان فایل
        }}
      />

      {/* پیش‌نمایش‌ها */}
      {images.length > 0 && (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {images.map((img, i) => (
            <li
              key={img.id}
              className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted animate-pop-in"
            >
              <img src={img.url} alt={img.name} className="size-full object-cover" />
              {i === 0 && (
                <span className="absolute bottom-1 right-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white">
                  کاور
                </span>
              )}
              <button
                type="button"
                onClick={() => onChange(images.filter((x) => x.id !== img.id))}
                aria-label={`حذف ${img.name}`}
                className="absolute left-1 top-1 grid size-5 place-items-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive focus-visible:opacity-100"
              >
                <X className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
