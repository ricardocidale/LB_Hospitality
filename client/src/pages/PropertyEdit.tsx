import Layout from "@/components/Layout";
import { useProperty, useUpdateProperty, useGlobalAssumptions } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Link, useRoute, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

function formatMoneyInput(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function parseMoneyInput(value: string): number {
  return parseFloat(value.replace(/,/g, '')) || 0;
}

export default function PropertyEdit() {
  const [, params] = useRoute("/property/:id/edit");
  const [, setLocation] = useLocation();
  const propertyId = params?.id ? parseInt(params.id) : 0;
  
  const { data: property, isLoading } = useProperty(propertyId);
  const { data: globalAssumptions } = useGlobalAssumptions();
  const updateProperty = useUpdateProperty();
  const { toast } = useToast();
  
  const [draft, setDraft] = useState<any>(null);

  useEffect(() => {
    if (property && !draft) {
      setDraft({ ...property });
    }
  }, [property]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!property || !draft) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
          <h2 className="text-2xl font-serif font-bold">Property Not Found</h2>
          <Link href="/portfolio">
            <Button>Return to Portfolio</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const handleChange = (key: string, value: string | number) => {
    setDraft({ ...draft, [key]: value });
  };

  const handleNumberChange = (key: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setDraft({ ...draft, [key]: numValue });
    }
  };

  const getCostRateTotal = () => {
    return (
      (draft?.costRateRooms ?? 0.36) +
      (draft?.costRateFB ?? 0.15) +
      (draft?.costRateAdmin ?? 0.08) +
      (draft?.costRateMarketing ?? 0.05) +
      (draft?.costRatePropertyOps ?? 0.04) +
      (draft?.costRateUtilities ?? 0.05) +
      (draft?.costRateInsurance ?? 0.02) +
      (draft?.costRateTaxes ?? 0.03) +
      (draft?.costRateIT ?? 0.02) +
      (draft?.costRateFFE ?? 0.04)
    );
  };

  const handleSave = () => {
    updateProperty.mutate({ id: propertyId, data: draft }, {
      onSuccess: () => {
        toast({ title: "Saved", description: "Property assumptions updated successfully." });
        setLocation(`/property/${propertyId}`);
      }
    });
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <Link href={`/property/${propertyId}`}>
            <Button variant="ghost" className="pl-0">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Property
            </Button>
          </Link>
          <Button onClick={handleSave} disabled={updateProperty.isPending}>
            {updateProperty.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>

        <div>
          <h2 className="text-3xl font-serif font-bold text-foreground">Property Assumptions</h2>
          <p className="text-muted-foreground mt-1">{property.name}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Property identification and location details</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Property Name</Label>
              <Input value={draft.name} onChange={(e) => handleChange("name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={draft.location} onChange={(e) => handleChange("location", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Market</Label>
              <Input value={draft.market} onChange={(e) => handleChange("market", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input value={draft.imageUrl} onChange={(e) => handleChange("imageUrl", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={draft.status} onValueChange={(v) => handleChange("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Acquisition">Acquisition</SelectItem>
                  <SelectItem value="Development">Development</SelectItem>
                  <SelectItem value="Operational">Operational</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Room Count</Label>
              <Input type="number" value={draft.roomCount} onChange={(e) => handleNumberChange("roomCount", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
            <CardDescription>Acquisition and operations schedule</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Acquisition Date</Label>
              <Input type="date" value={draft.acquisitionDate} onChange={(e) => handleChange("acquisitionDate", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Operations Start Date</Label>
              <Input type="date" value={draft.operationsStartDate} onChange={(e) => handleChange("operationsStartDate", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Capital Structure</CardTitle>
            <CardDescription>Purchase and investment details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Purchase Price ($)</Label>
                <Input 
                  value={formatMoneyInput(draft.purchasePrice)} 
                  onChange={(e) => handleNumberChange("purchasePrice", parseMoneyInput(e.target.value).toString())} 
                />
              </div>
              <div className="space-y-2">
                <Label>Building Improvements ($)</Label>
                <Input 
                  value={formatMoneyInput(draft.buildingImprovements)} 
                  onChange={(e) => handleNumberChange("buildingImprovements", parseMoneyInput(e.target.value).toString())} 
                />
              </div>
              <div className="space-y-2">
                <Label>Pre-Opening Costs ($)</Label>
                <Input 
                  value={formatMoneyInput(draft.preOpeningCosts)} 
                  onChange={(e) => handleNumberChange("preOpeningCosts", parseMoneyInput(e.target.value).toString())} 
                />
              </div>
              <div className="space-y-2">
                <Label>Operating Reserve ($)</Label>
                <Input 
                  value={formatMoneyInput(draft.operatingReserve)} 
                  onChange={(e) => handleNumberChange("operatingReserve", parseMoneyInput(e.target.value).toString())} 
                />
              </div>
              <div className="space-y-2">
                <Label>Financing Type</Label>
                <Select value={draft.type} onValueChange={(v) => handleChange("type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full Equity">Full Equity</SelectItem>
                    <SelectItem value="Financed">Financed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {draft.type === "Financed" && (
              <div className="border-t pt-6">
                <h4 className="font-medium mb-4">Acquisition Financing</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Loan-to-Value (LTV) %</Label>
                    <Input 
                      type="number" 
                      step="0.01"
                      value={((draft.acquisitionLTV || 0.75) * 100).toFixed(0)} 
                      onChange={(e) => handleNumberChange("acquisitionLTV", (parseFloat(e.target.value) / 100).toString())} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Interest Rate (%)</Label>
                    <Input 
                      type="number" 
                      step="0.01"
                      value={((draft.acquisitionInterestRate || 0.09) * 100).toFixed(2)} 
                      onChange={(e) => handleNumberChange("acquisitionInterestRate", (parseFloat(e.target.value) / 100).toString())} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Loan Term (Years)</Label>
                    <Input 
                      type="number" 
                      value={draft.acquisitionTermYears || 25} 
                      onChange={(e) => handleNumberChange("acquisitionTermYears", e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Closing Costs (%)</Label>
                    <Input 
                      type="number" 
                      step="0.01"
                      value={((draft.acquisitionClosingCostRate || 0.02) * 100).toFixed(1)} 
                      onChange={(e) => handleNumberChange("acquisitionClosingCostRate", (parseFloat(e.target.value) / 100).toString())} 
                    />
                  </div>
                </div>
              </div>
            )}

            {draft.type === "Full Equity" && (
              <div className="border-t pt-6">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label>Will this property be refinanced?</Label>
                    <RadioGroup 
                      value={draft.willRefinance || "No"} 
                      onValueChange={(v) => handleChange("willRefinance", v)}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Yes" id="refinance-yes" />
                        <Label htmlFor="refinance-yes" className="font-normal cursor-pointer">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="No" id="refinance-no" />
                        <Label htmlFor="refinance-no" className="font-normal cursor-pointer">No</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {draft.willRefinance === "Yes" && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-4">Refinance Terms</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label>Refinance Date</Label>
                          <Input 
                            type="date" 
                            value={draft.refinanceDate || (() => {
                              const opsDate = new Date(draft.operationsStartDate);
                              opsDate.setFullYear(opsDate.getFullYear() + 3);
                              return opsDate.toISOString().split('T')[0];
                            })()} 
                            onChange={(e) => handleChange("refinanceDate", e.target.value)} 
                          />
                          <p className="text-xs text-muted-foreground">Suggested: 3 years after operations start</p>
                        </div>
                        <div className="space-y-2">
                          <Label>Loan-to-Value (LTV) %</Label>
                          <Input 
                            type="number" 
                            step="0.01"
                            value={((draft.refinanceLTV || 0.75) * 100).toFixed(0)} 
                            onChange={(e) => handleNumberChange("refinanceLTV", (parseFloat(e.target.value) / 100).toString())} 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Interest Rate (%)</Label>
                          <Input 
                            type="number" 
                            step="0.01"
                            value={((draft.refinanceInterestRate || 0.09) * 100).toFixed(2)} 
                            onChange={(e) => handleNumberChange("refinanceInterestRate", (parseFloat(e.target.value) / 100).toString())} 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Loan Term (Years)</Label>
                          <Input 
                            type="number" 
                            value={draft.refinanceTermYears || 25} 
                            onChange={(e) => handleNumberChange("refinanceTermYears", e.target.value)} 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Closing Costs (%)</Label>
                          <Input 
                            type="number" 
                            step="0.01"
                            value={((draft.refinanceClosingCostRate || 0.03) * 100).toFixed(1)} 
                            onChange={(e) => handleNumberChange("refinanceClosingCostRate", (parseFloat(e.target.value) / 100).toString())} 
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Assumptions</CardTitle>
            <CardDescription>ADR and occupancy projections</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Starting ADR ($)</Label>
              <Input 
                value={formatMoneyInput(draft.startAdr)} 
                onChange={(e) => handleNumberChange("startAdr", parseMoneyInput(e.target.value).toString())} 
              />
            </div>
            <div className="space-y-2">
              <Label>ADR Annual Growth (%)</Label>
              <Input type="number" step="0.001" value={(draft.adrGrowthRate * 100).toFixed(1)} onChange={(e) => handleNumberChange("adrGrowthRate", (parseFloat(e.target.value) / 100).toString())} />
            </div>
            <div className="space-y-2">
              <Label>Starting Occupancy (%)</Label>
              <Input type="number" step="0.01" value={(draft.startOccupancy * 100).toFixed(0)} onChange={(e) => handleNumberChange("startOccupancy", (parseFloat(e.target.value) / 100).toString())} />
            </div>
            <div className="space-y-2">
              <Label>Max Occupancy (%)</Label>
              <Input type="number" step="0.01" value={(draft.maxOccupancy * 100).toFixed(0)} onChange={(e) => handleNumberChange("maxOccupancy", (parseFloat(e.target.value) / 100).toString())} />
            </div>
            <div className="space-y-2">
              <Label>Occupancy Ramp (Months)</Label>
              <Input type="number" value={draft.occupancyRampMonths} onChange={(e) => handleNumberChange("occupancyRampMonths", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Occupancy Growth Step (%)</Label>
              <Input type="number" step="0.01" value={(draft.occupancyGrowthStep * 100).toFixed(0)} onChange={(e) => handleNumberChange("occupancyGrowthStep", (parseFloat(e.target.value) / 100).toString())} />
            </div>
            <div className="space-y-2">
              <Label>Stabilization Period (Months)</Label>
              <Input type="number" value={draft.stabilizationMonths} onChange={(e) => handleNumberChange("stabilizationMonths", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              Revenue Streams
              <HelpTooltip text="Configure how much additional revenue each stream generates as a percentage of rooms revenue. F&B revenue gets boosted based on what percentage of events require catering." />
            </CardTitle>
            <CardDescription>
              Additional revenue as percentage of rooms revenue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  Events Revenue (%)
                  <HelpTooltip text="Revenue from meetings, weddings, and other events as a percentage of rooms revenue. This is independent of catering." />
                </Label>
                <Input 
                  type="number" 
                  step="1" 
                  value={((draft.revShareEvents ?? 0.43) * 100).toFixed(0)} 
                  onChange={(e) => handleNumberChange("revShareEvents", (parseFloat(e.target.value) / 100).toString())} 
                />
                <p className="text-xs text-muted-foreground">Meetings, weddings, conferences</p>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  F&B Revenue (%)
                  <HelpTooltip text="Base food & beverage revenue as a percentage of rooms revenue. This gets boosted by catering at events (see catering mix below)." />
                </Label>
                <Input 
                  type="number" 
                  step="1" 
                  value={((draft.revShareFB ?? 0.22) * 100).toFixed(0)} 
                  onChange={(e) => handleNumberChange("revShareFB", (parseFloat(e.target.value) / 100).toString())} 
                />
                <p className="text-xs text-muted-foreground">Restaurant, bar, room service</p>
              </div>
              <div className="space-y-2">
                <Label>Other Revenue (%)</Label>
                <Input 
                  type="number" 
                  step="1" 
                  value={((draft.revShareOther ?? 0.07) * 100).toFixed(0)} 
                  onChange={(e) => handleNumberChange("revShareOther", (parseFloat(e.target.value) / 100).toString())} 
                />
                <p className="text-xs text-muted-foreground">Spa, parking, activities</p>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <Label className="flex items-center gap-1 mb-3">
                Event Catering Mix
                <HelpTooltip text="What percentage of events at this property require catering. Full catering provides complete F&B service and boosts F&B revenue more. Partial catering includes limited offerings. The remaining events require no catering. Total cannot exceed 100%." />
              </Label>
              {(() => {
                const fullPct = (draft.fullCateringPercent ?? 0.40) * 100;
                const partialPct = (draft.partialCateringPercent ?? 0.30) * 100;
                const totalPct = fullPct + partialPct;
                const noCateringPct = Math.max(0, 100 - totalPct);
                
                return (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">% of Events with Full Catering</Label>
                        <div className="flex items-center gap-3">
                          <Slider 
                            value={[fullPct]}
                            onValueChange={(vals: number[]) => {
                              const newFull = vals[0];
                              const maxFull = 100 - partialPct;
                              handleChange("fullCateringPercent", (Math.min(newFull, maxFull) / 100).toString());
                            }}
                            min={0}
                            max={100 - partialPct}
                            step={5}
                            className="flex-1"
                          />
                          <span className="text-sm font-semibold text-primary w-12 text-right">{fullPct.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">% of Events with Partial Catering</Label>
                        <div className="flex items-center gap-3">
                          <Slider 
                            value={[partialPct]}
                            onValueChange={(vals: number[]) => {
                              const newPartial = vals[0];
                              const maxPartial = 100 - fullPct;
                              handleChange("partialCateringPercent", (Math.min(newPartial, maxPartial) / 100).toString());
                            }}
                            min={0}
                            max={100 - fullPct}
                            step={5}
                            className="flex-1"
                          />
                          <span className="text-sm font-semibold text-primary w-12 text-right">{partialPct.toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 p-2 bg-muted rounded text-sm flex justify-between items-center">
                      <span className="text-muted-foreground">No catering required:</span>
                      <span className="font-medium">{noCateringPct.toFixed(0)}% of events</span>
                    </div>
                  </>
                );
              })()}
              {globalAssumptions && (
                <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
                  <div className="text-muted-foreground text-xs mb-2">F&B Boost Factors (from Global Assumptions):</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Full Catering Boost:</span>
                      <span className="font-medium">+{((globalAssumptions.fullCateringFBBoost ?? 0.50) * 100).toFixed(0)}% to F&B</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Partial Catering Boost:</span>
                      <span className="font-medium">+{((globalAssumptions.partialCateringFBBoost ?? 0.25) * 100).toFixed(0)}% to F&B</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              Operating Cost Rates
              <HelpTooltip text="These percentages represent the portion of revenue allocated to each expense category for this property." />
            </CardTitle>
            <CardDescription>
              Expense allocation as percentage of revenue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {(() => {
              const costRateTotal = (
                (draft.costRateRooms ?? 0.36) +
                (draft.costRateFB ?? 0.15) +
                (draft.costRateAdmin ?? 0.08) +
                (draft.costRateMarketing ?? 0.05) +
                (draft.costRatePropertyOps ?? 0.04) +
                (draft.costRateUtilities ?? 0.05) +
                (draft.costRateInsurance ?? 0.02) +
                (draft.costRateTaxes ?? 0.03) +
                (draft.costRateIT ?? 0.02) +
                (draft.costRateFFE ?? 0.04)
              );
              
              return (
                <>
                  <div className="p-4 rounded-lg bg-muted border">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total Allocation:</span>
                      <span className="text-lg font-bold text-primary">
                        {(costRateTotal * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="space-y-2">
                      <Label>Rooms Dept</Label>
                      <Input 
                        type="number" 
                        step="0.1" 
                        value={((draft.costRateRooms ?? 0.36) * 100).toFixed(1)} 
                        onChange={(e) => handleNumberChange("costRateRooms", (parseFloat(e.target.value) / 100).toString())} 
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                    <div className="space-y-2">
                      <Label>F&B</Label>
                      <Input 
                        type="number" 
                        step="0.1" 
                        value={((draft.costRateFB ?? 0.15) * 100).toFixed(1)} 
                        onChange={(e) => handleNumberChange("costRateFB", (parseFloat(e.target.value) / 100).toString())} 
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                    <div className="space-y-2">
                      <Label>Admin</Label>
                      <Input 
                        type="number" 
                        step="0.1" 
                        value={((draft.costRateAdmin ?? 0.08) * 100).toFixed(1)} 
                        onChange={(e) => handleNumberChange("costRateAdmin", (parseFloat(e.target.value) / 100).toString())} 
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                    <div className="space-y-2">
                      <Label>Marketing</Label>
                      <Input 
                        type="number" 
                        step="0.1" 
                        value={((draft.costRateMarketing ?? 0.05) * 100).toFixed(1)} 
                        onChange={(e) => handleNumberChange("costRateMarketing", (parseFloat(e.target.value) / 100).toString())} 
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                    <div className="space-y-2">
                      <Label>Property Ops</Label>
                      <Input 
                        type="number" 
                        step="0.1" 
                        value={((draft.costRatePropertyOps ?? 0.04) * 100).toFixed(1)} 
                        onChange={(e) => handleNumberChange("costRatePropertyOps", (parseFloat(e.target.value) / 100).toString())} 
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                    <div className="space-y-2">
                      <Label>Utilities</Label>
                      <Input 
                        type="number" 
                        step="0.1" 
                        value={((draft.costRateUtilities ?? 0.05) * 100).toFixed(1)} 
                        onChange={(e) => handleNumberChange("costRateUtilities", (parseFloat(e.target.value) / 100).toString())} 
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                    <div className="space-y-2">
                      <Label>Insurance</Label>
                      <Input 
                        type="number" 
                        step="0.1" 
                        value={((draft.costRateInsurance ?? 0.02) * 100).toFixed(1)} 
                        onChange={(e) => handleNumberChange("costRateInsurance", (parseFloat(e.target.value) / 100).toString())} 
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                    <div className="space-y-2">
                      <Label>Taxes</Label>
                      <Input 
                        type="number" 
                        step="0.1" 
                        value={((draft.costRateTaxes ?? 0.03) * 100).toFixed(1)} 
                        onChange={(e) => handleNumberChange("costRateTaxes", (parseFloat(e.target.value) / 100).toString())} 
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                    <div className="space-y-2">
                      <Label>IT</Label>
                      <Input 
                        type="number" 
                        step="0.1" 
                        value={((draft.costRateIT ?? 0.02) * 100).toFixed(1)} 
                        onChange={(e) => handleNumberChange("costRateIT", (parseFloat(e.target.value) / 100).toString())} 
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                    <div className="space-y-2">
                      <Label>FF&E Reserve</Label>
                      <Input 
                        type="number" 
                        step="0.1" 
                        value={((draft.costRateFFE ?? 0.04) * 100).toFixed(1)} 
                        onChange={(e) => handleNumberChange("costRateFFE", (parseFloat(e.target.value) / 100).toString())} 
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>

        <div className="flex justify-end pb-8">
          <Button onClick={handleSave} disabled={updateProperty.isPending} size="lg">
            {updateProperty.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save All Changes
          </Button>
        </div>
      </div>
    </Layout>
  );
}
