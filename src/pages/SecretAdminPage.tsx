import { KeyRound, Loader2, ShieldCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { setToken } from '@/lib/social-api'
import { useAuthStore } from '@/store/auth.store'

/**
 * درب پشتی مدیر — `/:secret/enter`
 *
 * The panel has no link anywhere in the site. An operator opens it by
 * typing a path they configured on the server (`ADMIN_BACKDOOR_PATH`); a
 * visitor who does not know it sees the ordinary 404 page, because the
 * route only resolves when that segment matches.
 *
 * The form asks for three things, and all three are required:
 *   · the account username
 *   · the account password
 *   · a passphrase that exists only in the server's environment
 *
 * The passphrase is the point. A stolen password is not enough, and the
 * passphrase alone is not enough — the server checks both, plus
 * `is_admin`, before it issues a session.
 *
 * This page draws a form and nothing else. It holds no secret, and it
 * decides nothing: if someone guesses the path, they still have to get
 * past the server.
 */

const API = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')

export function SecretAdminPage() {
  const { secret } = useParams<{ secret: string }>()
  const navigate = useNavigate()
  const hydrate = useAuthStore((s) => s.hydrate)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const res = await fetch(`${API}/${secret}/enter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, passphrase }),
      })
      const body = await res.json().catch(() => null)

      if (!res.ok) {
        // The server answers 401 for every failure shape and 404 when the
        // path is wrong — deliberately indistinguishable. The message here
        // must not add detail the server chose to withhold.
        setError('ورود ناموفق')
        return
      }

      setToken(body.token)
      await hydrate()
      navigate('/admin', { replace: true })
    } catch {
      setError('ارتباط برقرار نشد')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-sm flex-col justify-center px-4 pb-24 pt-24">
      <form
        onSubmit={submit}
        className="rounded-3xl border border-border bg-card p-6 shadow-lifted"
      >
        <div className="text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl
            bg-foreground text-background">
            <ShieldCheck className="size-6" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-lg font-extrabold tracking-tight">دسترسی مدیریت</h1>
        </div>

        <div className="mt-6 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="s-user">نام کاربری</Label>
            <Input id="s-user" value={username} autoComplete="username"
                   onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-pass">رمز عبور</Label>
            <Input id="s-pass" type="password" value={password}
                   autoComplete="current-password"
                   onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-phrase">عبارت عبور</Label>
            <Input id="s-phrase" type="password" value={passphrase}
                   autoComplete="off" dir="ltr"
                   onChange={(e) => setPassphrase(e.target.value)} required />
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-3 rounded-xl bg-destructive/10 px-3 py-2
            text-xs font-semibold text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" className="mt-5 w-full gap-2" disabled={busy}>
          {busy
            ? <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            : <KeyRound className="size-4" aria-hidden="true" />}
          ورود
        </Button>
      </form>
    </div>
  )
}
