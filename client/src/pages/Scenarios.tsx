import Layout from "@/components/Layout";
import { useScenarios, useCreateScenario, useLoadScenario, useUpdateScenario, useDeleteScenario } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GlassButton } from "@/components/ui/glass-button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, FolderOpen, Pencil, Trash2, Plus, Clock, FileStack } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
              <GlassButton
                variant="primary"
                onClick={() => setIsCreating(true)}
                data-testid="button-new-scenario"
              >
                <Save className="w-4 h-4" />
                Save As
              </GlassButton>
            </div>
          </CardHeader>
          
          <CardContent className="relative space-y-4">
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
                    className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                    data-testid={`scenario-card-${scenario.id}`}
                  >
                    <div className="flex items-start justify-between gap-4">
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
      </div>
    </Layout>
  );
}
