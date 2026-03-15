import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { IconProperties, IconPhone, IconMail, IconGlobe, IconHash, IconCalendar, IconDollarSign } from "@/components/icons";
import LogoSelector from "@/components/admin/LogoSelector";
import { SettingsTabProps } from "./types";

export function CompanyTab({
  currentGlobal,
  handleGlobalChange,
  setGlobalDraft,
}: SettingsTabProps & {
  setGlobalDraft: (draft: any) => void;
}) {
  return (
    <div className="space-y-6 mt-6">
      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <IconProperties className="w-5 h-5 text-primary" />
            Identity & Contact
            <InfoTooltip text="Core company identity and contact information. These same fields are also available on Admin > Branding." />
          </CardTitle>
          <CardDescription className="label-text">Company name, logo, and contact details used across reports and correspondence.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="label-text text-foreground">Company Name</Label>
              <Input
                value={currentGlobal.companyName || ""}
                onChange={(e) => handleGlobalChange("companyName", e.target.value)}
                placeholder="Enter management company name"
                className="bg-card"
                data-testid="input-settings-company-name"
              />
            </div>
            <LogoSelector
              label="Company Logo"
              value={currentGlobal.companyLogoId ?? null}
              onChange={(logoId) => setGlobalDraft({ ...currentGlobal, companyLogoId: logoId })}
              showNone={true}
              emptyLabel="Default Logo"
              helpText="Select from Logo Portfolio"
              testId="select-settings-company-logo"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="label-text text-foreground flex items-center gap-2"><IconMail className="w-3 h-3" /> Email</Label>
              <Input
                value={currentGlobal.companyEmail || ""}
                onChange={(e) => handleGlobalChange("companyEmail", e.target.value)}
                placeholder="contact@company.com"
                className="bg-card"
                data-testid="input-settings-company-email"
              />
            </div>
            <div className="space-y-2">
              <Label className="label-text text-foreground flex items-center gap-2"><IconPhone className="w-3 h-3" /> Phone</Label>
              <Input
                value={currentGlobal.companyPhone || ""}
                onChange={(e) => handleGlobalChange("companyPhone", e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="bg-card"
                data-testid="input-settings-company-phone"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="label-text text-foreground flex items-center gap-2"><IconGlobe className="w-3 h-3" /> Website</Label>
              <Input
                value={currentGlobal.companyWebsite || ""}
                onChange={(e) => handleGlobalChange("companyWebsite", e.target.value)}
                placeholder="https://www.company.com"
                className="bg-card"
                data-testid="input-settings-company-website"
              />
            </div>
            <div className="space-y-2">
              <Label className="label-text text-foreground flex items-center gap-2"><IconHash className="w-3 h-3" /> Tax ID / EIN</Label>
              <Input
                value={currentGlobal.companyEin || ""}
                onChange={(e) => handleGlobalChange("companyEin", e.target.value)}
                placeholder="XX-XXXXXXX"
                className="bg-card"
                data-testid="input-settings-company-ein"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="label-text text-foreground flex items-center gap-2"><IconCalendar className="w-3 h-3" /> Founding Year</Label>
              <Input
                type="number"
                value={currentGlobal.companyFoundingYear || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) {
                    handleGlobalChange("companyFoundingYear", val);
                  } else {
                    setGlobalDraft({ ...currentGlobal, companyFoundingYear: null });
                  }
                }}
                placeholder="2020"
                className="bg-card"
                data-testid="input-settings-company-founding-year"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <IconDollarSign className="w-5 h-5 text-primary" />
            Financial Defaults
            <InfoTooltip text="Key financial parameters for the management company model. These fields are also available on the Company Assumptions page." />
          </CardTitle>
          <CardDescription className="label-text">Operations start date, projection horizon, and fee/tax rates driving the company financial model.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="label-text text-foreground flex items-center gap-1">Operations Start Date <InfoTooltip text="The date the management company begins operating. Financial projections start from this date." /></Label>
              <Input
                type="date"
                value={currentGlobal.companyOpsStartDate || ""}
                onChange={(e) => handleGlobalChange("companyOpsStartDate", e.target.value)}
                className="bg-card"
                data-testid="input-settings-ops-start-date"
              />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="label-text flex items-center gap-1">Projection Years <InfoTooltip text="Number of years to project the financial model forward from the operations start date." /></Label>
                <span className="text-sm font-mono text-primary">{currentGlobal.projectionYears} yrs</span>
              </div>
              <Slider
                value={[currentGlobal.projectionYears]}
                onValueChange={(vals) => handleGlobalChange("projectionYears", vals[0].toString())}
                min={1}
                max={20}
                step={1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 yr</span>
                <span>20 yrs</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="label-text flex items-center gap-1">Base Mgmt Fee <InfoTooltip text="Base management fee rate charged on gross revenue from managed properties. This is the primary recurring revenue driver for the management company." /></Label>
                <span className="text-sm font-mono text-primary">{((currentGlobal.baseManagementFee || 0) * 100).toFixed(1)}%</span>
              </div>
              <Slider
                value={[(currentGlobal.baseManagementFee || 0) * 100]}
                onValueChange={(vals) => handleGlobalChange("baseManagementFee", (vals[0] / 100).toString())}
                min={0}
                max={10}
                step={0.5}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>10%</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="label-text flex items-center gap-1">Incentive Mgmt Fee <InfoTooltip text="Incentive management fee rate applied to GOP (Gross Operating Profit) from managed properties. Earned when properties exceed performance thresholds." /></Label>
                <span className="text-sm font-mono text-primary">{((currentGlobal.incentiveManagementFee || 0) * 100).toFixed(1)}%</span>
              </div>
              <Slider
                value={[(currentGlobal.incentiveManagementFee || 0) * 100]}
                onValueChange={(vals) => handleGlobalChange("incentiveManagementFee", (vals[0] / 100).toString())}
                min={0}
                max={15}
                step={0.5}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>15%</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="label-text flex items-center gap-1">Income Tax Rate <InfoTooltip text="Corporate income tax rate applied to the management company's taxable income for after-tax cash flow calculations." /></Label>
                <span className="text-sm font-mono text-primary">{((currentGlobal.companyTaxRate || 0) * 100).toFixed(1)}%</span>
              </div>
              <Slider
                value={[(currentGlobal.companyTaxRate || 0) * 100]}
                onValueChange={(vals) => handleGlobalChange("companyTaxRate", (vals[0] / 100).toString())}
                min={0}
                max={50}
                step={0.5}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>50%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
