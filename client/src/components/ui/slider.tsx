/**
 * slider.tsx — Range slider input (shadcn/ui).
 *
 * Wraps Radix Slider for numeric range selection with a draggable thumb.
 * Used for adjusting percentage rates (occupancy, expense ratios) and
 * filtering property search criteria.
 */
import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center py-1",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-gray-200/80 shadow-inner">
      <SliderPrimitive.Range className="absolute h-full bg-gradient-to-r from-primary to-[#85a88b] rounded-full" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-white shadow-md ring-offset-background transition-all hover:scale-110 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing active:scale-95" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
