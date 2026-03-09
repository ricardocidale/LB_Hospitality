/**
 * NavigationTab.tsx — Sidebar navigation visibility controls.
 *
 * Lets admins toggle which pages appear in the sidebar for non-admin users.
 * For example, the "Property Finder" or "Management Co." pages can be
 * hidden if they're not relevant to a particular deployment.
 *
 * Each toggleable page has:
 *   • Page key (e.g. "propertyFinder", "company", "companyAssumptions")
 *   • Display name
 *   • Current visibility state (shown / hidden)
 *
 * Hidden pages are still accessible via direct URL (this is a UX
 * simplification, not a security control). Admin users always see
 * all pages regardless of these settings.
 *
 * Settings are persisted server-side at GET/PATCH /api/admin/navigation.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { IconSettingsGear } from "@/components/icons";import { invalidateAllFinancialQueries } from "@/lib/api";

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
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...globalAssumptions, ...updates }),
      });
      if (!res.ok) throw new Error("Failed to update sidebar settings");
      return res.json();
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ["globalAssumptions"] });
      const prev = queryClient.getQueryData(["globalAssumptions"]);
      queryClient.setQueryData(["globalAssumptions"], (old: any) => ({ ...old, ...updates }));
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(["globalAssumptions"], context.prev);
      toast({ title: "Error", description: "Failed to save sidebar settings.", variant: "destructive" });
    },
    onSettled: () => {
      invalidateAllFinancialQueries(queryClient);
      toast({ title: "Sidebar updated", description: "Navigation visibility saved for all users." });
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
    { key: "sidebarResearch", label: "Research Center", description: "AI-powered market research hub for properties and industry data" },
    { key: "showAiAssistant", label: "AI Assistant", description: "Floating AI chat widget available on every page" },
  ];

  return (
    <Card className="bg-card border border-border/80 shadow-sm" data-testid="card-sidebar-settings">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2"><IconSettingsGear className="w-5 h-5" /> Navigation Visibility</CardTitle>
        <CardDescription className="label-text">Toggle which optional pages appear in the sidebar for non-admin users. Core pages (Dashboard, Properties, Management Co., Settings, Profile, Admin Settings) are always visible.</CardDescription>
      </CardHeader>
      <CardContent className="relative space-y-1">
        {sidebarToggles.map((toggle) => {
          const isOn = globalAssumptions?.[toggle.key] !== false;
          return (
            <div
              key={toggle.key}
              className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-muted transition-colors"
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