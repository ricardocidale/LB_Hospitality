import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import defaultLogo from "@/assets/logo.png";
import { PROJECTION_YEARS } from "@/lib/constants";
import type { CompanySetupSectionProps } from "./types";

export default function CompanySetupSection({ formData, onChange, global, isAdmin }: CompanySetupSectionProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-6 bg-white/80 backdrop-blur-xl border border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.15)]">
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/10 blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-primary/5 blur-xl" />
      <div className="relative space-y-4">
        <div>
          <h3 className="text-lg font-display text-gray-900 flex items-center">
            Company Setup
            <HelpTooltip text="When the management company begins operations and starts incurring costs" />
          </h3>
          <p className="text-gray-600 text-sm label-text">Configure the management company name and when it starts operations</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="flex flex-col gap-2">
            <Label className="flex items-center text-gray-700 label-text">
              Company Logo
              <HelpTooltip text="The company logo displayed in the navigation. Managed in Admin Settings > Branding." />
            </Label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg border border-primary/30 bg-white flex items-center justify-center overflow-hidden">
                <img 
                  src={global.companyLogoUrl ?? global.companyLogo ?? defaultLogo} 
                  alt="Company Logo" 
                  className="w-12 h-12 object-contain"
                />
              </div>
              <p className="text-xs text-gray-500">Managed in Admin Settings &gt; Branding</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label className="flex items-center text-gray-700 label-text">
              Company Name
              <HelpTooltip text="The name of the hospitality management company. Only administrators can change this." />
            </Label>
            <Input
              type="text"
              value={formData.companyName ?? global.companyName ?? "Hospitality Business"}
              onChange={(e) => onChange("companyName", e.target.value)}
              disabled={!isAdmin}
              className={`max-w-64 border-primary/30 text-gray-900 ${!isAdmin ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'bg-white'}`}
              data-testid="input-company-name"
            />
            {!isAdmin && (
              <p className="text-xs text-gray-500">Only administrators can change the company name</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label className="flex items-center text-gray-700 label-text">
              Operations Start Date
              <HelpTooltip text="The date when the management company begins operations, starts paying salaries, and incurs overhead costs" />
            </Label>
            <Input
              type="date"
              value={formData.companyOpsStartDate ?? global.companyOpsStartDate ?? "2026-06-01"}
              onChange={(e) => onChange("companyOpsStartDate", e.target.value)}
              className="max-w-40 bg-white border-primary/30 text-gray-900"
              data-testid="input-company-ops-start-date"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="flex items-center text-gray-700 label-text">
              Projection Years
              <HelpTooltip text="Number of years to project financial statements. Affects all charts, tables, and verification checks." />
            </Label>
            <Input
              type="number"
              value={formData.projectionYears ?? global.projectionYears ?? PROJECTION_YEARS}
              onChange={(e) => onChange("projectionYears", Math.max(1, Math.min(30, parseInt(e.target.value) || PROJECTION_YEARS)))}
              min={1}
              max={30}
              className="max-w-24 bg-white border-primary/30 text-gray-900"
              data-testid="input-projection-years"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
