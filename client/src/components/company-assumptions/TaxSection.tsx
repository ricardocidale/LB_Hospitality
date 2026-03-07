/**
 * TaxSection.tsx — Corporate income tax rate for the management company.
 *
 * A simple section with a single slider controlling the effective corporate
 * tax rate applied to the management company's pre-tax income (EBITDA).
 * The default is typically 21% (current US federal corporate rate), but
 * users can adjust to model different jurisdictions or combined
 * federal + state effective rates.
 *
 * Tax is computed in the financial engine as:
 *   Tax = max(0, EBITDA × taxRate)
 * No tax is owed in loss years (the model does not currently carry
 * forward net operating losses / NOLs).
 */
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { ResearchBadge } from "@/components/ui/research-badge";
import { DEFAULT_COMPANY_TAX_RATE } from "@/lib/constants";
import EditableValue from "./EditableValue";
import type { TaxSectionProps } from "./types";

export default function TaxSection({ formData, onChange, global, researchValues }: TaxSectionProps) {
  return (
    <div className="relative overflow-hidden rounded-lg p-6 bg-white border border-border shadow-sm">
      <div className="relative">
      <div className="space-y-4">
        <h3 className="text-lg font-display text-foreground flex items-center gap-2">
          Company Income Tax
          <HelpTooltip text="Income tax rate applied to the management company's positive net income for after-tax cash flow calculations. Each property SPV has its own income tax rate set on its assumptions page." manualSection="company-formulas" />
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-foreground label-text flex items-center gap-1">Company Income Tax Rate<HelpTooltip text="Income tax rate applied to the management company's positive net income. This is separate from property-level income taxes, which are set per property on each property's assumptions page." />
              <ResearchBadge value={researchValues.companyTaxRate?.display} onClick={() => researchValues.companyTaxRate && onChange("companyTaxRate", researchValues.companyTaxRate.mid / 100)} sourceType="industry" sourceName="AICPA/IRS benchmarks" data-testid="badge-company-tax" />
            </Label>
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
          <p className="text-xs text-muted-foreground mt-2">
            Applied to positive net income to calculate after-tax cash flow
          </p>
        </div>
      </div>
    </div></div>
  );
}
