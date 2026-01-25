import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "panel" | "sidebar";
  intensity?: "low" | "medium" | "high";
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "default", intensity = "medium", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden transition-all duration-300",
          "border border-white/40 dark:border-white/10",
          "shadow-lg hover:shadow-xl",
          
          // Variants
          variant === "default" && "rounded-2xl bg-white/40 dark:bg-black/40",
          variant === "panel" && "rounded-3xl bg-white/60 dark:bg-black/60",
          variant === "sidebar" && "bg-white/50 dark:bg-black/50 border-r border-white/20",

          // Blur Intensity
          intensity === "low" && "backdrop-blur-md",
          intensity === "medium" && "backdrop-blur-xl",
          intensity === "high" && "backdrop-blur-2xl",
          
          className
        )}
        {...props}
      >
        {/* Subtle noise texture or gradient overlay could go here */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
        <div className="relative z-10">
          {children}
        </div>
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";

export { GlassCard };
