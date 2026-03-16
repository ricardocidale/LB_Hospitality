import { useState } from "react";
import { IconShieldCheck } from "@/components/icons";
import { ChevronDown, ChevronRight } from "@/components/icons/themed-icons";

export interface GovernedFieldMeta {
  authority: string;
  value: string;
  helperText: string;
  referenceUrl?: string;
}

export const GOVERNED_FIELDS = {
  depreciationYears: {
    authority: "IRS Publication 946",
    value: "27.5 years",
    helperText:
      "27.5 years: residential rental property (hotels, motels). 39 years: nonresidential real property. This model uses 27.5-year straight-line depreciation for boutique hotel assets as classified under MACRS. Changing this deviates from standard tax depreciation schedules. Consult your tax advisor.",
    referenceUrl: "https://www.irs.gov/publications/p946",
  },
  daysPerMonth: {
    authority: "Industry convention (365/12)",
    value: "30.5 days",
    helperText:
      "The hospitality industry standard of 30.5 days per month (365 ÷ 12 = 30.4167, rounded to 30.5) is used for monthly revenue and expense calculations. This ensures consistent monthly periods across all properties and avoids calendar-month variability in financial projections.",
  },
} as const satisfies Record<string, GovernedFieldMeta>;

export type GovernedFieldKey = keyof typeof GOVERNED_FIELDS;

interface GovernedFieldWrapperProps {
  fieldKey: GovernedFieldKey;
  defaultExpanded?: boolean;
  children?: React.ReactNode;
}

export function GovernedFieldWrapper({
  fieldKey,
  defaultExpanded = false,
  children,
}: GovernedFieldWrapperProps) {
  const meta: GovernedFieldMeta = GOVERNED_FIELDS[fieldKey];
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (!meta) return <>{children}</>;

  return (
    <div
      className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700/50 p-4"
      data-testid={`governed-field-${fieldKey}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <IconShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
            {meta.value}
          </span>
          <span className="text-xs text-amber-600/80 dark:text-amber-400/70 shrink-0">
            {meta.authority}
          </span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 shrink-0 p-0.5"
          data-testid={`governed-toggle-${fieldKey}`}
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
          {meta.helperText}
          {meta.referenceUrl && (
            <>
              {" "}
              <a
                href={meta.referenceUrl}
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
