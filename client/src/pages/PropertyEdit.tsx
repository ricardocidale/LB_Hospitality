import Layout from "@/components/Layout";
import { useProperty, useUpdateProperty } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Link, useRoute, useLocation } from "wouter";
import { useState, useEffect } from "react";

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

  const handleSave = () => {
    updateProperty.mutate({ id: propertyId, data: draft }, {
      onSuccess: () => {
        toast({ title: "Saved", description: "Property variables updated successfully." });
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
          <h2 className="text-3xl font-serif font-bold text-foreground">Edit Property Variables</h2>
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
              <div className="space-y-2">
                <Label>Catering Level</Label>
                <Select value={draft.cateringLevel} onValueChange={(v) => handleChange("cateringLevel", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full">Full Service</SelectItem>
                    <SelectItem value="Partial">Partial Service</SelectItem>
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
                  <div className="space-y-2">
                    <Label>Will this property be refinanced?</Label>
                    <Select value={draft.willRefinance || "No"} onValueChange={(v) => handleChange("willRefinance", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="No">No</SelectItem>
                        <SelectItem value="Yes">Yes</SelectItem>
                      </SelectContent>
                    </Select>
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
            <CardTitle>Cost Adjustments</CardTitle>
            <CardDescription>Location-specific cost multipliers (1.0 = baseline)</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Labor Cost Adjustment</Label>
              <Input type="number" step="0.01" value={draft.laborAdj} onChange={(e) => handleNumberChange("laborAdj", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Utilities Adjustment</Label>
              <Input type="number" step="0.01" value={draft.utilitiesAdj} onChange={(e) => handleNumberChange("utilitiesAdj", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Property Tax Adjustment</Label>
              <Input type="number" step="0.01" value={draft.taxAdj} onChange={(e) => handleNumberChange("taxAdj", e.target.value)} />
            </div>
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
