import * as SliderPrimitive from '@radix-ui/react-slider'
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react'

import { cn } from '@/lib/utils'

/**
 * Slider — powers the distance-radius and price-range filters.
 * Pass `defaultValue={[min, max]}` (two values) for a dual-handle range.
 */
export const Slider = forwardRef<
  ElementRef<typeof SliderPrimitive.Root>,
  ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn('relative flex w-full touch-none select-none items-center py-2.5', className)}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-muted shadow-soft">
      <SliderPrimitive.Range className="absolute h-full bg-primary transition-colors" />
    </SliderPrimitive.Track>
    {/*
      Thumb: white knob with brand ring. A larger invisible hit-area makes
      it thumb-friendly on mobile without growing the visual size.
    */}
    <SliderPrimitive.Thumb className="block size-5 rounded-full border-[3px] border-primary bg-card shadow-soft transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none" />
  </SliderPrimitive.Root>
))
Slider.displayName = 'Slider'
