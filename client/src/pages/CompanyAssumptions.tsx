import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useGlobalAssumptions, useUpdateGlobalAssumptions } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronLeft, Loader2, Save, HelpCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { formatPercent, formatMoney } from "@/lib/financialEngine";
import { useToast } from "@/hooks/use-toast";
import type { GlobalResponse } from "@/lib/api";

function EditableValue({
  value,
  onChange,
  format,
  min,
  max,
  step,
}: {
  value: number;
  onChange: (v: number) => void;
  format: "percent" | "dollar" | "number";
  min: number;
  max: number;
  step: number;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const displayValue = () => {
    if (format === "percent") return formatPercent(value);
    if (format === "dollar") return formatMoney(value);
    return value.toLocaleString();
  };

  const handleEdit = () => {
    if (format === "percent") {
      setInputValue((value * 100).toFixed(1));
    } else {
      setInputValue(value.toString());
    }
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    let numValue = parseFloat(inputValue);
    if (isNaN(numValue)) return;
    if (format === "percent") numValue = numValue / 100;
    numValue = Math.max(min, Math.min(max, numValue));
    onChange(numValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur();
    } else if (e.key === "Escape") {
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoFocus
        className="w-24 px-1 py-0.5 text-right font-semibold border rounded bg-background"
      />
    );
  }

  return (
    <span
      onClick={handleEdit}
      className="cursor-pointer hover:text-primary font-semibold"
      title="Click to edit"
    >
      {displayValue()}
    </span>
  );
}

function HelpTooltip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help ml-1" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">{text}</TooltipContent>
    </Tooltip>
  );
}

export default function CompanyAssumptions() {
  const [, setLocation] = useLocation();
  const { data: global, isLoading } = useGlobalAssumptions();
  const updateMutation = useUpdateGlobalAssumptions();
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<GlobalResponse>>({});

  useEffect(() => {
    if (global) {
      setFormData(global);
    }
  }, [global]);

  if (isLoading || !global) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const handleUpdate = <K extends keyof GlobalResponse>(field: K, value: GlobalResponse[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync(formData);
      toast({
        title: "Saved",
        description: "Company assumptions have been updated.",
      });
      setLocation("/company");
    } catch {
      toast({
        title: "Error",
        description: "Failed to save company assumptions.",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/company">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h2 className="text-3xl font-serif font-bold text-foreground">
                Company Assumptions
              </h2>
              <p className="text-muted-foreground">
                Configure L+B Hospitality Co. operating parameters
              </p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              SAFE Funding
              <HelpTooltip text="Simple Agreement for Future Equity - initial capital to fund management company operations before fee revenue begins" />
            </CardTitle>
            <CardDescription>Capital raised via SAFE in two tranches to support operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-muted/30 rounded-lg space-y-4">
                <h4 className="font-semibold">Tranche 1</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Amount</Label>
                    <EditableValue
                      value={formData.safeTranche1Amount ?? global.safeTranche1Amount}
                      onChange={(v) => handleUpdate("safeTranche1Amount", v)}
                      format="dollar"
                      min={100000}
                      max={1500000}
                      step={25000}
                    />
                  </div>
                  <Slider
                    value={[formData.safeTranche1Amount ?? global.safeTranche1Amount]}
                    onValueChange={([v]) => handleUpdate("safeTranche1Amount", v)}
                    min={100000}
                    max={1500000}
                    step={25000}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={formData.safeTranche1Date ?? global.safeTranche1Date}
                    onChange={(e) => handleUpdate("safeTranche1Date", e.target.value)}
                    className="max-w-40"
                  />
                </div>
              </div>
              <div className="p-4 bg-muted/30 rounded-lg space-y-4">
                <h4 className="font-semibold">Tranche 2</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Amount</Label>
                    <EditableValue
                      value={formData.safeTranche2Amount ?? global.safeTranche2Amount}
                      onChange={(v) => handleUpdate("safeTranche2Amount", v)}
                      format="dollar"
                      min={100000}
                      max={1500000}
                      step={25000}
                    />
                  </div>
                  <Slider
                    value={[formData.safeTranche2Amount ?? global.safeTranche2Amount]}
                    onValueChange={([v]) => handleUpdate("safeTranche2Amount", v)}
                    min={100000}
                    max={1500000}
                    step={25000}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={formData.safeTranche2Date ?? global.safeTranche2Date}
                    onChange={(e) => handleUpdate("safeTranche2Date", e.target.value)}
                    className="max-w-40"
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-muted-foreground text-sm">Total SAFE Raise</Label>
                <p className="font-semibold text-lg">
                  {formatMoney((formData.safeTranche1Amount ?? global.safeTranche1Amount) + (formData.safeTranche2Amount ?? global.safeTranche2Amount))}
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center">
                    Valuation Cap
                    <HelpTooltip text="Maximum company valuation for SAFE conversion" />
                  </Label>
                  <EditableValue
                    value={formData.safeValuationCap ?? global.safeValuationCap}
                    onChange={(v) => handleUpdate("safeValuationCap", v)}
                    format="dollar"
                    min={100000}
                    max={5000000}
                    step={100000}
                  />
                </div>
                <Slider
                  value={[formData.safeValuationCap ?? global.safeValuationCap]}
                  onValueChange={([v]) => handleUpdate("safeValuationCap", v)}
                  min={100000}
                  max={5000000}
                  step={100000}
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center">
                    Discount Rate
                    <HelpTooltip text="Discount on share price when SAFE converts to equity" />
                  </Label>
                  <EditableValue
                    value={formData.safeDiscountRate ?? global.safeDiscountRate}
                    onChange={(v) => handleUpdate("safeDiscountRate", v)}
                    format="percent"
                    min={0}
                    max={0.5}
                    step={0.05}
                  />
                </div>
                <Slider
                  value={[(formData.safeDiscountRate ?? global.safeDiscountRate) * 100]}
                  onValueChange={([v]) => handleUpdate("safeDiscountRate", v / 100)}
                  min={0}
                  max={50}
                  step={5}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                Revenue
                <HelpTooltip text="Management fees collected from each property in the portfolio" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center">
                    Base Management Fee
                    <HelpTooltip text="Percentage of each property's gross revenue collected monthly" />
                  </Label>
                  <EditableValue
                    value={formData.baseManagementFee ?? global.baseManagementFee}
                    onChange={(v) => handleUpdate("baseManagementFee", v)}
                    format="percent"
                    min={0}
                    max={0.1}
                    step={0.005}
                  />
                </div>
                <Slider
                  value={[(formData.baseManagementFee ?? global.baseManagementFee) * 100]}
                  onValueChange={([v]) => handleUpdate("baseManagementFee", v / 100)}
                  min={0}
                  max={10}
                  step={0.5}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center">
                    Incentive Fee (% of GOP)
                    <HelpTooltip text="Percentage of each property's Gross Operating Profit collected annually" />
                  </Label>
                  <EditableValue
                    value={formData.incentiveManagementFee ?? global.incentiveManagementFee}
                    onChange={(v) => handleUpdate("incentiveManagementFee", v)}
                    format="percent"
                    min={0}
                    max={0.2}
                    step={0.01}
                  />
                </div>
                <Slider
                  value={[(formData.incentiveManagementFee ?? global.incentiveManagementFee) * 100]}
                  onValueChange={([v]) => handleUpdate("incentiveManagementFee", v / 100)}
                  min={0}
                  max={20}
                  step={1}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                Compensation
                <HelpTooltip text="Annual salaries for management company team members" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center">
                    Partner Salary (Each, Year 1)
                    <HelpTooltip text="Starting annual salary per partner (3 partners). Escalates at inflation + 10% per year, capped at $30K/month." />
                  </Label>
                  <EditableValue
                    value={formData.partnerSalary ?? global.partnerSalary}
                    onChange={(v) => handleUpdate("partnerSalary", v)}
                    format="dollar"
                    min={120000}
                    max={360000}
                    step={12000}
                  />
                </div>
                <Slider
                  value={[formData.partnerSalary ?? global.partnerSalary]}
                  onValueChange={([v]) => handleUpdate("partnerSalary", v)}
                  min={120000}
                  max={360000}
                  step={12000}
                />
                <p className="text-xs text-muted-foreground">
                  {formatMoney((formData.partnerSalary ?? global.partnerSalary) / 12)}/month starting, max $30,000/month
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center">
                    Staff Salary (Avg)
                    <HelpTooltip text="Average annual salary per staff FTE. Staffing scales: 2.5 FTE (1-3 properties), 4.5 FTE (4-6), 7 FTE (7-10)" />
                  </Label>
                  <EditableValue
                    value={formData.staffSalary ?? global.staffSalary}
                    onChange={(v) => handleUpdate("staffSalary", v)}
                    format="dollar"
                    min={40000}
                    max={200000}
                    step={5000}
                  />
                </div>
                <Slider
                  value={[formData.staffSalary ?? global.staffSalary]}
                  onValueChange={([v]) => handleUpdate("staffSalary", v)}
                  min={40000}
                  max={200000}
                  step={5000}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                Fixed Overhead (Year 1)
                <HelpTooltip text="Starting annual costs that escalate yearly at the fixed cost escalation rate" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center">
                    Fixed Cost Escalation Rate
                    <HelpTooltip text="Annual percentage increase applied to all fixed costs" />
                  </Label>
                  <EditableValue
                    value={formData.fixedCostEscalationRate ?? global.fixedCostEscalationRate}
                    onChange={(v) => handleUpdate("fixedCostEscalationRate", v)}
                    format="percent"
                    min={0}
                    max={0.1}
                    step={0.005}
                  />
                </div>
                <Slider
                  value={[(formData.fixedCostEscalationRate ?? global.fixedCostEscalationRate) * 100]}
                  onValueChange={([v]) => handleUpdate("fixedCostEscalationRate", v / 100)}
                  min={0}
                  max={10}
                  step={0.5}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center">
                    Office Lease
                    <HelpTooltip text="Annual rent for corporate office space" />
                  </Label>
                  <EditableValue
                    value={formData.officeLeaseStart ?? global.officeLeaseStart}
                    onChange={(v) => handleUpdate("officeLeaseStart", v)}
                    format="dollar"
                    min={0}
                    max={200000}
                    step={2000}
                  />
                </div>
                <Slider
                  value={[formData.officeLeaseStart ?? global.officeLeaseStart]}
                  onValueChange={([v]) => handleUpdate("officeLeaseStart", v)}
                  min={0}
                  max={200000}
                  step={2000}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center">
                    Professional Services
                    <HelpTooltip text="Legal, accounting, and consulting fees" />
                  </Label>
                  <EditableValue
                    value={formData.professionalServicesStart ?? global.professionalServicesStart}
                    onChange={(v) => handleUpdate("professionalServicesStart", v)}
                    format="dollar"
                    min={0}
                    max={150000}
                    step={2000}
                  />
                </div>
                <Slider
                  value={[formData.professionalServicesStart ?? global.professionalServicesStart]}
                  onValueChange={([v]) => handleUpdate("professionalServicesStart", v)}
                  min={0}
                  max={150000}
                  step={2000}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center">
                    Tech Infrastructure
                    <HelpTooltip text="Annual cloud hosting, software, and IT services" />
                  </Label>
                  <EditableValue
                    value={formData.techInfraStart ?? global.techInfraStart}
                    onChange={(v) => handleUpdate("techInfraStart", v)}
                    format="dollar"
                    min={0}
                    max={100000}
                    step={2000}
                  />
                </div>
                <Slider
                  value={[formData.techInfraStart ?? global.techInfraStart]}
                  onValueChange={([v]) => handleUpdate("techInfraStart", v)}
                  min={0}
                  max={100000}
                  step={2000}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center">
                    Business Insurance
                    <HelpTooltip text="E&O, liability, and other corporate insurance policies" />
                  </Label>
                  <EditableValue
                    value={formData.businessInsuranceStart ?? global.businessInsuranceStart}
                    onChange={(v) => handleUpdate("businessInsuranceStart", v)}
                    format="dollar"
                    min={0}
                    max={100000}
                    step={1000}
                  />
                </div>
                <Slider
                  value={[formData.businessInsuranceStart ?? global.businessInsuranceStart]}
                  onValueChange={([v]) => handleUpdate("businessInsuranceStart", v)}
                  min={0}
                  max={100000}
                  step={1000}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                Variable Costs
                <HelpTooltip text="Costs that scale with property count or revenue" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center">
                    Travel Cost per Client
                    <HelpTooltip text="Annual travel expense budget per managed property" />
                  </Label>
                  <EditableValue
                    value={formData.travelCostPerClient ?? global.travelCostPerClient}
                    onChange={(v) => handleUpdate("travelCostPerClient", v)}
                    format="dollar"
                    min={0}
                    max={50000}
                    step={1000}
                  />
                </div>
                <Slider
                  value={[formData.travelCostPerClient ?? global.travelCostPerClient]}
                  onValueChange={([v]) => handleUpdate("travelCostPerClient", v)}
                  min={0}
                  max={50000}
                  step={1000}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center">
                    IT/Licensing per Client
                    <HelpTooltip text="PMS, revenue management, and software licenses per B&B property" />
                  </Label>
                  <EditableValue
                    value={formData.itLicensePerClient ?? global.itLicensePerClient}
                    onChange={(v) => handleUpdate("itLicensePerClient", v)}
                    format="dollar"
                    min={0}
                    max={15000}
                    step={500}
                  />
                </div>
                <Slider
                  value={[formData.itLicensePerClient ?? global.itLicensePerClient]}
                  onValueChange={([v]) => handleUpdate("itLicensePerClient", v)}
                  min={0}
                  max={15000}
                  step={500}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center">
                    Marketing (% of Revenue)
                    <HelpTooltip text="Corporate marketing spend as percentage of management fee revenue" />
                  </Label>
                  <EditableValue
                    value={formData.marketingRate ?? global.marketingRate}
                    onChange={(v) => handleUpdate("marketingRate", v)}
                    format="percent"
                    min={0}
                    max={0.15}
                    step={0.01}
                  />
                </div>
                <Slider
                  value={[(formData.marketingRate ?? global.marketingRate) * 100]}
                  onValueChange={([v]) => handleUpdate("marketingRate", v / 100)}
                  min={0}
                  max={15}
                  step={1}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center">
                    Misc Operations (% of Revenue)
                    <HelpTooltip text="General operating expenses as percentage of management fee revenue" />
                  </Label>
                  <EditableValue
                    value={formData.miscOpsRate ?? global.miscOpsRate}
                    onChange={(v) => handleUpdate("miscOpsRate", v)}
                    format="percent"
                    min={0}
                    max={0.1}
                    step={0.005}
                  />
                </div>
                <Slider
                  value={[(formData.miscOpsRate ?? global.miscOpsRate) * 100]}
                  onValueChange={([v]) => handleUpdate("miscOpsRate", v / 100)}
                  min={0}
                  max={10}
                  step={0.5}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Tax Rate
              <HelpTooltip text="Corporate tax rate applied to positive net income for after-tax cash flow calculations" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-md space-y-2">
              <div className="flex justify-between items-center">
                <Label>Company Tax Rate</Label>
                <EditableValue
                  value={(formData.companyTaxRate ?? global.companyTaxRate ?? 0.30) * 100}
                  onChange={(v) => handleUpdate("companyTaxRate", v / 100)}
                  format="percent"
                  min={0}
                  max={50}
                  step={1}
                />
              </div>
              <Slider
                value={[(formData.companyTaxRate ?? global.companyTaxRate ?? 0.30) * 100]}
                onValueChange={([v]) => handleUpdate("companyTaxRate", v / 100)}
                min={0}
                max={50}
                step={1}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Applied to positive net income to calculate after-tax cash flow
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/30">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground text-center">
              All fixed overhead costs escalate annually at the fixed cost escalation rate ({formatPercent(formData.fixedCostEscalationRate ?? global.fixedCostEscalationRate)}).
              Staff FTE scales automatically: 2.5 (1-3 properties), 4.5 (4-6), 7.0 (7-10).
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
