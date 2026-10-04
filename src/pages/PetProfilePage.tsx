import { Cake, Heart, Loader2, MapPin, PawPrint, Plus, Share2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { FollowButton } from '@/components/social/FollowButton'
import { CreateMomentDialog } from '@/components/social/CreateMomentDialog'
import { MomentCard, EmptyFeed } from '@/components/social/MomentsFeed'
import { StoryBar } from '@/components/social/StoryBar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { faDigits } from '@/lib/fa'
import { socialApi, type PetProfile, type Post } from '@/lib/social-api'

const SPECIES_FA: Record<string, string> = {
  dog: 'سگ', cat: 'گربه', rabbit: 'خرگوش', bird: 'پرنده',
  fish: 'ماهی', small: 'حیوان کوچک', other: 'سایر',
}

/** پروفایل حیوان — هدر + گالری + لحظات (سبک شبکه‌های اجتماعی). */
export function PetProfilePage() {
  const { id } = useParams<{ id: string }>()

  const [profile, setProfile] = useState<PetProfile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [composeOpen, setComposeOpen] = useState(false)
  const [composeKind, setComposeKind] = useState<'post' | 'story'>('post')
  const [adoptionBusy, setAdoptionBusy] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const [p, feed] = await Promise.all([
        socialApi.getProfile(id),
        socialApi.petPosts(id),
      ])
      setProfile(p)
      setPosts(feed.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'بارگذاری انجام نشد')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-28 sm:px-6">
        <Skeleton className="h-44 w-full rounded-3xl" />
        <Skeleton className="mt-6 h-6 w-1/3" />
        <Skeleton className="mt-3 h-4 w-2/3" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-md px-4 pb-24 pt-32 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-muted">
          <PawPrint className="size-7 text-muted-foreground/60" />
        </span>
        <p className="mt-4 text-sm font-semibold text-muted-foreground">
          {error ?? 'این پروفایل پیدا نشد'}
        </p>
      </div>
    )
  }

  const { pet, profile: p, counts } = profile
  const isOwnerMine = profile.is_owner

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-24 sm:px-6">
      {/* هدر پروفایل */}
      <header data-motion-section className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-lifted">
        <div
          data-motion-item
          className="h-40 w-full bg-gradient-to-br from-paw-300/50 via-paw-200/40 to-tide-200/50 sm:h-52"
          style={
            p.cover_url
              ? { backgroundImage: `url(${p.cover_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : undefined
          }
        />
        <div className="relative px-5 pb-6 sm:px-7">
          <div data-motion-item className="-mt-12 flex items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              {p.avatar_url ? (
                <img
                  src={p.avatar_url}
                  alt={pet.name}
                  className="size-24 rounded-3xl border-4 border-card object-cover shadow-lifted"
                />
              ) : (
                <span className="grid size-24 place-items-center rounded-3xl border-4 border-card bg-primary/10 text-primary shadow-lifted">
                  <PawPrint className="size-10" />
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 pb-1">
              {isOwnerMine ? (
                <>
                  <Button
                    variant={p.adoption_status === 'available' ? 'outline' : 'ghost'}
                    className="gap-2"
                    disabled={adoptionBusy}
                    onClick={async () => {
                      setAdoptionBusy(true)
                      try {
                        const next = p.adoption_status === 'available' ? '' : 'available'
                        const updated = await socialApi.patchProfile(pet.id, { adoption_status: next })
                        setProfile(updated)
                      } catch (err) {
                        setError(err instanceof Error ? err.message : 'تغییر وضعیت انجام نشد')
                      } finally {
                        setAdoptionBusy(false)
                      }
                    }}
                  >
                    {adoptionBusy ? <Loader2 className="size-4 animate-spin" /> : <Heart className="size-4" />}
                    {p.adoption_status === 'available' ? 'لغو واگذاری' : 'آماده‌ی واگذاری'}
                  </Button>
                  <Button className="gap-2" onClick={() => { setComposeKind('post'); setComposeOpen(true) }}>
                    <Plus className="size-4" />
                    لحظه‌ی تازه
                  </Button>
                </>
              ) : (
                <FollowButton
                  petId={pet.id}
                  initialFollowing={profile.is_following}
                  initialCount={counts.followers}
                />
              )}
              <Button variant="ghost" size="icon" aria-label="هم‌رسانی">
                <Share2 className="size-4" />
              </Button>
            </div>
          </div>

          <div data-motion-item className="mt-4">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight">{pet.name}</h1>
              <Badge variant="secondary">{SPECIES_FA[pet.species] ?? pet.species}</Badge>
              {p.adoption_status === 'available' && <Badge variant="accent">آماده‌ی سرپرستی</Badge>}
              {p.adoption_status === 'adopted' && <Badge variant="secondary">سرپرستی شده 🎉</Badge>}
              {!p.is_public && <Badge variant="muted">خصوصی</Badge>}
            </div>
            {p.bio && <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">{p.bio}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs font-semibold text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5 text-primary" />
                تهران
              </span>
              {p.birth_date && (
                <span className="inline-flex items-center gap-1">
                  <Cake className="size-3.5 text-primary" />
                  {p.birth_date}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <PawPrint className="size-3.5 text-tide-500" />
                {faDigits(counts.posts)} لحظه
              </span>
            </div>
          </div>

          <div data-motion-item className="mt-5 grid grid-cols-3 divide-x divide-border rounded-2xl border border-border/70 bg-muted/40 text-center">
            {[
              { label: 'لحظه‌ها', value: counts.posts },
              { label: 'دنبال‌کننده', value: counts.followers },
              { label: 'دنبال‌شده', value: counts.following },
            ].map((s) => (
              <div key={s.label} className="px-2 py-3">
                <p className="text-lg font-extrabold text-primary">{faDigits(s.value)}</p>
                <p className="text-[11px] font-bold text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* نوار استوری (فاز B) — فقط برای صاحب پروفایل قابل انتشار است */}
      <StoryBar
        petId={pet.id}
        petName={pet.name}
        avatarUrl={p.avatar_url}
        canPublish={isOwnerMine}
        onPublish={() => {
          setComposeKind('story')
          setComposeOpen(true)
        }}
      />

      {/* گالری */}
      {profile.gallery.length > 0 && (
        <section data-motion-section className="mt-8">
          <h2 data-motion-item className="mb-3 flex items-center gap-2 text-sm font-extrabold">
            <Heart className="size-4 text-primary" />
            گالری
          </h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {profile.gallery.map((photo) => (
              <img
                key={photo.id}
                data-motion-item
                src={photo.url}
                alt={photo.caption ?? ''}
                loading="lazy"
                className="aspect-square w-full rounded-2xl border border-border/60 object-cover"
              />
            ))}
          </div>
        </section>
      )}

      {/* لحظات */}
      <section data-motion-section="group" className="mt-8 space-y-5">
        <h2 data-motion-item className="text-sm font-extrabold">
          لحظه‌های {pet.name}
        </h2>
        {posts.length === 0 ? (
          <EmptyFeed
            message={
              isOwnerMine
                ? 'هنوز لحظه‌ای منتشر نکرده‌اید — اولین لحظه را با همه به اشتراک بگذارید!'
                : `${pet.name} هنوز لحظه‌ای منتشر نکرده است.`
            }
          />
        ) : (
          posts.map((post) => <MomentCard key={post.id} post={post} />)
        )}
      </section>

      {isOwnerMine && (
        <CreateMomentDialog
          key={composeKind}
          open={composeOpen}
          onOpenChange={setComposeOpen}
          petId={pet.id}
          petName={pet.name}
          initialKind={composeKind}
          onCreated={() => void load()}
        />
      )}
    </div>
  )
}
