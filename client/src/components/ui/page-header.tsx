import * as React from "react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { ChevronLeft } from "lucide-react";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backLink?: string;
  actions?: React.ReactNode;
  className?: string;
  variant?: "dark" | "light";
}

function PageHeader({ title, subtitle, backLink, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("relative rounded-xl border border-gray-200/80 bg-white shadow-sm p-4 sm:p-5", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          {backLink && (
            <Link href={backLink}>
              <button className="p-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors">
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
            </Link>
          )}
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{title}</h2>
            {subtitle && (
              <p className="text-xs sm:text-sm mt-0.5 text-gray-500">{subtitle}</p>
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
