import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { Hotel } from "lucide-react";
import { DEFAULT_COMMISSION_RATE, DEFAULT_LTV, DEFAULT_ACQ_CLOSING_COST_RATE, DEFAULT_REFI_LTV, DEFAULT_REFI_CLOSING_COST_RATE } from "@/lib/constants";
import { SettingsTabProps } from "./types";

export function PortfolioTab({
  currentGlobal,
  handleGlobalChange,
  handleNestedChange,
}: SettingsTabProps) {
  return (
    <div className="space-y-6 mt-6">
      <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Hotel className="w-5 h-5 text-primary" />
            General Property Description
            <HelpTooltip text="Defines the target property profile for the portfolio. These parameters guide market research searches, comp set analysis, and financial benchmarks." manualSection="global-assumptions" />
          </CardTitle>
          <CardDescription className="label-text">Characterize the target property profile for the portfolio</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="label-text flex items-center gap-1">Minimum Rooms <HelpTooltip text="Minimum number of guest rooms for the target property profile. Used to filter market research and comparable properties." /></Label>
                <span className="text-sm font-mono text-primary">{currentGlobal.assetDefinition?.minRooms ?? 10}</span>
              </div>
              <Slider
                value={[currentGlobal.assetDefinition?.minRooms ?? 10]}
                onValueChange={(vals) => handleNestedChange("assetDefinition", "minRooms", vals[0].toString())}
                min={5}
                max={50}
                step={5}
                data-testid="slider-asset-min-rooms"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>5</span>
                <span>50</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="label-text flex items-center gap-1">Maximum Rooms <HelpTooltip text="Maximum number of guest rooms for the target property profile. Defines the upper bound for comp set analysis." /></Label>
                <span className="text-sm font-mono text-primary">{currentGlobal.assetDefinition?.maxRooms ?? 80}</span>
              </div>
              <Slider
                value={[currentGlobal.assetDefinition?.maxRooms ?? 80]}
                onValueChange={(vals) => handleNestedChange("assetDefinition", "maxRooms", vals[0].toString())}
                min={20}
                max={200}
                step={10}
                data-testid="slider-asset-max-rooms"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>20</span>
                <span>200</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="label-text flex items-center gap-1">Minimum ADR <HelpTooltip text="Minimum Average Daily Rate target. Sets the floor for market research rate comparisons." /></Label>
                <span className="text-sm font-mono text-primary">${currentGlobal.assetDefinition?.minAdr ?? 150}</span>
              </div>
              <Slider
                value={[currentGlobal.assetDefinition?.minAdr ?? 150]}
                onValueChange={(vals) => handleNestedChange("assetDefinition", "minAdr", vals[0].toString())}
                min={50}
                max={500}
                step={25}
                data-testid="slider-asset-min-adr"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>$50</span>
                <span>$500</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="label-text flex items-center gap-1">Maximum ADR <HelpTooltip text="Maximum Average Daily Rate target. Sets the ceiling for market research rate comparisons." /></Label>
                <span className="text-sm font-mono text-primary">${currentGlobal.assetDefinition?.maxAdr ?? 600}</span>
              </div>
              <Slider
                value={[currentGlobal.assetDefinition?.maxAdr ?? 600]}
                onValueChange={(vals) => handleNestedChange("assetDefinition", "maxAdr", vals[0].toString())}
                min={200}
                max={1500}
                step={50}
                data-testid="slider-asset-max-adr"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>$200</span>
                <span>$1,500</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <Label className="label-text flex items-center gap-1">Food & Beverage (F&B) <HelpTooltip text="Whether target properties include Food & Beverage operations like restaurants and bars." /></Label>
              <Switch
                checked={currentGlobal.assetDefinition?.hasFB ?? true}
                onCheckedChange={(checked) => handleNestedChange("assetDefinition", "hasFB", checked)}
                data-testid="switch-asset-fb"
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <Label className="label-text flex items-center gap-1">Event Hosting <HelpTooltip text="Whether target properties host events such as weddings, corporate meetings, and social gatherings." /></Label>
              <Switch
                checked={currentGlobal.assetDefinition?.hasEvents ?? true}
                onCheckedChange={(checked) => handleNestedChange("assetDefinition", "hasEvents", checked)}
                data-testid="switch-asset-events"
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <Label className="label-text flex items-center gap-1">Wellness Programming <HelpTooltip text="Whether target properties include spa or wellness services like massage, yoga, and fitness programs." /></Label>
              <Switch
                checked={currentGlobal.assetDefinition?.hasWellness ?? true}
                onCheckedChange={(checked) => handleNestedChange("assetDefinition", "hasWellness", checked)}
                data-testid="switch-asset-wellness"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="label-text flex items-center gap-1">Property Level <HelpTooltip text="Service tier classification: Budget, Average, or Luxury. Affects comp set selection and benchmark ranges." /></Label>
              <RadioGroup
                value={currentGlobal.assetDefinition?.level ?? "luxury"}
                onValueChange={(val) => handleNestedChange("assetDefinition", "level", val)}
                className="flex gap-6"
                data-testid="radio-asset-level"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="budget" id="level-budget" data-testid="radio-asset-level-budget" />
                  <Label htmlFor="level-budget" className="label-text cursor-pointer">Budget</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="average" id="level-average" data-testid="radio-asset-level-average" />
                  <Label htmlFor="level-average" className="label-text cursor-pointer">Average</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="luxury" id="level-luxury" data-testid="radio-asset-level-luxury" />
                  <Label htmlFor="level-luxury" className="label-text cursor-pointer">Luxury</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-3">
              <Label className="label-text flex items-center gap-1">Privacy Level <HelpTooltip text="Level of guest privacy: High for secluded estates, Moderate for suburban settings, Low for urban locations." /></Label>
              <RadioGroup
                value={currentGlobal.assetDefinition?.privacyLevel ?? "high"}
                onValueChange={(val) => handleNestedChange("assetDefinition", "privacyLevel", val)}
                className="flex gap-6"
                data-testid="radio-asset-privacy"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="low" id="privacy-low" data-testid="radio-asset-privacy-low" />
                  <Label htmlFor="privacy-low" className="label-text cursor-pointer">Low</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="moderate" id="privacy-moderate" data-testid="radio-asset-privacy-moderate" />
                  <Label htmlFor="privacy-moderate" className="label-text cursor-pointer">Moderate</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="high" id="privacy-high" data-testid="radio-asset-privacy-high" />
                  <Label htmlFor="privacy-high" className="label-text cursor-pointer">High</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="label-text flex items-center gap-1">Event Locations <HelpTooltip text="Number of distinct event spaces available on the property (ballrooms, gardens, terraces, etc.)." /></Label>
                <span className="text-sm font-mono text-primary">{currentGlobal.assetDefinition?.eventLocations ?? 2}</span>
              </div>
              <Slider
                value={[currentGlobal.assetDefinition?.eventLocations ?? 2]}
                onValueChange={(vals) => handleNestedChange("assetDefinition", "eventLocations", vals[0].toString())}
                min={0}
                max={10}
                step={1}
                data-testid="slider-asset-event-locations"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span>10</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="label-text flex items-center gap-1">Max Event Capacity <HelpTooltip text="Maximum number of guests that can be accommodated at events across all event spaces." /></Label>
                <span className="text-sm font-mono text-primary">{currentGlobal.assetDefinition?.maxEventCapacity ?? 150}</span>
              </div>
              <Slider
                value={[currentGlobal.assetDefinition?.maxEventCapacity ?? 150]}
                onValueChange={(vals) => handleNestedChange("assetDefinition", "maxEventCapacity", vals[0].toString())}
                min={20}
                max={500}
                step={10}
                data-testid="slider-asset-max-event-capacity"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>20</span>
                <span>500</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="label-text flex items-center gap-1">Parking Spaces <HelpTooltip text="Number of on-site parking spaces available for guests and event attendees." /></Label>
                <span className="text-sm font-mono text-primary">{currentGlobal.assetDefinition?.parkingSpaces ?? 50}</span>
              </div>
              <Slider
                value={[currentGlobal.assetDefinition?.parkingSpaces ?? 50]}
                onValueChange={(vals) => handleNestedChange("assetDefinition", "parkingSpaces", vals[0].toString())}
                min={0}
                max={200}
                step={5}
                data-testid="slider-asset-parking"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span>200</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="label-text flex items-center gap-1">Acreage <HelpTooltip text="Total property land area in acres. Larger acreage typically supports more amenities and privacy." /></Label>
                <span className="text-sm font-mono text-primary">{currentGlobal.assetDefinition?.acreage ?? 5} acres</span>
              </div>
              <Slider
                value={[currentGlobal.assetDefinition?.acreage ?? 5]}
                onValueChange={(vals) => handleNestedChange("assetDefinition", "acreage", vals[0].toString())}
                min={1}
                max={100}
                step={1}
                data-testid="slider-asset-acreage"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 acre</span>
                <span>100 acres</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="label-text flex items-center gap-1">Definition Summary <HelpTooltip text="Free-text description of the target property concept. Included in AI research prompts for more relevant market analysis." /></Label>
            <Textarea
              value={currentGlobal.assetDefinition?.description ?? ""}
              onChange={(e) => handleNestedChange("assetDefinition", "description", e.target.value)}
              rows={3}
              className="bg-white text-sm"
              data-testid="textarea-boutique-description"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
        <CardHeader>
          <CardTitle className="flex items-center font-display">
            Disposition — Defaults for New Properties
            <HelpTooltip text="Default sale commission for newly created properties. Each property can override this in its own settings." manualSection="global-assumptions" />
          </CardTitle>
          <CardDescription className="label-text">Default costs applied to new properties at creation. Override per property in Property Edit.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="label-text flex items-center gap-1">Real Estate Commission <HelpTooltip text="Broker commission percentage paid on property sale. Industry standard is 4–6%, split between buyer's and seller's agents." /></Label>
              <span className="text-sm font-mono text-primary">{((currentGlobal.commissionRate || DEFAULT_COMMISSION_RATE) * 100).toFixed(1)}%</span>
            </div>
            <Slider 
              value={[(currentGlobal.commissionRate || DEFAULT_COMMISSION_RATE) * 100]}
              onValueChange={(vals) => handleGlobalChange("commissionRate", (vals[0] / 100).toString())}
              min={0}
              max={10}
              step={0.5}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>10%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
        <CardHeader>
          <CardTitle className="flex items-center font-display">
            Acquisition Financing — Defaults for New Properties
            <HelpTooltip text="Default loan terms applied to newly created properties. Each property can override these in its own settings." />
          </CardTitle>
          <CardDescription className="label-text">Default loan terms applied to new properties at creation. Override per property in Property Edit.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="label-text flex items-center gap-1">LTV <HelpTooltip text="Loan-to-Value ratio — percentage of purchase price financed by debt. Typical hotel acquisitions use 60–75% LTV." /></Label>
              <span className="text-sm font-mono text-primary">{((currentGlobal.debtAssumptions?.acqLTV || DEFAULT_LTV) * 100).toFixed(0)}%</span>
            </div>
            <Slider 
              value={[(currentGlobal.debtAssumptions?.acqLTV || DEFAULT_LTV) * 100]}
              onValueChange={(vals) => handleNestedChange("debtAssumptions", "acqLTV", (vals[0] / 100).toString())}
              min={0}
              max={90}
              step={5}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>90%</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="label-text flex items-center gap-1">Interest Rate <HelpTooltip text="Annual interest rate on the acquisition loan. Market rates vary; currently 6–8% for commercial hospitality loans." /></Label>
              <span className="text-sm font-mono text-primary">{((currentGlobal.debtAssumptions?.interestRate || 0) * 100).toFixed(1)}%</span>
            </div>
            <Slider 
              value={[(currentGlobal.debtAssumptions?.interestRate || 0) * 100]}
              onValueChange={(vals) => handleNestedChange("debtAssumptions", "interestRate", (vals[0] / 100).toString())}
              min={0}
              max={15}
              step={0.25}
            />
            <div className="flex justify-between text-xs text-muted-foreground font-mono">
              <span>0%</span>
              <span>15%</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="label-text flex items-center gap-1">Term <HelpTooltip text="Loan amortization period in years. Standard commercial mortgages use 20–30 year amortization." /></Label>
              <span className="text-sm font-mono text-primary whitespace-nowrap">{currentGlobal.debtAssumptions?.amortizationYears || 25} yrs</span>
            </div>
            <Slider 
              value={[currentGlobal.debtAssumptions?.amortizationYears || 25]}
              onValueChange={(vals) => handleNestedChange("debtAssumptions", "amortizationYears", vals[0].toString())}
              min={5}
              max={30}
              step={1}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="whitespace-nowrap">5 yrs</span>
              <span className="whitespace-nowrap">30 yrs</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="label-text flex items-center gap-1">Closing Costs <HelpTooltip text="Transaction costs as a percentage of loan amount — includes lender fees, legal, appraisal, and title insurance." /></Label>
              <span className="text-sm font-mono text-primary">{((currentGlobal.debtAssumptions?.acqClosingCostRate || DEFAULT_ACQ_CLOSING_COST_RATE) * 100).toFixed(1)}%</span>
            </div>
            <Slider 
              value={[(currentGlobal.debtAssumptions?.acqClosingCostRate || DEFAULT_ACQ_CLOSING_COST_RATE) * 100]}
              onValueChange={(vals) => handleNestedChange("debtAssumptions", "acqClosingCostRate", (vals[0] / 100).toString())}
              min={0}
              max={5}
              step={0.25}
            />
            <div className="flex justify-between text-xs text-muted-foreground font-mono">
              <span>0%</span>
              <span>5%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
        <CardHeader>
          <CardTitle className="flex items-center font-display">
            Refinancing — Defaults for New Properties
            <HelpTooltip text="Default refinancing terms applied to newly created properties. Each property can override these in its own settings." manualSection="funding-financing" />
          </CardTitle>
          <CardDescription className="label-text">Default refinancing terms applied to new properties at creation. Override per property in Property Edit.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="label-text flex items-center gap-1">Years After Acq. <HelpTooltip text="Number of years after acquisition before refinancing. Typically 2–5 years to allow value appreciation." /></Label>
              <span className="text-sm font-mono text-primary whitespace-nowrap">{currentGlobal.debtAssumptions?.refiPeriodYears || 3} yrs</span>
            </div>
            <Slider 
              value={[currentGlobal.debtAssumptions?.refiPeriodYears || 3]}
              onValueChange={(vals) => handleNestedChange("debtAssumptions", "refiPeriodYears", vals[0].toString())}
              min={1}
              max={10}
              step={1}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="whitespace-nowrap">1 yr</span>
              <span className="whitespace-nowrap">10 yrs</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="label-text flex items-center gap-1">Refi LTV <HelpTooltip text="Loan-to-Value ratio for refinancing. Often lower than acquisition LTV (60–70%) to maintain equity buffer." /></Label>
              <span className="text-sm font-mono text-primary">{((currentGlobal.debtAssumptions?.refiLTV || DEFAULT_REFI_LTV) * 100).toFixed(0)}%</span>
            </div>
            <Slider 
              value={[(currentGlobal.debtAssumptions?.refiLTV || DEFAULT_REFI_LTV) * 100]}
              onValueChange={(vals) => handleNestedChange("debtAssumptions", "refiLTV", (vals[0] / 100).toString())}
              min={0}
              max={90}
              step={5}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>90%</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="label-text flex items-center gap-1">Refi Rate <HelpTooltip text="Expected annual interest rate for the refinance loan." /></Label>
              <span className="text-sm font-mono text-primary">{((currentGlobal.debtAssumptions?.refiInterestRate || currentGlobal.debtAssumptions?.interestRate || 0.08) * 100).toFixed(1)}%</span>
            </div>
            <Slider 
              value={[(currentGlobal.debtAssumptions?.refiInterestRate || currentGlobal.debtAssumptions?.interestRate || 0.08) * 100]}
              onValueChange={(vals) => handleNestedChange("debtAssumptions", "refiInterestRate", (vals[0] / 100).toString())}
              min={0}
              max={15}
              step={0.25}
            />
            <div className="flex justify-between text-xs text-muted-foreground font-mono">
              <span>0%</span>
              <span>15%</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="label-text flex items-center gap-1">Refi Term <HelpTooltip text="Amortization period for the refinance loan." /></Label>
              <span className="text-sm font-mono text-primary whitespace-nowrap">{currentGlobal.debtAssumptions?.refiAmortizationYears || currentGlobal.debtAssumptions?.amortizationYears || 25} yrs</span>
            </div>
            <Slider 
              value={[currentGlobal.debtAssumptions?.refiAmortizationYears || currentGlobal.debtAssumptions?.amortizationYears || 25]}
              onValueChange={(vals) => handleNestedChange("debtAssumptions", "refiAmortizationYears", vals[0].toString())}
              min={5}
              max={30}
              step={1}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="whitespace-nowrap">5 yrs</span>
              <span className="whitespace-nowrap">30 yrs</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="label-text flex items-center gap-1">Refi Closing <HelpTooltip text="Refinance closing costs as a percentage of the new loan amount." /></Label>
              <span className="text-sm font-mono text-primary">{((currentGlobal.debtAssumptions?.refiClosingCostRate || DEFAULT_REFI_CLOSING_COST_RATE) * 100).toFixed(1)}%</span>
            </div>
            <Slider 
              value={[(currentGlobal.debtAssumptions?.refiClosingCostRate || DEFAULT_REFI_CLOSING_COST_RATE) * 100]}
              onValueChange={(vals) => handleNestedChange("debtAssumptions", "refiClosingCostRate", (vals[0] / 100).toString())}
              min={0}
              max={5}
              step={0.25}
            />
            <div className="flex justify-between text-xs text-muted-foreground font-mono">
              <span>0%</span>
              <span>5%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
