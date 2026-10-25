import { LogOut, Loader2, PawPrint, Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { FollowButton } from '@/components/social/FollowButton'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { faDigits } from '@/lib/fa'
import { mediaUrl, socialApi, type PetProfile } from '@/lib/social-api'
import { useAuthStore } from '@/store/auth.store'
import { useGeoStore } from '@/store/geo.store'

/**
 * حساب من — پروفایل کاربر + پروفایل(های) حیوان + خروج.
 * اگر کاربر حیوانی ندارد، فرم «افزودن حیوان» را می‌بیند.
 */
export function MyAccountPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const origin = useGeoStore((s) => s.origin)

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [species, setSpecies] = useState('dog')
  const [bio, setBio] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const petsQuery = useQuery({
    queryKey: ['my-pet-profiles', origin.lat, origin.lng],
    queryFn: async () => {
      // پروفایل‌های خودم: با discover روی موقعیت خودم و فیلتر is_owner در بهترین حالت؛
      // ساده‌تر: فید پروفایل من از طریق discover + getProfile انجام می‌شود.
      const me = await socialApi.discover(origin.lat, origin.lng, 30000)
      const mine: PetProfile[] = []
      for (const item of me.items) {
        try {
          const p = await socialApi.getProfile(item.id)
          if (p.is_owner) mine.push(p)
        } catch {
          /* رد شو */
        }
      }
      return mine
    },
  })

  const pets = petsQuery.data ?? []

  async function createPet(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    setError(null)
    try {
      await socialApi.createProfile({
        name: name.trim(),
        species,
        bio: bio.trim() || undefined,
        lat: origin.lat,
        lng: origin.lng,
      })
      setName('')
      setBio('')
      setShowForm(false)
      await queryClient.invalidateQueries({ queryKey: ['my-pet-profiles'] })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ساخت پروفایل انجام نشد')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-28 sm:px-6">
      {/* کارت حساب */}
      <section data-motion-section className="glass rounded-3xl p-6 shadow-lifted">
        <div data-motion-item className="flex items-center gap-4">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-glow">
            <PawPrint className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-extrabold">{user?.display_name ?? user?.username}</h1>
            {/* `dir="auto"`, not `ltr`. The handle may now be Persian, and a
                hardcoded LTR layout puts the `@` on the wrong side of
                «@علی» — it reads as an e-mail address rather than a handle. */}
            <p className="text-xs text-muted-foreground" dir="auto">
              @{user?.username}
            </p>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={async () => {
              await logout()
              navigate('/')
            }}
          >
            <LogOut className="size-4" />
            خروج
          </Button>
        </div>

        {/*
          حسابی که هنوز نام انتخاب نکرده.

          A phone signup names the account `user_09123456789`. /welcome is
          where that gets fixed, but it was reachable only in the seconds
          right after the SMS — a user who navigated away, reloaded, or came
          back later had no link to it and kept the phone number as their
          public name forever. The server allows the rename exactly once
          while the name still starts with `user_`, so this link only
          appears in that window.
        */}
        {user?.username.startsWith('user_') && (
          <div data-motion-item className="mt-4 flex flex-wrap items-center gap-3
            rounded-2xl border border-primary/25 bg-primary/10 px-4 py-3">
            <p className="min-w-0 flex-1 text-xs leading-relaxed">
              نام کاربری شما موقتی است و شمارهٔ موبایلتان را نشان می‌دهد.
              یک نام برای خودتان انتخاب کنید.
            </p>
            <Button size="sm" onClick={() => navigate('/welcome')}>
              انتخاب نام کاربری
            </Button>
          </div>
        )}
      </section>

      {/* حیوانات من */}
      <section data-motion-section className="mt-8">
        <div data-motion-item className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-extrabold">حیوانات من</h2>
          <Button size="sm" className="gap-1.5" onClick={() => setShowForm((v) => !v)}>
            <Plus className="size-4" />
            افزودن حیوان
          </Button>
        </div>

        {showForm && (
          <form
            data-motion-item
            onSubmit={createPet}
            className="mb-6 space-y-4 rounded-2xl border border-border/60 bg-card p-5 shadow-soft"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pet_name">نام حیوان</Label>
                <Input
                  id="pet_name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثلاً پشمک"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pet_species">گونه</Label>
                <select
                  id="pet_species"
                  value={species}
                  onChange={(e) => setSpecies(e.target.value)}
                  className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-input bg-card px-4 text-sm font-semibold shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="dog">سگ</option>
                  <option value="cat">گربه</option>
                  <option value="rabbit">خرگوش</option>
                  <option value="bird">پرنده</option>
                  <option value="fish">ماهی</option>
                  <option value="small">حیوان کوچک</option>
                  <option value="other">سایر</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pet_bio">درباره</Label>
              <Textarea
                id="pet_bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="شخصیت، عادت‌ها، علاقه‌مندی‌ها…"
                rows={3}
                maxLength={500}
              />
            </div>
            {error && (
              <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)} disabled={busy}>
                انصراف
              </Button>
              <Button type="submit" disabled={busy} className="gap-2">
                {busy && <Loader2 className="size-4 animate-spin" />}
                ساخت پروفایل
              </Button>
            </div>
          </form>
        )}

        {petsQuery.isLoading ? (
          // Same grid, same row shape and same 90px height as the cards
          // below — measured in the browser, not guessed. A one-line «در حال
          // بارگذاری…» was what this page showed before, and it shifted the
          // content by 0.575 CLS when the pets arrived.
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-4 shadow-soft"
              >
                <Skeleton className="size-14 shrink-0 rounded-2xl" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : pets.length === 0 ? (
          <div className="rounded-2xl border border-border/60 bg-card px-6 py-10 text-center shadow-soft">
            <p className="text-sm font-semibold text-muted-foreground">
              هنوز حیوانی ثبت نکرده‌اید — با «افزودن حیوان» شروع کنید.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {pets.map((p) => (
              <Link
                key={p.pet.id}
                to={`/pet/${p.pet.id}`}
                data-motion-item
                className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lifted"
              >
                {p.profile.avatar_url ? (
                  <img
                    src={mediaUrl(p.profile.avatar_url)}
                    alt={p.pet.name}
                    className="size-14 rounded-2xl object-cover"
                  />
                ) : (
                  <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <PawPrint className="size-6" />
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate font-bold">{p.pet.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {faDigits(p.counts.posts)} لحظه · {faDigits(p.counts.followers)} دنبال‌کننده
                  </p>
                </div>
                <FollowButton
                  petId={p.pet.id}
                  initialFollowing={p.is_following}
                  initialCount={p.counts.followers}
                  className="ms-auto hidden sm:inline-flex"
                />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
