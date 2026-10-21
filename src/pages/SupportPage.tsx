import { ChevronLeft, LifeBuoy, Loader2, MessageSquare, Send } from 'lucide-react'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { faDigits } from '@/lib/fa'
import { getToken } from '@/lib/social-api'
import { useAuthStore } from '@/store/auth.store'

/**
 * پشتیبانی — باز کردن تیکت و خواندن پاسخ‌ها.
 *
 * A queue, not a chatbot. Every question worth asking here — a double
 * charge, a booking nobody confirmed — has one correct answer that lives
 * in the database, and a model asked to answer it would sound confident
 * while being wrong. A person with the order in front of them does not.
 */

const API = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) throw new Error((body as { detail?: string })?.detail || 'درخواست انجام نشد')
  return body as T
}

const TOPICS: { value: string; label: string }[] = [
  { value: 'order', label: 'سفارش' },
  { value: 'payment', label: 'پرداخت' },
  { value: 'booking', label: 'نوبت' },
  { value: 'account', label: 'حساب کاربری' },
  { value: 'product', label: 'محصول' },
  { value: 'other', label: 'موضوع دیگر' },
]

const STATUS_FA: Record<string, string> = {
  open: 'در انتظار پاسخ',
  pending: 'پاسخ داده شد',
  resolved: 'حل شد',
  closed: 'بسته',
}

interface Ticket {
  id: number
  subject: string
  status: string
  topic: string
  created_at: string
  last_reply_at: string | null
}

export function SupportPage() {
  const user = useAuthStore((s) => s.user)
  const [openId, setOpenId] = useState<number | null>(null)

  const list = useQuery({
    queryKey: ['tickets'],
    queryFn: () => api<{ items: Ticket[] }>('/api/support/tickets'),
    enabled: !!user,
  })

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-28 sm:px-6">
      <header className="mb-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          <LifeBuoy className="size-3.5" />
          پشتیبانی
        </span>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight">چطور کمک کنیم؟</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          پیام بگذارید؛ یک نفر از تیم پاسخ می‌دهد. برای مشکل پرداخت یا
          سفارش، شمارهٔ سفارش را هم بنویسید تا سریع‌تر پیدا شود.
        </p>
      </header>

      {user && list.data && list.data.items.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-bold">تیکت‌های شما</h2>
          <ul className="space-y-2">
            {list.data.items.map(t => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(openId === t.id ? null : t.id)}
                  className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-start"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">{t.subject}</span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">
                      {STATUS_FA[t.status] ?? t.status} · #{faDigits(t.id)}
                    </span>
                  </span>
                  <ChevronLeft className={`size-4 shrink-0 text-muted-foreground transition-transform ${openId === t.id ? '-rotate-90' : ''}`} />
                </button>
                {openId === t.id && <Thread id={t.id} />}
              </li>
            ))}
          </ul>
        </section>
      )}

      <Assistant />

      <NewTicket signedIn={!!user} onCreated={() => void list.refetch()} />
    </div>
  )
}

/**
 * دستیار — پاسخ از دیتابیس، نه از یک مدل.
 *
 * Sits *above* the ticket form on purpose: most questions are one of a
 * handful, and answering them instantly is better than queueing a human
 * for something the database already knows. The form stays visible
 * underneath, because the assistant's own failures have to end somewhere
 * a person will read.
 *
 * It says what it is. A box that looks like a chatbot but always answers
 * from templates would be a lie if it pretended otherwise; the copy makes
 * clear that every sentence comes from orders and site rules.
 */
function Assistant() {
  const [text, setText] = useState('')
  const [thread, setThread] = useState<{ q: string; a: string; handoff?: boolean }[]>([])

  const ask = useMutation({
    mutationFn: async (question: string) => {
      const res = await fetch(`${API}/api/assistant/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
        body: JSON.stringify({ text: question }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error((body as { detail?: string })?.detail || 'پاسخ نیامد')
      }
      return body as { reply: string; handoff: boolean }
    },
    onSuccess: (data, question) => {
      setThread(t => [...t, { q: question, a: data.reply, handoff: data.handoff }])
      setText('')
    },
  })

  return (
    <section className="mb-6 rounded-2xl border border-border bg-card p-4">
      <h2 className="text-sm font-bold">یک سؤال سریع</h2>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        پاسخ‌ها از سفارش‌ها و قوانین همین سایت می‌آید — نه از حدس. اگر
        موضوع دربارهٔ پول یا شکایت باشد، همین‌جا به یک نفر ارجاع داده می‌شود.
      </p>

      {thread.length > 0 && (
        <ul className="mt-3 space-y-3">
          {thread.map((m, i) => (
            <li key={i} className="space-y-1.5">
              <p className="ms-auto w-fit max-w-[85%] rounded-lg bg-primary/10 px-3 py-2 text-sm">
                {m.q}
              </p>
              <p className="me-auto w-fit max-w-full whitespace-pre-line rounded-lg
                bg-muted/50 px-3 py-2 text-sm leading-relaxed">
                {m.a}
              </p>
              {m.handoff && (
                <p className="me-auto w-fit max-w-full rounded-lg bg-amber-500/10
                  px-3 py-2 text-[11px] font-semibold text-amber-700">
                  برای پیگیری، از فرم پایین یک تیکت بگذارید.
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (text.trim() && !ask.isPending) ask.mutate(text.trim())
        }}
        className="mt-3 flex gap-2"
      >
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="مثلاً: سفارش من کجاست؟"
          aria-label="سؤال از دستیار"
        />
        <Button type="submit" size="icon" disabled={!text.trim() || ask.isPending}
                aria-label="پرسیدن">
          {ask.isPending
            ? <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            : <Send className="size-4" aria-hidden="true" />}
        </Button>
      </form>

      {ask.isError && (
        <p role="alert" className="mt-2 text-[11px] font-semibold text-destructive">
          {ask.error instanceof Error ? ask.error.message : 'پاسخ نیامد'}
        </p>
      )}
    </section>
  )
}

function Thread({ id }: { id: number }) {
  const q = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => api<{ messages: { id: number; author: string; body: string; created_at: string }[] }>(
      `/api/support/tickets/${id}`),
  })
  const qc = useQueryClient()
  const [text, setText] = useState('')
  const reply = useMutation({
    mutationFn: () => api(`/api/support/tickets/${id}/reply`, {
      method: 'POST', body: JSON.stringify({ body: text }),
    }),
    onSuccess: () => {
      setText('')
      void qc.invalidateQueries({ queryKey: ['ticket', id] })
      void qc.invalidateQueries({ queryKey: ['tickets'] })
    },
  })

  if (q.isPending) return <p className="px-3 py-3 text-xs text-muted-foreground">در حال بارگذاری…</p>
  if (q.isError) return <p className="px-3 py-3 text-xs text-destructive">گفتگو بارگذاری نشد</p>

  return (
    <div className="mt-2 space-y-2 rounded-xl border border-border bg-muted/20 p-3">
      {q.data.messages.map(m => (
        <div key={m.id} className={`rounded-lg px-3 py-2 text-sm ${
          m.author === 'customer' ? 'bg-primary/10 ms-auto max-w-[85%]'
          : m.author === 'system' ? 'text-center text-[11px] text-muted-foreground'
          : 'bg-card me-auto max-w-[85%]'}`}>
          {m.body}
        </div>
      ))}
      <form
        onSubmit={(e) => { e.preventDefault(); if (text.trim()) reply.mutate() }}
        className="flex gap-2 pt-1"
      >
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="پاسخ شما…" />
        <Button type="submit" size="icon" disabled={!text.trim() || reply.isPending} aria-label="ارسال">
          {reply.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </Button>
      </form>
    </div>
  )
}

function NewTicket({ signedIn, onCreated }: { signedIn: boolean; onCreated: () => void }) {
  const [form, setForm] = useState({
    subject: '', body: '', topic: 'other', contact_name: '', contact_phone: '',
  })
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const create = useMutation({
    mutationFn: () => api('/api/support/tickets', {
      method: 'POST', body: JSON.stringify(form),
    }),
    onSuccess: () => { setDone(true); onCreated() },
    onError: (e: unknown) => setError(e instanceof Error ? e.message : 'ثبت انجام نشد'),
  })

  if (done) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <MessageSquare className="mx-auto size-7 text-accent" />
        <p className="mt-3 text-sm font-bold">پیام شما ثبت شد</p>
        <p className="mt-1 text-xs text-muted-foreground">در اولین فرصت پاسخ می‌دهیم.</p>
      </div>
    )
  }

  const invalid = form.subject.trim().length < 4 || form.body.trim().length < 10
    || form.contact_name.trim().length < 2 || form.contact_phone.replace(/\D/g, '').length < 8

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); setError(null); if (!invalid) create.mutate() }}
      className="space-y-3 rounded-2xl border border-border bg-card p-4"
    >
      <h2 className="text-sm font-bold">{signedIn ? 'تیکت تازه' : 'پیام بدون حساب'}</h2>

      <div className="space-y-1.5">
        <Label htmlFor="t-subject">موضوع</Label>
        <Input id="t-subject" value={form.subject}
               onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="t-topic">دسته</Label>
        <select id="t-topic" value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm">
          {TOPICS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="t-body">توضیح</Label>
        <textarea id="t-body" rows={4} value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })} required
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" />
      </div>

      {!signedIn && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="t-name">نام</Label>
            <Input id="t-name" value={form.contact_name}
                   onChange={(e) => setForm({ ...form, contact_name: e.target.value })} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-phone">شماره تماس</Label>
            <Input id="t-phone" value={form.contact_phone} dir="ltr" inputMode="numeric"
                   onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} required />
          </div>
        </div>
      )}

      {error && <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={invalid || create.isPending}>
        {create.isPending && <Loader2 className="me-2 size-4 animate-spin" />}
        ارسال
      </Button>

      {!signedIn && (
        <p className="text-center text-[11px] text-muted-foreground">
          حساب دارید؟ <Link to="/login?next=/support" className="font-bold text-primary underline">وارد شوید</Link>
        </p>
      )}
    </form>
  )
}
