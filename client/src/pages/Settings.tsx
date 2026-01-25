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
          toast({ title: "Saved", description: "Global assumptions updated." });
          setGlobalDraft(null);
        }
      });
    }
  };

  const handleSaveProperty = (id: number) => {
    if (propertyDrafts[id]) {
      updateProperty.mutate({ id, data: propertyDrafts[id] }, {
        onSuccess: () => {
          toast({ title: "Saved", description: "Property updated." });
          setPropertyDrafts({ ...propertyDrafts, [id]: undefined });
        }
      });
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Model Variables</h2>
          <p className="text-muted-foreground text-sm">Configure assumptions driving the financial model</p>
        </div>

        <Tabs defaultValue="global" className="w-full">
          <TabsList className="bg-secondary">
            <TabsTrigger value="global">Global Assumptions</TabsTrigger>
            <TabsTrigger value="properties">Property Variables</TabsTrigger>
          </TabsList>

          <TabsContent value="global" className="space-y-4 mt-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Macroeconomic & Fees</CardTitle>
                <CardDescription>Inflation and management fee structures</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Annual Inflation Rate</Label>
                  <Input 
                    type="number" 
                    step="0.001" 
                    value={currentGlobal.inflationRate} 
                    onChange={(e) => handleGlobalChange("inflationRate", e.target.value)}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Base Management Fee (%)</Label>
                  <Input 
                    type="number" 
                    step="0.001" 
                    value={currentGlobal.baseManagementFee} 
                    onChange={(e) => handleGlobalChange("baseManagementFee", e.target.value)}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Incentive Fee (% of GOP)</Label>
                  <Input 
                    type="number" 
                    step="0.001" 
                    value={currentGlobal.incentiveManagementFee} 
                    onChange={(e) => handleGlobalChange("incentiveManagementFee", e.target.value)}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Marketing Rate (%)</Label>
                  <Input 
                    type="number" 
                    step="0.001" 
                    value={currentGlobal.marketingRate} 
                    onChange={(e) => handleGlobalChange("marketingRate", e.target.value)}
                    className="bg-secondary border-border"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Debt & Financing</CardTitle>
                <CardDescription>Standard loan terms</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Interest Rate</Label>
                  <Input 
                    type="number" 
                    step="0.001" 
                    value={currentGlobal.debtAssumptions.interestRate} 
                    onChange={(e) => handleNestedChange("debtAssumptions", "interestRate", e.target.value)}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Amortization (Years)</Label>
                  <Input 
                    type="number" 
                    value={currentGlobal.debtAssumptions.amortizationYears} 
                    onChange={(e) => handleNestedChange("debtAssumptions", "amortizationYears", e.target.value)}
                    className="bg-secondary border-border"
                  />
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleSaveGlobal} disabled={!globalDraft || updateGlobal.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {updateGlobal.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </TabsContent>

          <TabsContent value="properties" className="space-y-4 mt-4">
            {properties.map((property) => {
              const draft = propertyDrafts[property.id] || {};
              const current = { ...property, ...draft };
              
              return (
                <Card key={property.id} className="bg-card border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <img src={property.imageUrl} className="w-12 h-12 rounded object-cover" />
                      <div>
                        <CardTitle className="text-base">{property.name}</CardTitle>
                        <CardDescription>{property.location}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Start ADR ($)</Label>
                        <Input 
                          type="number" 
                          value={current.startAdr} 
                          onChange={(e) => handlePropertyChange(property.id, "startAdr", e.target.value)}
                          className="bg-secondary border-border"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">ADR Growth Rate</Label>
                        <Input 
                          type="number" 
                          step="0.001"
                          value={current.adrGrowthRate} 
                          onChange={(e) => handlePropertyChange(property.id, "adrGrowthRate", e.target.value)}
                          className="bg-secondary border-border"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Max Occupancy</Label>
                        <Input 
                          type="number" 
                          step="0.01"
                          value={current.maxOccupancy} 
                          onChange={(e) => handlePropertyChange(property.id, "maxOccupancy", e.target.value)}
                          className="bg-secondary border-border"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Purchase Price</Label>
                        <Input 
                          type="number" 
                          value={current.purchasePrice} 
                          onChange={(e) => handlePropertyChange(property.id, "purchasePrice", e.target.value)}
                          className="bg-secondary border-border"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Improvements</Label>
                        <Input 
                          type="number" 
                          value={current.buildingImprovements} 
                          onChange={(e) => handlePropertyChange(property.id, "buildingImprovements", e.target.value)}
                          className="bg-secondary border-border"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Room Count</Label>
                        <Input 
                          type="number" 
                          value={current.roomCount} 
                          onChange={(e) => handlePropertyChange(property.id, "roomCount", e.target.value)}
                          className="bg-secondary border-border"
                        />
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => handleSaveProperty(property.id)} 
                      disabled={!propertyDrafts[property.id] || updateProperty.isPending}
                      className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
                      size="sm"
                    >
                      {updateProperty.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Save
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
