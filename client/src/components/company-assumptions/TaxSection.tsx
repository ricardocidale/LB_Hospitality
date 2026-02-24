import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { DEFAULT_COMPANY_TAX_RATE } from "@/lib/constants";
import EditableValue from "./EditableValue";
import type { CompanyAssumptionsSectionProps } from "./types";

export default function TaxSection({ formData, onChange, global }: CompanyAssumptionsSectionProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-6 bg-white/80 backdrop-blur-xl border border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.15)]">
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/10 blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-primary/5 blur-xl" />
      <div className="relative">
      <div className="space-y-4">
        <h3 className="text-lg font-display text-gray-900 flex items-center gap-2">
          Company Income Tax
          <HelpTooltip text="Income tax rate applied to the management company's positive net income for after-tax cash flow calculations. Each property SPV has its own income tax rate set on its assumptions page." manualSection="company-formulas" />
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-gray-700 label-text flex items-center gap-1">Company Income Tax Rate<HelpTooltip text="Income tax rate applied to the management company's positive net income. This is separate from property-level income taxes, which are set per property on each property's assumptions page." /></Label>
            <EditableValue
              value={formData.companyTaxRate ?? global.companyTaxRate ?? DEFAULT_COMPANY_TAX_RATE}
              onChange={(v) => onChange("companyTaxRate", v)}
              format="percent"
              min={0}
              max={0.50}
              step={0.01}
            />
          </div>
          <Slider
            value={[(formData.companyTaxRate ?? global.companyTaxRate ?? DEFAULT_COMPANY_TAX_RATE) * 100]}
            onValueChange={([v]) => onChange("companyTaxRate", v / 100)}
            min={0}
            max={50}
            step={1}
          />
          <p className="text-xs text-gray-600 mt-2">
            Applied to positive net income to calculate after-tax cash flow
          </p>
        </div>
      </div>
    </div></div>
  );
}
