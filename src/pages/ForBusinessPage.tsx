import { AlertCircle, Building2, Check, Loader2, Search } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * صفحهٔ «برای کسب‌وکار» — /for-business
 *
 * A clinic finds itself in the catalogue and asks for a dashboard.
 *
 * Why this page had to exist: the dashboard was finished and verified — a
 * customer booking appeared in it within the same second — but the only
 * way to get one was for someone here to know the clinic personally and
 * mint a link by hand. With 569 stores and no phone number on any of them
 * that route had reached zero.
 *
 * This reverses the direction. The clinic searches for its own name, finds
 * the listing that is already on the map, and asks. A person reviews it.
 *
 * Approval is manual and the copy says so, because a dashboard shows every
 * booking for that store — customer names, phone numbers, and when people
 * will be where. If anyone could claim a listing by typing its name, the
 * public catalogue would become the leak.
 */

const API = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')

const CATEGORY_FA: Record<string, string> = {
  vet: 'دامپزشکی',
  groomer: 'آرایشگاه',
  boarding: 'پانسیون',
  shelter: 'پناهگاه',
}

const ROLE_FA = [
  { v: 'owner', l: 'صاحب مجموعه' },
  { v: 'manager', l: 'مدیر' },
  { v: 'staff', l: 'کارمند' },
]

interface StoreHit {
  id: number
  name: string
  address: string
  category: string
}

async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error((body as { detail?: string })?.detail || 'درخواست انجام نشد')
  }
  return body as T
}

export function ForBusinessPage() {
  const [term, setTerm] = useState('')
  const [submitted, setSubmitted] = useState('')
  const [chosen, setChosen] = useState<StoreHit | null>(null)

  const search = useQuery({
    queryKey: ['business-stores', submitted],
    queryFn: () => getJson<{ items: StoreHit[]; note?: string }>(
      `/api/business/stores?q=${encodeURIComponent(submitted)}`),
    enabled: submitted.length >= 3,
  })

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-28 sm:px-6">
      <header className="mb-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1
          text-xs font-bold text-primary">
          <Building2 className="size-3.5" aria-hidden="true" />
          برای کسب‌وکار
        </span>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
          مرکز شما در پازمارکت هست — داشبوردش را بگیرید
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          کلینیک، آرایشگاه، پانسیون یا پناهگاه شما روی نقشهٔ ما هست. با
          داشبورد می‌بینید چه نوبتی گرفته شده و همان‌جا تأیید یا رد می‌کنید —
          بدون حساب کاربری، فقط با یک لینک.
        </p>
      </header>

      {!chosen ? (
        <>
          <form
            onSubmit={(e: FormEvent) => { e.preventDefault(); setSubmitted(term.trim()) }}
            className="flex gap-2"
          >
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="نام مرکز خود را بنویسید…"
              aria-label="جست‌وجوی نام مرکز"
            />
            <Button type="submit" size="icon" aria-label="جست‌وجو"
                    disabled={term.trim().length < 3}>
              <Search className="size-4" aria-hidden="true" />
            </Button>
          </form>

          {term.trim().length > 0 && term.trim().length < 3 && (
            <p className="mt-2 text-xs text-muted-foreground">
              برای جست‌وجو حداقل سه حرف بنویسید.
            </p>
          )}

          {search.isFetching && (
            <div className="grid place-items-center py-12">
              <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden="true" />
            </div>
          )}

          {search.data && search.data.items.length === 0 && submitted.length >= 3 && (
            <div className="mt-6 rounded-2xl border border-border bg-muted/30 px-6 py-12 text-center">
              <AlertCircle className="mx-auto size-6 text-muted-foreground" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold">مرکزی با این نام پیدا نشد</p>
              <p className="mt-1 text-xs text-muted-foreground">
                املای دیگری را امتحان کنید، یا از{' '}
                <a href="/support" className="font-bold text-primary underline">پشتیبانی</a>{' '}
                بخواهید اضافه شود.
              </p>
            </div>
          )}

          {search.data && search.data.items.length > 0 && (
            <ul className="mt-5 space-y-2">
              {search.data.items.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setChosen(s)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl
                      border border-border bg-card px-4 py-3 text-start
                      transition-colors hover:border-primary/40
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-bold">{s.name}</span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {CATEGORY_FA[s.category] ?? s.category} · {s.address}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-bold text-primary">این ما هستیم</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <ClaimForm store={chosen} onBack={() => setChosen(null)} />
      )}
    </div>
  )
}

function ClaimForm({ store, onBack }: { store: StoreHit; onBack: () => void }) {
  const [form, setForm] = useState({
    name: '', role: 'owner', phone: '', email: '',
    national_id: '', licence_no: '', proof: '', note: '',
  })
  const create = useMutation({
    mutationFn: () => getJson<{ store: string; message: string }>(
      '/api/business/claims', { method: 'POST', body: JSON.stringify({ ...form, store_id: store.id }) }),
  })

  if (create.isSuccess) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl
          bg-emerald-500/10 text-emerald-600">
          <Check className="size-6" aria-hidden="true" />
        </span>
        <p className="mt-4 text-sm font-bold">درخواست شما ثبت شد</p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {create.data.message}
        </p>
      </div>
    )
  }

  const nidDigits = form.national_id.replace(/\D/g, '')
  const invalid =
    form.name.trim().length < 2 ||
    form.phone.replace(/\D/g, '').length < 8 ||
    nidDigits.length < 8 ||
    form.licence_no.trim().length < 3

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (!invalid) create.mutate() }}
      className="space-y-3 rounded-2xl border border-border bg-card p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">مرکز انتخاب‌شده</p>
          <p className="mt-0.5 truncate font-bold">{store.name}</p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onBack}>
          تغییر
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="c-name">نام شما</Label>
          <Input id="c-name" value={form.name} required
                 onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-role">سمت</Label>
          <select id="c-role" value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm">
            {ROLE_FA.map((r) => <option key={r.v} value={r.v}>{r.l}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="c-nid">کد ملی</Label>
        <Input id="c-nid" value={form.national_id} dir="ltr" inputMode="numeric"
               required maxLength={10}
               onChange={(e) => setForm({ ...form, national_id: e.target.value })} />
        <p className="text-[11px] text-muted-foreground">
          برای تطبیق با نام روی جواز کسب.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="c-lic">شمارهٔ جواز کسب</Label>
        <Input id="c-lic" value={form.licence_no} dir="ltr" required
               onChange={(e) => setForm({ ...form, licence_no: e.target.value })} />
        <p className="text-[11px] text-muted-foreground">
          شماره‌ای که روی پروانهٔ کسب شما چاپ شده. این تنها چیزی است که
          یک غریبه نمی‌تواند از فهرست عمومی ما بسازد.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="c-phone">شماره تماس</Label>
        <Input id="c-phone" value={form.phone} dir="ltr" inputMode="numeric" required
               onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <p className="text-[11px] text-muted-foreground">
          با همین شماره تماس می‌گیریم تا مطمئن شویم مرکز مال شماست.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="c-note">توضیح (اختیاری)</Label>
        <textarea id="c-note" rows={3} value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="مثلاً: شمارهٔ تلفن روی نقشه قدیمی است"
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" />
      </div>

      {create.isError && (
        <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-xs
          font-semibold text-destructive">
          {create.error instanceof Error ? create.error.message : 'ثبت انجام نشد'}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={invalid || create.isPending}>
        {create.isPending && <Loader2 className="me-2 size-4 animate-spin" aria-hidden="true" />}
        ثبت درخواست
      </Button>

      <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
        درخواست را یک نفر بررسی می‌کند، چون داشبورد نام و شمارهٔ
        مشتریانتان را نشان می‌دهد.
      </p>
    </form>
  )
}
