import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { formatMoney } from "@/lib/financialEngine";
import EditableValue from "./EditableValue";
import type { FundingSectionProps } from "./types";

export default function FundingSection({ formData, onChange, global }: FundingSectionProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-6 bg-white/80 backdrop-blur-xl border border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.15)]">
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/10 blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-primary/5 blur-xl" />
      <div className="relative">
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h3 className="text-lg font-display text-gray-900 flex items-center">
              Funding
              <HelpTooltip text="Initial capital to fund management company operations before fee revenue begins" manualSection="funding-financing" />
            </h3>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <Label className="text-gray-600 text-sm label-text whitespace-nowrap">Funding Source Name:</Label>
            <Input
              type="text"
              value={formData.fundingSourceLabel ?? global.fundingSourceLabel ?? "Funding Vehicle"}
              onChange={(e) => onChange("fundingSourceLabel", e.target.value)}
              placeholder="e.g., Funding Vehicle, SAFE, Seed, Series A"
              className="max-w-48 bg-white border-primary/30 text-gray-900"
            />
            <HelpTooltip text="Customize the name of your funding source (e.g., Funding Vehicle, SAFE, Seed, Series A)" />
          </div>
          <p className="text-gray-600 text-sm label-text">Capital raised via {formData.fundingSourceLabel ?? global.fundingSourceLabel ?? "Funding Vehicle"} in two tranches to support operations</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-4 bg-primary/10 rounded-lg space-y-4">
            <h4 className="text-sm font-display text-gray-900">Tranche 1</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-gray-700 label-text flex items-center gap-1">Amount<HelpTooltip text="Capital amount raised in the first tranche of funding to cover initial operating expenses before management fee revenue begins." /></Label>
                <EditableValue
                  value={formData.safeTranche1Amount ?? global.safeTranche1Amount}
                  onChange={(v) => onChange("safeTranche1Amount", v)}
                  format="dollar"
                  min={100000}
                  max={1500000}
                  step={25000}
                />
              </div>
              <Slider
                value={[formData.safeTranche1Amount ?? global.safeTranche1Amount]}
                onValueChange={([v]) => onChange("safeTranche1Amount", v)}
                min={100000}
                max={1500000}
                step={25000}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700 label-text flex items-center gap-1">Date<HelpTooltip text="Date when the first tranche of funding is received and recorded on the balance sheet." /></Label>
              <Input
                type="date"
                value={formData.safeTranche1Date ?? global.safeTranche1Date}
                onChange={(e) => onChange("safeTranche1Date", e.target.value)}
                className="max-w-40 bg-white border-primary/30 text-gray-900"
              />
            </div>
          </div>
          <div className="p-4 bg-primary/10 rounded-lg space-y-4">
            <h4 className="text-sm font-display text-gray-900">Tranche 2</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-gray-700 label-text flex items-center gap-1">Amount<HelpTooltip text="Capital amount raised in the second tranche of funding, typically deployed as the portfolio grows." /></Label>
                <EditableValue
                  value={formData.safeTranche2Amount ?? global.safeTranche2Amount}
                  onChange={(v) => onChange("safeTranche2Amount", v)}
                  format="dollar"
                  min={100000}
                  max={1500000}
                  step={25000}
                />
              </div>
              <Slider
                value={[formData.safeTranche2Amount ?? global.safeTranche2Amount]}
                onValueChange={([v]) => onChange("safeTranche2Amount", v)}
                min={100000}
                max={1500000}
                step={25000}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700 label-text flex items-center gap-1">Date<HelpTooltip text="Date when the second tranche of funding is received and recorded on the balance sheet." /></Label>
              <Input
                type="date"
                value={formData.safeTranche2Date ?? global.safeTranche2Date}
                onChange={(e) => onChange("safeTranche2Date", e.target.value)}
                className="max-w-40 bg-white border-primary/30 text-gray-900"
              />
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-primary/20 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <Label className="text-gray-600 text-sm label-text">Total {formData.fundingSourceLabel ?? global.fundingSourceLabel ?? "Funding Vehicle"} Raise</Label>
            <p className="font-mono font-semibold text-lg text-gray-900">
              {formatMoney((formData.safeTranche1Amount ?? global.safeTranche1Amount) + (formData.safeTranche2Amount ?? global.safeTranche2Amount))}
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center text-gray-700 label-text">
                Valuation Cap
                <HelpTooltip text="Maximum company valuation for funding conversion" manualSection="funding-financing" />
              </Label>
              <EditableValue
                value={formData.safeValuationCap ?? global.safeValuationCap}
                onChange={(v) => onChange("safeValuationCap", v)}
                format="dollar"
                min={100000}
                max={5000000}
                step={100000}
              />
            </div>
            <Slider
              value={[formData.safeValuationCap ?? global.safeValuationCap]}
              onValueChange={([v]) => onChange("safeValuationCap", v)}
              min={100000}
              max={5000000}
              step={100000}
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center text-gray-700 label-text">
                Discount Rate
                <HelpTooltip text="Discount on share price when funding converts to equity" manualSection="funding-financing" />
              </Label>
              <EditableValue
                value={formData.safeDiscountRate ?? global.safeDiscountRate}
                onChange={(v) => onChange("safeDiscountRate", v)}
                format="percent"
                min={0}
                max={0.5}
                step={0.05}
              />
            </div>
            <Slider
              value={[(formData.safeDiscountRate ?? global.safeDiscountRate) * 100]}
              onValueChange={([v]) => onChange("safeDiscountRate", v / 100)}
              min={0}
              max={50}
              step={5}
            />
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
