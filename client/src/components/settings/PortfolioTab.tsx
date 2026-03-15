import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { DEFAULT_COMMISSION_RATE, DEFAULT_LTV, DEFAULT_ACQ_CLOSING_COST_RATE, DEFAULT_REFI_LTV, DEFAULT_REFI_CLOSING_COST_RATE } from "@/lib/constants";
import { SettingsTabProps } from "./types";

export function PortfolioTab({
  currentGlobal,
  handleGlobalChange,
  handleNestedChange,
}: SettingsTabProps) {
  return (
    <div className="space-y-6 mt-6">
      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center font-display">
            Disposition — Defaults for New Properties
            <InfoTooltip text="Default for new properties — each property can override." manualSection="global-assumptions" />
          </CardTitle>
          <CardDescription className="label-text">Default costs applied to new properties at creation. Override per property in Property Edit.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="label-text flex items-center gap-1">Real Estate Commission <InfoTooltip text="Broker commission percentage paid on property sale. Default for new properties — each property can override. Industry standard: 4–6%." /></Label>
              <span className="text-sm font-mono text-primary">{((currentGlobal.commissionRate || DEFAULT_COMMISSION_RATE) * 100).toFixed(1)}%</span>
            </div>
            <Slider 
              value={[(currentGlobal.commissionRate || DEFAULT_COMMISSION_RATE) * 100]}
              onValueChange={(vals) => handleGlobalChange("commissionRate", (vals[0] / 100).toString())}
              min={0}
              max={10}
              step={0.5}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>10%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center font-display">
            Acquisition Financing — Defaults for New Properties
            <InfoTooltip text="Default for new properties — each property can override." />
          </CardTitle>
          <CardDescription className="label-text">Default loan terms applied to new properties at creation. Override per property in Property Edit.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="label-text flex items-center gap-1">LTV <InfoTooltip text="Loan-to-Value ratio — percentage of purchase price financed by debt. Default for new properties — each property can override. Typical hotel acquisitions: 60–75%." /></Label>
              <span className="text-sm font-mono text-primary">{((currentGlobal.debtAssumptions?.acqLTV || DEFAULT_LTV) * 100).toFixed(0)}%</span>
            </div>
            <Slider 
              value={[(currentGlobal.debtAssumptions?.acqLTV || DEFAULT_LTV) * 100]}
              onValueChange={(vals) => handleNestedChange("debtAssumptions", "acqLTV", (vals[0] / 100).toString())}
              min={0}
              max={90}
              step={5}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>90%</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="label-text flex items-center gap-1">Interest Rate <InfoTooltip text="Annual interest rate on the acquisition loan. Default for new properties — each property can override." /></Label>
              <span className="text-sm font-mono text-primary">{((currentGlobal.debtAssumptions?.interestRate || 0) * 100).toFixed(1)}%</span>
            </div>
            <Slider 
              value={[(currentGlobal.debtAssumptions?.interestRate || 0) * 100]}
              onValueChange={(vals) => handleNestedChange("debtAssumptions", "interestRate", (vals[0] / 100).toString())}
              min={0}
              max={15}
              step={0.25}
            />
            <div className="flex justify-between text-xs text-muted-foreground font-mono">
              <span>0%</span>
              <span>15%</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="label-text flex items-center gap-1">Term <InfoTooltip text="Loan amortization period in years. Default for new properties — each property can override." /></Label>
              <span className="text-sm font-mono text-primary whitespace-nowrap">{currentGlobal.debtAssumptions?.amortizationYears || 25} yrs</span>
            </div>
            <Slider 
              value={[currentGlobal.debtAssumptions?.amortizationYears || 25]}
              onValueChange={(vals) => handleNestedChange("debtAssumptions", "amortizationYears", vals[0].toString())}
              min={5}
              max={30}
              step={1}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="whitespace-nowrap">5 yrs</span>
              <span className="whitespace-nowrap">30 yrs</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="label-text flex items-center gap-1">Closing Costs <InfoTooltip text="Transaction costs as a percentage of loan amount. Default for new properties — each property can override." /></Label>
              <span className="text-sm font-mono text-primary">{((currentGlobal.debtAssumptions?.acqClosingCostRate || DEFAULT_ACQ_CLOSING_COST_RATE) * 100).toFixed(1)}%</span>
            </div>
            <Slider 
              value={[(currentGlobal.debtAssumptions?.acqClosingCostRate || DEFAULT_ACQ_CLOSING_COST_RATE) * 100]}
              onValueChange={(vals) => handleNestedChange("debtAssumptions", "acqClosingCostRate", (vals[0] / 100).toString())}
              min={0}
              max={5}
              step={0.25}
            />
            <div className="flex justify-between text-xs text-muted-foreground font-mono">
              <span>0%</span>
              <span>5%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center font-display">
            Refinancing — Defaults for New Properties
            <InfoTooltip text="Default for new properties — each property can override." manualSection="funding-financing" />
          </CardTitle>
          <CardDescription className="label-text">Default refinancing terms applied to new properties at creation. Override per property in Property Edit.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="label-text flex items-center gap-1">Years After Acq. <InfoTooltip text="Number of years after acquisition before refinancing. Default for new properties — each property can override." /></Label>
              <span className="text-sm font-mono text-primary whitespace-nowrap">{currentGlobal.debtAssumptions?.refiPeriodYears || 3} yrs</span>
            </div>
            <Slider 
              value={[currentGlobal.debtAssumptions?.refiPeriodYears || 3]}
              onValueChange={(vals) => handleNestedChange("debtAssumptions", "refiPeriodYears", vals[0].toString())}
              min={1}
              max={10}
              step={1}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="whitespace-nowrap">1 yr</span>
              <span className="whitespace-nowrap">10 yrs</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="label-text flex items-center gap-1">Refi LTV <InfoTooltip text="Loan-to-Value ratio for refinancing. Default for new properties — each property can override." /></Label>
              <span className="text-sm font-mono text-primary">{((currentGlobal.debtAssumptions?.refiLTV || DEFAULT_REFI_LTV) * 100).toFixed(0)}%</span>
            </div>
            <Slider 
              value={[(currentGlobal.debtAssumptions?.refiLTV || DEFAULT_REFI_LTV) * 100]}
              onValueChange={(vals) => handleNestedChange("debtAssumptions", "refiLTV", (vals[0] / 100).toString())}
              min={0}
              max={90}
              step={5}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>90%</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="label-text flex items-center gap-1">Refi Rate <InfoTooltip text="Expected annual interest rate for the refinance loan. Default for new properties — each property can override." /></Label>
              <span className="text-sm font-mono text-primary">{((currentGlobal.debtAssumptions?.refiInterestRate || currentGlobal.debtAssumptions?.interestRate || 0.08) * 100).toFixed(1)}%</span>
            </div>
            <Slider 
              value={[(currentGlobal.debtAssumptions?.refiInterestRate || currentGlobal.debtAssumptions?.interestRate || 0.08) * 100]}
              onValueChange={(vals) => handleNestedChange("debtAssumptions", "refiInterestRate", (vals[0] / 100).toString())}
              min={0}
              max={15}
              step={0.25}
            />
            <div className="flex justify-between text-xs text-muted-foreground font-mono">
              <span>0%</span>
              <span>15%</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="label-text flex items-center gap-1">Refi Term <InfoTooltip text="Amortization period for the refinance loan. Default for new properties — each property can override." /></Label>
              <span className="text-sm font-mono text-primary whitespace-nowrap">{currentGlobal.debtAssumptions?.refiAmortizationYears || currentGlobal.debtAssumptions?.amortizationYears || 25} yrs</span>
            </div>
            <Slider 
              value={[currentGlobal.debtAssumptions?.refiAmortizationYears || currentGlobal.debtAssumptions?.amortizationYears || 25]}
              onValueChange={(vals) => handleNestedChange("debtAssumptions", "refiAmortizationYears", vals[0].toString())}
              min={5}
              max={30}
              step={1}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="whitespace-nowrap">5 yrs</span>
              <span className="whitespace-nowrap">30 yrs</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="label-text flex items-center gap-1">Refi Closing <InfoTooltip text="Refinance closing costs as a percentage of the new loan amount. Default for new properties — each property can override." /></Label>
              <span className="text-sm font-mono text-primary">{((currentGlobal.debtAssumptions?.refiClosingCostRate || DEFAULT_REFI_CLOSING_COST_RATE) * 100).toFixed(1)}%</span>
            </div>
            <Slider 
              value={[(currentGlobal.debtAssumptions?.refiClosingCostRate || DEFAULT_REFI_CLOSING_COST_RATE) * 100]}
              onValueChange={(vals) => handleNestedChange("debtAssumptions", "refiClosingCostRate", (vals[0] / 100).toString())}
              min={0}
              max={5}
              step={0.25}
            />
            <div className="flex justify-between text-xs text-muted-foreground font-mono">
              <span>0%</span>
              <span>5%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
