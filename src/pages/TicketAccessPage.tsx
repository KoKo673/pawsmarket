import { AlertCircle, LifeBuoy, Loader2, Send } from 'lucide-react'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { faDigits } from '@/lib/fa'

/**
 * تیکت با لینک — برای کسی که حساب ندارد.
 *
 * An anonymous ticket had no way back to its own answer: creating one
 * returned the ticket, and reading required a session the person does not
 * have. So they wrote, a human replied, and the reply was never seen.
 *
 * The token in the URL is the credential. It is checked against a stored
 * hash on the server, it unlocks exactly one ticket, and a wrong token is
 * a 404 — the same answer as a ticket that does not exist, so a guess
 * learns nothing.
 */

const API = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')

const STATUS_FA: Record<string, string> = {
  open: 'در انتظار پاسخ',
  pending: 'پاسخ داده شد',
  resolved: 'حل شد',
  closed: 'بسته',
}

interface Thread {
  id: number
  subject: string
  status: string
  topic: string
  created_at: string
  messages: { id: number; author: string; body: string; created_at: string }[]
}

async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error((body as { detail?: string })?.detail || 'این تیکت پیدا نشد')
  }
  return body as T
}

export function TicketAccessPage() {
  const { access } = useParams<{ access: string }>()
  const qc = useQueryClient()
  const [text, setText] = useState('')

  const q = useQuery({
    queryKey: ['ticket-access', access],
    queryFn: () => getJson<Thread>(`/api/support/tickets/access/${access}`),
    enabled: !!access,
    retry: false,
  })

  const reply = useMutation({
    mutationFn: () => getJson(`/api/support/tickets/access/${access}/reply`, {
      method: 'POST',
      body: JSON.stringify({ body: text.trim() }),
    }),
    onSuccess: () => {
      setText('')
      void qc.invalidateQueries({ queryKey: ['ticket-access', access] })
    },
  })

  if (q.isPending) {
    return (
      <div className="grid place-items-center py-32">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">در حال بارگذاری</span>
      </div>
    )
  }

  if (q.isError || !q.data) {
    return (
      <div className="mx-auto max-w-xl px-4 pb-24 pt-28 sm:px-6">
        <div className="rounded-3xl border border-border bg-muted/30 px-6 py-16 text-center">
          <AlertCircle className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
          <h1 className="mt-3 text-lg font-extrabold">این تیکت پیدا نشد</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            ممکن است لینک ناقص کپی شده باشد. لینک را کامل و بدون فاصله
            بچسبانید.
          </p>
          <Button asChild variant="outline" className="mt-5">
            <Link to="/support">بازگشت به پشتیبانی</Link>
          </Button>
        </div>
      </div>
    )
  }

  const t = q.data

  return (
    <div className="mx-auto max-w-xl px-4 pb-24 pt-28 sm:px-6">
      <header className="mb-5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10
          px-3 py-1 text-xs font-bold text-primary">
          <LifeBuoy className="size-3.5" aria-hidden="true" />
          {STATUS_FA[t.status] ?? t.status}
          {' · '}
          #{faDigits(t.id)}
        </span>
        <h1 className="mt-3 text-xl font-extrabold leading-tight">{t.subject}</h1>
      </header>

      <ul className="space-y-2.5">
        {t.messages.map(m => (
          <li key={m.id} className={`rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
            m.author === 'customer' ? 'bg-primary/10'
            : m.author === 'agent' ? 'bg-card border border-border'
            : 'text-center text-[11px] text-muted-foreground'}`}>
            {m.author === 'agent' && (
              <p className="mb-1 text-[10px] font-bold text-muted-foreground">پشتیبانی</p>
            )}
            {m.body}
          </li>
        ))}
      </ul>

      {t.status !== 'closed' && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (text.trim() && !reply.isPending) reply.mutate()
          }}
          className="mt-5 flex gap-2"
        >
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="پاسخ شما…"
            aria-label="پاسخ"
          />
          <Button type="submit" size="icon" disabled={!text.trim() || reply.isPending}
                  aria-label="ارسال">
            {reply.isPending
              ? <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              : <Send className="size-4" aria-hidden="true" />}
          </Button>
        </form>
      )}

      {reply.isError && (
        <p role="alert" className="mt-2 text-[11px] font-semibold text-destructive">
          پاسخ ثبت نشد؛ دوباره تلاش کنید.
        </p>
      )}

      <p className="mt-6 text-[11px] leading-relaxed text-muted-foreground">
        این لینک را جایی امن نگه دارید. هر کسی آن را داشته باشد، این
        گفتگو را می‌بیند.
      </p>
    </div>
  )
}
