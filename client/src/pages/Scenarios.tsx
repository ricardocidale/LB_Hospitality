import Layout from "@/components/Layout";
import { AnimatedPage, ScrollReveal, KPIGrid, AnimatedGrid, AnimatedGridItem } from "@/components/graphics";
import { TiltCard } from "@/components/ui/animated";
import { useScenarios, useCreateScenario, useLoadScenario, useUpdateScenario, useDeleteScenario } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "@/components/icons/themed-icons";
import { IconSave, IconFolderOpen, IconPencil, IconTrash, IconClock, IconFileStack, IconDownload, IconUpload, IconCopy, IconGitCompareArrows, IconAlertTriangle } from "@/components/icons";
import { PageHeader } from "@/components/ui/page-header";
import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { formatDateTime } from "@/lib/formatters";
import { SaveScenarioDialog, EditScenarioDialog, CompareResultDialog, type ScenarioCompareResult } from "@/components/scenarios";
import { useAuth } from "@/lib/auth";

export default function Scenarios() {
  const { data: scenarios, isLoading, isError } = useScenarios();
  const createScenario = useCreateScenario();
  const loadScenario = useLoadScenario();
  const updateScenario = useUpdateScenario();
  const deleteScenario = useDeleteScenario();
  const { toast } = useToast();
  const { canManageScenarios } = useAuth();

  const [newScenarioName, setNewScenarioName] = useState("");
  const [newScenarioDescription, setNewScenarioDescription] = useState("");
  const [editingScenario, setEditingScenario] = useState<{ id: number; name: string; description: string } | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!newScenarioName.trim()) {
      toast({ title: "Error", description: "Please enter a scenario name", variant: "destructive" });
      return;
    }

    try {
      await createScenario.mutateAsync({ 
        name: newScenarioName.trim(), 
        description: newScenarioDescription.trim() || undefined 
      });
      toast({ title: "Success", description: "Scenario saved successfully" });
      setNewScenarioName("");
      setNewScenarioDescription("");
      setIsCreating(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to save scenario", variant: "destructive" });
    }
  };

  const handleLoad = async (id: number, name: string) => {
    try {
      await loadScenario.mutateAsync(id);
      toast({ title: "Success", description: `Scenario "${name}" loaded successfully` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to load scenario", variant: "destructive" });
    }
  };

  const handleUpdate = async () => {
    if (!editingScenario) return;

    try {
      await updateScenario.mutateAsync({
        id: editingScenario.id,
        data: { name: editingScenario.name, description: editingScenario.description || undefined }
      });
      toast({ title: "Success", description: "Scenario updated successfully" });
      setEditingScenario(null);
    } catch (error) {
      toast({ title: "Error", description: "Failed to update scenario", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number, name: string) => {
    try {
      await deleteScenario.mutateAsync(id);
      toast({ title: "Success", description: `Scenario "${name}" deleted` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete scenario", variant: "destructive" });
    }
  };

  const queryClient = useQueryClient();
  const importFileRef = useRef<HTMLInputElement>(null);

  const [compareMode, setCompareMode] = useState(false);
  const [compareSelection, setCompareSelection] = useState<number[]>([]);
  const [compareResult, setCompareResult] = useState<ScenarioCompareResult | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);

  const handleExport = async (id: number, name: string) => {
    try {
      const res = await fetch(`/api/scenarios/${id}/export`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to export scenario");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${name.replace(/[^a-zA-Z0-9-_ ]/g, "")}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Exported", description: `"${name}" downloaded as JSON` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to export scenario", variant: "destructive" });
    }
  };

  const handleClone = async (id: number, name: string) => {
    try {
      const res = await fetch(`/api/scenarios/${id}/clone`, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("Failed to clone scenario");
      queryClient.invalidateQueries({ queryKey: ["/api/scenarios"] });
      queryClient.invalidateQueries({ queryKey: ["scenarios"] });
      toast({ title: "Cloned", description: `"${name} (Copy)" created` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to clone scenario", variant: "destructive" });
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.name || !data.globalAssumptions || !Array.isArray(data.properties)) {
        throw new Error("Invalid scenario file — missing required fields");
      }
      const res = await fetch("/api/scenarios/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Import failed");
      queryClient.invalidateQueries({ queryKey: ["/api/scenarios"] });
      queryClient.invalidateQueries({ queryKey: ["scenarios"] });
      toast({ title: "Imported", description: `Scenario "${data.name}" imported successfully` });
    } catch (error: any) {
      toast({ title: "Import Error", description: error.message || "Failed to import scenario", variant: "destructive" });
    }
    if (importFileRef.current) importFileRef.current.value = "";
  };

  const toggleCompareSelect = (id: number) => {
    setCompareSelection(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const handleCompare = async () => {
    if (compareSelection.length !== 2) return;
    setCompareLoading(true);
    try {
      const [id1, id2] = compareSelection;
      const res = await fetch(`/api/scenarios/${id1}/compare/${id2}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to compare scenarios");
      const data: ScenarioCompareResult = await res.json();
      setCompareResult(data);
      setCompareDialogOpen(true);
    } catch (error) {
      toast({ title: "Error", description: "Failed to compare scenarios", variant: "destructive" });
    } finally {
      setCompareLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (isError) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
          <IconAlertTriangle className="w-8 h-8 text-destructive" />
          <p className="text-muted-foreground">Failed to load scenarios. Please try refreshing the page.</p>
        </div>
      </Layout>
    );
  }

  const noPermissionMsg = "Scenario management is disabled for your account. Contact an admin to enable it.";

  return (
    <Layout>
      <AnimatedPage>
      <TooltipProvider>
      <div className="space-y-8">
        <PageHeader 
          title="Scenarios" 
          subtitle="Save and load different versions of your assumptions and properties"
          variant="dark"
        />

        <KPIGrid
          data-testid="kpi-scenarios"
          items={[
            { label: "Total Scenarios", value: scenarios?.length ?? 0, sublabel: "saved snapshots" },
            { label: "Latest Saved", value: scenarios?.length ?? 0, format: () => scenarios?.length ? new Date(scenarios[0].updatedAt || scenarios[0].createdAt).toLocaleDateString() : "—", sublabel: "most recent" },
          ]}
          columns={2}
          variant="light"
        />

        {!canManageScenarios && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-accent-pop/10 border border-accent-pop/20 text-accent-pop text-sm" data-testid="text-no-scenario-permission">
            <IconAlertTriangle className="w-4 h-4 shrink-0" />
            {noPermissionMsg}
          </div>
        )}

        <Card className="relative overflow-hidden bg-card border-border shadow-sm">
          
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-display text-foreground">Saved Scenarios</CardTitle>
                <CardDescription className="label-text text-muted-foreground">
                  {scenarios?.length === 0 
                    ? "No scenarios saved yet. Save your current configuration to get started."
                    : `${scenarios?.length} scenario${scenarios?.length === 1 ? '' : 's'} saved`
                  }
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        variant="ghost"
                        onClick={() => importFileRef.current?.click()}
                        disabled={!canManageScenarios}
                        data-testid="button-import-scenario"
                        className="text-muted-foreground hover:text-foreground hover:bg-muted"
                      >
                        <IconUpload className="w-4 h-4" />
                        Import
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{canManageScenarios ? "Import a scenario from a JSON file" : noPermissionMsg}</TooltipContent>
                </Tooltip>
                <input
                  ref={importFileRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
                {(scenarios?.length ?? 0) >= 2 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={compareMode ? "default" : "ghost"}
                        onClick={() => { setCompareMode(!compareMode); setCompareSelection([]); }}
                        data-testid="button-toggle-compare"
                        className={compareMode ? "" : "text-muted-foreground hover:text-foreground hover:bg-muted"}
                      >
                        <IconGitCompareArrows className="w-4 h-4" />
                        {compareMode ? "Cancel Compare" : "Compare"}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{compareMode ? "Exit comparison mode" : "Compare two scenarios side by side"}</TooltipContent>
                  </Tooltip>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        variant="default"
                        onClick={() => setIsCreating(true)}
                        disabled={!canManageScenarios}
                        data-testid="button-new-scenario"
                      >
                        <IconSave className="w-4 h-4" />
                        Save As
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{canManageScenarios ? "Save current state as a new scenario" : noPermissionMsg}</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="relative space-y-4">
            {compareMode && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                <span className="text-foreground text-sm">
                  {compareSelection.length === 0 && "Select two scenarios to compare"}
                  {compareSelection.length === 1 && "Select one more scenario"}
                  {compareSelection.length === 2 && "Ready to compare"}
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="default"
                      size="sm"
                      disabled={compareSelection.length !== 2 || compareLoading}
                      onClick={handleCompare}
                      data-testid="button-run-compare"
                    >
                      {compareLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <IconGitCompareArrows className="w-4 h-4" />}
                      Compare
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {compareSelection.length !== 2 ? "Select exactly two scenarios to compare" : "Compare the two selected scenarios"}
                  </TooltipContent>
                </Tooltip>
              </div>
            )}

            {scenarios?.length === 0 ? (
              <div className="text-center py-12">
                <IconFileStack className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="label-text text-muted-foreground font-medium">No scenarios saved yet</p>
                <p className="label-text text-muted-foreground mt-1">
                  Click "Save Current" to save your current assumptions and properties as a scenario
                </p>
              </div>
            ) : (
              <ScrollReveal>
              <AnimatedGrid className="grid gap-4">
                {scenarios?.map((scenario) => (
                  <AnimatedGridItem key={scenario.id}>
                  <TiltCard intensity={4}>
                  <div
                    className={`p-4 rounded-lg border transition-colors ${
                      compareMode && compareSelection.includes(scenario.id)
                        ? "bg-primary/10 border-primary"
                        : "bg-muted border-border hover:bg-muted"
                    } ${compareMode ? "cursor-pointer" : ""}`}
                    onClick={compareMode ? () => toggleCompareSelect(scenario.id) : undefined}
                    data-testid={`scenario-card-${scenario.id}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      {compareMode && (
                        <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          compareSelection.includes(scenario.id) ? "border-primary bg-primary" : "border-border"
                        }`}>
                          {compareSelection.includes(scenario.id) && (
                            <span className="text-[10px] font-bold text-white">
                              {compareSelection.indexOf(scenario.id) + 1}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display text-foreground truncate">{scenario.name}</h3>
                        {scenario.description && (
                          <p className="label-text text-muted-foreground mt-1 line-clamp-2">{scenario.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1 font-mono">
                            <IconClock className="w-3 h-3" />
                            Saved: {formatDateTime(scenario.updatedAt)}
                          </span>
                          <span className="font-mono">{(scenario.properties as any[])?.length || 0} properties</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="default"
                              onClick={() => handleLoad(scenario.id, scenario.name)}
                              disabled={loadScenario.isPending}
                              data-testid={`button-load-scenario-${scenario.id}`}
                            >
                              {loadScenario.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <IconFolderOpen className="w-4 h-4" />
                              )}
                              Load
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Restore this scenario as the active configuration</TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleExport(scenario.id, scenario.name)}
                              className="text-muted-foreground hover:text-foreground hover:bg-muted"
                              data-testid={`button-export-scenario-${scenario.id}`}
                            >
                              <IconDownload className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Export as JSON file</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleClone(scenario.id, scenario.name)}
                                disabled={!canManageScenarios}
                                className="text-muted-foreground hover:text-foreground hover:bg-muted"
                                data-testid={`button-clone-scenario-${scenario.id}`}
                              >
                                <IconCopy className="w-4 h-4" />
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>{canManageScenarios ? "Duplicate this scenario" : noPermissionMsg}</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingScenario({
                                  id: scenario.id,
                                  name: scenario.name,
                                  description: scenario.description || ""
                                })}
                                disabled={!canManageScenarios}
                                className="text-muted-foreground hover:text-foreground hover:bg-muted"
                                data-testid={`button-edit-scenario-${scenario.id}`}
                              >
                                <IconPencil className="w-4 h-4" />
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>{canManageScenarios ? "Edit name and description" : noPermissionMsg}</TooltipContent>
                        </Tooltip>

                        {scenario.name !== "Base" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                {canManageScenarios ? (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-destructive/80 hover:text-destructive/60 hover:bg-destructive/10"
                                        data-testid={`button-delete-scenario-${scenario.id}`}
                                      >
                                        <IconTrash className="w-4 h-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle className="font-display">Delete Scenario</AlertDialogTitle>
                                        <AlertDialogDescription className="label-text">
                                          Are you sure you want to delete "{scenario.name}"? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDelete(scenario.id, scenario.name)}
                                          className="bg-destructive hover:bg-destructive/80"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    disabled
                                    className="text-destructive/80 hover:text-destructive/60 hover:bg-destructive/10"
                                    data-testid={`button-delete-scenario-${scenario.id}`}
                                  >
                                    <IconTrash className="w-4 h-4" />
                                  </Button>
                                )}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>{canManageScenarios ? "Delete this scenario" : noPermissionMsg}</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  </div>
                  </TiltCard>
                  </AnimatedGridItem>
                ))}
              </AnimatedGrid>
              </ScrollReveal>
            )}
          </CardContent>
        </Card>

        <SaveScenarioDialog
          open={isCreating}
          onOpenChange={setIsCreating}
          name={newScenarioName}
          onNameChange={setNewScenarioName}
          description={newScenarioDescription}
          onDescriptionChange={setNewScenarioDescription}
          onSave={handleCreate}
          isPending={createScenario.isPending}
        />

        <EditScenarioDialog
          scenario={editingScenario}
          onNameChange={(name) => setEditingScenario(prev => prev ? { ...prev, name } : null)}
          onDescriptionChange={(desc) => setEditingScenario(prev => prev ? { ...prev, description: desc } : null)}
          onClose={() => setEditingScenario(null)}
          onSave={handleUpdate}
          isPending={updateScenario.isPending}
        />

        <CompareResultDialog
          open={compareDialogOpen}
          onOpenChange={(open) => { if (!open) setCompareDialogOpen(false); }}
          result={compareResult}
        />
      </div>
      </TooltipProvider>
      </AnimatedPage>
    </Layout>
  );
}
