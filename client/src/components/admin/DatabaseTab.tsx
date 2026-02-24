import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { GlassButton } from "@/components/ui/glass-button";
import { Loader2, Database, RefreshCw, Upload, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

export default function DatabaseTab() {
  const { toast } = useToast();
  const [syncResults, setSyncResults] = useState<Record<string, any> | null>(null);
  const [syncConfirmOpen, setSyncConfirmOpen] = useState(false);

  const checkSyncStatus = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/sync-status", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to check sync status");
      return res.json();
    },
    onSuccess: (data) => {
      setSyncResults(data);
    },
    onError: (error: Error) => {
      toast({ title: "Sync Check Failed", description: error.message, variant: "destructive" });
    },
  });

  const executeSyncMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/seed-production", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Fill failed" }));
        throw new Error(errData.error || "Fill failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Fill Complete", description: data.message || "Missing values populated successfully" });
      setSyncConfirmOpen(false);
      checkSyncStatus.mutate();
    },
    onError: (error: Error) => {
      toast({ title: "Fill Failed", description: error.message, variant: "destructive" });
      setSyncConfirmOpen(false);
    },
  });

  const syncAutoChecked = useRef(false);
  useEffect(() => {
    if (!syncResults && !checkSyncStatus.isPending && !syncAutoChecked.current) {
      syncAutoChecked.current = true;
      checkSyncStatus.mutate();
    }
  }, []);

  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]" data-testid="card-database-sync">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Database className="w-5 h-5" /> Database Status
          </CardTitle>
          <CardDescription className="label-text">
            View current database entity counts, global assumptions, and property details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <GlassButton
            onClick={() => { setSyncResults(null); checkSyncStatus.mutate(); }}
            disabled={checkSyncStatus.isPending}
            data-testid="button-check-status"
          >
            {checkSyncStatus.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Check Status
          </GlassButton>

          {syncResults && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
                <div className="bg-primary/5 rounded-xl p-4 text-center" data-testid="stat-users-count">
                  <p className="text-2xl font-bold text-primary">{syncResults.summary?.users ?? "—"}</p>
                  <p className="text-xs text-muted-foreground mt-1">Users</p>
                </div>
                <div className="bg-primary/5 rounded-xl p-4 text-center" data-testid="stat-properties-count">
                  <p className="text-2xl font-bold text-primary">{syncResults.summary?.properties ?? "—"}</p>
                  <p className="text-xs text-muted-foreground mt-1">Properties</p>
                </div>
                <div className="bg-primary/5 rounded-xl p-4 text-center" data-testid="stat-groups-count">
                  <p className="text-2xl font-bold text-primary">{syncResults.summary?.userGroups ?? "—"}</p>
                  <p className="text-xs text-muted-foreground mt-1">User Groups</p>
                </div>
                <div className="bg-primary/5 rounded-xl p-4 text-center" data-testid="stat-companies-count">
                  <p className="text-2xl font-bold text-primary">{syncResults.summary?.companies ?? "—"}</p>
                  <p className="text-xs text-muted-foreground mt-1">Companies</p>
                </div>
                <div className="bg-primary/5 rounded-xl p-4 text-center" data-testid="stat-logos-count">
                  <p className="text-2xl font-bold text-primary">{syncResults.summary?.logos ?? "—"}</p>
                  <p className="text-xs text-muted-foreground mt-1">Logos</p>
                </div>
                <div className="bg-primary/5 rounded-xl p-4 text-center" data-testid="stat-themes-count">
                  <p className="text-2xl font-bold text-primary">{syncResults.summary?.themes ?? "—"}</p>
                  <p className="text-xs text-muted-foreground mt-1">Themes</p>
                </div>
                <div className="bg-primary/5 rounded-xl p-4 text-center" data-testid="stat-asset-descriptions-count">
                  <p className="text-2xl font-bold text-primary">{syncResults.summary?.assetDescriptions ?? "—"}</p>
                  <p className="text-xs text-muted-foreground mt-1">Asset Descs</p>
                </div>
                <div className="bg-primary/5 rounded-xl p-4 text-center" data-testid="stat-fee-categories">
                  <p className="text-2xl font-bold text-primary">{syncResults.summary?.totalFeeCategories ?? "—"}</p>
                  <p className="text-xs text-muted-foreground mt-1">Fee Categories</p>
                </div>
                <div className="bg-primary/5 rounded-xl p-4 text-center" data-testid="stat-global-assumptions">
                  <p className="text-2xl font-bold text-primary">{syncResults.summary?.hasGlobalAssumptions ? "Yes" : "No"}</p>
                  <p className="text-xs text-muted-foreground mt-1">Global Assumptions</p>
                </div>
              </div>

              {syncResults.globalAssumptions && (
                <Card className="bg-white/60 border-primary/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Global Assumptions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div><span className="text-muted-foreground">Base Mgmt Fee:</span> <span className="font-mono">{((syncResults.globalAssumptions.baseManagementFee ?? 0) * 100).toFixed(1)}%</span></div>
                      <div><span className="text-muted-foreground">Incentive Fee:</span> <span className="font-mono">{((syncResults.globalAssumptions.incentiveManagementFee ?? 0) * 100).toFixed(1)}%</span></div>
                      <div><span className="text-muted-foreground">Inflation:</span> <span className="font-mono">{((syncResults.globalAssumptions.inflationRate ?? 0) * 100).toFixed(1)}%</span></div>
                      <div><span className="text-muted-foreground">Tax Rate:</span> <span className="font-mono">{((syncResults.globalAssumptions.companyTaxRate ?? 0) * 100).toFixed(1)}%</span></div>
                      <div><span className="text-muted-foreground">Exit Cap:</span> <span className="font-mono">{((syncResults.globalAssumptions.exitCapRate ?? 0) * 100).toFixed(1)}%</span></div>
                      <div><span className="text-muted-foreground">Commission:</span> <span className="font-mono">{((syncResults.globalAssumptions.commissionRate ?? 0) * 100).toFixed(1)}%</span></div>
                      <div className="col-span-2"><span className="text-muted-foreground">Company:</span> <span className="font-medium">{syncResults.globalAssumptions.companyName}</span></div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {syncResults.properties?.length > 0 && (
                <Card className="bg-white/60 border-primary/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Properties ({syncResults.properties.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead className="text-right">Rooms</TableHead>
                          <TableHead className="text-right">ADR</TableHead>
                          <TableHead className="text-right">Base Fee</TableHead>
                          <TableHead className="text-right">Exit Cap</TableHead>
                          <TableHead className="text-center">Research</TableHead>
                          <TableHead className="text-center">Fee Cats</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {syncResults.properties.map((prop: any) => (
                          <TableRow key={prop.id} data-testid={`row-property-${prop.id}`}>
                            <TableCell className="font-medium" data-testid={`text-property-name-${prop.id}`}>{prop.name}</TableCell>
                            <TableCell className="text-muted-foreground text-xs">{prop.location}</TableCell>
                            <TableCell className="text-right font-mono">{prop.roomCount}</TableCell>
                            <TableCell className="text-right font-mono">${prop.startAdr}</TableCell>
                            <TableCell className="text-right font-mono">{((prop.baseManagementFeeRate ?? 0) * 100).toFixed(1)}%</TableCell>
                            <TableCell className="text-right font-mono">{((prop.exitCapRate ?? 0) * 100).toFixed(1)}%</TableCell>
                            <TableCell className="text-center">
                              {prop.hasResearchValues ? <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" /> : <XCircle className="w-4 h-4 text-red-400 mx-auto" />}
                            </TableCell>
                            <TableCell className="text-center font-mono">{prop.feeCategories?.length ?? 0}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-amber-50/80 backdrop-blur-xl border-amber-300/40 shadow-[0_8px_32px_rgba(245,158,11,0.08)]" data-testid="card-populate-production">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2 text-amber-800">
            <Upload className="w-5 h-5" /> Populate Production
          </CardTitle>
          <CardDescription className="label-text text-amber-700/80">
            Push development seed values to the production database. Only fills in values that are <strong>not already set</strong> by a user — existing data is never overwritten.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GlassButton
            onClick={() => setSyncConfirmOpen(true)}
            disabled={executeSyncMutation.isPending}
            className="bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20 text-amber-700"
            data-testid="button-sync-database"
          >
            {executeSyncMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
            Fill Missing Values
          </GlassButton>
        </CardContent>
      </Card>

      <Dialog open={syncConfirmOpen} onOpenChange={setSyncConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Confirm Production Fill
            </DialogTitle>
            <DialogDescription>
              This will populate global assumptions, properties, fee categories, and design themes with seed values <strong>only where they are currently empty</strong>. Any values already set by users will not be changed. Users and user groups will be created if missing.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSyncConfirmOpen(false)} data-testid="button-cancel-sync">Cancel</Button>
            <Button
              onClick={() => executeSyncMutation.mutate()}
              disabled={executeSyncMutation.isPending}
              className="bg-amber-500 hover:bg-amber-600 text-white"
              data-testid="button-confirm-sync"
            >
              {executeSyncMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Yes, Fill Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}