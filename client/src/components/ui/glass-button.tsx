import * as React from "react";
import { cn } from "@/lib/utils";

export interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "settings" | "primary" | "ghost" | "icon" | "export";
  size?: "default" | "sm" | "lg" | "icon";
}

const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant = "default", size = "default", children, ...props }, ref) => {
    const baseClasses = "relative overflow-hidden font-medium transition-all duration-300 disabled:opacity-70 disabled:pointer-events-none rounded-xl";
    
    const sizes = {
      default: "px-5 py-2.5 text-sm",
      sm: "px-4 py-2 text-xs",
      lg: "px-6 py-3 text-base",
      icon: "p-2.5",
    };

    if (variant === "primary") {
      const isDisabled = props.disabled;
      return (
        <button
          ref={ref}
          className={cn(
            "relative overflow-hidden font-medium transition-all duration-300 disabled:pointer-events-none rounded-xl",
            sizes[size],
            "text-white font-medium",
            className
          )}
          style={{ background: 'linear-gradient(135deg, #2d4a5e 0%, #3d5a6a 50%, #3a5a5e 100%)', opacity: isDisabled ? 0.6 : 1 }}
          {...props}
        >
          {/* Top edge shine line */}
          <div className={cn(
            "absolute top-0 left-2 right-2 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent transition-opacity",
            isDisabled && "opacity-50"
          )} />
          {/* Border */}
          <div className={cn(
            "absolute inset-0 rounded-xl border transition-opacity",
            isDisabled ? "border-white/15" : "border-white/25"
          )} />
          {/* Hover glow effect */}
          <div className={cn(
            "absolute inset-0 rounded-xl transition-opacity",
            isDisabled ? "" : "shadow-[0_0_20px_rgba(159,188,164,0.3)]"
          )} />
          {/* Text always stays bright white */}
          <span className="relative flex items-center justify-center gap-2 text-white" style={{ color: '#FFFFFF' }}>
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
      export: `
        text-gray-600 hover:text-gray-800
        border border-gray-300 hover:border-gray-400
        bg-transparent hover:bg-gray-100/50
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
