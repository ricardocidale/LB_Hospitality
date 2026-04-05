import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Loader2 } from "@/components/icons/themed-icons";
import { IconRefreshCw, IconTrash, IconSettings } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ExternalIntegration {
  id: number;
  kind: string;
  serviceKey: string;
  name: string;
  sourceType: string;
  credentialEnvVar: string | null;
  host: string | null;
  isEnabled: boolean;
  isSubscribed: boolean;
  notes: string | null;
  sortOrder: number;
}

type FormData = {
  kind: string;
  serviceKey: string;
  name: string;
  sourceType: string;
  credentialEnvVar: string;
  host: string;
  isEnabled: boolean;
  isSubscribed: boolean;
  notes: string;
  sortOrder: number;
};

const EMPTY_FORM: FormData = {
  kind: "api",
  serviceKey: "",
  name: "",
  sourceType: "Direct API",
  credentialEnvVar: "",
  host: "",
  isEnabled: true,
  isSubscribed: true,
  notes: "",
  sortOrder: 0,
};

function sourceTypeBadgeColor(sourceType: string) {
  switch (sourceType) {
    case "RapidAPI": return "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30";
    case "Direct API": return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
    case "Apify Platform": return "bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30";
    default: return "bg-muted text-muted-foreground border-border";
  }
}

function IntegrationCard({
  integration,
  onToggle,
  onEdit,
  onDelete,
  isToggling,
}: {
  integration: ExternalIntegration;
  onToggle: (id: number, enabled: boolean) => void;
  onEdit: (i: ExternalIntegration) => void;
  onDelete: (i: ExternalIntegration) => void;
  isToggling: boolean;
}) {
  return (
    <Card
      data-testid={`card-integration-${integration.serviceKey}`}
      className={cn(
        "relative transition-all duration-200",
        !integration.isEnabled && "opacity-60"
      )}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div
              className={cn(
                "w-2.5 h-2.5 rounded-full shrink-0 mt-0.5",
                integration.isEnabled && integration.isSubscribed
                  ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]"
                  : integration.isEnabled && !integration.isSubscribed
                    ? "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]"
                    : "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]"
              )}
              data-testid={`status-dot-${integration.serviceKey}`}
            />
            <h4 className="text-sm font-medium truncate" data-testid={`text-name-${integration.serviceKey}`}>
              {integration.name}
            </h4>
          </div>
          <Switch
            checked={integration.isEnabled}
            onCheckedChange={(checked) => onToggle(integration.id, checked)}
            disabled={isToggling}
            data-testid={`switch-toggle-${integration.serviceKey}`}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", sourceTypeBadgeColor(integration.sourceType))}>
            {integration.sourceType}
          </Badge>
          {!integration.isSubscribed && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
              Not Subscribed
            </Badge>
          )}
        </div>

        {integration.host && (
          <p className="text-[11px] text-muted-foreground font-mono truncate" title={integration.host}>
            {integration.host}
          </p>
        )}

        {integration.notes && (
          <p className="text-xs text-muted-foreground line-clamp-2" title={integration.notes}>
            {integration.notes}
          </p>
        )}

        {integration.credentialEnvVar && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground">Key:</span>
            <code className="text-[10px] bg-muted px-1 py-0.5 rounded">{integration.credentialEnvVar}</code>
          </div>
        )}

        <div className="flex items-center gap-1 pt-1 border-t border-border/60">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => onEdit(integration)}
            data-testid={`button-edit-${integration.serviceKey}`}
          >
            <IconSettings className="w-3 h-3 mr-1" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-destructive hover:text-destructive"
            onClick={() => onDelete(integration)}
            data-testid={`button-delete-${integration.serviceKey}`}
          >
            <IconTrash className="w-3 h-3 mr-1" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function IntegrationFormDialog({
  open,
  onOpenChange,
  mode,
  defaultKind,
  initial,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  mode: "add" | "edit";
  defaultKind: string;
  initial: FormData;
  onSubmit: (data: FormData) => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState<FormData>(initial);
  const set = (key: keyof FormData, value: any) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="dialog-integration-form">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Add Integration" : "Edit Integration"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Name</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} data-testid="input-integration-name" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Service Key</Label>
              <Input
                value={form.serviceKey}
                onChange={(e) => set("serviceKey", e.target.value)}
                disabled={mode === "edit"}
                data-testid="input-integration-service-key"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <Select value={form.kind} onValueChange={(v) => set("kind", v)}>
                <SelectTrigger data-testid="select-integration-kind">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="scraper">Scraper</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Source</Label>
              <Select value={form.sourceType} onValueChange={(v) => set("sourceType", v)}>
                <SelectTrigger data-testid="select-integration-source-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Direct API">Direct API</SelectItem>
                  <SelectItem value="RapidAPI">RapidAPI</SelectItem>
                  <SelectItem value="Apify Platform">Apify Platform</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Credential Env Var</Label>
              <Input value={form.credentialEnvVar} onChange={(e) => set("credentialEnvVar", e.target.value)} placeholder="e.g. FRED_API_KEY" data-testid="input-integration-env-var" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Host</Label>
              <Input value={form.host} onChange={(e) => set("host", e.target.value)} placeholder="e.g. api.example.com" data-testid="input-integration-host" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Notes</Label>
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} data-testid="input-integration-notes" />
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={form.isEnabled} onCheckedChange={(v) => set("isEnabled", v)} data-testid="switch-integration-enabled" />
              <Label className="text-xs">Enabled</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isSubscribed} onCheckedChange={(v) => set("isSubscribed", v)} data-testid="switch-integration-subscribed" />
              <Label className="text-xs">Subscribed</Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="sm" data-testid="button-cancel-integration">Cancel</Button>
          </DialogClose>
          <Button
            size="sm"
            disabled={!form.name || !form.serviceKey || isPending}
            onClick={() => onSubmit({ ...form, kind: mode === "add" ? defaultKind : form.kind })}
            data-testid="button-save-integration"
          >
            {isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteConfirmDialog({
  open,
  onOpenChange,
  integration,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  integration: ExternalIntegration | null;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" data-testid="dialog-delete-integration">
        <DialogHeader>
          <DialogTitle>Delete Integration</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete <strong>{integration?.name}</strong>? This action cannot be undone.
        </p>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="sm" data-testid="button-cancel-delete">Cancel</Button>
          </DialogClose>
          <Button variant="destructive" size="sm" onClick={onConfirm} disabled={isPending} data-testid="button-confirm-delete">
            {isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function IntegrationGrid({
  kind,
  integrations,
  isLoading,
  onToggle,
  isToggling,
}: {
  kind: string;
  integrations: ExternalIntegration[];
  isLoading: boolean;
  onToggle: (id: number, enabled: boolean) => void;
  isToggling: boolean;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const items = integrations.filter((i) => i.kind === kind);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [formInitial, setFormInitial] = useState<FormData>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ExternalIntegration | null>(null);

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      await apiRequest("POST", "/api/admin/ext-integrations", data);
    },
    onSuccess: () => {
      toast({ title: "Integration added" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ext-integrations"] });
      setFormOpen(false);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<FormData> }) => {
      await apiRequest("PATCH", `/api/admin/ext-integrations/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Integration updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ext-integrations"] });
      setFormOpen(false);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/ext-integrations/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Integration deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ext-integrations"] });
      setDeleteOpen(false);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  function handleAdd() {
    setFormMode("add");
    setFormInitial({ ...EMPTY_FORM, kind });
    setEditingId(null);
    setFormOpen(true);
  }

  function handleEdit(i: ExternalIntegration) {
    setFormMode("edit");
    setEditingId(i.id);
    setFormInitial({
      kind: i.kind,
      serviceKey: i.serviceKey,
      name: i.name,
      sourceType: i.sourceType,
      credentialEnvVar: i.credentialEnvVar ?? "",
      host: i.host ?? "",
      isEnabled: i.isEnabled,
      isSubscribed: i.isSubscribed,
      notes: i.notes ?? "",
      sortOrder: i.sortOrder,
    });
    setFormOpen(true);
  }

  function handleFormSubmit(data: FormData) {
    if (formMode === "add") {
      createMutation.mutate(data);
    } else if (editingId !== null) {
      const { serviceKey: _sk, kind: _k, ...updates } = data;
      updateMutation.mutate({ id: editingId, data: updates });
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const enabledCount = items.filter((i) => i.isEnabled).length;
  const subscribedCount = items.filter((i) => i.isSubscribed).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {enabledCount}/{items.length} enabled
          </span>
          <span className="text-sm text-muted-foreground">
            {subscribedCount}/{items.length} subscribed
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={handleAdd} data-testid={`button-add-${kind}`}>
          + Add {kind === "api" ? "API" : "Scraper"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((integration) => (
          <IntegrationCard
            key={integration.id}
            integration={integration}
            onToggle={onToggle}
            onEdit={handleEdit}
            onDelete={(i) => { setDeleteTarget(i); setDeleteOpen(true); }}
            isToggling={isToggling}
          />
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          No {kind === "api" ? "APIs" : "scrapers"} configured yet. Click "Add" to get started.
        </div>
      )}

      <IntegrationFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        defaultKind={kind}
        initial={formInitial}
        onSubmit={handleFormSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        integration={deleteTarget}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}

export default function IntegrationsTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: integrations = [], isLoading, refetch } = useQuery<ExternalIntegration[]>({
    queryKey: ["/api/admin/ext-integrations"],
    staleTime: 30_000,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isEnabled }: { id: number; isEnabled: boolean }) => {
      await apiRequest("PATCH", `/api/admin/ext-integrations/${id}/toggle`, { isEnabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ext-integrations"] });
    },
    onError: (e: Error) => toast({ title: "Toggle failed", description: e.message, variant: "destructive" }),
  });

  function handleToggle(id: number, enabled: boolean) {
    toggleMutation.mutate({ id, isEnabled: enabled });
  }

  return (
    <div className="space-y-6" data-testid="integrations-tab">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">External Integrations</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage APIs and scrapers used for market intelligence and research data.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-refresh-integrations">
          <IconRefreshCw className="w-4 h-4 mr-1" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="api" className="w-full">
        <TabsList data-testid="tabs-integration-kind">
          <TabsTrigger value="api" data-testid="tab-apis">
            APIs
            <Badge variant="secondary" className="ml-2 text-[10px] h-4 px-1.5">
              {integrations.filter((i) => i.kind === "api").length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="scraper" data-testid="tab-scrapers">
            Scrapers
            <Badge variant="secondary" className="ml-2 text-[10px] h-4 px-1.5">
              {integrations.filter((i) => i.kind === "scraper").length}
            </Badge>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="api" className="mt-4">
          <IntegrationGrid
            kind="api"
            integrations={integrations}
            isLoading={isLoading}
            onToggle={handleToggle}
            isToggling={toggleMutation.isPending}
          />
        </TabsContent>
        <TabsContent value="scraper" className="mt-4">
          <IntegrationGrid
            kind="scraper"
            integrations={integrations}
            isLoading={isLoading}
            onToggle={handleToggle}
            isToggling={toggleMutation.isPending}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
