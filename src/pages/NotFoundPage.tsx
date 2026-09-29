import { Compass, PawPrint } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-[70svh] flex-col items-center justify-center px-6 text-center">
      <span className="relative grid size-24 place-items-center rounded-full bg-primary/10">
        <PawPrint className="size-11 animate-float text-primary" />
        <span className="absolute inset-0 -z-10 animate-pulse-ring rounded-full bg-primary/20" />
      </span>
      <h1 className="mt-8 text-5xl font-extrabold tracking-tight">۴۰۴</h1>
      <p className="mt-3 max-w-sm text-balance text-sm leading-relaxed text-muted-foreground">
        این مسیر به بن‌بست رسیده — صفحه‌ای که دنبالش بودید از روی نقشه پاک شده.
      </p>
      <Button asChild size="lg" className="mt-7 gap-2">
        <Link to="/">
          <Compass className="size-4" />
          بازگشت به خانه
        </Link>
      </Button>
    </div>
  )
}
