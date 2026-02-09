import Layout from "@/components/Layout";
import { useProperty, useUpdateProperty, useGlobalAssumptions, useMarketResearch } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, BookOpen } from "lucide-react";
import { SaveButton } from "@/components/ui/save-button";
import { GlassButton } from "@/components/ui/glass-button";
import { PageHeader } from "@/components/ui/page-header";
import { ResearchBadge } from "@/components/ui/research-badge";
import { Link, useRoute, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { Slider } from "@/components/ui/slider";
import { EditableValue } from "@/components/ui/editable-value";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PropertyImagePicker } from "@/features/property-images";
import { 
  DEFAULT_LTV, 
  DEFAULT_INTEREST_RATE, 
  DEFAULT_TERM_YEARS,
  DEFAULT_REFI_LTV,
  DEFAULT_ACQ_CLOSING_COST_RATE,
  DEFAULT_REFI_CLOSING_COST_RATE,
  DEFAULT_LAND_VALUE_PERCENT
} from "@/lib/loanCalculations";
import {
  DEFAULT_REV_SHARE_EVENTS,
  DEFAULT_REV_SHARE_FB,
  DEFAULT_REV_SHARE_OTHER,
  DEFAULT_CATERING_BOOST_PCT,
  DEFAULT_COST_RATE_ROOMS,
  DEFAULT_COST_RATE_FB,
  DEFAULT_COST_RATE_ADMIN,
  DEFAULT_COST_RATE_MARKETING,
  DEFAULT_COST_RATE_PROPERTY_OPS,
  DEFAULT_COST_RATE_UTILITIES,
  DEFAULT_COST_RATE_INSURANCE,
  DEFAULT_COST_RATE_TAXES,
  DEFAULT_COST_RATE_IT,
  DEFAULT_COST_RATE_FFE,
  DEFAULT_COST_RATE_OTHER,
  DEFAULT_EXIT_CAP_RATE,
  DEFAULT_TAX_RATE,
  PROJECTION_YEARS,
  DEFAULT_MODEL_START_DATE,
  DEFAULT_REFI_PERIOD_YEARS,
} from "@/lib/constants";
import { formatMoneyInput, parseMoneyInput } from "@/lib/formatters";

export default function PropertyEdit() {
  const [, params] = useRoute("/property/:id/edit");
  const [, setLocation] = useLocation();
  const propertyId = params?.id ? parseInt(params.id) : 0;
  
  const { data: property, isLoading } = useProperty(propertyId);
  const { data: globalAssumptions } = useGlobalAssumptions();
  const { data: research } = useMarketResearch("property", propertyId);
  const updateProperty = useUpdateProperty();
  const { toast } = useToast();
  
  const [draft, setDraft] = useState<any>(null);
  const [isDirty, setIsDirty] = useState(false);

  const researchValues = (() => {
    if (!research?.content) return {};
    const c = research.content as any;
    const parseRange = (rangeStr: string | undefined): { low: number; high: number; mid: number } | null => {
      if (!rangeStr) return null;
      const nums = rangeStr.replace(/[^0-9.,\-–]/g, ' ').split(/[\s–\-]+/).map(s => parseFloat(s.replace(/,/g, ''))).filter(n => !isNaN(n));
      if (nums.length >= 2) return { low: nums[0], high: nums[1], mid: Math.round((nums[0] + nums[1]) / 2) };
      if (nums.length === 1) return { low: nums[0], high: nums[0], mid: nums[0] };
      return null;
    };
    const parsePct = (pctStr: string | undefined): number | null => {
      if (!pctStr) return null;
      const match = pctStr.match(/([\d.]+)/);
      return match ? parseFloat(match[1]) : null;
    };
    const adrRange = parseRange(c.adrAnalysis?.recommendedRange);
    const capRange = parseRange(c.capRateAnalysis?.recommendedRange);
    const cateringPct = parsePct(c.cateringAnalysis?.recommendedBoostPercent);
    const occText = c.occupancyAnalysis?.rampUpTimeline as string | undefined;
    let occRange: { low: number; high: number; mid: number } | null = null;
    if (occText) {
      const stabMatch = occText.match(/stabilized occupancy of (\d+)[–\-](\d+)%/);
      if (stabMatch) occRange = { low: parseInt(stabMatch[1]), high: parseInt(stabMatch[2]), mid: Math.round((parseInt(stabMatch[1]) + parseInt(stabMatch[2])) / 2) };
    }
    return {
      adr: adrRange ? { display: c.adrAnalysis?.recommendedRange as string, mid: adrRange.mid } : null,
      occupancy: occRange ? { display: `${occRange.low}%–${occRange.high}%`, mid: occRange.mid } : null,
      capRate: capRange ? { display: c.capRateAnalysis?.recommendedRange as string, mid: (capRange.low + capRange.high) / 2 } : null,
      catering: cateringPct != null ? { display: c.cateringAnalysis?.recommendedBoostPercent as string, mid: cateringPct } : null,
    };
  })();

  useEffect(() => {
    if (property && !draft) {
      setDraft({ ...property });
    }
  }, [property]);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const projectionYears = globalAssumptions?.projectionYears ?? PROJECTION_YEARS;
  const modelStartYear = globalAssumptions?.modelStartDate 
    ? new Date(globalAssumptions.modelStartDate).getFullYear() 
    : new Date(DEFAULT_MODEL_START_DATE).getFullYear();
  const exitYear = modelStartYear + projectionYears - 1;

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
          <h2 className="text-2xl font-display">Property Not Found</h2>
          <Link href="/portfolio">
            <Button>Return to Portfolio</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const handleChange = (key: string, value: string | number) => {
    setDraft({ ...draft, [key]: value });
    setIsDirty(true);
  };

  const handleNumberChange = (key: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setDraft({ ...draft, [key]: numValue });
      setIsDirty(true);
    }
  };

  const getCostRateTotal = () => {
    return (
      (draft?.costRateRooms ?? DEFAULT_COST_RATE_ROOMS) +
      (draft?.costRateFB ?? DEFAULT_COST_RATE_FB) +
      (draft?.costRateAdmin ?? DEFAULT_COST_RATE_ADMIN) +
      (draft?.costRateMarketing ?? DEFAULT_COST_RATE_MARKETING) +
      (draft?.costRatePropertyOps ?? DEFAULT_COST_RATE_PROPERTY_OPS) +
      (draft?.costRateUtilities ?? DEFAULT_COST_RATE_UTILITIES) +
      (draft?.costRateInsurance ?? DEFAULT_COST_RATE_INSURANCE) +
      (draft?.costRateTaxes ?? DEFAULT_COST_RATE_TAXES) +
      (draft?.costRateIT ?? DEFAULT_COST_RATE_IT) +
      (draft?.costRateFFE ?? DEFAULT_COST_RATE_FFE) +
      (draft?.costRateOther ?? DEFAULT_COST_RATE_OTHER)
    );
  };

  const handleSave = () => {
    updateProperty.mutate({ id: propertyId, data: draft }, {
      onSuccess: () => {
        setIsDirty(false);
        toast({ title: "Saved", description: "Property assumptions updated successfully." });
        setLocation(`/property/${propertyId}`);
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to save property assumptions.", variant: "destructive" });
      }
    });
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl">
        <PageHeader
          title="Property Assumptions"
          subtitle={property.name}
          variant="dark"
          backLink={`/property/${propertyId}`}
          actions={
            <div className="flex items-center gap-3">
              <Link href={`/property/${propertyId}/research`} className="text-inherit no-underline">
                <GlassButton variant="primary" data-testid="button-market-research">
                  <BookOpen className="w-4 h-4" />
                  Market Research
                </GlassButton>
              </Link>
              <SaveButton 
                onClick={handleSave} 
                isPending={updateProperty.isPending} 
              />
            </div>
          }
        />

        {/* Glass Card - Basic Information */}
        <div className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-white/80 backdrop-blur-xl" />
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#9FBCA4]/10 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-[#9FBCA4]/5 blur-xl" />
          <div className="absolute inset-0 border border-[#9FBCA4]/20 rounded-2xl shadow-[0_8px_32px_rgba(159,188,164,0.15)]" />
          
          <div className="relative p-6">
            <div className="mb-6">
              <h3 className="text-xl font-display text-gray-900">Basic Information</h3>
              <p className="text-gray-600 text-sm label-text">Property identification and location details</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="label-text text-gray-700">Property Name</Label>
                <Input value={draft.name} onChange={(e) => handleChange("name", e.target.value)} className="bg-white border-[#9FBCA4]/30 text-gray-900 placeholder:text-gray-400" />
              </div>
              <div className="space-y-2">
                <Label className="label-text text-gray-700">Location</Label>
                <Input value={draft.location} onChange={(e) => handleChange("location", e.target.value)} className="bg-white border-[#9FBCA4]/30 text-gray-900 placeholder:text-gray-400" />
              </div>
              <div className="space-y-2">
                <Label className="label-text text-gray-700">Market</Label>
                <Input value={draft.market} onChange={(e) => handleChange("market", e.target.value)} className="bg-white border-[#9FBCA4]/30 text-gray-900 placeholder:text-gray-400" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="label-text text-gray-700">Property Photo</Label>
                <PropertyImagePicker
                  imageUrl={draft.imageUrl}
                  onImageChange={(url) => handleChange("imageUrl", url)}
                  propertyName={draft.name}
                  location={draft.location}
                  variant="light"
                />
              </div>
              <div className="space-y-2">
                <Label className="label-text text-gray-700">Status</Label>
                <Select value={draft.status} onValueChange={(v) => handleChange("status", v)}>
                  <SelectTrigger className="bg-white border-[#9FBCA4]/30 text-gray-900"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Acquisition">Acquisition</SelectItem>
                    <SelectItem value="Development">Planned</SelectItem>
                    <SelectItem value="Operational">Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="label-text text-gray-700">Room Count</Label>
                <Input type="number" value={draft.roomCount} onChange={(e) => handleNumberChange("roomCount", e.target.value)} className="bg-white border-[#9FBCA4]/30 text-gray-900 placeholder:text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Glass Card - Timeline */}
        <div className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-white/80 backdrop-blur-xl" />
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#9FBCA4]/10 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-[#9FBCA4]/5 blur-xl" />
          <div className="absolute inset-0 border border-[#9FBCA4]/20 rounded-2xl shadow-[0_8px_32px_rgba(159,188,164,0.15)]" />
          
          <div className="relative p-6">
            <div className="mb-6">
              <h3 className="text-xl font-display text-gray-900">Timeline</h3>
              <p className="text-gray-600 text-sm label-text">Acquisition and operations schedule</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="flex items-center label-text text-gray-700">
                  Acquisition Date
                  <HelpTooltip text="The date when the property is purchased. Equity investment occurs on this date. Pre-opening costs and building improvements are incurred during the period between acquisition and operations start." />
                </Label>
                <Input type="date" value={draft.acquisitionDate} onChange={(e) => handleChange("acquisitionDate", e.target.value)} className="bg-white border-[#9FBCA4]/30 text-gray-900" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center label-text text-gray-700">
                  Operations Start Date
                  <HelpTooltip text="The date when the property begins operating and generating revenue. All revenues and operating expenses start on this date. The period between acquisition and operations start is used for renovations and pre-opening preparation." />
                </Label>
                <Input type="date" value={draft.operationsStartDate} onChange={(e) => handleChange("operationsStartDate", e.target.value)} className="bg-white border-[#9FBCA4]/30 text-gray-900" />
              </div>
            </div>
          </div>
        </div>

        {/* Glass Card - Capital Structure */}
        <div className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-white/80 backdrop-blur-xl" />
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#9FBCA4]/10 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-[#9FBCA4]/5 blur-xl" />
          <div className="absolute inset-0 border border-[#9FBCA4]/20 rounded-2xl shadow-[0_8px_32px_rgba(159,188,164,0.15)]" />
          
          <div className="relative p-6 space-y-8">
            <div>
              <h3 className="text-xl font-display text-gray-900">Capital Structure</h3>
              <p className="text-gray-600 text-sm label-text">Purchase and investment details</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label className="label-text text-gray-700">Purchase Price ($)</Label>
                <Input 
                  value={formatMoneyInput(draft.purchasePrice)} 
                  onChange={(e) => handleNumberChange("purchasePrice", parseMoneyInput(e.target.value).toString())}
                  className="bg-white border-[#9FBCA4]/30 text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <Label className="label-text text-gray-700">Building Improvements ($)</Label>
                <Input 
                  value={formatMoneyInput(draft.buildingImprovements)} 
                  onChange={(e) => handleNumberChange("buildingImprovements", parseMoneyInput(e.target.value).toString())}
                  className="bg-white border-[#9FBCA4]/30 text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <Label className="label-text text-gray-700 flex items-center">
                  Land Value (%)
                  <HelpTooltip text="Percentage of the purchase price allocated to land. Land does not depreciate under IRS rules (Publication 946). Only the building portion is depreciated over 27.5 years. Typical land allocation ranges from 15-40% depending on location and property type." />
                </Label>
                <div className="flex items-center gap-3">
                  <Slider
                    data-testid="slider-land-value-percent"
                    value={[(draft.landValuePercent ?? DEFAULT_LAND_VALUE_PERCENT) * 100]}
                    onValueChange={(vals: number[]) => handleNumberChange("landValuePercent", (vals[0] / 100).toString())}
                    min={5}
                    max={60}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium text-gray-700 w-12 text-right" data-testid="text-land-value-percent">
                    {((draft.landValuePercent ?? DEFAULT_LAND_VALUE_PERCENT) * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Depreciable basis: ${((draft.purchasePrice * (1 - (draft.landValuePercent ?? DEFAULT_LAND_VALUE_PERCENT))) + draft.buildingImprovements).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="label-text text-gray-700">Pre-Opening Costs ($)</Label>
                <Input 
                  value={formatMoneyInput(draft.preOpeningCosts)} 
                  onChange={(e) => handleNumberChange("preOpeningCosts", parseMoneyInput(e.target.value).toString())}
                  className="bg-white border-[#9FBCA4]/30 text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <Label className="label-text text-gray-700">Operating Reserve ($)</Label>
                <Input 
                  value={formatMoneyInput(draft.operatingReserve)} 
                  onChange={(e) => handleNumberChange("operatingReserve", parseMoneyInput(e.target.value).toString())}
                  className="bg-white border-[#9FBCA4]/30 text-gray-900"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Label className="label-text text-gray-700">Type of Funding</Label>
              <RadioGroup 
                value={draft.type} 
                onValueChange={(v) => handleChange("type", v)}
                className="flex gap-8"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Full Equity" id="funding-equity" className="border-white/40 text-white" />
                  <Label htmlFor="funding-equity" className="font-normal cursor-pointer text-gray-700">Full Equity</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Financed" id="funding-financed" className="border-white/40 text-white" />
                  <Label htmlFor="funding-financed" className="font-normal cursor-pointer text-gray-700">Financed</Label>
                </div>
              </RadioGroup>
            </div>

            {draft.type === "Financed" && (
              <div className="border-t border-white/10 pt-6">
                <h4 className="font-display mb-4 text-gray-900">Acquisition Financing</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="label-text text-gray-700">Loan-to-Value (LTV) %</Label>
                    <Input 
                      type="number" 
                      step="0.01"
                      value={((draft.acquisitionLTV || DEFAULT_LTV) * 100).toFixed(0)} 
                      onChange={(e) => handleNumberChange("acquisitionLTV", (parseFloat(e.target.value) / 100).toString())}
                      className="bg-white border-[#9FBCA4]/30 text-gray-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="label-text text-gray-700">Interest Rate (%)</Label>
                    <Input 
                      type="number" 
                      step="0.01"
                      value={((draft.acquisitionInterestRate || DEFAULT_INTEREST_RATE) * 100).toFixed(2)} 
                      onChange={(e) => handleNumberChange("acquisitionInterestRate", (parseFloat(e.target.value) / 100).toString())}
                      className="bg-white border-[#9FBCA4]/30 text-gray-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="label-text text-gray-700">Loan Term (Years)</Label>
                    <Input 
                      type="number" 
                      value={draft.acquisitionTermYears || DEFAULT_TERM_YEARS} 
                      onChange={(e) => handleNumberChange("acquisitionTermYears", e.target.value)}
                      className="bg-white border-[#9FBCA4]/30 text-gray-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="label-text text-gray-700">Closing Costs (%)</Label>
                    <Input 
                      type="number" 
                      step="0.01"
                      value={((draft.acquisitionClosingCostRate || DEFAULT_ACQ_CLOSING_COST_RATE) * 100).toFixed(1)} 
                      onChange={(e) => handleNumberChange("acquisitionClosingCostRate", (parseFloat(e.target.value) / 100).toString())}
                      className="bg-white border-[#9FBCA4]/30 text-gray-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {draft.type === "Full Equity" && (
              <div className="border-t border-white/10 pt-6">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label className="label-text text-gray-700">Will this property be refinanced?</Label>
                    <RadioGroup 
                      value={draft.willRefinance || "No"} 
                      onValueChange={(v) => handleChange("willRefinance", v)}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Yes" id="refinance-yes" className="border-white/40 text-white" />
                        <Label htmlFor="refinance-yes" className="font-normal cursor-pointer text-gray-700">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="No" id="refinance-no" className="border-white/40 text-white" />
                        <Label htmlFor="refinance-no" className="font-normal cursor-pointer text-gray-700">No</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {draft.willRefinance === "Yes" && (
                    <div className="border-t border-white/10 pt-4">
                      <h4 className="font-display mb-4 text-gray-900">Refinance Terms</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="label-text text-gray-700">Refinance Date</Label>
                          <Input 
                            type="date" 
                            value={draft.refinanceDate || (() => {
                              const refiPeriod = globalAssumptions?.debtAssumptions?.refiPeriodYears ?? DEFAULT_REFI_PERIOD_YEARS;
                              const opsDate = new Date(draft.operationsStartDate);
                              opsDate.setFullYear(opsDate.getFullYear() + refiPeriod);
                              return opsDate.toISOString().split('T')[0];
                            })()} 
                            onChange={(e) => handleChange("refinanceDate", e.target.value)}
                            className="bg-white border-[#9FBCA4]/30 text-gray-900"
                          />
                          <p className="text-xs text-gray-500">Suggested: {globalAssumptions?.debtAssumptions?.refiPeriodYears ?? DEFAULT_REFI_PERIOD_YEARS} years after operations start</p>
                        </div>
                        <div className="space-y-2">
                          <Label className="label-text text-gray-700">Loan-to-Value (LTV) %</Label>
                          <Input 
                            type="number" 
                            step="0.01"
                            value={((draft.refinanceLTV || DEFAULT_REFI_LTV) * 100).toFixed(0)} 
                            onChange={(e) => handleNumberChange("refinanceLTV", (parseFloat(e.target.value) / 100).toString())}
                            className="bg-white border-[#9FBCA4]/30 text-gray-900"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="label-text text-gray-700">Interest Rate (%)</Label>
                          <Input 
                            type="number" 
                            step="0.01"
                            value={((draft.refinanceInterestRate || DEFAULT_INTEREST_RATE) * 100).toFixed(2)} 
                            onChange={(e) => handleNumberChange("refinanceInterestRate", (parseFloat(e.target.value) / 100).toString())}
                            className="bg-white border-[#9FBCA4]/30 text-gray-900"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="label-text text-gray-700">Loan Term (Years)</Label>
                          <Input 
                            type="number" 
                            value={draft.refinanceTermYears || DEFAULT_TERM_YEARS} 
                            onChange={(e) => handleNumberChange("refinanceTermYears", e.target.value)}
                            className="bg-white border-[#9FBCA4]/30 text-gray-900"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="label-text text-gray-700">Closing Costs (%)</Label>
                          <Input 
                            type="number" 
                            step="0.01"
                            value={((draft.refinanceClosingCostRate || DEFAULT_REFI_CLOSING_COST_RATE) * 100).toFixed(1)} 
                            onChange={(e) => handleNumberChange("refinanceClosingCostRate", (parseFloat(e.target.value) / 100).toString())}
                            className="bg-white border-[#9FBCA4]/30 text-gray-900"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Glass Card - Revenue Assumptions */}
        <div className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-white/80 backdrop-blur-xl" />
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#9FBCA4]/10 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-[#9FBCA4]/5 blur-xl" />
          <div className="absolute inset-0 border border-[#9FBCA4]/20 rounded-2xl shadow-[0_8px_32px_rgba(159,188,164,0.15)]" />
          
          <div className="relative p-6 space-y-6">
            <div>
              <h3 className="text-xl font-display text-gray-900">Revenue Assumptions</h3>
              <p className="text-gray-600 text-sm label-text">ADR and occupancy projections</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="label-text text-gray-700 flex items-center gap-1.5">
                    Starting ADR
                    <ResearchBadge value={researchValues.adr?.display} onClick={() => researchValues.adr && handleChange("startAdr", researchValues.adr.mid.toString())} />
                  </Label>
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
                  className="[&_[role=slider]]:bg-[#9FBCA4]"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="label-text text-gray-700">ADR Annual Growth</Label>
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
                  className="[&_[role=slider]]:bg-[#9FBCA4]"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="label-text text-gray-700">Starting Occupancy</Label>
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
                  className="[&_[role=slider]]:bg-[#9FBCA4]"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="label-text text-gray-700 flex items-center gap-1.5">
                    Stabilized Occupancy
                    <ResearchBadge value={researchValues.occupancy?.display} onClick={() => researchValues.occupancy && handleChange("maxOccupancy", (researchValues.occupancy.mid / 100).toString())} />
                  </Label>
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
                  className="[&_[role=slider]]:bg-[#9FBCA4]"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="label-text text-gray-700">Occupancy Ramp</Label>
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
                  className="[&_[role=slider]]:bg-[#9FBCA4]"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="label-text text-gray-700">Occupancy Growth Step</Label>
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
                  className="[&_[role=slider]]:bg-[#9FBCA4]"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="label-text text-gray-700">Stabilization Period</Label>
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
                  className="[&_[role=slider]]:bg-[#9FBCA4]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Glass Card - Revenue Streams */}
        <div className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-white/80 backdrop-blur-xl" />
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#9FBCA4]/10 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-[#9FBCA4]/5 blur-xl" />
          <div className="absolute inset-0 border border-[#9FBCA4]/20 rounded-2xl shadow-[0_8px_32px_rgba(159,188,164,0.15)]" />
          
          <div className="relative p-6 space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white flex items-center">
                Revenue Streams
                <HelpTooltip text="Configure how much additional revenue each stream generates as a percentage of room revenue. F&B revenue gets boosted by the catering boost percentage." />
              </h3>
              <p className="text-gray-600 text-sm">Additional revenue as percentage of room revenue</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="flex items-center gap-1 text-gray-700">
                    Events
                    <HelpTooltip text="Revenue from meetings, weddings, and other events as a percentage of room revenue." />
                  </Label>
                  <EditableValue
                    value={(draft.revShareEvents ?? DEFAULT_REV_SHARE_EVENTS) * 100}
                    onChange={(val) => handleChange("revShareEvents", (val / 100).toString())}
                    format="percent"
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>
                <Slider 
                  value={[(draft.revShareEvents ?? DEFAULT_REV_SHARE_EVENTS) * 100]}
                  onValueChange={(vals: number[]) => handleChange("revShareEvents", (vals[0] / 100).toString())}
                  min={0}
                  max={100}
                  step={5}
                  className="[&_[role=slider]]:bg-[#9FBCA4]"
                />
                <p className="text-xs text-gray-500">Meetings, weddings, conferences</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="flex items-center gap-1 text-gray-700">
                    F&B
                    <HelpTooltip text="Base food & beverage revenue as a percentage of room revenue. This gets boosted by the catering boost percentage below." />
                  </Label>
                  <EditableValue
                    value={(draft.revShareFB ?? DEFAULT_REV_SHARE_FB) * 100}
                    onChange={(val) => handleChange("revShareFB", (val / 100).toString())}
                    format="percent"
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>
                <Slider 
                  value={[(draft.revShareFB ?? DEFAULT_REV_SHARE_FB) * 100]}
                  onValueChange={(vals: number[]) => handleChange("revShareFB", (vals[0] / 100).toString())}
                  min={0}
                  max={100}
                  step={5}
                  className="[&_[role=slider]]:bg-[#9FBCA4]"
                />
                <p className="text-xs text-gray-500">Restaurant, bar, room service</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="flex items-center gap-1 text-gray-700">
                    Other
                    <HelpTooltip text="Revenue from spa, parking, activities, and other ancillary services." />
                  </Label>
                  <EditableValue
                    value={(draft.revShareOther ?? DEFAULT_REV_SHARE_OTHER) * 100}
                    onChange={(val) => handleChange("revShareOther", (val / 100).toString())}
                    format="percent"
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>
                <Slider 
                  value={[(draft.revShareOther ?? DEFAULT_REV_SHARE_OTHER) * 100]}
                  onValueChange={(vals: number[]) => handleChange("revShareOther", (vals[0] / 100).toString())}
                  min={0}
                  max={100}
                  step={5}
                  className="[&_[role=slider]]:bg-[#9FBCA4]"
                />
                <p className="text-xs text-gray-500">Spa, parking, activities</p>
              </div>
            </div>
            
            <div className="border-t border-white/10 pt-4">
              <Label className="flex items-center gap-1 mb-3 text-gray-700">
                Catering Boost
                <HelpTooltip text="Percentage uplift applied to base F&B revenue from catered events. This should reflect the blended average across all events (catered and non-catered). For example, 30% means total F&B = Base F&B × 1.30." />
              </Label>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-sm text-gray-600 flex items-center gap-1.5">
                    Catering Boost %
                    <ResearchBadge value={researchValues.catering?.display} onClick={() => researchValues.catering && handleChange("cateringBoostPercent", (researchValues.catering.mid / 100).toString())} />
                  </Label>
                  <EditableValue
                    value={(draft.cateringBoostPercent ?? DEFAULT_CATERING_BOOST_PCT) * 100}
                    onChange={(val) => handleChange("cateringBoostPercent", (val / 100).toString())}
                    format="percent"
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>
                <Slider 
                  value={[(draft.cateringBoostPercent ?? DEFAULT_CATERING_BOOST_PCT) * 100]}
                  onValueChange={(vals: number[]) => handleChange("cateringBoostPercent", (vals[0] / 100).toString())}
                  min={0}
                  max={100}
                  step={5}
                  className="[&_[role=slider]]:bg-[#9FBCA4]"
                />
                <p className="text-xs text-gray-500 mt-1">Total F&B Revenue = Base F&B × (1 + Catering Boost %)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Glass Card - Operating Cost Rates */}
        <div className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-white/80 backdrop-blur-xl" />
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#9FBCA4]/10 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-[#9FBCA4]/5 blur-xl" />
          <div className="absolute inset-0 border border-[#9FBCA4]/20 rounded-2xl shadow-[0_8px_32px_rgba(159,188,164,0.15)]" />
          
          <div className="relative p-6">
            <div className="mb-6">
              <h3 className="text-xl font-display text-gray-900 flex items-center">
                Operating Cost Rates
                <HelpTooltip text="These percentages represent the portion of revenue allocated to each expense category for this property." />
              </h3>
              <p className="text-gray-600 text-sm label-text">Expense allocation as percentage of revenue</p>
            </div>
            <div className="space-y-6">
            {(() => {
              const costRateTotal = (
                (draft.costRateRooms ?? DEFAULT_COST_RATE_ROOMS) +
                (draft.costRateFB ?? DEFAULT_COST_RATE_FB) +
                (draft.costRateAdmin ?? DEFAULT_COST_RATE_ADMIN) +
                (draft.costRateMarketing ?? DEFAULT_COST_RATE_MARKETING) +
                (draft.costRatePropertyOps ?? DEFAULT_COST_RATE_PROPERTY_OPS) +
                (draft.costRateUtilities ?? DEFAULT_COST_RATE_UTILITIES) +
                (draft.costRateInsurance ?? DEFAULT_COST_RATE_INSURANCE) +
                (draft.costRateTaxes ?? DEFAULT_COST_RATE_TAXES) +
                (draft.costRateIT ?? DEFAULT_COST_RATE_IT) +
                (draft.costRateFFE ?? DEFAULT_COST_RATE_FFE) +
                (draft.costRateOther ?? DEFAULT_COST_RATE_OTHER)
              );
              
              return (
                <>
                  <div className="p-4 rounded-lg bg-white/10 border border-white/20">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">Total Allocation:</span>
                      <span className="text-lg font-bold text-[#9FBCA4]">
                        {(costRateTotal * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm label-text text-gray-700">Housekeeping</Label>
                        <EditableValue
                          value={(draft.costRateRooms ?? DEFAULT_COST_RATE_ROOMS) * 100}
                          onChange={(val) => handleChange("costRateRooms", val / 100)}
                          format="percent"
                          min={0}
                          max={50}
                          step={1}
                        />
                      </div>
                      <Slider 
                        value={[(draft.costRateRooms ?? DEFAULT_COST_RATE_ROOMS) * 100]}
                        onValueChange={(vals: number[]) => handleChange("costRateRooms", vals[0] / 100)}
                        min={0}
                        max={50}
                        step={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm label-text text-gray-700">F&B</Label>
                        <EditableValue
                          value={(draft.costRateFB ?? DEFAULT_COST_RATE_FB) * 100}
                          onChange={(val) => handleChange("costRateFB", val / 100)}
                          format="percent"
                          min={0}
                          max={50}
                          step={1}
                        />
                      </div>
                      <Slider 
                        value={[(draft.costRateFB ?? DEFAULT_COST_RATE_FB) * 100]}
                        onValueChange={(vals: number[]) => handleChange("costRateFB", vals[0] / 100)}
                        min={0}
                        max={50}
                        step={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm label-text text-gray-700">Admin</Label>
                        <EditableValue
                          value={(draft.costRateAdmin ?? DEFAULT_COST_RATE_ADMIN) * 100}
                          onChange={(val) => handleChange("costRateAdmin", val / 100)}
                          format="percent"
                          min={0}
                          max={25}
                          step={1}
                        />
                      </div>
                      <Slider 
                        value={[(draft.costRateAdmin ?? DEFAULT_COST_RATE_ADMIN) * 100]}
                        onValueChange={(vals: number[]) => handleChange("costRateAdmin", vals[0] / 100)}
                        min={0}
                        max={25}
                        step={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm label-text text-gray-700">Marketing</Label>
                        <EditableValue
                          value={(draft.costRateMarketing ?? DEFAULT_COST_RATE_MARKETING) * 100}
                          onChange={(val) => handleChange("costRateMarketing", val / 100)}
                          format="percent"
                          min={0}
                          max={25}
                          step={1}
                        />
                      </div>
                      <Slider 
                        value={[(draft.costRateMarketing ?? DEFAULT_COST_RATE_MARKETING) * 100]}
                        onValueChange={(vals: number[]) => handleChange("costRateMarketing", vals[0] / 100)}
                        min={0}
                        max={25}
                        step={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm label-text text-gray-700">Property Ops</Label>
                        <EditableValue
                          value={(draft.costRatePropertyOps ?? DEFAULT_COST_RATE_PROPERTY_OPS) * 100}
                          onChange={(val) => handleChange("costRatePropertyOps", val / 100)}
                          format="percent"
                          min={0}
                          max={25}
                          step={1}
                        />
                      </div>
                      <Slider 
                        value={[(draft.costRatePropertyOps ?? DEFAULT_COST_RATE_PROPERTY_OPS) * 100]}
                        onValueChange={(vals: number[]) => handleChange("costRatePropertyOps", vals[0] / 100)}
                        min={0}
                        max={25}
                        step={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm label-text text-gray-700">Utilities</Label>
                        <EditableValue
                          value={(draft.costRateUtilities ?? DEFAULT_COST_RATE_UTILITIES) * 100}
                          onChange={(val) => handleChange("costRateUtilities", val / 100)}
                          format="percent"
                          min={0}
                          max={25}
                          step={1}
                        />
                      </div>
                      <Slider 
                        value={[(draft.costRateUtilities ?? DEFAULT_COST_RATE_UTILITIES) * 100]}
                        onValueChange={(vals: number[]) => handleChange("costRateUtilities", vals[0] / 100)}
                        min={0}
                        max={25}
                        step={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm label-text text-gray-700">Insurance</Label>
                        <EditableValue
                          value={(draft.costRateInsurance ?? DEFAULT_COST_RATE_INSURANCE) * 100}
                          onChange={(val) => handleChange("costRateInsurance", val / 100)}
                          format="percent"
                          min={0}
                          max={15}
                          step={1}
                        />
                      </div>
                      <Slider 
                        value={[(draft.costRateInsurance ?? DEFAULT_COST_RATE_INSURANCE) * 100]}
                        onValueChange={(vals: number[]) => handleChange("costRateInsurance", vals[0] / 100)}
                        min={0}
                        max={15}
                        step={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm label-text text-gray-700">Taxes</Label>
                        <EditableValue
                          value={(draft.costRateTaxes ?? DEFAULT_COST_RATE_TAXES) * 100}
                          onChange={(val) => handleChange("costRateTaxes", val / 100)}
                          format="percent"
                          min={0}
                          max={15}
                          step={1}
                        />
                      </div>
                      <Slider 
                        value={[(draft.costRateTaxes ?? DEFAULT_COST_RATE_TAXES) * 100]}
                        onValueChange={(vals: number[]) => handleChange("costRateTaxes", vals[0] / 100)}
                        min={0}
                        max={15}
                        step={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm label-text text-gray-700">IT</Label>
                        <EditableValue
                          value={(draft.costRateIT ?? DEFAULT_COST_RATE_IT) * 100}
                          onChange={(val) => handleChange("costRateIT", val / 100)}
                          format="percent"
                          min={0}
                          max={15}
                          step={1}
                        />
                      </div>
                      <Slider 
                        value={[(draft.costRateIT ?? DEFAULT_COST_RATE_IT) * 100]}
                        onValueChange={(vals: number[]) => handleChange("costRateIT", vals[0] / 100)}
                        min={0}
                        max={15}
                        step={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm label-text text-gray-700">FF&E Reserve</Label>
                        <EditableValue
                          value={(draft.costRateFFE ?? DEFAULT_COST_RATE_FFE) * 100}
                          onChange={(val) => handleChange("costRateFFE", val / 100)}
                          format="percent"
                          min={0}
                          max={15}
                          step={1}
                        />
                      </div>
                      <Slider 
                        value={[(draft.costRateFFE ?? DEFAULT_COST_RATE_FFE) * 100]}
                        onValueChange={(vals: number[]) => handleChange("costRateFFE", vals[0] / 100)}
                        min={0}
                        max={15}
                        step={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm label-text text-gray-700">Other</Label>
                        <EditableValue
                          value={(draft.costRateOther ?? DEFAULT_COST_RATE_OTHER) * 100}
                          onChange={(val) => handleChange("costRateOther", val / 100)}
                          format="percent"
                          min={0}
                          max={15}
                          step={1}
                        />
                      </div>
                      <Slider 
                        value={[(draft.costRateOther ?? DEFAULT_COST_RATE_OTHER) * 100]}
                        onValueChange={(vals: number[]) => handleChange("costRateOther", vals[0] / 100)}
                        min={0}
                        max={25}
                        step={1}
                      />
                    </div>
                  </div>
                </>
              );
            })()}
            </div>
          </div>
        </div>

        {/* Glass Card - Other Assumptions */}
        <div className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-white/80 backdrop-blur-xl" />
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#9FBCA4]/10 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-[#9FBCA4]/5 blur-xl" />
          <div className="absolute inset-0 border border-[#9FBCA4]/20 rounded-2xl shadow-[0_8px_32px_rgba(159,188,164,0.15)]" />
          
          <div className="relative p-6">
            <div className="mb-6">
              <h3 className="text-xl font-display text-gray-900 flex items-center">
                Other Assumptions
                <HelpTooltip text="Additional assumptions for investment analysis including exit valuation and tax calculations" />
              </h3>
              <p className="text-gray-600 text-sm label-text">Exit valuation and tax rate assumptions</p>
            </div>
            <div className="max-w-md space-y-2">
              <div className="flex justify-between items-center">
                <Label className="flex items-center label-text text-gray-700 gap-1.5">
                  Exit Cap Rate
                  <HelpTooltip text={`The capitalization rate used to determine terminal (exit) value. Exit Value = Year ${exitYear} NOI ÷ Cap Rate. A lower cap rate implies higher property valuation.`} />
                  <ResearchBadge value={researchValues.capRate?.display} onClick={() => researchValues.capRate && handleChange("exitCapRate", (researchValues.capRate.mid / 100).toString())} />
                </Label>
                <EditableValue
                  value={(draft.exitCapRate ?? DEFAULT_EXIT_CAP_RATE) * 100}
                  onChange={(val) => handleChange("exitCapRate", (val / 100).toString())}
                  format="percent"
                  min={1}
                  max={10}
                  step={0.1}
                />
              </div>
              <Slider 
                value={[(draft.exitCapRate ?? DEFAULT_EXIT_CAP_RATE) * 100]}
                onValueChange={(vals: number[]) => handleChange("exitCapRate", (vals[0] / 100).toString())}
                min={1}
                max={10}
                step={0.1}
              />
              <p className="text-xs text-gray-600 mt-2">
                Exit Value = {exitYear} NOI ÷ {((draft.exitCapRate ?? DEFAULT_EXIT_CAP_RATE) * 100).toFixed(1)}% = <span className="font-medium">higher property valuation at lower cap rates</span>
              </p>
            </div>

            <div className="max-w-md space-y-2 mt-6">
              <div className="flex justify-between items-center">
                <Label className="flex items-center label-text text-gray-700">
                  Tax Rate
                  <HelpTooltip text="Corporate tax rate applied to positive operating cash flows to calculate after-tax free cash flow for IRR analysis." />
                </Label>
                <EditableValue
                  value={(draft.taxRate ?? DEFAULT_TAX_RATE) * 100}
                  onChange={(val) => handleChange("taxRate", (val / 100).toString())}
                  format="percent"
                  min={0}
                  max={50}
                  step={1}
                />
              </div>
              <Slider 
                value={[(draft.taxRate ?? DEFAULT_TAX_RATE) * 100]}
                onValueChange={(vals: number[]) => handleChange("taxRate", (vals[0] / 100).toString())}
                min={0}
                max={50}
                step={1}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pb-8">
          <SaveButton 
            onClick={handleSave} 
            isPending={updateProperty.isPending}
          >
            Save All Changes
          </SaveButton>
        </div>
      </div>
    </Layout>
  );
}
