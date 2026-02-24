/**
 * CateringSection.tsx — Placeholder section for catering / F&B revenue config.
 *
 * Currently renders a "coming soon" placeholder. When implemented, this section
 * will let users configure company-level defaults for catering and event
 * revenue assumptions — the percentage of F&B revenue attributed to
 * weddings, corporate events, and banquets, which can significantly boost
 * a property's ancillary income (especially for resorts and boutique venues).
 */
export default function CateringSection() {
  return (
    <div className="relative overflow-hidden rounded-2xl p-6 bg-white/80 backdrop-blur-xl border border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.15)]">
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/10 blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-primary/5 blur-xl" />
      <div className="relative">
      <div className="space-y-4">
        <h3 className="text-lg font-display text-gray-900 flex items-center gap-2">
          Catering Revenue Model
        </h3>
        <p className="text-sm text-gray-600">
          Catering is modeled as a percentage boost applied to each property's F&B revenue. The catering boost percentage is configured per property on the Property Assumptions page. There are no systemwide catering assumptions.
        </p>
        <div className="p-3 bg-primary/10 rounded-lg text-sm text-gray-700">
          <p className="font-medium mb-1">Formula:</p>
          <p>Total F&B Revenue = Room Revenue × F&B % × (1 + Catering Boost %)</p>
        </div>
      </div>
    </div></div>
  );
}
