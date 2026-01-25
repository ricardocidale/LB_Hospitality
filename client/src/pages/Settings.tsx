import Layout from "@/components/Layout";
import { useGlobalAssumptions, useUpdateGlobalAssumptions, useProperties, useUpdateProperty } from "@/lib/api";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
          toast({
            title: "Global Assumptions Updated",
            description: "All financial projections have been recalculated.",
          });
          setGlobalDraft(null);
        }
      });
    }
  };

  const handleSaveProperty = (id: number) => {
    if (propertyDrafts[id]) {
      updateProperty.mutate({ id, data: propertyDrafts[id] }, {
        onSuccess: () => {
          toast({
            title: "Property Updated",
            description: "Financial projections have been recalculated.",
          });
          setPropertyDrafts({ ...propertyDrafts, [id]: undefined });
        }
      });
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-3xl font-serif text-primary">Model Assumptions</h2>
                <p className="text-muted-foreground">Global variables driving the financial engine.</p>
            </div>
        </div>

        <Tabs defaultValue="global" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="global" data-testid="tab-global">Global Assumptions</TabsTrigger>
            <TabsTrigger value="properties" data-testid="tab-properties">Property Variables</TabsTrigger>
          </TabsList>

          <TabsContent value="global" className="space-y-6 mt-6">
            <GlassCard className="p-6">
               <CardHeader className="px-0 pt-0">
                  <CardTitle>Macroeconomic & Fees</CardTitle>
                  <CardDescription>Inflation and management fee structures.</CardDescription>
               </CardHeader>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Annual Inflation Rate</Label>
                    <Input 
                        type="number" 
                        step="0.001" 
                        value={currentGlobal.inflationRate} 
                        onChange={(e) => handleGlobalChange("inflationRate", e.target.value)}
                        className="glass-input"
                        data-testid="input-inflation"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Base Management Fee</Label>
                    <Input 
                        type="number" 
                        step="0.001" 
                        value={currentGlobal.baseManagementFee} 
                        onChange={(e) => handleGlobalChange("baseManagementFee", e.target.value)}
                        className="glass-input"
                        data-testid="input-base-fee"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Incentive Fee (% of GOP)</Label>
                    <Input 
                        type="number" 
                        step="0.001" 
                        value={currentGlobal.incentiveManagementFee} 
                        onChange={(e) => handleGlobalChange("incentiveManagementFee", e.target.value)}
                        className="glass-input"
                        data-testid="input-incentive-fee"
                    />
                  </div>
               </div>
               <div className="mt-6">
                  <Button onClick={handleSaveGlobal} className="gap-2" disabled={!globalDraft || updateGlobal.isPending} data-testid="button-save-global">
                      {updateGlobal.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
                  </Button>
               </div>
            </GlassCard>

            <GlassCard className="p-6">
               <CardHeader className="px-0 pt-0">
                  <CardTitle>Debt & Financing</CardTitle>
                  <CardDescription>Standard loan terms for acquisitions.</CardDescription>
               </CardHeader>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Interest Rate</Label>
                    <Input 
                        type="number" 
                        step="0.001" 
                        value={currentGlobal.debtAssumptions.interestRate} 
                        onChange={(e) => handleNestedChange("debtAssumptions", "interestRate", e.target.value)}
                        className="glass-input"
                        data-testid="input-interest-rate"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Amortization (Years)</Label>
                    <Input 
                        type="number" 
                        value={currentGlobal.debtAssumptions.amortizationYears} 
                        onChange={(e) => handleNestedChange("debtAssumptions", "amortizationYears", e.target.value)}
                        className="glass-input"
                        data-testid="input-amortization"
                    />
                  </div>
               </div>
            </GlassCard>
          </TabsContent>

          <TabsContent value="properties" className="space-y-6 mt-6">
            {properties.map((property) => {
              const draft = propertyDrafts[property.id] || {};
              const current = { ...property, ...draft };
              
              return (
                <GlassCard key={property.id} className="p-6">
                    <div className="flex items-center gap-4 mb-6 pb-4 border-b border-border/50">
                        <img src={property.imageUrl} className="w-16 h-16 rounded-lg object-cover" />
                        <div>
                            <h3 className="text-lg font-serif font-bold">{property.name}</h3>
                            <p className="text-sm text-muted-foreground">{property.location}</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         <div className="space-y-2">
                            <Label>Start ADR ($)</Label>
                            <Input 
                                type="number" 
                                value={current.startAdr} 
                                onChange={(e) => handlePropertyChange(property.id, "startAdr", e.target.value)}
                                className="glass-input"
                                data-testid={`input-adr-${property.id}`}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>ADR Growth Rate</Label>
                            <Input 
                                type="number" 
                                step="0.001"
                                value={current.adrGrowthRate} 
                                onChange={(e) => handlePropertyChange(property.id, "adrGrowthRate", e.target.value)}
                                className="glass-input"
                                data-testid={`input-growth-${property.id}`}
                            />
                        </div>
                         <div className="space-y-2">
                            <Label>Max Occupancy</Label>
                            <Input 
                                type="number" 
                                step="0.01"
                                value={current.maxOccupancy} 
                                onChange={(e) => handlePropertyChange(property.id, "maxOccupancy", e.target.value)}
                                className="glass-input"
                                data-testid={`input-occupancy-${property.id}`}
                            />
                        </div>
                         <div className="space-y-2">
                            <Label>Purchase Price</Label>
                            <Input 
                                type="number" 
                                value={current.purchasePrice} 
                                onChange={(e) => handlePropertyChange(property.id, "purchasePrice", e.target.value)}
                                className="glass-input"
                                data-testid={`input-price-${property.id}`}
                            />
                        </div>
                         <div className="space-y-2">
                            <Label>Improvement Budget</Label>
                            <Input 
                                type="number" 
                                value={current.buildingImprovements} 
                                onChange={(e) => handlePropertyChange(property.id, "buildingImprovements", e.target.value)}
                                className="glass-input"
                                data-testid={`input-improvements-${property.id}`}
                            />
                        </div>
                    </div>
                    
                    <div className="mt-6">
                      <Button 
                        onClick={() => handleSaveProperty(property.id)} 
                        className="gap-2" 
                        disabled={!propertyDrafts[property.id] || updateProperty.isPending}
                        data-testid={`button-save-property-${property.id}`}
                      >
                          {updateProperty.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
                          Save Changes
                      </Button>
                    </div>
                </GlassCard>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
