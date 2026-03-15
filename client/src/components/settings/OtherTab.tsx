import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SaveButton } from "@/components/ui/save-button";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { IconSliders, IconCompass } from "@/components/icons";
import { SettingsTabProps } from "./types";
import { useAuth } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";

export function OtherTab({
  currentGlobal,
  handleGlobalChange,
  handleSaveGlobal,
  globalDraft,
  updateGlobalPending,
}: SettingsTabProps & {
  handleSaveGlobal: () => void;
  updateGlobalPending: boolean;
}) {
  return (
    <div className="space-y-6 mt-6">
      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <IconSliders className="w-5 h-5 text-primary" />
            Calculation Transparency
            <InfoTooltip text="Control whether formula breakdowns and help icons are visible in financial reports. When turned on, tables show expandable rows with step-by-step calculations and help icons explaining each line item. When turned off, tables display clean numbers only — ideal for investor presentations." manualSection="financial-statements" />
          </CardTitle>
          <CardDescription className="label-text">Show or hide the formula verification details and help icons in financial statements.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <Label className="label-text font-medium flex items-center gap-1">Management Company Reports <InfoTooltip text="When ON, the Company page financial statements show expandable formula rows and help icons that explain how each line item is calculated. Turn OFF for a clean investor-ready view with numbers only." /></Label>
              <p className="text-xs text-muted-foreground mt-0.5">Income statement, cash flow, and balance sheet on the Company page</p>
            </div>
            <Switch
              checked={currentGlobal.showCompanyCalculationDetails ?? true}
              onCheckedChange={(checked) => handleGlobalChange("showCompanyCalculationDetails", checked)}
              data-testid="switch-company-calc-details"
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <Label className="label-text font-medium flex items-center gap-1">Property Reports <InfoTooltip text="When ON, all property-level financial statements show expandable formula rows and help icons that explain how each line item is calculated — including fixed-cost escalation factors and revenue breakdowns. Turn OFF for clean investor presentations across all properties." /></Label>
              <p className="text-xs text-muted-foreground mt-0.5">All property-level income statements, cash flows, and balance sheets</p>
            </div>
            <Switch
              checked={currentGlobal.showPropertyCalculationDetails ?? true}
              onCheckedChange={(checked) => handleGlobalChange("showPropertyCalculationDetails", checked)}
              data-testid="switch-property-calc-details"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <IconSliders className="w-5 h-5 text-primary" />
            Research Automation
            <InfoTooltip text="Control automatic AI research refresh behavior. When enabled, the system checks whether any research (property, company, or global) is stale after login and automatically triggers a refresh overlay." />
          </CardTitle>
          <CardDescription className="label-text">Configure automatic research refresh behavior on login.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <Label className="label-text font-medium flex items-center gap-1">Auto-refresh research on login <InfoTooltip text="When ON, the system checks after each login whether any research (property, company, or global) hasn't been refreshed in the last 30 business days and automatically triggers a full refresh. When OFF, this post-login staleness check and overlay are completely skipped." /></Label>
              <p className="text-xs text-muted-foreground mt-0.5">Automatically refresh stale research data after login (checks every 30 business days)</p>
            </div>
            <Switch
              checked={currentGlobal.autoResearchRefreshEnabled ?? true}
              onCheckedChange={(checked) => handleGlobalChange("autoResearchRefreshEnabled", checked)}
              data-testid="switch-auto-research-refresh"
            />
          </div>
        </CardContent>
      </Card>

      <TourPromptCard />

      <SaveButton 
        onClick={handleSaveGlobal} 
        disabled={!globalDraft} 
        isPending={updateGlobalPending} 
      />
    </div>
  );
}

function TourPromptCard() {
  const { user, refetch } = useAuth();
  const queryClient = useQueryClient();
  const hideTour = user?.hideTourPrompt ?? false;

  const handleToggle = async (showOnLogin: boolean) => {
    await fetch("/api/profile/tour-prompt", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hide: !showOnLogin }),
      credentials: "include",
    });
    queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    refetch();
  };

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <IconCompass className="w-5 h-5 text-primary" />
          Guided Tour
          <InfoTooltip text="Control whether the guided tour prompt appears when you log in. If you previously dismissed the tour with 'Don't show this again', you can re-enable it here." />
        </CardTitle>
        <CardDescription className="label-text">Manage the welcome tour prompt shown on login.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div>
            <Label className="label-text font-medium flex items-center gap-1">Show tour prompt on login <InfoTooltip text="When ON, you'll see a prompt offering a guided tour of the platform each time you log in. When OFF, the tour prompt is suppressed. You can always start the tour manually from the sidebar." /></Label>
            <p className="text-xs text-muted-foreground mt-0.5">Display the guided walkthrough offer after signing in</p>
          </div>
          <Switch
            checked={!hideTour}
            onCheckedChange={handleToggle}
            data-testid="switch-tour-prompt"
          />
        </div>
      </CardContent>
    </Card>
  );
}
