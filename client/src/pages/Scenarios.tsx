import Layout from "@/components/Layout";
import { useScenarios, useCreateScenario, useLoadScenario, useUpdateScenario, useDeleteScenario } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GlassButton } from "@/components/ui/glass-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, FolderOpen, Pencil, Trash2, Plus, Clock, FileStack, Download, Upload, Copy, GitCompareArrows, ArrowRight, Minus, PlusCircle, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** Diff result shape from GET /api/scenarios/:id1/compare/:id2 */
interface ScenarioCompareResult {
  scenario1: { id: number; name: string };
  scenario2: { id: number; name: string };
  assumptionDiffs: Array<{ field: string; scenario1: unknown; scenario2: unknown }>;
  propertyDiffs: Array<{
    name: string;
    status: "added" | "removed" | "changed";
    changes?: Array<{ field: string; scenario1: unknown; scenario2: unknown }>;
  }>;
}

export default function Scenarios() {
  const { data: scenarios, isLoading } = useScenarios();
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

  /** Format a diff value for display. */
  const formatDiffValue = (v: unknown): string => {
    if (v === null || v === undefined) return "—";
    if (typeof v === "number") {
      if (Math.abs(v) < 1 && v !== 0) return `${(v * 100).toFixed(1)}%`;
      return v.toLocaleString();
    }
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  return (
    <Layout>
      <div className="space-y-8">
        <PageHeader 
          title="Scenarios" 
          subtitle="Save and load different versions of your assumptions and properties"
          variant="dark"
        />

        <Card className="relative overflow-hidden bg-gradient-to-br from-[#2d4a5e]/90 via-[#3d5a6a]/90 to-[#3a5a5e]/90 backdrop-blur-xl border-white/10">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-[#9FBCA4]/15 blur-3xl" />
            <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-[#257D41]/10 blur-3xl" />
          </div>
          
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-display text-[#FFF9F5]">Saved Scenarios</CardTitle>
                <CardDescription className="label-text text-white/60">
                  {scenarios?.length === 0 
                    ? "No scenarios saved yet. Save your current configuration to get started."
                    : `${scenarios?.length} scenario${scenarios?.length === 1 ? '' : 's'} saved`
                  }
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <GlassButton
                  variant="ghost"
                  onClick={() => importFileRef.current?.click()}
                  data-testid="button-import-scenario"
                >
                  <Upload className="w-4 h-4" />
                  Import
                </GlassButton>
                <input
                  ref={importFileRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
                {(scenarios?.length ?? 0) >= 2 && (
                  <GlassButton
                    variant={compareMode ? "primary" : "ghost"}
                    onClick={() => { setCompareMode(!compareMode); setCompareSelection([]); }}
                    data-testid="button-toggle-compare"
                  >
                    <GitCompareArrows className="w-4 h-4" />
                    {compareMode ? "Cancel Compare" : "Compare"}
                  </GlassButton>
                )}
                <GlassButton
                  variant="primary"
                  onClick={() => setIsCreating(true)}
                  data-testid="button-new-scenario"
                >
                  <Save className="w-4 h-4" />
                  Save As
                </GlassButton>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="relative space-y-4">
            {/* Compare selection bar */}
            {compareMode && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#9FBCA4]/10 border border-[#9FBCA4]/30">
                <span className="text-white/70 text-sm">
                  {compareSelection.length === 0 && "Select two scenarios to compare"}
                  {compareSelection.length === 1 && "Select one more scenario"}
                  {compareSelection.length === 2 && "Ready to compare"}
                </span>
                <GlassButton
                  variant="primary"
                  size="sm"
                  disabled={compareSelection.length !== 2 || compareLoading}
                  onClick={handleCompare}
                  data-testid="button-run-compare"
                >
                  {compareLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitCompareArrows className="w-4 h-4" />}
                  Compare
                </GlassButton>
              </div>
            )}

            {scenarios?.length === 0 ? (
              <div className="text-center py-12">
                <FileStack className="w-16 h-16 mx-auto text-white/30 mb-4" />
                <p className="label-text text-white/60">No scenarios saved yet</p>
                <p className="label-text text-white/40 mt-1">
                  Click "Save Current" to save your current assumptions and properties as a scenario
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {scenarios?.map((scenario) => (
                  <div
                    key={scenario.id}
                    className={`p-4 rounded-xl border transition-colors ${
                      compareMode && compareSelection.includes(scenario.id)
                        ? "bg-[#9FBCA4]/15 border-[#9FBCA4]/40"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    } ${compareMode ? "cursor-pointer" : ""}`}
                    onClick={compareMode ? () => toggleCompareSelect(scenario.id) : undefined}
                    data-testid={`scenario-card-${scenario.id}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      {compareMode && (
                        <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          compareSelection.includes(scenario.id) ? "border-[#9FBCA4] bg-[#9FBCA4]" : "border-white/30"
                        }`}>
                          {compareSelection.includes(scenario.id) && (
                            <span className="text-[10px] font-bold text-black">
                              {compareSelection.indexOf(scenario.id) + 1}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display text-[#FFF9F5] truncate">{scenario.name}</h3>
                        {scenario.description && (
                          <p className="label-text text-white/60 mt-1 line-clamp-2">{scenario.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3" />
                            Saved: {formatDate(scenario.updatedAt)}
                          </span>
                          <span className="font-mono">{(scenario.properties as any[])?.length || 0} properties</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <GlassButton
                          variant="primary"
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
                        </GlassButton>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleExport(scenario.id, scenario.name)}
                          className="text-white/60 hover:text-white hover:bg-white/10"
                          title="Export as JSON"
                          data-testid={`button-export-scenario-${scenario.id}`}
                        >
                          <Download className="w-4 h-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleClone(scenario.id, scenario.name)}
                          className="text-white/60 hover:text-white hover:bg-white/10"
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
                          className="text-white/60 hover:text-white hover:bg-white/10"
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Save Current Configuration</DialogTitle>
              <DialogDescription className="label-text">
                Save your current assumptions and properties as a new scenario
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="label-text">Scenario Name</label>
                <Input
                  value={newScenarioName}
                  onChange={(e) => setNewScenarioName(e.target.value)}
                  placeholder="e.g., Base Case, Optimistic, Conservative"
                  data-testid="input-scenario-name"
                />
              </div>
              <div className="space-y-2">
                <label className="label-text">Description (optional)</label>
                <Input
                  value={newScenarioDescription}
                  onChange={(e) => setNewScenarioDescription(e.target.value)}
                  placeholder="Brief description of this scenario"
                  data-testid="input-scenario-description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={handleCreate}
                disabled={createScenario.isPending || !newScenarioName.trim()}
                data-testid="button-save-scenario"
                className="flex items-center gap-2"
              >
                {createScenario.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Scenario
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingScenario} onOpenChange={(open) => !open && setEditingScenario(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Edit Scenario</DialogTitle>
              <DialogDescription className="label-text">
                Update the name and description of this scenario
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="label-text">Scenario Name</label>
                <Input
                  value={editingScenario?.name || ""}
                  onChange={(e) => setEditingScenario(prev => prev ? { ...prev, name: e.target.value } : null)}
                  placeholder="Scenario name"
                  data-testid="input-edit-scenario-name"
                />
              </div>
              <div className="space-y-2">
                <label className="label-text">Description (optional)</label>
                <Input
                  value={editingScenario?.description || ""}
                  onChange={(e) => setEditingScenario(prev => prev ? { ...prev, description: e.target.value } : null)}
                  placeholder="Brief description"
                  data-testid="input-edit-scenario-description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingScenario(null)}>
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={handleUpdate}
                disabled={updateScenario.isPending || !editingScenario?.name.trim()}
                data-testid="button-update-scenario"
                className="flex items-center gap-2"
              >
                {updateScenario.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Update
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Scenario Comparison Result Dialog */}
        <Dialog open={compareDialogOpen} onOpenChange={(open) => { if (!open) setCompareDialogOpen(false); }}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display flex items-center gap-2">
                <GitCompareArrows className="w-5 h-5" />
                Scenario Comparison
              </DialogTitle>
              {compareResult && (
                <DialogDescription className="label-text">
                  <span className="font-semibold">{compareResult.scenario1.name}</span>
                  {" vs "}
                  <span className="font-semibold">{compareResult.scenario2.name}</span>
                </DialogDescription>
              )}
            </DialogHeader>

            {compareResult && (
              <div className="space-y-6 py-4">
                {/* Assumption Diffs */}
                {compareResult.assumptionDiffs.length > 0 && (
                  <div>
                    <h4 className="font-display font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      Assumption Changes ({compareResult.assumptionDiffs.length})
                    </h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Field</TableHead>
                          <TableHead className="text-xs">{compareResult.scenario1.name}</TableHead>
                          <TableHead className="text-xs">{compareResult.scenario2.name}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {compareResult.assumptionDiffs.map((d, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-mono text-xs text-gray-600">{d.field}</TableCell>
                            <TableCell className="font-mono text-xs text-red-600">{formatDiffValue(d.scenario1)}</TableCell>
                            <TableCell className="font-mono text-xs text-green-700">{formatDiffValue(d.scenario2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Properties added (only in scenario 2) */}
                {compareResult.propertyDiffs.filter(pd => pd.status === "added").length > 0 && (
                  <div>
                    <h4 className="font-display font-semibold text-sm text-green-700 mb-2 flex items-center gap-2">
                      <PlusCircle className="w-4 h-4" />
                      Only in {compareResult.scenario2.name}
                    </h4>
                    <div className="space-y-1">
                      {compareResult.propertyDiffs.filter(pd => pd.status === "added").map((pd, i) => (
                        <div key={i} className="text-sm px-3 py-1.5 rounded bg-green-50 border border-green-200 text-green-700">
                          {pd.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Properties removed (only in scenario 1) */}
                {compareResult.propertyDiffs.filter(pd => pd.status === "removed").length > 0 && (
                  <div>
                    <h4 className="font-display font-semibold text-sm text-red-600 mb-2 flex items-center gap-2">
                      <Minus className="w-4 h-4" />
                      Only in {compareResult.scenario1.name}
                    </h4>
                    <div className="space-y-1">
                      {compareResult.propertyDiffs.filter(pd => pd.status === "removed").map((pd, i) => (
                        <div key={i} className="text-sm px-3 py-1.5 rounded bg-red-50 border border-red-200 text-red-700">
                          {pd.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Property-level field changes */}
                {compareResult.propertyDiffs.filter(pd => pd.status === "changed").length > 0 && (
                  <div>
                    <h4 className="font-display font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      Property Changes
                    </h4>
                    {compareResult.propertyDiffs.filter(pd => pd.status === "changed").map((pd, i) => (
                      <div key={i} className="mb-4">
                        <p className="text-sm font-semibold text-gray-800 mb-1">{pd.name} ({pd.changes?.length ?? 0} changes)</p>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Field</TableHead>
                              <TableHead className="text-xs">{compareResult.scenario1.name}</TableHead>
                              <TableHead className="text-xs">{compareResult.scenario2.name}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pd.changes?.map((d, j) => (
                              <TableRow key={j}>
                                <TableCell className="font-mono text-xs text-gray-600">{d.field}</TableCell>
                                <TableCell className="font-mono text-xs text-red-600">{formatDiffValue(d.scenario1)}</TableCell>
                                <TableCell className="font-mono text-xs text-green-700">{formatDiffValue(d.scenario2)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ))}
                  </div>
                )}

                {/* No differences */}
                {compareResult.assumptionDiffs.length === 0 &&
                 compareResult.propertyDiffs.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500 label-text">These scenarios are identical.</p>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setCompareDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
