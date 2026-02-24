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
import { Loader2, BookOpen, AlertTriangle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import type { GlobalResponse } from "@/lib/api";
import { SaveButton } from "@/components/ui/save-button";
import { GlassButton } from "@/components/ui/glass-button";
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

  const researchValues = (() => {
    if (!research?.content) return {};
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

    return { baseFee, incentiveFee, eventExpense, marketingRate, staffSalary };
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
          <AlertTriangle className="w-8 h-8 text-destructive" />
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
    } catch {
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
                <GlassButton variant="primary" data-testid="button-company-research">
                  <BookOpen className="w-4 h-4" />
                  Standards Research
                </GlassButton>
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
          <FixedOverheadSection formData={formData} onChange={handleUpdate} global={global} modelStartYear={modelStartYear} />
          <VariableCostsSection formData={formData} onChange={handleUpdate} global={global} researchValues={researchValues} />
        </div>
        </ScrollReveal>

        <ScrollReveal>
        <div className="grid gap-6 lg:grid-cols-2">
          <TaxSection formData={formData} onChange={handleUpdate} global={global} />
          <ExitAssumptionsSection formData={formData} onChange={handleUpdate} global={global} />
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
