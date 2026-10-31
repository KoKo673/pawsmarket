import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type ButtonHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

/**
 * Button variants tuned to the PawsMarket design language:
 * soft radii, warm elevation, and a subtle press-down scale so every
 * tap feels physical (native-app feel on mobile).
 */
const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold',
    'transition-all duration-200 ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    /* 70%, not 50%: halving the opacity of a dark ghost label drops it to
       3.21:1 on the wizard's footer, where «بازگشت» sits disabled on the
       first step of every add-listing visit. 70% measures 6.05 and still
       reads as unavailable next to an enabled button.

       Opacity is wrong for the filled variants, though. Fading white text
       on the primary orange composites it toward the page: measured on the
       live /login «دریافت کد», white at 70% over rgb(185,64,4) is 3.48:1
       against a 4.5 requirement. A disabled button still has to be legible
       — «I cannot press this yet» is information to read, not to squint at.
       So the filled variants change colour instead of fading, and only the
       text-on-background variants keep the 70%. */
    'disabled:pointer-events-none active:scale-[0.97]',
    '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        /* Primary CTA — Paw-Orange with a soft brand glow.
           Disabled **darkens** the fill rather than fading it. Any opacity
           here — 70%, 85%, it does not matter — composites white text
           toward the page and costs contrast: measured 3.48:1 at 70% for
           «دریافت کد» on /login. Brightness only touches the background, so
           the label stays the same white while the button reads as off. */
        default: 'bg-primary text-primary-foreground shadow-glow hover:brightness-105 disabled:brightness-[0.72] disabled:shadow-none',
        secondary: 'bg-secondary text-secondary-foreground shadow-soft hover:bg-secondary/70 disabled:opacity-70',
        outline: 'border border-input bg-card shadow-soft hover:bg-muted/50 disabled:opacity-70',
        ghost: 'text-foreground hover:bg-muted/60 disabled:opacity-70',
        accent: 'bg-accent text-accent-foreground hover:brightness-105 disabled:brightness-[0.72]',
        destructive: 'bg-destructive text-destructive-foreground hover:brightness-95 disabled:brightness-[0.72]',
        link: 'text-primary underline-offset-4 hover:underline disabled:opacity-70',
      },
      size: {
        sm: 'h-9 rounded-lg px-3.5 text-xs',
        default: 'h-11 px-5',
        lg: 'h-12 rounded-xl px-7 text-base',
        icon: 'size-11',
        'icon-sm': 'size-8 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render as a sibling element (e.g. `<Link>` keeping its own semantics). */
  asChild?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  },
)
Button.displayName = 'Button'

export { buttonVariants }
