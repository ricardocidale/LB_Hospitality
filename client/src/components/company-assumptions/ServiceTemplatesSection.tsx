import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Loader2, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import {
  IconPlus, IconSave, IconInfo, IconPercent, IconDollarSign, IconArrowRightLeft,
  IconBookOpen, IconPencil, IconTrash, IconPackage, IconTrending,
} from "@/components/icons";
import {
  useServiceTemplates,
  useCreateServiceTemplate,
  useUpdateServiceTemplate,
  useDeleteServiceTemplate,
  useSyncServiceTemplates,
} from "@/lib/api/services";
import { useGlobalAssumptions, useUpdateGlobalAssumptions } from "@/lib/api";
import type { ServiceTemplate } from "@shared/schema";
import { computeServiceFee } from "@calc/research/service-fee";
import { computeMarkupWaterfall } from "@calc/research/markup-waterfall";

const SERVICE_HELP: Record<string, string> = {
  "Marketing":
    "Brand strategy, digital marketing campaigns, social media management, content creation, OTA channel management (Booking.com, Expedia), SEO/SEM, reputation monitoring, loyalty program management, and public relations. Per USALI 12th Edition Schedule 16 (Annual Mandatory Brand and Operator Costs), centralized marketing leverages group purchasing power for ad spend and brand-wide campaigns. Charged as a percentage of Total Revenue.",
  "Technology & Reservations":
    "Property Management System (PMS), booking engine, Wi-Fi infrastructure, cybersecurity, help desk support, system integrations (POS, key systems, kiosk/mobile check-in), cloud services, Central Reservation System (CRS), call center operations, group booking coordination, and channel distribution strategy. Per USALI 12th Edition, technology costs are recognized as a distinct undistributed expense category. Centralizing technology and reservations provides economies of scale and consistent standards across properties. Charged as a percentage of Total Revenue.",
  "Accounting":
    "Financial reporting per USALI 12th Edition standards, general ledger maintenance, accounts payable/receivable, bank reconciliations, audit preparation, tax filing support, budgeting assistance, internal controls, and owner reporting packages. Includes compliance with current hospitality accounting standards and regulatory requirements. Charged as a percentage of Total Revenue.",
  "Revenue Management":
    "Dynamic pricing strategy, rate and yield management, demand forecasting, competitive set analysis (STR benchmarking), revenue management analytics, total revenue management (TRevPAR optimization), and distribution channel optimization. Per USALI 12th Edition, revenue management is recognized as a critical discipline for maximizing property performance. Charged as a percentage of Total Revenue.",
  "General Management":
    "Executive oversight, strategic planning, human resources (recruitment, training, compliance), quality assurance inspections, brand standards enforcement, and operational consulting. Per USALI 12th Edition Schedule 16, this encompasses the operator's core management oversight function. This is typically a 'direct' service where the management company earns an oversight fee. Charged as a percentage of Total Revenue.",
  "Procurement":
    "Centralized purchasing, vendor negotiation, supply chain management, group purchasing organization (GPO) coordination, contract management, and cost optimization across the portfolio. Per USALI 12th Edition, procurement activities are tracked under Administrative & General or as a separate operator cost. Leverages group purchasing power for better pricing on FF&E, OS&E, and operating supplies. Charged as a percentage of Total Revenue.",
};

interface FormState {
  name: string;
  defaultRate: string;
  serviceModel: "centralized" | "direct";
  serviceMarkup: string;
  isActive: boolean;
  sortOrder: string;
}

const emptyForm: FormState = {
  name: "",
  defaultRate: "2",
  serviceModel: "centralized",
  serviceMarkup: "20",
  isActive: true,
  sortOrder: "0",
};

function formFromTemplate(t: ServiceTemplate): FormState {
  return {
    name: t.name,
    defaultRate: ((t.defaultRate ?? 0) * 100).toFixed(1),
    serviceModel: t.serviceModel as "centralized" | "direct",
    serviceMarkup: ((t.serviceMarkup ?? 0) * 100).toFixed(0),
    isActive: t.isActive,
    sortOrder: String(t.sortOrder),
  };
}

function ServiceResearchPanel({ template }: { template: ServiceTemplate }) {
  const sampleRevenue = 1_500_000;
  const feeBench = computeServiceFee({ propertyRevenue: sampleRevenue, serviceType: template.name });
  const currentRate = template.defaultRate ?? 0;
  const currentFee = sampleRevenue * currentRate;
  const markup = template.serviceMarkup ?? 0;
  const waterfall = template.serviceModel === "centralized"
    ? computeMarkupWaterfall({ vendorCost: currentFee / (1 + markup), markupPct: markup, serviceType: template.name })
    : null;

  return (
    <div className="mt-3 pt-3 border-t border-border/60 space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <IconBookOpen className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-foreground uppercase tracking-wider">Industry Benchmarks</span>
        <span className="text-[10px] text-muted-foreground ml-auto">at $1.5M sample revenue</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-blue-50/50 border border-blue-200/60 rounded-lg p-2.5">
          <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Fee Range</div>
          <div className="text-sm font-semibold font-mono text-foreground mt-1">
            {(feeBench.lowRate * 100).toFixed(1)}%–{(feeBench.highRate * 100).toFixed(1)}%
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            ${feeBench.lowFee.toLocaleString()}–${feeBench.highFee.toLocaleString()}
          </div>
        </div>

        <div className={`rounded-lg p-2.5 border ${
          currentRate >= feeBench.lowRate && currentRate <= feeBench.highRate
            ? "bg-emerald-50/50 border-emerald-200/60"
            : currentRate < feeBench.lowRate
            ? "bg-amber-50/50 border-amber-200/60"
            : "bg-blue-50/50 border-blue-200/60"
        }`}>
          <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Your Rate</div>
          <div className="text-sm font-semibold font-mono text-foreground mt-1">{(currentRate * 100).toFixed(1)}%</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {currentRate >= feeBench.lowRate && currentRate <= feeBench.highRate
              ? "Within range"
              : currentRate < feeBench.lowRate ? "Below market" : "Above market"}
          </div>
        </div>

        {waterfall && (
          <>
            <div className="bg-muted/50 border border-border/60 rounded-lg p-2.5">
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Vendor Cost</div>
              <div className="text-sm font-semibold font-mono text-foreground mt-1">${Math.round(waterfall.vendorCost).toLocaleString()}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                at {(markup * 100).toFixed(0)}% markup
              </div>
            </div>
            <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-lg p-2.5">
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Gross Profit</div>
              <div className="text-sm font-semibold font-mono text-emerald-700 mt-1">${Math.round(waterfall.grossProfit).toLocaleString()}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {(waterfall.effectiveMargin * 100).toFixed(1)}% effective margin
              </div>
            </div>
          </>
        )}

        {!waterfall && (
          <div className="bg-muted/50 border border-border/60 rounded-lg p-2.5 col-span-2">
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Direct Service</div>
            <div className="text-sm font-mono text-foreground mt-1">Full fee = revenue</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">No vendor cost (oversight only)</div>
          </div>
        )}
      </div>

      {waterfall?.industryMarkupRange && (
        <div className="text-xs text-muted-foreground bg-card rounded-lg p-2 border border-border">
          Industry markup for {template.name.toLowerCase()}: {(waterfall.industryMarkupRange.low * 100).toFixed(0)}%–{(waterfall.industryMarkupRange.high * 100).toFixed(0)}%
          (mid: {(waterfall.industryMarkupRange.mid * 100).toFixed(0)}%).
          {markup < waterfall.industryMarkupRange.low
            ? " Your markup is below typical range."
            : markup > waterfall.industryMarkupRange.high
            ? " Your markup is above typical range."
            : " Your markup is within range."}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground">{feeBench.notes}</p>
    </div>
  );
}

export default function ServiceTemplatesSection() {
  const { toast } = useToast();

  const { data: templates, isLoading: templatesLoading } = useServiceTemplates();
  const createMutation = useCreateServiceTemplate();
  const updateMutation = useUpdateServiceTemplate();
  const deleteMutation = useDeleteServiceTemplate();
  const syncMutation = useSyncServiceTemplates();

  const { data: globalAssumptions } = useGlobalAssumptions();
  const updateGlobalMutation = useUpdateGlobalAssumptions();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [expandedResearch, setExpandedResearch] = useState<Set<number>>(new Set());
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<number>>(new Set());
  const [inlineEditingRate, setInlineEditingRate] = useState<number | null>(null);
  const [inlineEditingMarkup, setInlineEditingMarkup] = useState<number | null>(null);
  const [inlineRateValue, setInlineRateValue] = useState("");
  const [inlineMarkupValue, setInlineMarkupValue] = useState("");

  const [incentivePct, setIncentivePct] = useState<string>("");
  const [incentiveDirty, setIncentiveDirty] = useState(false);

  const currentIncentive = globalAssumptions?.incentiveManagementFee ?? 0;
  const displayIncentive = incentiveDirty ? incentivePct : (currentIncentive * 100).toFixed(1);

  const toggleResearch = (id: number) => {
    setExpandedResearch(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleDescription = (id: number) => {
    setExpandedDescriptions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const startInlineRateEdit = (t: ServiceTemplate) => {
    setInlineEditingRate(t.id);
    setInlineRateValue(((t.defaultRate ?? 0) * 100).toFixed(1));
  };

  const startInlineMarkupEdit = (t: ServiceTemplate) => {
    setInlineEditingMarkup(t.id);
    setInlineMarkupValue(((t.serviceMarkup ?? 0) * 100).toFixed(0));
  };

  const saveInlineRate = (id: number) => {
    const rate = parseFloat(inlineRateValue) / 100;
    if (isNaN(rate) || rate < 0 || rate > 1) {
      toast({ title: "Rate must be between 0% and 100%", variant: "destructive" });
      return;
    }
    updateMutation.mutate(
      { id, data: { defaultRate: rate } },
      {
        onSuccess: () => {
          toast({ title: "Fee rate updated" });
          setInlineEditingRate(null);
        },
        onError: (e: Error) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
      }
    );
  };

  const saveInlineMarkup = (id: number) => {
    const markup = parseFloat(inlineMarkupValue) / 100;
    if (isNaN(markup) || markup < 0 || markup > 1) {
      toast({ title: "Markup must be between 0% and 100%", variant: "destructive" });
      return;
    }
    updateMutation.mutate(
      { id, data: { serviceMarkup: markup } },
      {
        onSuccess: () => {
          toast({ title: "Markup updated" });
          setInlineEditingMarkup(null);
        },
        onError: (e: Error) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
      }
    );
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, sortOrder: String((templates?.length ?? 0) + 1) });
    setDialogOpen(true);
  };

  const openEdit = (t: ServiceTemplate) => {
    setEditingId(t.id);
    setForm(formFromTemplate(t));
    setDialogOpen(true);
  };

  const handleSaveTemplate = () => {
    const rate = parseFloat(form.defaultRate) / 100;
    const markup = parseFloat(form.serviceMarkup) / 100;
    if (!form.name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    if (isNaN(rate) || rate < 0 || rate > 1) {
      toast({ title: "Rate must be between 0% and 100%", variant: "destructive" });
      return;
    }
    if (isNaN(markup) || markup < 0 || markup > 1) {
      toast({ title: "Markup must be between 0% and 100%", variant: "destructive" });
      return;
    }

    const payload = {
      name: form.name.trim(),
      defaultRate: rate,
      serviceModel: form.serviceModel,
      serviceMarkup: markup,
      isActive: form.isActive,
      sortOrder: parseInt(form.sortOrder) || 0,
    };

    if (editingId) {
      updateMutation.mutate(
        { id: editingId, data: payload },
        {
          onSuccess: () => {
            toast({ title: "Service template saved" });
            setDialogOpen(false);
          },
          onError: (e: Error) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast({ title: "Service template created" });
          setDialogOpen(false);
        },
        onError: (e: Error) => toast({ title: "Create failed", description: e.message, variant: "destructive" }),
      });
    }
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast({ title: "Service template deleted" });
        setDeleteConfirmId(null);
      },
      onError: (e: Error) => toast({ title: "Delete failed", description: e.message, variant: "destructive" }),
    });
  };

  const handleSync = () => {
    syncMutation.mutate(undefined, {
      onSuccess: (data: any) => {
        toast({ title: "Sync complete", description: data.message });
      },
      onError: (e: Error) => toast({ title: "Sync failed", description: e.message, variant: "destructive" }),
    });
  };

  const handleToggleActive = (t: ServiceTemplate) => {
    updateMutation.mutate(
      { id: t.id, data: { isActive: !t.isActive } },
      {
        onSuccess: () => toast({ title: `${t.name} ${t.isActive ? "deactivated" : "activated"}` }),
        onError: (e: Error) => toast({ title: "Toggle failed", description: e.message, variant: "destructive" }),
      }
    );
  };

  const handleSaveIncentive = () => {
    const pct = parseFloat(incentivePct);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      toast({ title: "Incentive fee must be between 0% and 100%", variant: "destructive" });
      return;
    }
    updateGlobalMutation.mutate(
      { incentiveManagementFee: pct / 100 },
      {
        onSuccess: () => {
          setIncentiveDirty(false);
          toast({ title: "Saved", description: "Incentive management fee saved." });
        },
      }
    );
  };

  const sorted = [...(templates ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const activeTemplates = sorted.filter(t => t.isActive);
  const totalServiceRate = activeTemplates.reduce((sum, t) => sum + (t.defaultRate ?? 0), 0);
  const centralizedCount = activeTemplates.filter(t => t.serviceModel === "centralized").length;
  const directCount = activeTemplates.filter(t => t.serviceModel === "direct").length;

  if (templatesLoading) {
    return (
      <div className="relative overflow-hidden rounded-lg p-6 bg-card border border-border shadow-sm">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-lg p-6 bg-card border border-border shadow-sm space-y-6">
      <div>
        <h3 className="text-lg font-display text-foreground flex items-center gap-2">
          Revenue Model — Service Categories & Fees
          <InfoTooltip text="Define the service categories and fee structure that drive management company revenue. Service categories are charged as a % of each property's Total Revenue. The Incentive Fee is a performance bonus on GOP. Values set here are defaults — each property can override them." manualSection="company-formulas" />
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Configure the services provided to properties and the fee structure for each.
        </p>
      </div>

      <Alert className="bg-primary/5 border-primary/20">
        <IconInfo className="h-4 w-4 text-primary" />
        <AlertTitle className="text-primary font-semibold">How Revenue Streams Work</AlertTitle>
        <AlertDescription className="text-primary/80 space-y-2">
          <p>
            The management company earns revenue through two types of fees charged to each property:
          </p>
          <p>
            <strong>Service Fees</strong> (Base Management Fee) — a set of named service categories, each charged as a percentage of the property's Total Revenue.
            The sum of all active service categories equals the total Base Management Fee.
          </p>
          <p>
            <strong>Incentive Fee</strong> — a performance bonus charged as a percentage of Gross Operating Profit (GOP), only collected when GOP is positive.
          </p>
          <p className="text-xs italic">
            Together, these fees are deducted from GOP in the USALI waterfall: Revenue → GOP → Mgmt Fees → IBFC → Fixed Charges → NOI → FF&E → ANOI.
            Values set here are defaults — each property can override them individually.
          </p>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-muted border border-border/60 shadow-sm">
          <CardContent className="p-4">
            <div className="text-2xl font-display font-bold text-foreground">{activeTemplates.length}</div>
            <div className="text-xs text-muted-foreground mt-1">Active Services</div>
          </CardContent>
        </Card>
        <Card className="bg-muted border border-border/60 shadow-sm">
          <CardContent className="p-4">
            <div className="text-2xl font-display font-bold text-primary">{(totalServiceRate * 100).toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground mt-1">Total Base Fee (of Revenue)</div>
          </CardContent>
        </Card>
        <Card className="bg-muted border border-border/60 shadow-sm">
          <CardContent className="p-4">
            <div className="text-2xl font-display font-bold text-foreground">{centralizedCount}</div>
            <div className="text-xs text-muted-foreground mt-1">Centralized (pass-through)</div>
          </CardContent>
        </Card>
        <Card className="bg-muted border border-border/60 shadow-sm">
          <CardContent className="p-4">
            <div className="text-2xl font-display font-bold text-foreground">{directCount}</div>
            <div className="text-xs text-muted-foreground mt-1">Direct (oversight only)</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border border-border/80 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <IconPackage className="w-4 h-4 text-muted-foreground" />
                Service Categories
                <InfoTooltip text="Each category represents a specific service the management company provides to properties. The fee for each category is charged as a percentage of the property's Total Revenue. Together, all active categories sum to the Base Management Fee. Properties inherit these defaults but can customize rates individually." />
              </CardTitle>
              <CardDescription className="label-text">
                Toggle services ON/OFF to include or exclude them globally for all properties.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleSync} disabled={syncMutation.isPending} data-testid="button-sync-templates">
                    {syncMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <IconArrowRightLeft className="w-4 h-4 mr-1" />}
                    Sync to Properties
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="max-w-xs text-xs">Propagate new service categories to all existing properties. Does not overwrite existing property-level categories or rates.</p>
                </TooltipContent>
              </Tooltip>
              <Button size="sm" onClick={openCreate} data-testid="button-add-service">
                <IconPlus className="w-4 h-4 mr-1" />
                Add Service
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sorted.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <IconPackage className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium">No service templates configured</p>
              <p className="text-sm mt-1">Add service categories to define what the management company provides to properties.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {sorted.map((t) => {
                const helpText = SERVICE_HELP[t.name];
                const isDescExpanded = expandedDescriptions.has(t.id);
                const descTruncateLength = 120;
                const needsTruncation = helpText && helpText.length > descTruncateLength;
                const isResearchExpanded = expandedResearch.has(t.id);
                const isEditingRate = inlineEditingRate === t.id;
                const isEditingMarkup = inlineEditingMarkup === t.id;

                return (
                  <div
                    key={t.id}
                    className={`rounded-xl border border-border/80 overflow-hidden transition-opacity ${!t.isActive ? "opacity-50" : ""}`}
                    data-testid={`service-template-${t.id}`}
                  >
                    <div className="p-4 pb-3 bg-muted/50">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-card border border-border/60 shrink-0">
                            <IconPackage className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-foreground text-base">{t.name}</span>
                              <Badge
                                variant={t.serviceModel === "centralized" ? "default" : "secondary"}
                                className="text-[10px] px-1.5 py-0"
                              >
                                {t.serviceModel === "centralized" ? "Centralized" : "Direct"}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {t.serviceModel === "centralized"
                                ? "Pass-through with markup"
                                : "Oversight only — full fee as revenue"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Switch
                            checked={t.isActive}
                            onCheckedChange={() => handleToggleActive(t)}
                            disabled={updateMutation.isPending}
                            data-testid={`toggle-service-${t.id}`}
                          />
                        </div>
                      </div>
                    </div>

                    {helpText && (
                      <div className="px-4 pt-3 pb-2">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {needsTruncation && !isDescExpanded
                            ? helpText.slice(0, descTruncateLength) + "..."
                            : helpText}
                          {needsTruncation && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="ml-1 text-primary hover:text-primary/80 font-medium inline h-auto px-0 py-0"
                              onClick={() => toggleDescription(t.id)}
                              data-testid={`button-toggle-desc-${t.id}`}
                            >
                              {isDescExpanded ? "show less" : "show more"}
                            </Button>
                          )}
                        </p>
                      </div>
                    )}

                    <div className="px-4 py-3">
                      <div className={`grid gap-3 ${t.serviceModel === "centralized" ? "grid-cols-2" : "grid-cols-1"}`}>
                        <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40 rounded-lg p-3">
                          <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Fee Rate</div>
                          {isEditingRate ? (
                            <div className="flex items-center gap-1.5">
                              <div className="relative flex-1">
                                <Input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="100"
                                  value={inlineRateValue}
                                  onChange={(e) => setInlineRateValue(e.target.value)}
                                  className="h-8 text-sm font-mono pr-6"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") saveInlineRate(t.id);
                                    if (e.key === "Escape") setInlineEditingRate(null);
                                  }}
                                  data-testid={`input-inline-rate-${t.id}`}
                                />
                                <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-muted-foreground text-xs">%</div>
                              </div>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => saveInlineRate(t.id)} disabled={updateMutation.isPending} data-testid={`button-save-inline-rate-${t.id}`}>
                                <Check className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => setInlineEditingRate(null)} data-testid={`button-cancel-inline-rate-${t.id}`}>
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              variant="ghost"
                              className="flex items-center gap-1.5 group/rate cursor-pointer h-auto px-1 py-0.5"
                              onClick={() => startInlineRateEdit(t)}
                              data-testid={`button-edit-inline-rate-${t.id}`}
                            >
                              <span className="text-lg font-bold font-mono text-foreground">{((t.defaultRate ?? 0) * 100).toFixed(1)}%</span>
                              <span className="text-xs text-muted-foreground">of Revenue</span>
                              <IconPencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover/rate:opacity-100 transition-opacity" />
                            </Button>
                          )}
                        </div>

                        {t.serviceModel === "centralized" && (
                          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-lg p-3">
                            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
                              Cost-Plus Markup
                              <InfoTooltip text={`Centralized model: The management company procures this service from vendors and passes the cost through with a ${((t.serviceMarkup ?? 0) * 100).toFixed(0)}% markup. Effective margin: ${(((t.serviceMarkup ?? 0) / (1 + (t.serviceMarkup ?? 0))) * 100).toFixed(1)}% of fee revenue.`} />
                            </div>
                            {isEditingMarkup ? (
                              <div className="flex items-center gap-1.5">
                                <div className="relative flex-1">
                                  <Input
                                    type="number"
                                    step="1"
                                    min="0"
                                    max="100"
                                    value={inlineMarkupValue}
                                    onChange={(e) => setInlineMarkupValue(e.target.value)}
                                    className="h-8 text-sm font-mono pr-6"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") saveInlineMarkup(t.id);
                                      if (e.key === "Escape") setInlineEditingMarkup(null);
                                    }}
                                    data-testid={`input-inline-markup-${t.id}`}
                                  />
                                  <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-muted-foreground text-xs">%</div>
                                </div>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => saveInlineMarkup(t.id)} disabled={updateMutation.isPending} data-testid={`button-save-inline-markup-${t.id}`}>
                                  <Check className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => setInlineEditingMarkup(null)} data-testid={`button-cancel-inline-markup-${t.id}`}>
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                type="button"
                                variant="ghost"
                                className="flex items-center gap-1.5 group/markup cursor-pointer h-auto px-1 py-0.5"
                                onClick={() => startInlineMarkupEdit(t)}
                                data-testid={`button-edit-inline-markup-${t.id}`}
                              >
                                <span className="text-lg font-bold font-mono text-foreground">{((t.serviceMarkup ?? 0) * 100).toFixed(0)}%</span>
                                <span className="text-xs text-muted-foreground">markup</span>
                                <IconPencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover/markup:opacity-100 transition-opacity" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="px-4 pb-3 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => openEdit(t)} data-testid={`button-edit-service-${t.id}`}>
                              <IconPencil className="w-3.5 h-3.5" />
                              Edit
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom"><p className="text-xs">Edit all service settings</p></TooltipContent>
                        </Tooltip>
                        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => setDeleteConfirmId(t.id)} data-testid={`button-delete-service-${t.id}`}>
                          <IconTrash className="w-3.5 h-3.5 text-destructive" />
                          Delete
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs gap-1.5 text-muted-foreground"
                        onClick={() => toggleResearch(t.id)}
                        data-testid={`button-research-service-${t.id}`}
                      >
                        <IconBookOpen className="w-3.5 h-3.5" />
                        Benchmarks
                        {isResearchExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </Button>
                    </div>

                    {isResearchExpanded && (
                      <div className="px-4 pb-4">
                        <ServiceResearchPanel template={t} />
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="flex items-center justify-between px-4 py-3 bg-primary/5 border border-primary/20 rounded-xl lg:col-span-2">
                <div className="flex items-center gap-2">
                  <IconTrending className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">Total Base Management Fee</span>
                  <InfoTooltip text="The sum of all active service category rates. This is the effective Base Management Fee charged to each property as a percentage of their Total Revenue. It is deducted from GOP to calculate Income Before Fixed Charges (IBFC) in the USALI waterfall." />
                </div>
                <span className="text-lg font-display font-bold text-primary font-mono">{(totalServiceRate * 100).toFixed(1)}%</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <IconDollarSign className="w-4 h-4 text-muted-foreground" />
            Incentive Management Fee
            <InfoTooltip text="A performance-based fee calculated as a percentage of Gross Operating Profit (GOP). Only collected when GOP is positive — if a property has a negative GOP, no incentive fee is charged. This incentivizes the management company to maximize property profitability. Combined with the Base Management Fee (service categories above), these two fee types are deducted from GOP to arrive at Income Before Fixed Charges (IBFC) per the USALI standard." />
          </CardTitle>
          <CardDescription className="label-text">
            Performance bonus as a percentage of each property's Gross Operating Profit (GOP).
            Only charged when GOP is positive.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4 max-w-md">
            <div className="space-y-2 flex-1">
              <Label className="label-text text-foreground flex items-center gap-2">
                <IconPercent className="w-3 h-3" /> Default Incentive Fee
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={displayIncentive}
                  onChange={(e) => {
                    setIncentivePct(e.target.value);
                    setIncentiveDirty(true);
                  }}
                  placeholder="12"
                  className="bg-card pr-8"
                  data-testid="input-incentive-management-fee"
                />
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-muted-foreground text-sm">
                  %
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground italic">e.g. 12 for 12% of GOP. Industry range: 10–20%.</p>
            </div>
            <Button
              onClick={handleSaveIncentive}
              disabled={!incentiveDirty || updateGlobalMutation.isPending}
              data-testid="button-save-incentive"
            >
              {updateGlobalMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <IconSave className="w-4 h-4 mr-1" />}
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">{editingId ? "Edit Service Category" : "Add Service Category"}</DialogTitle>
            <DialogDescription className="label-text">
              {editingId
                ? "Update the service category settings. Changes will apply as new defaults — existing property overrides are preserved."
                : "Create a new service category. Use 'Sync to Properties' to propagate it to all existing properties."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Service Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Marketing"
                data-testid="input-service-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1">
                  Service Model
                  <InfoTooltip text="Centralized: The management company procures this service from vendors and passes cost through with a markup. The property pays fee = vendor cost × (1 + markup%). Direct: The company provides oversight only — the entire fee is recognized as revenue with no vendor cost." />
                </Label>
                <Select value={form.serviceModel} onValueChange={(v) => setForm({ ...form, serviceModel: v as "centralized" | "direct" })}>
                  <SelectTrigger data-testid="select-service-model">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="centralized">Centralized (pass-through)</SelectItem>
                    <SelectItem value="direct">Direct (oversight only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1">
                  Default Fee Rate
                  <InfoTooltip text="The percentage of a property's Total Revenue charged for this service. e.g. 2.0 means 2.0% of Total Revenue. All active service rates sum to the Base Management Fee." />
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={form.defaultRate}
                    onChange={(e) => setForm({ ...form, defaultRate: e.target.value })}
                    className="pr-8"
                    data-testid="input-service-rate"
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-muted-foreground text-sm">%</div>
                </div>
              </div>
            </div>
            {form.serviceModel === "centralized" && (
              <div className="space-y-2 bg-muted rounded-lg p-3 border border-border/60">
                <Label className="text-sm font-medium flex items-center gap-1">
                  Cost-Plus Markup
                  <InfoTooltip text="When the company procures a service for a property, it charges cost × (1 + markup%). e.g. 20% markup means a $1,000 vendor invoice becomes $1,200 to the property. The $200 difference is the company's gross profit on this service." />
                </Label>
                <p className="text-xs text-muted-foreground">
                  If markup is 20% and the company procures a service for $1.00, the property is charged $1.20.
                </p>
                <div className="relative">
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={form.serviceMarkup}
                    onChange={(e) => setForm({ ...form, serviceMarkup: e.target.value })}
                    className="pr-8"
                    data-testid="input-service-markup"
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-muted-foreground text-sm">%</div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Sort Order</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                  data-testid="input-service-sort"
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                  data-testid="toggle-service-active"
                />
                <Label className="text-sm font-medium">Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveTemplate} disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-service">
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              <IconSave className="w-4 h-4 mr-1" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Delete Service Category</DialogTitle>
            <DialogDescription className="label-text">
              This will remove the service category from the company template. Existing property fee categories will not be affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete-service"
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
