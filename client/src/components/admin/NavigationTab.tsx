import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Settings } from "lucide-react";
import { invalidateAllFinancialQueries } from "@/lib/api";

export default function NavigationTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: globalAssumptions } = useQuery({
    queryKey: ["globalAssumptions"],
    queryFn: async () => {
      const res = await fetch("/api/global-assumptions", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch global assumptions");
      return res.json();
    },
  });

  const updateSidebarMutation = useMutation({
    mutationFn: async (updates: Record<string, boolean>) => {
      const res = await fetch("/api/global-assumptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...globalAssumptions, ...updates }),
      });
      if (!res.ok) throw new Error("Failed to update sidebar settings");
      return res.json();
    },
    onSuccess: () => {
      invalidateAllFinancialQueries(queryClient);
      toast({ title: "Sidebar updated", description: "Navigation visibility saved for all users." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save sidebar settings.", variant: "destructive" });
    },
  });

  const sidebarToggles = [
    { key: "sidebarPropertyFinder", label: "Property Finder", description: "Search and discover new property opportunities" },
    { key: "sidebarSensitivity", label: "Sensitivity Analysis", description: "Run what-if scenarios on key assumptions" },
    { key: "sidebarFinancing", label: "Financing Analysis", description: "Analyze debt structures and refinance options" },
    { key: "sidebarCompare", label: "Compare", description: "Side-by-side property comparison" },
    { key: "sidebarTimeline", label: "Timeline", description: "Visual timeline of acquisitions and milestones" },
    { key: "sidebarMapView", label: "Map View", description: "Geographic overview (only for properties with addresses)" },
    { key: "sidebarExecutiveSummary", label: "Executive Summary", description: "High-level portfolio summary report" },
    { key: "sidebarScenarios", label: "My Scenarios", description: "Saved scenario snapshots per user" },
    { key: "sidebarUserManual", label: "User Manual", description: "Methodology documentation and help" },
    { key: "showAiAssistant", label: "AI Assistant", description: "Floating AI chat widget available on every page" },
  ];

  return (
    <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]" data-testid="card-sidebar-settings">
      <CardHeader>
        <CardTitle className="font-display flex items-center gap-2"><Settings className="w-5 h-5" /> Navigation Visibility</CardTitle>
        <CardDescription className="label-text">Toggle which optional pages appear in the sidebar for non-admin users. Core pages (Dashboard, Properties, Management Co., Settings, Profile, Admin Settings) are always visible.</CardDescription>
      </CardHeader>
      <CardContent className="relative space-y-1">
        {sidebarToggles.map((toggle) => {
          const isOn = globalAssumptions?.[toggle.key] !== false;
          return (
            <div
              key={toggle.key}
              className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-primary/5 transition-colors"
              data-testid={`sidebar-toggle-${toggle.key}`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-foreground font-medium text-sm">{toggle.label}</p>
                <p className="text-muted-foreground text-xs mt-0.5">{toggle.description}</p>
              </div>
              <Switch
                checked={isOn}
                onCheckedChange={(checked) => {
                  updateSidebarMutation.mutate({ [toggle.key]: checked });
                }}
                className="data-[state=checked]:bg-primary"
                data-testid={`switch-${toggle.key}`}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}