import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { GovernedFieldWrapper } from "@/components/ui/governed-field";
import { Loader2 } from "@/components/icons/themed-icons";
import { Button } from "@/components/ui/button";
import { IconSave } from "@/components/icons";
import EditableValue from "@/components/company-assumptions/EditableValue";
import { invalidateAllFinancialQueries } from "@/lib/api";
import { useResearchConfig, useSaveResearchConfig } from "@/lib/api/admin";
import { FALLBACK_MODELS, LLM_VENDORS } from "./research-center/research-shared";
import type { LlmVendor, AiModelEntry, ResearchConfig } from "@shared/schema";
import type { AdminSaveState } from "@/components/admin/types/save-state";
import {
  DEFAULT_START_ADR,
  DEFAULT_ADR_GROWTH_RATE,
  DEFAULT_START_OCCUPANCY,
  DEFAULT_MAX_OCCUPANCY,
  DEFAULT_OCCUPANCY_RAMP_MONTHS,
  DEFAULT_ROOM_COUNT,
  DEFAULT_REV_SHARE_FB,
  DEFAULT_REV_SHARE_EVENTS,
  DEFAULT_REV_SHARE_OTHER,
  DEFAULT_CATERING_BOOST_PCT,
  DEFAULT_COST_RATE_ROOMS,
  DEFAULT_COST_RATE_FB,
  DEFAULT_COST_RATE_ADMIN,
  DEFAULT_COST_RATE_MARKETING,
  DEFAULT_COST_RATE_PROPERTY_OPS,
  DEFAULT_COST_RATE_UTILITIES,
  DEFAULT_COST_RATE_TAXES,
  DEFAULT_COST_RATE_IT,
  DEFAULT_COST_RATE_FFE,
  DEFAULT_COST_RATE_OTHER,
  DEFAULT_COST_RATE_INSURANCE,
  DEFAULT_PROPERTY_TAX_RATE,
  DEFAULT_LAND_VALUE_PERCENT,
} from "@shared/constants";

interface ModelDefaultsTabProps {
  onSaveStateChange?: (state: AdminSaveState | null) => void;
}

type Draft = Record<string, any>;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function Section({ title, description, children, grid }: { title: string; description?: string; children: React.ReactNode; grid?: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-lg p-6 bg-card border border-border shadow-sm h-full">
      <div className="relative h-full">
        <div className="space-y-6 h-full">
          <div>
            <h3 className="text-lg font-display text-foreground flex items-center gap-2">{title}</h3>
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
          {grid ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-4">
              {children}
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}

function ResearchRangeLabel({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <span className="text-xs font-medium rounded-md px-1.5 py-0.5 text-yellow-800 bg-yellow-50 border border-yellow-200 whitespace-nowrap">
      {text}
    </span>
  );
}

function PctField({ label, tooltip, value, fallback, onChange, min, max, step, sliderMax, testId, researchRange }: {
  label: string;
  tooltip: string;
  value: number | null | undefined;
  fallback: number;
  onChange: (field: string, v: number) => void;
  min: number;
  max: number;
  step: number;
  sliderMax?: number;
  testId: string;
  researchRange?: string;
}) {
  const current = value ?? fallback;
  return (
    <div className="space-y-3" data-testid={testId}>
      <div className="flex items-center justify-between">
        <Label className="flex items-center flex-wrap gap-1 text-foreground label-text min-w-0">
          {label}
          <InfoTooltip text={tooltip} />
          {researchRange && <ResearchRangeLabel text={researchRange} />}
        </Label>
        <EditableValue
          value={current}
          onChange={(v) => onChange(testId.replace("field-", ""), v)}
          format="percent"
          min={min}
          max={max}
          step={step}
        />
      </div>
      <Slider
        value={[current * 100]}
        onValueChange={([v]) => onChange(testId.replace("field-", ""), v / 100)}
        min={min * 100}
        max={(sliderMax ?? max) * 100}
        step={step * 100}
      />
    </div>
  );
}

function DollarField({ label, tooltip, value, fallback, onChange, min, max, step, testId, researchRange }: {
  label: string;
  tooltip: string;
  value: number | null | undefined;
  fallback: number;
  onChange: (field: string, v: number) => void;
  min: number;
  max: number;
  step: number;
  testId: string;
  researchRange?: string;
}) {
  const current = value ?? fallback;
  return (
    <div className="space-y-3" data-testid={testId}>
      <div className="flex items-center justify-between">
        <Label className="flex items-center flex-wrap gap-1 text-foreground label-text min-w-0">
          {label}
          <InfoTooltip text={tooltip} />
          {researchRange && <ResearchRangeLabel text={researchRange} />}
        </Label>
        <EditableValue
          value={current}
          onChange={(v) => onChange(testId.replace("field-", ""), v)}
          format="dollar"
          min={min}
          max={max}
          step={step}
        />
      </div>
      <Slider
        value={[current]}
        onValueChange={([v]) => onChange(testId.replace("field-", ""), v)}
        min={min}
        max={max}
        step={step}
      />
    </div>
  );
}

function NumberField({ label, tooltip, value, fallback, onChange, min, max, step, testId, researchRange }: {
  label: string;
  tooltip: string;
  value: number | null | undefined;
  fallback: number;
  onChange: (field: string, v: number) => void;
  min: number;
  max: number;
  step: number;
  testId: string;
  researchRange?: string;
}) {
  const current = value ?? fallback;
  return (
    <div className="space-y-3" data-testid={testId}>
      <div className="flex items-center justify-between">
        <Label className="flex items-center flex-wrap gap-1 text-foreground label-text min-w-0">
          {label}
          <InfoTooltip text={tooltip} />
          {researchRange && <ResearchRangeLabel text={researchRange} />}
        </Label>
        <EditableValue
          value={current}
          onChange={(v) => onChange(testId.replace("field-", ""), v)}
          format="number"
          min={min}
          max={max}
          step={step}
        />
      </div>
      <Slider
        value={[current]}
        onValueChange={([v]) => onChange(testId.replace("field-", ""), v)}
        min={min}
        max={max}
        step={step}
      />
    </div>
  );
}

function TabBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function MarketMacroTab({ draft, onChange }: { draft: Draft; onChange: (field: string, value: any) => void }) {
  return (
    <div className="space-y-5">
      <TabBanner>
        Global economic assumptions that affect all projections across the platform. Changes here recalculate every property and the management company model.
      </TabBanner>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Section title="Economic Environment" description="Core macroeconomic rates used in DCF, NPV, and cost escalation calculations.">
          <PctField
            label="Macro Inflation Rate"
            tooltip="Annual inflation rate applied to cost escalations and revenue growth projections across all properties."
            value={draft.inflationRate}
            fallback={0.03}
            onChange={onChange}
            min={0} max={0.15} step={0.005}
            testId="field-inflationRate"
          />
          <PctField
            label="Cost of Equity"
            tooltip="Required return on equity for DCF and NPV calculations. Industry standard is 18% for private hospitality investments."
            value={draft.costOfEquity}
            fallback={0.18}
            onChange={onChange}
            min={0.05} max={0.35} step={0.005}
            testId="field-costOfEquity"
          />
          <div className="pt-2 col-span-full">
            <GovernedFieldWrapper
              authority="Industry Convention (365/12)"
              label="Days Per Month"
              helperText="Standard day count convention used across the hospitality industry. 30.5 = 365 days / 12 months. Changing this value affects all revenue and expense calculations across every property."
              defaultExpanded={false}
              data-testid="governed-daysPerMonth"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-foreground label-text">Convention Value</Label>
                  <EditableValue
                    value={draft.daysPerMonth ?? 30.5}
                    onChange={(v) => onChange("daysPerMonth", v)}
                    format="number"
                    min={28} max={31} step={0.5}
                  />
                </div>
                <Slider
                  value={[draft.daysPerMonth ?? 30.5]}
                  onValueChange={([v]) => onChange("daysPerMonth", v)}
                  min={28} max={31} step={0.5}
                />
              </div>
            </GovernedFieldWrapper>
          </div>
        </Section>

        <Section title="Fiscal Calendar" description="Controls the fiscal year alignment for financial reporting.">
          <div className="flex items-center justify-between col-span-full" data-testid="field-fiscalYearStartMonth">
            <Label className="flex items-center text-foreground label-text">
              Fiscal Year Start Month
              <InfoTooltip text="The month when the fiscal year begins. Affects how annual summaries are grouped." />
            </Label>
            <Select
              value={String(draft.fiscalYearStartMonth ?? 1)}
              onValueChange={(v) => onChange("fiscalYearStartMonth", parseInt(v))}
            >
              <SelectTrigger className="w-40 bg-card border-border" data-testid="select-fiscalYearStartMonth">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Section>
      </div>
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
    <div className="space-y-5">
      <TabBanner>
        Template values applied when creating new properties. Existing properties retain their current values. NULL fields fall back to system constants.
      </TabBanner>

      <Section grid title="Revenue Assumptions" description="Default revenue parameters pre-filled when adding a new hotel to the portfolio.">
        <DollarField
          label="Starting ADR"
          tooltip="Average Daily Rate at property opening. This is the base rate before any growth adjustments."
          value={draft.defaultStartAdr}
          fallback={DEFAULT_START_ADR}
          onChange={(_, v) => onChange("defaultStartAdr", v)}
          min={50} max={1500} step={25}
          testId="field-defaultStartAdr"
          researchRange="$150–$500"
        />
        <PctField
          label="ADR Growth Rate"
          tooltip="Annual rate at which ADR increases year-over-year, typically tracking inflation plus market premiums."
          value={draft.defaultAdrGrowthRate}
          fallback={DEFAULT_ADR_GROWTH_RATE}
          onChange={(_, v) => onChange("defaultAdrGrowthRate", v)}
          min={0} max={0.15} step={0.005}
          testId="field-defaultAdrGrowthRate"
          researchRange="2%–5%"
        />
        <PctField
          label="Starting Occupancy"
          tooltip="Occupancy rate at property opening, before ramp-up to stabilization. Typically 50-60% for new boutique hotels."
          value={draft.defaultStartOccupancy}
          fallback={DEFAULT_START_OCCUPANCY}
          onChange={(_, v) => onChange("defaultStartOccupancy", v)}
          min={0.1} max={1} step={0.01}
          testId="field-defaultStartOccupancy"
          researchRange="50%–65%"
        />
        <PctField
          label="Max (Stabilized) Occupancy"
          tooltip="Target occupancy after ramp-up period. Luxury boutique hotels typically stabilize at 75-85%."
          value={draft.defaultMaxOccupancy}
          fallback={DEFAULT_MAX_OCCUPANCY}
          onChange={(_, v) => onChange("defaultMaxOccupancy", v)}
          min={0.3} max={1} step={0.01}
          testId="field-defaultMaxOccupancy"
          researchRange="70%–85%"
        />
        <NumberField
          label="Occupancy Ramp Months"
          tooltip="Number of months to ramp from starting occupancy to stabilized occupancy. Typically 3-12 months for boutique properties."
          value={draft.defaultOccupancyRampMonths}
          fallback={DEFAULT_OCCUPANCY_RAMP_MONTHS}
          onChange={(_, v) => onChange("defaultOccupancyRampMonths", Math.round(v))}
          min={0} max={24} step={1}
          testId="field-defaultOccupancyRampMonths"
          researchRange="3–12 mo"
        />
        <NumberField
          label="Default Room Count"
          tooltip="Number of keys (rooms) for a new property. Boutique hotels are typically 10-100 rooms."
          value={draft.defaultRoomCount}
          fallback={DEFAULT_ROOM_COUNT}
          onChange={(_, v) => onChange("defaultRoomCount", Math.round(v))}
          min={1} max={500} step={1}
          testId="field-defaultRoomCount"
          researchRange="10–100 keys"
        />
        <PctField
          label="F&B Revenue Share"
          tooltip="Food & Beverage revenue as a percentage of total room revenue. Varies by hotel concept and restaurant program."
          value={draft.defaultRevShareFb}
          fallback={DEFAULT_REV_SHARE_FB}
          onChange={(_, v) => onChange("defaultRevShareFb", v)}
          min={0} max={0.5} step={0.01}
          testId="field-defaultRevShareFb"
          researchRange="15%–30%"
        />
        <PctField
          label="Events Revenue Share"
          tooltip="Events/banquet revenue as a percentage of total room revenue. Higher for properties with dedicated event spaces."
          value={draft.defaultRevShareEvents}
          fallback={DEFAULT_REV_SHARE_EVENTS}
          onChange={(_, v) => onChange("defaultRevShareEvents", v)}
          min={0} max={0.5} step={0.01}
          testId="field-defaultRevShareEvents"
          researchRange="5%–15%"
        />
        <PctField
          label="Other Revenue Share"
          tooltip="Miscellaneous revenue (spa, parking, retail) as a percentage of room revenue."
          value={draft.defaultRevShareOther}
          fallback={DEFAULT_REV_SHARE_OTHER}
          onChange={(_, v) => onChange("defaultRevShareOther", v)}
          min={0} max={0.3} step={0.005}
          testId="field-defaultRevShareOther"
          researchRange="3%–10%"
        />
        <PctField
          label="Catering Boost"
          tooltip="Additional catering revenue uplift applied to events revenue. Represents incremental F&B from event catering."
          value={draft.defaultCateringBoostPct}
          fallback={DEFAULT_CATERING_BOOST_PCT}
          onChange={(_, v) => onChange("defaultCateringBoostPct", v)}
          min={0} max={0.5} step={0.01}
          testId="field-defaultCateringBoostPct"
          researchRange="5%–20%"
        />
      </Section>

      <Section grid title="USALI Operating Cost Rates" description="Uniform System of Accounts for the Lodging Industry — expense rates as a percentage of total revenue.">
        <PctField
          label="Rooms Department"
          tooltip="Housekeeping, front desk, guest supplies, linens. USALI Dept 1."
          value={draft.defaultCostRateRooms}
          fallback={DEFAULT_COST_RATE_ROOMS}
          onChange={(_, v) => onChange("defaultCostRateRooms", v)}
          min={0} max={0.4} step={0.005}
          testId="field-defaultCostRateRooms"
          researchRange="18%–25%"
        />
        <PctField
          label="Food & Beverage"
          tooltip="F&B cost of goods sold plus labor. USALI Dept 2."
          value={draft.defaultCostRateFb}
          fallback={DEFAULT_COST_RATE_FB}
          onChange={(_, v) => onChange("defaultCostRateFb", v)}
          min={0} max={0.4} step={0.005}
          testId="field-defaultCostRateFb"
          researchRange="5%–12%"
        />
        <PctField
          label="Administrative & General"
          tooltip="General & Administrative expenses — accounting, HR, legal, office supplies. USALI undistributed."
          value={draft.defaultCostRateAdmin}
          fallback={DEFAULT_COST_RATE_ADMIN}
          onChange={(_, v) => onChange("defaultCostRateAdmin", v)}
          min={0} max={0.2} step={0.005}
          testId="field-defaultCostRateAdmin"
          researchRange="7%–10%"
        />
        <PctField
          label="Sales & Marketing"
          tooltip="Advertising, OTA commissions, sales team costs, loyalty programs."
          value={draft.defaultCostRateMarketing}
          fallback={DEFAULT_COST_RATE_MARKETING}
          onChange={(_, v) => onChange("defaultCostRateMarketing", v)}
          min={0} max={0.15} step={0.005}
          testId="field-defaultCostRateMarketing"
          researchRange="5%–8%"
        />
        <PctField
          label="Property Operations & Maintenance"
          tooltip="Building maintenance, grounds, engineering, repairs. USALI POM."
          value={draft.defaultCostRatePropertyOps}
          fallback={DEFAULT_COST_RATE_PROPERTY_OPS}
          onChange={(_, v) => onChange("defaultCostRatePropertyOps", v)}
          min={0} max={0.15} step={0.005}
          testId="field-defaultCostRatePropertyOps"
          researchRange="4%–7%"
        />
        <PctField
          label="Utilities"
          tooltip="Electric, water, gas, internet, telecom. Split between fixed base load and variable occupancy-driven costs."
          value={draft.defaultCostRateUtilities}
          fallback={DEFAULT_COST_RATE_UTILITIES}
          onChange={(_, v) => onChange("defaultCostRateUtilities", v)}
          min={0} max={0.15} step={0.005}
          testId="field-defaultCostRateUtilities"
          researchRange="3%–6%"
        />
        <PctField
          label="Property Taxes"
          tooltip="Real estate / property taxes as a rate of total revenue."
          value={draft.defaultCostRateTaxes}
          fallback={DEFAULT_COST_RATE_TAXES}
          onChange={(_, v) => onChange("defaultCostRateTaxes", v)}
          min={0} max={0.1} step={0.005}
          testId="field-defaultCostRateTaxes"
          researchRange="2%–4%"
        />
        <PctField
          label="Information Technology"
          tooltip="PMS, POS, WiFi infrastructure, IT support, cybersecurity."
          value={draft.defaultCostRateIt}
          fallback={DEFAULT_COST_RATE_IT}
          onChange={(_, v) => onChange("defaultCostRateIt", v)}
          min={0} max={0.05} step={0.001}
          testId="field-defaultCostRateIt"
          researchRange="1%–3%"
        />
        <PctField
          label="FF&E Reserve"
          tooltip="Furniture, Fixtures & Equipment replacement reserve. Industry standard 4% of revenue for ongoing capital replacement."
          value={draft.defaultCostRateFfe}
          fallback={DEFAULT_COST_RATE_FFE}
          onChange={(_, v) => onChange("defaultCostRateFfe", v)}
          min={0} max={0.1} step={0.005}
          testId="field-defaultCostRateFfe"
          researchRange="3%–5%"
        />
        <PctField
          label="Insurance"
          tooltip="Property insurance — liability, property, business interruption coverage."
          value={draft.defaultCostRateInsurance}
          fallback={DEFAULT_COST_RATE_INSURANCE}
          onChange={(_, v) => onChange("defaultCostRateInsurance", v)}
          min={0} max={0.05} step={0.001}
          testId="field-defaultCostRateInsurance"
          researchRange="1%–2%"
        />
        <PctField
          label="Other Operating Expenses"
          tooltip="Miscellaneous operating costs not captured in other categories."
          value={draft.defaultCostRateOther}
          fallback={DEFAULT_COST_RATE_OTHER}
          onChange={(_, v) => onChange("defaultCostRateOther", v)}
          min={0} max={0.15} step={0.005}
          testId="field-defaultCostRateOther"
          researchRange="1%–3%"
        />
      </Section>

      <Section grid title="Revenue Stream Expense Rates" description="Direct expense rates tied to specific ancillary revenue streams.">
        <PctField
          label="Event Expense Rate"
          tooltip="Cost ratio for event revenue (catering, staffing, setup)."
          value={draft.eventExpenseRate}
          fallback={0.5}
          onChange={onChange}
          min={0} max={1} step={0.01}
          testId="field-eventExpenseRate"
          researchRange="40%–60%"
        />
        <PctField
          label="Other Expense Rate"
          tooltip="Cost ratio for miscellaneous other revenue streams."
          value={draft.otherExpenseRate}
          fallback={0.3}
          onChange={onChange}
          min={0} max={1} step={0.01}
          testId="field-otherExpenseRate"
          researchRange="20%–40%"
        />
        <PctField
          label="Utilities Variable Split"
          tooltip="Percentage of utilities that vary with occupancy (vs. fixed base load)."
          value={draft.utilitiesVariableSplit}
          fallback={0.4}
          onChange={onChange}
          min={0} max={1} step={0.01}
          testId="field-utilitiesVariableSplit"
          researchRange="30%–50%"
        />
      </Section>

      <Section grid title="Acquisition Financing" description="Default loan terms applied when adding a new financed property.">
        <PctField
          label="Default LTV"
          tooltip="Loan-to-value ratio for acquisition debt."
          value={debt.acqLTV}
          fallback={0.75}
          onChange={(_, v) => onDebt("acqLTV", v)}
          min={0} max={1} step={0.01}
          testId="field-acqLTV"
          researchRange="60%–80%"
        />
        <PctField
          label="Interest Rate"
          tooltip="Annual interest rate for acquisition financing."
          value={debt.interestRate}
          fallback={0.09}
          onChange={(_, v) => onDebt("interestRate", v)}
          min={0} max={0.2} step={0.0025}
          testId="field-acqInterestRate"
          researchRange="6%–10%"
        />
        <NumberField
          label="Term (Years)"
          tooltip="Loan amortization period in years."
          value={debt.amortizationYears}
          fallback={25}
          onChange={(_, v) => onDebt("amortizationYears", Math.round(v))}
          min={1} max={40} step={1}
          testId="field-acqTerm"
          researchRange="20–30 yrs"
        />
        <PctField
          label="Closing Cost Rate"
          tooltip="Transaction costs as a percentage of purchase price."
          value={debt.acqClosingCostRate}
          fallback={0.02}
          onChange={(_, v) => onDebt("acqClosingCostRate", v)}
          min={0} max={0.1} step={0.0025}
          testId="field-acqClosingCost"
          researchRange="1%–3%"
        />
      </Section>

      <Section grid title="Refinance Terms" description="Default terms applied when modeling a property refinance event.">
        <PctField
          label="Refi LTV"
          tooltip="Loan-to-value ratio for refinanced debt."
          value={debt.refiLTV}
          fallback={0.75}
          onChange={(_, v) => onDebt("refiLTV", v)}
          min={0} max={1} step={0.01}
          testId="field-refiLTV"
          researchRange="60%–80%"
        />
        <PctField
          label="Refi Interest Rate"
          tooltip="Annual interest rate for refinanced loans."
          value={debt.refiInterestRate}
          fallback={0.09}
          onChange={(_, v) => onDebt("refiInterestRate", v)}
          min={0} max={0.2} step={0.0025}
          testId="field-refiInterestRate"
          researchRange="5%–9%"
        />
        <NumberField
          label="Refi Term (Years)"
          tooltip="Amortization period for refinanced loans."
          value={debt.refiAmortizationYears}
          fallback={25}
          onChange={(_, v) => onDebt("refiAmortizationYears", Math.round(v))}
          min={1} max={40} step={1}
          testId="field-refiTerm"
          researchRange="20–30 yrs"
        />
        <PctField
          label="Refi Closing Cost Rate"
          tooltip="Transaction costs for refinancing as a percentage of new loan amount."
          value={debt.refiClosingCostRate}
          fallback={0.02}
          onChange={(_, v) => onDebt("refiClosingCostRate", v)}
          min={0} max={0.1} step={0.0025}
          testId="field-refiClosingCost"
          researchRange="0.5%–2%"
        />
      </Section>

      <Section grid title="Depreciation & Tax" description="Tax-related defaults for property underwriting.">
        <div className="col-span-full">
          <GovernedFieldWrapper
            authority="IRS Publication 946"
            label="Depreciation Years"
            helperText={<>27.5 years: residential rental property. 39 years: nonresidential real property. Changing this deviates from standard tax depreciation. Consult your tax advisor.</>}
            referenceUrl="https://www.irs.gov/publications/p946"
            defaultExpanded={false}
            data-testid="governed-depreciationYears"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-foreground label-text">Convention Value</Label>
                <EditableValue
                  value={draft.depreciationYears ?? 27.5}
                  onChange={(v) => onChange("depreciationYears", v)}
                  format="number"
                  min={1} max={50} step={0.5}
                />
              </div>
              <Slider
                value={[draft.depreciationYears ?? 27.5]}
                onValueChange={([v]) => onChange("depreciationYears", v)}
                min={1} max={50} step={0.5}
              />
            </div>
          </GovernedFieldWrapper>
        </div>
        <PctField
          label="Default Property Income Tax Rate"
          tooltip="Income tax rate applied to gain on property sale and operating income. This is NOT the real estate/ad valorem property tax — that is modeled as a USALI operating expense (costRateTaxes)."
          value={draft.defaultPropertyTaxRate}
          fallback={DEFAULT_PROPERTY_TAX_RATE}
          onChange={(_, v) => onChange("defaultPropertyTaxRate", v)}
          min={0} max={0.50} step={0.01}
          testId="field-defaultPropertyTaxRate"
          researchRange="20%–30%"
        />
        <PctField
          label="Land Value Percentage"
          tooltip="Portion of total property value attributed to land (non-depreciable). IRS guidelines suggest 15-30% for commercial real estate."
          value={draft.defaultLandValuePercent}
          fallback={DEFAULT_LAND_VALUE_PERCENT}
          onChange={(_, v) => onChange("defaultLandValuePercent", v)}
          min={0.05} max={0.5} step={0.01}
          testId="field-defaultLandValuePercent"
          researchRange="15%–30%"
        />
      </Section>

      <Section grid title="Exit & Disposition" description="Defaults for property sale/exit modeling.">
        <PctField
          label="Exit Cap Rate"
          tooltip="Capitalization rate used to estimate property value at disposition."
          value={draft.exitCapRate}
          fallback={0.085}
          onChange={onChange}
          min={0.03} max={0.15} step={0.0025}
          testId="field-exitCapRate"
          researchRange="6%–10%"
        />
        <PctField
          label="Sales Commission"
          tooltip="Broker commission rate applied at property sale."
          value={draft.salesCommissionRate}
          fallback={0.05}
          onChange={onChange}
          min={0} max={0.1} step={0.005}
          testId="field-salesCommissionRate"
          researchRange="3%–6%"
        />
        <PctField
          label="Acquisition Commission"
          tooltip="Broker commission rate applied at property acquisition."
          value={draft.commissionRate}
          fallback={0.05}
          onChange={onChange}
          min={0} max={0.1} step={0.005}
          testId="field-commissionRate"
          researchRange="1%–3%"
        />
      </Section>

      <Section grid title="Default Acquisition Package" description="Standard purchase assumptions pre-filled when adding a new property to the portfolio.">
        <DollarField
          label="Purchase Price"
          tooltip="Default property purchase price."
          value={acq.purchasePrice}
          fallback={5000000}
          onChange={(_, v) => onAcq("purchasePrice", v)}
          min={100000} max={100000000} step={100000}
          testId="field-purchasePrice"
          researchRange="$2M–$20M"
        />
        <DollarField
          label="Building Improvements"
          tooltip="Default capital for building improvements and renovations."
          value={acq.buildingImprovements}
          fallback={500000}
          onChange={(_, v) => onAcq("buildingImprovements", v)}
          min={0} max={50000000} step={50000}
          testId="field-buildingImprovements"
          researchRange="$250K–$5M"
        />
        <DollarField
          label="Pre-Opening Costs"
          tooltip="Costs incurred before the property begins operations (staffing, marketing, training)."
          value={acq.preOpeningCosts}
          fallback={150000}
          onChange={(_, v) => onAcq("preOpeningCosts", v)}
          min={0} max={5000000} step={10000}
          testId="field-preOpeningCosts"
          researchRange="$100K–$500K"
        />
        <DollarField
          label="Operating Reserve"
          tooltip="Cash reserve set aside for initial operations before stabilization."
          value={acq.operatingReserve}
          fallback={100000}
          onChange={(_, v) => onAcq("operatingReserve", v)}
          min={0} max={5000000} step={10000}
          testId="field-operatingReserve"
          researchRange="$50K–$300K"
        />
        <NumberField
          label="Months to Operations"
          tooltip="Expected months from closing to start of hotel operations."
          value={acq.monthsToOps}
          fallback={6}
          onChange={(_, v) => onAcq("monthsToOps", Math.round(v))}
          min={0} max={36} step={1}
          testId="field-monthsToOps"
          researchRange="3–12 mo"
        />
      </Section>
    </div>
  );
}

const LLM_TAB_ITEMS: { key: string; label: string; description: string }[] = [
  { key: "research", label: "Research", description: "Default vendor and model for all research domains (Company, Property, Market)." },
  { key: "operations", label: "Operations", description: "Default vendor and model for AI utility tasks." },
  { key: "assistants", label: "Assistants", description: "Default vendor and model for AI assistants (Rebecca)." },
  { key: "exports", label: "Exports", description: "Default vendor and model for premium document exports." },
];

function LlmDefaultsTab() {
  const { toast } = useToast();
  const { data: savedConfig, isLoading } = useResearchConfig();
  const saveMutation = useSaveResearchConfig();

  const [tabDefaults, setTabDefaults] = useState<Record<string, { llmVendor?: LlmVendor; primaryLlm?: string }>>({});
  const [initialized, setInitialized] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (savedConfig && !initialized) {
      setTabDefaults(savedConfig.tabDefaults || {});
      setInitialized(true);
    }
  }, [savedConfig, initialized]);

  const models: AiModelEntry[] = (savedConfig?.cachedModels && savedConfig.cachedModels.length > 0) ? savedConfig.cachedModels : FALLBACK_MODELS;

  const handleSave = () => {
    saveMutation.mutate({ ...savedConfig, tabDefaults } as ResearchConfig, {
      onSuccess: () => {
        setIsDirty(false);
        toast({ title: "LLM defaults saved" });
      },
      onError: () => toast({ title: "Failed to save LLM defaults", variant: "destructive" }),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <TabBanner>
        Default LLM vendor and model for each functional area. Individual cards on the LLMs page can override these. Resolution order: card-level explicit → tab default → system hardcoded default.
      </TabBanner>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {LLM_TAB_ITEMS.map((tab) => {
          const def = tabDefaults[tab.key] || {};
          const vendor = def.llmVendor;
          const vendorModels = vendor ? models.filter((m) => m.provider === vendor) : [];
          const model = def.primaryLlm || "";

          return (
            <Section key={tab.key} title={tab.label} description={tab.description}>
              <div className="grid grid-cols-2 gap-4">
                <div data-testid={`field-llm-default-vendor-${tab.key}`}>
                  <Label className="flex items-center text-foreground label-text mb-1.5">
                    Default Vendor
                    <InfoTooltip text={`Seed vendor for all ${tab.label} LLM cards.`} />
                  </Label>
                  <Select
                    value={vendor || ""}
                    onValueChange={(v) => {
                      setTabDefaults((prev) => ({ ...prev, [tab.key]: { llmVendor: v as LlmVendor, primaryLlm: "" } }));
                      setIsDirty(true);
                    }}
                  >
                    <SelectTrigger className="bg-card h-9" data-testid={`select-llm-default-vendor-${tab.key}`}>
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {LLM_VENDORS.map((v) => (
                        <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div data-testid={`field-llm-default-model-${tab.key}`}>
                  <Label className="flex items-center text-foreground label-text mb-1.5">
                    Default Model
                    <InfoTooltip text={`Seed model for all ${tab.label} LLM cards when no card-level model is set.`} />
                  </Label>
                  {vendor ? (
                    <Select
                      value={model}
                      onValueChange={(v) => {
                        setTabDefaults((prev) => ({ ...prev, [tab.key]: { ...prev[tab.key], primaryLlm: v } }));
                        setIsDirty(true);
                      }}
                    >
                      <SelectTrigger className="bg-card h-9" data-testid={`select-llm-default-model-${tab.key}`}>
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        {model && !vendorModels.some((m) => m.id === model) && (
                          <SelectItem value={model}>{model} (current)</SelectItem>
                        )}
                        {vendorModels.map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Select disabled>
                      <SelectTrigger className="bg-card h-9 opacity-50">
                        <SelectValue placeholder="Select vendor first" />
                      </SelectTrigger>
                    </Select>
                  )}
                </div>
              </div>
            </Section>
          );
        })}
      </div>

      {isDirty && (
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="gap-2"
            data-testid="button-save-llm-defaults"
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <IconSave className="w-4 h-4" />}
            Save Changes
          </Button>
        </div>
      )}
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
      if (!res.ok) throw new Error("Failed to save app defaults");
      return res.json();
    },
    onSuccess: () => {
      invalidateAllFinancialQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: ["globalAssumptions"] });
      toast({ title: "App defaults saved", description: "Changes will apply to new entities. Existing properties retain their current values." });
      setIsDirty(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save app defaults.", variant: "destructive" });
    },
  });

  const [draft, setDraft] = useState<Draft>({});
  const [isDirty, setIsDirty] = useState(false);
  const draftRef = useRef<Draft>({});

  useEffect(() => {
    if (saved) {
      setDraft({ ...saved });
      draftRef.current = { ...saved };
      setIsDirty(false);
    }
  }, [saved]);

  const handleChange = useCallback((field: string, value: any) => {
    setDraft((prev) => {
      const next = { ...prev, [field]: value };
      draftRef.current = next;
      return next;
    });
    setIsDirty(true);
  }, []);

  const saveRef = useRef<(() => void) | undefined>(undefined);
  saveRef.current = () => saveMutation.mutate(draftRef.current);

  useEffect(() => {
    onSaveStateChange?.({
      isDirty,
      isPending: saveMutation.isPending,
      onSave: () => saveRef.current?.(),
    });
    return () => onSaveStateChange?.(null);
  }, [isDirty, saveMutation.isPending, onSaveStateChange]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div data-testid="admin-app-defaults">
      <Tabs defaultValue="market-macro" className="space-y-4">
        <TabsList className="bg-muted/50 border border-border/60">
          <TabsTrigger value="market-macro" data-testid="tab-market-macro">Market & Macro</TabsTrigger>
          <TabsTrigger value="property-underwriting" data-testid="tab-property-underwriting">Property Underwriting</TabsTrigger>
          <TabsTrigger value="llm-defaults" data-testid="tab-llm-defaults">LLM Defaults</TabsTrigger>
        </TabsList>

        <TabsContent value="market-macro">
          <MarketMacroTab draft={draft} onChange={handleChange} />
        </TabsContent>

        <TabsContent value="property-underwriting">
          <PropertyUnderwritingTab draft={draft} onChange={handleChange} />
        </TabsContent>

        <TabsContent value="llm-defaults">
          <LlmDefaultsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
