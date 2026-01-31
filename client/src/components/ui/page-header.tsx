import * as React from "react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { ChevronLeft } from "lucide-react";
import { GlassButton } from "./glass-button";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backLink?: string;
  actions?: React.ReactNode;
  className?: string;
  variant?: "dark" | "light";
}

function PageHeader({ title, subtitle, backLink, actions, className, variant = "dark" }: PageHeaderProps) {
  const isDark = variant === "dark";
  
  return (
    <div className={cn("relative overflow-hidden rounded-3xl p-6 min-h-[88px]", className)}>
      {/* Background based on variant */}
      {isDark ? (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-[#2d4a5e] via-[#3d5a6a] to-[#3a5a5e]" />
          <div className="absolute top-0 right-1/4 w-32 h-32 rounded-full bg-[#9FBCA4]/20 blur-2xl" />
          <div className="absolute bottom-0 left-1/4 w-24 h-24 rounded-full bg-[#9FBCA4]/15 blur-xl" />
          <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          <div className="absolute inset-0 border border-white/15 rounded-3xl" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-white/80 backdrop-blur-xl" />
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#9FBCA4]/20 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-[#9FBCA4]/10 blur-xl" />
          <div className="absolute inset-0 border border-[#9FBCA4]/20 rounded-3xl shadow-[0_8px_32px_rgba(159,188,164,0.15)]" />
        </>
      )}
      
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          {backLink && (
            <Link href={backLink}>
              {isDark ? (
                <GlassButton variant="icon" size="icon">
                  <ChevronLeft className="w-5 h-5" />
                </GlassButton>
              ) : (
                <button className="relative overflow-hidden p-2.5 rounded-xl transition-all duration-300 group/back">
                  <div className="absolute inset-0 bg-[#9FBCA4]/10 backdrop-blur-xl rounded-xl" />
                  <div className="absolute inset-0 rounded-xl border border-[#9FBCA4]/30 group-hover/back:border-[#9FBCA4]/50 transition-all duration-300" />
                  <ChevronLeft className="w-5 h-5 relative text-gray-700" />
                </button>
              )}
            </Link>
          )}
          <div>
            <h2 className={cn(
              "text-3xl font-display font-bold",
              isDark ? "text-[#FFF9F5]" : "text-gray-900"
            )}>{title}</h2>
            {subtitle && (
              <p className={cn(
                "text-sm mt-1 label-text",
                isDark ? "text-[#FFF9F5]/60" : "text-gray-600"
              )}>{subtitle}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

export { PageHeader };
