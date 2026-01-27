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
}

function PageHeader({ title, subtitle, backLink, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("relative overflow-hidden rounded-3xl p-6", className)}>
      {/* Match sidebar gradient exactly */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#2d4a5e] via-[#3d5a6a] to-[#3a5a5e]" />
      {/* Subtle glow effects like investment overview */}
      <div className="absolute top-0 right-1/4 w-32 h-32 rounded-full bg-[#9FBCA4]/20 blur-2xl" />
      <div className="absolute bottom-0 left-1/4 w-24 h-24 rounded-full bg-[#9FBCA4]/15 blur-xl" />
      {/* Top highlight */}
      <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      {/* Border */}
      <div className="absolute inset-0 border border-white/15 rounded-3xl" />
      
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          {backLink && (
            <Link href={backLink}>
              <GlassButton variant="icon" size="icon">
                <ChevronLeft className="w-5 h-5" />
              </GlassButton>
            </Link>
          )}
          <div>
            <h2 className="text-2xl font-serif font-bold text-[#FFF9F5]">{title}</h2>
            {subtitle && (
              <p className="text-sm text-[#FFF9F5]/60">{subtitle}</p>
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
