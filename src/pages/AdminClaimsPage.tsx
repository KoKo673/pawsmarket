import {
  AlertCircle, BadgeCheck, Check, CheckCircle2, Copy, ExternalLink,
  Inbox, Loader2, Phone, ShieldQuestion, X,
} from 'lucide-react'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { AdminNav } from '@/components/AdminNav'
import { Button } from '@/components/ui/button'
import { faDigits } from '@/lib/fa'
import { adminApi, type Claim } from '@/lib/admin-api'

/**
 * صف درخواست‌های دسترسی — /admin/claims
 *
 * ── Why this page had to exist ────────────────────────────────────────
 * The API for this has existed since migration 0016 and was reviewed,
 * tested and deployed. Measured on production 2026-10-31:
 *
 *     store_claims      0
 *     dashboard_hash    0  of 447
 *     POST /api/business/claims   reachable, works, nobody has one
 *
 * The endpoints `GET /api/admin/claims`, `/approve` and `/reject` were all
 * written — and nothing in the browser called them. So a clinic that filled
 * in the form at /for-business wrote a row and then waited for a human who
 * had no screen to read it on, and the approval could only be done by
 * `curl` with an admin token. The feature was complete except for the part
 * that made it usable, which is the same shape as the original gap: the
 * dashboard worked and nobody could open it.
 *
 * ── Why the evidence is shown, not summarised ─────────────────────────
 * The decision here is «is this person who they say they are», and the three
 * fields that answer it — national id, licence number, proof — are what
 * migration 0017 added. A row that showed only a name and a phone would be
 * approving on exactly what a stranger who read the public listing already
 * knows. They are rendered raw and unformatted on purpose: the reviewer
 * checks a number against a document, so a prettified one is harder to
 * compare, and faDigits is deliberately not applied to them.
 *
 * ── Why approval shows the link once ──────────────────────────────────
 * `approve` mints the token and stores only its hash, in one transaction.
 * There is no way to retrieve it afterwards, so the URL is shown on screen
 * with a copy button and the page says so plainly. This matches
 * AdminStoresPage, which had the same constraint.
 */

const CATEGORY_FA: Record<string, string> = {
  vet: 'دامپزشک', groomer: 'آرایشگاه', boarding: 'پانسیون',
  shelter: 'پناهگاه', cafe: 'کافه', shop: 'فروشگاه',
}

const ROLE_FA: Record<string, string> = {
  owner: 'مالک', manager: 'مدیر', staff: 'کارمند',
}

const STATUSES = ['pending', 'approved', 'rejected'] as const

const STATUS_FA: Record<string, string> = {
  pending: 'در انتظار بررسی',
  approved: 'تأییدشده',
  rejected: 'ردشده',
}

export function AdminClaimsPage() {
  const [status, setStatus] = useState<string>('pending')
  const [openId, setOpenId] = useState<number | null>(null)
  /** claim id → the one-time dashboard URL, kept only for this page view. */
  const [issued, setIssued] = useState<Record<number, string>>({})
  const qc = useQueryClient()

  const q = useQuery({
    queryKey: ['admin', 'claims', status],
    queryFn: () => adminApi.claims(status),
  })

  function refresh() {
    void qc.invalidateQueries({ queryKey: ['admin', 'claims'] })
    void qc.invalidateQueries({ queryKey: ['admin', 'overview'] })
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 pt-28 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight">
          درخواست‌های دسترسی مراکز
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          قدیمی‌ترین اول. تأیید، لینک داشبورد را در همان لحظه می‌سازد و
          همان یک بار نشان داده می‌شود.
        </p>
      </header>

      <AdminNav />

      <div role="tablist" aria-label="وضعیت درخواست"
           className="mb-5 flex gap-1 overflow-x-auto rounded-xl border border-border p-1">
        {STATUSES.map((s) => (
          <button
            key={s}
            role="tab"
            type="button"
            aria-selected={status === s}
            onClick={() => { setStatus(s); setOpenId(null) }}
            className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold
              transition-colors ${status === s
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'}`}
          >
            {STATUS_FA[s]}
          </button>
        ))}
      </div>

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

      {q.data && q.data.items.length === 0 && (
        <div className="rounded-2xl border border-border bg-muted/30 px-6 py-14 text-center">
          <Inbox className="mx-auto size-7 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold">
            {status === 'pending' ? 'صف خالی است' : 'چیزی در این وضعیت نیست'}
          </p>
          {status === 'pending' && (
            <p className="mt-1 text-xs text-muted-foreground">
              هیچ مرکزی درخواست دسترسی نداده است.
            </p>
          )}
        </div>
      )}

      {q.data && q.data.items.length > 0 && (
        <ul className="space-y-2">
          {q.data.items.map((c: Claim) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setOpenId(openId === c.id ? null : c.id)}
                aria-expanded={openId === c.id}
                className="flex w-full items-start justify-between gap-3 rounded-xl
                  border border-border bg-card px-4 py-3 text-start
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-bold">{c.store_name}</span>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5
                      text-[10px] font-bold text-muted-foreground">
                      {CATEGORY_FA[c.category] ?? c.category}
                    </span>
                  </span>
                  <span className="mt-1 block truncate text-xs text-muted-foreground">
                    {c.name}
                    {' · '}
                    {ROLE_FA[c.role] ?? c.role}
                    {' · '}
                    {waitingFor(c.created_at)}
                  </span>
                </span>
                {issued[c.id] && (
                  <BadgeCheck className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />
                )}
              </button>

              {openId === c.id && (
                <ClaimDetail
                  claim={c}
                  issuedUrl={issued[c.id]}
                  onIssued={(url) => setIssued((p) => ({ ...p, [c.id]: url }))}
                  onChanged={refresh}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function waitingFor(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (minutes < 1) return 'همین حالا'
  if (minutes < 60) return `${faDigits(minutes)} دقیقه پیش`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${faDigits(hours)} ساعت پیش`
  return `${faDigits(Math.floor(hours / 24))} روز پیش`
}

function ClaimDetail({
  claim, issuedUrl, onIssued, onChanged,
}: {
  claim: Claim
  issuedUrl?: string
  onIssued: (url: string) => void
  onChanged: () => void
}) {
  const [copied, setCopied] = useState(false)

  const approve = useMutation({
    mutationFn: () => adminApi.approveClaim(claim.id),
    onSuccess: (data) => { onIssued(data.url); onChanged() },
  })

  const reject = useMutation({
    mutationFn: () => adminApi.rejectClaim(claim.id),
    onSuccess: () => { onChanged() },
  })

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // The URL is on screen and selectable; a blocked clipboard is not
      // worth an error banner.
    }
  }

  const pending = claim.status === 'pending'

  return (
    <div className="mt-2 space-y-3 rounded-xl border border-border bg-muted/20 p-4">
      <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-xs sm:grid-cols-2">
        <Field label="مرکز">
          <span className="font-semibold">{claim.store_name}</span>
          <span className="block text-muted-foreground">{claim.address}</span>
        </Field>
        <Field label="تماس">
          <a href={`tel:${claim.phone.replace(/[^+\d]/g, '')}`}
             className="inline-flex items-center gap-1 font-semibold text-primary">
            <Phone className="size-3.5" aria-hidden="true" />
            {faDigits(claim.phone)}
          </a>
          {claim.email && (
            <span className="block truncate text-muted-foreground">{claim.email}</span>
          )}
        </Field>

        {/* Rendered exactly as typed. The reviewer compares these against a
            document — a prettified or digit-converted one is harder to check. */}
        <Field label="کد ملی">
          <span dir="ltr" className="block font-mono text-[13px] tracking-wider">
            {claim.national_id || '—'}
          </span>
        </Field>
        <Field label="شمارهٔ جواز کسب">
          <span dir="ltr" className="block font-mono text-[13px] tracking-wider">
            {claim.licence_no || '—'}
          </span>
        </Field>
      </dl>

      {claim.proof && (
        <div className="rounded-lg bg-card px-3 py-2">
          <p className="text-[11px] font-bold text-muted-foreground">شاهد</p>
          <p className="mt-1 whitespace-pre-wrap text-sm">{claim.proof}</p>
        </div>
      )}

      {claim.note && (
        <div className="rounded-lg bg-card px-3 py-2">
          <p className="text-[11px] font-bold text-muted-foreground">یادداشت متقاضی</p>
          <p className="mt-1 whitespace-pre-wrap text-sm">{claim.note}</p>
        </div>
      )}

      {!claim.national_id && !claim.licence_no && !claim.proof && (
        <p role="alert"
           className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2
             text-[11px] font-semibold text-destructive">
          <ShieldQuestion className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          هیچ شاهدی ثبت نشده — این درخواست را تأیید نکنید.
        </p>
      )}

      {issuedUrl ? (
        <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-3">
          <p className="flex items-center gap-1.5 text-[11px] font-bold">
            <CheckCircle2 className="size-3.5" aria-hidden="true" />
            تأیید شد — این لینک فقط همین یک بار نمایش داده می‌شود
          </p>
          <div className="flex gap-2">
            <code dir="ltr"
                  className="min-w-0 flex-1 select-all overflow-x-auto rounded-md
                    bg-card px-2 py-1.5 font-mono text-[11px]">
              {issuedUrl}
            </code>
            <Button type="button" size="icon-sm" variant="outline"
                    onClick={() => copy(issuedUrl)} aria-label="رونوشت لینک">
              {copied
                ? <Check className="size-3.5" aria-hidden="true" />
                : <Copy className="size-3.5" aria-hidden="true" />}
            </Button>
            <Button asChild size="icon-sm" variant="outline">
              <a href={issuedUrl} target="_blank" rel="noreferrer"
                 aria-label="باز کردن داشبورد">
                <ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
            </Button>
          </div>
        </div>
      ) : pending ? (
        <div className="flex flex-wrap gap-2 border-t border-border pt-3">
          <Button type="button" size="sm" disabled={approve.isPending}
                  onClick={() => approve.mutate()}
                  className="gap-1.5">
            {approve.isPending
              ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              : <Check className="size-3.5" aria-hidden="true" />}
            تأیید و ساخت لینک
          </Button>
          <Button type="button" size="sm" variant="outline"
                  disabled={reject.isPending} onClick={() => reject.mutate()}
                  className="gap-1.5">
            {reject.isPending
              ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              : <X className="size-3.5" aria-hidden="true" />}
            رد
          </Button>
        </div>
      ) : (
        <p className="border-t border-border pt-3 text-[11px] text-muted-foreground">
          {STATUS_FA[claim.status] ?? claim.status}
          {claim.reviewed_at && ` · ${faDigits(claim.reviewed_at.slice(0, 10))}`}
        </p>
      )}

      {(approve.isError || reject.isError) && (
        <p role="alert" className="text-[11px] font-semibold text-destructive">
          درخواست انجام نشد؛ دوباره تلاش کنید.
        </p>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-bold text-muted-foreground">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  )
}
