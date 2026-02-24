/**
 * property-research/types.ts
 *
 * Shared types and color palettes for the property-level AI research view.
 *
 * SectionColorScheme defines the Tailwind classes and hex accents used to
 * visually distinguish each research category (market overview, ADR comps,
 * occupancy, events, cap rates, competitive landscape, risks, etc.).
 *
 * sectionColors is the concrete mapping: each key (e.g. "market", "adr",
 * "capRate") maps to a color scheme object. These same keys are used by the
 * company-research module so both property and company research share the
 * same SectionColorScheme interface.
 */
export interface SectionColorScheme {
  accent: string;
  bg: string;
  border: string;
  iconBg: string;
  iconText: string;
  badge: string;
}

export const sectionColors: Record<string, SectionColorScheme> = {
  market: { accent: "#257D41", bg: "bg-emerald-50", border: "border-emerald-200", iconBg: "bg-emerald-100", iconText: "text-emerald-700", badge: "bg-emerald-100 text-emerald-800" },
  adr: { accent: "#3B82F6", bg: "bg-blue-50", border: "border-blue-200", iconBg: "bg-blue-100", iconText: "text-blue-700", badge: "bg-blue-100 text-blue-800" },
  occupancy: { accent: "#8B5CF6", bg: "bg-violet-50", border: "border-violet-200", iconBg: "bg-violet-100", iconText: "text-violet-700", badge: "bg-violet-100 text-violet-800" },
  events: { accent: "#F4795B", bg: "bg-orange-50", border: "border-orange-200", iconBg: "bg-orange-100", iconText: "text-orange-700", badge: "bg-orange-100 text-orange-800" },
  capRate: { accent: "#0891B2", bg: "bg-cyan-50", border: "border-cyan-200", iconBg: "bg-cyan-100", iconText: "text-cyan-700", badge: "bg-cyan-100 text-cyan-800" },
  competitive: { accent: "#9FBCA4", bg: "bg-emerald-50/50", border: "border-primary/30", iconBg: "bg-primary/20", iconText: "text-secondary", badge: "bg-primary/20 text-secondary" },
  risks: { accent: "#DC2626", bg: "bg-red-50", border: "border-red-200", iconBg: "bg-red-100", iconText: "text-red-700", badge: "bg-red-100 text-red-800" },
  sources: { accent: "#6B7280", bg: "bg-gray-50", border: "border-gray-200", iconBg: "bg-gray-100", iconText: "text-gray-600", badge: "bg-gray-100 text-gray-700" },
  stabilization: { accent: "#D97706", bg: "bg-amber-50", border: "border-amber-200", iconBg: "bg-amber-100", iconText: "text-amber-700", badge: "bg-amber-100 text-amber-800" },
  landValue: { accent: "#78716C", bg: "bg-stone-50", border: "border-stone-200", iconBg: "bg-stone-100", iconText: "text-stone-700", badge: "bg-stone-100 text-stone-800" },
  catering: { accent: "#D946EF", bg: "bg-fuchsia-50", border: "border-fuchsia-200", iconBg: "bg-fuchsia-100", iconText: "text-fuchsia-700", badge: "bg-fuchsia-100 text-fuchsia-800" },
};
