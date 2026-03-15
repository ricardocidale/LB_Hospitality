import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { IconDollarSign, IconPackage } from "@/components/icons";
import { Loader2 } from "lucide-react";
import { SettingsTabProps } from "./types";
import { useCompanyServiceTemplates, useUpdateCompanyServiceTemplate } from "@/lib/api/services";
import { useToast } from "@/hooks/use-toast";
import type { ServiceTemplate } from "@shared/schema";

function DefaultServiceFeeCategories() {
  const { toast } = useToast();
  const { data: templates, isLoading } = useCompanyServiceTemplates();
  const updateMutation = useUpdateCompanyServiceTemplate();
  const [editingField, setEditingField] = useState<{ id: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState("");

  const sorted = [...(templates ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

  const handleInlineEdit = (template: ServiceTemplate, field: string) => {
    let value = "";
    if (field === "defaultRate") value = ((template.defaultRate ?? 0) * 100).toFixed(1);
    else if (field === "serviceMarkup") value = ((template.serviceMarkup ?? 0) * 100).toFixed(0);
    setEditingField({ id: template.id, field });
    setEditValue(value);
  };

  const commitEdit = () => {
    if (!editingField) return;
    const { id, field } = editingField;
    let numValue = parseFloat(editValue);
    if (isNaN(numValue) || numValue < 0 || numValue > 100) {
      toast({ title: "Value must be between 0 and 100", variant: "destructive" });
      setEditingField(null);
      return;
    }
    const decimalValue = numValue / 100;
    updateMutation.mutate(
      { id, data: { [field]: decimalValue } },
      {
        onSuccess: () => setEditingField(null),
        onError: (e: Error) => {
          toast({ title: "Save failed", description: e.message, variant: "destructive" });
          setEditingField(null);
        },
      }
    );
  };

  const handleToggleActive = (template: ServiceTemplate) => {
    updateMutation.mutate(
      { id: template.id, data: { isActive: !template.isActive } },
      {
        onSuccess: () => toast({ title: `${template.name} ${template.isActive ? "deactivated" : "activated"}` }),
        onError: (e: Error) => toast({ title: "Toggle failed", description: e.message, variant: "destructive" }),
      }
    );
  };

  const handleModelChange = (template: ServiceTemplate, model: string) => {
    updateMutation.mutate(
      { id: template.id, data: { serviceModel: model as "centralized" | "direct" } },
      {
        onError: (e: Error) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
      }
    );
  };

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <IconPackage className="w-5 h-5 text-primary" />
          Default Service Fee Categories
          <InfoTooltip text="These are the default service categories and rates that will be applied to new properties when they are created. Changes here do not affect existing properties. Use Admin > Services for advanced operations like adding/deleting categories or syncing to existing properties." />
        </CardTitle>
        <CardDescription className="label-text">
          Suggested starting rates for new properties. When a property is created, it inherits these defaults which can then be adjusted per-property.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <IconPackage className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm">No service fee categories configured.</p>
            <p className="text-xs mt-1">Add categories via Admin &gt; Services.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr,80px,130px,80px,50px] gap-3 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <span>Category</span>
              <span>Rate</span>
              <span>Service Model</span>
              <span>Markup</span>
              <span>Active</span>
            </div>
            {sorted.map((t) => (
              <div
                key={t.id}
                className={`grid grid-cols-[1fr,80px,130px,80px,50px] gap-3 items-center px-3 py-2.5 rounded-lg border border-border/60 bg-muted/50 transition-opacity ${
                  !t.isActive ? "opacity-50" : ""
                }`}
                data-testid={`default-service-row-${t.id}`}
              >
                <span className="text-sm font-medium text-foreground truncate">{t.name}</span>

                {editingField?.id === t.id && editingField.field === "defaultRate" ? (
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditingField(null); }}
                    className="h-7 text-xs font-mono w-full"
                    autoFocus
                    data-testid={`input-default-rate-${t.id}`}
                  />
                ) : (
                  <button
                    onClick={() => handleInlineEdit(t, "defaultRate")}
                    className="text-sm font-mono text-primary hover:underline cursor-pointer text-left"
                    data-testid={`button-edit-default-rate-${t.id}`}
                  >
                    {((t.defaultRate ?? 0) * 100).toFixed(1)}%
                  </button>
                )}

                <Select
                  value={t.serviceModel}
                  onValueChange={(v) => handleModelChange(t, v)}
                >
                  <SelectTrigger className="h-7 text-xs" data-testid={`select-service-model-${t.id}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="centralized">Centralized</SelectItem>
                    <SelectItem value="direct">Direct</SelectItem>
                  </SelectContent>
                </Select>

                {t.serviceModel === "centralized" ? (
                  editingField?.id === t.id && editingField.field === "serviceMarkup" ? (
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditingField(null); }}
                      className="h-7 text-xs font-mono w-full"
                      autoFocus
                      data-testid={`input-default-markup-${t.id}`}
                    />
                  ) : (
                    <button
                      onClick={() => handleInlineEdit(t, "serviceMarkup")}
                      className="text-sm font-mono text-muted-foreground hover:underline cursor-pointer text-left"
                      data-testid={`button-edit-default-markup-${t.id}`}
                    >
                      {((t.serviceMarkup ?? 0) * 100).toFixed(0)}%
                    </button>
                  )
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}

                <Switch
                  checked={t.isActive}
                  onCheckedChange={() => handleToggleActive(t)}
                  disabled={updateMutation.isPending}
                  data-testid={`toggle-default-service-active-${t.id}`}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function CompanyTab({
  currentGlobal,
  handleGlobalChange,
}: SettingsTabProps) {
  return (
    <div className="space-y-6 mt-6">
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

      <DefaultServiceFeeCategories />
    </div>
  );
}
