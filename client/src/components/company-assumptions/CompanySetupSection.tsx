/**
 * CompanySetupSection.tsx — Company identity and model timeline.
 *
 * Configures top-level settings for the management company entity:
 *   • Company name (editable only by admins)
 *   • Model start year — the first projection year (Year 1 of operations)
 *   • Number of projection years — how many years to model (e.g. 10)
 *   • Acquisition schedule — how many properties are acquired per year
 *     (drives revenue ramp as each new property adds management fee income)
 *   • Property type — the kind of properties the company manages (hotel,
 *     B&B, resort, etc.), which influences default USALI expense ratios
 *
 * This section must be filled in before any other assumptions are meaningful,
 * because the acquisition schedule determines when fee revenue begins.
 */
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import defaultLogo from "@/assets/logo.png";
import { PROJECTION_YEARS } from "@/lib/constants";
import type { CompanySetupSectionProps } from "./types";

export default function CompanySetupSection({ formData, onChange, global, isAdmin }: CompanySetupSectionProps) {
  return (
    <div className="relative overflow-hidden rounded-lg p-6 bg-card border border-border shadow-sm">
      <div className="relative space-y-4">
        <div>
          <h3 className="text-lg font-display text-foreground flex items-center">
            Company Setup
            <InfoTooltip text="When the management company begins operations and starts incurring costs" />
          </h3>
          <p className="text-muted-foreground text-sm label-text">Configure the management company name and when it starts operations</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="flex flex-col gap-2">
            <Label className="flex items-center text-foreground label-text">
              Company Logo
              <InfoTooltip text="The company logo displayed in the navigation. Managed in Admin Settings > Branding." />
            </Label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg border border-border bg-card flex items-center justify-center overflow-hidden">
                <img 
                  src={global.companyLogoUrl ?? global.companyLogo ?? defaultLogo} 
                  alt="Company Logo" 
                  className="w-12 h-12 object-contain"
                />
              </div>
              <p className="text-xs text-muted-foreground">Managed in Admin Settings &gt; Branding</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label className="flex items-center text-foreground label-text">
              Company Name
              <InfoTooltip text="The name of the hospitality management company. Only administrators can change this." />
            </Label>
            <Input
              type="text"
              value={formData.companyName ?? global.companyName ?? "Hospitality Business"}
              onChange={(e) => onChange("companyName", e.target.value)}
              disabled={!isAdmin}
              className={`max-w-64 border-border text-foreground ${!isAdmin ? 'bg-muted cursor-not-allowed opacity-60' : 'bg-card'}`}
              data-testid="input-company-name"
            />
            {!isAdmin && (
              <p className="text-xs text-muted-foreground">Only administrators can change the company name</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label className="flex items-center text-foreground label-text">
              Operations Start Date
              <InfoTooltip text="The date when the management company begins operations, starts paying salaries, and incurs overhead costs" />
            </Label>
            <Input
              type="date"
              value={formData.companyOpsStartDate ?? global.companyOpsStartDate ?? "2026-06-01"}
              onChange={(e) => onChange("companyOpsStartDate", e.target.value)}
              className="max-w-40 bg-card border-border text-foreground"
              data-testid="input-company-ops-start-date"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="flex items-center text-foreground label-text">
              Projection Years
              <InfoTooltip text="Number of years to project financial statements. Affects all charts, tables, and verification checks." />
            </Label>
            <Input
              type="number"
              value={formData.projectionYears ?? global.projectionYears ?? PROJECTION_YEARS}
              onChange={(e) => onChange("projectionYears", Math.max(1, Math.min(30, parseInt(e.target.value) || PROJECTION_YEARS)))}
              min={1}
              max={30}
              className="max-w-24 bg-card border-border text-foreground"
              data-testid="input-projection-years"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
