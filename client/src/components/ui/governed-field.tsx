import { useState } from "react";
import { IconShieldCheck } from "@/components/icons";
import { ChevronDown, ChevronRight } from "@/components/icons/themed-icons";

export interface GovernedFieldWrapperProps {
  authority: string;
  label: string;
  helperText: React.ReactNode;
  referenceUrl?: string;
  defaultExpanded?: boolean;
  "data-testid"?: string;
  children?: React.ReactNode;
}

export function GovernedFieldWrapper({
  authority,
  label,
  helperText,
  referenceUrl,
  defaultExpanded = false,
  "data-testid": testId,
  children,
}: GovernedFieldWrapperProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div
      className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700/50 p-4"
      data-testid={testId}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <IconShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
            {label}
          </span>
          <span className="text-xs text-amber-600/80 dark:text-amber-400/70 shrink-0">
            {authority}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 shrink-0 p-0.5"
          aria-label={expanded ? "Collapse details" : "Expand details"}
        >
          {expanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>
      {expanded && (
        <div className="mt-2 text-xs text-amber-700 dark:text-amber-300/80 leading-relaxed">
          {helperText}
          {referenceUrl && (
            <>
              {" "}
              <a
                href={referenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-amber-900 dark:hover:text-amber-200"
              >
                Reference
              </a>
            </>
          )}
        </div>
      )}
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}
