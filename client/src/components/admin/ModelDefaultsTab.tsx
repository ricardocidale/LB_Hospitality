import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { GovernedFieldWrapper } from "@/components/ui/governed-field";
import { Loader2 } from "@/components/icons/themed-icons";
import { IconPercent, IconCalendar, IconDollarSign, IconHash } from "@/components/icons";
import { invalidateAllFinancialQueries } from "@/lib/api";
import type { AdminSaveState } from "@/components/admin/types/save-state";

interface ModelDefaultsTabProps {
  onSaveStateChange?: (state: AdminSaveState | null) => void;
}

type Draft = Record<string, any>;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function pctToDisplay(v: number | undefined | null): string {
  if (v == null) return "";
  return (v * 100).toFixed(2).replace(/\.?0+$/, "");
}

function displayToPct(s: string): number {
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n / 100;
}

function FieldRow({ label, tooltip, children, testId }: {
  label: string;
  tooltip?: string;
  children: React.ReactNode;
  testId?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 px-1" data-testid={testId}>
      <Label className="flex items-center gap-1 text-sm text-foreground label-text shrink-0">
        {label}
        {tooltip && <InfoTooltip text={tooltip} />}
      </Label>
      <div className="w-40 shrink-0">{children}</div>
    </div>
  );
}

function PctInput({ value, onChange, testId }: { value: number | undefined; onChange: (v: number) => void; testId: string }) {
  return (
    <div className="relative">
      <Input
        type="number"
        step="0.1"
        value={pctToDisplay(value)}
        onChange={(e) => onChange(displayToPct(e.target.value))}
        className="pr-7 bg-card border-border text-foreground text-right"
        data-testid={testId}
      />
      <IconPercent className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
    </div>
  );
}

function DollarInput({ value, onChange, testId }: { value: number | undefined; onChange: (v: number) => void; testId: string }) {
  return (
    <div className="relative">
      <IconDollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
      <Input
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="pl-7 bg-card border-border text-foreground text-right"
        data-testid={testId}
      />
    </div>
  );
}

function NumInput({ value, onChange, testId, step }: { value: number | undefined; onChange: (v: number) => void; testId: string; step?: string }) {
  return (
    <Input
      type="number"
      step={step}
      value={value ?? ""}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className="bg-card border-border text-foreground text-right"
      data-testid={testId}
    />
  );
}

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card className="bg-card border border-border/80 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
        {description && <CardDescription className="label-text">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="divide-y divide-border/40">{children}</CardContent>
    </Card>
  );
}

function MarketMacroTab({ draft, onChange }: { draft: Draft; onChange: (field: string, value: any) => void }) {
  return (
    <div className="space-y-4">
      <SectionCard title="Economic Environment" description="Global economic assumptions applied across the platform.">
        <FieldRow label="Macro Inflation Rate" tooltip="Annual inflation rate applied to cost escalations and revenue growth projections." testId="field-inflationRate">
          <PctInput value={draft.inflationRate} onChange={(v) => onChange("inflationRate", v)} testId="input-inflationRate" />
        </FieldRow>
        <FieldRow label="Cost of Equity" tooltip="Required return on equity for DCF and NPV calculations. Default 18% for private hospitality." testId="field-costOfEquity">
          <PctInput value={draft.costOfEquity} onChange={(v) => onChange("costOfEquity", v)} testId="input-costOfEquity" />
        </FieldRow>
        <div className="py-3 px-1">
          <GovernedFieldWrapper
            authority="Industry Convention (365/12)"
            label="Days Per Month"
            helperText="Standard day count convention used across the hospitality industry. 30.5 = 365 days / 12 months. Changing this value affects all revenue and expense calculations across every property."
            defaultExpanded={false}
            data-testid="governed-daysPerMonth"
          >
            <NumInput value={draft.daysPerMonth} onChange={(v) => onChange("daysPerMonth", v)} testId="input-daysPerMonth" step="0.5" />
          </GovernedFieldWrapper>
        </div>
      </SectionCard>

      <SectionCard title="Fiscal Calendar" description="Controls the fiscal year alignment for financial reporting.">
        <FieldRow label="Fiscal Year Start Month" tooltip="The month when the fiscal year begins. Affects how annual summaries are grouped." testId="field-fiscalYearStartMonth">
          <Select
            value={String(draft.fiscalYearStartMonth ?? 1)}
            onValueChange={(v) => onChange("fiscalYearStartMonth", parseInt(v))}
          >
            <SelectTrigger className="bg-card border-border" data-testid="select-fiscalYearStartMonth">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldRow>
      </SectionCard>
    </div>
  );
}

function PropertyUnderwritingTab({ draft, onChange }: { draft: Draft; onChange: (field: string, value: any) => void }) {
  const acq = draft.standardAcqPackage ?? {};
  const debt = draft.debtAssumptions ?? {};

  const onAcq = (field: string, value: number) => {
    onChange("standardAcqPackage", { ...acq, [field]: value });
  };
  const onDebt = (field: string, value: number) => {
    onChange("debtAssumptions", { ...debt, [field]: value });
  };

  return (
    <div className="space-y-4">
      <SectionCard title="Operating Cost Rates" description="Default expense rates applied to revenue streams. These pre-fill new properties at creation.">
        <FieldRow label="Event Expense Rate" tooltip="Cost ratio for event revenue (catering, staffing, setup)." testId="field-eventExpenseRate">
          <PctInput value={draft.eventExpenseRate} onChange={(v) => onChange("eventExpenseRate", v)} testId="input-eventExpenseRate" />
        </FieldRow>
        <FieldRow label="Other Expense Rate" tooltip="Cost ratio for miscellaneous other revenue streams." testId="field-otherExpenseRate">
          <PctInput value={draft.otherExpenseRate} onChange={(v) => onChange("otherExpenseRate", v)} testId="input-otherExpenseRate" />
        </FieldRow>
        <FieldRow label="Utilities Variable Split" tooltip="Percentage of utilities that vary with occupancy (vs. fixed base load)." testId="field-utilitiesVariableSplit">
          <PctInput value={draft.utilitiesVariableSplit} onChange={(v) => onChange("utilitiesVariableSplit", v)} testId="input-utilitiesVariableSplit" />
        </FieldRow>
      </SectionCard>

      <SectionCard title="Acquisition Financing" description="Default loan terms applied when adding a new financed property.">
        <FieldRow label="Default LTV" tooltip="Loan-to-value ratio for acquisition debt." testId="field-acqLTV">
          <PctInput value={debt.acqLTV} onChange={(v) => onDebt("acqLTV", v)} testId="input-acqLTV" />
        </FieldRow>
        <FieldRow label="Interest Rate" tooltip="Annual interest rate for acquisition financing." testId="field-acqInterestRate">
          <PctInput value={debt.interestRate} onChange={(v) => onDebt("interestRate", v)} testId="input-acqInterestRate" />
        </FieldRow>
        <FieldRow label="Term (Years)" tooltip="Loan amortization period in years." testId="field-acqTerm">
          <NumInput value={debt.amortizationYears} onChange={(v) => onDebt("amortizationYears", v)} testId="input-acqTerm" />
        </FieldRow>
        <FieldRow label="Closing Cost Rate" tooltip="Transaction costs as a percentage of purchase price." testId="field-acqClosingCost">
          <PctInput value={debt.acqClosingCostRate} onChange={(v) => onDebt("acqClosingCostRate", v)} testId="input-acqClosingCost" />
        </FieldRow>
      </SectionCard>

      <SectionCard title="Refinance Terms" description="Default terms applied when modeling a property refinance event.">
        <FieldRow label="Refi LTV" tooltip="Loan-to-value ratio for refinanced debt." testId="field-refiLTV">
          <PctInput value={debt.refiLTV} onChange={(v) => onDebt("refiLTV", v)} testId="input-refiLTV" />
        </FieldRow>
        <FieldRow label="Refi Interest Rate" tooltip="Annual interest rate for refinanced loans." testId="field-refiInterestRate">
          <PctInput value={debt.refiInterestRate} onChange={(v) => onDebt("refiInterestRate", v)} testId="input-refiInterestRate" />
        </FieldRow>
        <FieldRow label="Refi Term (Years)" tooltip="Amortization period for refinanced loans." testId="field-refiTerm">
          <NumInput value={debt.refiAmortizationYears} onChange={(v) => onDebt("refiAmortizationYears", v)} testId="input-refiTerm" />
        </FieldRow>
        <FieldRow label="Refi Closing Cost Rate" tooltip="Transaction costs for refinancing as a percentage of new loan amount." testId="field-refiClosingCost">
          <PctInput value={debt.refiClosingCostRate} onChange={(v) => onDebt("refiClosingCostRate", v)} testId="input-refiClosingCost" />
        </FieldRow>
      </SectionCard>

      <SectionCard title="Depreciation & Tax" description="Tax-related defaults for property underwriting.">
        <div className="py-3 px-1">
          <GovernedFieldWrapper
            authority="IRS Publication 946"
            label="Depreciation Years"
            helperText={<>27.5 years: residential rental property. 39 years: nonresidential real property. Changing this deviates from standard tax depreciation. Consult your tax advisor.</>}
            referenceUrl="https://www.irs.gov/publications/p946"
            defaultExpanded={false}
            data-testid="governed-depreciationYears"
          >
            <NumInput value={draft.depreciationYears} onChange={(v) => onChange("depreciationYears", v)} testId="input-depreciationYears" step="0.5" />
          </GovernedFieldWrapper>
        </div>
      </SectionCard>

      <SectionCard title="Exit & Disposition" description="Defaults for property sale/exit modeling.">
        <FieldRow label="Exit Cap Rate" tooltip="Capitalization rate used to estimate property value at disposition." testId="field-exitCapRate">
          <PctInput value={draft.exitCapRate} onChange={(v) => onChange("exitCapRate", v)} testId="input-exitCapRate" />
        </FieldRow>
        <FieldRow label="Sales Commission" tooltip="Broker commission rate applied at property sale." testId="field-salesCommissionRate">
          <PctInput value={draft.salesCommissionRate} onChange={(v) => onChange("salesCommissionRate", v)} testId="input-salesCommissionRate" />
        </FieldRow>
        <FieldRow label="Acquisition Commission" tooltip="Broker commission rate applied at property acquisition." testId="field-commissionRate">
          <PctInput value={draft.commissionRate} onChange={(v) => onChange("commissionRate", v)} testId="input-commissionRate" />
        </FieldRow>
      </SectionCard>

      <SectionCard title="Default Acquisition Package" description="Standard purchase assumptions pre-filled when adding a new property to the portfolio.">
        <FieldRow label="Purchase Price" tooltip="Default property purchase price." testId="field-purchasePrice">
          <DollarInput value={acq.purchasePrice} onChange={(v) => onAcq("purchasePrice", v)} testId="input-purchasePrice" />
        </FieldRow>
        <FieldRow label="Building Improvements" tooltip="Default capital for building improvements and renovations." testId="field-buildingImprovements">
          <DollarInput value={acq.buildingImprovements} onChange={(v) => onAcq("buildingImprovements", v)} testId="input-buildingImprovements" />
        </FieldRow>
        <FieldRow label="Pre-Opening Costs" tooltip="Costs incurred before the property begins operations (staffing, marketing, training)." testId="field-preOpeningCosts">
          <DollarInput value={acq.preOpeningCosts} onChange={(v) => onAcq("preOpeningCosts", v)} testId="input-preOpeningCosts" />
        </FieldRow>
        <FieldRow label="Operating Reserve" tooltip="Cash reserve set aside for initial operations before stabilization." testId="field-operatingReserve">
          <DollarInput value={acq.operatingReserve} onChange={(v) => onAcq("operatingReserve", v)} testId="input-operatingReserve" />
        </FieldRow>
        <FieldRow label="Months to Operations" tooltip="Expected months from closing to start of hotel operations." testId="field-monthsToOps">
          <NumInput value={acq.monthsToOps} onChange={(v) => onAcq("monthsToOps", v)} testId="input-monthsToOps" />
        </FieldRow>
      </SectionCard>
    </div>
  );
}

export default function ModelDefaultsTab({ onSaveStateChange }: ModelDefaultsTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: saved, isLoading } = useQuery({
    queryKey: ["globalAssumptions"],
    queryFn: async () => {
      const res = await fetch("/api/global-assumptions", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch global assumptions");
      return res.json();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (updates: Draft) => {
      const res = await fetch("/api/global-assumptions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...saved, ...updates }),
      });
      if (!res.ok) throw new Error("Failed to save model defaults");
      return res.json();
    },
    onSuccess: () => {
      invalidateAllFinancialQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: ["globalAssumptions"] });
      toast({ title: "Model defaults saved", description: "Changes will apply to new entities. Existing properties retain their current values." });
      setIsDirty(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save model defaults.", variant: "destructive" });
    },
  });

  const [draft, setDraft] = useState<Draft>({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (saved) {
      setDraft({ ...saved });
      setIsDirty(false);
    }
  }, [saved]);

  const handleChange = useCallback((field: string, value: any) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }, []);

  const handleSave = useCallback(() => {
    saveMutation.mutate(draft);
  }, [draft, saveMutation]);

  useEffect(() => {
    onSaveStateChange?.({
      isDirty,
      isPending: saveMutation.isPending,
      onSave: handleSave,
    });
    return () => onSaveStateChange?.(null);
  }, [isDirty, saveMutation.isPending, handleSave, onSaveStateChange]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div data-testid="admin-model-defaults">
      <Tabs defaultValue="market-macro" className="space-y-4">
        <TabsList className="bg-muted/50 border border-border/60">
          <TabsTrigger value="market-macro" data-testid="tab-market-macro">Market & Macro</TabsTrigger>
          <TabsTrigger value="property-underwriting" data-testid="tab-property-underwriting">Property Underwriting</TabsTrigger>
        </TabsList>

        <TabsContent value="market-macro">
          <MarketMacroTab draft={draft} onChange={handleChange} />
        </TabsContent>

        <TabsContent value="property-underwriting">
          <PropertyUnderwritingTab draft={draft} onChange={handleChange} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
