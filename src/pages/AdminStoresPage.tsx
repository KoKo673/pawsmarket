import { AlertCircle, Copy, ExternalLink, Link2, Loader2, Search, Store } from 'lucide-react'
import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'

import { AdminNav } from '@/components/AdminNav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { faDigits } from '@/lib/fa'
import { adminApi, type StoreRow } from '@/lib/admin-api'

/**
 * فعال‌سازی داشبورد مراکز — /admin/stores
 *
 * Measured on production before this page existed: 569 stores, **0** with a
 * `dashboard_hash`. The dashboard was built, tested and deployed, and had
 * nobody who could open it — the capability existed and was unreachable,
 * which is the same as not existing for the clinics.
 *
 * The API already had `POST /api/store/{id}/dashboard-link`; what was
 * missing was a place to press it. This page lists services, issues a link
 * per store, and shows it once so it can be copied into a phone call.
 *
 * The raw token is shown exactly once, by design: the server stores only
 * its hash, so it cannot be displayed again. That is stated in the row
 * rather than discovered later when someone asks for the link a second time.
 */

const CATEGORY_FA: Record<string, string> = {
  vet: 'دامپزشک',
  groomer: 'آرایشگاه',
  boarding: 'پانسیون',
  shelter: 'پناهگاه',
  cafe: 'کافه',
  shop: 'فروشگاه',
}

export function AdminStoresPage() {
  const [term, setTerm] = useState('')
  const [submitted, setSubmitted] = useState('')
  /** store id → the raw dashboard URL, kept only for this page view. */
  const [issued, setIssued] = useState<Record<number, string>>({})
  const [copied, setCopied] = useState<number | null>(null)

  const q = useQuery({
    queryKey: ['admin', 'stores', submitted],
    queryFn: () => adminApi.stores(submitted),
  })

  const issue = useMutation({
    mutationFn: (id: number) => adminApi.dashboardLink(id),
    onSuccess: (data, id) => {
      setIssued((prev) => ({ ...prev, [id]: data.url }))
    },
  })

  async function copy(id: number, url: string) {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(id)
      setTimeout(() => setCopied((c) => (c === id ? null : c)), 1800)
    } catch {
      // Clipboard is blocked in some contexts; the URL is on screen and
      // selectable, so this is not worth an error banner.
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-28 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight">داشبورد مراکز</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          برای هر مرکز یک لینک بسازید و به خودشان بدهید. بدون حساب کار
          می‌کند؛ خودِ لینک دسترسی است.
        </p>
      </header>

      <AdminNav />

      <form
        onSubmit={(e) => { e.preventDefault(); setSubmitted(term.trim()) }}
        className="mb-5 flex gap-2"
      >
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="جست‌وجوی نام یا نشانی مرکز…"
          aria-label="جست‌وجوی مرکز"
        />
        <Button type="submit" size="icon" aria-label="جست‌وجو">
          <Search className="size-4" aria-hidden="true" />
        </Button>
      </form>

      {q.isPending && (
        <div className="grid place-items-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
          <span className="sr-only">در حال بارگذاری</span>
        </div>
      )}

      {q.isError && (
        <div className="rounded-2xl border border-border bg-muted/30 px-6 py-12 text-center">
          <AlertCircle className="mx-auto size-7 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold">بارگذاری نشد</p>
        </div>
      )}

      {q.data && (
        <>
          <p className="mb-3 text-xs text-muted-foreground">
            {new Intl.NumberFormat('fa-IR').format(q.data.total)} مرکز
            {' · '}
            {new Intl.NumberFormat('fa-IR').format(q.data.with_dashboard)} دارای داشبورد
          </p>

          {q.data.items.length === 0 && (
            <div className="rounded-2xl border border-border bg-muted/30 px-6 py-14 text-center">
              <Store className="mx-auto size-7 text-muted-foreground" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold">مرکزی با این نام پیدا نشد</p>
            </div>
          )}

          <ul className="space-y-2">
            {q.data.items.map((s: StoreRow) => {
              const url = issued[s.id]
              const busy = issue.isPending && issue.variables === s.id
              return (
                <li key={s.id}
                    className="rounded-xl border border-border bg-card px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2">
                        <span className="font-bold">{s.name}</span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px]
                          font-bold text-muted-foreground">
                          {CATEGORY_FA[s.category] ?? s.category}
                        </span>
                        {s.has_dashboard && (
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5
                            text-[10px] font-bold text-emerald-700">
                            دارای داشبورد
                          </span>
                        )}
                      </p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {s.address}
                        {' · '}
                        {faDigits(s.bookings)} نوبت
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant={s.has_dashboard ? 'outline' : 'default'}
                      className="shrink-0 gap-1.5"
                      disabled={busy}
                      onClick={() => issue.mutate(s.id)}
                    >
                      {busy
                        ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                        : <Link2 className="size-3.5" aria-hidden="true" />}
                      {s.has_dashboard ? 'لینک تازه' : 'ساخت لینک'}
                    </Button>
                  </div>

                  {url && (
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Input readOnly value={url} dir="ltr"
                               className="text-[11px]"
                               onFocus={(e) => e.currentTarget.select()} />
                        <Button size="icon" variant="outline" className="shrink-0"
                                aria-label="کپی"
                                onClick={() => void copy(s.id, url)}>
                          <Copy className="size-3.5" aria-hidden="true" />
                        </Button>
                        <Button asChild size="icon" variant="outline" className="shrink-0">
                          <a href={url} target="_blank" rel="noreferrer" aria-label="باز کردن">
                            <ExternalLink className="size-3.5" aria-hidden="true" />
                          </a>
                        </Button>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {copied === s.id ? 'کپی شد.' : 'این لینک فقط یک‌بار نشان داده می‌شود.'}
                      </p>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}
