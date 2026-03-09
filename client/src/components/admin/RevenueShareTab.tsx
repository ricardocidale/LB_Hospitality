/**
 * RevenueShareTab.tsx — Unified admin panel for all management company fees.
 *
 * Combines:
 *   1. Service Categories — the granular breakdown of the Base Management Fee
 *      (% of each property's Total Revenue). Admin can toggle ON/OFF, set
 *      default rates, and choose centralized vs direct service model.
 *   2. Incentive Management Fee — a performance fee (% of GOP).
 *
 * These two fee types together transform GOP → AGOP → NOI → ANOI in the
 * USALI waterfall. Values set here are defaults that each property inherits.
 * Properties can override rates individually.
 *
 * This tab does NOT modify the financial engine or schema —
 * it manages company_service_templates via existing API routes.
 */

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { HelpTooltip } from "@/components/ui/help-tooltip";

import { 
  IconArrowRightLeft, IconBookOpen, IconCoins, IconHelpCircle, 
  IconInfo, IconLoader, IconMessageSquare, IconPackage, IconPencil, 
  IconPlus, IconRefresh, IconSave, IconTrash, IconTrending, IconPercent
} from "@/components/icons/brand-icons";

import {
  useServiceTemplates,
  useCreateServiceTemplate,
  useUpdateServiceTemplate,
  useDeleteServiceTemplate,
  useSyncServiceTemplates,
} from "@/lib/api/services";
import { useGlobalAssumptions, useUpdateGlobalAssumptions } from "./hooks";
import type { ServiceTemplate } from "@shared/schema";
import { computeServiceFee } from "@calc/research/service-fee";
import { computeMarkupWaterfall } from "@calc/research/markup-waterfall";

const SERVICE_HELP: Record<string, string> = {
  "Marketing":
    "Brand strategy, digital marketing campaigns, social media management, content creation, OTA channel management (Booking.com, Expedia), SEO/SEM, reputation monitoring, and public relations. Centralized marketing leverages group purchasing power for ad spend. Charged as a percentage of Total Revenue.",
  "IT":
    "Property Management System (PMS), booking engine, Wi-Fi infrastructure, cybersecurity, help desk support, system integrations (POS, key systems), and cloud services. Centralizing IT provides economies of scale and consistent tech standards across properties. Charged as a percentage of Total Revenue.",
  "Accounting":
    "Financial reporting per USALI standards, general ledger maintenance, accounts payable/receivable, bank reconciliations, audit preparation, tax filing support, budgeting assistance, and owner reporting packages. Charged as a percentage of Total Revenue.",
  "Reservations":
    "Central Reservation System (CRS), call center operations, group booking coordination, rate and yield management, channel distribution strategy, and revenue management analytics. Charged as a percentage of Total Revenue.",
  "General Management":
    "Executive oversight, strategic planning, human resources (recruitment, training, compliance), quality assurance inspections, brand standards enforcement, and operational consulting. This is typically a 'direct' service where the management company earns an oversight fee. Charged as a percentage of Total Revenue.",
  "Insurance":
    "Property and liability insurance procurement through group policies, workers' compensation, claims management, risk assessment, and coverage optimization. Group purchasing power typically yields 15–25% savings vs individual policies. Charged as a percentage of Total Revenue.",
  "Property Operations":
    "Facilities management, preventive maintenance programs, energy management and sustainability, vendor procurement and negotiation, capital expenditure planning, and FF&E reserve monitoring. Charged as a percentage of Total Revenue.",
  "Other Services":
    "Additional specialized services such as legal coordination, procurement consulting, sustainability/ESG programs, mystery shopping, or custom advisory engagements tailored to property needs. Charged as a percentage of Total Revenue.",
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

export default function RevenueShareTab() {
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
      <div className="flex items-center justify-center py-12">
        <IconLoader className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <Alert className="bg-primary/5 border-primary/20">
        <IconInfo className="h-4 w-4 text-primary" />
        <AlertTitle className="text-primary font-semibold">How Revenue Share Works</AlertTitle>
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
            Together, these fees transform the USALI waterfall: Revenue → GOP → AGOP (after service fees & incentive fee) → NOI → ANOI.
            Values set here are defaults — each property can override them individually.
          </p>
        </AlertDescription>
      </Alert>

      {/* ─── Summary Stats ──────────────────────────────── */}
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

      {/* ─── Service Categories ─────────────────────────── */}
      <Card className="bg-card border border-border/80 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <IconPackage className="w-4 h-4 text-muted-foreground" />
                Service Categories
                <HelpTooltip text="Each category represents a specific service the management company provides to properties. The fee for each category is charged as a percentage of the property's Total Revenue. Together, all active categories sum to the Base Management Fee. Properties inherit these defaults but can customize rates individually." />
              </CardTitle>
              <CardDescription className="label-text">
                Toggle services ON/OFF to include or exclude them globally for all properties.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleSync} disabled={syncMutation.isPending} data-testid="button-sync-templates">
                    {syncMutation.isPending ? <IconLoader className="w-4 h-4 animate-spin mr-1" /> : <IconArrowRightLeft className="w-4 h-4 mr-1" />}
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
            <div className="space-y-3">
              {sorted.map((t, idx) => {
                const helpText = SERVICE_HELP[t.name];
                return (
                  <div
                    key={t.id}
                    className={`group border border-border rounded-xl p-4 transition-all duration-200 hover:shadow-md hover:border-border ${
                      idx % 2 === 1 ? "bg-muted/30" : "bg-muted"
                    } ${!t.isActive ? "opacity-50" : ""}`}
                    data-testid={`service-card-${t.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-card border border-border/60">
                          <IconPackage className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{t.name}</span>
                            <Badge
                              variant={t.serviceModel === "centralized" ? "default" : "secondary"}
                              className="text-[10px] px-1.5 py-0"
                            >
                              {t.serviceModel === "centralized" ? "Centralized" : "Direct"}
                            </Badge>
                            {helpText && (
                              <HelpTooltip text={helpText} />
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                            <span>Rate: <span className="font-mono font-semibold text-foreground">{((t.defaultRate ?? 0) * 100).toFixed(1)}%</span> of Revenue</span>
                            {t.serviceModel === "centralized" && (
                              <span>Markup: <span className="font-mono">{((t.serviceMarkup ?? 0) * 100).toFixed(0)}%</span></span>
                            )}
                            {t.serviceModel === "centralized" && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <IconHelpCircle className="w-3 h-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                  <p className="max-w-xs text-xs">
                                    <strong>Centralized model:</strong> The management company procures this service from external vendors and passes the cost through to properties with a {((t.serviceMarkup ?? 0) * 100).toFixed(0)}% markup.
                                    Effective margin: {(((t.serviceMarkup ?? 0) / (1 + (t.serviceMarkup ?? 0))) * 100).toFixed(1)}% of the fee revenue.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {t.serviceModel === "direct" && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <IconHelpCircle className="w-3 h-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                  <p className="max-w-xs text-xs">
                                    <strong>Direct model:</strong> The management company provides this service using its own internal resources and expertise.
                                    The entire fee represents revenue for the management company.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1.5"
                          onClick={() => toggleResearch(t.id)}
                          data-testid={`button-research-${t.id}`}
                        >
                          <IconBookOpen className="w-3.5 h-3.5" />
                          <span className="text-xs">{expandedResearch.has(t.id) ? "Hide Market Data" : "Market Benchmarks"}</span>
                        </Button>
                        <Switch
                          checked={t.isActive}
                          onCheckedChange={() => handleToggleActive(t)}
                          data-testid={`switch-active-${t.id}`}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => openEdit(t)}
                          data-testid={`button-edit-${t.id}`}
                        >
                          <IconPencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteConfirmId(t.id)}
                          data-testid={`button-delete-${t.id}`}
                        >
                          <IconTrash className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {expandedResearch.has(t.id) && (
                      <ServiceResearchPanel template={t} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Incentive Fee ────────────────────────────── */}
      <Card className="bg-card border border-border/80 shadow-sm overflow-hidden">
        <div className="bg-emerald-500/[0.03] border-b border-emerald-500/10 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <IconCoins className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                  Incentive Management Fee
                  <HelpTooltip text="Performance-based fee charged as a percentage of Gross Operating Profit (GOP). Unlike service fees which are based on revenue, the incentive fee rewards the management company for maximizing bottom-line efficiency. This fee is only collected when GOP is positive. It is deducted after the Base Management Fee to arrive at Adjusted GOP (AGOP)." />
                </CardTitle>
                <CardDescription className="label-text">
                  Variable performance bonus based on Gross Operating Profit.
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white border border-border rounded-lg px-3 py-1.5 shadow-sm">
                <IconPercent className="w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={displayIncentive}
                  onChange={(e) => { setIncentivePct(e.target.value); setIncentiveDirty(true); }}
                  className="w-12 text-sm font-mono font-bold focus:outline-none"
                  data-testid="input-incentive-fee"
                />
                <span className="text-xs font-bold text-muted-foreground border-l border-border pl-2">OF GOP</span>
              </div>
              <Button
                size="sm"
                onClick={handleSaveIncentive}
                disabled={!incentiveDirty || updateGlobalMutation.isPending}
                className="gap-1.5"
                data-testid="button-save-incentive"
              >
                {updateGlobalMutation.isPending ? <IconLoader className="w-3.5 h-3.5 animate-spin" /> : <IconSave className="w-3.5 h-3.5" />}
                Save
              </Button>
            </div>
          </div>
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <IconTrending className="w-3 h-3 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Performance Alignment</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Aligns management company interests with owners by focusing on profit maximization rather than just top-line volume.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <IconMessageSquare className="w-3 h-3 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Standard Calculation</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Calculated as: (GOP - Base Management Fee) × {displayIncentive}%. Industry standard typically ranges from 5% to 15%.</p>
                </div>
              </div>
            </div>
            <div className="bg-muted/40 border border-border/50 rounded-xl p-4 flex flex-col justify-center">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>Sample Adjusted GOP</span>
                <span>$250,000</span>
              </div>
              <div className="flex items-center justify-between font-mono text-sm font-bold text-foreground">
                <span>Estimated Incentive Fee</span>
                <span className="text-emerald-600">
                  ${(250_000 * (parseFloat(displayIncentive) || 0) / 100).toLocaleString()}
                </span>
              </div>
              <div className="mt-4 pt-4 border-t border-border/50">
                <p className="text-[10px] text-muted-foreground italic text-center">Incentive fees provide a powerful mechanism to drive operational efficiency across the portfolio.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Create/Edit Dialog ────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Service Category" : "Add Service Category"}</DialogTitle>
            <DialogDescription>
              Configure a service category and its default rate.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Service Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Marketing, IT, Accounting"
                data-testid="input-service-name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rate">Default Rate (%)</Label>
                <div className="relative">
                  <Input
                    id="rate"
                    type="number"
                    step="0.1"
                    value={form.defaultRate}
                    onChange={(e) => setForm({ ...form, defaultRate: e.target.value })}
                    className="pr-8 font-mono"
                    data-testid="input-service-rate"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">%</div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="order">Sort Order</Label>
                <Input
                  id="order"
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                  className="font-mono"
                  data-testid="input-service-order"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Service Model</Label>
              <Select
                value={form.serviceModel}
                onValueChange={(v: "centralized" | "direct") => setForm({ ...form, serviceModel: v })}
              >
                <SelectTrigger data-testid="select-service-model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="centralized">Centralized (with markup)</SelectItem>
                  <SelectItem value="direct">Direct (oversight only)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                {form.serviceModel === "centralized"
                  ? "Centralized services are pass-through vendor costs with an internal markup."
                  : "Direct services are provided internally by the management company with no external vendor cost."}
              </p>
            </div>

            {form.serviceModel === "centralized" && (
              <div className="space-y-2">
                <Label htmlFor="markup">Internal Markup (%)</Label>
                <div className="relative">
                  <Input
                    id="markup"
                    type="number"
                    value={form.serviceMarkup}
                    onChange={(e) => setForm({ ...form, serviceMarkup: e.target.value })}
                    className="pr-8 font-mono"
                    data-testid="input-service-markup"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">%</div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <Switch
                id="active"
                checked={form.isActive}
                onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                data-testid="switch-service-active"
              />
              <Label htmlFor="active" className="cursor-pointer">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel-service">
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate} disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-service">
              {(createMutation.isPending || updateMutation.isPending) && <IconLoader className="w-4 h-4 animate-spin mr-2" />}
              {editingId ? "Save Changes" : "Create Service"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation ──────────────────────── */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={(o) => !o && setDeleteConfirmId(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Service Category?</DialogTitle>
            <DialogDescription>
              This will permanently remove this service category template. Existing properties that use this service will not be affected, but new properties will not receive it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)} data-testid="button-cancel-delete">
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)} disabled={deleteMutation.isPending} data-testid="button-confirm-delete">
              {deleteMutation.isPending && <IconLoader className="w-4 h-4 animate-spin mr-2" />}
              Delete Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
