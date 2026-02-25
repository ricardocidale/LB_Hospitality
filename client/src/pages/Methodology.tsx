import { useState, useRef } from "react";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { ManualTable } from "@/components/ui/manual-table";
import { Callout } from "@/components/ui/callout";
import {
  Calculator,
  TrendingUp,
  Building2,
  DollarSign,
  PieChart,
  BarChart3,
  Wallet,
  Info,
  Layers,
  ArrowRightLeft,
  BookOpen,
  Banknote,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import {
  DEFAULT_LTV,
  DEFAULT_INTEREST_RATE,
  DEFAULT_TERM_YEARS,
  DEFAULT_REFI_LTV,
  DEFAULT_REFI_CLOSING_COST_RATE,
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
  DEFAULT_EXIT_CAP_RATE,
  DEFAULT_TAX_RATE,
  DEFAULT_COMMISSION_RATE,
  DEFAULT_REV_SHARE_EVENTS,
  DEFAULT_REV_SHARE_FB,
  DEFAULT_REV_SHARE_OTHER,
  DEFAULT_CATERING_BOOST_PCT,
  DEFAULT_EVENT_EXPENSE_RATE,
  DEFAULT_OTHER_EXPENSE_RATE,
  DEFAULT_UTILITIES_VARIABLE_SPLIT,
  DEPRECIATION_YEARS,
  DAYS_PER_MONTH,
  PROJECTION_YEARS,
} from "@/lib/constants";
import { sections } from "@/components/methodology/methodologyData";
import { MethodologyTOC } from "@/components/methodology/MethodologyTOC";
import { MethodologySection } from "@/components/methodology/MethodologySection";
import { AuditSections } from "@/components/methodology/AuditSections";

/** Format a decimal as a percentage string, e.g. 0.36 → "36%" */
const pct = (v: number) => `${Math.round(v * 100)}%`;
/** Format a decimal as a percentage string with 1 decimal, e.g. 0.085 → "8.5%" */
const pct1 = (v: number) => `${(v * 100).toFixed(1).replace(/\.0$/, "")}%`;

export default function Methodology({ embedded }: { embedded?: boolean }) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const scrollToSection = (id: string) => {
    const el = sectionRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setExpandedSections((prev) => new Set(prev).add(id));
    }
  };

  const Wrapper = embedded ? ({ children }: { children: React.ReactNode }) => <>{children}</> : Layout;

  return (
    <Wrapper>
      <div className="space-y-8">
        {!embedded && (
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">User Manual</h1>
            <p className="text-muted-foreground mt-2">
              Your guide to the financial model, assumptions, and reporting standards
            </p>
          </div>
        )}

        <Card className="bg-primary/5 border-primary/20">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Calculator className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Overview of the Financial Model</h3>
                <p className="text-sm text-muted-foreground">
                  This financial model generates multi-year projections (configurable 1-30 years, default {PROJECTION_YEARS}) for a portfolio of hospitality properties.
                  It uses a combination of <strong>Systemwide Assumptions</strong> (market-wide parameters) and
                  <strong> Property Assumptions</strong> (individual property details) to calculate revenues,
                  expenses, cash flows, and investment returns.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  The model follows <strong>GAAP-compliant accounting standards</strong> and uses the
                  <strong> indirect method for Free Cash Flow</strong> calculations, which is the industry
                  standard for real estate investment analysis.
                </p>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex gap-6">
          <MethodologyTOC sections={sections} onScrollToSection={scrollToSection} />

          {/* Main Content */}
          <main className="flex-1 space-y-4 min-w-0">

            {/* Section: Business Model Overview */}
            <MethodologySection
              id="business-model"
              title="Business Model Overview"
              subtitle="Two-entity structure: Management Company + Property Portfolio"
              icon={Layers}
              expanded={expandedSections.has("business-model")}
              onToggle={() => toggleSection("business-model")}
              sectionRef={(el) => { sectionRefs.current["business-model"] = el; }}
            >
              <p className="text-sm text-muted-foreground">
                The Hospitality Business model consists of <strong>two distinct financial entities</strong> that are
                modeled independently but linked through management fees:
              </p>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-3">Fund Flow Diagram</h4>
                <div className="bg-background rounded p-4 font-mono text-xs space-y-2">
                  <div className="text-center space-y-1">
                    <div className="font-semibold text-sm">┌─────────────────────────────────┐</div>
                    <div className="font-semibold text-sm">│     PROPERTY PORTFOLIO P&L      │</div>
                    <div className="font-semibold text-sm">└───────────────┬─────────────────┘</div>
                    <div>Guests pay → Room + F&B + Event Revenue</div>
                    <div>Less: Operating Expenses, Debt Service</div>
                    <div>= Free Cash Flow to Equity (FCFE)</div>
                    <div className="text-primary font-semibold">│</div>
                    <div className="text-primary font-semibold">│ Management Fees (5% base + 15% incentive)</div>
                    <div className="text-primary font-semibold">▼</div>
                    <div className="font-semibold text-sm">┌─────────────────────────────────┐</div>
                    <div className="font-semibold text-sm">│   MANAGEMENT COMPANY P&L        │</div>
                    <div className="font-semibold text-sm">└─────────────────────────────────┘</div>
                    <div>Revenue = Management Fees from all properties</div>
                    <div>Less: Staff, Office, Travel, Partner Comp</div>
                    <div>= Company Net Income</div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Properties P&L</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>&#8226; Each property is modeled independently</li>
                    <li>&#8226; Revenue from rooms, F&B, events, other</li>
                    <li>&#8226; Expenses per USALI standards</li>
                    <li>&#8226; Debt service for financed properties</li>
                    <li>&#8226; Full balance sheet and cash flow statement</li>
                    <li>&#8226; IRR and equity multiple at exit</li>
                  </ul>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Management Company P&L</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>&#8226; Revenue = management fees from all properties</li>
                    <li>&#8226; Partner compensation (defined per-year array)</li>
                    <li>&#8226; Staff costs scale with property count (tiered)</li>
                    <li>&#8226; Fixed costs: office, insurance, professional services</li>
                    <li>&#8226; Variable costs: travel, IT, marketing</li>
                    <li>&#8226; Funding instrument for working capital</li>
                  </ul>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Funding Instrument</h4>
                <p className="text-sm text-muted-foreground">
                  The management company is initially funded through capital tranches
                  that provide working capital until management fee revenue is sufficient to cover operating expenses.
                  Funding instrument capital appears as cash inflows but is <strong>not</strong> recorded as revenue — it represents
                  future equity, not income.
                </p>
              </div>
            </MethodologySection>

            {/* Section: Business Rules */}
            <MethodologySection
              id="business-rules"
              title="Business Rules & Constraints"
              subtitle="Mandatory financial gates and safety checks"
              icon={ShieldCheck}
              className="border-red-200 bg-red-50/30"
              expanded={expandedSections.has("business-rules")}
              onToggle={() => toggleSection("business-rules")}
              sectionRef={(el) => { sectionRefs.current["business-rules"] = el; }}
            >
              <p className="text-sm text-muted-foreground">
                The system enforces mandatory business rules that reflect real-world financial constraints.
                These rules cannot be overridden — if any are violated, the system flags the scenario as invalid
                and requires assumption adjustments before proceeding.
              </p>

              <Callout severity="critical" variant="light" title="1. Management Company Funding Gate">
                <p>
                  Operations of the Management Company cannot begin before funding is received. The company requires
                  Funding tranches to cover startup costs (staff, office, professional services) before management
                  fee revenue begins flowing from properties.
                </p>
              </Callout>

              <Callout severity="critical" variant="light" title="2. Property Activation Gate">
                <p>
                  A property cannot begin operating before it is purchased and funding is in place. Revenue and operating expenses only begin
                  after the acquisition date and operations start date.
                </p>
              </Callout>

              <Callout severity="critical" variant="light" title="3. No Negative Cash Rule">
                <p>
                  Cash balances for each property, the Management Company, and the aggregated portfolio must never
                  be negative.
                </p>
              </Callout>

              <Callout severity="critical" variant="light" title="4. Debt-Free at Exit">
                <p>
                  At exit, all properties must be debt-free. Outstanding loan balances
                  are repaid from gross sale proceeds before calculating net proceeds to equity.
                </p>
                <div className="bg-white/50 rounded p-2 font-mono text-xs mt-2">
                  <div>Gross Sale Value = Final Year NOI / Exit Cap Rate</div>
                  <div>Less: Sales Commission</div>
                  <div>Less: Outstanding Debt Balance (must be fully repaid)</div>
                  <div>= Net Proceeds to Equity</div>
                </div>
              </Callout>

              <Callout severity="critical" variant="light" title="5. No Over-Distribution Rule">
                <p>
                  FCF distributions and refinancing proceeds returned to investors must not exceed available cash.
                </p>
              </Callout>

              <Callout severity="critical" variant="light" title="6. Income Statement: Interest Only (No Principal)">
                <p>
                  The income statement must show <strong>only interest expense</strong>, never principal repayment.
                </p>
                <div className="bg-white/50 rounded p-2 font-mono text-xs mt-2">
                  <div>NOI</div>
                  <div>Less: Interest Expense (only the interest portion of debt service)</div>
                  <div>Less: Depreciation</div>
                  <div>Less: Income Tax</div>
                  <div>= Net Income</div>
                </div>
              </Callout>

              <Callout severity="critical" variant="light" title="7. Capital Structure Presentation in Reports">
                <p>
                  All financial reports, cash flow statements, and balance sheets must present capital sources
                  on <strong>separate lines</strong> for clarity:
                </p>
                <div className="bg-white/50 rounded p-2 font-mono text-xs mt-2 space-y-1">
                  <div><strong>Equity (Cash) Infusion</strong> — one line item</div>
                  <div><strong>Loan Proceeds</strong> — separate line item (acquisition financing)</div>
                  <div><strong>Refinancing Proceeds</strong> — separate line item (cash-out from refi)</div>
                </div>
              </Callout>
            </MethodologySection>

            {/* Section: Capital Structure */}
            <MethodologySection
              id="capital-lifecycle"
              title="Capital Structure & Investor Returns"
              subtitle="How capital flows in and how investors get paid back"
              icon={Banknote}
              expanded={expandedSections.has("capital-lifecycle")}
              onToggle={() => toggleSection("capital-lifecycle")}
              sectionRef={(el) => { sectionRefs.current["capital-lifecycle"] = el; }}
            >
              <p className="text-sm text-muted-foreground">
                The platform models realistic capital flows for both the management company and each property.
              </p>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Property Capital Structure</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="bg-background rounded-lg p-3">
                    <h5 className="font-semibold text-sm mb-1">100% Equity (Cash Purchase)</h5>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>&#8226; No debt, fully funded by equity investors</li>
                      <li>&#8226; May be refinanced later</li>
                    </ul>
                  </div>
                  <div className="bg-background rounded-lg p-3">
                    <h5 className="font-semibold text-sm mb-1">Debt Financing + Equity</h5>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>&#8226; Loan based on LTV ratio (default {pct(DEFAULT_LTV)})</li>
                      <li>&#8226; Monthly debt service</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">How Equity Investors Are Repaid</h4>
                <div className="bg-background rounded p-3 font-mono text-sm space-y-2">
                  <div><strong>1. Free Cash Flow Distributions</strong></div>
                  <div><strong>2. Refinancing Proceeds</strong></div>
                  <div><strong>3. Exit / Sale Proceeds</strong></div>
                </div>
              </div>
            </MethodologySection>

            {/* Section: Dynamic Behavior */}
            <MethodologySection
              id="dynamic-behavior"
              title="Dynamic Behavior & System Goals"
              subtitle="Real-time recalculation and multi-level analysis"
              icon={RefreshCw}
              expanded={expandedSections.has("dynamic-behavior")}
              onToggle={() => toggleSection("dynamic-behavior")}
              sectionRef={(el) => { sectionRefs.current["dynamic-behavior"] = el; }}
            >
              <div className="grid gap-3 md:grid-cols-2">
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Real-Time Recalculation</h4>
                  <p className="text-sm text-muted-foreground">
                    Every change to an assumption (e.g., ADR, LTV, Expense Rate) triggers a full-portfolio recalculation.
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Multi-Level Analysis</h4>
                  <p className="text-sm text-muted-foreground">
                    Analyzes financials at three levels: Property, Consolidated Portfolio, and Management Company.
                  </p>
                </div>
              </div>
            </MethodologySection>

            {/* Section: Property Lifecycle */}
            <MethodologySection
              id="property-lifecycle"
              title="Property Lifecycle"
              subtitle="Acquisition → Operations → Refinancing → Exit"
              icon={ArrowRightLeft}
              expanded={expandedSections.has("property-lifecycle")}
              onToggle={() => toggleSection("property-lifecycle")}
              sectionRef={(el) => { sectionRefs.current["property-lifecycle"] = el; }}
            >
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Acquisition</h4>
                <p className="text-sm text-muted-foreground">
                  Purchased at month 0 or specified date. Closing costs (default 2%) capitalized into basis.
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Operations</h4>
                <p className="text-sm text-muted-foreground">
                  Monthly revenue and expenses based on occupancy ramp and ADR growth.
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Refinancing</h4>
                <p className="text-sm text-muted-foreground">
                  Cash-out refi possible at any point. New loan pays off old balance + closing costs.
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Exit</h4>
                <p className="text-sm text-muted-foreground">
                  Sold at end of holding period based on terminal cap rate.
                </p>
              </div>
            </MethodologySection>

            {/* Section: Defaults */}
            <MethodologySection
              id="defaults"
              title="Default Values & Assumptions"
              subtitle="Where the default numbers come from"
              icon={Info}
              expanded={expandedSections.has("defaults")}
              onToggle={() => toggleSection("defaults")}
              sectionRef={(el) => { sectionRefs.current["defaults"] = el; }}
            >
              <ManualTable
                variant="light"
                headers={["Category", "Default Parameter", "Value"]}
                rows={[
                  ["Financing", "Default LTV", pct(DEFAULT_LTV)],
                  ["Financing", "Default Interest Rate", pct(DEFAULT_INTEREST_RATE)],
                  ["Financing", "Default Term", `${DEFAULT_TERM_YEARS} Years`],
                  ["Operations", "Default ADR Growth", pct(0.03)],
                  ["Operations", "Default Occupancy Growth", pct(0.05)],
                ]}
              />
            </MethodologySection>

            {/* Section: Revenue */}
            <MethodologySection
              id="revenue"
              title="Revenue Calculations"
              subtitle="How we project rooms, F&B, and events revenue"
              icon={TrendingUp}
              expanded={expandedSections.has("revenue")}
              onToggle={() => toggleSection("revenue")}
              sectionRef={(el) => { sectionRefs.current["revenue"] = el; }}
            >
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Room Revenue</h4>
                <div className="bg-background rounded p-3 font-mono text-sm">
                  Room Revenue = Room Count × ADR × Occupancy × Days in Month
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Other Revenue Mix</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>&#8226; <strong>F&B</strong>: {pct(DEFAULT_REV_SHARE_FB)} of Room Rev (plus catering boost)</li>
                  <li>&#8226; <strong>Events</strong>: {pct(DEFAULT_REV_SHARE_EVENTS)} of Room Rev</li>
                  <li>&#8226; <strong>Other</strong>: {pct(DEFAULT_REV_SHARE_OTHER)} of Room Rev</li>
                </ul>
              </div>
            </MethodologySection>

            {/* Section: Expenses */}
            <MethodologySection
              id="expenses"
              title="Operating Expenses"
              subtitle="How we calculate property operating costs"
              icon={Wallet}
              expanded={expandedSections.has("expenses")}
              onToggle={() => toggleSection("expenses")}
              sectionRef={(el) => { sectionRefs.current["expenses"] = el; }}
            >
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Departmental Expenses</h4>
                <ManualTable
                  variant="light"
                  headers={["Department", "Default Rate", "Basis"]}
                  rows={[
                    ["Rooms", pct(DEFAULT_COST_RATE_ROOMS), "Room Revenue"],
                    ["F&B", pct(DEFAULT_COST_RATE_FB), "F&B Revenue"],
                    ["Admin", pct(DEFAULT_COST_RATE_ADMIN), "Total Revenue"],
                    ["Marketing", pct(DEFAULT_COST_RATE_MARKETING), "Total Revenue"],
                  ]}
                />
              </div>
            </MethodologySection>

            {/* Section: NOI/GOP */}
            <MethodologySection
              id="noi-gop"
              title="GOP and NOI"
              subtitle="Gross Operating Profit and Net Operating Income"
              icon={BarChart3}
              expanded={expandedSections.has("noi-gop")}
              onToggle={() => toggleSection("noi-gop")}
              sectionRef={(el) => { sectionRefs.current["noi-gop"] = el; }}
            >
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="bg-background rounded p-3 font-mono text-sm space-y-1">
                  <div>GOP = Total Revenue − Total Operating Expenses</div>
                  <div>NOI = GOP − Management Fees − FF&E Reserve</div>
                </div>
              </div>
            </MethodologySection>

            {/* Section: Debt */}
            <MethodologySection
              id="debt"
              title="Debt & Financing"
              subtitle="Loan calculations and refinancing"
              icon={Building2}
              expanded={expandedSections.has("debt")}
              onToggle={() => toggleSection("debt")}
              sectionRef={(el) => { sectionRefs.current["debt"] = el; }}
            >
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Monthly Payment (PMT)</h4>
                <p className="text-sm text-muted-foreground mb-2">Calculated using the standard amortization formula.</p>
              </div>
            </MethodologySection>

            {/* Section: Cash Flow */}
            <MethodologySection
              id="cash-flow"
              title="Free Cash Flow (GAAP Method)"
              subtitle="How we calculate cash available to investors"
              icon={DollarSign}
              expanded={expandedSections.has("cash-flow")}
              onToggle={() => toggleSection("cash-flow")}
              sectionRef={(el) => { sectionRefs.current["cash-flow"] = el; }}
            >
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="bg-background rounded p-3 font-mono text-sm">
                  FCFE = NOI − Debt Service (Principal + Interest) − Income Tax
                </div>
              </div>
            </MethodologySection>

            {/* Section: Balance Sheet */}
            <MethodologySection
              id="balance-sheet"
              title="Balance Sheet"
              subtitle="Assets, liabilities, and equity per GAAP standards"
              icon={BookOpen}
              expanded={expandedSections.has("balance-sheet")}
              onToggle={() => toggleSection("balance-sheet")}
              sectionRef={(el) => { sectionRefs.current["balance-sheet"] = el; }}
            >
              <div className="bg-muted/50 rounded-lg p-4">
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>&#8226; <strong>Assets</strong>: Cash + Net PPE</li>
                  <li>&#8226; <strong>Liabilities</strong>: Outstanding Debt</li>
                  <li>&#8226; <strong>Equity</strong>: Contributed Capital + Retained Earnings</li>
                </ul>
              </div>
            </MethodologySection>

            {/* Section: Returns */}
            <MethodologySection
              id="returns"
              title="Investment Returns"
              subtitle="IRR, equity multiple, and exit value calculations"
              icon={PieChart}
              expanded={expandedSections.has("returns")}
              onToggle={() => toggleSection("returns")}
              sectionRef={(el) => { sectionRefs.current["returns"] = el; }}
            >
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Exit Value</h4>
                <div className="bg-background rounded p-3 font-mono text-sm">
                  Exit Value = (Final Year NOI ÷ Exit Cap Rate) − Sales Commission − Debt Repayment
                </div>
              </div>
            </MethodologySection>

            {/* Section: Management Company */}
            <MethodologySection
              id="management-company"
              title="Management Company Financials"
              subtitle="Hospitality Business Co. revenue and expenses"
              icon={Building2}
              expanded={expandedSections.has("management-company")}
              onToggle={() => toggleSection("management-company")}
              sectionRef={(el) => { sectionRefs.current["management-company"] = el; }}
            >
              <div className="bg-muted/50 rounded-lg p-4">
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>&#8226; <strong>Revenue</strong>: 5% Base Fee + 15% Incentive Fee</li>
                  <li>&#8226; <strong>Expenses</strong>: Staff, Office, Travel, Partner Comp</li>
                </ul>
              </div>
            </MethodologySection>

            {/* Section: Fixed Assumptions */}
            <MethodologySection
              id="fixed-assumptions"
              title="Fixed Assumptions (Not Configurable)"
              subtitle="Hardcoded values built into the calculation engine"
              icon={Info}
              className="border-amber-200 bg-amber-50/30"
              expanded={expandedSections.has("fixed-assumptions")}
              onToggle={() => toggleSection("fixed-assumptions")}
              sectionRef={(el) => { sectionRefs.current["fixed-assumptions"] = el; }}
            >
              <div className="bg-muted/50 rounded-lg p-4">
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>&#8226; <strong>Depreciation</strong>: {DEPRECIATION_YEARS} years straight-line</li>
                  <li>&#8226; <strong>Days per Month</strong>: {DAYS_PER_MONTH}</li>
                </ul>
              </div>
            </MethodologySection>

            {/* Section: Verification */}
            <AuditSections 
              expandedSections={expandedSections} 
              toggleSection={toggleSection} 
              sectionRefs={sectionRefs} 
              icon={Calculator}
            />

          </main>
        </div>

        <Card className="bg-primary/5 border-primary/20">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Calculator className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Questions About the Model?</h3>
                <p className="text-sm text-muted-foreground">
                  This financial model uses industry-standard methodologies and follows GAAP accounting principles.
                  All assumptions can be customized in the Systemwide Assumptions and Property Assumptions pages.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Wrapper>
  );
}
