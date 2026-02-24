/**
 * MetricCard.tsx — Small KPI badge for a single research metric.
 *
 * Renders a compact pill showing a label and value (e.g. "Avg ADR: $185")
 * inside a SectionCard. The background and text colors are derived from
 * the parent section's SectionColorScheme so metrics visually belong to
 * their category.
 */
import type { SectionColorScheme } from "./types";

export function MetricCard({ label, value, source, color }: { label: string; value: string; source?: string; color: SectionColorScheme }) {
  return (
    <div className={`rounded-xl p-4 border ${color.border} ${color.bg}`}>
      <p className="text-xs font-medium uppercase tracking-wider mb-1.5 text-gray-500">{label}</p>
      <p className="text-base font-semibold text-gray-900">{value}</p>
      {source && <p className="text-[11px] text-gray-400 mt-1.5 leading-tight">{source}</p>}
    </div>
  );
}
