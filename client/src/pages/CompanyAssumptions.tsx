import { useState, useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import { useGlobalAssumptions, useUpdateGlobalAssumptions } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, HelpCircle, Upload, X, BookOpen } from "lucide-react";
import { Link, useLocation } from "wouter";
import { formatPercent, formatMoney } from "@/lib/financialEngine";
import { useToast } from "@/hooks/use-toast";
import type { GlobalResponse } from "@/lib/api";
import { SaveButton } from "@/components/ui/save-button";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard } from "@/components/ui/glass-card";
import defaultLogo from "@/assets/logo.png";

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
        className="w-24 px-1 py-0.5 text-right font-mono font-semibold border rounded bg-white border-[#9FBCA4]/40 text-gray-900"
      />
    );
  }

  return (
    <span
      onClick={handleEdit}
      className="cursor-pointer hover:text-[#257D41] text-[#257D41] font-mono font-semibold"
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
        <HelpCircle className="w-4 h-4 text-[#9FBCA4] cursor-help ml-1" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">{text}</TooltipContent>
    </Tooltip>
  );
}


export default function CompanyAssumptions() {
  const [, setLocation] = useLocation();
  const { data: global, isLoading, refetch } = useGlobalAssumptions();
  const updateMutation = useUpdateGlobalAssumptions();
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState<Partial<GlobalResponse>>({});

  useEffect(() => {
    if (global) {
      setFormData(global);
    }
  }, [global]);

  const modelStartYear = global?.modelStartDate 
    ? new Date(global.modelStartDate).getFullYear() 
    : 2026;

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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (PNG, JPG, etc.)",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      // Step 1: Get presigned URL
      const urlRes = await fetch("/api/uploads/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `company-logo-${Date.now()}.${file.name.split(".").pop()}`,
          size: file.size,
          contentType: file.type,
        }),
      });
      
      if (!urlRes.ok) throw new Error("Failed to get upload URL");
      const { uploadURL, objectPath } = await urlRes.json();

      // Step 2: Upload directly to storage
      const uploadRes = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadRes.ok) throw new Error("Failed to upload file");

      // Step 3: Update global assumptions with the new logo path
      const logoUrl = `/api/objects/${objectPath}`;
      await updateMutation.mutateAsync({ ...formData, companyLogo: logoUrl });
      
      toast({
        title: "Logo uploaded",
        description: "Company logo has been updated successfully.",
      });
      
      refetch();
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveLogo = async () => {
    try {
      await updateMutation.mutateAsync({ ...formData, companyLogo: null });
      setFormData(prev => ({ ...prev, companyLogo: null }));
      toast({
        title: "Logo removed",
        description: "Company logo has been reset to default.",
      });
      refetch();
    } catch {
      toast({
        title: "Error",
        description: "Failed to remove logo.",
        variant: "destructive",
      });
    }
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
        <PageHeader
          title="Company Assumptions"
          subtitle={`Configure ${global.companyName ?? "L+B Hospitality"} Co. operating parameters`}
          variant="dark"
          backLink="/company"
          actions={
            <div className="flex items-center gap-3">
              <Link href="/company/research">
                <button
                  data-testid="button-company-research"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white/90 hover:bg-white/20 transition-colors text-sm border border-white/15"
                >
                  <BookOpen className="w-4 h-4" />
                  Standards Research
                </button>
              </Link>
              <SaveButton 
                onClick={handleSave} 
                isPending={updateMutation.isPending} 
              />
            </div>
          }
        />

        <div className="relative overflow-hidden rounded-2xl p-6 bg-white/80 backdrop-blur-xl border border-[#9FBCA4]/20 shadow-[0_8px_32px_rgba(159,188,164,0.15)]">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#9FBCA4]/10 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-[#9FBCA4]/5 blur-xl" />
          <div className="relative space-y-4">
            <div>
              <h3 className="text-lg font-display text-gray-900 flex items-center">
                Company Setup
                <HelpTooltip text="When the management company begins operations and starts incurring costs" />
              </h3>
              <p className="text-gray-600 text-sm label-text">Configure the management company name and when it starts operations</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2">
                <Label className="flex items-center text-gray-700 label-text">
                  Company Logo
                  <HelpTooltip text="The company logo displayed in the navigation. Only administrators can change this." />
                </Label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg border border-[#9FBCA4]/30 bg-white flex items-center justify-center overflow-hidden">
                    <img 
                      src={formData.companyLogo ?? global.companyLogo ?? defaultLogo} 
                      alt="Company Logo" 
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                  {isAdmin ? (
                    <div className="flex flex-col gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        data-testid="input-logo-upload"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[#9FBCA4]/20 hover:bg-[#9FBCA4]/30 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isUploading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        {isUploading ? "Uploading..." : "Upload"}
                      </button>
                      {(formData.companyLogo || global.companyLogo) && (
                        <button
                          onClick={handleRemoveLogo}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                          Remove
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">Only administrators can change the logo</p>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="flex items-center text-gray-700 label-text">
                  Company Name
                  <HelpTooltip text="The name of the hospitality management company. Only administrators can change this." />
                </Label>
                <Input
                  type="text"
                  value={formData.companyName ?? global.companyName ?? "L+B Hospitality"}
                  onChange={(e) => handleUpdate("companyName", e.target.value)}
                  disabled={!isAdmin}
                  className={`max-w-64 border-[#9FBCA4]/30 text-gray-900 ${!isAdmin ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'bg-white'}`}
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
                  onChange={(e) => handleUpdate("companyOpsStartDate", e.target.value)}
                  className="max-w-40 bg-white border-[#9FBCA4]/30 text-gray-900"
                  data-testid="input-company-ops-start-date"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl p-6 bg-white/80 backdrop-blur-xl border border-[#9FBCA4]/20 shadow-[0_8px_32px_rgba(159,188,164,0.15)]">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#9FBCA4]/10 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-[#9FBCA4]/5 blur-xl" />
          <div className="relative">
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <h3 className="text-lg font-display text-gray-900 flex items-center">
                  Funding
                  <HelpTooltip text="Initial capital to fund management company operations before fee revenue begins" />
                </h3>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <Label className="text-gray-600 text-sm label-text whitespace-nowrap">Funding Source Name:</Label>
                <Input
                  type="text"
                  value={formData.fundingSourceLabel ?? global.fundingSourceLabel ?? "SAFE"}
                  onChange={(e) => handleUpdate("fundingSourceLabel", e.target.value)}
                  placeholder="e.g., SAFE, Seed, Series A"
                  className="max-w-48 bg-white border-[#9FBCA4]/30 text-gray-900"
                />
                <HelpTooltip text="Customize the name of your funding source (default: SAFE)" />
              </div>
              <p className="text-gray-600 text-sm label-text">Capital raised via {formData.fundingSourceLabel ?? global.fundingSourceLabel ?? "SAFE"} in two tranches to support operations</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-[#9FBCA4]/10 rounded-lg space-y-4">
                <h4 className="text-sm font-display text-gray-900">Tranche 1</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-700 label-text">Amount</Label>
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
                  <Label className="text-gray-700 label-text">Date</Label>
                  <Input
                    type="date"
                    value={formData.safeTranche1Date ?? global.safeTranche1Date}
                    onChange={(e) => handleUpdate("safeTranche1Date", e.target.value)}
                    className="max-w-40 bg-white border-[#9FBCA4]/30 text-gray-900"
                  />
                </div>
              </div>
              <div className="p-4 bg-[#9FBCA4]/10 rounded-lg space-y-4">
                <h4 className="text-sm font-display text-gray-900">Tranche 2</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-700 label-text">Amount</Label>
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
                  <Label className="text-gray-700 label-text">Date</Label>
                  <Input
                    type="date"
                    value={formData.safeTranche2Date ?? global.safeTranche2Date}
                    onChange={(e) => handleUpdate("safeTranche2Date", e.target.value)}
                    className="max-w-40 bg-white border-[#9FBCA4]/30 text-gray-900"
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[#9FBCA4]/20 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-gray-600 text-sm label-text">Total {formData.fundingSourceLabel ?? global.fundingSourceLabel ?? "SAFE"} Raise</Label>
                <p className="font-mono font-semibold text-lg text-gray-900">
                  {formatMoney((formData.safeTranche1Amount ?? global.safeTranche1Amount) + (formData.safeTranche2Amount ?? global.safeTranche2Amount))}
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center text-gray-700 label-text">
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
                  <Label className="flex items-center text-gray-700 label-text">
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
          </div>
        </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-2xl p-6 bg-white/80 backdrop-blur-xl border border-[#9FBCA4]/20 shadow-[0_8px_32px_rgba(159,188,164,0.15)]">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#9FBCA4]/10 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-[#9FBCA4]/5 blur-xl" />
          <div className="relative">
            <div className="space-y-6">
              <h3 className="text-lg font-display text-gray-900 flex items-center">
                Revenue
                <HelpTooltip text="Management fees collected from each property in the portfolio" />
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center text-gray-700 label-text">
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
                  <Label className="flex items-center text-gray-700 label-text">
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
            </div>
          </div></div>

          <div className="relative overflow-hidden rounded-2xl p-6 bg-white/80 backdrop-blur-xl border border-[#9FBCA4]/20 shadow-[0_8px_32px_rgba(159,188,164,0.15)]">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#9FBCA4]/10 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-[#9FBCA4]/5 blur-xl" />
          <div className="relative">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-display text-gray-900 flex items-center">
                  Compensation
                  <HelpTooltip text="Annual salaries for management company team members" />
                </h3>
                <p className="text-gray-600 text-sm label-text">Configure partner compensation and staff salaries over 10 years</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center text-gray-700 label-text">
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
            </div>
          </div></div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-2xl p-6 bg-white/80 backdrop-blur-xl border border-[#9FBCA4]/20 shadow-[0_8px_32px_rgba(159,188,164,0.15)]">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#9FBCA4]/10 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-[#9FBCA4]/5 blur-xl" />
          <div className="relative">
            <div className="space-y-6">
              <h3 className="text-lg font-display text-gray-900 flex items-center">
                Fixed Overhead (<span className="font-mono">{modelStartYear}</span>)
                <HelpTooltip text="Starting annual costs that escalate yearly at the fixed cost escalation rate" />
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center text-gray-700 label-text">
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
                  <Label className="flex items-center text-gray-700 label-text">
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
                  <Label className="flex items-center text-gray-700 label-text">
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
                  <Label className="flex items-center text-gray-700 label-text">
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
                  <Label className="flex items-center text-gray-700 label-text">
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
            </div>
          </div></div>

          <div className="relative overflow-hidden rounded-2xl p-6 bg-white/80 backdrop-blur-xl border border-[#9FBCA4]/20 shadow-[0_8px_32px_rgba(159,188,164,0.15)]">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#9FBCA4]/10 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-[#9FBCA4]/5 blur-xl" />
          <div className="relative">
            <div className="space-y-6">
              <h3 className="text-lg font-display text-gray-900 flex items-center">
                Variable Costs
                <HelpTooltip text="Costs that scale with property count or revenue" />
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center text-gray-700 label-text">
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
                  <Label className="flex items-center text-gray-700 label-text">
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
                  <Label className="flex items-center text-gray-700 label-text">
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
                  <Label className="flex items-center text-gray-700 label-text">
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
            </div>
          </div></div>
        </div>

        <div className="relative overflow-hidden rounded-2xl p-6 bg-white/80 backdrop-blur-xl border border-[#9FBCA4]/20 shadow-[0_8px_32px_rgba(159,188,164,0.15)]">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#9FBCA4]/10 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-[#9FBCA4]/5 blur-xl" />
          <div className="relative">
          <div className="space-y-4">
            <h3 className="text-lg font-display text-gray-900 flex items-center gap-2">
              Tax Rate
              <HelpTooltip text="Corporate tax rate applied to positive net income for after-tax cash flow calculations" />
            </h3>
            <div className="max-w-md space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-gray-700 label-text">Company Tax Rate</Label>
                <EditableValue
                  value={formData.companyTaxRate ?? global.companyTaxRate ?? 0.30}
                  onChange={(v) => handleUpdate("companyTaxRate", v)}
                  format="percent"
                  min={0}
                  max={0.50}
                  step={0.01}
                />
              </div>
              <Slider
                value={[(formData.companyTaxRate ?? global.companyTaxRate ?? 0.30) * 100]}
                onValueChange={([v]) => handleUpdate("companyTaxRate", v / 100)}
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

        <div className="relative overflow-hidden rounded-2xl p-6 bg-white/80 backdrop-blur-xl border border-[#9FBCA4]/20 shadow-[0_8px_32px_rgba(159,188,164,0.15)]">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#9FBCA4]/10 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-[#9FBCA4]/5 blur-xl" />
          <div className="relative">
          <div className="space-y-6">
            <h3 className="text-lg font-display text-gray-900 flex items-center gap-2">
              Exit & Sale Assumptions
              <HelpTooltip text="Default values for property exit valuations and sale transactions" />
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center text-gray-700 label-text">
                  Default Exit Cap Rate
                  <HelpTooltip text="Capitalization rate used for property valuation at exit. Higher cap rate = lower valuation." />
                </Label>
                <EditableValue
                  value={formData.exitCapRate ?? global.exitCapRate ?? 0.085}
                  onChange={(v) => handleUpdate("exitCapRate", v)}
                  format="percent"
                  min={0.04}
                  max={0.15}
                  step={0.005}
                />
              </div>
              <Slider
                value={[(formData.exitCapRate ?? global.exitCapRate ?? 0.085) * 100]}
                onValueChange={([v]) => handleUpdate("exitCapRate", v / 100)}
                min={4}
                max={15}
                step={0.5}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center text-gray-700 label-text">
                  Sales Commission Rate
                  <HelpTooltip text="Broker commission paid on property sales as percentage of gross sale price" />
                </Label>
                <EditableValue
                  value={formData.salesCommissionRate ?? global.salesCommissionRate ?? 0.05}
                  onChange={(v) => handleUpdate("salesCommissionRate", v)}
                  format="percent"
                  min={0}
                  max={0.10}
                  step={0.005}
                />
              </div>
              <Slider
                value={[(formData.salesCommissionRate ?? global.salesCommissionRate ?? 0.05) * 100]}
                onValueChange={([v]) => handleUpdate("salesCommissionRate", v / 100)}
                min={0}
                max={10}
                step={0.5}
              />
            </div>
          </div>
        </div></div>

        <div className="relative overflow-hidden rounded-2xl p-6 bg-white/80 backdrop-blur-xl border border-[#9FBCA4]/20 shadow-[0_8px_32px_rgba(159,188,164,0.15)]">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#9FBCA4]/10 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-[#9FBCA4]/5 blur-xl" />
          <div className="relative">
          <div className="space-y-6">
            <h3 className="text-lg font-display text-gray-900 flex items-center gap-2">
              Property Expense Rates
              <HelpTooltip text="Default expense rates applied to specific revenue streams at the property level" />
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center text-gray-700 label-text">
                  Event Expense Rate
                  <HelpTooltip text="Operating costs for events as percentage of event revenue (labor, setup, coordination)" />
                </Label>
                <EditableValue
                  value={formData.eventExpenseRate ?? global.eventExpenseRate ?? 0.65}
                  onChange={(v) => handleUpdate("eventExpenseRate", v)}
                  format="percent"
                  min={0.30}
                  max={0.90}
                  step={0.05}
                />
              </div>
              <Slider
                value={[(formData.eventExpenseRate ?? global.eventExpenseRate ?? 0.65) * 100]}
                onValueChange={([v]) => handleUpdate("eventExpenseRate", v / 100)}
                min={30}
                max={90}
                step={5}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center text-gray-700 label-text">
                  Other Revenue Expense Rate
                  <HelpTooltip text="Operating costs for other revenue (spa, parking, retail) as percentage of that revenue" />
                </Label>
                <EditableValue
                  value={formData.otherExpenseRate ?? global.otherExpenseRate ?? 0.60}
                  onChange={(v) => handleUpdate("otherExpenseRate", v)}
                  format="percent"
                  min={0.30}
                  max={0.90}
                  step={0.05}
                />
              </div>
              <Slider
                value={[(formData.otherExpenseRate ?? global.otherExpenseRate ?? 0.60) * 100]}
                onValueChange={([v]) => handleUpdate("otherExpenseRate", v / 100)}
                min={30}
                max={90}
                step={5}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center text-gray-700 label-text">
                  Utilities Variable Split
                  <HelpTooltip text="Percentage of utility costs that scale with revenue. Remaining portion is fixed overhead." />
                </Label>
                <EditableValue
                  value={formData.utilitiesVariableSplit ?? global.utilitiesVariableSplit ?? 0.60}
                  onChange={(v) => handleUpdate("utilitiesVariableSplit", v)}
                  format="percent"
                  min={0.20}
                  max={0.80}
                  step={0.05}
                />
              </div>
              <Slider
                value={[(formData.utilitiesVariableSplit ?? global.utilitiesVariableSplit ?? 0.60) * 100]}
                onValueChange={([v]) => handleUpdate("utilitiesVariableSplit", v / 100)}
                min={20}
                max={80}
                step={5}
              />
              <p className="text-xs text-gray-600 mt-2">
                Variable utilities scale with revenue, fixed utilities remain constant regardless of occupancy
              </p>
            </div>
          </div>
        </div></div>

        <div className="relative overflow-hidden rounded-2xl p-6 bg-white/80 backdrop-blur-xl border border-[#9FBCA4]/20 shadow-[0_8px_32px_rgba(159,188,164,0.15)]">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#9FBCA4]/10 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-[#9FBCA4]/5 blur-xl" />
          <div className="relative">
          <div className="space-y-6">
            <h3 className="text-lg font-display text-gray-900 flex items-center gap-2">
              Catering F&B Boost Factors
              <HelpTooltip text="How much catering at events boosts F&B revenue. Full catering adds more revenue than partial." />
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center text-gray-700 label-text">
                  Full Catering F&B Boost
                  <HelpTooltip text="Additional F&B revenue multiplier when events use full in-house catering" />
                </Label>
                <EditableValue
                  value={formData.fullCateringFBBoost ?? global.fullCateringFBBoost ?? 0.50}
                  onChange={(v) => handleUpdate("fullCateringFBBoost", v)}
                  format="percent"
                  min={0}
                  max={1.00}
                  step={0.05}
                />
              </div>
              <Slider
                value={[(formData.fullCateringFBBoost ?? global.fullCateringFBBoost ?? 0.50) * 100]}
                onValueChange={([v]) => handleUpdate("fullCateringFBBoost", v / 100)}
                min={0}
                max={100}
                step={5}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center text-gray-700 label-text">
                  Partial Catering F&B Boost
                  <HelpTooltip text="Additional F&B revenue multiplier when events use partial in-house catering" />
                </Label>
                <EditableValue
                  value={formData.partialCateringFBBoost ?? global.partialCateringFBBoost ?? 0.25}
                  onChange={(v) => handleUpdate("partialCateringFBBoost", v)}
                  format="percent"
                  min={0}
                  max={0.75}
                  step={0.05}
                />
              </div>
              <Slider
                value={[(formData.partialCateringFBBoost ?? global.partialCateringFBBoost ?? 0.25) * 100]}
                onValueChange={([v]) => handleUpdate("partialCateringFBBoost", v / 100)}
                min={0}
                max={75}
                step={5}
              />
            </div>

            <p className="text-xs text-gray-600 mt-2">
              F&B revenue formula: Base F&B × (1 + Full Boost × Full Catering % + Partial Boost × Partial Catering %)
            </p>
          </div>
        </div></div>

        <div className="relative overflow-hidden rounded-2xl p-6 bg-white/80 backdrop-blur-xl border border-[#9FBCA4]/20 shadow-[0_8px_32px_rgba(159,188,164,0.15)]">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#9FBCA4]/10 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-[#9FBCA4]/5 blur-xl" />
          <div className="relative">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-display text-gray-900 flex items-center gap-2">
                Partner Compensation Schedule
                <HelpTooltip text="Annual total partner compensation and partner count for each year. Individual partner compensation = Total ÷ Partner Count." />
              </h3>
              <p className="text-gray-600 text-sm label-text">Configure total partner compensation and headcount by year</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#9FBCA4]/20">
                    <th className="text-left py-2 px-2 font-display text-gray-900">Year</th>
                    <th className="text-right py-2 px-2 font-display text-gray-900">Total Partner Comp</th>
                    <th className="text-center py-2 px-2 font-display text-gray-900">Partner Count</th>
                    <th className="text-right py-2 px-2 font-display text-gray-600">Per Partner</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((year) => {
                    const compKey = `partnerCompYear${year}` as keyof GlobalResponse;
                    const countKey = `partnerCountYear${year}` as keyof GlobalResponse;
                    const compValue = (formData[compKey] ?? global[compKey] ?? 540000) as number;
                    const countValue = (formData[countKey] ?? global[countKey] ?? 3) as number;
                    const perPartner = countValue > 0 ? compValue / countValue : 0;
                    
                    return (
                      <tr key={year} className="border-b border-[#9FBCA4]/20 last:border-0">
                        <td className="py-2 px-2 font-medium text-gray-900">Year {year} (<span className="font-mono">{modelStartYear + year - 1}</span>)</td>
                        <td className="py-2 px-2 text-right">
                          <EditableValue
                            value={compValue}
                            onChange={(v) => handleUpdate(compKey, v)}
                            format="dollar"
                            min={0}
                            max={2000000}
                            step={10000}
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <select
                            value={countValue}
                            onChange={(e) => handleUpdate(countKey, parseInt(e.target.value) as any)}
                            className="w-16 text-center border rounded px-2 py-1 bg-white border-[#9FBCA4]/30 text-gray-900 font-mono"
                            data-testid={`select-partner-count-year${year}`}
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                              <option key={n} value={n} className="bg-[#2d4a5e] text-gray-900">{n}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-2 text-right text-gray-600 font-mono">
                          {formatMoney(perPartner)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-600 mt-4">
              Total Partner Comp is the annual budget (12 months). Actual spending is automatically prorated for years with fewer operating months (e.g., if operations start mid-year). Per Partner = Total ÷ Count.
            </p>
          </div>
        </div></div>

        <div className="relative overflow-hidden rounded-2xl p-6 bg-white/80 backdrop-blur-xl border border-[#9FBCA4]/20 shadow-[0_8px_32px_rgba(159,188,164,0.15)]">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#9FBCA4]/10 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-[#9FBCA4]/5 blur-xl" />
          <div className="relative">
          <p className="text-sm text-gray-600 text-center label-text">
            Fixed overhead escalates at <span className="font-mono">{formatPercent(formData.fixedCostEscalationRate ?? global.fixedCostEscalationRate)}</span>/year. Staff scales: <span className="font-mono">2.5</span> FTE (1-3 properties), <span className="font-mono">4.5</span> (4-6), <span className="font-mono">7.0</span> (7-10).
            All costs begin at Operations Start Date and are prorated for partial years.
          </p>
        </div></div>

        <div className="flex justify-end pb-8">
          <SaveButton 
            onClick={handleSave} 
            isPending={updateMutation.isPending}
          />
        </div>
      </div>
    </Layout>
  );
}
