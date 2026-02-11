import Layout from "@/components/Layout";
import { useProperty, useUpdateProperty, useGlobalAssumptions, useMarketResearch, useFeeCategories, useUpdateFeeCategories, type FeeCategoryResponse } from "@/lib/api";
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
  DEFAULT_UTILITIES_VARIABLE_SPLIT,
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
  DEFAULT_BASE_MANAGEMENT_FEE_RATE,
  DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE,
} from "@/lib/constants";
import { formatMoneyInput, parseMoneyInput } from "@/lib/formatters";

export default function PropertyEdit() {
  const [, params] = useRoute("/property/:id/edit");
  const [, setLocation] = useLocation();
  const propertyId = params?.id ? parseInt(params.id) : 0;
  
  const { data: property, isLoading } = useProperty(propertyId);
  const { data: globalAssumptions } = useGlobalAssumptions();
  const { data: research } = useMarketResearch("property", propertyId);
  const { data: feeCategories } = useFeeCategories(propertyId);
  const updateProperty = useUpdateProperty();
  const updateFeeCategories = useUpdateFeeCategories();
  const { toast } = useToast();
  
  const [draft, setDraft] = useState<any>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [feeDraft, setFeeDraft] = useState<FeeCategoryResponse[] | null>(null);
  
  useEffect(() => {
    if (feeCategories && !feeDraft) {
      setFeeDraft([...feeCategories]);
    }
  }, [feeCategories]);

  const researchValues = (() => {
    if (!research?.content) return {};
    const c = research.content;
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
    const landPct = parsePct(c.landValueAllocation?.recommendedPercent);
    const occText = c.occupancyAnalysis?.rampUpTimeline;
    let occRange: { low: number; high: number; mid: number } | null = null;
    let initOccRange: { low: number; high: number; mid: number } | null = null;
    let rampMonthsRange: { low: number; high: number; mid: number } | null = null;
    if (occText) {
      const stabMatch = occText.match(/stabilized occupancy of (\d+)[–\-](\d+)%/);
      if (stabMatch) occRange = { low: parseInt(stabMatch[1]), high: parseInt(stabMatch[2]), mid: Math.round((parseInt(stabMatch[1]) + parseInt(stabMatch[2])) / 2) };
      const initMatch = occText.match(/initial occupancy (?:around |of )?(\d+)[–\-](\d+)%/);
      if (initMatch) initOccRange = { low: parseInt(initMatch[1]), high: parseInt(initMatch[2]), mid: Math.round((parseInt(initMatch[1]) + parseInt(initMatch[2])) / 2) };
      const rampMatch = occText.match(/(\d+)[–\-](\d+) months/);
      if (rampMatch) rampMonthsRange = { low: parseInt(rampMatch[1]), high: parseInt(rampMatch[2]), mid: Math.round((parseInt(rampMatch[1]) + parseInt(rampMatch[2])) / 2) };
    }
    return {
      adr: adrRange ? { display: c.adrAnalysis?.recommendedRange ?? "", mid: adrRange.mid } : null,
      occupancy: occRange ? { display: `${occRange.low}%–${occRange.high}%`, mid: occRange.mid } : null,
      startOccupancy: initOccRange ? { display: `${initOccRange.low}%–${initOccRange.high}%`, mid: initOccRange.mid } : null,
      rampMonths: rampMonthsRange ? { display: `${rampMonthsRange.low}–${rampMonthsRange.high} mo`, mid: rampMonthsRange.mid } : null,
      capRate: capRange ? { display: c.capRateAnalysis?.recommendedRange ?? "", mid: (capRange.low + capRange.high) / 2 } : null,
      catering: cateringPct != null ? { display: c.cateringAnalysis?.recommendedBoostPercent ?? "", mid: cateringPct } : null,
      landValue: landPct != null ? { display: c.landValueAllocation?.recommendedPercent ?? "", mid: landPct } : null,
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
      (draft?.costRateIT ?? DEFAULT_COST_RATE_IT) +
      (draft?.costRateFFE ?? DEFAULT_COST_RATE_FFE) +
      (draft?.costRateOther ?? DEFAULT_COST_RATE_OTHER)
    );
  };

  const handleFeeCategoryChange = (index: number, field: keyof FeeCategoryResponse, value: any) => {
    if (!feeDraft) return;
    const updated = [...feeDraft];
    updated[index] = { ...updated[index], [field]: value };
    setFeeDraft(updated);
    setIsDirty(true);
  };

  const totalServiceFeeRate = feeDraft?.filter(c => c.isActive).reduce((sum, c) => sum + c.rate, 0) ?? 0;

  const handleSave = () => {
    updateProperty.mutate({ id: propertyId, data: draft }, {
      onSuccess: () => {
        if (feeDraft) {
          updateFeeCategories.mutate({ propertyId, categories: feeDraft }, {
            onSuccess: () => {
              setIsDirty(false);
              toast({ title: "Saved", description: "Property assumptions updated successfully." });
              setLocation(`/property/${propertyId}`);
            },
            onError: () => {
              toast({ title: "Error", description: "Failed to save fee categories.", variant: "destructive" });
            }
          });
        } else {
          setIsDirty(false);
          toast({ title: "Saved", description: "Property assumptions updated successfully." });
          setLocation(`/property/${propertyId}`);
        }
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="label-text text-gray-700 flex items-center gap-1.5">Property Name<HelpTooltip text="Internal name used to identify this property across the portfolio. Appears in dashboards, reports, and financial statements." /></Label>
                <Input value={draft.name} onChange={(e) => handleChange("name", e.target.value)} className="bg-white border-[#9FBCA4]/30 text-gray-900 placeholder:text-gray-400" />
              </div>
              <div className="space-y-2">
                <Label className="label-text text-gray-700 flex items-center gap-1.5">Location<HelpTooltip text="City and state/region of the property. Used for market research to find comparable properties and local hospitality benchmarks." /></Label>
                <Input value={draft.location} onChange={(e) => handleChange("location", e.target.value)} className="bg-white border-[#9FBCA4]/30 text-gray-900 placeholder:text-gray-400" />
              </div>
              <div className="space-y-2">
                <Label className="label-text text-gray-700 flex items-center gap-1.5">Market<HelpTooltip text="The broader market or MSA (Metropolitan Statistical Area) this property operates in. Drives market research, comp set analysis, and regional benchmarks." /></Label>
                <Input value={draft.market} onChange={(e) => handleChange("market", e.target.value)} className="bg-white border-[#9FBCA4]/30 text-gray-900 placeholder:text-gray-400" />
              </div>

              <div className="sm:col-span-2 border border-[#9FBCA4]/20 rounded-xl p-4 space-y-4">
                <p className="text-sm font-medium text-gray-700 label-text">Address Details <span className="text-gray-400 font-normal">(optional)</span></p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="label-text text-gray-600 text-sm">Street Address</Label>
                    <Input value={draft.streetAddress || ""} onChange={(e) => handleChange("streetAddress", e.target.value || null)} placeholder="123 Main Street" className="bg-white border-[#9FBCA4]/30 text-gray-900 placeholder:text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <Label className="label-text text-gray-600 text-sm">City</Label>
                    <Input value={draft.city || ""} onChange={(e) => handleChange("city", e.target.value || null)} placeholder="Austin" className="bg-white border-[#9FBCA4]/30 text-gray-900 placeholder:text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <Label className="label-text text-gray-600 text-sm">State / Province / Region</Label>
                    <Input value={draft.stateProvince || ""} onChange={(e) => handleChange("stateProvince", e.target.value || null)} placeholder="Texas" className="bg-white border-[#9FBCA4]/30 text-gray-900 placeholder:text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <Label className="label-text text-gray-600 text-sm">Postal / ZIP Code</Label>
                    <Input value={draft.zipPostalCode || ""} onChange={(e) => handleChange("zipPostalCode", e.target.value || null)} placeholder="78701" className="bg-white border-[#9FBCA4]/30 text-gray-900 placeholder:text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <Label className="label-text text-gray-600 text-sm">Country</Label>
                    <Input value={draft.country || ""} onChange={(e) => handleChange("country", e.target.value || null)} placeholder="United States" className="bg-white border-[#9FBCA4]/30 text-gray-900 placeholder:text-gray-400" />
                  </div>
                </div>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="label-text text-gray-700 flex items-center gap-1.5">Property Photo<HelpTooltip text="Upload or generate a representative photo for this property. Displayed on portfolio cards and property detail pages." /></Label>
                <PropertyImagePicker
                  imageUrl={draft.imageUrl}
                  onImageChange={(url) => handleChange("imageUrl", url)}
                  propertyName={draft.name}
                  location={draft.location}
                  variant="light"
                />
              </div>
              <div className="space-y-2">
                <Label className="label-text text-gray-700 flex items-center gap-1.5">Status<HelpTooltip text="Current stage of the property: Acquisition (under contract), Planned (in development), or Active (generating revenue)." /></Label>
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
                <Label className="label-text text-gray-700 flex items-center gap-1.5">Room Count<HelpTooltip text="Total number of rentable guest rooms. This is the primary revenue driver — all room revenue is calculated as Rooms × ADR × Occupancy × 30.5 days/month." /></Label>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
          
          <div className="relative p-6 space-y-5">
            <div>
              <h3 className="text-xl font-display text-gray-900">Capital Structure</h3>
              <p className="text-gray-600 text-sm label-text">Purchase and investment details</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
              <div className="space-y-1.5">
                <Label className="label-text text-gray-700 flex items-center gap-1.5">Purchase Price ($)<HelpTooltip text="Total acquisition cost of the property. This is the basis for equity investment, loan sizing, and depreciation calculations." /></Label>
                <Input 
                  value={formatMoneyInput(draft.purchasePrice)} 
                  onChange={(e) => handleNumberChange("purchasePrice", parseMoneyInput(e.target.value).toString())}
                  className="bg-white border-[#9FBCA4]/30 text-gray-900"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="label-text text-gray-700 flex items-center gap-1.5">Building Improvements ($)<HelpTooltip text="Capital improvements and renovation costs added to the building basis. These are depreciated over 27.5 years along with the building portion of the purchase price." /></Label>
                <Input 
                  value={formatMoneyInput(draft.buildingImprovements)} 
                  onChange={(e) => handleNumberChange("buildingImprovements", parseMoneyInput(e.target.value).toString())}
                  className="bg-white border-[#9FBCA4]/30 text-gray-900"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="label-text text-gray-700 flex items-center gap-1.5">Pre-Opening Costs ($)<HelpTooltip text="One-time costs incurred before the property opens: hiring, training, marketing launch, supplies, licensing, and initial inventory." /></Label>
                <Input 
                  value={formatMoneyInput(draft.preOpeningCosts)} 
                  onChange={(e) => handleNumberChange("preOpeningCosts", parseMoneyInput(e.target.value).toString())}
                  className="bg-white border-[#9FBCA4]/30 text-gray-900"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="label-text text-gray-700 flex items-center gap-1.5">Operating Reserve ($)<HelpTooltip text="Cash reserve set aside at acquisition to cover working capital needs during the ramp-up period before the property reaches stabilized operations." /></Label>
                <Input 
                  value={formatMoneyInput(draft.operatingReserve)} 
                  onChange={(e) => handleNumberChange("operatingReserve", parseMoneyInput(e.target.value).toString())}
                  className="bg-white border-[#9FBCA4]/30 text-gray-900"
                />
              </div>
              <div className="lg:col-span-2 space-y-1.5">
                <div className="flex flex-col gap-0.5">
                  <Label className="label-text text-gray-700 flex items-center gap-1.5">
                    Land Value (%)
                    <HelpTooltip text="Percentage of the purchase price allocated to land. Land does not depreciate under IRS rules (Publication 946). Only the building portion is depreciated over 27.5 years. Typical land allocation ranges from 15-40% depending on location and property type." />
                  </Label>
                  <ResearchBadge value={researchValues.landValue?.display} onClick={() => researchValues.landValue && handleChange("landValuePercent", researchValues.landValue.mid / 100)} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700" data-testid="text-land-value-percent">
                      {((draft.landValuePercent ?? DEFAULT_LAND_VALUE_PERCENT) * 100).toFixed(0)}%
                    </span>
                    <span className="text-xs text-gray-500">
                      Depreciable basis: ${((draft.purchasePrice * (1 - (draft.landValuePercent ?? DEFAULT_LAND_VALUE_PERCENT))) + draft.buildingImprovements).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <Slider
                    data-testid="slider-land-value-percent"
                    value={[(draft.landValuePercent ?? DEFAULT_LAND_VALUE_PERCENT) * 100]}
                    onValueChange={(vals: number[]) => handleNumberChange("landValuePercent", (vals[0] / 100).toString())}
                    min={5}
                    max={60}
                    step={1}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Label className="label-text text-gray-700 flex items-center gap-1.5">Type of Funding<HelpTooltip text="How the acquisition is financed. Full Equity means 100% cash investment. Financed means a portion is covered by a mortgage loan." /></Label>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="label-text text-gray-700 flex items-center gap-1.5">LTV<HelpTooltip text="Loan-to-Value ratio: the percentage of the purchase price financed by the lender. Higher LTV means less equity required but more debt service." /></Label>
                      <EditableValue
                        value={(draft.acquisitionLTV || DEFAULT_LTV) * 100}
                        onChange={(val) => handleChange("acquisitionLTV", val / 100)}
                        format="percent"
                        min={0}
                        max={95}
                        step={5}
                      />
                    </div>
                    <Slider
                      value={[(draft.acquisitionLTV || DEFAULT_LTV) * 100]}
                      onValueChange={(vals: number[]) => handleChange("acquisitionLTV", vals[0] / 100)}
                      min={0}
                      max={95}
                      step={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="label-text text-gray-700 flex items-center gap-1.5">Interest Rate<HelpTooltip text="Annual interest rate on the acquisition loan. Determines monthly debt service payments." /></Label>
                      <EditableValue
                        value={(draft.acquisitionInterestRate || DEFAULT_INTEREST_RATE) * 100}
                        onChange={(val) => handleChange("acquisitionInterestRate", val / 100)}
                        format="percent"
                        min={0}
                        max={20}
                        step={0.25}
                      />
                    </div>
                    <Slider
                      value={[(draft.acquisitionInterestRate || DEFAULT_INTEREST_RATE) * 100]}
                      onValueChange={(vals: number[]) => handleChange("acquisitionInterestRate", vals[0] / 100)}
                      min={0}
                      max={20}
                      step={0.25}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="label-text text-gray-700 flex items-center gap-1.5">Loan Term<HelpTooltip text="Amortization period for the loan in years. Longer terms reduce monthly payments but increase total interest paid." /></Label>
                      <span className="text-sm font-mono text-gray-700">{draft.acquisitionTermYears || DEFAULT_TERM_YEARS} yrs</span>
                    </div>
                    <Slider
                      value={[draft.acquisitionTermYears || DEFAULT_TERM_YEARS]}
                      onValueChange={(vals: number[]) => handleChange("acquisitionTermYears", vals[0])}
                      min={5}
                      max={30}
                      step={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="label-text text-gray-700 flex items-center gap-1.5">Closing Costs<HelpTooltip text="Transaction costs as a percentage of the loan amount: lender fees, appraisal, title insurance, legal fees." /></Label>
                      <EditableValue
                        value={(draft.acquisitionClosingCostRate || DEFAULT_ACQ_CLOSING_COST_RATE) * 100}
                        onChange={(val) => handleChange("acquisitionClosingCostRate", val / 100)}
                        format="percent"
                        min={0}
                        max={10}
                        step={0.5}
                      />
                    </div>
                    <Slider
                      value={[(draft.acquisitionClosingCostRate || DEFAULT_ACQ_CLOSING_COST_RATE) * 100]}
                      onValueChange={(vals: number[]) => handleChange("acquisitionClosingCostRate", vals[0] / 100)}
                      min={0}
                      max={10}
                      step={0.5}
                    />
                  </div>
                </div>
              </div>
            )}

            {draft.type === "Full Equity" && (
              <div className="border-t border-white/10 pt-6">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label className="label-text text-gray-700 flex items-center gap-1.5">Will this property be refinanced?<HelpTooltip text="Whether this property will refinance after the initial equity investment. Refinancing allows extracting equity by placing debt on an appreciated asset." /></Label>
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="label-text text-gray-700 flex items-center gap-1.5">Refinance Date<HelpTooltip text="When the refinancing occurs. Typically 2-3 years after operations start, once the property has established a track record and appraised value." /></Label>
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
                          <div className="flex justify-between items-center">
                            <Label className="label-text text-gray-700 flex items-center gap-1.5">LTV<HelpTooltip text="Loan-to-Value ratio for the refinance loan, based on the property's appraised value at the time of refinancing." /></Label>
                            <EditableValue
                              value={(draft.refinanceLTV || DEFAULT_REFI_LTV) * 100}
                              onChange={(val) => handleChange("refinanceLTV", val / 100)}
                              format="percent"
                              min={0}
                              max={95}
                              step={5}
                            />
                          </div>
                          <Slider
                            value={[(draft.refinanceLTV || DEFAULT_REFI_LTV) * 100]}
                            onValueChange={(vals: number[]) => handleChange("refinanceLTV", vals[0] / 100)}
                            min={0}
                            max={95}
                            step={5}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label className="label-text text-gray-700 flex items-center gap-1.5">Interest Rate<HelpTooltip text="Annual interest rate on the refinance loan." /></Label>
                            <EditableValue
                              value={(draft.refinanceInterestRate || DEFAULT_INTEREST_RATE) * 100}
                              onChange={(val) => handleChange("refinanceInterestRate", val / 100)}
                              format="percent"
                              min={0}
                              max={20}
                              step={0.25}
                            />
                          </div>
                          <Slider
                            value={[(draft.refinanceInterestRate || DEFAULT_INTEREST_RATE) * 100]}
                            onValueChange={(vals: number[]) => handleChange("refinanceInterestRate", vals[0] / 100)}
                            min={0}
                            max={20}
                            step={0.25}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label className="label-text text-gray-700 flex items-center gap-1.5">Loan Term<HelpTooltip text="Amortization period for the refinance loan in years." /></Label>
                            <span className="text-sm font-mono text-gray-700">{draft.refinanceTermYears || DEFAULT_TERM_YEARS} yrs</span>
                          </div>
                          <Slider
                            value={[draft.refinanceTermYears || DEFAULT_TERM_YEARS]}
                            onValueChange={(vals: number[]) => handleChange("refinanceTermYears", vals[0])}
                            min={5}
                            max={30}
                            step={5}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label className="label-text text-gray-700 flex items-center gap-1.5">Closing Costs<HelpTooltip text="Transaction costs for the refinance as a percentage of the new loan amount." /></Label>
                            <EditableValue
                              value={(draft.refinanceClosingCostRate || DEFAULT_REFI_CLOSING_COST_RATE) * 100}
                              onChange={(val) => handleChange("refinanceClosingCostRate", val / 100)}
                              format="percent"
                              min={0}
                              max={10}
                              step={0.5}
                            />
                          </div>
                          <Slider
                            value={[(draft.refinanceClosingCostRate || DEFAULT_REFI_CLOSING_COST_RATE) * 100]}
                            onValueChange={(vals: number[]) => handleChange("refinanceClosingCostRate", vals[0] / 100)}
                            min={0}
                            max={10}
                            step={0.5}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col gap-0.5">
                    <Label className="label-text text-gray-700 flex items-center gap-1.5">
                      Starting ADR
                      <HelpTooltip text="Average Daily Rate at the start of operations. This is the average revenue per occupied room per night." />
                    </Label>
                    <ResearchBadge value={researchValues.adr?.display} onClick={() => researchValues.adr && handleChange("startAdr", researchValues.adr.mid)} />
                  </div>
                  <EditableValue
                    value={draft.startAdr}
                    onChange={(val) => handleChange("startAdr", val)}
                    format="dollar"
                    min={100}
                    max={1200}
                    step={10}
                  />
                </div>
                <Slider 
                  value={[draft.startAdr]}
                  onValueChange={(vals: number[]) => handleChange("startAdr", vals[0])}
                  min={100}
                  max={1200}
                  step={10}
                  className="[&_[role=slider]]:bg-[#9FBCA4]"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="label-text text-gray-700 flex items-center gap-1.5">ADR Annual Growth<HelpTooltip text="Year-over-year percentage increase in ADR. Reflects pricing power, inflation, and market conditions. Typical range is 2-5% for established markets." /></Label>
                  <EditableValue
                    value={draft.adrGrowthRate * 100}
                    onChange={(val) => handleChange("adrGrowthRate", val / 100)}
                    format="percent"
                    min={0}
                    max={50}
                    step={1}
                  />
                </div>
                <Slider 
                  value={[draft.adrGrowthRate * 100]}
                  onValueChange={(vals: number[]) => handleChange("adrGrowthRate", vals[0] / 100)}
                  min={0}
                  max={50}
                  step={1}
                  className="[&_[role=slider]]:bg-[#9FBCA4]"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col gap-0.5">
                    <Label className="label-text text-gray-700 flex items-center gap-1.5">
                      Starting Occupancy
                      <HelpTooltip text="Occupancy rate in the first month of operations. New properties typically start below stabilized levels and ramp up over time." />
                    </Label>
                    <ResearchBadge value={researchValues.startOccupancy?.display} onClick={() => researchValues.startOccupancy && handleChange("startOccupancy", researchValues.startOccupancy.mid / 100)} />
                  </div>
                  <EditableValue
                    value={draft.startOccupancy * 100}
                    onChange={(val) => handleChange("startOccupancy", val / 100)}
                    format="percent"
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>
                <Slider 
                  value={[draft.startOccupancy * 100]}
                  onValueChange={(vals: number[]) => handleChange("startOccupancy", vals[0] / 100)}
                  min={0}
                  max={100}
                  step={1}
                  className="[&_[role=slider]]:bg-[#9FBCA4]"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col gap-0.5">
                    <Label className="label-text text-gray-700 flex items-center gap-1.5">
                      Stabilized Occupancy
                      <HelpTooltip text="Target occupancy rate after the ramp-up period. This is the long-term sustainable occupancy level for the market." />
                    </Label>
                    <ResearchBadge value={researchValues.occupancy?.display} onClick={() => researchValues.occupancy && handleChange("maxOccupancy", researchValues.occupancy.mid / 100)} />
                  </div>
                  <EditableValue
                    value={draft.maxOccupancy * 100}
                    onChange={(val) => handleChange("maxOccupancy", val / 100)}
                    format="percent"
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>
                <Slider 
                  value={[draft.maxOccupancy * 100]}
                  onValueChange={(vals: number[]) => handleChange("maxOccupancy", vals[0] / 100)}
                  min={0}
                  max={100}
                  step={1}
                  className="[&_[role=slider]]:bg-[#9FBCA4]"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col gap-0.5">
                    <Label className="label-text text-gray-700 flex items-center gap-1.5">
                      Occupancy Ramp
                      <HelpTooltip text="Number of months from opening to reach stabilized occupancy. The property linearly ramps from starting to stabilized occupancy over this period." />
                    </Label>
                    <ResearchBadge value={researchValues.rampMonths?.display} onClick={() => researchValues.rampMonths && handleChange("occupancyRampMonths", researchValues.rampMonths.mid)} />
                  </div>
                  <EditableValue
                    value={draft.occupancyRampMonths}
                    onChange={(val) => handleChange("occupancyRampMonths", val)}
                    format="months"
                    min={0}
                    max={36}
                    step={1}
                  />
                </div>
                <Slider 
                  value={[draft.occupancyRampMonths]}
                  onValueChange={(vals: number[]) => handleChange("occupancyRampMonths", vals[0])}
                  min={0}
                  max={36}
                  step={1}
                  className="[&_[role=slider]]:bg-[#9FBCA4]"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="label-text text-gray-700 flex items-center gap-1.5">Occupancy Growth Step<HelpTooltip text="Additional annual occupancy improvement after stabilization. Applied as a small yearly increase once the property has stabilized. Typical range is 1-3%." /></Label>
                  <EditableValue
                    value={draft.occupancyGrowthStep * 100}
                    onChange={(val) => handleChange("occupancyGrowthStep", val / 100)}
                    format="percent"
                    min={0}
                    max={20}
                    step={1}
                  />
                </div>
                <Slider 
                  value={[draft.occupancyGrowthStep * 100]}
                  onValueChange={(vals: number[]) => handleChange("occupancyGrowthStep", vals[0] / 100)}
                  min={0}
                  max={20}
                  step={1}
                  className="[&_[role=slider]]:bg-[#9FBCA4]"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="label-text text-gray-700 flex items-center gap-1.5">Stabilization Period<HelpTooltip text="Total months until the property reaches mature, stabilized operations. Used for financial projections and investor reporting." /></Label>
                  <EditableValue
                    value={draft.stabilizationMonths}
                    onChange={(val) => handleChange("stabilizationMonths", val)}
                    format="months"
                    min={0}
                    max={36}
                    step={1}
                  />
                </div>
                <Slider 
                  value={[draft.stabilizationMonths]}
                  onValueChange={(vals: number[]) => handleChange("stabilizationMonths", vals[0])}
                  min={0}
                  max={36}
                  step={1}
                  className="[&_[role=slider]]:bg-[#9FBCA4]"
                />
              </div>
            </div>

            <div className="space-y-4 pt-2 border-t border-[#9FBCA4]/15">
              <Label className="label-text text-gray-700 flex items-center gap-1.5">
                Additional Revenue as % of Room Revenue
                <HelpTooltip text="Configure how much additional revenue each stream generates as a percentage of room revenue. F&B revenue gets boosted by the catering boost percentage." />
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="label-text text-gray-700 flex items-center gap-1.5">
                      Events
                      <HelpTooltip text="Revenue from meetings, weddings, and other events as a percentage of room revenue." />
                    </Label>
                    <EditableValue
                      value={(draft.revShareEvents ?? DEFAULT_REV_SHARE_EVENTS) * 100}
                      onChange={(val) => handleChange("revShareEvents", val / 100)}
                      format="percent"
                      min={0}
                      max={100}
                      step={5}
                    />
                  </div>
                  <Slider 
                    value={[(draft.revShareEvents ?? DEFAULT_REV_SHARE_EVENTS) * 100]}
                    onValueChange={(vals: number[]) => handleChange("revShareEvents", vals[0] / 100)}
                    min={0}
                    max={100}
                    step={5}
                    className="[&_[role=slider]]:bg-[#9FBCA4]"
                  />
                  <p className="text-xs text-gray-500">Meetings, weddings, conferences</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="label-text text-gray-700 flex items-center gap-1.5">
                      F&B
                      <HelpTooltip text="Base food & beverage revenue as a percentage of room revenue. This gets boosted by the catering boost percentage below." />
                    </Label>
                    <EditableValue
                      value={(draft.revShareFB ?? DEFAULT_REV_SHARE_FB) * 100}
                      onChange={(val) => handleChange("revShareFB", val / 100)}
                      format="percent"
                      min={0}
                      max={100}
                      step={5}
                    />
                  </div>
                  <Slider 
                    value={[(draft.revShareFB ?? DEFAULT_REV_SHARE_FB) * 100]}
                    onValueChange={(vals: number[]) => handleChange("revShareFB", vals[0] / 100)}
                    min={0}
                    max={100}
                    step={5}
                    className="[&_[role=slider]]:bg-[#9FBCA4]"
                  />
                  <p className="text-xs text-gray-500">Restaurant, bar, room service</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="label-text text-gray-700 flex items-center gap-1.5">
                      Other
                      <HelpTooltip text="Revenue from spa, parking, activities, and other ancillary services." />
                    </Label>
                    <EditableValue
                      value={(draft.revShareOther ?? DEFAULT_REV_SHARE_OTHER) * 100}
                      onChange={(val) => handleChange("revShareOther", val / 100)}
                      format="percent"
                      min={0}
                      max={100}
                      step={5}
                    />
                  </div>
                  <Slider 
                    value={[(draft.revShareOther ?? DEFAULT_REV_SHARE_OTHER) * 100]}
                    onValueChange={(vals: number[]) => handleChange("revShareOther", vals[0] / 100)}
                    min={0}
                    max={100}
                    step={5}
                    className="[&_[role=slider]]:bg-[#9FBCA4]"
                  />
                  <p className="text-xs text-gray-500">Spa, parking, activities</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="label-text text-gray-700 flex items-center gap-1.5">
                      Catering Boost
                      <HelpTooltip text="Percentage uplift applied to base F&B revenue from catered events. For example, 30% means total F&B = Base F&B × 1.30." />
                      <ResearchBadge value={researchValues.catering?.display} onClick={() => researchValues.catering && handleChange("cateringBoostPercent", researchValues.catering.mid / 100)} />
                    </Label>
                    <EditableValue
                      value={(draft.cateringBoostPercent ?? DEFAULT_CATERING_BOOST_PCT) * 100}
                      onChange={(val) => handleChange("cateringBoostPercent", val / 100)}
                      format="percent"
                      min={0}
                      max={100}
                      step={5}
                    />
                  </div>
                  <Slider 
                    value={[(draft.cateringBoostPercent ?? DEFAULT_CATERING_BOOST_PCT) * 100]}
                    onValueChange={(vals: number[]) => handleChange("cateringBoostPercent", vals[0] / 100)}
                    min={0}
                    max={100}
                    step={5}
                    className="[&_[role=slider]]:bg-[#9FBCA4]"
                  />
                  <p className="text-xs text-gray-500">F&B uplift from catered events</p>
                </div>
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
                <HelpTooltip text="Operating cost rates grouped by their calculation basis. Some costs are percentages of Room Revenue, others of Total Revenue. Fixed costs (Admin & General, Property Ops, IT) use a base Year 1 dollar amount that escalates annually with the Inflation Escalator Factor. Insurance and Property Taxes are based on property value (Purchase Price + Building Improvements) adjusted by inflation." />
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
                  
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Based on Room Revenue</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label className="text-sm label-text text-gray-700 flex items-center gap-1">Housekeeping<HelpTooltip text="Housekeeping expense = Room Revenue × this rate. Covers cleaning labor, linens, guest supplies, and room maintenance. Calculated monthly as a variable cost that scales with room revenue. USALI Rooms Department." /></Label>
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
                          <Label className="text-sm label-text text-gray-700 flex items-center gap-1">F&B<HelpTooltip text="Food & Beverage expense = Room Revenue × this rate. Covers kitchen labor, food costs, beverages, and dining operations. Calculated as a percentage of Room Revenue (not F&B Revenue) for consistent cost modeling. USALI F&B Department." /></Label>
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
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Based on Total Revenue</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label className="text-sm label-text text-gray-700 flex items-center gap-1">Admin & General<HelpTooltip text="Admin & General expense = (Year 1 Total Revenue ÷ 12) × this rate × annual escalation factor. A fixed cost covering management salaries, accounting, legal, HR, and office operations. The dollar amount is set in Year 1 and escalates annually with the Inflation Escalator Factor. USALI A&G Department." /></Label>
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
                          <Label className="text-sm label-text text-gray-700 flex items-center gap-1">Property Ops<HelpTooltip text="Property Ops expense = (Year 1 Total Revenue ÷ 12) × this rate × annual escalation factor. A fixed cost covering engineering, repairs, grounds maintenance, and facilities. The dollar amount is set in Year 1 and escalates annually with the Inflation Escalator Factor. USALI POM Department." /></Label>
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
                          <Label className="text-sm label-text text-gray-700 flex items-center gap-1">Utilities<HelpTooltip text="Utilities expense is split between variable and fixed components. Variable portion scales with current Total Revenue; fixed portion uses Year 1 base and escalates annually. Covers electricity, gas, water, sewer, and waste. USALI Utilities." /></Label>
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
                        {(() => {
                          const split = globalAssumptions?.utilitiesVariableSplit ?? DEFAULT_UTILITIES_VARIABLE_SPLIT;
                          const rate = (draft.costRateUtilities ?? DEFAULT_COST_RATE_UTILITIES) * 100;
                          return (
                            <div className="mt-1 pl-2 border-l-2 border-gray-200 space-y-1">
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Variable (scales with revenue)</span>
                                <span className="font-mono">{(rate * split).toFixed(1)}%</span>
                              </div>
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Fixed (escalates with inflation)</span>
                                <span className="font-mono">{(rate * (1 - split)).toFixed(1)}%</span>
                              </div>
                              <p className="text-[11px] text-muted-foreground/70">
                                Split is {(split * 100).toFixed(0)}% variable / {((1 - split) * 100).toFixed(0)}% fixed — set in <Link href="/assumptions" className="underline hover:text-primary">Company Assumptions</Link>
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label className="text-sm label-text text-gray-700 flex items-center gap-1">FF&E Reserve<HelpTooltip text="FF&E Reserve = Total Revenue × this rate. A variable set-aside for future replacement of furniture, fixtures, and equipment. Industry standard is 3–5% of revenue. Treated as an operating expense below GOP." /></Label>
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
                          <Label className="text-sm label-text text-gray-700 flex items-center gap-1">Other<HelpTooltip text="Other expenses = (Year 1 Total Revenue ÷ 12) × this rate × annual escalation factor. A fixed cost for miscellaneous operating expenses not categorized elsewhere. Escalates annually with the Inflation Escalator Factor." /></Label>
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
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Based on Property Value</h4>
                    <p className="text-xs text-gray-500 mb-4">Calculated as a percentage of total property value (Purchase Price + Building Improvements), adjusted annually by the Inflation Escalator Factor.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label className="text-sm label-text text-gray-700 flex items-center gap-1">Insurance<HelpTooltip text="Insurance expense = (Purchase Price + Building Improvements) ÷ 12 × this rate × annual escalation factor. Based on total property value, not revenue. Covers property liability, damage, workers' comp, and business interruption coverage. Escalates annually with the Inflation Escalator Factor." /></Label>
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
                          <Label className="text-sm label-text text-gray-700 flex items-center gap-1">Property Taxes<HelpTooltip text="Property tax expense = (Purchase Price + Building Improvements) ÷ 12 × this rate × annual escalation factor. Based on total property value, not revenue. Covers real estate taxes and assessments. Escalates annually with the Inflation Escalator Factor." /></Label>
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
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Part of Services Provided by Management Company</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label className="text-sm label-text text-gray-700 flex items-center gap-1">Marketing<HelpTooltip text="Marketing expense = Total Revenue × this rate. Covers property-level advertising, OTA commissions, and local promotions only. Brand strategy, digital marketing, loyalty programs, and business development are provided by the management company. USALI Sales & Marketing Department." /></Label>
                          <EditableValue
                            value={(draft.costRateMarketing ?? DEFAULT_COST_RATE_MARKETING) * 100}
                            onChange={(val) => handleChange("costRateMarketing", val / 100)}
                            format="percent"
                            min={0}
                            max={15}
                            step={1}
                          />
                        </div>
                        <Slider 
                          value={[(draft.costRateMarketing ?? DEFAULT_COST_RATE_MARKETING) * 100]}
                          onValueChange={(vals: number[]) => handleChange("costRateMarketing", vals[0] / 100)}
                          min={0}
                          max={15}
                          step={1}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label className="text-sm label-text text-gray-700 flex items-center gap-1">IT<HelpTooltip text="IT expense = (Year 1 Total Revenue ÷ 12) × this rate × annual escalation factor. A minimal fixed cost for property-level IT needs only — WiFi, in-room tech, and basic support. Core IT infrastructure (PMS, accounting systems, networks) is provided by the management company." /></Label>
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
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Marketing and IT are primarily provided by the management company. These represent only property-level costs.</p>
                  </div>
                </>
              );
            })()}
            </div>
          </div>
        </div>

        {/* Glass Card - Management Fees */}
        <div className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-white/80 backdrop-blur-xl" />
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#9FBCA4]/10 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-[#9FBCA4]/5 blur-xl" />
          <div className="absolute inset-0 border border-[#9FBCA4]/20 rounded-2xl shadow-[0_8px_32px_rgba(159,188,164,0.15)]" />
          
          <div className="relative p-6">
            <div className="mb-6">
              <h3 className="text-xl font-display text-gray-900 flex items-center">
                Management Fees
                <HelpTooltip text="Fees paid by this property to the management company. Service fees are broken into categories (each a % of Total Revenue). The Incentive Fee is a % of Gross Operating Profit (GOP) collected when GOP is positive." />
              </h3>
              <p className="text-gray-600 text-sm label-text">Fees charged by the management company for operating this property</p>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-semibold text-gray-800 label-text">
                  Service Fee Categories (% of Total Revenue)
                </Label>
                <span className={`text-sm font-mono font-semibold ${totalServiceFeeRate > 0.10 ? 'text-amber-600' : 'text-gray-700'}`} data-testid="text-total-service-fee">
                  Total: {(totalServiceFeeRate * 100).toFixed(1)}%
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {feeDraft?.map((cat, idx) => (
                  <div key={cat.id} className="space-y-2" data-testid={`fee-category-${cat.name.toLowerCase().replace(/\s+/g, '-')}`}>
                    <div className="flex justify-between items-center">
                      <Label className={`flex items-center label-text gap-1.5 ${cat.isActive ? 'text-gray-700' : 'text-gray-400 line-through'}`}>
                        {cat.name}
                        <HelpTooltip text={`${cat.name} service fee = Total Revenue × ${(cat.rate * 100).toFixed(1)}%. Charged monthly as part of the management company's service fees.`} />
                      </Label>
                      <div className="flex items-center gap-2">
                        <EditableValue
                          value={cat.rate * 100}
                          onChange={(val) => handleFeeCategoryChange(idx, "rate", val / 100)}
                          format="percent"
                          min={0}
                          max={5}
                          step={0.1}
                        />
                        <button
                          type="button"
                          onClick={() => handleFeeCategoryChange(idx, "isActive", !cat.isActive)}
                          className={`w-8 h-5 rounded-full transition-colors ${cat.isActive ? 'bg-[#9FBCA4]' : 'bg-gray-300'} relative`}
                          title={cat.isActive ? "Disable this fee" : "Enable this fee"}
                          data-testid={`toggle-fee-${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${cat.isActive ? 'right-0.5' : 'left-0.5'}`} />
                        </button>
                      </div>
                    </div>
                    <Slider 
                      value={[cat.rate * 100]}
                      onValueChange={(vals: number[]) => handleFeeCategoryChange(idx, "rate", vals[0] / 100)}
                      min={0}
                      max={5}
                      step={0.1}
                      disabled={!cat.isActive}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-[#9FBCA4]/20 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col gap-0.5">
                      <Label className="flex items-center label-text text-gray-700 gap-1.5">
                        Incentive Fee (% of GOP)
                        <HelpTooltip text="Incentive Management Fee = max(0, GOP) × this rate. Only charged when Gross Operating Profit is positive, rewarding the management company for strong performance. Industry standard: 10–20% of GOP." />
                      </Label>
                      <ResearchBadge value={researchValues.incentiveFee?.display} onClick={() => researchValues.incentiveFee && handleChange("incentiveManagementFeeRate", researchValues.incentiveFee.mid / 100)} />
                    </div>
                    <EditableValue
                      value={(draft.incentiveManagementFeeRate ?? DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE) * 100}
                      onChange={(val) => handleChange("incentiveManagementFeeRate", val / 100)}
                      format="percent"
                      min={0}
                      max={25}
                      step={1}
                    />
                  </div>
                  <Slider 
                    value={[(draft.incentiveManagementFeeRate ?? DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE) * 100]}
                    onValueChange={(vals: number[]) => handleChange("incentiveManagementFeeRate", vals[0] / 100)}
                    min={0}
                    max={25}
                    step={1}
                  />
                </div>
              </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col gap-0.5">
                    <Label className="flex items-center label-text text-gray-700 gap-1.5">
                      Exit Cap Rate
                      <HelpTooltip text={`The capitalization rate used to determine terminal (exit) value. Exit Value = Year ${exitYear} NOI ÷ Cap Rate. A lower cap rate implies higher property valuation.`} />
                    </Label>
                    <ResearchBadge value={researchValues.capRate?.display} onClick={() => researchValues.capRate && handleChange("exitCapRate", researchValues.capRate.mid / 100)} />
                  </div>
                  <EditableValue
                    value={(draft.exitCapRate ?? DEFAULT_EXIT_CAP_RATE) * 100}
                    onChange={(val) => handleChange("exitCapRate", val / 100)}
                    format="percent"
                    min={1}
                    max={10}
                    step={0.1}
                  />
                </div>
                <Slider 
                  value={[(draft.exitCapRate ?? DEFAULT_EXIT_CAP_RATE) * 100]}
                  onValueChange={(vals: number[]) => handleChange("exitCapRate", vals[0] / 100)}
                  min={1}
                  max={10}
                  step={0.1}
                />
                <p className="text-xs text-gray-600 mt-2">
                  Exit Value = {exitYear} NOI ÷ {((draft.exitCapRate ?? DEFAULT_EXIT_CAP_RATE) * 100).toFixed(1)}% = <span className="font-medium">higher property valuation at lower cap rates</span>
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="flex items-center label-text text-gray-700">
                    Income Tax Rate
                    <HelpTooltip text="Income tax rate for this property's SPV entity, applied to taxable income (NOI minus interest and depreciation) to calculate after-tax cash flow. Set per property to reflect the jurisdiction where the property is located." />
                  </Label>
                  <EditableValue
                    value={(draft.taxRate ?? DEFAULT_TAX_RATE) * 100}
                    onChange={(val) => handleChange("taxRate", val / 100)}
                    format="percent"
                    min={0}
                    max={50}
                    step={1}
                  />
                </div>
                <Slider 
                  value={[(draft.taxRate ?? DEFAULT_TAX_RATE) * 100]}
                  onValueChange={(vals: number[]) => handleChange("taxRate", vals[0] / 100)}
                  min={0}
                  max={50}
                  step={1}
                />
              </div>
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
