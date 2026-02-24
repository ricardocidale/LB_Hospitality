/**
 * BasicInfoSection.tsx — Property identity and physical characteristics.
 *
 * First section on the Edit Property page. Captures the property's name,
 * street address / market, hero image URL, room count, property type
 * (e.g. "Boutique Hotel", "B&B"), and optional SPV company assignment.
 *
 * Room count is the single most important driver in the financial model:
 * it multiplies with ADR (Average Daily Rate) and occupancy to produce
 * total room revenue.  Property type influences which USALI expense
 * ratios the engine applies by default.
 */
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { PropertyImagePicker } from "@/features/property-images";
import type { PropertyEditSectionProps } from "./types";

export default function BasicInfoSection({ draft, onChange, onNumberChange }: PropertyEditSectionProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="absolute inset-0 bg-white/80 backdrop-blur-xl" />
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/10 blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-primary/5 blur-xl" />
      <div className="absolute inset-0 border border-primary/20 rounded-2xl shadow-[0_8px_32px_rgba(159,188,164,0.15)]" />
      
      <div className="relative p-6">
        <div className="mb-6">
          <h3 className="text-xl font-display text-gray-900">Basic Information</h3>
          <p className="text-gray-600 text-sm label-text">Property identification and location details</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="label-text text-gray-700 flex items-center gap-1.5">Property Name<HelpTooltip text="Internal name used to identify this property across the portfolio. Appears in dashboards, reports, and financial statements." /></Label>
            <Input value={draft.name} onChange={(e) => onChange("name", e.target.value)} className="bg-white border-primary/30 text-gray-900 placeholder:text-gray-400" />
          </div>
          <div className="space-y-2">
            <Label className="label-text text-gray-700 flex items-center gap-1.5">Location<HelpTooltip text="City and state/region of the property. Used for market research to find comparable properties and local hospitality benchmarks." /></Label>
            <Input value={draft.location} onChange={(e) => onChange("location", e.target.value)} className="bg-white border-primary/30 text-gray-900 placeholder:text-gray-400" />
          </div>
          <div className="space-y-2">
            <Label className="label-text text-gray-700 flex items-center gap-1.5">Market<HelpTooltip text="The broader market or MSA (Metropolitan Statistical Area) this property operates in. Drives market research, comp set analysis, and regional benchmarks." /></Label>
            <Input value={draft.market} onChange={(e) => onChange("market", e.target.value)} className="bg-white border-primary/30 text-gray-900 placeholder:text-gray-400" />
          </div>

          <div className="sm:col-span-2 border border-primary/20 rounded-xl p-4 space-y-4">
            <p className="text-sm font-medium text-gray-700 label-text">Address Details <span className="text-gray-400 font-normal">(optional)</span></p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label className="label-text text-gray-600 text-sm">Street Address</Label>
                <Input value={draft.streetAddress || ""} onChange={(e) => onChange("streetAddress", e.target.value || null)} placeholder="123 Main Street" className="bg-white border-primary/30 text-gray-900 placeholder:text-gray-400" />
              </div>
              <div className="space-y-2">
                <Label className="label-text text-gray-600 text-sm">City</Label>
                <Input value={draft.city || ""} onChange={(e) => onChange("city", e.target.value || null)} placeholder="Austin" className="bg-white border-primary/30 text-gray-900 placeholder:text-gray-400" />
              </div>
              <div className="space-y-2">
                <Label className="label-text text-gray-600 text-sm">State / Province / Region</Label>
                <Input value={draft.stateProvince || ""} onChange={(e) => onChange("stateProvince", e.target.value || null)} placeholder="Texas" className="bg-white border-primary/30 text-gray-900 placeholder:text-gray-400" />
              </div>
              <div className="space-y-2">
                <Label className="label-text text-gray-600 text-sm">Postal / ZIP Code</Label>
                <Input value={draft.zipPostalCode || ""} onChange={(e) => onChange("zipPostalCode", e.target.value || null)} placeholder="78701" className="bg-white border-primary/30 text-gray-900 placeholder:text-gray-400" />
              </div>
              <div className="space-y-2">
                <Label className="label-text text-gray-600 text-sm">Country</Label>
                <Input value={draft.country || ""} onChange={(e) => onChange("country", e.target.value || null)} placeholder="United States" className="bg-white border-primary/30 text-gray-900 placeholder:text-gray-400" />
              </div>
            </div>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label className="label-text text-gray-700 flex items-center gap-1.5">Property Photo<HelpTooltip text="Upload or generate a representative photo for this property. Displayed on portfolio cards and property detail pages." /></Label>
            <PropertyImagePicker
              imageUrl={draft.imageUrl}
              onImageChange={(url) => onChange("imageUrl", url)}
              propertyName={draft.name}
              location={draft.location}
              variant="light"
            />
          </div>
          <div className="space-y-2">
            <Label className="label-text text-gray-700 flex items-center gap-1.5">Status<HelpTooltip text="Current stage: Pipeline (being scoped), In Negotiation (advanced talks), Acquired (purchased), Improvements (under renovation), or Operating (generating revenue)." /></Label>
            <Select value={draft.status} onValueChange={(v) => onChange("status", v)}>
              <SelectTrigger className="bg-white border-primary/30 text-gray-900"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Pipeline">Pipeline</SelectItem>
                <SelectItem value="In Negotiation">In Negotiation</SelectItem>
                <SelectItem value="Acquired">Acquired</SelectItem>
                <SelectItem value="Improvements">Improvements</SelectItem>
                <SelectItem value="Operating">Operating</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="label-text text-gray-700 flex items-center gap-1.5">Room Count<HelpTooltip text="Total number of rentable guest rooms. This is the primary revenue driver — all room revenue is calculated as Rooms × ADR × Occupancy × 30.5 days/month." /></Label>
            <Input type="number" value={draft.roomCount} onChange={(e) => onNumberChange("roomCount", e.target.value)} className="bg-white border-primary/30 text-gray-900 placeholder:text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
