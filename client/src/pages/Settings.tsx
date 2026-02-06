import Layout from "@/components/Layout";
import { useGlobalAssumptions, useUpdateGlobalAssumptions, useProperties, useUpdateProperty } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X, Building2, BookOpen, Hotel } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "wouter";
import { SaveButton } from "@/components/ui/save-button";
import { GlassButton } from "@/components/ui/glass-button";
import { PageHeader } from "@/components/ui/page-header";
import { useState, useRef } from "react";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DEFAULT_COMMISSION_RATE,
  DEFAULT_LTV,
  DEFAULT_ACQ_CLOSING_COST_RATE,
  DEFAULT_REFI_LTV,
  DEFAULT_INTEREST_RATE,
  DEFAULT_REFI_CLOSING_COST_RATE,
  DEFAULT_FULL_CATERING_BOOST,
  DEFAULT_PARTIAL_CATERING_BOOST,
} from "@/lib/constants";
import { useAuth } from "@/lib/auth";
import defaultLogo from "@/assets/logo.png";

function formatMoneyInput(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function parseMoneyInput(value: string): number {
  return parseFloat(value.replace(/,/g, '')) || 0;
}

export default function Settings() {
  const { data: global, isLoading: globalLoading } = useGlobalAssumptions();
  const { data: properties, isLoading: propertiesLoading } = useProperties();
  const updateGlobal = useUpdateGlobalAssumptions();
  const updateProperty = useUpdateProperty();
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [globalDraft, setGlobalDraft] = useState<any>(null);
  const [propertyDrafts, setPropertyDrafts] = useState<Record<number, any>>({});
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

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
    if (!isNaN(numValue) && key !== "preferredLlm" && key !== "companyName") {
      setGlobalDraft({ ...currentGlobal, [key]: numValue });
    } else {
      setGlobalDraft({ ...currentGlobal, [key]: value });
    }
  };

  const handleNestedChange = (parent: string, key: string, value: string | boolean) => {
    if (typeof value === "boolean") {
      setGlobalDraft({
        ...currentGlobal,
        [parent]: { ...(currentGlobal as any)[parent], [key]: value }
      });
    } else {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        setGlobalDraft({
          ...currentGlobal,
          [parent]: { ...(currentGlobal as any)[parent], [key]: numValue }
        });
      } else {
        setGlobalDraft({
          ...currentGlobal,
          [parent]: { ...(currentGlobal as any)[parent], [key]: value }
        });
      }
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

  const handlePropertyMoneyChange = (id: number, key: string, value: string) => {
    const numValue = parseMoneyInput(value);
    setPropertyDrafts({
      ...propertyDrafts,
      [id]: { ...(propertyDrafts[id] || {}), [key]: numValue }
    });
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

  const handleCompanyNameChange = (value: string) => {
    setGlobalDraft({ ...currentGlobal, companyName: value });
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Please upload a PNG, JPEG, GIF, or WebP image.", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload an image smaller than 5MB.", variant: "destructive" });
      return;
    }

    setIsUploadingLogo(true);
    try {
      const response = await fetch('/api/uploads/request-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          filename: `company-logo-${Date.now()}.${file.name.split('.').pop()}`,
          contentType: file.type,
        }),
      });

      if (!response.ok) throw new Error('Failed to get upload URL');

      const { uploadUrl, publicUrl } = await response.json();

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadResponse.ok) throw new Error('Failed to upload file');

      updateGlobal.mutate({ companyLogo: publicUrl }, {
        onSuccess: () => {
          toast({ title: "Logo uploaded", description: "Company logo has been updated." });
        }
      });
    } catch (error) {
      toast({ title: "Upload failed", description: "Failed to upload logo. Please try again.", variant: "destructive" });
    } finally {
      setIsUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = () => {
    updateGlobal.mutate({ companyLogo: null }, {
      onSuccess: () => {
        toast({ title: "Logo removed", description: "Company logo has been reset to default." });
      }
    });
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl">
        <PageHeader
          title="Global Assumptions"
          subtitle="Configure variables driving the financial model"
          variant="dark"
          actions={
            <div className="flex items-center gap-3">
              <Link href="/global/research">
                <GlassButton variant="primary" data-testid="button-global-research">
                  <BookOpen className="w-4 h-4" />
                  Industry Research
                </GlassButton>
              </Link>
              <SaveButton 
                onClick={handleSaveGlobal} 
                disabled={!globalDraft} 
                isPending={updateGlobal.isPending} 
              />
            </div>
          }
        />

        <Tabs defaultValue="portfolio" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="macro">Macro</TabsTrigger>
            <TabsTrigger value="other">Other</TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio" className="space-y-6 mt-6">
            <Card className="bg-white/80 backdrop-blur-xl border-[#9FBCA4]/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display">
                  <Hotel className="w-5 h-5 text-[#9FBCA4]" />
                  Boutique Hotel Definition
                  <HelpTooltip text="Defines what this model considers a 'boutique hotel.' These parameters guide market research searches, comp set analysis, and financial benchmarks. Boutique hotels are independently operated, design-driven properties focused on curated experiences." />
                </CardTitle>
                <CardDescription className="label-text">Characterize the target property profile for the portfolio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="label-text">Minimum Rooms</Label>
                      <span className="text-sm font-mono text-primary">{currentGlobal.boutiqueDefinition?.minRooms ?? 10}</span>
                    </div>
                    <Slider
                      value={[currentGlobal.boutiqueDefinition?.minRooms ?? 10]}
                      onValueChange={(vals) => handleNestedChange("boutiqueDefinition", "minRooms", vals[0].toString())}
                      min={5}
                      max={50}
                      step={5}
                      data-testid="slider-boutique-min-rooms"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>5</span>
                      <span>50</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="label-text">Maximum Rooms</Label>
                      <span className="text-sm font-mono text-primary">{currentGlobal.boutiqueDefinition?.maxRooms ?? 80}</span>
                    </div>
                    <Slider
                      value={[currentGlobal.boutiqueDefinition?.maxRooms ?? 80]}
                      onValueChange={(vals) => handleNestedChange("boutiqueDefinition", "maxRooms", vals[0].toString())}
                      min={20}
                      max={200}
                      step={10}
                      data-testid="slider-boutique-max-rooms"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>20</span>
                      <span>200</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="label-text">Minimum ADR</Label>
                      <span className="text-sm font-mono text-primary">${currentGlobal.boutiqueDefinition?.minAdr ?? 150}</span>
                    </div>
                    <Slider
                      value={[currentGlobal.boutiqueDefinition?.minAdr ?? 150]}
                      onValueChange={(vals) => handleNestedChange("boutiqueDefinition", "minAdr", vals[0].toString())}
                      min={50}
                      max={500}
                      step={25}
                      data-testid="slider-boutique-min-adr"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>$50</span>
                      <span>$500</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="label-text">Maximum ADR</Label>
                      <span className="text-sm font-mono text-primary">${currentGlobal.boutiqueDefinition?.maxAdr ?? 600}</span>
                    </div>
                    <Slider
                      value={[currentGlobal.boutiqueDefinition?.maxAdr ?? 600]}
                      onValueChange={(vals) => handleNestedChange("boutiqueDefinition", "maxAdr", vals[0].toString())}
                      min={200}
                      max={1500}
                      step={50}
                      data-testid="slider-boutique-max-adr"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>$200</span>
                      <span>$1,500</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <Label className="label-text">Food & Beverage (F&B)</Label>
                    <Switch
                      checked={currentGlobal.boutiqueDefinition?.hasFB ?? true}
                      onCheckedChange={(checked) => handleNestedChange("boutiqueDefinition", "hasFB", checked)}
                      data-testid="switch-boutique-fb"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <Label className="label-text">Event Hosting</Label>
                    <Switch
                      checked={currentGlobal.boutiqueDefinition?.hasEvents ?? true}
                      onCheckedChange={(checked) => handleNestedChange("boutiqueDefinition", "hasEvents", checked)}
                      data-testid="switch-boutique-events"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <Label className="label-text">Wellness Programming</Label>
                    <Switch
                      checked={currentGlobal.boutiqueDefinition?.hasWellness ?? true}
                      onCheckedChange={(checked) => handleNestedChange("boutiqueDefinition", "hasWellness", checked)}
                      data-testid="switch-boutique-wellness"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="label-text">Property Level</Label>
                    <RadioGroup
                      value={currentGlobal.boutiqueDefinition?.level ?? "luxury"}
                      onValueChange={(val) => handleNestedChange("boutiqueDefinition", "level", val)}
                      className="flex gap-6"
                      data-testid="radio-boutique-level"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="budget" id="level-budget" data-testid="radio-boutique-level-budget" />
                        <Label htmlFor="level-budget" className="label-text cursor-pointer">Budget</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="average" id="level-average" data-testid="radio-boutique-level-average" />
                        <Label htmlFor="level-average" className="label-text cursor-pointer">Average</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="luxury" id="level-luxury" data-testid="radio-boutique-level-luxury" />
                        <Label htmlFor="level-luxury" className="label-text cursor-pointer">Luxury</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="space-y-3">
                    <Label className="label-text">Privacy Level</Label>
                    <RadioGroup
                      value={currentGlobal.boutiqueDefinition?.privacyLevel ?? "high"}
                      onValueChange={(val) => handleNestedChange("boutiqueDefinition", "privacyLevel", val)}
                      className="flex gap-6"
                      data-testid="radio-boutique-privacy"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="low" id="privacy-low" data-testid="radio-boutique-privacy-low" />
                        <Label htmlFor="privacy-low" className="label-text cursor-pointer">Low</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="moderate" id="privacy-moderate" data-testid="radio-boutique-privacy-moderate" />
                        <Label htmlFor="privacy-moderate" className="label-text cursor-pointer">Moderate</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="high" id="privacy-high" data-testid="radio-boutique-privacy-high" />
                        <Label htmlFor="privacy-high" className="label-text cursor-pointer">High</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="label-text">Event Locations</Label>
                      <span className="text-sm font-mono text-primary">{currentGlobal.boutiqueDefinition?.eventLocations ?? 2}</span>
                    </div>
                    <Slider
                      value={[currentGlobal.boutiqueDefinition?.eventLocations ?? 2]}
                      onValueChange={(vals) => handleNestedChange("boutiqueDefinition", "eventLocations", vals[0].toString())}
                      min={0}
                      max={10}
                      step={1}
                      data-testid="slider-boutique-event-locations"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0</span>
                      <span>10</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="label-text">Max Event Capacity</Label>
                      <span className="text-sm font-mono text-primary">{currentGlobal.boutiqueDefinition?.maxEventCapacity ?? 150}</span>
                    </div>
                    <Slider
                      value={[currentGlobal.boutiqueDefinition?.maxEventCapacity ?? 150]}
                      onValueChange={(vals) => handleNestedChange("boutiqueDefinition", "maxEventCapacity", vals[0].toString())}
                      min={20}
                      max={500}
                      step={10}
                      data-testid="slider-boutique-max-event-capacity"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>20</span>
                      <span>500</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="label-text">Parking Spaces</Label>
                      <span className="text-sm font-mono text-primary">{currentGlobal.boutiqueDefinition?.parkingSpaces ?? 50}</span>
                    </div>
                    <Slider
                      value={[currentGlobal.boutiqueDefinition?.parkingSpaces ?? 50]}
                      onValueChange={(vals) => handleNestedChange("boutiqueDefinition", "parkingSpaces", vals[0].toString())}
                      min={0}
                      max={200}
                      step={5}
                      data-testid="slider-boutique-parking"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0</span>
                      <span>200</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="label-text">Acreage</Label>
                      <span className="text-sm font-mono text-primary">{currentGlobal.boutiqueDefinition?.acreage ?? 5} acres</span>
                    </div>
                    <Slider
                      value={[currentGlobal.boutiqueDefinition?.acreage ?? 5]}
                      onValueChange={(vals) => handleNestedChange("boutiqueDefinition", "acreage", vals[0].toString())}
                      min={1}
                      max={100}
                      step={1}
                      data-testid="slider-boutique-acreage"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1 acre</span>
                      <span>100 acres</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="label-text">Definition Summary</Label>
                  <Textarea
                    value={currentGlobal.boutiqueDefinition?.description ?? ""}
                    onChange={(e) => handleNestedChange("boutiqueDefinition", "description", e.target.value)}
                    rows={3}
                    className="bg-white text-sm"
                    data-testid="textarea-boutique-description"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-xl border-[#9FBCA4]/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
              <CardHeader>
                <CardTitle className="flex items-center font-display">
                  Disposition
                  <HelpTooltip text="When a property is sold, real estate commissions are paid to brokers/realtors who facilitate the transaction. This is typically a percentage of the sale price, split between buyer's and seller's agents." />
                </CardTitle>
                <CardDescription className="label-text">Costs associated with property sales</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="label-text">Real Estate Commission</Label>
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

            <Card className="bg-white/80 backdrop-blur-xl border-[#9FBCA4]/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
              <CardHeader>
                <CardTitle className="flex items-center font-display">
                  Acquisition Financing
                  <HelpTooltip text="These are the default loan terms applied when acquiring a property with financing. LTV (Loan-to-Value) determines what percentage of the purchase price is financed vs. paid in equity. Interest Rate is the annual rate charged on the loan. Amortization is the period over which the loan is repaid. Closing Costs include lender fees, legal fees, and other transaction costs." />
                </CardTitle>
                <CardDescription className="label-text">Default loan terms for property acquisitions</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="label-text">LTV</Label>
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
                    <Label className="label-text">Interest Rate</Label>
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
                    <Label className="label-text">Term</Label>
                    <span className="text-sm font-mono text-primary">{currentGlobal.debtAssumptions?.amortizationYears || 25} yrs</span>
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
                    <Label className="label-text">Closing Costs</Label>
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

            <Card className="bg-white/80 backdrop-blur-xl border-[#9FBCA4]/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
              <CardHeader>
                <CardTitle className="flex items-center font-display">
                  Refinancing
                  <HelpTooltip text="Refinancing allows properties acquired with full equity to obtain debt later, or properties with existing debt to restructure their loans. The refinance period specifies when refinancing typically occurs after acquisition. Refinancing can return capital to investors while leveraging the property's appreciated value. Closing Costs include lender fees, legal fees, and other transaction costs." />
                </CardTitle>
                <CardDescription className="label-text">Default terms for refinancing properties</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="label-text">Years After Acq.</Label>
                    <span className="text-sm font-mono text-primary">{currentGlobal.debtAssumptions?.refiPeriodYears || 3} yrs</span>
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
                    <Label className="label-text">LTV</Label>
                    <span className="text-sm font-mono text-primary">{((currentGlobal.debtAssumptions?.refiLTV || DEFAULT_REFI_LTV) * 100).toFixed(0)}%</span>
                  </div>
                  <Slider 
                    value={[(currentGlobal.debtAssumptions?.refiLTV || DEFAULT_REFI_LTV) * 100]}
                    onValueChange={(vals) => handleNestedChange("debtAssumptions", "refiLTV", (vals[0] / 100).toString())}
                    min={0}
                    max={80}
                    step={5}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground font-mono">
                    <span>0%</span>
                    <span>80%</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="label-text">Interest Rate</Label>
                    <span className="text-sm font-mono text-primary">{((currentGlobal.debtAssumptions?.refiInterestRate || DEFAULT_INTEREST_RATE) * 100).toFixed(1)}%</span>
                  </div>
                  <Slider 
                    value={[(currentGlobal.debtAssumptions?.refiInterestRate || DEFAULT_INTEREST_RATE) * 100]}
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
                    <Label className="label-text">Term</Label>
                    <span className="text-sm font-mono text-primary">{currentGlobal.debtAssumptions?.refiAmortizationYears || 25} yrs</span>
                  </div>
                  <Slider 
                    value={[currentGlobal.debtAssumptions?.refiAmortizationYears || 25]}
                    onValueChange={(vals) => handleNestedChange("debtAssumptions", "refiAmortizationYears", vals[0].toString())}
                    min={5}
                    max={30}
                    step={1}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground font-mono">
                    <span>5</span>
                    <span>30</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="label-text">Closing Costs</Label>
                    <span className="text-sm font-mono text-primary">{((currentGlobal.debtAssumptions?.refiClosingCostRate || DEFAULT_REFI_CLOSING_COST_RATE) * 100).toFixed(1)}%</span>
                  </div>
                  <Slider 
                    value={[(currentGlobal.debtAssumptions?.refiClosingCostRate || DEFAULT_REFI_CLOSING_COST_RATE) * 100]}
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

            <SaveButton 
              onClick={handleSaveGlobal} 
              disabled={!globalDraft} 
              isPending={updateGlobal.isPending} 
            />
          </TabsContent>

          <TabsContent value="macro" className="space-y-6 mt-6">
            <Card className="bg-white/80 backdrop-blur-xl border-[#9FBCA4]/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
              <CardHeader>
                <CardTitle className="font-display">Economic Assumptions</CardTitle>
                <CardDescription className="label-text">Market-wide economic factors affecting the model</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <Label className="label-text">Annual Inflation Rate</Label>
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
              isPending={updateGlobal.isPending} 
            />
          </TabsContent>

          <TabsContent value="other" className="space-y-6 mt-6">
            <Card className="bg-white/80 backdrop-blur-xl border-[#9FBCA4]/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display">
                  <Building2 className="w-5 h-5 text-[#9FBCA4]" />
                  Company Branding
                  <HelpTooltip text="Customize your company name and logo. These appear in the navigation sidebar throughout the application." />
                </CardTitle>
                <CardDescription className="label-text">Set your company name and logo for the application branding.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="label-text">Hospitality Management Company Name</Label>
                    {isAdmin ? (
                      <Input
                        id="companyName"
                        value={currentGlobal.companyName || "L+B Hospitality"}
                        onChange={(e) => handleCompanyNameChange(e.target.value)}
                        placeholder="Enter company name"
                        className="bg-white"
                        data-testid="input-company-name"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-500 text-sm">
                        {currentGlobal.companyName || "L+B Hospitality"}
                        <span className="ml-2 text-xs">(Admin only)</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="label-text">Company Logo</Label>
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 rounded-lg border-2 border-dashed border-[#9FBCA4]/40 flex items-center justify-center overflow-hidden bg-white">
                        <img 
                          src={currentGlobal.companyLogo || defaultLogo} 
                          alt="Company logo" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      {isAdmin ? (
                        <div className="flex flex-col gap-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                            onChange={handleLogoUpload}
                            className="hidden"
                            data-testid="input-logo-upload"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploadingLogo}
                            className="gap-2"
                            data-testid="button-upload-logo"
                          >
                            {isUploadingLogo ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Upload className="w-4 h-4" />
                            )}
                            {isUploadingLogo ? "Uploading..." : "Upload"}
                          </Button>
                          {currentGlobal.companyLogo && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={handleRemoveLogo}
                              className="gap-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                              data-testid="button-remove-logo"
                            >
                              <X className="w-4 h-4" />
                              Remove
                            </Button>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">(Admin only)</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-xl border-[#9FBCA4]/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
              <CardHeader>
                <CardTitle className="flex items-center font-display">
                  AI Research Model
                  <HelpTooltip text="Choose which AI model powers the market research feature. Different models have different strengths — OpenAI GPT models are great for structured data, Claude excels at reasoning, and Gemini offers fast analysis." />
                </CardTitle>
                <CardDescription className="label-text">Select the AI model used for generating market research reports.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-w-sm">
                  <Label className="label-text">Preferred Model</Label>
                  <Select
                    value={currentGlobal.preferredLlm || "gpt-4o"}
                    onValueChange={(value) => handleGlobalChange("preferredLlm", value)}
                  >
                    <SelectTrigger className="bg-white" data-testid="select-preferred-llm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o">OpenAI GPT-4o</SelectItem>
                      <SelectItem value="gpt-4o-mini">OpenAI GPT-4o Mini</SelectItem>
                      <SelectItem value="claude-sonnet-4-5">Claude Sonnet 4.5</SelectItem>
                      <SelectItem value="claude-haiku-4-5">Claude Haiku 4.5</SelectItem>
                      <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                      <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-xl border-[#9FBCA4]/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
              <CardHeader>
                <CardTitle className="flex items-center font-display">
                  Catering Levels
                  <HelpTooltip text="Defines how catering level affects event revenue and costs. Full Service properties offer complete F&B operations with higher revenue potential but also higher costs. Partial Service has limited offerings with lower revenue but better margins." />
                </CardTitle>
                <CardDescription className="label-text">Catering at events boosts F&B revenue. Define boost factors and associated costs by catering service level.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-muted rounded-lg space-y-4">
                    <h4 className="font-display text-sm">Full Service Catering</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          <Label className="label-text">F&B Revenue Boost</Label>
                          <HelpTooltip text="When an event requires full catering, F&B revenue gets boosted by this percentage. For example, 50% means F&B revenue increases by half for full-catered events." />
                        </div>
                        <span className="text-sm font-mono text-primary">{((currentGlobal.fullCateringFBBoost ?? DEFAULT_FULL_CATERING_BOOST) * 100).toFixed(0)}%</span>
                      </div>
                      <Slider 
                        value={[(currentGlobal.fullCateringFBBoost ?? DEFAULT_FULL_CATERING_BOOST) * 100]}
                        onValueChange={(vals) => handleGlobalChange("fullCateringFBBoost", (vals[0] / 100).toString())}
                        min={0}
                        max={100}
                        step={5}
                      />
                    </div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg space-y-4">
                    <h4 className="font-display text-sm">Partial Service Catering</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          <Label className="label-text">F&B Revenue Boost</Label>
                          <HelpTooltip text="When an event requires partial catering, F&B revenue gets boosted by this percentage. Lower than full service since less catering is provided." />
                        </div>
                        <span className="text-sm font-mono text-primary">{((currentGlobal.partialCateringFBBoost ?? DEFAULT_PARTIAL_CATERING_BOOST) * 100).toFixed(0)}%</span>
                      </div>
                      <Slider 
                        value={[(currentGlobal.partialCateringFBBoost ?? DEFAULT_PARTIAL_CATERING_BOOST) * 100]}
                        onValueChange={(vals) => handleGlobalChange("partialCateringFBBoost", (vals[0] / 100).toString())}
                        min={0}
                        max={100}
                        step={5}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <SaveButton 
              onClick={handleSaveGlobal} 
              disabled={!globalDraft} 
              isPending={updateGlobal.isPending} 
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
