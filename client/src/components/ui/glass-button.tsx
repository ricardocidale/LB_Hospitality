import * as React from "react";
import { cn } from "@/lib/utils";

export interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "settings" | "primary" | "ghost" | "icon";
  size?: "default" | "sm" | "lg" | "icon";
}

const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant = "default", size = "default", children, ...props }, ref) => {
    const baseClasses = "relative overflow-hidden font-medium transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none";
    
    const variants = {
      default: `
        text-[#FFF9F5] rounded-xl
        before:absolute before:inset-0 before:bg-white/10 before:backdrop-blur-xl before:rounded-xl
        after:absolute after:top-0 after:left-2 after:right-2 after:h-[1px] after:bg-gradient-to-r after:from-transparent after:via-white/30 after:to-transparent
        [&>*]:relative
        border border-white/20 hover:border-white/40
        hover:shadow-[0_0_20px_rgba(159,188,164,0.3)]
      `,
      settings: `
        text-[#FFF9F5] rounded-xl
        before:absolute before:inset-0 before:bg-white/10 before:backdrop-blur-xl before:rounded-xl
        after:absolute after:top-0 after:left-2 after:right-2 after:h-[1px] after:bg-gradient-to-r after:from-transparent after:via-white/30 after:to-transparent
        [&>*]:relative
        border border-white/20 hover:border-white/40
        hover:shadow-[0_0_20px_rgba(159,188,164,0.3)]
      `,
      primary: `
        text-[#1a2f23] font-semibold rounded-xl
        before:absolute before:inset-0 before:bg-white/90 before:backdrop-blur-xl before:rounded-xl
        after:absolute after:top-0 after:left-2 after:right-2 after:h-[1px] after:bg-gradient-to-r after:from-transparent after:via-white/80 after:to-transparent
        [&>*]:relative
        border border-white/40 hover:border-white/60
        shadow-[0_4px_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]
      `,
      ghost: `
        bg-white/10 hover:bg-white/20 text-[#FFF9F5] rounded-xl
        border border-white/15 hover:border-white/25
      `,
      icon: `
        bg-white/10 hover:bg-white/20 text-[#FFF9F5] rounded-xl
        border border-white/15 hover:border-white/25
      `,
    };
    
    const sizes = {
      default: "px-5 py-2.5 text-sm",
      sm: "px-4 py-2 text-xs",
      lg: "px-6 py-3 text-base",
      icon: "p-2.5",
    };

    return (
      <button
        ref={ref}
        className={cn(baseClasses, variants[variant], sizes[size], className)}
        {...props}
      >
        <span className="relative flex items-center justify-center gap-2">
          {children}
        </span>
      </button>
    );
  }
);

GlassButton.displayName = "GlassButton";

export { GlassButton };
