/**
 * page-header.tsx — Consistent page title header with optional back navigation.
 *
 * Renders a page title, subtitle, optional back link, and action buttons
 * (e.g. Settings, Export). Provides a unified look across all top-level
 * pages (Dashboard, Property Detail, Company, Admin).
 */
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
    <div className={cn("relative rounded-2xl sm:rounded-3xl p-4 sm:p-6 min-h-[72px] sm:min-h-[88px]", className)}>
      {/* Background based on variant */}
      {isDark ? (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-[#2d4a5e] via-[#3d5a6a] to-[#3a5a5e] rounded-3xl overflow-hidden" />
          <div className="absolute top-0 right-1/4 w-32 h-32 rounded-full bg-primary/20 blur-2xl" />
          <div className="absolute bottom-0 left-1/4 w-24 h-24 rounded-full bg-primary/15 blur-xl" />
          <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          <div className="absolute inset-0 border border-white/15 rounded-3xl pointer-events-none" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden" />
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/20 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-primary/10 blur-xl" />
          <div className="absolute inset-0 border border-primary/20 rounded-3xl shadow-[0_8px_32px_rgba(159,188,164,0.15)] pointer-events-none" />
        </>
      )}
      
      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          {backLink && (
            <Link href={backLink}>
              {isDark ? (
                <GlassButton variant="icon" size="icon">
                  <ChevronLeft className="w-5 h-5" />
                </GlassButton>
              ) : (
                <button className="relative overflow-hidden p-2.5 rounded-xl transition-all duration-300 group/back">
                  <div className="absolute inset-0 bg-primary/10 backdrop-blur-xl rounded-xl" />
                  <div className="absolute inset-0 rounded-xl border border-primary/30 group-hover/back:border-primary/50 transition-all duration-300" />
                  <ChevronLeft className="w-5 h-5 relative text-gray-700" />
                </button>
              )}
            </Link>
          )}
          <div>
            <h2 className={cn(
              "text-xl sm:text-2xl md:text-3xl font-display font-bold",
              isDark ? "text-background" : "text-gray-900"
            )}>{title}</h2>
            {subtitle && (
              <p className={cn(
                "text-sm mt-1 label-text",
                isDark ? "text-background/60" : "text-gray-600"
              )}>{subtitle}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

export { PageHeader };
