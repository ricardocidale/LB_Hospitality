import type { SectionColorScheme } from "../property-research/types";

export type { SectionColorScheme };

export const companySectionColors: Record<string, SectionColorScheme> = {
  fees: { accent: "#257D41", bg: "bg-emerald-50", border: "border-emerald-200", iconBg: "bg-emerald-100", iconText: "text-emerald-700", badge: "bg-emerald-100 text-emerald-800" },
  gaap: { accent: "#3B82F6", bg: "bg-blue-50", border: "border-blue-200", iconBg: "bg-blue-100", iconText: "text-blue-700", badge: "bg-blue-100 text-blue-800" },
  benchmarks: { accent: "#8B5CF6", bg: "bg-violet-50", border: "border-violet-200", iconBg: "bg-violet-100", iconText: "text-violet-700", badge: "bg-violet-100 text-violet-800" },
  compensation: { accent: "#D97706", bg: "bg-amber-50", border: "border-amber-200", iconBg: "bg-amber-100", iconText: "text-amber-700", badge: "bg-amber-100 text-amber-800" },
  contracts: { accent: "#0891B2", bg: "bg-cyan-50", border: "border-cyan-200", iconBg: "bg-cyan-100", iconText: "text-cyan-700", badge: "bg-cyan-100 text-cyan-800" },
  sources: { accent: "#6B7280", bg: "bg-gray-50", border: "border-gray-200", iconBg: "bg-gray-100", iconText: "text-gray-600", badge: "bg-gray-100 text-gray-700" },
};
