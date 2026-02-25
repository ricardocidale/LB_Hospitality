import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SaveButton } from "@/components/ui/save-button";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { SettingsTabProps } from "./types";

export function MacroTab({
  currentGlobal,
  setGlobalDraft,
  handleGlobalChange,
  handleSaveGlobal,
  globalDraft,
  updateGlobalPending,
}: SettingsTabProps & { 
  setGlobalDraft: (draft: any) => void;
  handleSaveGlobal: () => void;
  updateGlobalPending: boolean;
}) {
  return (
    <div className="space-y-6 mt-6">
      <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
        <CardHeader>
          <CardTitle className="font-display">Economic Assumptions</CardTitle>
          <CardDescription className="label-text">Market-wide economic factors affecting the model</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="label-text">Fiscal Year Start Month</Label>
              <HelpTooltip text="The month when the fiscal year begins. Financial statements will group data into fiscal years starting from this month." />
            </div>
            <Select
              value={String(currentGlobal.fiscalYearStartMonth ?? 1)}
              onValueChange={(val) => setGlobalDraft({ ...currentGlobal, fiscalYearStartMonth: parseInt(val) })}
            >
              <SelectTrigger data-testid="select-fiscal-year-month">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">January</SelectItem>
                <SelectItem value="2">February</SelectItem>
                <SelectItem value="3">March</SelectItem>
                <SelectItem value="4">April</SelectItem>
                <SelectItem value="5">May</SelectItem>
                <SelectItem value="6">June</SelectItem>
                <SelectItem value="7">July</SelectItem>
                <SelectItem value="8">August</SelectItem>
                <SelectItem value="9">September</SelectItem>
                <SelectItem value="10">October</SelectItem>
                <SelectItem value="11">November</SelectItem>
                <SelectItem value="12">December</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="label-text flex items-center gap-1">Inflation Escalator Factor <HelpTooltip text="Annual inflation rate that escalates fixed operating costs (Admin & General, Property Ops, Insurance, Taxes, IT, Utilities-fixed, Other) each year. Fixed costs use Year 1 base dollar amounts × (1 + this rate)^year. Based on CPI forecasts — the Federal Reserve targets 2% annually." manualSection="global-assumptions" /></Label>
              <span className="text-sm font-mono text-primary">{(currentGlobal.inflationRate * 100).toFixed(1)}%</span>
            </div>
            <Slider 
              value={[currentGlobal.inflationRate * 100]}
              onValueChange={(vals) => handleGlobalChange("inflationRate", (vals[0] / 100).toString())}
              min={0}
              max={10}
              step={0.1}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>10%</span>
            </div>
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
