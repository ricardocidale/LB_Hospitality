import Layout from "@/components/Layout";
import { useProperty, useUpdateProperty, useGlobalAssumptions } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Loader2, Upload } from "lucide-react";
import { Link, useRoute, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useUpload } from "@/hooks/use-upload";

function EditableValue({ 
  value, 
  onChange, 
  format = "percent",
  min = 0,
  max = 100,
  step = 1
}: { 
  value: number; 
  onChange: (val: number) => void;
  format?: "percent" | "dollar" | "months" | "number";
  min?: number;
  max?: number;
  step?: number;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const displayValue = () => {
    if (format === "percent") return `${value.toFixed(1)}%`;
    if (format === "dollar") return `$${value.toLocaleString()}`;
    if (format === "months") return `${value} mo`;
    return value.toString();
  };

  const handleClick = () => {
    setInputValue(value.toString());
    setIsEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const handleBlur = () => {
    setIsEditing(false);
    let parsed = parseFloat(inputValue);
    if (!isNaN(parsed)) {
      parsed = Math.max(min, Math.min(max, parsed));
      onChange(parsed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur();
    } else if (e.key === "Escape") {
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="number"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-16 text-sm font-semibold text-primary bg-transparent border-b border-primary outline-none text-right"
        step={step}
        min={min}
        max={max}
        autoFocus
      />
    );
  }

  return (
    <span 
      onClick={handleClick}
      className="text-sm font-semibold text-primary cursor-pointer hover:underline"
      title="Click to edit"
    >
      {displayValue()}
    </span>
  );
}

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
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  
  const { uploadFile } = useUpload({
    onSuccess: (response) => {
      handleChange("imageUrl", response.objectPath);
      toast({
        title: "Photo Uploaded",
        description: "Property photo has been successfully uploaded.",
      });
      setIsUploadingPhoto(false);
    },
    onError: (error) => {
      console.error("Upload failed:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
      setIsUploadingPhoto(false);
    },
  });
  
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File",
        description: "Please select an image file (JPEG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image under 10MB.",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploadingPhoto(true);
    await uploadFile(file);
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  };

  useEffect(() => {
    if (property && !draft) {
      setDraft({ ...property });
    }
  }, [property]);

  const modelStartYear = globalAssumptions?.modelStartDate 
    ? new Date(globalAssumptions.modelStartDate).getFullYear() 
    : 2026;
  const exitYear = modelStartYear + 9;

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
              <Label>Property Photo</Label>
              <div className="flex gap-2">
                <Input 
                  value={draft.imageUrl} 
                  onChange={(e) => handleChange("imageUrl", e.target.value)} 
                  placeholder="Enter image URL or upload a photo"
                  className="flex-1"
                />
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  data-testid="input-edit-property-photo"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  data-testid="button-upload-photo"
                >
                  {isUploadingPhoto ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {draft.imageUrl && (
                <div className="mt-2 relative w-full h-32 rounded-md overflow-hidden border">
                  <img src={draft.imageUrl} alt="Property preview" className="w-full h-full object-cover" />
                </div>
              )}
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
              <Label className="flex items-center">
                Acquisition Date
                <HelpTooltip text="The date when the property is purchased. Equity investment occurs on this date. Pre-opening costs and building improvements are incurred during the period between acquisition and operations start." />
              </Label>
              <Input type="date" value={draft.acquisitionDate} onChange={(e) => handleChange("acquisitionDate", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center">
                Operations Start Date
                <HelpTooltip text="The date when the property begins operating and generating revenue. All revenues and operating expenses start on this date. The period between acquisition and operations start is used for renovations and pre-opening preparation." />
              </Label>
              <Input type="date" value={draft.operationsStartDate} onChange={(e) => handleChange("operationsStartDate", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Capital Structure</CardTitle>
            <CardDescription>Purchase and investment details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            </div>

            <div className="space-y-3 pt-2">
              <Label>Type of Funding</Label>
              <RadioGroup 
                value={draft.type} 
                onValueChange={(v) => handleChange("type", v)}
                className="flex gap-8"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Full Equity" id="funding-equity" />
                  <Label htmlFor="funding-equity" className="font-normal cursor-pointer">Full Equity</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Financed" id="funding-financed" />
                  <Label htmlFor="funding-financed" className="font-normal cursor-pointer">Financed</Label>
                </div>
              </RadioGroup>
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
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Starting ADR</Label>
                  <EditableValue
                    value={draft.startAdr}
                    onChange={(val) => handleChange("startAdr", val.toString())}
                    format="dollar"
                    min={100}
                    max={1200}
                    step={10}
                  />
                </div>
                <Slider 
                  value={[draft.startAdr]}
                  onValueChange={(vals: number[]) => handleChange("startAdr", vals[0].toString())}
                  min={100}
                  max={1200}
                  step={10}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>ADR Annual Growth</Label>
                  <EditableValue
                    value={draft.adrGrowthRate * 100}
                    onChange={(val) => handleChange("adrGrowthRate", (val / 100).toString())}
                    format="percent"
                    min={0}
                    max={50}
                    step={1}
                  />
                </div>
                <Slider 
                  value={[draft.adrGrowthRate * 100]}
                  onValueChange={(vals: number[]) => handleChange("adrGrowthRate", (vals[0] / 100).toString())}
                  min={0}
                  max={50}
                  step={1}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Starting Occupancy</Label>
                  <EditableValue
                    value={draft.startOccupancy * 100}
                    onChange={(val) => handleChange("startOccupancy", (val / 100).toString())}
                    format="percent"
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>
                <Slider 
                  value={[draft.startOccupancy * 100]}
                  onValueChange={(vals: number[]) => handleChange("startOccupancy", (vals[0] / 100).toString())}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Max Occupancy</Label>
                  <EditableValue
                    value={draft.maxOccupancy * 100}
                    onChange={(val) => handleChange("maxOccupancy", (val / 100).toString())}
                    format="percent"
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>
                <Slider 
                  value={[draft.maxOccupancy * 100]}
                  onValueChange={(vals: number[]) => handleChange("maxOccupancy", (vals[0] / 100).toString())}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Occupancy Ramp</Label>
                  <EditableValue
                    value={draft.occupancyRampMonths}
                    onChange={(val) => handleChange("occupancyRampMonths", val.toString())}
                    format="months"
                    min={0}
                    max={36}
                    step={1}
                  />
                </div>
                <Slider 
                  value={[draft.occupancyRampMonths]}
                  onValueChange={(vals: number[]) => handleChange("occupancyRampMonths", vals[0].toString())}
                  min={0}
                  max={36}
                  step={1}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Occupancy Growth Step</Label>
                  <EditableValue
                    value={draft.occupancyGrowthStep * 100}
                    onChange={(val) => handleChange("occupancyGrowthStep", (val / 100).toString())}
                    format="percent"
                    min={0}
                    max={20}
                    step={1}
                  />
                </div>
                <Slider 
                  value={[draft.occupancyGrowthStep * 100]}
                  onValueChange={(vals: number[]) => handleChange("occupancyGrowthStep", (vals[0] / 100).toString())}
                  min={0}
                  max={20}
                  step={1}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Stabilization Period</Label>
                  <EditableValue
                    value={draft.stabilizationMonths}
                    onChange={(val) => handleChange("stabilizationMonths", val.toString())}
                    format="months"
                    min={0}
                    max={36}
                    step={1}
                  />
                </div>
                <Slider 
                  value={[draft.stabilizationMonths]}
                  onValueChange={(vals: number[]) => handleChange("stabilizationMonths", vals[0].toString())}
                  min={0}
                  max={36}
                  step={1}
                />
              </div>
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
                <div className="flex justify-between items-center">
                  <Label className="flex items-center gap-1">
                    Events
                    <HelpTooltip text="Revenue from meetings, weddings, and other events as a percentage of rooms revenue." />
                  </Label>
                  <EditableValue
                    value={(draft.revShareEvents ?? 0.43) * 100}
                    onChange={(val) => handleChange("revShareEvents", (val / 100).toString())}
                    format="percent"
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>
                <Slider 
                  value={[(draft.revShareEvents ?? 0.43) * 100]}
                  onValueChange={(vals: number[]) => handleChange("revShareEvents", (vals[0] / 100).toString())}
                  min={0}
                  max={100}
                  step={5}
                />
                <p className="text-xs text-muted-foreground">Meetings, weddings, conferences</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="flex items-center gap-1">
                    F&B
                    <HelpTooltip text="Base food & beverage revenue as a percentage of rooms revenue. This gets boosted by catering at events (see catering mix below)." />
                  </Label>
                  <EditableValue
                    value={(draft.revShareFB ?? 0.22) * 100}
                    onChange={(val) => handleChange("revShareFB", (val / 100).toString())}
                    format="percent"
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>
                <Slider 
                  value={[(draft.revShareFB ?? 0.22) * 100]}
                  onValueChange={(vals: number[]) => handleChange("revShareFB", (vals[0] / 100).toString())}
                  min={0}
                  max={100}
                  step={5}
                />
                <p className="text-xs text-muted-foreground">Restaurant, bar, room service</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="flex items-center gap-1">
                    Other
                    <HelpTooltip text="Revenue from spa, parking, activities, and other ancillary services." />
                  </Label>
                  <EditableValue
                    value={(draft.revShareOther ?? 0.07) * 100}
                    onChange={(val) => handleChange("revShareOther", (val / 100).toString())}
                    format="percent"
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>
                <Slider 
                  value={[(draft.revShareOther ?? 0.07) * 100]}
                  onValueChange={(vals: number[]) => handleChange("revShareOther", (vals[0] / 100).toString())}
                  min={0}
                  max={100}
                  step={5}
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
                        <div className="flex justify-between items-center">
                          <Label className="text-sm text-muted-foreground">% of Events with Full Catering</Label>
                          <EditableValue
                            value={fullPct}
                            onChange={(val) => {
                              const maxFull = 100 - partialPct;
                              handleChange("fullCateringPercent", (Math.min(val, maxFull) / 100).toString());
                            }}
                            format="percent"
                            min={0}
                            max={100 - partialPct}
                            step={5}
                          />
                        </div>
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
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label className="text-sm text-muted-foreground">% of Events with Partial Catering</Label>
                          <EditableValue
                            value={partialPct}
                            onChange={(val) => {
                              const maxPartial = 100 - fullPct;
                              handleChange("partialCateringPercent", (Math.min(val, maxPartial) / 100).toString());
                            }}
                            format="percent"
                            min={0}
                            max={100 - fullPct}
                            step={5}
                          />
                        </div>
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
                        />
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
                (draft.costRateFFE ?? 0.04) +
                (draft.costRateOther ?? 0.05)
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
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm">Rooms Dept</Label>
                        <EditableValue
                          value={(draft.costRateRooms ?? 0.36) * 100}
                          onChange={(val) => handleChange("costRateRooms", (val / 100).toString())}
                          format="percent"
                          min={0}
                          max={50}
                          step={1}
                        />
                      </div>
                      <Slider 
                        value={[(draft.costRateRooms ?? 0.36) * 100]}
                        onValueChange={(vals: number[]) => handleChange("costRateRooms", (vals[0] / 100).toString())}
                        min={0}
                        max={50}
                        step={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm">F&B</Label>
                        <EditableValue
                          value={(draft.costRateFB ?? 0.15) * 100}
                          onChange={(val) => handleChange("costRateFB", (val / 100).toString())}
                          format="percent"
                          min={0}
                          max={50}
                          step={1}
                        />
                      </div>
                      <Slider 
                        value={[(draft.costRateFB ?? 0.15) * 100]}
                        onValueChange={(vals: number[]) => handleChange("costRateFB", (vals[0] / 100).toString())}
                        min={0}
                        max={50}
                        step={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm">Admin</Label>
                        <EditableValue
                          value={(draft.costRateAdmin ?? 0.08) * 100}
                          onChange={(val) => handleChange("costRateAdmin", (val / 100).toString())}
                          format="percent"
                          min={0}
                          max={25}
                          step={1}
                        />
                      </div>
                      <Slider 
                        value={[(draft.costRateAdmin ?? 0.08) * 100]}
                        onValueChange={(vals: number[]) => handleChange("costRateAdmin", (vals[0] / 100).toString())}
                        min={0}
                        max={25}
                        step={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm">Marketing</Label>
                        <EditableValue
                          value={(draft.costRateMarketing ?? 0.05) * 100}
                          onChange={(val) => handleChange("costRateMarketing", (val / 100).toString())}
                          format="percent"
                          min={0}
                          max={25}
                          step={1}
                        />
                      </div>
                      <Slider 
                        value={[(draft.costRateMarketing ?? 0.05) * 100]}
                        onValueChange={(vals: number[]) => handleChange("costRateMarketing", (vals[0] / 100).toString())}
                        min={0}
                        max={25}
                        step={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm">Property Ops</Label>
                        <EditableValue
                          value={(draft.costRatePropertyOps ?? 0.04) * 100}
                          onChange={(val) => handleChange("costRatePropertyOps", (val / 100).toString())}
                          format="percent"
                          min={0}
                          max={25}
                          step={1}
                        />
                      </div>
                      <Slider 
                        value={[(draft.costRatePropertyOps ?? 0.04) * 100]}
                        onValueChange={(vals: number[]) => handleChange("costRatePropertyOps", (vals[0] / 100).toString())}
                        min={0}
                        max={25}
                        step={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm">Utilities</Label>
                        <EditableValue
                          value={(draft.costRateUtilities ?? 0.05) * 100}
                          onChange={(val) => handleChange("costRateUtilities", (val / 100).toString())}
                          format="percent"
                          min={0}
                          max={25}
                          step={1}
                        />
                      </div>
                      <Slider 
                        value={[(draft.costRateUtilities ?? 0.05) * 100]}
                        onValueChange={(vals: number[]) => handleChange("costRateUtilities", (vals[0] / 100).toString())}
                        min={0}
                        max={25}
                        step={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm">Insurance</Label>
                        <EditableValue
                          value={(draft.costRateInsurance ?? 0.02) * 100}
                          onChange={(val) => handleChange("costRateInsurance", (val / 100).toString())}
                          format="percent"
                          min={0}
                          max={15}
                          step={1}
                        />
                      </div>
                      <Slider 
                        value={[(draft.costRateInsurance ?? 0.02) * 100]}
                        onValueChange={(vals: number[]) => handleChange("costRateInsurance", (vals[0] / 100).toString())}
                        min={0}
                        max={15}
                        step={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm">Taxes</Label>
                        <EditableValue
                          value={(draft.costRateTaxes ?? 0.03) * 100}
                          onChange={(val) => handleChange("costRateTaxes", (val / 100).toString())}
                          format="percent"
                          min={0}
                          max={15}
                          step={1}
                        />
                      </div>
                      <Slider 
                        value={[(draft.costRateTaxes ?? 0.03) * 100]}
                        onValueChange={(vals: number[]) => handleChange("costRateTaxes", (vals[0] / 100).toString())}
                        min={0}
                        max={15}
                        step={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm">IT</Label>
                        <EditableValue
                          value={(draft.costRateIT ?? 0.02) * 100}
                          onChange={(val) => handleChange("costRateIT", (val / 100).toString())}
                          format="percent"
                          min={0}
                          max={15}
                          step={1}
                        />
                      </div>
                      <Slider 
                        value={[(draft.costRateIT ?? 0.02) * 100]}
                        onValueChange={(vals: number[]) => handleChange("costRateIT", (vals[0] / 100).toString())}
                        min={0}
                        max={15}
                        step={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm">FF&E Reserve</Label>
                        <EditableValue
                          value={(draft.costRateFFE ?? 0.04) * 100}
                          onChange={(val) => handleChange("costRateFFE", (val / 100).toString())}
                          format="percent"
                          min={0}
                          max={15}
                          step={1}
                        />
                      </div>
                      <Slider 
                        value={[(draft.costRateFFE ?? 0.04) * 100]}
                        onValueChange={(vals: number[]) => handleChange("costRateFFE", (vals[0] / 100).toString())}
                        min={0}
                        max={15}
                        step={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm">Other</Label>
                        <EditableValue
                          value={(draft.costRateOther ?? 0.05) * 100}
                          onChange={(val) => handleChange("costRateOther", (val / 100).toString())}
                          format="percent"
                          min={0}
                          max={15}
                          step={1}
                        />
                      </div>
                      <Slider 
                        value={[(draft.costRateOther ?? 0.05) * 100]}
                        onValueChange={(vals: number[]) => handleChange("costRateOther", (vals[0] / 100).toString())}
                        min={0}
                        max={25}
                        step={1}
                      />
                    </div>
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              Other Assumptions
              <HelpTooltip text="Additional assumptions for investment analysis including exit valuation and tax calculations" />
            </CardTitle>
            <CardDescription>
              Exit valuation and tax rate assumptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-md space-y-2">
              <div className="flex justify-between items-center">
                <Label className="flex items-center">
                  Exit Capitalization Rate
                  <HelpTooltip text={`The cap rate used to calculate exit value. Exit Value = ${exitYear} NOI ÷ Cap Rate. Lower cap rates result in higher valuations.`} />
                </Label>
                <EditableValue
                  value={(draft.exitCapRate ?? 0.085) * 100}
                  onChange={(val) => handleChange("exitCapRate", (val / 100).toString())}
                  format="percent"
                  min={1}
                  max={10}
                  step={0.1}
                />
              </div>
              <Slider 
                value={[(draft.exitCapRate ?? 0.085) * 100]}
                onValueChange={(vals: number[]) => handleChange("exitCapRate", (vals[0] / 100).toString())}
                min={1}
                max={10}
                step={0.1}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Exit Value = {exitYear} NOI ÷ {((draft.exitCapRate ?? 0.085) * 100).toFixed(1)}% = <span className="font-medium">higher property valuation at lower cap rates</span>
              </p>
            </div>

            <div className="max-w-md space-y-2 mt-6">
              <div className="flex justify-between items-center">
                <Label className="flex items-center">
                  Tax Rate
                  <HelpTooltip text="Corporate tax rate applied to positive operating cash flows to calculate after-tax free cash flow for IRR analysis." />
                </Label>
                <EditableValue
                  value={(draft.taxRate ?? 0.25) * 100}
                  onChange={(val) => handleChange("taxRate", (val / 100).toString())}
                  format="percent"
                  min={0}
                  max={50}
                  step={1}
                />
              </div>
              <Slider 
                value={[(draft.taxRate ?? 0.25) * 100]}
                onValueChange={(vals: number[]) => handleChange("taxRate", (vals[0] / 100).toString())}
                min={0}
                max={50}
                step={1}
              />
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
