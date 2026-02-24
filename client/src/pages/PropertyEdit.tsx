import Layout from "@/components/Layout";
import { useProperty, useUpdateProperty, useGlobalAssumptions, useMarketResearch, useFeeCategories, useUpdateFeeCategories, type FeeCategoryResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, BookOpen, AlertTriangle } from "lucide-react";
import { SaveButton } from "@/components/ui/save-button";
import { GlassButton } from "@/components/ui/glass-button";
import { PageHeader } from "@/components/ui/page-header";
import { Link, useRoute, useLocation } from "wouter";
import { useState, useEffect } from "react";
import {
  PROJECTION_YEARS,
  DEFAULT_MODEL_START_DATE,
} from "@/lib/constants";
import {
  BasicInfoSection,
  TimelineSection,
  CapitalStructureSection,
  RevenueAssumptionsSection,
  OperatingCostRatesSection,
  ManagementFeesSection,
  OtherAssumptionsSection,
} from "@/components/property-edit";

export default function PropertyEdit() {
  const [, params] = useRoute("/property/:id/edit");
  const [, setLocation] = useLocation();
  const propertyId = params?.id ? parseInt(params.id) : 0;
  
  const { data: property, isLoading, isError } = useProperty(propertyId);
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
    const GENERIC_DEFAULTS: Record<string, { display: string; mid: number; source?: string }> = {
      adr: { display: "$175–$225", mid: 193 },
      occupancy: { display: "65%–73%", mid: 69 },
      startOccupancy: { display: "30%–45%", mid: 40 },
      rampMonths: { display: "12–24 mo", mid: 18 },
      capRate: { display: "8.0%–9.5%", mid: 8.5 },
      catering: { display: "25%–35%", mid: 30 },
      landValue: { display: "15%–25%", mid: 20 },
      costHousekeeping: { display: "15%–22%", mid: 20 },
      costFB: { display: "7%–12%", mid: 9 },
      costAdmin: { display: "4%–7%", mid: 5 },
      costPropertyOps: { display: "3%–5%", mid: 4 },
      costUtilities: { display: "2.9%–4.0%", mid: 3.3 },
      costFFE: { display: "3%–5%", mid: 4 },
      costMarketing: { display: "1%–3%", mid: 2 },
      costIT: { display: "0.5%–1.5%", mid: 1 },
      costOther: { display: "3%–6%", mid: 5 },
      costInsurance: { display: "0.3%–0.5%", mid: 0.4 },
      costPropertyTaxes: { display: "1.0%–2.5%", mid: 1.5 },
      svcFeeMarketing: { display: "0.5%–1.5%", mid: 1 },
      svcFeeIT: { display: "0.3%–0.8%", mid: 0.5 },
      svcFeeAccounting: { display: "0.5%–1.5%", mid: 1 },
      svcFeeReservations: { display: "1.0%–2.0%", mid: 1.5 },
      svcFeeGeneralMgmt: { display: "0.7%–1.2%", mid: 1 },
      incentiveFee: { display: "8%–12%", mid: 10 },
      incomeTax: { display: "24%–28%", mid: 25 },
    };

    const dbResearch = property?.researchValues as Record<string, { display: string; mid: number; source?: string }> | null | undefined;
    const baseDefaults: Record<string, { display: string; mid: number; source?: string }> = { ...GENERIC_DEFAULTS };
    if (dbResearch) {
      for (const [key, val] of Object.entries(dbResearch)) {
        if (val && val.display && val.mid != null && val.source !== 'none') {
          baseDefaults[key] = val;
        }
      }
    }

    if (!research?.content) {
      return baseDefaults;
    }
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
    const parseCostRate = (cat: { recommendedRate?: string; industryRange?: string } | undefined): { display: string; mid: number } | null => {
      if (!cat?.recommendedRate) return null;
      const pct = parsePct(cat.recommendedRate);
      if (pct == null) return null;
      return { display: cat.recommendedRate, mid: pct };
    };

    const oc = c.operatingCostAnalysis;
    const pvc = c.propertyValueCostAnalysis;
    const msf = c.managementServiceFeeAnalysis;
    const ita = c.incomeTaxAnalysis;

    const aiValues: Record<string, { display: string; mid: number } | null> = {
      adr: adrRange ? { display: c.adrAnalysis?.recommendedRange ?? "", mid: adrRange.mid } : null,
      occupancy: occRange ? { display: `${occRange.low}%–${occRange.high}%`, mid: occRange.mid } : null,
      startOccupancy: initOccRange ? { display: `${initOccRange.low}%–${initOccRange.high}%`, mid: initOccRange.mid } : null,
      rampMonths: rampMonthsRange ? { display: `${rampMonthsRange.low}–${rampMonthsRange.high} mo`, mid: rampMonthsRange.mid } : null,
      capRate: capRange ? { display: c.capRateAnalysis?.recommendedRange ?? "", mid: (capRange.low + capRange.high) / 2 } : null,
      catering: cateringPct != null ? { display: c.cateringAnalysis?.recommendedBoostPercent ?? "", mid: cateringPct } : null,
      landValue: landPct != null ? { display: c.landValueAllocation?.recommendedPercent ?? "", mid: landPct } : null,
      costHousekeeping: parseCostRate(oc?.roomRevenueBased?.housekeeping),
      costFB: parseCostRate(oc?.roomRevenueBased?.fbCostOfSales),
      costAdmin: parseCostRate(oc?.totalRevenueBased?.adminGeneral),
      costPropertyOps: parseCostRate(oc?.totalRevenueBased?.propertyOps),
      costUtilities: parseCostRate(oc?.totalRevenueBased?.utilities),
      costFFE: parseCostRate(oc?.totalRevenueBased?.ffeReserve),
      costMarketing: parseCostRate(oc?.totalRevenueBased?.marketing),
      costIT: parseCostRate(oc?.totalRevenueBased?.it),
      costOther: parseCostRate(oc?.totalRevenueBased?.other),
      costInsurance: parseCostRate(pvc?.insurance),
      costPropertyTaxes: parseCostRate(pvc?.propertyTaxes),
      svcFeeMarketing: parseCostRate(msf?.serviceFeeCategories?.marketing),
      svcFeeIT: parseCostRate(msf?.serviceFeeCategories?.it),
      svcFeeAccounting: parseCostRate(msf?.serviceFeeCategories?.accounting),
      svcFeeReservations: parseCostRate(msf?.serviceFeeCategories?.reservations),
      svcFeeGeneralMgmt: parseCostRate(msf?.serviceFeeCategories?.generalManagement),
      incentiveFee: parseCostRate(msf?.incentiveFee),
      incomeTax: ita?.recommendedRate ? parseCostRate({ recommendedRate: ita.recommendedRate }) : null,
    };

    const merged: Record<string, { display: string; mid: number; source?: string }> = { ...baseDefaults };
    for (const [key, val] of Object.entries(aiValues)) {
      if (val) {
        merged[key] = { ...val, source: 'ai' };
      }
    }
    return merged;
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

  if (isError) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
          <AlertTriangle className="w-8 h-8 text-destructive" />
          <p className="text-muted-foreground">Failed to load property data. Please try refreshing the page.</p>
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

  const handleChange = (key: string, value: string | number | null) => {
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

  const sectionProps = { draft, onChange: handleChange, onNumberChange: handleNumberChange, globalAssumptions, researchValues };

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

        <BasicInfoSection {...sectionProps} />
        <TimelineSection {...sectionProps} />
        <CapitalStructureSection {...sectionProps} />
        <RevenueAssumptionsSection {...sectionProps} />
        <OperatingCostRatesSection {...sectionProps} />
        <ManagementFeesSection
          {...sectionProps}
          feeDraft={feeDraft}
          onFeeCategoryChange={handleFeeCategoryChange}
          totalServiceFeeRate={totalServiceFeeRate}
        />
        <OtherAssumptionsSection {...sectionProps} exitYear={exitYear} />

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
