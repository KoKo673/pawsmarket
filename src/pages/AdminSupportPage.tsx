import {
  AlertCircle, ChevronLeft, Inbox, Loader2, Phone, Send,
} from 'lucide-react'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { AdminNav } from '@/components/AdminNav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { faDigits } from '@/lib/fa'
import { adminApi, type Ticket, type TicketThread } from '@/lib/admin-api'

/**
 * صف پشتیبانی — سمت ادمین.
 *
 * Oldest first, because the person who has waited longest is the one whose
 * problem is now a complaint. The API already sorts that way; this page
 * keeps the order visible by showing the wait time on every row.
 *
 * Replying moves a ticket to `pending` — meaning "we answered, the ball is
 * with the customer". That is a different thing from `resolved`, which a
 * human sets deliberately, so the queue never quietly empties itself just
 * because someone wrote a reply.
 */

const STATUSES = ['open', 'pending', 'resolved', 'closed'] as const

const STATUS_FA: Record<string, string> = {
  open: 'در انتظار پاسخ ما',
  pending: 'منتظر مشتری',
  resolved: 'حل‌شده',
  closed: 'بسته',
}

const TOPIC_FA: Record<string, string> = {
  order: 'سفارش',
  payment: 'پرداخت',
  booking: 'نوبت',
  account: 'حساب',
  product: 'محصول',
  other: 'دیگر',
}

export function AdminSupportPage() {
  const [status, setStatus] = useState<string>('open')
  const [openId, setOpenId] = useState<number | null>(null)
  const qc = useQueryClient()

  const q = useQuery({
    queryKey: ['admin', 'tickets', status],
    queryFn: () => adminApi.tickets(status),
  })

  function refresh() {
    void qc.invalidateQueries({ queryKey: ['admin', 'tickets'] })
    void qc.invalidateQueries({ queryKey: ['admin', 'overview'] })
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 pt-28 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight">صف پشتیبانی</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          قدیمی‌ترین اول. پاسخ شما تیکت را به «منتظر مشتری» می‌برد؛ بستن آن
          یک تصمیم جداگانه است.
        </p>
      </header>

      <AdminNav />

      <div role="tablist" aria-label="وضعیت تیکت"
           className="mb-5 flex gap-1 overflow-x-auto rounded-xl border border-border p-1">
        {STATUSES.map(s => (
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
            {status === 'open' ? 'صف خالی است' : 'چیزی در این وضعیت نیست'}
          </p>
          {status === 'open' && (
            <p className="mt-1 text-xs text-muted-foreground">هیچ تیکتی منتظر شما نیست.</p>
          )}
        </div>
      )}

      {q.data && q.data.items.length > 0 && (
        <ul className="space-y-2">
          {q.data.items.map((t: Ticket) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => setOpenId(openId === t.id ? null : t.id)}
                aria-expanded={openId === t.id}
                className="flex w-full items-start justify-between gap-3 rounded-xl
                  border border-border bg-card px-4 py-3 text-start
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-bold">{t.subject}</span>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5
                      text-[10px] font-bold text-muted-foreground">
                      {TOPIC_FA[t.topic] ?? t.topic}
                    </span>
                    {t.replies > 1 && (
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {faDigits(t.replies)} پیام
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block truncate text-xs text-muted-foreground">
                    {t.username ?? t.contact_name}
                    {' · '}
                    {waitingFor(t.created_at)}
                  </span>
                </span>
                <ChevronLeft
                  className={`mt-1 size-4 shrink-0 text-muted-foreground transition-transform
                    ${openId === t.id ? '-rotate-90' : ''}`}
                  aria-hidden="true"
                />
              </button>

              {openId === t.id && (
                <Thread id={t.id} onChanged={refresh} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** «۳ ساعت پیش» — because an absolute timestamp makes the reader do the math. */
function waitingFor(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (minutes < 1) return 'همین حالا'
  if (minutes < 60) return `${faDigits(minutes)} دقیقه پیش`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${faDigits(hours)} ساعت پیش`
  return `${faDigits(Math.floor(hours / 24))} روز پیش`
}

function Thread({ id, onChanged }: { id: number; onChanged: () => void }) {
  const qc = useQueryClient()
  const [text, setText] = useState('')

  const q = useQuery({
    queryKey: ['admin', 'ticket', id],
    queryFn: () => adminApi.ticket(id),
  })

  const reply = useMutation({
    mutationFn: () => adminApi.reply(id, text.trim()),
    onSuccess: () => {
      setText('')
      void qc.invalidateQueries({ queryKey: ['admin', 'ticket', id] })
      onChanged()
    },
  })

  const setStatus = useMutation({
    mutationFn: (s: string) => adminApi.setTicketStatus(id, s),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'ticket', id] })
      onChanged()
    },
  })

  if (q.isPending) {
    return <p className="px-4 py-3 text-xs text-muted-foreground">در حال بارگذاری…</p>
  }
  if (q.isError) {
    return <p className="px-4 py-3 text-xs text-destructive">گفتگو بارگذاری نشد</p>
  }
  const t: TicketThread = q.data

  return (
    <div className="mt-2 space-y-3 rounded-xl border border-border bg-muted/20 p-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <a href={`tel:${t.contact_phone.replace(/[^+\d]/g, '')}`}
           className="inline-flex items-center gap-1 font-semibold text-primary">
          <Phone className="size-3.5" aria-hidden="true" />
          {faDigits(t.contact_phone)}
        </a>
        <span className="text-muted-foreground">{t.contact_name}</span>
        {t.order_id && (
          <span className="text-muted-foreground">
            سفارش #{faDigits(t.order_id)}
          </span>
        )}
      </div>

      <ul className="space-y-2">
        {t.messages.map(m => (
          <li key={m.id} className={`rounded-lg px-3 py-2 text-sm ${
            m.author === 'customer' ? 'bg-card'
            : m.author === 'agent' ? 'bg-primary/10'
            : 'text-center text-[11px] text-muted-foreground'}`}>
            {m.body}
          </li>
        ))}
      </ul>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (text.trim() && !reply.isPending) reply.mutate()
        }}
        className="flex gap-2"
      >
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="پاسخ به مشتری…"
          aria-label="پاسخ"
        />
        <Button type="submit" size="icon" disabled={!text.trim() || reply.isPending}
                aria-label="ارسال پاسخ">
          {reply.isPending
            ? <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            : <Send className="size-4" aria-hidden="true" />}
        </Button>
      </form>

      {reply.isError && (
        <p role="alert" className="text-[11px] font-semibold text-destructive">
          پاسخ ثبت نشد؛ دوباره تلاش کنید.
        </p>
      )}

      <div className="flex flex-wrap gap-1.5 border-t border-border pt-3">
        {STATUSES.filter(s => s !== t.status).map(s => (
          <button
            key={s}
            type="button"
            disabled={setStatus.isPending}
            onClick={() => setStatus.mutate(s)}
            className="rounded-full border border-border bg-card px-2.5 py-1
              text-[11px] font-bold text-muted-foreground hover:text-foreground
              disabled:opacity-50"
          >
            → {STATUS_FA[s]}
          </button>
        ))}
      </div>
    </div>
  )
}
