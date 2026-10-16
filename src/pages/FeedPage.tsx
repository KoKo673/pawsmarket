import { Newspaper } from 'lucide-react'
import { useInfiniteQuery } from '@tanstack/react-query'

import { EmptyFeed, MomentCard } from '@/components/social/MomentsFeed'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { socialApi } from '@/lib/social-api'
import { useAuthStore } from '@/store/auth.store'

/** فید لحظه‌ها — پست‌های حیوانات دنبال‌شده + خودم. */
export function FeedPage() {
  // فید هر حیوان جداست؛ بدون این همیشه فید اولین حیوان نشان داده می‌شد.
  const activePetId = useAuthStore((s) => s.activePetId)

  const query = useInfiniteQuery({
    queryKey: ['feed', activePetId],
    queryFn: ({ pageParam }) => socialApi.feed(pageParam, activePetId ?? undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.next_before ?? undefined,
  })

  const items = query.data?.pages.flatMap((p) => p.items) ?? []
  const error = query.isError
    ? (query.error instanceof Error ? query.error.message : 'بارگذاری فید نشد')
    : null

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

      {query.isLoading ? (
        /* Measured, not guessed: a real feed card is 169px tall at 390px, and
           the first page renders 20 of them — 4121px of content. This skeleton
           used to show three cards and stop at 608px, so when the data arrived
           everything below it jumped. The block now runs the height of the
           viewport, which is all a reader can see at once, so nothing moves
           above the fold whether the feed returns 3 cards or 20. */
        <div className="min-h-[70vh] space-y-5">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-[10.5625rem] rounded-2xl bg-card p-4 shadow-soft">
              <Skeleton className="h-11 w-11 rounded-full" />
              <Skeleton className="mt-3 h-4 w-1/3" />
              <Skeleton className="mt-4 h-[7.5rem] w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-destructive/25 bg-destructive/5 px-6 py-12 text-center">
          <p className="text-sm font-extrabold">اتصال برقرار نشد</p>
          <p className="mt-1 text-xs text-muted-foreground">{error}</p>
          <Button size="sm" variant="outline" className="mt-4" onClick={() => void query.refetch()}>
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
          {query.hasNextPage && (
            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={() => void query.fetchNextPage()}
                disabled={query.isFetchingNextPage}
              >
                {query.isFetchingNextPage ? 'در حال بارگذاری…' : 'بیشتر'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
