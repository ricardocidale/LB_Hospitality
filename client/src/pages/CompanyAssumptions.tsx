import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useGlobalAssumptions, useUpdateGlobalAssumptions } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
        className="w-20 px-1 py-0.5 text-right font-semibold border rounded bg-background"
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
              <h2 className="text-3xl font-serif text-primary" style={{ fontFamily: "'Nunito', sans-serif" }}>
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

        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                Revenue Structure
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
                    max={0.2}
                    step={0.005}
                  />
                </div>
                <Slider
                  value={[(formData.baseManagementFee ?? global.baseManagementFee) * 100]}
                  onValueChange={([v]) => handleUpdate("baseManagementFee", v / 100)}
                  min={0}
                  max={20}
                  step={0.5}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center">
                    Incentive Management Fee
                    <HelpTooltip text="Percentage of each property's Gross Operating Profit (GOP) collected annually" />
                  </Label>
                  <EditableValue
                    value={formData.incentiveManagementFee ?? global.incentiveManagementFee}
                    onChange={(v) => handleUpdate("incentiveManagementFee", v)}
                    format="percent"
                    min={0}
                    max={0.3}
                    step={0.01}
                  />
                </div>
                <Slider
                  value={[(formData.incentiveManagementFee ?? global.incentiveManagementFee) * 100]}
                  onValueChange={([v]) => handleUpdate("incentiveManagementFee", v / 100)}
                  min={0}
                  max={30}
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
                    Partner Salary (Each)
                    <HelpTooltip text="Annual base salary per partner (3 partners total)" />
                  </Label>
                  <EditableValue
                    value={formData.partnerSalary ?? global.partnerSalary}
                    onChange={(v) => handleUpdate("partnerSalary", v)}
                    format="dollar"
                    min={50000}
                    max={500000}
                    step={5000}
                  />
                </div>
                <Slider
                  value={[formData.partnerSalary ?? global.partnerSalary]}
                  onValueChange={([v]) => handleUpdate("partnerSalary", v)}
                  min={50000}
                  max={500000}
                  step={5000}
                />
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                Fixed Overhead (Year 1)
                <HelpTooltip text="Starting annual costs, escalate with inflation each year" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
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
                    <HelpTooltip text="PMS, revenue management, and software licenses per property" />
                  </Label>
                  <EditableValue
                    value={formData.itLicensePerClient ?? global.itLicensePerClient}
                    onChange={(v) => handleUpdate("itLicensePerClient", v)}
                    format="dollar"
                    min={0}
                    max={60000}
                    step={1000}
                  />
                </div>
                <Slider
                  value={[formData.itLicensePerClient ?? global.itLicensePerClient]}
                  onValueChange={([v]) => handleUpdate("itLicensePerClient", v)}
                  min={0}
                  max={60000}
                  step={1000}
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
                    max={0.2}
                    step={0.01}
                  />
                </div>
                <Slider
                  value={[(formData.marketingRate ?? global.marketingRate) * 100]}
                  onValueChange={([v]) => handleUpdate("marketingRate", v / 100)}
                  min={0}
                  max={20}
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
                    max={0.15}
                    step={0.005}
                  />
                </div>
                <Slider
                  value={[(formData.miscOpsRate ?? global.miscOpsRate) * 100]}
                  onValueChange={([v]) => handleUpdate("miscOpsRate", v / 100)}
                  min={0}
                  max={15}
                  step={0.5}
                />
              </div>
            </CardContent>
          </Card>
        </section>

        <Card className="bg-muted/30">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground text-center">
              All fixed overhead costs escalate annually with the inflation rate set in Global Assumptions.
              Staff FTE scales automatically: 2.5 (1-3 properties), 4.5 (4-6), 7.0 (7-10).
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
