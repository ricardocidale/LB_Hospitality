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
            "text-[#1a2f23] font-semibold border border-white/50 hover:border-white/70 shadow-[0_4px_20px_rgba(255,255,255,0.25)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]",
            className
          )}
          {...props}
        >
          <div className="absolute inset-0 bg-white/90 backdrop-blur-xl rounded-xl" />
          <div className="absolute top-0 left-2 right-2 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent" />
          <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
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
