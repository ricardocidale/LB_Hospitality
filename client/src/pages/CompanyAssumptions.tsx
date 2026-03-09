/**
 * CompanyAssumptions.tsx — Editor for management-company-level financial assumptions.
 *
 * This page lets management-level users configure the inputs that drive the
 * company pro-forma (as opposed to individual property pro-formas). Sections:
 *   • Company Setup — name, model start date, projection years, inflation
 *   • Funding — SAFE note tranches (amount, date, valuation cap, discount rate)
 *   • Management Fees — base and incentive fee structures applied to properties
 *   • Compensation — partner comp schedule (by year) and staff salary assumptions
 *   • Fixed Overhead — office lease, professional services, tech, insurance start dates
 *   • Variable Costs — travel per client, IT licensing, marketing %, misc ops %
 *   • Tax — company income tax rate
 *   • Exit & Sale — exit cap rate, sales commission rate
 *   • Property Expense Rates — default cost-rate overrides for new properties
 *   • Catering — catering revenue boost percentage
 *   • Partner Comp — year-by-year partner count and compensation table
 *   • Summary Footer — visual summary of total expenses and breakeven point
 *
 * AI research integration:
 *   The page loads company-level market research and extracts recommended values
 *   (e.g. industry-standard management fee ranges, staff salary benchmarks).
 *   These are passed to each section component so "suggested" badges appear.
 *
 * On save, the entire formData object is POSTed to the global-assumptions
 * endpoint, and all financial queries are invalidated for full recalculation.
 */
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { AnimatedPage, ScrollReveal } from "@/components/graphics";
import { useGlobalAssumptions, useUpdateGlobalAssumptions, useMarketResearch, useProperties, useAllFeeCategories } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";
import { IconBookOpen, IconAlertTriangle } from "@/components/icons";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import type { GlobalResponse } from "@/lib/api";
import { SaveButton } from "@/components/ui/save-button";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { DEFAULT_MODEL_START_DATE } from "@/lib/constants";
import {
  CompanySetupSection,
  FundingSection,
  ManagementFeesSection,
  CompensationSection,
  FixedOverheadSection,
  VariableCostsSection,
  TaxSection,
  ExitAssumptionsSection,
  PropertyExpenseRatesSection,
  CateringSection,
  PartnerCompSection,
  SummaryFooter,
} from "@/components/company-assumptions";

export default function CompanyAssumptions() {
  const [, setLocation] = useLocation();
  const { data: global, isLoading, isError, refetch } = useGlobalAssumptions();
  const { data: properties = [] } = useProperties();
  const { data: allFeeCategories = [] } = useAllFeeCategories();
  const updateMutation = useUpdateGlobalAssumptions();
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";


  const [formData, setFormData] = useState<Partial<GlobalResponse>>({});
  const [isDirty, setIsDirty] = useState(false);
  const { data: research } = useMarketResearch("company");

  // Extract AI-recommended values from the company-level market research report.
  // These appear as "suggested" badges next to assumption inputs so the user can
  // compare their settings against industry benchmarks (e.g. management fee ranges).
  const researchValues = (() => {
    // Seed-based defaults for company assumptions
    const COMPANY_DEFAULTS: Record<string, { display: string; mid: number }> = {
      staffSalary: { display: "$65K–$90K", mid: 75000 },
      baseFee: { display: "3%–5%", mid: 4 },
      incentiveFee: { display: "8%–15%", mid: 12 },
      eventExpense: { display: "55%–70%", mid: 65 },
      marketingRate: { display: "3%–7%", mid: 5 },
      miscOpsRate: { display: "2%–4%", mid: 3 },
      officeLease: { display: "$24K–$48K", mid: 36000 },
      professionalServices: { display: "$18K–$36K", mid: 24000 },
      techInfra: { display: "$12K–$24K", mid: 18000 },
      businessInsurance: { display: "$8K–$18K", mid: 12000 },
      travelPerClient: { display: "$8K–$18K", mid: 12000 },
      itLicensePerClient: { display: "$2K–$5K", mid: 3000 },
      companyTaxRate: { display: "25%–35%", mid: 30 },
      exitCapRate: { display: "7%–10%", mid: 8.5 },
      salesCommission: { display: "4%–6%", mid: 5 },
      otherExpenseRate: { display: "50%–70%", mid: 60 },
      utilitiesVariableSplit: { display: "50%–70%", mid: 60 },
    };

    if (!research?.content) return COMPANY_DEFAULTS;
    const c = research.content;
    const parsePctRange = (str: string | undefined): { display: string; mid: number } | null => {
      if (!str) return null;
      const nums = str.replace(/[^0-9.,\-–]/g, ' ').split(/[\s–\-]+/).map(s => parseFloat(s.replace(/,/g, ''))).filter(n => !isNaN(n));
      if (nums.length >= 2) return { display: str, mid: (nums[0] + nums[1]) / 2 };
      if (nums.length === 1) return { display: str, mid: nums[0] };
      return null;
    };
    const parseDollarRange = (str: string | undefined): { display: string; mid: number } | null => {
      if (!str) return null;
      const nums = str.replace(/[^0-9.,\-–kK]/g, ' ').replace(/[kK]/g, '000').split(/[\s–\-]+/).map(s => parseFloat(s.replace(/,/g, ''))).filter(n => !isNaN(n));
      if (nums.length >= 2) return { display: str, mid: Math.round((nums[0] + nums[1]) / 2) };
      if (nums.length === 1) return { display: str, mid: nums[0] };
      return null;
    };

    const baseFee = parsePctRange(c.managementFees?.baseFee?.recommended || c.managementFees?.baseFee?.boutiqueRange);
    const incentiveFee = parsePctRange(c.managementFees?.incentiveFee?.recommended || c.managementFees?.incentiveFee?.industryRange);

    const opExRatios = c.industryBenchmarks?.operatingExpenseRatios as Array<{ category: string; range: string }> | undefined;
    const findRatio = (keyword: string) => {
      if (!opExRatios) return null;
      const match = opExRatios.find(r => r.category?.toLowerCase().includes(keyword.toLowerCase()));
      return match ? parsePctRange(match.range) : null;
    };

    const eventExpense = findRatio("event") || findRatio("banquet") || findRatio("catering");
    const marketingRate = findRatio("marketing") || findRatio("sales & marketing") || findRatio("franchise");

    const compBenchmarks = c.compensationBenchmarks;
    const staffSalary = compBenchmarks?.manager ? parseDollarRange(compBenchmarks.manager) : null;

    // Merge AI values over seed defaults
    const merged = { ...COMPANY_DEFAULTS };
    const aiOverrides: Record<string, { display: string; mid: number } | null> = {
      baseFee, incentiveFee, eventExpense, marketingRate, staffSalary,
    };
    for (const [key, val] of Object.entries(aiOverrides)) {
      if (val) merged[key] = val;
    }
    return merged;
  })();

  useEffect(() => {
    if (global) {
      setFormData(global);
    }
  }, [global]);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const modelStartYear = global?.modelStartDate 
    ? new Date(global.modelStartDate).getFullYear() 
    : new Date(DEFAULT_MODEL_START_DATE).getFullYear();

  if (isError) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
          <IconAlertTriangle className="w-8 h-8 text-destructive" />
          <p className="text-muted-foreground">Failed to load assumptions. Please try refreshing the page.</p>
        </div>
      </Layout>
    );
  }

  if (isLoading || !global) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const handleUpdate = <K extends keyof GlobalResponse>(field: K, value: GlobalResponse[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };


  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync(formData);
      setIsDirty(false);
      toast({
        title: "Saved",
        description: "Company assumptions have been updated.",
      });
      setLocation("/company");
    } catch (error) {
      console.error("Failed to save company assumptions:", error);
      toast({
        title: "Error",
        description: "Failed to save company assumptions.",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <AnimatedPage>
      <div className="space-y-6">
        <PageHeader
          title="Company Assumptions"
          subtitle={`Configure ${global.companyName ?? "Hospitality Business"} Co. operating parameters`}
          variant="dark"
          backLink="/company"
          actions={
            <div className="flex items-center gap-3">
              <Link href="/company/research" className="text-inherit no-underline">
                <Button variant="default" data-testid="button-company-research">
                  <IconBookOpen className="w-4 h-4" />
                  Standards Research
                </Button>
              </Link>
              <SaveButton 
                onClick={handleSave} 
                isPending={updateMutation.isPending} 
              />
            </div>
          }
        />

        <CompanySetupSection formData={formData} onChange={handleUpdate} global={global} isAdmin={isAdmin} />

        <FundingSection formData={formData} onChange={handleUpdate} global={global} />

        <div className="grid gap-6 lg:grid-cols-2">
          <ManagementFeesSection formData={formData} onChange={handleUpdate} global={global} properties={properties} allFeeCategories={allFeeCategories} />
          <CompensationSection formData={formData} onChange={handleUpdate} global={global} researchValues={researchValues} />
        </div>

        <ScrollReveal>
        <div className="grid gap-6 lg:grid-cols-2">
          <FixedOverheadSection formData={formData} onChange={handleUpdate} global={global} modelStartYear={modelStartYear} researchValues={researchValues} />
          <VariableCostsSection formData={formData} onChange={handleUpdate} global={global} researchValues={researchValues} />
        </div>
        </ScrollReveal>

        <ScrollReveal>
        <div className="grid gap-6 lg:grid-cols-2">
          <TaxSection formData={formData} onChange={handleUpdate} global={global} researchValues={researchValues} />
          <ExitAssumptionsSection formData={formData} onChange={handleUpdate} global={global} researchValues={researchValues} />
        </div>
        </ScrollReveal>

        <ScrollReveal>
        <div className="grid gap-6 lg:grid-cols-2">
          <PropertyExpenseRatesSection formData={formData} onChange={handleUpdate} global={global} researchValues={researchValues} />
          <CateringSection />
        </div>
        </ScrollReveal>

        <ScrollReveal>
          <PartnerCompSection formData={formData} onChange={handleUpdate} global={global} modelStartYear={modelStartYear} />
        </ScrollReveal>

        <ScrollReveal>
          <SummaryFooter formData={formData} onChange={handleUpdate} global={global} />
        </ScrollReveal>

        <div className="flex justify-end pb-8">
          <SaveButton 
            onClick={handleSave} 
            isPending={updateMutation.isPending}
          />
        </div>
      </div>
      </AnimatedPage>
    </Layout>
  );
}
