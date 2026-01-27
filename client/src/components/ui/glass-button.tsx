import * as React from "react";
import { cn } from "@/lib/utils";

export interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "settings" | "primary" | "ghost" | "icon";
  size?: "default" | "sm" | "lg" | "icon";
}

const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant = "default", size = "default", children, ...props }, ref) => {
    const baseClasses = "relative overflow-hidden font-medium transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none rounded-xl";
    
    const sizes = {
      default: "px-5 py-2.5 text-sm",
      sm: "px-4 py-2 text-xs",
      lg: "px-6 py-3 text-base",
      icon: "p-2.5",
    };

    if (variant === "primary") {
      return (
        <button
          ref={ref}
          className={cn(
            baseClasses,
            sizes[size],
            "text-[#1a3a20] font-semibold",
            className
          )}
          {...props}
        >
          {/* Base gradient - lighter at top, darker at bottom for depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#b8d4bc] via-[#9FBCA4] to-[#7da584] rounded-xl" />
          {/* Strong top highlight - the key liquid ice shine */}
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 via-white/20 to-transparent rounded-t-xl" />
          {/* Top edge shine line */}
          <div className="absolute top-[1px] left-3 right-3 h-[2px] bg-gradient-to-r from-white/20 via-white/60 to-white/20 rounded-full" />
          {/* Subtle inner shadow for depth */}
          <div className="absolute inset-0 rounded-xl shadow-[inset_0_-2px_4px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(255,255,255,0.3)]" />
          {/* Outer glow */}
          <div className="absolute inset-0 rounded-xl shadow-[0_2px_12px_rgba(159,188,164,0.5)]" />
          <span className="relative flex items-center justify-center gap-2">
            {children}
          </span>
        </button>
      );
    }

    const variants = {
      default: `
        text-[#FFF9F5]
        border border-white/20 hover:border-white/40
        hover:shadow-[0_0_20px_rgba(159,188,164,0.3)]
      `,
      settings: `
        text-[#FFF9F5]
        border border-white/20 hover:border-white/40
        hover:shadow-[0_0_20px_rgba(159,188,164,0.3)]
      `,
      ghost: `
        bg-white/10 hover:bg-white/20 text-[#FFF9F5]
        border border-white/15 hover:border-white/25
      `,
      icon: `
        bg-white/10 hover:bg-white/20 text-[#FFF9F5]
        border border-white/15 hover:border-white/25
      `,
    };

    const showGlassBackground = variant === "default" || variant === "settings";

    return (
      <button
        ref={ref}
        className={cn(baseClasses, variants[variant], sizes[size], className)}
        {...props}
      >
        {showGlassBackground && (
          <>
            <div className="absolute inset-0 bg-white/10 backdrop-blur-xl rounded-xl" />
            <div className="absolute top-0 left-2 right-2 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          </>
        )}
        <span className="relative flex items-center justify-center gap-2">
          {children}
        </span>
      </button>
    );
  }
);

GlassButton.displayName = "GlassButton";

export { GlassButton };
