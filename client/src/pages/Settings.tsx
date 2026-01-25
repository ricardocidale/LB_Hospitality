import Layout from "@/components/Layout";
import { useGlobalAssumptions, useUpdateGlobalAssumptions, useProperties, useUpdateProperty } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Save, Loader2 } from "lucide-react";
import { useState } from "react";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { Slider } from "@/components/ui/slider";

export default function Settings() {
  const { data: global, isLoading: globalLoading } = useGlobalAssumptions();
  const { data: properties, isLoading: propertiesLoading } = useProperties();
  const updateGlobal = useUpdateGlobalAssumptions();
  const updateProperty = useUpdateProperty();
  const { toast } = useToast();

  const [globalDraft, setGlobalDraft] = useState<any>(null);
  const [propertyDrafts, setPropertyDrafts] = useState<Record<number, any>>({});

  if (globalLoading || propertiesLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!global || !properties) return null;

  const currentGlobal = globalDraft || global;

  const handleGlobalChange = (key: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setGlobalDraft({ ...currentGlobal, [key]: numValue });
    }
  };

  const handleNestedChange = (parent: string, key: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setGlobalDraft({
        ...currentGlobal,
        [parent]: { ...currentGlobal[parent], [key]: numValue }
      });
    }
  };

  const handlePropertyChange = (id: number, key: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setPropertyDrafts({
        ...propertyDrafts,
        [id]: { ...(propertyDrafts[id] || {}), [key]: numValue }
      });
    }
  };

  const handleSaveGlobal = () => {
    if (globalDraft) {
      updateGlobal.mutate(globalDraft, {
        onSuccess: () => {
          toast({ title: "Saved", description: "Global assumptions updated successfully." });
          setGlobalDraft(null);
        }
      });
    }
  };

  const handleSaveProperty = (id: number) => {
    if (propertyDrafts[id]) {
      updateProperty.mutate({ id, data: propertyDrafts[id] }, {
        onSuccess: () => {
          toast({ title: "Saved", description: "Property updated successfully." });
          setPropertyDrafts({ ...propertyDrafts, [id]: undefined });
        }
      });
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h2 className="text-3xl font-serif font-bold text-foreground">Model Assumptions</h2>
          <p className="text-muted-foreground mt-1">Configure variables driving the financial model</p>
        </div>

        <Tabs defaultValue="global" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="global">Global Assumptions</TabsTrigger>
            <TabsTrigger value="properties">Property Variables</TabsTrigger>
          </TabsList>

          <TabsContent value="global" className="space-y-6 mt-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-primary border-b pb-2">Management Company</h3>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  Management Fees
                  <HelpTooltip text="Base Management Fee: A percentage of total revenue paid to the management company for operating the property. Incentive Fee: An additional percentage of Gross Operating Profit (GOP) paid when the property performs well, aligning management incentives with profitability. Marketing Fee: A percentage of revenue allocated to brand marketing, advertising, and sales efforts to drive bookings." />
                </CardTitle>
                <CardDescription>Fee structures for hotel management services</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Base Management Fee</Label>
                    <span className="text-sm font-semibold text-primary">{(currentGlobal.baseManagementFee * 100).toFixed(1)}%</span>
                  </div>
                  <Slider 
                    value={[currentGlobal.baseManagementFee * 100]}
                    onValueChange={(vals) => handleGlobalChange("baseManagementFee", (vals[0] / 100).toString())}
                    min={0}
                    max={10}
                    step={0.1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>10%</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Incentive Fee (% of GOP)</Label>
                    <span className="text-sm font-semibold text-primary">{(currentGlobal.incentiveManagementFee * 100).toFixed(1)}%</span>
                  </div>
                  <Slider 
                    value={[currentGlobal.incentiveManagementFee * 100]}
                    onValueChange={(vals) => handleGlobalChange("incentiveManagementFee", (vals[0] / 100).toString())}
                    min={0}
                    max={20}
                    step={0.5}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>20%</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Marketing Fee</Label>
                    <span className="text-sm font-semibold text-primary">{(currentGlobal.marketingRate * 100).toFixed(1)}%</span>
                  </div>
                  <Slider 
                    value={[currentGlobal.marketingRate * 100]}
                    onValueChange={(vals) => handleGlobalChange("marketingRate", (vals[0] / 100).toString())}
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

            <div className="mb-4 mt-8">
              <h3 className="text-lg font-semibold text-primary border-b pb-2">Property Portfolio</h3>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  Disposition
                  <HelpTooltip text="When a property is sold, real estate commissions are paid to brokers/realtors who facilitate the transaction. This is typically a percentage of the sale price, split between buyer's and seller's agents." />
                </CardTitle>
                <CardDescription>Costs associated with property sales</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Real Estate Commission</Label>
                    <span className="text-sm font-semibold text-primary">{((currentGlobal.commissionRate || 0.05) * 100).toFixed(1)}%</span>
                  </div>
                  <Slider 
                    value={[(currentGlobal.commissionRate || 0.05) * 100]}
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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  Acquisition Financing
                  <HelpTooltip text="These are the default loan terms applied when acquiring a property with financing. LTV (Loan-to-Value) determines what percentage of the purchase price is financed vs. paid in equity. Interest Rate is the annual rate charged on the loan. Amortization is the period over which the loan is repaid. Closing Costs include lender fees, legal fees, and other transaction costs." />
                </CardTitle>
                <CardDescription>Default loan terms for property acquisitions</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>LTV</Label>
                    <span className="text-sm font-semibold text-primary">{((currentGlobal.debtAssumptions?.acqLTV || 0.65) * 100).toFixed(0)}%</span>
                  </div>
                  <Slider 
                    value={[(currentGlobal.debtAssumptions?.acqLTV || 0.65) * 100]}
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
                    <Label>Interest Rate</Label>
                    <span className="text-sm font-semibold text-primary">{((currentGlobal.debtAssumptions?.interestRate || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <Slider 
                    value={[(currentGlobal.debtAssumptions?.interestRate || 0) * 100]}
                    onValueChange={(vals) => handleNestedChange("debtAssumptions", "interestRate", (vals[0] / 100).toString())}
                    min={0}
                    max={15}
                    step={0.25}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>15%</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Term</Label>
                    <span className="text-sm font-semibold text-primary">{currentGlobal.debtAssumptions?.amortizationYears || 25} yrs</span>
                  </div>
                  <Slider 
                    value={[currentGlobal.debtAssumptions?.amortizationYears || 25]}
                    onValueChange={(vals) => handleNestedChange("debtAssumptions", "amortizationYears", vals[0].toString())}
                    min={5}
                    max={30}
                    step={1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>5 yrs</span>
                    <span>30 yrs</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Closing Costs</Label>
                    <span className="text-sm font-semibold text-primary">{((currentGlobal.debtAssumptions?.acqClosingCostRate || 0.02) * 100).toFixed(1)}%</span>
                  </div>
                  <Slider 
                    value={[(currentGlobal.debtAssumptions?.acqClosingCostRate || 0.02) * 100]}
                    onValueChange={(vals) => handleNestedChange("debtAssumptions", "acqClosingCostRate", (vals[0] / 100).toString())}
                    min={0}
                    max={5}
                    step={0.25}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>5%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  Refinancing
                  <HelpTooltip text="Refinancing allows properties acquired with full equity to obtain debt later, or properties with existing debt to restructure their loans. The refinance period specifies when refinancing typically occurs after acquisition. Refinancing can return capital to investors while leveraging the property's appreciated value. Closing Costs include lender fees, legal fees, and other transaction costs." />
                </CardTitle>
                <CardDescription>Default terms for refinancing properties</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Years After Acq.</Label>
                    <span className="text-sm font-semibold text-primary">{currentGlobal.debtAssumptions?.refiPeriodYears || 3} yrs</span>
                  </div>
                  <Slider 
                    value={[currentGlobal.debtAssumptions?.refiPeriodYears || 3]}
                    onValueChange={(vals) => handleNestedChange("debtAssumptions", "refiPeriodYears", vals[0].toString())}
                    min={1}
                    max={10}
                    step={1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1</span>
                    <span>10</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>LTV</Label>
                    <span className="text-sm font-semibold text-primary">{((currentGlobal.debtAssumptions?.refiLTV || 0.65) * 100).toFixed(0)}%</span>
                  </div>
                  <Slider 
                    value={[(currentGlobal.debtAssumptions?.refiLTV || 0.65) * 100]}
                    onValueChange={(vals) => handleNestedChange("debtAssumptions", "refiLTV", (vals[0] / 100).toString())}
                    min={0}
                    max={80}
                    step={5}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>80%</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Interest Rate</Label>
                    <span className="text-sm font-semibold text-primary">{((currentGlobal.debtAssumptions?.refiInterestRate || 0.065) * 100).toFixed(1)}%</span>
                  </div>
                  <Slider 
                    value={[(currentGlobal.debtAssumptions?.refiInterestRate || 0.065) * 100]}
                    onValueChange={(vals) => handleNestedChange("debtAssumptions", "refiInterestRate", (vals[0] / 100).toString())}
                    min={0}
                    max={15}
                    step={0.25}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>15%</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Term</Label>
                    <span className="text-sm font-semibold text-primary">{currentGlobal.debtAssumptions?.refiAmortizationYears || 25} yrs</span>
                  </div>
                  <Slider 
                    value={[currentGlobal.debtAssumptions?.refiAmortizationYears || 25]}
                    onValueChange={(vals) => handleNestedChange("debtAssumptions", "refiAmortizationYears", vals[0].toString())}
                    min={5}
                    max={30}
                    step={1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>5</span>
                    <span>30</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Closing Costs</Label>
                    <span className="text-sm font-semibold text-primary">{((currentGlobal.debtAssumptions?.refiClosingCostRate || 0.02) * 100).toFixed(1)}%</span>
                  </div>
                  <Slider 
                    value={[(currentGlobal.debtAssumptions?.refiClosingCostRate || 0.02) * 100]}
                    onValueChange={(vals) => handleNestedChange("debtAssumptions", "refiClosingCostRate", (vals[0] / 100).toString())}
                    min={0}
                    max={5}
                    step={0.25}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>5%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  Base Cost Rates
                  <HelpTooltip text="These are the standard operating cost percentages applied to all properties as a baseline. Each percentage represents a portion of total revenue allocated to that expense category. Individual properties can adjust these using their Property Cost Adjustments." />
                </CardTitle>
                <CardDescription>Standard operating cost percentages (as % of revenue)</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label>Rooms Dept (%)</Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    value={((currentGlobal.baseRoomsCostRate ?? 0.36) * 100).toFixed(1)} 
                    onChange={(e) => handleGlobalChange("baseRoomsCostRate", (parseFloat(e.target.value) / 100).toString())}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Utilities (%)</Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    value={((currentGlobal.baseUtilitiesRate ?? 0.05) * 100).toFixed(1)} 
                    onChange={(e) => handleGlobalChange("baseUtilitiesRate", (parseFloat(e.target.value) / 100).toString())}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Property Tax (%)</Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    value={((currentGlobal.baseTaxRate ?? 0.03) * 100).toFixed(1)} 
                    onChange={(e) => handleGlobalChange("baseTaxRate", (parseFloat(e.target.value) / 100).toString())}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Admin (%)</Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    value={((currentGlobal.baseAdminRate ?? 0.08) * 100).toFixed(1)} 
                    onChange={(e) => handleGlobalChange("baseAdminRate", (parseFloat(e.target.value) / 100).toString())}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Property Ops (%)</Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    value={((currentGlobal.basePropertyOpsRate ?? 0.04) * 100).toFixed(1)} 
                    onChange={(e) => handleGlobalChange("basePropertyOpsRate", (parseFloat(e.target.value) / 100).toString())}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Insurance (%)</Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    value={((currentGlobal.baseInsuranceRate ?? 0.02) * 100).toFixed(1)} 
                    onChange={(e) => handleGlobalChange("baseInsuranceRate", (parseFloat(e.target.value) / 100).toString())}
                  />
                </div>
                <div className="space-y-2">
                  <Label>IT (%)</Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    value={((currentGlobal.baseITRate ?? 0.02) * 100).toFixed(1)} 
                    onChange={(e) => handleGlobalChange("baseITRate", (parseFloat(e.target.value) / 100).toString())}
                  />
                </div>
                <div className="space-y-2">
                  <Label>FF&E Reserve (%)</Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    value={((currentGlobal.baseFFERate ?? 0.04) * 100).toFixed(1)} 
                    onChange={(e) => handleGlobalChange("baseFFERate", (parseFloat(e.target.value) / 100).toString())}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="mb-4 mt-8">
              <h3 className="text-lg font-semibold text-primary border-b pb-2">Macroeconomic</h3>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Economic Assumptions</CardTitle>
                <CardDescription>Market-wide economic factors affecting the model</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Annual Inflation Rate</Label>
                    <span className="text-sm font-semibold text-primary">{(currentGlobal.inflationRate * 100).toFixed(1)}%</span>
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

            <Button onClick={handleSaveGlobal} disabled={!globalDraft || updateGlobal.isPending}>
              {updateGlobal.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Global Changes
            </Button>
          </TabsContent>

          <TabsContent value="properties" className="space-y-6 mt-6">
            {properties.map((property) => {
              const draft = propertyDrafts[property.id] || {};
              const current = { ...property, ...draft };
              
              return (
                <Card key={property.id}>
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <img src={property.imageUrl} className="w-14 h-14 rounded-lg object-cover" />
                      <div>
                        <CardTitle>{property.name}</CardTitle>
                        <CardDescription>{property.location}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Start ADR ($)</Label>
                        <Input 
                          type="number" 
                          value={current.startAdr} 
                          onChange={(e) => handlePropertyChange(property.id, "startAdr", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>ADR Growth Rate</Label>
                        <Input 
                          type="number" 
                          step="0.001"
                          value={current.adrGrowthRate} 
                          onChange={(e) => handlePropertyChange(property.id, "adrGrowthRate", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Occupancy</Label>
                        <Input 
                          type="number" 
                          step="0.01"
                          value={current.maxOccupancy} 
                          onChange={(e) => handlePropertyChange(property.id, "maxOccupancy", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Purchase Price</Label>
                        <Input 
                          type="number" 
                          value={current.purchasePrice} 
                          onChange={(e) => handlePropertyChange(property.id, "purchasePrice", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Improvement Budget</Label>
                        <Input 
                          type="number" 
                          value={current.buildingImprovements} 
                          onChange={(e) => handlePropertyChange(property.id, "buildingImprovements", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Room Count</Label>
                        <Input 
                          type="number" 
                          value={current.roomCount} 
                          onChange={(e) => handlePropertyChange(property.id, "roomCount", e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => handleSaveProperty(property.id)} 
                      disabled={!propertyDrafts[property.id] || updateProperty.isPending}
                      className="mt-4"
                      size="sm"
                    >
                      {updateProperty.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Save Changes
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
