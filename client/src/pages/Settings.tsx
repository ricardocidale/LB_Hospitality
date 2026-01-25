import Layout from "@/components/Layout";
import { useStore } from "@/lib/store";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

export default function Settings() {
  const { global, updateGlobal, properties, updateProperty } = useStore();
  const { toast } = useToast();

  // Simple handler for numeric inputs
  const handleGlobalChange = (key: keyof typeof global, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
       updateGlobal({ [key]: numValue });
    }
  };

  const handlePropertyChange = (id: string, key: string, value: string) => {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
          updateProperty(id, { [key]: numValue });
      }
  };

  const handleSave = () => {
    toast({
        title: "Models Updated",
        description: "All financial projections have been recalculated based on new inputs.",
    });
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-3xl font-serif text-primary">Model Assumptions</h2>
                <p className="text-muted-foreground">Global variables driving the financial engine.</p>
            </div>
            <Button onClick={handleSave} className="gap-2">
                <Save className="w-4 h-4" /> Save Changes
            </Button>
        </div>

        <Tabs defaultValue="global" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="global">Global Assumptions</TabsTrigger>
            <TabsTrigger value="properties">Property Variables</TabsTrigger>
          </TabsList>

          <TabsContent value="global" className="space-y-6 mt-6">
            <GlassCard className="p-6">
               <CardHeader className="px-0 pt-0">
                  <CardTitle>Macroeconomic & Fees</CardTitle>
                  <CardDescription>Inflation and management fee structures.</CardDescription>
               </CardHeader>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Annual Inflation Rate (Decimal)</Label>
                    <Input 
                        type="number" 
                        step="0.001" 
                        value={global.inflationRate} 
                        onChange={(e) => handleGlobalChange("inflationRate", e.target.value)}
                        className="glass-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Base Management Fee</Label>
                    <Input 
                        type="number" 
                        step="0.001" 
                        value={global.baseManagementFee} 
                        onChange={(e) => handleGlobalChange("baseManagementFee", e.target.value)}
                        className="glass-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Incentive Fee (% of GOP)</Label>
                    <Input 
                        type="number" 
                        step="0.001" 
                        value={global.incentiveManagementFee} 
                        onChange={(e) => handleGlobalChange("incentiveManagementFee", e.target.value)}
                        className="glass-input"
                    />
                  </div>
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
                        value={global.debtAssumptions.interestRate} 
                         onChange={(e) => updateGlobal({ 
                            debtAssumptions: { ...global.debtAssumptions, interestRate: parseFloat(e.target.value) } 
                        })}
                        className="glass-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Amortization (Years)</Label>
                    <Input 
                        type="number" 
                        value={global.debtAssumptions.amortizationYears} 
                         onChange={(e) => updateGlobal({ 
                            debtAssumptions: { ...global.debtAssumptions, amortizationYears: parseFloat(e.target.value) } 
                        })}
                        className="glass-input"
                    />
                  </div>
               </div>
            </GlassCard>
          </TabsContent>

          <TabsContent value="properties" className="space-y-6 mt-6">
            {properties.map((property) => (
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
                                value={property.startAdr} 
                                onChange={(e) => handlePropertyChange(property.id, "startAdr", e.target.value)}
                                className="glass-input"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>ADR Growth Rate</Label>
                            <Input 
                                type="number" 
                                step="0.001"
                                value={property.adrGrowthRate} 
                                onChange={(e) => handlePropertyChange(property.id, "adrGrowthRate", e.target.value)}
                                className="glass-input"
                            />
                        </div>
                         <div className="space-y-2">
                            <Label>Max Occupancy</Label>
                            <Input 
                                type="number" 
                                step="0.01"
                                value={property.maxOccupancy} 
                                onChange={(e) => handlePropertyChange(property.id, "maxOccupancy", e.target.value)}
                                className="glass-input"
                            />
                        </div>
                         <div className="space-y-2">
                            <Label>Purchase Price</Label>
                            <Input 
                                type="number" 
                                value={property.purchasePrice} 
                                onChange={(e) => handlePropertyChange(property.id, "purchasePrice", e.target.value)}
                                className="glass-input"
                            />
                        </div>
                         <div className="space-y-2">
                            <Label>Improvement Budget</Label>
                            <Input 
                                type="number" 
                                value={property.buildingImprovements} 
                                onChange={(e) => handlePropertyChange(property.id, "buildingImprovements", e.target.value)}
                                className="glass-input"
                            />
                        </div>
                    </div>
                </GlassCard>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
