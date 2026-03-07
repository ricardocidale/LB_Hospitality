/**
 * content-panel.tsx — Titled content section with optional header actions.
 *
 * A simple container that wraps content with a header bar (title + optional
 * action buttons). Used to organize form sections in the assumptions editor
 * and detail pages.
 */
import * as React from "react";
import { cn } from "@/lib/utils";

export interface ContentPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  variant?: "light" | "dark";
  padded?: boolean;
}

const ContentPanel = React.forwardRef<HTMLDivElement, ContentPanelProps>(
  ({ title, subtitle, variant = "light", padded = true, className, children, ...props }, ref) => {
    const isDark = variant === "dark";

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg shadow-sm border",
          isDark
            ? "bg-white border-gray-200"
            : "bg-white border-gray-100",
          padded && "p-6",
          className
        )}
        {...props
      >
        {isDark && (
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-black/20 rounded-2xl pointer-events-none" />
        )}
        <div className={isDark ? "relative" : undefined}>
          {title && (
            <h3
              className={cn(
                "text-lg font-display mb-1",
                isDark ? "text-gray-900" : "text-gray-900"
              )}
            >
              {title}
            </h3>
          )}
          {subtitle && (
            <p
              className={cn(
                "text-sm mb-4",
                isDark ? "text-gray-500" : "text-gray-500"
              )}
            >
              {subtitle}
            </p>
          )}
          {!subtitle && title && <div className="mb-4" />}
          {children}
        </div>
      </div>
    );
  }
);

ContentPanel.displayName = "ContentPanel";

export { ContentPanel };
