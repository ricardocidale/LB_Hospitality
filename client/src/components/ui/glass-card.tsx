import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "chart";
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const variants = {
      default: {
        bg: "from-[#2d4a5e]/80 via-[#3d5a6a]/70 to-[#3a5a5e]/80",
        highlight: "via-white/20",
        border: "border-white/10",
      },
      success: {
        bg: "from-[#257D41]/20 via-[#3d5a6a]/50 to-[#3a5a5e]/60",
        highlight: "via-[#9FBCA4]/30",
        border: "border-[#9FBCA4]/30",
      },
      warning: {
        bg: "from-red-900/30 via-[#3d5a6a]/50 to-[#3a5a5e]/60",
        highlight: "via-red-400/30",
        border: "border-red-500/30",
      },
      chart: {
        bg: "from-[#2d4a5e] via-[#3a5a5e] to-[#3d5a6a]",
        highlight: "via-white/30",
        border: "border-white/15",
      },
    };

    const v = variants[variant];

    return (
      <div
        ref={ref}
        className={cn("relative overflow-hidden rounded-2xl p-6", className)}
        {...props}
      >
        <div className={cn("absolute inset-0 bg-gradient-to-br", v.bg)} />
        <div className={cn("absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent to-transparent", v.highlight)} />
        <div className={cn("absolute inset-0 rounded-2xl border", v.border)} />
        {variant === "chart" && (
          <>
            <div className="absolute top-0 left-1/4 w-72 h-72 rounded-full bg-[#9FBCA4]/20 blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-[#9FBCA4]/15 blur-3xl" />
          </>
        )}
        <div className="relative">
          {children}
        </div>
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";

export { GlassCard };
