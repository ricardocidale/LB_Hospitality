import Layout from "@/components/Layout";
import { useGlobalAssumptions, useUpdateGlobalAssumptions, useProperties, useUpdateProperty } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, DarkGlassTabs } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X, Building2, BookOpen, Hotel, Globe, Sliders } from "lucide-react";
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
} from "@/lib/constants";
import { useAuth } from "@/lib/auth";
import defaultLogo from "@/assets/logo.png";
import { formatMoneyInput, parseMoneyInput } from "@/lib/formatters";

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
  const [settingsTab, setSettingsTab] = useState("portfolio");

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

  const handleGlobalChange = (key: string, value: string | boolean) => {
    if (typeof value === "boolean") {
      setGlobalDraft({ ...currentGlobal, [key]: value });
      return;
    }
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
          toast({ title: "Saved", description: "Systemwide assumptions updated successfully." });
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
          title="Systemwide Assumptions"
          subtitle="Configure variables driving the financial model"
          variant="dark"
          actions={
            <div className="flex items-center gap-3">
              <Link href="/global/research" className="text-inherit no-underline">
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

        <Tabs value={settingsTab} onValueChange={setSettingsTab} className="w-full">
          <DarkGlassTabs
            tabs={[
              { value: 'portfolio', label: 'Portfolio', icon: Hotel },
              { value: 'macro', label: 'Macro', icon: Globe },
              { value: 'other', label: 'Other', icon: Sliders }
            ]}
            activeTab={settingsTab}
            onTabChange={setSettingsTab}
          />

          <TabsContent value="portfolio" className="space-y-6 mt-6">
            <Card className="bg-white/80 backdrop-blur-xl border-[#9FBCA4]/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display">
                  <Hotel className="w-5 h-5 text-[#9FBCA4]" />
                  General Property Description
                  <HelpTooltip text="Defines the target property profile for the portfolio. These parameters guide market research searches, comp set analysis, and financial benchmarks." />
                </CardTitle>
                <CardDescription className="label-text">Characterize the target property profile for the portfolio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="propertyLabel" className="label-text flex items-center gap-1">
                    Property Type Label
                    <HelpTooltip text="This label is used throughout the application wherever 'Boutique Hotel' appears — in page titles, research prompts, tooltips, and financial reports. Change it to match your property concept (e.g., 'Estate Hotel', 'Private Estate', 'Luxury Inn')." />
                  </Label>
                  <Input
                    id="propertyLabel"
                    value={currentGlobal.propertyLabel || "Boutique Hotel"}
                    onChange={(e) => {
                      const value = e.target.value;
                      setGlobalDraft({ ...currentGlobal, propertyLabel: value });
                    }}
                    placeholder="e.g., Boutique Hotel, Estate Hotel, Private Estate"
                    className="bg-white max-w-md"
                    data-testid="input-property-label"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <span>1</span>
                    <span>10</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="label-text flex items-center gap-1">LTV <HelpTooltip text="Refinance Loan-to-Value ratio. Often higher than acquisition LTV (up to 75%) based on appreciated value." /></Label>
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
                    <Label className="label-text flex items-center gap-1">Interest Rate <HelpTooltip text="Annual interest rate for the refinance loan. May differ from acquisition rate based on market conditions." /></Label>
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
                    <Label className="label-text flex items-center gap-1">Term <HelpTooltip text="Refinance loan amortization period in years." /></Label>
                    <span className="text-sm font-mono text-primary whitespace-nowrap">{currentGlobal.debtAssumptions?.refiAmortizationYears || 25} yrs</span>
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
                    <Label className="label-text flex items-center gap-1">Closing Costs <HelpTooltip text="Refinance closing costs as a percentage of the new loan amount." /></Label>
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
                    <Label className="label-text flex items-center gap-1">Annual Inflation Rate <HelpTooltip text="Expected annual inflation rate applied across the model. Affects operating cost escalation and revenue growth. Based on CPI forecasts — the Federal Reserve targets 2% annually." /></Label>
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
                    <Label htmlFor="companyName" className="label-text flex items-center gap-1">Hospitality Management Company Name <HelpTooltip text="The company name displayed in navigation and reports. Only administrators can change this setting." /></Label>
                    {isAdmin ? (
                      <Input
                        id="companyName"
                        value={currentGlobal.companyName || "Hospitality Business"}
                        onChange={(e) => handleCompanyNameChange(e.target.value)}
                        placeholder="Enter company name"
                        className="bg-white"
                        data-testid="input-company-name"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-500 text-sm">
                        {currentGlobal.companyName || "Hospitality Business"}
                        <span className="ml-2 text-xs">(Admin only)</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="label-text flex items-center gap-1">Company Logo <HelpTooltip text="Company logo displayed in the sidebar navigation. Recommended format: PNG or JPG, square aspect ratio. Only administrators can change this." /></Label>
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
                <CardTitle className="flex items-center gap-2 font-display">
                  <Sliders className="w-5 h-5 text-[#9FBCA4]" />
                  Calculation Transparency
                  <HelpTooltip text="Control whether formula breakdowns and help icons are visible in financial reports. When turned on, tables show expandable rows with step-by-step calculations and help icons explaining each line item. When turned off, tables display clean numbers only — ideal for investor presentations." />
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
                  <Label className="label-text flex items-center gap-1">Preferred Model <HelpTooltip text="The AI model used for generating market research. Each model has different strengths for analysis." /></Label>
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
                  Catering Revenue Model
                  <HelpTooltip text="Catering revenue is modeled as a percentage boost applied to base F&B revenue. This is configured at the property level, not globally." />
                </CardTitle>
                <CardDescription className="label-text">Catering is modeled as a percentage boost applied to F&B revenue at the property level.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  The catering boost percentage is configured per property on each property's assumptions page. There are no systemwide catering assumptions — property-level settings always govern.
                </p>
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <p className="font-medium mb-1">Formula:</p>
                  <p>Total F&B Revenue = Room Revenue × F&B % × (1 + Catering Boost %)</p>
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
