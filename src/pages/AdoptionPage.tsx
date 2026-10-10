import { Check, Heart, Home, Loader2, PawPrint, X } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/input'
import { faDigits } from '@/lib/fa'
import { formatDistance } from '@/lib/geo'
import { mediaUrl, socialApi, type AdoptionRequest, type DiscoverPet } from '@/lib/social-api'
import { useAuthStore } from '@/store/auth.store'
import { useGeoStore } from '@/store/geo.store'

const SPECIES_FA: Record<string, string> = {
  dog: 'سگ', cat: 'گربه', rabbit: 'خرگوش', bird: 'پرنده',
  fish: 'ماهی', small: 'حیوان کوچک', other: 'سایر',
}

function faAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'همین حالا'
  if (mins < 60) return `${faDigits(mins)} دقیقه پیش`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${faDigits(hours)} ساعت پیش`
  return `${faDigits(Math.floor(hours / 24))} روز پیش`
}

/**
 * واگذاری (فاز C):
 * - همه: فهرست حیوانات «آماده‌ی سرپرستی» مرتب بر فاصله + فرم درخواست
 * - مالک: صندوق درخواست‌های دریافتی با پذیرش/رد
 */
export function AdoptionPage() {
  const origin = useGeoStore((s) => s.origin)
  const status = useAuthStore((s) => s.status)

  const [pets, setPets] = useState<DiscoverPet[]>([])
  const [loading, setLoading] = useState(true)
  const [box, setBox] = useState<{ incoming: AdoptionRequest[]; outgoing: AdoptionRequest[] } | null>(null)
  const [requestFor, setRequestFor] = useState<DiscoverPet | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  const loadPets = useCallback(async () => {
    setLoading(true)
    try {
      const d = await socialApi.adoptablePets(origin.lat, origin.lng)
      setPets(d.items.filter((p) => p.adoption_status === 'available'))
    } catch {
      setPets([])
    } finally {
      setLoading(false)
    }
  }, [origin.lat, origin.lng])

  const loadBox = useCallback(async () => {
    if (status !== 'authed') {
      setBox(null)
      return
    }
    try {
      setBox(await socialApi.myAdoptionBox())
    } catch {
      setBox(null)
    }
  }, [status])

  useEffect(() => {
    void loadPets()
    void loadBox()
  }, [loadPets, loadBox])

  async function submitRequest(e: FormEvent) {
    e.preventDefault()
    if (!requestFor || busy) return
    setBusy(true)
    setError(null)
    try {
      await socialApi.requestAdoption(requestFor.id, message.trim())
      setRequestFor(null)
      setMessage('')
      setFlash('درخواست شما ثبت شد؛ نتیجه از سوی مالک اطلاع داده می‌شود.')
      await loadBox()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ثبت درخواست انجام نشد')
    } finally {
      setBusy(false)
    }
  }

  async function decide(id: number, action: 'accept' | 'reject') {
    try {
      await socialApi.decideAdoption(id, action)
      setFlash(action === 'accept' ? 'سرپرستی پذیرفته شد 🎉' : 'درخواست رد شد.')
      await Promise.all([loadBox(), loadPets()])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تصمیم ثبت نشد')
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-6">
      <header data-motion-section className="mb-8 text-center">
        <span data-motion-item className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3.5 py-1.5 text-xs font-bold text-accent">
          <Home className="size-3.5" />
          سرپرستی مسئولانه
        </span>
        <h1 data-motion-item className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
          حیوانات در انتظار خانه
        </h1>
        <p data-motion-item className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          پروفایل‌ها را ببینید و برای سرپرستی درخواست بدهید — مالک تصمیم می‌گیرد.
        </p>
      </header>

      {flash && (
        <p data-motion-item className="mx-auto mb-6 max-w-lg rounded-2xl bg-accent/10 px-5 py-3.5 text-center text-sm font-bold text-accent">
          {flash}
        </p>
      )}
      {error && (
        <p className="mx-auto mb-6 max-w-lg rounded-2xl bg-destructive/10 px-5 py-3.5 text-center text-sm font-bold text-destructive">
          {error}
        </p>
      )}

      {/* صندوق مالک */}
      {box && box.incoming.length > 0 && (
        <section data-motion-section className="mb-12">
          <h2 data-motion-item className="mb-4 flex items-center gap-2 text-lg font-extrabold">
            <Heart className="size-5 text-primary" />
            درخواست‌های دریافتی ({faDigits(box.incoming.length)})
          </h2>
          <div className="space-y-3">
            {box.incoming.map((r) => (
              <div
                key={r.id}
                data-motion-item
                className="flex flex-wrap items-center gap-4 rounded-2xl border border-border/60 bg-card p-4 shadow-soft"
              >
                <Link to={`/pet/${r.pet_id}`} className="flex min-w-0 items-center gap-3">
                  {r.pet_avatar ? (
                    <img src={mediaUrl(r.pet_avatar)} alt="" className="size-12 rounded-2xl object-cover" />
                  ) : (
                    <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                      <PawPrint className="size-5" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold">{r.pet_name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      از {r.requester_name || r.requester_username} · {faAgo(r.created_at)}
                    </p>
                  </div>
                </Link>
                <p className="min-w-40 flex-1 text-sm leading-relaxed text-foreground/90">«{r.message}»</p>
                <div className="flex items-center gap-2">
                  {r.status === 'pending' ? (
                    <>
                      <Button size="sm" className="gap-1.5" onClick={() => void decide(r.id, 'accept')}>
                        <Check className="size-4" />
                        پذیرش
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => void decide(r.id, 'reject')}>
                        <X className="size-4" />
                        رد
                      </Button>
                    </>
                  ) : (
                    <Badge variant={r.status === 'accepted' ? 'accent' : 'muted'}>
                      {r.status === 'accepted' ? 'پذیرفته‌شده' : 'ردشده'}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* فهرست حیوانات */}
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : pets.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-border/60 bg-card px-6 py-16 text-center shadow-soft">
          <span className="grid size-16 place-items-center rounded-full bg-muted">
            <PawPrint className="size-7 text-muted-foreground/60" />
          </span>
          <p className="mt-4 text-sm font-extrabold">فعلاً حیوانی در وضعیت «آماده‌ی سرپرستی» نیست</p>
          <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
            اگر صاحب حیوانی هستید، از پروفایلش وضعیت واگذاری را روشن کنید.
          </p>
        </div>
      ) : (
        <div data-motion-section="group" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {pets.map((pet) => (
            <article
              key={pet.id}
              data-motion-item
              className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-soft transition-all hover:-translate-y-1 hover:shadow-lifted"
            >
              <Link to={`/pet/${pet.id}`} className="block aspect-[4/3] overflow-hidden bg-muted">
                {pet.avatar_url ? (
                  <img src={mediaUrl(pet.avatar_url)} alt={pet.name} loading="lazy" className="size-full object-cover" />
                ) : (
                  <span className="grid size-full place-items-center text-primary/40">
                    <PawPrint className="size-14" />
                  </span>
                )}
              </Link>
              <div className="space-y-2.5 p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate font-bold">{pet.name}</h3>
                  <Badge variant="secondary">{SPECIES_FA[pet.species] ?? pet.species}</Badge>
                </div>
                {pet.bio && <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{pet.bio}</p>}
                <p className="text-[11px] font-semibold text-muted-foreground">
                  {formatDistance(pet.distance_m / 1000)} از شما
                </p>
                <Button
                  className="w-full gap-1.5"
                  onClick={() => {
                    if (status !== 'authed') {
                      location.href = `/login?next=/adoption`
                      return
                    }
                    setRequestFor(pet)
                  }}
                >
                  <Heart className="size-4" />
                  درخواست سرپرستی
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* دیالوگ درخواست */}
      <Dialog open={!!requestFor} onOpenChange={(o) => !o && setRequestFor(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>درخواست سرپرستی {requestFor?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitRequest} className="space-y-4">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="چند خطی از خودتان و شرایط نگهداری بنویسید — صداقت مهم‌ترین چیز است…"
              rows={4}
              minLength={10}
              maxLength={500}
              required
            />
            <div className="flex justify-end gap-3 border-t border-border pt-4">
              <Button type="button" variant="ghost" onClick={() => setRequestFor(null)} disabled={busy}>
                انصراف
              </Button>
              <Button type="submit" disabled={busy || message.trim().length < 10} className="gap-2">
                {busy && <Loader2 className="size-4 animate-spin" />}
                ارسال درخواست
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
