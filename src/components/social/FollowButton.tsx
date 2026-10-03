import { Check, Loader2, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { faDigits } from '@/lib/fa'
import { socialApi } from '@/lib/social-api'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'

/**
 * دکمه‌ی دنبال‌کردن — خوش‌بینانه با برگشت در صورت خطا.
 * برای مهمان: هدایت به /login با next برمی‌گردد.
 */
export function FollowButton({
  petId,
  initialFollowing,
  initialCount,
  className,
}: {
  petId: number
  initialFollowing: boolean
  initialCount: number
  className?: string
}) {
  const navigate = useNavigate()
  const status = useAuthStore((s) => s.status)
  const [following, setFollowing] = useState(initialFollowing)
  const [count, setCount] = useState(initialCount)
  const [busy, setBusy] = useState(false)

  async function toggle() {
    if (status !== 'authed') {
      navigate(`/login?next=/pet/${petId}`)
      return
    }
    const prev = { following, count }
    setBusy(true)
    setFollowing(!following)
    setCount((c) => c + (following ? -1 : 1))
    try {
      const res = following ? await socialApi.unfollow(petId) : await socialApi.follow(petId)
      setFollowing(res.following)
      setCount(res.followers)
    } catch (err) {
      setFollowing(prev.following)
      setCount(prev.count)
      // ۴۰۹ یعنی هنوز پروفایل ندارید → هدایت به ساخت پروفایل
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('پروفایل')) navigate('/me')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button
      onClick={toggle}
      disabled={busy}
      variant={following ? 'outline' : 'default'}
      className={cn('gap-2', className)}
    >
      {busy ? (
        <Loader2 className="size-4 animate-spin" />
      ) : following ? (
        <Check className="size-4" />
      ) : (
        <UserPlus className="size-4" />
      )}
      {following ? 'دنبال می‌کنید' : 'دنبال‌کردن'}
      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
        {faDigits(count)}
      </span>
    </Button>
  )
}
