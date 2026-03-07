import * as React from "react";
import { cn } from "@/lib/utils";

export interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "settings" | "primary" | "ghost" | "icon" | "export";
  size?: "default" | "sm" | "lg" | "icon";
}

const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant = "default", size = "default", children, ...props }, ref) => {
    const sizes = {
      default: "px-4 py-2 text-sm",
      sm: "px-3 py-1.5 text-xs",
      lg: "px-5 py-2.5 text-sm",
      icon: "p-2",
    };

    const variants = {
      primary: "bg-gray-900 text-white hover:bg-gray-800 border border-gray-900",
      default: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300",
      settings: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300",
      ghost: "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
      icon: "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-900",
      export: "text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

GlassButton.displayName = "GlassButton";

export { GlassButton };
