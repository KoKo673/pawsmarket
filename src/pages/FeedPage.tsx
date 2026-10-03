import { Newspaper } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { EmptyFeed, MomentCard } from '@/components/social/MomentsFeed'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { socialApi, type Post } from '@/lib/social-api'

/** فید لحظه‌ها — پست‌های حیوانات دنبال‌شده + خودم. */
export function FeedPage() {
  const [items, setItems] = useState<Post[]>([])
  const [nextBefore, setNextBefore] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await socialApi.feed()
      setItems(data.items)
      setNextBefore(data.next_before)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'بارگذاری فید نشد')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function loadMore() {
    if (!nextBefore) return
    setLoadingMore(true)
    try {
      const data = await socialApi.feed(nextBefore)
      setItems((prev) => [...prev, ...data.items])
      setNextBefore(data.next_before)
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-28 sm:px-6">
      <header data-motion-section className="mb-8">
        <h1 data-motion-item className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
          <Newspaper className="size-6 text-primary" />
          لحظه‌ها
        </h1>
        <p data-motion-item className="mt-1.5 text-sm text-muted-foreground">
          تازه‌ترین لحظه‌های حیواناتی که دنبال می‌کنید
        </p>
      </header>

      {loading ? (
        <div className="space-y-5">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="rounded-2xl bg-card p-4 shadow-soft">
              <Skeleton className="h-11 w-11 rounded-full" />
              <Skeleton className="mt-3 h-4 w-1/3" />
              <Skeleton className="mt-4 aspect-[4/3] w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-destructive/25 bg-destructive/5 px-6 py-12 text-center">
          <p className="text-sm font-extrabold">اتصال برقرار نشد</p>
          <p className="mt-1 text-xs text-muted-foreground">{error}</p>
          <Button size="sm" variant="outline" className="mt-4" onClick={() => void load()}>
            تلاش دوباره
          </Button>
        </div>
      ) : items.length === 0 ? (
        <EmptyFeed message="فید شما خالی است — چند حیوان را دنبال کنید تا لحظه‌هایشان اینجا بیاید." />
      ) : (
        <>
          <div data-motion-section="group" className="space-y-5">
            {items.map((post) => (
              <MomentCard key={post.id} post={post} />
            ))}
          </div>
          {nextBefore && (
            <div className="mt-6 text-center">
              <Button variant="outline" onClick={() => void loadMore()} disabled={loadingMore}>
                {loadingMore ? 'در حال بارگذاری…' : 'بیشتر'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
