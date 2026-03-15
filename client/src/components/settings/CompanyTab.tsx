import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { IconProperties, IconPhone, IconMail, IconGlobe, IconHash, IconCalendar, IconDollarSign, IconBanknote } from "@/components/icons";
import LogoSelector from "@/components/admin/LogoSelector";
import { SettingsTabProps } from "./types";
import { formatMoney } from "@/lib/financial/utils";
import { DEFAULT_SAFE_VALUATION_CAP, DEFAULT_SAFE_DISCOUNT_RATE } from "@shared/constants";

export function CompanyTab({
  currentGlobal,
  handleGlobalChange,
  setGlobalDraft,
}: SettingsTabProps & {
  setGlobalDraft: (draft: any) => void;
}) {
  const hasValuationCap = (currentGlobal.safeValuationCap ?? 0) > 0;
  const hasDiscountRate = (currentGlobal.safeDiscountRate ?? 0) > 0;
  const [showValuationCap, setShowValuationCap] = useState(hasValuationCap);
  const [showDiscountRate, setShowDiscountRate] = useState(hasDiscountRate);

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

      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <IconBanknote className="w-5 h-5 text-primary" />
            Funding Defaults
            <InfoTooltip text="Default funding vehicle terms that pre-populate new scenarios. These fields are also available on the Company Assumptions page." />
          </CardTitle>
          <CardDescription className="label-text">Source label, tranche amounts and dates, valuation cap, and discount rate for the funding instrument.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="label-text text-foreground">Funding Source Name</Label>
            <Input
              type="text"
              value={currentGlobal.fundingSourceLabel || ""}
              onChange={(e) => handleGlobalChange("fundingSourceLabel", e.target.value)}
              placeholder="e.g., Funding Vehicle, SAFE, Seed, Series A"
              className="bg-card max-w-xs"
              data-testid="input-settings-funding-source-label"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-4 bg-primary/10 rounded-lg space-y-4">
              <h4 className="text-sm font-display text-foreground">Tranche 1</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="label-text flex items-center gap-1">Amount <InfoTooltip text="Capital amount raised in the first tranche of funding to cover initial operating expenses before management fee revenue begins." /></Label>
                  <span className="text-sm font-mono text-primary">{formatMoney(currentGlobal.safeTranche1Amount ?? 0)}</span>
                </div>
                <Slider
                  value={[currentGlobal.safeTranche1Amount ?? 800000]}
                  onValueChange={(vals) => handleGlobalChange("safeTranche1Amount", vals[0].toString())}
                  min={100000}
                  max={1500000}
                  step={25000}
                  data-testid="slider-settings-tranche1-amount"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>$100K</span>
                  <span>$1.5M</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="label-text text-foreground flex items-center gap-1">Date <InfoTooltip text="Date when the first tranche of funding is received and recorded on the balance sheet." /></Label>
                <Input
                  type="date"
                  value={currentGlobal.safeTranche1Date || ""}
                  onChange={(e) => handleGlobalChange("safeTranche1Date", e.target.value)}
                  className="bg-card max-w-40"
                  data-testid="input-settings-tranche1-date"
                />
              </div>
            </div>

            <div className="p-4 bg-primary/10 rounded-lg space-y-4">
              <h4 className="text-sm font-display text-foreground">Tranche 2</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="label-text flex items-center gap-1">Amount <InfoTooltip text="Capital amount raised in the second tranche of funding, typically deployed as the portfolio grows." /></Label>
                  <span className="text-sm font-mono text-primary">{formatMoney(currentGlobal.safeTranche2Amount ?? 0)}</span>
                </div>
                <Slider
                  value={[currentGlobal.safeTranche2Amount ?? 800000]}
                  onValueChange={(vals) => handleGlobalChange("safeTranche2Amount", vals[0].toString())}
                  min={100000}
                  max={1500000}
                  step={25000}
                  data-testid="slider-settings-tranche2-amount"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>$100K</span>
                  <span>$1.5M</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="label-text text-foreground flex items-center gap-1">Date <InfoTooltip text="Date when the second tranche of funding is received and recorded on the balance sheet." /></Label>
                <Input
                  type="date"
                  value={currentGlobal.safeTranche2Date || ""}
                  onChange={(e) => handleGlobalChange("safeTranche2Date", e.target.value)}
                  className="bg-card max-w-40"
                  data-testid="input-settings-tranche2-date"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="label-text flex items-center text-foreground">
                    Valuation Cap
                    <InfoTooltip text="Maximum company valuation at which the funding instrument converts to equity. Enable this if your instrument includes a valuation cap (common for SAFEs and convertible notes)." />
                  </Label>
                  <Switch
                    checked={showValuationCap}
                    onCheckedChange={(checked) => {
                      setShowValuationCap(checked);
                      if (!checked) {
                        handleGlobalChange("safeValuationCap", "0");
                      } else if ((currentGlobal.safeValuationCap ?? 0) <= 0) {
                        handleGlobalChange("safeValuationCap", DEFAULT_SAFE_VALUATION_CAP.toString());
                      }
                    }}
                    data-testid="toggle-settings-valuation-cap"
                  />
                </div>
                {showValuationCap && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Cap Amount</span>
                      <span className="text-sm font-mono text-primary">{formatMoney(currentGlobal.safeValuationCap ?? 0)}</span>
                    </div>
                    <Slider
                      value={[currentGlobal.safeValuationCap ?? DEFAULT_SAFE_VALUATION_CAP]}
                      onValueChange={(vals) => handleGlobalChange("safeValuationCap", vals[0].toString())}
                      min={100000}
                      max={5000000}
                      step={100000}
                      data-testid="slider-settings-valuation-cap"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>$100K</span>
                      <span>$5M</span>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="label-text flex items-center text-foreground">
                    Discount Rate
                    <InfoTooltip text="Percentage discount on share price when the funding instrument converts to equity. Enable this if your instrument includes a discount rate." />
                  </Label>
                  <Switch
                    checked={showDiscountRate}
                    onCheckedChange={(checked) => {
                      setShowDiscountRate(checked);
                      if (!checked) {
                        handleGlobalChange("safeDiscountRate", "0");
                      } else if ((currentGlobal.safeDiscountRate ?? 0) <= 0) {
                        handleGlobalChange("safeDiscountRate", DEFAULT_SAFE_DISCOUNT_RATE.toString());
                      }
                    }}
                    data-testid="toggle-settings-discount-rate"
                  />
                </div>
                {showDiscountRate && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Rate</span>
                      <span className="text-sm font-mono text-primary">{((currentGlobal.safeDiscountRate ?? 0) * 100).toFixed(0)}%</span>
                    </div>
                    <Slider
                      value={[(currentGlobal.safeDiscountRate ?? DEFAULT_SAFE_DISCOUNT_RATE) * 100]}
                      onValueChange={(vals) => handleGlobalChange("safeDiscountRate", (vals[0] / 100).toString())}
                      min={0}
                      max={50}
                      step={5}
                      data-testid="slider-settings-discount-rate"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0%</span>
                      <span>50%</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
