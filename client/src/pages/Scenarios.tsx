/**
 * Scenarios.tsx — Scenario management page for saving and comparing model snapshots.
 *
 * A "scenario" is a complete snapshot of the financial model at a point in time:
 * it captures the global assumptions and all property data so the user can
 * experiment with different sets of inputs and come back to previous versions.
 *
 * Key capabilities:
 *   • Save As — snapshot the current global assumptions + all properties into a
 *     named scenario. Useful for creating "Base Case", "Optimistic", "Conservative"
 *     versions of the model.
 *   • Load — restore a saved scenario, overwriting the current live data. This is
 *     the "undo to a known state" workflow.
 *   • Edit — rename or update description of a scenario.
 *   • Delete — remove a scenario (the "Base" scenario cannot be deleted).
 *   • Export / Import — download a scenario as JSON or upload one from a file.
 *     This enables sharing model configurations between users or environments.
 *   • Clone — duplicate a scenario with a "(Copy)" suffix for quick forking.
 *   • Compare — select two scenarios and see a diff of assumption changes and
 *     property additions/removals/changes. The diff is fetched from the server
 *     via GET /api/scenarios/:id1/compare/:id2.
 *
 * The page shows KPIs (total scenario count, latest save date) and a card list
 * of all saved scenarios with action buttons.
 */
import Layout from "@/components/Layout";
import { AnimatedPage, ScrollReveal, KPIGrid, AnimatedGrid, AnimatedGridItem } from "@/components/graphics";
import { TiltCard } from "@/components/ui/animated";
import { useScenarios, useCreateScenario, useLoadScenario, useUpdateScenario, useDeleteScenario } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { IconSave, IconFolderOpen, IconPencil, IconTrash, IconClock, IconFileStack, IconDownload, IconUpload, IconCopy, IconGitCompareArrows, IconAlertTriangle } from "@/components/icons";
import { PageHeader } from "@/components/ui/page-header";
import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { formatDateTime } from "@/lib/formatters";
import { SaveScenarioDialog, EditScenarioDialog, CompareResultDialog, type ScenarioCompareResult } from "@/components/scenarios";

export default function Scenarios() {
  const { data: scenarios, isLoading, isError } = useScenarios();
  const createScenario = useCreateScenario();
  const loadScenario = useLoadScenario();
  const updateScenario = useUpdateScenario();
  const deleteScenario = useDeleteScenario();
  const { toast } = useToast();

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

  // Scenario comparison state
  const [compareMode, setCompareMode] = useState(false);
  const [compareSelection, setCompareSelection] = useState<number[]>([]);
  const [compareResult, setCompareResult] = useState<ScenarioCompareResult | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);

  /** Download a scenario as a JSON file (excludes images for size). */
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

  /** Duplicate a scenario with " (Copy)" suffix. */
  const handleClone = async (id: number, name: string) => {
    try {
      const res = await fetch(`/api/scenarios/${id}/clone`, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("Failed to clone scenario");
      queryClient.invalidateQueries({ queryKey: ["/api/scenarios"] });
      toast({ title: "Cloned", description: `"${name} (Copy)" created` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to clone scenario", variant: "destructive" });
    }
  };

  /** Import a scenario from an uploaded JSON file. */
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
      toast({ title: "Imported", description: `Scenario "${data.name}" imported successfully` });
    } catch (error: any) {
      toast({ title: "Import Error", description: error.message || "Failed to import scenario", variant: "destructive" });
    }
    // Reset file input so the same file can be re-selected
    if (importFileRef.current) importFileRef.current.value = "";
  };

  /** Toggle a scenario for comparison. Max 2 selected. */
  const toggleCompareSelect = (id: number) => {
    setCompareSelection(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  /** Fetch the diff between two scenarios and show the result dialog. */
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
          <AlertTriangle className="w-8 h-8 text-destructive" />
          <p className="text-muted-foreground">Failed to load scenarios. Please try refreshing the page.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <AnimatedPage>
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
                <Button
                  variant="ghost"
                  onClick={() => importFileRef.current?.click()}
                  data-testid="button-import-scenario"
                  className="text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <Upload className="w-4 h-4" />
                  Import
                </Button>
                <input
                  ref={importFileRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
                {(scenarios?.length ?? 0) >= 2 && (
                  <Button
                    variant={compareMode ? "default" : "ghost"}
                    onClick={() => { setCompareMode(!compareMode); setCompareSelection([]); }}
                    data-testid="button-toggle-compare"
                    className={compareMode ? "" : "text-muted-foreground hover:text-foreground hover:bg-muted"}
                  >
                    <GitCompareArrows className="w-4 h-4" />
                    {compareMode ? "Cancel Compare" : "Compare"}
                  </Button>
                )}
                <Button
                  variant="default"
                  onClick={() => setIsCreating(true)}
                  data-testid="button-new-scenario"
                >
                  <Save className="w-4 h-4" />
                  Save As
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="relative space-y-4">
            {/* Compare selection bar */}
            {compareMode && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                <span className="text-foreground text-sm">
                  {compareSelection.length === 0 && "Select two scenarios to compare"}
                  {compareSelection.length === 1 && "Select one more scenario"}
                  {compareSelection.length === 2 && "Ready to compare"}
                </span>
                <Button
                  variant="default"
                  size="sm"
                  disabled={compareSelection.length !== 2 || compareLoading}
                  onClick={handleCompare}
                  data-testid="button-run-compare"
                >
                  {compareLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitCompareArrows className="w-4 h-4" />}
                  Compare
                </Button>
              </div>
            )}

            {scenarios?.length === 0 ? (
              <div className="text-center py-12">
                <FileStack className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
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
                            <Clock className="w-3 h-3" />
                            Saved: {formatDateTime(scenario.updatedAt)}
                          </span>
                          <span className="font-mono">{(scenario.properties as any[])?.length || 0} properties</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="default"
                            onClick={() => handleLoad(scenario.id, scenario.name)}
                            disabled={loadScenario.isPending}
                            data-testid={`button-load-scenario-${scenario.id}`}
                          >
                            {loadScenario.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <FolderOpen className="w-4 h-4" />
                            )}
                            Load
                          </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleExport(scenario.id, scenario.name)}
                          className="text-muted-foreground hover:text-foreground hover:bg-muted"
                          title="Export as JSON"
                          data-testid={`button-export-scenario-${scenario.id}`}
                        >
                          <Download className="w-4 h-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleClone(scenario.id, scenario.name)}
                          className="text-muted-foreground hover:text-foreground hover:bg-muted"
                          title="Duplicate"
                          data-testid={`button-clone-scenario-${scenario.id}`}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingScenario({
                            id: scenario.id,
                            name: scenario.name,
                            description: scenario.description || ""
                          })}
                          className="text-muted-foreground hover:text-foreground hover:bg-muted"
                          data-testid={`button-edit-scenario-${scenario.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>

                        {scenario.name !== "Base" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                data-testid={`button-delete-scenario-${scenario.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
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
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
      </AnimatedPage>
    </Layout>
  );
}
