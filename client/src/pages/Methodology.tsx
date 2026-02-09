import { useState, useRef } from "react";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { SectionCard } from "@/components/ui/section-card";
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
  ShieldCheck,
  Banknote,
  RefreshCw,
} from "lucide-react";
import {
  DEFAULT_LTV,
  DEFAULT_INTEREST_RATE,
  DEFAULT_TERM_YEARS,
  DEFAULT_REFI_LTV,
  DEFAULT_REFI_CLOSING_COST_RATE,
  DEFAULT_ACQ_CLOSING_COST_RATE,
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
  DEFAULT_START_OCCUPANCY,
  DEFAULT_MAX_OCCUPANCY,
  DEFAULT_OCCUPANCY_GROWTH_STEP,
  DEFAULT_OCCUPANCY_RAMP_MONTHS,
  DEFAULT_ADR_GROWTH_RATE,
} from "@/lib/constants";

/** Format a decimal as a percentage string, e.g. 0.36 → "36%" */
const pct = (v: number) => `${Math.round(v * 100)}%`;
/** Format a decimal as a percentage string with 1 decimal, e.g. 0.085 → "8.5%" */
const pct1 = (v: number) => `${(v * 100).toFixed(1).replace(/\.0$/, "")}%`;

const sections = [
  { id: "business-model", title: "Business Model Overview", subtitle: "Two-entity structure: Management Company + Property Portfolio", icon: Layers },
  { id: "business-rules", title: "Business Rules & Constraints", subtitle: "Mandatory financial gates and safety checks", icon: ShieldCheck, className: "border-red-200 bg-red-50/30" },
  { id: "capital-lifecycle", title: "Capital Structure & Investor Returns", subtitle: "How capital flows in and how investors get paid back", icon: Banknote },
  { id: "dynamic-behavior", title: "Dynamic Behavior & System Goals", subtitle: "Real-time recalculation and multi-level analysis", icon: RefreshCw },
  { id: "property-lifecycle", title: "Property Lifecycle", subtitle: "Acquisition → Operations → Refinancing → Exit", icon: ArrowRightLeft },
  { id: "defaults", title: "Default Values & Assumptions", subtitle: "Where the default numbers come from", icon: Info },
  { id: "revenue", title: "Revenue Calculations", subtitle: "How we project rooms, F&B, and events revenue", icon: TrendingUp },
  { id: "expenses", title: "Operating Expenses", subtitle: "How we calculate property operating costs", icon: Wallet },
  { id: "noi-gop", title: "GOP and NOI", subtitle: "Gross Operating Profit and Net Operating Income", icon: BarChart3 },
  { id: "debt", title: "Debt & Financing", subtitle: "Loan calculations and refinancing", icon: Building2 },
  { id: "cash-flow", title: "Free Cash Flow (GAAP Method)", subtitle: "How we calculate cash available to investors", icon: DollarSign },
  { id: "balance-sheet", title: "Balance Sheet", subtitle: "Assets, liabilities, and equity per GAAP standards", icon: BookOpen },
  { id: "returns", title: "Investment Returns", subtitle: "IRR, equity multiple, and exit value calculations", icon: PieChart },
  { id: "management-company", title: "Management Company Financials", subtitle: "Hospitality Business Co. revenue and expenses", icon: Building2 },
  { id: "fixed-assumptions", title: "Fixed Assumptions (Not Configurable)", subtitle: "Hardcoded values built into the calculation engine", icon: Info, className: "border-amber-200 bg-amber-50/30" },
  { id: "verification", title: "Financial Verification & Audit", subtitle: "How we verify calculations for GAAP compliance", icon: Calculator },
];

export default function Methodology() {
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

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">User Manual</h1>
          <p className="text-muted-foreground mt-2">
            Your guide to the financial model, assumptions, and reporting standards
          </p>
        </div>

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
          {/* Table of Contents Sidebar */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24">
              <Card className="bg-white border shadow-sm">
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Table of Contents</h3>
                  <nav className="space-y-1">
                    {sections.map((s) => (
                      <button
                        key={s.id}
                        data-testid={`toc-${s.id}`}
                        onClick={() => scrollToSection(s.id)}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors truncate"
                      >
                        {s.title}
                      </button>
                    ))}
                  </nav>
                </div>
              </Card>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 space-y-4 min-w-0">

            {/* Section: Business Model Overview */}
            <SectionCard
              id="business-model"
              title="Business Model Overview"
              subtitle="Two-entity structure: Management Company + Property Portfolio"
              icon={Layers}
              variant="light"
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
                    <li>&#8226; SAFE funding for working capital</li>
                  </ul>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">SAFE Funding</h4>
                <p className="text-sm text-muted-foreground">
                  The management company is initially funded through SAFE (Simple Agreement for Future Equity) tranches
                  that provide working capital until management fee revenue is sufficient to cover operating expenses.
                  SAFE funding appears as cash inflows but is <strong>not</strong> recorded as revenue — it represents
                  future equity, not income.
                </p>
              </div>
            </SectionCard>

            {/* Section: Business Rules */}
            <SectionCard
              id="business-rules"
              title="Business Rules & Constraints"
              subtitle="Mandatory financial gates and safety checks"
              icon={ShieldCheck}
              variant="light"
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
                  SAFE funding tranches to cover startup costs (staff, office, professional services) before management
                  fee revenue begins flowing from properties.
                </p>
                <p className="mt-2">
                  If assumptions indicate operations before funding, the system blocks the scenario and flags it as invalid.
                </p>
              </Callout>

              <Callout severity="critical" variant="light" title="2. Property Activation Gate">
                <p>
                  A property cannot begin operating before it is purchased and funding is in place — whether that's
                  100% equity (cash purchase) or debt financing plus equity. Revenue and operating expenses only begin
                  after the acquisition date and operations start date.
                </p>
                <p className="mt-2">
                  If the operating start date precedes acquisition or funding, the system blocks the scenario.
                </p>
              </Callout>

              <Callout severity="critical" variant="light" title="3. No Negative Cash Rule">
                <p>
                  Cash balances for each property, the Management Company, and the aggregated portfolio must never
                  be negative. This ensures realistic capital planning and prevents scenarios where entities spend
                  money they don't have.
                </p>
                <p className="mt-2">
                  If any projected cash balance goes below zero, the system flags a funding shortfall and requires
                  increased funding, earlier funding, or assumption adjustments.
                </p>
              </Callout>

              <Callout severity="critical" variant="light" title="4. Debt-Free at Exit">
                <p>
                  At exit (end of the projection period), all properties must be debt-free. Outstanding loan balances
                  are repaid from gross sale proceeds before calculating net proceeds to equity. The exit waterfall is:
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
                  The system must not distribute cash to the point that any property ends up with a negative cash
                  balance. This ensures that repayment of principal and investor distributions are always funded
                  by actual available cash. Refinance payback to investors is also subject to this constraint —
                  proceeds from refinancing cannot be swept out if doing so would leave the property cash-negative.
                </p>
              </Callout>

              <Callout severity="critical" variant="light" title="6. Income Statement: Interest Only (No Principal)">
                <p>
                  The income statement must show <strong>only interest expense</strong>, never principal repayment.
                  Principal repayment is a <strong>financing activity</strong> (ASC 470), not an operating expense.
                  It reduces cash but does not reduce net income. The income statement waterfall is:
                </p>
                <div className="bg-white/50 rounded p-2 font-mono text-xs mt-2">
                  <div>NOI</div>
                  <div>Less: Interest Expense (only the interest portion of debt service)</div>
                  <div>Less: Depreciation</div>
                  <div>Less: Income Tax</div>
                  <div>= Net Income</div>
                </div>
                <p className="mt-2">
                  Principal repayment appears only on the cash flow statement as a financing outflow.
                </p>
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
                <p className="mt-2">
                  Equity and debt/refinance must never be lumped together. Each source of capital has different
                  risk characteristics, repayment obligations, and investor implications. This separation must be
                  maintained in income statements, cash flow statements, balance sheets, and all exported reports
                  (PDF, CSV).
                </p>
              </Callout>
            </SectionCard>

            {/* Section: Capital Structure */}
            <SectionCard
              id="capital-lifecycle"
              title="Capital Structure & Investor Returns"
              subtitle="How capital flows in and how investors get paid back"
              icon={Banknote}
              variant="light"
              expanded={expandedSections.has("capital-lifecycle")}
              onToggle={() => toggleSection("capital-lifecycle")}
              sectionRef={(el) => { sectionRefs.current["capital-lifecycle"] = el; }}
            >
              <p className="text-sm text-muted-foreground">
                The platform models realistic capital flows for both the management company and each property,
                tracking how money enters the system and how investors receive returns over time.
              </p>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Property Capital Structure</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Each property can be acquired using one of two capital structures:
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="bg-background rounded-lg p-3">
                    <h5 className="font-semibold text-sm mb-1">100% Equity (Cash Purchase)</h5>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>&#8226; No debt, fully funded by equity investors</li>
                      <li>&#8226; No interest expense or principal payments</li>
                      <li>&#8226; May be refinanced later (e.g., after 3 years)</li>
                      <li>&#8226; Refinancing creates leverage and returns cash to investors</li>
                    </ul>
                  </div>
                  <div className="bg-background rounded-lg p-3">
                    <h5 className="font-semibold text-sm mb-1">Debt Financing + Equity</h5>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>&#8226; Loan based on LTV ratio (default {pct(DEFAULT_LTV)})</li>
                      <li>&#8226; Monthly debt service (interest + principal)</li>
                      <li>&#8226; Equity covers remainder of project cost</li>
                      <li>&#8226; Can also refinance at new terms</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">How Equity Investors Are Repaid</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Investors receive returns through three channels over the life of the investment:
                </p>
                <div className="bg-background rounded p-3 font-mono text-sm space-y-2">
                  <div><strong>1. Free Cash Flow Distributions</strong></div>
                  <div className="pl-4 text-xs">Annual FCFE distributed to investors throughout the holding period</div>
                  <div className="mt-2"><strong>2. Refinancing Proceeds</strong></div>
                  <div className="pl-4 text-xs">Net cash from refinancing (new loan - old balance - closing costs)</div>
                  <div className="mt-2"><strong>3. Exit / Sale Proceeds</strong></div>
                  <div className="pl-4 text-xs">Net sale value at end of projection (gross value - commission - debt)</div>
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  Total return = Sum of all three channels. This is what drives the IRR, equity multiple, and
                  cash-on-cash return metrics shown in the dashboard.
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Management Company Funding</h4>
                <p className="text-sm text-muted-foreground">
                  The management company receives capital from private equity through <strong>SAFE (Simple Agreement
                  for Future Equity)</strong> tranches — scheduled or conditional funding rounds that provide working
                  capital until management fee revenue covers operating expenses. SAFE funding is recorded as a cash
                  inflow but is <strong>not</strong> revenue — it represents future equity, not income.
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Assumptions Framework</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Financial projections are driven by two tiers of configurable assumptions:
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="bg-background rounded-lg p-3">
                    <h5 className="font-semibold text-sm mb-1">Property-Level Assumptions</h5>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>&#8226; Revenue drivers (ADR, occupancy, rooms)</li>
                      <li>&#8226; Operating costs and expense ratios</li>
                      <li>&#8226; Financing structure (LTV, rate, term)</li>
                      <li>&#8226; Acquisition date and operations start</li>
                      <li>&#8226; Refinance timing and terms</li>
                      <li>&#8226; Exit cap rate</li>
                    </ul>
                  </div>
                  <div className="bg-background rounded-lg p-3">
                    <h5 className="font-semibold text-sm mb-1">App-Wide (Global) Assumptions</h5>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>&#8226; Management fee structures</li>
                      <li>&#8226; Inflation and escalation rates</li>
                      <li>&#8226; Shared cost growth rates</li>
                      <li>&#8226; Tax and macro parameters</li>
                      <li>&#8226; SAFE funding schedule</li>
                      <li>&#8226; Partner compensation</li>
                    </ul>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  Global assumptions apply across all properties and the management company. Property-level
                  assumptions override globals where applicable (e.g., a property's own exit cap rate takes
                  precedence over the system default).
                </p>
              </div>
            </SectionCard>

            {/* Section: Dynamic Behavior */}
            <SectionCard
              id="dynamic-behavior"
              title="Dynamic Behavior & System Goals"
              subtitle="Real-time recalculation and multi-level analysis"
              icon={RefreshCw}
              variant="light"
              expanded={expandedSections.has("dynamic-behavior")}
              onToggle={() => toggleSection("dynamic-behavior")}
              sectionRef={(el) => { sectionRefs.current["dynamic-behavior"] = el; }}
            >
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Dynamic Recalculation</h4>
                <p className="text-sm text-muted-foreground">
                  The financial model recalculates all projections instantly when any assumption changes. Users can:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 mt-2">
                  <li>&#8226; Add or remove properties at any time</li>
                  <li>&#8226; Modify any property-level or global assumption</li>
                  <li>&#8226; Change capital structures, timing, or exit parameters</li>
                  <li>&#8226; See updated financial statements, returns, and audit results immediately</li>
                </ul>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Multi-Level Analysis</h4>
                <p className="text-sm text-muted-foreground">
                  Returns and financial performance can be evaluated at three levels:
                </p>
                <div className="grid gap-3 md:grid-cols-3 mt-3">
                  <div className="bg-background rounded-lg p-3 text-center">
                    <h5 className="font-semibold text-sm">Asset Level</h5>
                    <p className="text-xs text-muted-foreground mt-1">
                      Individual property P&L, cash flow, balance sheet, IRR, and equity multiple
                    </p>
                  </div>
                  <div className="bg-background rounded-lg p-3 text-center">
                    <h5 className="font-semibold text-sm">Company Level</h5>
                    <p className="text-xs text-muted-foreground mt-1">
                      Management company financials, profitability, and FCF-based IRR
                    </p>
                  </div>
                  <div className="bg-background rounded-lg p-3 text-center">
                    <h5 className="font-semibold text-sm">Portfolio Level</h5>
                    <p className="text-xs text-muted-foreground mt-1">
                      Consolidated property financials, combined FCF, and portfolio-wide IRR
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                <h4 className="font-semibold mb-2">System Goal</h4>
                <p className="text-sm text-muted-foreground">
                  To simulate a scalable hospitality platform where individual assets can be analyzed independently,
                  the management company operates as a profit center, capital flows realistically over time, and
                  returns can be evaluated at asset, company, and portfolio levels — while enforcing real-world
                  financial constraints.
                </p>
              </div>
            </SectionCard>

            {/* Section: Property Lifecycle */}
            <SectionCard
              id="property-lifecycle"
              title="Property Lifecycle"
              subtitle="Acquisition → Operations → Refinancing → Exit"
              icon={ArrowRightLeft}
              variant="light"
              expanded={expandedSections.has("property-lifecycle")}
              onToggle={() => toggleSection("property-lifecycle")}
              sectionRef={(el) => { sectionRefs.current["property-lifecycle"] = el; }}
            >
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">1. Acquisition</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Each property enters the model at its acquisition date with a defined capital structure:
                </p>
                <div className="bg-background rounded p-3 font-mono text-sm space-y-1">
                  <div>Total Project Cost = Purchase Price + Closing Costs ({pct(DEFAULT_ACQ_CLOSING_COST_RATE)}) + Operating Reserve</div>
                  <div>Loan Amount = Purchase Price × LTV (default {pct(DEFAULT_LTV)}) — for financed properties</div>
                  <div>Initial Equity = Total Project Cost − Loan Amount</div>
                </div>
                <ul className="mt-3 text-sm text-muted-foreground space-y-1">
                  <li>&#8226; <strong>Full Equity</strong>: No debt, 100% equity funded</li>
                  <li>&#8226; <strong>Financed</strong>: Debt + equity per LTV ratio</li>
                  <li>&#8226; Balance sheet entries only appear after acquisition date</li>
                  <li>&#8226; Depreciation begins the first full month after acquisition</li>
                </ul>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">2. Operations</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Revenue and expenses begin at the operations start date with a ramp-up period:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>&#8226; Occupancy ramps from starting rate (default {pct(DEFAULT_START_OCCUPANCY)}) to maximum (default {pct(DEFAULT_MAX_OCCUPANCY)})</li>
                  <li>&#8226; Ramp-up occurs over configurable months (default {DEFAULT_OCCUPANCY_RAMP_MONTHS} months)</li>
                  <li>&#8226; ADR grows annually at the ADR growth rate (default {pct(DEFAULT_ADR_GROWTH_RATE)})</li>
                  <li>&#8226; Expenses escalate annually with inflation (variable) or fixed cost escalation rate</li>
                  <li>&#8226; NOI = Revenue − Operating Expenses − Management Fees − FF&E Reserve</li>
                </ul>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">3. Refinancing (Financed Properties Only)</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  At the refinance date (default: 3 years after operations start), the property is reappraised:
                </p>
                <div className="bg-background rounded p-3 font-mono text-sm space-y-1">
                  <div>Appraised Value = Trailing-12-Month NOI ÷ Cap Rate</div>
                  <div>New Loan = Appraised Value × Refi LTV (default {pct(DEFAULT_REFI_LTV)})</div>
                  <div>Proceeds = New Loan − Old Balance − Closing Costs (default {pct(DEFAULT_REFI_CLOSING_COST_RATE)})</div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Net proceeds are distributed to investors. Debt service recalculates from the new loan balance forward.
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">4. Exit (End of Projection Period)</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  At the end of the projection period, each property is assumed to be sold:
                </p>
                <div className="bg-background rounded p-3 font-mono text-sm space-y-1">
                  <div>Gross Sale Value = Final Year NOI ÷ Exit Cap Rate (default {pct1(DEFAULT_EXIT_CAP_RATE)})</div>
                  <div>Less: Sales Commission (default {pct(DEFAULT_COMMISSION_RATE)})</div>
                  <div>Less: Outstanding Debt Balance</div>
                  <div>= Net Proceeds to Equity</div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  All outstanding debt is fully repaid from gross sale proceeds — properties must be debt-free at exit.
                  Net exit proceeds combined with cumulative FCFE and refinancing proceeds determine the total return (IRR, equity multiple).
                </p>
              </div>
            </SectionCard>

            {/* Section: Defaults */}
            <SectionCard
              id="defaults"
              title="Default Values & Assumptions"
              subtitle="Where the default numbers come from"
              icon={Info}
              variant="light"
              expanded={expandedSections.has("defaults")}
              onToggle={() => toggleSection("defaults")}
              sectionRef={(el) => { sectionRefs.current["defaults"] = el; }}
            >
              <p className="text-sm text-muted-foreground">
                The default values throughout this model are based on research into the
                <strong> boutique hotel and bed & breakfast business model in North America</strong>.
                These include typical expense ratios, occupancy ramp-up periods, ADR ranges, and
                cap rates for this asset class.
              </p>
              <p className="text-sm text-muted-foreground">
                You are encouraged to adjust any variable to match your specific property, market
                conditions, or investment thesis. The model automatically recalculates all projections
                when you change any input.
              </p>
              <ManualTable
                variant="light"
                headers={["Parameter", "Default"]}
                rows={[
                  ["Inflation Rate", `${pct(DEFAULT_ADR_GROWTH_RATE)} annually`],
                  ["Management Base Fee", `${pct(0.05)} of revenue`],
                  ["Management Incentive Fee", `${pct(0.15)} of GOP`],
                  ["Loan-to-Value (LTV)", pct(DEFAULT_LTV)],
                  ["Interest Rate", pct(DEFAULT_INTEREST_RATE)],
                  ["Loan Term", `${DEFAULT_TERM_YEARS} years`],
                  ["Exit Cap Rate", pct1(DEFAULT_EXIT_CAP_RATE)],
                  ["FF&E Reserve", `${pct(DEFAULT_COST_RATE_FFE)} of revenue`],
                ]}
              />
            </SectionCard>

            {/* Section: Revenue */}
            <SectionCard
              id="revenue"
              title="Revenue Calculations"
              subtitle="How we project rooms, F&B, and events revenue"
              icon={TrendingUp}
              variant="light"
              expanded={expandedSections.has("revenue")}
              onToggle={() => toggleSection("revenue")}
              sectionRef={(el) => { sectionRefs.current["revenue"] = el; }}
            >
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Room Revenue</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  The primary revenue driver for each property, calculated monthly:
                </p>
                <div className="bg-background rounded p-3 font-mono text-sm">
                  Room Revenue = Room Count × ADR × Occupancy × {DAYS_PER_MONTH} days
                </div>
                <ul className="mt-3 text-sm text-muted-foreground space-y-1">
                  <li>&#8226; <strong>ADR (Average Daily Rate)</strong>: Starts at the property's initial rate and grows annually at the ADR Growth Rate</li>
                  <li>&#8226; <strong>Occupancy</strong>: Ramps up from starting occupancy ({pct(DEFAULT_START_OCCUPANCY)}) to maximum occupancy ({pct(DEFAULT_MAX_OCCUPANCY)}) over the ramp period, growing by {pct(DEFAULT_OCCUPANCY_GROWTH_STEP)} every {DEFAULT_OCCUPANCY_RAMP_MONTHS} months</li>
                  <li>&#8226; <strong>Room Count</strong>: Fixed number of rooms per property</li>
                  <li>&#8226; <strong>Days in Month</strong>: Uses {DAYS_PER_MONTH} days (365 ÷ 12 = 30.4167, rounded to {DAYS_PER_MONTH}) as the industry-standard average month length</li>
                </ul>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Food & Beverage Revenue</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  F&B revenue is calculated as a percentage of room revenue, with an additional catering boost:
                </p>
                <div className="bg-background rounded p-3 font-mono text-sm">
                  Base F&B = Room Revenue × F&B % (default {pct(DEFAULT_REV_SHARE_FB)})
                </div>
                <div className="bg-background rounded p-3 font-mono text-sm mt-2">
                  Catering Boost = Base F&B × Catering Boost % (default {pct(DEFAULT_CATERING_BOOST_PCT)})
                </div>
                <div className="bg-background rounded p-3 font-mono text-sm mt-2">
                  Total F&B Revenue = Base F&B + Catering Boost = Base F&B × (1 + Catering Boost %)
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  The catering boost percentage is defined per property and represents the blended effect across all events (catered and non-catered).
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Event Revenue</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Calculated as a percentage of room revenue:
                </p>
                <div className="bg-background rounded p-3 font-mono text-sm">
                  Event Revenue = Room Revenue × Event Revenue Share (default {pct(DEFAULT_REV_SHARE_EVENTS)})
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Other Revenue</h4>
                <p className="text-sm text-muted-foreground">
                  Includes spa, parking, retail, and miscellaneous income. Calculated as {pct(DEFAULT_REV_SHARE_OTHER)} of room revenue by default.
                </p>
              </div>
            </SectionCard>

            {/* Section: Expenses */}
            <SectionCard
              id="expenses"
              title="Operating Expenses"
              subtitle="How we calculate property operating costs"
              icon={Wallet}
              variant="light"
              expanded={expandedSections.has("expenses")}
              onToggle={() => toggleSection("expenses")}
              sectionRef={(el) => { sectionRefs.current["expenses"] = el; }}
            >
              <p className="text-sm text-muted-foreground">
                Operating expenses are calculated as percentages of total revenue and escalate annually with inflation:
              </p>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <h4 className="font-semibold mb-2">Direct Costs</h4>
                  <ManualTable
                    variant="light"
                    headers={["Cost", "Rate"]}
                    rows={[
                      ["Room Expense", `${pct(DEFAULT_COST_RATE_ROOMS)} of room revenue`],
                      ["F&B Expense", `${pct(DEFAULT_COST_RATE_FB)} of F&B revenue`],
                      ["Event Expense", `${pct(DEFAULT_EVENT_EXPENSE_RATE)} of event revenue`],
                    ]}
                  />
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Overhead Costs</h4>
                  <ManualTable
                    variant="light"
                    headers={["Cost", "Rate"]}
                    rows={[
                      ["Marketing", `${pct(DEFAULT_COST_RATE_MARKETING)} of total revenue`],
                      ["Admin & General", `${pct(DEFAULT_COST_RATE_ADMIN)} of total revenue`],
                      ["Property Operations", `${pct(DEFAULT_COST_RATE_PROPERTY_OPS)} of total revenue`],
                      ["Utilities", `${pct(DEFAULT_COST_RATE_UTILITIES)} of total revenue`],
                      ["Insurance", `${pct(DEFAULT_COST_RATE_INSURANCE)} of total revenue`],
                      ["Property Taxes", `${pct(DEFAULT_COST_RATE_TAXES)} of total revenue`],
                      ["IT Systems", `${pct(DEFAULT_COST_RATE_IT)} of total revenue`],
                    ]}
                  />
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">FF&E Reserve</h4>
                <p className="text-sm text-muted-foreground">
                  {pct(DEFAULT_COST_RATE_FFE)} of total revenue is set aside for Furniture, Fixtures & Equipment replacement.
                  This is included in operating expenses following the Uniform System of Accounts for the Lodging Industry (USALI).
                </p>
              </div>
            </SectionCard>

            {/* Section: GOP and NOI */}
            <SectionCard
              id="noi-gop"
              title="GOP and NOI"
              subtitle="Gross Operating Profit and Net Operating Income"
              icon={BarChart3}
              variant="light"
              expanded={expandedSections.has("noi-gop")}
              onToggle={() => toggleSection("noi-gop")}
              sectionRef={(el) => { sectionRefs.current["noi-gop"] = el; }}
            >
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Gross Operating Profit (GOP)</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Revenue minus operating expenses, before management fees:
                </p>
                <div className="bg-background rounded p-3 font-mono text-sm">
                  GOP = Total Revenue − Operating Expenses
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  GOP is used to calculate the incentive management fee.
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Management Fees</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Hospitality Business earns fees for managing each property:
                </p>
                <div className="bg-background rounded p-3 font-mono text-sm space-y-1">
                  <div>Base Fee = Total Revenue × {pct(0.05)}</div>
                  <div>Incentive Fee = GOP × {pct(0.15)}</div>
                  <div>Total Management Fee = Base Fee + Incentive Fee</div>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Net Operating Income (NOI)</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  The property's income after all operating costs and management fees:
                </p>
                <div className="bg-background rounded p-3 font-mono text-sm">
                  NOI = GOP − Management Fees
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  NOI is the key metric for property valuation and is used to calculate the exit value.
                </p>
              </div>
            </SectionCard>

            {/* Section: Debt */}
            <SectionCard
              id="debt"
              title="Debt & Financing"
              subtitle="Loan calculations and refinancing"
              icon={Building2}
              variant="light"
              expanded={expandedSections.has("debt")}
              onToggle={() => toggleSection("debt")}
              sectionRef={(el) => { sectionRefs.current["debt"] = el; }}
            >
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Initial Financing</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  For financed properties, the loan amount is based on Loan-to-Value (LTV):
                </p>
                <div className="bg-background rounded p-3 font-mono text-sm space-y-1">
                  <div>Loan Amount = Purchase Price × LTV Ratio (default {pct(DEFAULT_LTV)})</div>
                  <div>Initial Equity = Total Project Cost − Loan Amount</div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Total Project Cost includes purchase price, building improvements, pre-opening costs, and operating reserve.
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Debt Service</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Monthly payments are calculated using standard amortization:
                </p>
                <div className="bg-background rounded p-3 font-mono text-sm space-y-1">
                  <div>Monthly Payment = PMT(Interest Rate/12, Term×12, Loan Amount)</div>
                  <div>Annual Debt Service = Monthly Payment × 12</div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Each payment is split between interest expense and principal repayment.
                  <strong> Only interest expense appears on the income statement</strong> (per ASC 470).
                  Principal repayment is a financing activity — it reduces cash but not net income.
                  On the cash flow statement, interest is an operating outflow and principal is a financing outflow.
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Refinancing</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Financed properties can be refinanced at a configurable date (default: 3 years after operations start).
                  The model uses a two-pass calculation:
                </p>
                <div className="bg-background rounded p-3 font-mono text-sm space-y-1">
                  <div>Pass 1: Project forward to get NOI at refinance date</div>
                  <div>Appraised Value = Trailing-12-Month NOI ÷ Exit Cap Rate</div>
                  <div>New Loan = Appraised Value × Refinance LTV (default {pct(DEFAULT_REFI_LTV)})</div>
                  <div>Net Proceeds = New Loan − Old Balance − Closing Costs (default {pct(DEFAULT_REFI_CLOSING_COST_RATE)})</div>
                  <div>Pass 2: Re-amortize with new loan terms from refinance date forward</div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Net refinance proceeds appear as a financing activity in the cash flow statement — separate from
                  equity contributions and loan proceeds. Proceeds may be distributed to investors, but only to the
                  extent that doing so does not cause the property's cash balance to go negative (see No Over-Distribution Rule).
                  After refinancing, debt service recalculates based on the new loan amount and terms.
                </p>
              </div>
            </SectionCard>

            {/* Section: Cash Flow */}
            <SectionCard
              id="cash-flow"
              title="Free Cash Flow (GAAP Method)"
              subtitle="How we calculate cash available to investors"
              icon={DollarSign}
              variant="light"
              expanded={expandedSections.has("cash-flow")}
              onToggle={() => toggleSection("cash-flow")}
              sectionRef={(el) => { sectionRefs.current["cash-flow"] = el; }}
            >
              <p className="text-sm text-muted-foreground">
                We use the <strong>indirect method</strong> for calculating Free Cash Flow, which is the GAAP-compliant
                approach used in financial statements:
              </p>

              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div>
                  <h4 className="font-semibold text-sm">Step 1: Net Income</h4>
                  <div className="bg-background rounded p-2 font-mono text-xs mt-1">
                    Net Income = NOI − Interest Expense − Depreciation − Income Tax
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-sm">Step 2: Operating Cash Flow</h4>
                  <div className="bg-background rounded p-2 font-mono text-xs mt-1">
                    Operating Cash Flow = Net Income + Depreciation (add back non-cash expense)
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-sm">Step 3: Free Cash Flow (FCF)</h4>
                  <div className="bg-background rounded p-2 font-mono text-xs mt-1">
                    FCF = Operating Cash Flow − Maintenance CapEx
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Note: FF&E reserves are already included in operating expenses, so no additional CapEx deduction is made.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-sm">Step 4: Free Cash Flow to Equity (FCFE)</h4>
                  <div className="bg-background rounded p-2 font-mono text-xs mt-1">
                    FCFE = FCF − Principal Payments
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    FCFE is the cash available for distribution to equity investors after debt service.
                  </p>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Depreciation</h4>
                <p className="text-sm text-muted-foreground">
                  Buildings are depreciated over {DEPRECIATION_YEARS} years using the straight-line method (IRS requirement for residential rental property).
                  Land is not depreciated.
                </p>
                <div className="bg-background rounded p-2 font-mono text-xs mt-2 space-y-1">
                  <div>Depreciable Basis = Purchase Price × (1 − Land Value %) + Building Improvements</div>
                  <div>Annual Depreciation = Depreciable Basis ÷ {DEPRECIATION_YEARS}</div>
                </div>
              </div>
            </SectionCard>

            {/* Section: Balance Sheet */}
            <SectionCard
              id="balance-sheet"
              title="Balance Sheet"
              subtitle="Assets, liabilities, and equity per GAAP standards"
              icon={BookOpen}
              variant="light"
              expanded={expandedSections.has("balance-sheet")}
              onToggle={() => toggleSection("balance-sheet")}
              sectionRef={(el) => { sectionRefs.current["balance-sheet"] = el; }}
            >
              <p className="text-sm text-muted-foreground">
                The consolidated balance sheet tracks each property's financial position monthly, following the
                <strong> FASB Conceptual Framework</strong> fundamental equation:
              </p>
              <div className="bg-background rounded p-3 font-mono text-sm text-center">
                Assets = Liabilities + Equity
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Assets</h4>
                <div className="bg-background rounded p-3 font-mono text-sm space-y-1">
                  <div>Property Value = Purchase Price + Improvements − Accumulated Depreciation</div>
                  <div>Cash = Cumulative Free Cash Flow (operating + investing + financing)</div>
                  <div>Total Assets = Property Value + Cash + Other Assets</div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Depreciation follows ASC 360: straight-line over {DEPRECIATION_YEARS} years from the first full month after acquisition.
                  Property assets only appear on the balance sheet after the acquisition date.
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Liabilities</h4>
                <div className="bg-background rounded p-3 font-mono text-sm space-y-1">
                  <div>Debt Outstanding = Loan Balance − Cumulative Principal Payments</div>
                  <div>After Refinance: New Loan Balance − Post-Refi Principal Payments</div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Debt is recorded per ASC 470. For full-equity properties, liabilities are zero.
                  At refinancing, the old loan is fully replaced by the new loan at the refinanced balance.
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Equity</h4>
                <div className="bg-background rounded p-3 font-mono text-sm space-y-1">
                  <div>Equity = Total Assets − Total Liabilities</div>
                  <div>     = Initial Equity + Retained Earnings (cumulative net income)</div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  The verification system checks that Assets = Liabilities + Equity holds for every month
                  across every property — any imbalance triggers a critical audit finding.
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">GAAP References</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>&#8226; <strong>FASB Conceptual Framework</strong>: Balance sheet equation and double-entry integrity</li>
                  <li>&#8226; <strong>ASC 360</strong>: Property carried at cost minus accumulated depreciation</li>
                  <li>&#8226; <strong>ASC 470</strong>: Debt recorded at outstanding principal balance</li>
                  <li>&#8226; <strong>ASC 230</strong>: Cash reconciliation ties to cash flow statement</li>
                </ul>
              </div>
            </SectionCard>

            {/* Section: Returns */}
            <SectionCard
              id="returns"
              title="Investment Returns"
              subtitle="IRR, equity multiple, and exit value calculations"
              icon={PieChart}
              variant="light"
              expanded={expandedSections.has("returns")}
              onToggle={() => toggleSection("returns")}
              sectionRef={(el) => { sectionRefs.current["returns"] = el; }}
            >
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Exit Value</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  The property's net sale proceeds at exit:
                </p>
                <div className="bg-background rounded p-3 font-mono text-sm space-y-1">
                  <div>Gross Value = Final Year NOI ÷ Exit Cap Rate</div>
                  <div>Exit Value = Gross Value − Sales Commission − Outstanding Debt</div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  The exit cap rate defaults to {pct1(DEFAULT_EXIT_CAP_RATE)} but can be customized per property. Lower cap rates result in higher valuations.
                </p>
                <div className="mt-3 p-3 bg-background rounded border-l-2 border-primary">
                  <p className="text-sm text-muted-foreground">
                    <strong>Why might exit value seem low?</strong> For financed properties, the outstanding
                    loan balance is deducted from the gross property value. After {PROJECTION_YEARS} years of a {DEFAULT_TERM_YEARS}-year loan,
                    approximately 60-65% of the original loan remains. The total return to investors includes
                    annual cash flow distributions and any refinancing proceeds received throughout the holding
                    period—not just the exit value. This is why IRR and Equity Multiple are better measures of
                    overall investment performance.
                  </p>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Internal Rate of Return (IRR)</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  The annualized return that makes the net present value of all cash flows equal to zero:
                </p>
                <div className="bg-background rounded p-3 font-mono text-sm">
                  IRR = Rate where: Initial Equity + Σ(Annual FCFE ÷ (1+r)^n) + Exit Value ÷ (1+r)^{PROJECTION_YEARS} = 0
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Portfolio IRR is weighted by each property's equity investment.
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Equity Multiple</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Total cash returned divided by total cash invested:
                </p>
                <div className="bg-background rounded p-3 font-mono text-sm">
                  Equity Multiple = (Sum of All FCFE + Refinancing Proceeds + Exit Value) ÷ Initial Equity
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  A 2.0x multiple means investors received back twice their original investment.
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Cash-on-Cash Return</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Annual cash flow as a percentage of equity invested:
                </p>
                <div className="bg-background rounded p-3 font-mono text-sm">
                  Cash-on-Cash = Annual FCFE ÷ Initial Equity × 100%
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  The average shown in the dashboard is the mean of all {PROJECTION_YEARS} years.
                </p>
              </div>
            </SectionCard>

            {/* Section: Management Company */}
            <SectionCard
              id="management-company"
              title="Management Company Financials"
              subtitle="Hospitality Business Co. revenue and expenses"
              icon={Building2}
              variant="light"
              expanded={expandedSections.has("management-company")}
              onToggle={() => toggleSection("management-company")}
              sectionRef={(el) => { sectionRefs.current["management-company"] = el; }}
            >
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Revenue Sources</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>&#8226; <strong>Base Management Fees</strong>: {pct(0.05)} of each property's total revenue</li>
                  <li>&#8226; <strong>Incentive Fees</strong>: {pct(0.15)} of each property's GOP</li>
                </ul>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Operating Expenses</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>&#8226; <strong>Partner Compensation</strong>: Defined per-year ($540K/yr Years 1-3, escalating to $900K/yr by Year {PROJECTION_YEARS}, split across 3 partners)</li>
                  <li>&#8226; <strong>Fixed Costs</strong>: Office lease, professional services, insurance (escalate at fixed cost rate)</li>
                  <li>&#8226; <strong>Variable Costs</strong>: Travel, IT, marketing, misc operations (escalate at inflation rate)</li>
                </ul>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">SAFE Funding</h4>
                <p className="text-sm text-muted-foreground">
                  The management company is funded through SAFE (Simple Agreement for Future Equity) tranches.
                  These appear as cash inflows in the cash flow statement but are not recorded as revenue.
                  The funding provides working capital until the company becomes profitable from management fees.
                </p>
              </div>
            </SectionCard>

            {/* Section: Fixed Assumptions */}
            <SectionCard
              id="fixed-assumptions"
              title="Fixed Assumptions (Not Configurable)"
              subtitle="Hardcoded values built into the calculation engine"
              icon={Info}
              variant="light"
              className="border-amber-200 bg-amber-50/30"
              expanded={expandedSections.has("fixed-assumptions")}
              onToggle={() => toggleSection("fixed-assumptions")}
              sectionRef={(el) => { sectionRefs.current["fixed-assumptions"] = el; }}
            >
              <Callout severity="warning" variant="light">
                The following assumptions are built into the financial model and cannot be changed through the app interface.
                These represent industry standards or regulatory requirements.
              </Callout>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Time & Calendar</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>&#8226; <strong>Days per Month</strong>: {DAYS_PER_MONTH} days (365 ÷ 12 = 30.4167, rounded to {DAYS_PER_MONTH})</li>
                  <li>&#8226; <strong>Months per Year</strong>: 12 months</li>
                  <li>&#8226; <strong>Projection Period</strong>: Configurable 1-30 years (default {PROJECTION_YEARS} years / {PROJECTION_YEARS * 12} months)</li>
                </ul>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Depreciation & Taxes</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>&#8226; <strong>Depreciation Period</strong>: {DEPRECIATION_YEARS} years straight-line (IRS requirement for residential rental property)</li>
                  <li>&#8226; <strong>Land Depreciation</strong>: None (land is not depreciated per IRS rules)</li>
                  <li>&#8226; <strong>Depreciation Start</strong>: First month after acquisition date</li>
                </ul>
              </div>

              <Callout severity="success" variant="light" title={`Expense Ratios (Now Configurable in Systemwide Assumptions)`}>
                <ul className="space-y-2">
                  <li>&#8226; <strong>Event Expense Rate</strong>: Default {pct(DEFAULT_EVENT_EXPENSE_RATE)} of event revenue (editable)</li>
                  <li>&#8226; <strong>Other Revenue Expense Rate</strong>: Default {pct(DEFAULT_OTHER_EXPENSE_RATE)} of other revenue (editable)</li>
                  <li>&#8226; <strong>Utilities Split</strong>: Default {pct(DEFAULT_UTILITIES_VARIABLE_SPLIT)} variable / {pct(1 - DEFAULT_UTILITIES_VARIABLE_SPLIT)} fixed (editable)</li>
                </ul>
              </Callout>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Default Loan Parameters (Used if Not Specified at Property Level)</h4>
                <ManualTable
                  variant="light"
                  headers={["Parameter", "Default"]}
                  rows={[
                    ["Default LTV", pct(DEFAULT_LTV)],
                    ["Default Interest Rate", pct(DEFAULT_INTEREST_RATE)],
                    ["Default Loan Term", `${DEFAULT_TERM_YEARS} years`],
                    ["Default Refinance LTV", pct(DEFAULT_REFI_LTV)],
                    ["Default Refinance Closing Costs", pct(DEFAULT_REFI_CLOSING_COST_RATE)],
                  ]}
                />
                <p className="text-xs text-muted-foreground mt-2">Override these at the property level in Property Assumptions.</p>
              </div>

              <Callout severity="success" variant="light" title="Exit & Sale Assumptions (Now Configurable)">
                <ul className="space-y-2">
                  <li>&#8226; <strong>Exit Cap Rate</strong>: Default {pct1(DEFAULT_EXIT_CAP_RATE)} (editable in Systemwide & Property Assumptions)</li>
                  <li>&#8226; <strong>Sales Commission</strong>: Default {pct(DEFAULT_COMMISSION_RATE)} of gross sale price (editable in Systemwide Assumptions)</li>
                  <li>&#8226; <strong>Tax Rate</strong>: Default {pct(DEFAULT_TAX_RATE)} (editable at property level)</li>
                </ul>
              </Callout>

              <Callout severity="success" variant="light" title="Revenue Shares (Configurable Per Property)">
                <ul className="space-y-2">
                  <li>&#8226; <strong>Events Revenue</strong>: Default {pct(DEFAULT_REV_SHARE_EVENTS)} of room revenue (editable per property)</li>
                  <li>&#8226; <strong>F&B Revenue</strong>: Default {pct(DEFAULT_REV_SHARE_FB)} of room revenue (editable per property)</li>
                  <li>&#8226; <strong>Other Revenue</strong>: Default {pct(DEFAULT_REV_SHARE_OTHER)} of room revenue (editable per property)</li>
                </ul>
                <p className="text-xs mt-2">Configure these in Property Assumptions under "Revenue Mix".</p>
              </Callout>

              <Callout severity="success" variant="light" title="Catering Boost (Configurable)">
                <ul className="space-y-2">
                  <li>&#8226; <strong>Catering Boost %</strong>: Default {pct(DEFAULT_CATERING_BOOST_PCT)} (editable per property)</li>
                  <li>&#8226; Represents the blended uplift from all catered events</li>
                  <li>&#8226; Applied to base F&B revenue: Total F&B = Base F&B × (1 + Boost %)</li>
                </ul>
              </Callout>
            </SectionCard>

            {/* Section: Verification */}
            <SectionCard
              id="verification"
              title="Financial Verification & Audit"
              subtitle="How we verify calculations for GAAP compliance"
              icon={Calculator}
              variant="light"
              expanded={expandedSections.has("verification")}
              onToggle={() => toggleSection("verification")}
              sectionRef={(el) => { sectionRefs.current["verification"] = el; }}
            >
              <p className="text-sm text-muted-foreground">
                The system includes a comprehensive <strong>PwC-level audit engine</strong> that independently
                recalculates all financial values and compares them against the primary financial engine.
                This ensures accuracy and GAAP compliance across all statements.
              </p>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Audit Sections</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>&#8226; <strong>Timing Rules (ASC 606)</strong>: Verifies no revenue or expenses before acquisition/operations start dates</li>
                  <li>&#8226; <strong>Depreciation (ASC 360)</strong>: Verifies {DEPRECIATION_YEARS}-year straight-line depreciation starting at acquisition</li>
                  <li>&#8226; <strong>Loan Amortization (ASC 470)</strong>: Recalculates PMT formula, verifies interest/principal split each month</li>
                  <li>&#8226; <strong>Income Statement</strong>: Verifies Revenue, GOP, NOI, and Net Income calculations</li>
                  <li>&#8226; <strong>Balance Sheet (FASB Framework)</strong>: Verifies Assets = Liabilities + Equity for every period</li>
                  <li>&#8226; <strong>Cash Flow Statement (ASC 230)</strong>: Verifies indirect method and Operating/Financing activity split</li>
                  <li>&#8226; <strong>Management Fees</strong>: Verifies base and incentive fee calculations</li>
                </ul>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Key GAAP Rules Enforced</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>&#8226; <strong>ASC 470</strong>: Principal payments are NOT expenses - they reduce Net Income only for cash flow purposes, not on the income statement</li>
                  <li>&#8226; <strong>ASC 230-10-45</strong>: Operating Cash Flow = Net Income + Depreciation (indirect method)</li>
                  <li>&#8226; <strong>ASC 230-10-45-17</strong>: Interest expense is an operating activity; principal repayment is a financing activity</li>
                  <li>&#8226; <strong>ASC 360-10</strong>: Property assets carried at cost minus accumulated depreciation</li>
                </ul>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Known-Value Test Cases</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  The audit engine includes test cases with hand-calculated expected values to validate the calculation engine:
                </p>
                <div className="bg-background rounded p-3 font-mono text-sm space-y-1">
                  <div>10 rooms × $100 ADR × 70% occupancy × {DAYS_PER_MONTH} days = $21,350</div>
                  <div>20 rooms × $150 ADR × 65% occupancy × {DAYS_PER_MONTH} days = $59,475</div>
                  <div>Depreciation: $1,200,000 ÷ {DEPRECIATION_YEARS} years = $43,636.36/year</div>
                  <div>Loan PMT: $900,000 @ {pct(DEFAULT_INTEREST_RATE)}/{DEFAULT_TERM_YEARS}yr = $7,549.94/month</div>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Audit Opinions</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>&#8226; <strong>UNQUALIFIED</strong>: All calculations verified, no material or critical issues</li>
                  <li>&#8226; <strong>QUALIFIED</strong>: Minor material issues found but overall statements are fairly presented</li>
                  <li>&#8226; <strong>ADVERSE</strong>: Critical issues found that affect the reliability of the financial projections</li>
                </ul>
              </div>
            </SectionCard>

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
                  The model automatically recalculates all projections when you change any input.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
