;
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SaveButton } from "@/components/ui/save-button";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { IconSliders } from "@/components/icons/brand-icons";
import { SettingsTabProps } from "./types";

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
            <HelpTooltip text="Control whether formula breakdowns and help icons are visible in financial reports. When turned on, tables show expandable rows with step-by-step calculations and help icons explaining each line item. When turned off, tables display clean numbers only — ideal for investor presentations." manualSection="financial-statements" />
          </CardTitle>
          <CardDescription className="label-text">Show or hide the formula verification details and help icons in financial statements.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <Label className="label-text font-medium flex items-center gap-1">Management Company Reports <HelpTooltip text="When ON, the Company page financial statements show expandable formula rows and help icons that explain how each line item is calculated. Turn OFF for a clean investor-ready view with numbers only." /></Label>
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
              <Label className="label-text font-medium flex items-center gap-1">Property Reports <HelpTooltip text="When ON, all property-level financial statements show expandable formula rows and help icons that explain how each line item is calculated — including fixed-cost escalation factors and revenue breakdowns. Turn OFF for clean investor presentations across all properties." /></Label>
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

      <SaveButton 
        onClick={handleSaveGlobal} 
        disabled={!globalDraft} 
        isPending={updateGlobalPending} 
      />
    </div>
  );
}
