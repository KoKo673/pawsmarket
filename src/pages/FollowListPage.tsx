import { Loader2, PawPrint, UserRound } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { mediaUrl, socialApi, type FollowListItem } from '@/lib/social-api'

const SPECIES_FA: Record<string, string> = {
  dog: 'سگ', cat: 'گربه', rabbit: 'خرگوش', bird: 'پرنده',
  fish: 'ماهی', small: 'جیوان خانگی کوچک', other: 'حیوان خانگی',
}

type ListKind = 'followers' | 'following'

/**
 * Followers / following of one pet.
 *
 * Reached from the counts on the pet profile. Both lists are public (the API
 * endpoints are not authenticated), so this page stays a plain link — a shared
 * link to «who follows رضا» should open for anyone.
 */
export function FollowListPage() {
  const { id } = useParams<{ id: string }>()
  const [params] = useSearchParams()
  const kind: ListKind = params.get('kind') === 'following' ? 'following' : 'followers'

  const [items, setItems] = useState<FollowListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setFailed(false)
    try {
      const data = kind === 'followers' ? await socialApi.followers(id) : await socialApi.following(id)
      setItems(data.items ?? [])
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }, [id, kind])

  useEffect(() => {
    void load()
  }, [load])

  const title = kind === 'followers' ? 'دنبال‌کننده‌ها' : 'دنبال‌شده‌ها'
  const empty = kind === 'followers'
    ? 'هنوز هیچ دنبال‌کننده‌ای برای این پروفایل ثبت نشده است.'
    : 'این پروفایل هنوز هیچ صفحه‌ا را دنبال نمی‌کند.'

  return (
    <div className="mx-auto min-h-[70vh] w-full max-w-2xl px-4 pb-24 pt-24 sm:px-6">
      <header data-motion-section>
        <Link
          to={`/pet/${id}`}
          className="text-sm font-semibold text-primary hover:underline"
        >
          بازگشت به پروفایل
        </Link>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight">{title}</h1>
        {!loading && !failed && (
          <p className="mt-1.5 text-sm text-muted-foreground">
            {items.length > 0
              ? `${items.length} مورد`
              : 'موردی برای نمایش نیست'}
          </p>
        )}
      </header>

      {loading ? (
        <div className="mt-8 space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      ) : failed ? (
        <div className="mt-10 flex flex-col items-center text-center">
          <span className="grid size-14 place-items-center rounded-full bg-muted">
            <UserRound className="size-6 text-muted-foreground" />
          </span>
          <p className="mt-4 text-sm font-semibold text-muted-foreground">
            بارگذاری این فهرست ممکن نشد.
          </p>
          <Button variant="outline" className="mt-5 gap-2" onClick={() => void load()}>
            <Loader2 className="size-4" />
            تلاش دوباره
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div
          data-motion-item
          className="mt-10 flex flex-col items-center rounded-3xl border border-border/60 bg-card px-6 py-16 text-center shadow-soft"
        >
          <span className="grid size-16 place-items-center rounded-full bg-primary/10">
            <PawPrint className="size-7 text-primary" />
          </span>
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted-foreground">
            {empty}
          </p>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {items.map((pet) => (
            <li key={pet.id} data-motion-item>
              <Link
                to={`/pet/${pet.id}`}
                className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-3 shadow-soft transition-colors hover:border-primary/40"
              >
                {pet.avatar_url ? (
                  <img
                    src={mediaUrl(pet.avatar_url)}
                    alt=""
                    loading="lazy"
                    className="size-14 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <PawPrint className="size-6" />
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block truncate font-extrabold">{pet.name}</span>
                  <span className="block text-xs font-semibold text-muted-foreground">
                    {SPECIES_FA[pet.species] ?? pet.species}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default FollowListPage