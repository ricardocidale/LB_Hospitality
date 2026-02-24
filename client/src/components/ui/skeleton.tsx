/**
 * skeleton.tsx — Animated placeholder for loading states (shadcn/ui).
 *
 * Renders a pulsing gray rectangle used as a content placeholder while
 * data is being fetched. Used in property cards, financial tables, and
 * research sections during loading.
 */
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-primary/10", className)}
      {...props}
    />
  )
}

export { Skeleton }
