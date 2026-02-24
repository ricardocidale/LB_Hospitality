import { Label } from "@/components/ui/label";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { Slider } from "@/components/ui/slider";
import { EditableValue } from "@/components/ui/editable-value";
import { ResearchBadge } from "@/components/ui/research-badge";
import {
  DEFAULT_REV_SHARE_EVENTS,
  DEFAULT_REV_SHARE_FB,
  DEFAULT_REV_SHARE_OTHER,
  DEFAULT_CATERING_BOOST_PCT,
} from "@/lib/constants";
import type { PropertyEditSectionProps } from "./types";

export default function RevenueAssumptionsSection({ draft, onChange, researchValues }: PropertyEditSectionProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="absolute inset-0 bg-white/80 backdrop-blur-xl" />
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/10 blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-primary/5 blur-xl" />
      <div className="absolute inset-0 border border-primary/20 rounded-2xl shadow-[0_8px_32px_rgba(159,188,164,0.15)]" />
      
      <div className="relative p-6 space-y-6">
        <div>
          <h3 className="text-xl font-display text-gray-900">Revenue Assumptions</h3>
          <p className="text-gray-600 text-sm label-text">ADR and occupancy projections</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-0.5">
                <Label className="label-text text-gray-700 flex items-center gap-1.5">
                  Starting ADR
                  <HelpTooltip text="Average Daily Rate at the start of operations. This is the average revenue per occupied room per night." />
                </Label>
                <ResearchBadge value={researchValues.adr?.display} onClick={() => researchValues.adr && onChange("startAdr", researchValues.adr.mid)} />
              </div>
              <EditableValue
                value={draft.startAdr}
                onChange={(val) => onChange("startAdr", val)}
                format="dollar"
                min={100}
                max={1200}
                step={10}
              />
            </div>
            <Slider 
              value={[draft.startAdr]}
              onValueChange={(vals: number[]) => onChange("startAdr", vals[0])}
              min={100}
              max={1200}
              step={10}
              className="[&_[role=slider]]:bg-primary"
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="label-text text-gray-700 flex items-center gap-1.5">ADR Annual Growth<HelpTooltip text="Year-over-year percentage increase in ADR. Reflects pricing power, inflation, and market conditions. Typical range is 2-5% for established markets." /></Label>
              <EditableValue
                value={draft.adrGrowthRate * 100}
                onChange={(val) => onChange("adrGrowthRate", val / 100)}
                format="percent"
                min={0}
                max={50}
                step={1}
              />
            </div>
            <Slider 
              value={[draft.adrGrowthRate * 100]}
              onValueChange={(vals: number[]) => onChange("adrGrowthRate", vals[0] / 100)}
              min={0}
              max={50}
              step={1}
              className="[&_[role=slider]]:bg-primary"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-0.5">
                <Label className="label-text text-gray-700 flex items-center gap-1.5">
                  Starting Occupancy
                  <HelpTooltip text="Occupancy rate in the first month of operations. New properties typically start below stabilized levels and ramp up over time." />
                </Label>
                <ResearchBadge value={researchValues.startOccupancy?.display} onClick={() => researchValues.startOccupancy && onChange("startOccupancy", researchValues.startOccupancy.mid / 100)} />
              </div>
              <EditableValue
                value={draft.startOccupancy * 100}
                onChange={(val) => onChange("startOccupancy", val / 100)}
                format="percent"
                min={0}
                max={100}
                step={1}
              />
            </div>
            <Slider 
              value={[draft.startOccupancy * 100]}
              onValueChange={(vals: number[]) => onChange("startOccupancy", vals[0] / 100)}
              min={0}
              max={100}
              step={1}
              className="[&_[role=slider]]:bg-primary"
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-0.5">
                <Label className="label-text text-gray-700 flex items-center gap-1.5">
                  Stabilized Occupancy
                  <HelpTooltip text="Target occupancy rate after the ramp-up period. This is the long-term sustainable occupancy level for the market." />
                </Label>
                <ResearchBadge value={researchValues.occupancy?.display} onClick={() => researchValues.occupancy && onChange("maxOccupancy", researchValues.occupancy.mid / 100)} />
              </div>
              <EditableValue
                value={draft.maxOccupancy * 100}
                onChange={(val) => onChange("maxOccupancy", val / 100)}
                format="percent"
                min={0}
                max={100}
                step={1}
              />
            </div>
            <Slider 
              value={[draft.maxOccupancy * 100]}
              onValueChange={(vals: number[]) => onChange("maxOccupancy", vals[0] / 100)}
              min={0}
              max={100}
              step={1}
              className="[&_[role=slider]]:bg-primary"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-0.5">
                <Label className="label-text text-gray-700 flex items-center gap-1.5">
                  Occupancy Ramp
                  <HelpTooltip text="Number of months from opening to reach stabilized occupancy. The property linearly ramps from starting to stabilized occupancy over this period." />
                </Label>
                <ResearchBadge value={researchValues.rampMonths?.display} onClick={() => researchValues.rampMonths && onChange("occupancyRampMonths", researchValues.rampMonths.mid)} />
              </div>
              <EditableValue
                value={draft.occupancyRampMonths}
                onChange={(val) => onChange("occupancyRampMonths", val)}
                format="months"
                min={0}
                max={36}
                step={1}
              />
            </div>
            <Slider 
              value={[draft.occupancyRampMonths]}
              onValueChange={(vals: number[]) => onChange("occupancyRampMonths", vals[0])}
              min={0}
              max={36}
              step={1}
              className="[&_[role=slider]]:bg-primary"
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="label-text text-gray-700 flex items-center gap-1.5">Occupancy Growth Step<HelpTooltip text="Additional annual occupancy improvement after stabilization. Applied as a small yearly increase once the property has stabilized. Typical range is 1-3%." /></Label>
              <EditableValue
                value={draft.occupancyGrowthStep * 100}
                onChange={(val) => onChange("occupancyGrowthStep", val / 100)}
                format="percent"
                min={0}
                max={20}
                step={1}
              />
            </div>
            <Slider 
              value={[draft.occupancyGrowthStep * 100]}
              onValueChange={(vals: number[]) => onChange("occupancyGrowthStep", vals[0] / 100)}
              min={0}
              max={20}
              step={1}
              className="[&_[role=slider]]:bg-primary"
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="label-text text-gray-700 flex items-center gap-1.5">Stabilization Period<HelpTooltip text="Total months until the property reaches mature, stabilized operations. Used for financial projections and investor reporting." /></Label>
              <EditableValue
                value={draft.stabilizationMonths}
                onChange={(val) => onChange("stabilizationMonths", val)}
                format="months"
                min={0}
                max={36}
                step={1}
              />
            </div>
            <Slider 
              value={[draft.stabilizationMonths]}
              onValueChange={(vals: number[]) => onChange("stabilizationMonths", vals[0])}
              min={0}
              max={36}
              step={1}
              className="[&_[role=slider]]:bg-primary"
            />
          </div>
        </div>

        <div className="space-y-4 pt-2 border-t border-primary/15">
          <Label className="label-text text-gray-700 flex items-center gap-1.5">
            Additional Revenue as % of Room Revenue
            <HelpTooltip text="Configure how much additional revenue each stream generates as a percentage of room revenue. F&B revenue gets boosted by the catering boost percentage." />
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="label-text text-gray-700 flex items-center gap-1.5">
                  Events
                  <HelpTooltip text="Revenue from meetings, weddings, and other events as a percentage of room revenue." />
                </Label>
                <EditableValue
                  value={(draft.revShareEvents ?? DEFAULT_REV_SHARE_EVENTS) * 100}
                  onChange={(val) => onChange("revShareEvents", val / 100)}
                  format="percent"
                  min={0}
                  max={100}
                  step={5}
                />
              </div>
              <Slider 
                value={[(draft.revShareEvents ?? DEFAULT_REV_SHARE_EVENTS) * 100]}
                onValueChange={(vals: number[]) => onChange("revShareEvents", vals[0] / 100)}
                min={0}
                max={100}
                step={5}
                className="[&_[role=slider]]:bg-primary"
              />
              <p className="text-xs text-gray-500">Meetings, weddings, conferences</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="label-text text-gray-700 flex items-center gap-1.5">
                  F&B
                  <HelpTooltip text="Base food & beverage revenue as a percentage of room revenue. This gets boosted by the catering boost percentage below." />
                </Label>
                <EditableValue
                  value={(draft.revShareFB ?? DEFAULT_REV_SHARE_FB) * 100}
                  onChange={(val) => onChange("revShareFB", val / 100)}
                  format="percent"
                  min={0}
                  max={100}
                  step={5}
                />
              </div>
              <Slider 
                value={[(draft.revShareFB ?? DEFAULT_REV_SHARE_FB) * 100]}
                onValueChange={(vals: number[]) => onChange("revShareFB", vals[0] / 100)}
                min={0}
                max={100}
                step={5}
                className="[&_[role=slider]]:bg-primary"
              />
              <p className="text-xs text-gray-500">Restaurant, bar, room service</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="label-text text-gray-700 flex items-center gap-1.5">
                  Other
                  <HelpTooltip text="Revenue from spa, parking, activities, and other ancillary services." />
                </Label>
                <EditableValue
                  value={(draft.revShareOther ?? DEFAULT_REV_SHARE_OTHER) * 100}
                  onChange={(val) => onChange("revShareOther", val / 100)}
                  format="percent"
                  min={0}
                  max={100}
                  step={5}
                />
              </div>
              <Slider 
                value={[(draft.revShareOther ?? DEFAULT_REV_SHARE_OTHER) * 100]}
                onValueChange={(vals: number[]) => onChange("revShareOther", vals[0] / 100)}
                min={0}
                max={100}
                step={5}
                className="[&_[role=slider]]:bg-primary"
              />
              <p className="text-xs text-gray-500">Spa, parking, activities</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="label-text text-gray-700 flex items-center gap-1.5">
                  Catering Boost
                  <HelpTooltip text="Percentage uplift applied to base F&B revenue from catered events. For example, 30% means total F&B = Base F&B × 1.30." />
                  <ResearchBadge value={researchValues.catering?.display} onClick={() => researchValues.catering && onChange("cateringBoostPercent", researchValues.catering.mid / 100)} />
                </Label>
                <EditableValue
                  value={(draft.cateringBoostPercent ?? DEFAULT_CATERING_BOOST_PCT) * 100}
                  onChange={(val) => onChange("cateringBoostPercent", val / 100)}
                  format="percent"
                  min={0}
                  max={100}
                  step={5}
                />
              </div>
              <Slider 
                value={[(draft.cateringBoostPercent ?? DEFAULT_CATERING_BOOST_PCT) * 100]}
                onValueChange={(vals: number[]) => onChange("cateringBoostPercent", vals[0] / 100)}
                min={0}
                max={100}
                step={5}
                className="[&_[role=slider]]:bg-primary"
              />
              <p className="text-xs text-gray-500">F&B uplift from catered events</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
