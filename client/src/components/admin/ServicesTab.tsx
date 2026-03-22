/**
 * ServicesTab.tsx — Centralized Services management for the admin panel.
 *
 * Manages the company_service_templates table which controls:
 *   - Which services the management company provides to properties
 *   - Whether each service is "centralized" (pass-through with markup) or "direct" (oversight only)
 *   - The cost-plus markup percentage for centralized services
 *   - Default fee rate for new properties
 *
 * Admin can add, edit, toggle active/inactive, reorder, and delete service categories.
 * A "Sync to Properties" button propagates new categories to all existing properties.
 */
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
import { Loader2, ChevronDown, ChevronUp } from "@/components/icons/themed-icons";
import { IconPlus, IconRefreshCw, IconSave, IconArrowRightLeft, IconBookOpen, IconPencil, IconTrash, IconPackage, IconProperties } from "@/components/icons";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import {
  useServiceTemplates,
  useCreateServiceTemplate,
  useUpdateServiceTemplate,
  useDeleteServiceTemplate,
  useSyncServiceTemplates,
} from "@/lib/api/services";
import type { ServiceTemplate } from "@shared/schema";
import { computeServiceFee } from "@calc/research/service-fee";
import { computeMarkupWaterfall } from "@calc/research/markup-waterfall";

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
  const sampleRevenue = 1_500_000; // Use a representative boutique property revenue
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
        <div className="bg-chart-1/10 border border-chart-1/20 rounded-lg p-2.5">
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
            ? "bg-primary/5 border-primary/20"
            : currentRate < feeBench.lowRate
            ? "bg-accent-pop/10 border-accent-pop/20"
            : "bg-chart-1/10 border-chart-1/20"
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
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-2.5">
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Gross Profit</div>
              <div className="text-sm font-semibold font-mono text-primary mt-1">${Math.round(waterfall.grossProfit).toLocaleString()}</div>
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

export default function ServicesTab() {
  const { toast } = useToast();
  const { data: templates, isLoading } = useServiceTemplates();
  const createMutation = useCreateServiceTemplate();
  const updateMutation = useUpdateServiceTemplate();
  const deleteMutation = useDeleteServiceTemplate();
  const syncMutation = useSyncServiceTemplates();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [expandedResearch, setExpandedResearch] = useState<Set<number>>(new Set());

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

  const handleSave = () => {
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

  const sorted = [...(templates ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const activeCount = sorted.filter(t => t.isActive).length;
  const centralizedCount = sorted.filter(t => t.isActive && t.serviceModel === "centralized").length;
  const directCount = sorted.filter(t => t.isActive && t.serviceModel === "direct").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="bg-muted border border-border/80 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <IconPackage className="w-4 h-4 text-muted-foreground" />
            Centralized Services Model
          </CardTitle>
          <CardDescription className="label-text">
            The management company provides centralized services to properties at cost plus a markup.
            Direct services earn an oversight fee with no vendor cost.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-card rounded-xl p-4 border border-border/60">
              <div className="text-2xl font-display font-bold text-foreground">{activeCount}</div>
              <div className="text-xs text-muted-foreground mt-1">Active Services</div>
            </div>
            <div className="bg-card rounded-xl p-4 border border-border/60">
              <div className="text-2xl font-display font-bold text-muted-foreground">{centralizedCount}</div>
              <div className="text-xs text-muted-foreground mt-1">Centralized (pass-through)</div>
            </div>
            <div className="bg-card rounded-xl p-4 border border-border/60">
              <div className="text-2xl font-display font-bold text-muted-foreground">{directCount}</div>
              <div className="text-xs text-muted-foreground mt-1">Direct (oversight only)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Templates List */}
      <Card className="bg-card border border-border/80 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <IconProperties className="w-4 h-4 text-muted-foreground" />
                Service Categories
              </CardTitle>
              <CardDescription className="label-text">
                Define which services the company provides and their pricing model.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleSync} disabled={syncMutation.isPending}>
                    {syncMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <IconArrowRightLeft className="w-4 h-4 mr-1" />}
                    Sync to Properties
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="max-w-xs text-xs">Propagate new service categories to all existing properties as fee categories. Does not overwrite existing categories.</p>
                </TooltipContent>
              </Tooltip>
              <Button size="sm" onClick={openCreate}>
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
              <p className="font-medium text-muted-foreground">No service templates configured</p>
              <p className="text-sm mt-1">Add service categories to define what the management company provides to properties.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sorted.map((t) => (
                <div
                  key={t.id}
                  className={`group bg-muted border border-border rounded-xl p-4 transition-all duration-200 hover:shadow-md hover:border-border ${
                    !t.isActive ? "opacity-50" : ""
                  }`}
                  data-testid={`service-card-${t.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        t.serviceModel === "centralized"
                          ? "bg-muted text-muted-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}>
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
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                          <span>Rate: <span className="font-mono">{((t.defaultRate ?? 0) * 100).toFixed(1)}%</span></span>
                          {t.serviceModel === "centralized" && (
                            <span>Markup: <span className="font-mono">{((t.serviceMarkup ?? 0) * 100).toFixed(0)}%</span></span>
                          )}
                          {t.serviceModel === "centralized" && (
                            <InfoTooltip text={`Effective margin: ${(((t.serviceMarkup ?? 0) / (1 + (t.serviceMarkup ?? 0))) * 100).toFixed(1)}% of revenue. Vendor cost = fee / (1 + ${((t.serviceMarkup ?? 0) * 100).toFixed(0)}%).`} side="right" />
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={t.isActive}
                        onCheckedChange={() => handleToggleActive(t)}
                        disabled={updateMutation.isPending}
                      />
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleResearch(t.id)} data-testid={`button-research-service-${t.id}`}>
                          <IconBookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)} data-testid={`button-edit-service-${t.id}`}>
                          <IconPencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteConfirmId(t.id)} data-testid={`button-delete-service-${t.id}`}>
                          <IconTrash className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  {expandedResearch.has(t.id) && (
                    <ServiceResearchPanel template={t} />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">{editingId ? "Edit Service Template" : "Add Service Template"}</DialogTitle>
            <DialogDescription className="label-text">
              {editingId
                ? "Update the service category settings."
                : "Create a new service category for the management company."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Service Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Marketing"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Service Model</Label>
                <Select value={form.serviceModel} onValueChange={(v) => setForm({ ...form, serviceModel: v as "centralized" | "direct" })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="centralized">Centralized (pass-through)</SelectItem>
                    <SelectItem value="direct">Direct (oversight only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Default Fee Rate (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={form.defaultRate}
                  onChange={(e) => setForm({ ...form, defaultRate: e.target.value })}
                />
              </div>
            </div>
            {form.serviceModel === "centralized" && (
              <div className="space-y-2 bg-muted rounded-lg p-3 border border-border/60">
                <Label className="text-sm font-medium">Cost-Plus Markup (%)</Label>
                <p className="text-xs text-muted-foreground">
                  If markup is 20% and the company procures a service for $1.00, the property is charged $1.20.
                </p>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={form.serviceMarkup}
                  onChange={(e) => setForm({ ...form, serviceMarkup: e.target.value })}
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Sort Order</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                />
                <Label className="text-sm font-medium">Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              <IconSave className="w-4 h-4 mr-1" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Delete Service Template</DialogTitle>
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
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              <IconTrash className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
