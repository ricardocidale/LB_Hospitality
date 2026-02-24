import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import type { PropertyEditSectionProps } from "./types";

export default function TimelineSection({ draft, onChange }: PropertyEditSectionProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="absolute inset-0 bg-white/80 backdrop-blur-xl" />
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/10 blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-primary/5 blur-xl" />
      <div className="absolute inset-0 border border-primary/20 rounded-2xl shadow-[0_8px_32px_rgba(159,188,164,0.15)]" />
      
      <div className="relative p-6">
        <div className="mb-6">
          <h3 className="text-xl font-display text-gray-900">Timeline</h3>
          <p className="text-gray-600 text-sm label-text">Acquisition and operations schedule</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="flex items-center label-text text-gray-700">
              Acquisition Date
              <HelpTooltip text="The date when the property is purchased. Equity investment occurs on this date. Pre-opening costs and building improvements are incurred during the period between acquisition and operations start." />
            </Label>
            <Input type="date" value={draft.acquisitionDate} onChange={(e) => onChange("acquisitionDate", e.target.value)} className="bg-white border-primary/30 text-gray-900" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center label-text text-gray-700">
              Operations Start Date
              <HelpTooltip text="The date when the property begins operating and generating revenue. All revenues and operating expenses start on this date. The period between acquisition and operations start is used for renovations and pre-opening preparation." />
            </Label>
            <Input type="date" value={draft.operationsStartDate} onChange={(e) => onChange("operationsStartDate", e.target.value)} className="bg-white border-primary/30 text-gray-900" />
          </div>
        </div>
      </div>
    </div>
  );
}
