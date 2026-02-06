import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Calculator, TrendingUp, Building2, DollarSign, PieChart, BarChart3, Wallet, Info, Layers, ArrowRightLeft, BookOpen, ShieldCheck, Banknote, RefreshCw } from "lucide-react";

export default function Methodology() {
  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Methodology</h1>
          <p className="text-muted-foreground mt-2">
            How we calculate financial projections, returns, and investment metrics
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              Overview of the Financial Model
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none text-muted-foreground">
            <p>
              This financial model generates multi-year projections (configurable 1-30 years, default 10) for a portfolio of hospitality properties. 
              It uses a combination of <strong>Systemwide Assumptions</strong> (market-wide parameters) and 
              <strong>Property Assumptions</strong> (individual property details) to calculate revenues, 
              expenses, cash flows, and investment returns.
            </p>
            <p>
              The model follows <strong>GAAP-compliant accounting standards</strong> and uses the 
              <strong>indirect method for Free Cash Flow</strong> calculations, which is the industry 
              standard for real estate investment analysis.
            </p>
          </CardContent>
        </Card>

        <Accordion type="multiple" className="space-y-4">
          <AccordionItem value="business-model" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Business Model Overview</h3>
                  <p className="text-sm text-muted-foreground">Two-entity structure: Management Company + Property Portfolio</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 pb-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                The L+B Hospitality model consists of <strong>two distinct financial entities</strong> that are
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
                    <li>• Each property is modeled independently</li>
                    <li>• Revenue from rooms, F&B, events, other</li>
                    <li>• Expenses per USALI standards</li>
                    <li>• Debt service for financed properties</li>
                    <li>• Full balance sheet and cash flow statement</li>
                    <li>• IRR and equity multiple at exit</li>
                  </ul>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Management Company P&L</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Revenue = management fees from all properties</li>
                    <li>• Partner compensation (defined per-year array)</li>
                    <li>• Staff costs scale with property count (tiered)</li>
                    <li>• Fixed costs: office, insurance, professional services</li>
                    <li>• Variable costs: travel, IT, marketing</li>
                    <li>• SAFE funding for working capital</li>
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
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="business-rules" className="border rounded-lg px-4 border-red-200 bg-red-50/30">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-red-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Business Rules & Constraints</h3>
                  <p className="text-sm text-muted-foreground">Mandatory financial gates and safety checks</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 pb-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                The system enforces mandatory business rules that reflect real-world financial constraints.
                These rules cannot be overridden — if any are violated, the system flags the scenario as invalid
                and requires assumption adjustments before proceeding.
              </p>

              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <h4 className="font-semibold mb-2 text-red-800">1. Management Company Funding Gate</h4>
                <p className="text-sm text-red-700">
                  Operations of the Management Company cannot begin before funding is received. The company requires 
                  SAFE funding tranches to cover startup costs (staff, office, professional services) before management 
                  fee revenue begins flowing from properties.
                </p>
                <p className="text-sm text-red-700 mt-2">
                  If assumptions indicate operations before funding, the system blocks the scenario and flags it as invalid.
                </p>
              </div>

              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <h4 className="font-semibold mb-2 text-red-800">2. Property Activation Gate</h4>
                <p className="text-sm text-red-700">
                  A property cannot begin operating before it is purchased and funding is in place — whether that's 
                  100% equity (cash purchase) or debt financing plus equity. Revenue and operating expenses only begin 
                  after the acquisition date and operations start date.
                </p>
                <p className="text-sm text-red-700 mt-2">
                  If the operating start date precedes acquisition or funding, the system blocks the scenario.
                </p>
              </div>

              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <h4 className="font-semibold mb-2 text-red-800">3. No Negative Cash Rule</h4>
                <p className="text-sm text-red-700">
                  Cash balances for each property, the Management Company, and the aggregated portfolio must never 
                  be negative. This ensures realistic capital planning and prevents scenarios where entities spend 
                  money they don't have.
                </p>
                <p className="text-sm text-red-700 mt-2">
                  If any projected cash balance goes below zero, the system flags a funding shortfall and requires 
                  increased funding, earlier funding, or assumption adjustments.
                </p>
              </div>

              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <h4 className="font-semibold mb-2 text-red-800">4. Debt-Free at Exit</h4>
                <p className="text-sm text-red-700">
                  At exit (end of the projection period), all properties must be debt-free. Outstanding loan balances 
                  are repaid from gross sale proceeds before calculating net proceeds to equity. The exit waterfall is:
                </p>
                <div className="bg-white/50 rounded p-2 font-mono text-xs mt-2 text-red-700">
                  <div>Gross Sale Value = Final Year NOI / Exit Cap Rate</div>
                  <div>Less: Sales Commission</div>
                  <div>Less: Outstanding Debt Balance (must be fully repaid)</div>
                  <div>= Net Proceeds to Equity</div>
                </div>
              </div>

              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <h4 className="font-semibold mb-2 text-red-800">5. No Over-Distribution Rule</h4>
                <p className="text-sm text-red-700">
                  FCF distributions and refinancing proceeds returned to investors must not exceed available cash.
                  The system must not distribute cash to the point that any property ends up with a negative cash
                  balance. This ensures that repayment of principal and investor distributions are always funded
                  by actual available cash. Refinance payback to investors is also subject to this constraint —
                  proceeds from refinancing cannot be swept out if doing so would leave the property cash-negative.
                </p>
              </div>

              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <h4 className="font-semibold mb-2 text-red-800">6. Income Statement: Interest Only (No Principal)</h4>
                <p className="text-sm text-red-700">
                  The income statement must show <strong>only interest expense</strong>, never principal repayment.
                  Principal repayment is a <strong>financing activity</strong> (ASC 470), not an operating expense.
                  It reduces cash but does not reduce net income. The income statement waterfall is:
                </p>
                <div className="bg-white/50 rounded p-2 font-mono text-xs mt-2 text-red-700">
                  <div>NOI</div>
                  <div>Less: Interest Expense (only the interest portion of debt service)</div>
                  <div>Less: Depreciation</div>
                  <div>Less: Income Tax</div>
                  <div>= Net Income</div>
                </div>
                <p className="text-sm text-red-700 mt-2">
                  Principal repayment appears only on the cash flow statement as a financing outflow.
                </p>
              </div>

              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <h4 className="font-semibold mb-2 text-red-800">7. Capital Structure Presentation in Reports</h4>
                <p className="text-sm text-red-700">
                  All financial reports, cash flow statements, and balance sheets must present capital sources
                  on <strong>separate lines</strong> for clarity:
                </p>
                <div className="bg-white/50 rounded p-2 font-mono text-xs mt-2 text-red-700 space-y-1">
                  <div><strong>Equity (Cash) Infusion</strong> — one line item</div>
                  <div><strong>Loan Proceeds</strong> — separate line item (acquisition financing)</div>
                  <div><strong>Refinancing Proceeds</strong> — separate line item (cash-out from refi)</div>
                </div>
                <p className="text-sm text-red-700 mt-2">
                  Equity and debt/refinance must never be lumped together. Each source of capital has different
                  risk characteristics, repayment obligations, and investor implications. This separation must be
                  maintained in income statements, cash flow statements, balance sheets, and all exported reports
                  (PDF, CSV).
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="capital-lifecycle" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Banknote className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Capital Structure & Investor Returns</h3>
                  <p className="text-sm text-muted-foreground">How capital flows in and how investors get paid back</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 pb-6 space-y-4">
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
                      <li>&#8226; Loan based on LTV ratio (default 75%)</li>
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
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="dynamic-behavior" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Dynamic Behavior & System Goals</h3>
                  <p className="text-sm text-muted-foreground">Real-time recalculation and multi-level analysis</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 pb-6 space-y-4">
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
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="property-lifecycle" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Property Lifecycle</h3>
                  <p className="text-sm text-muted-foreground">Acquisition → Operations → Refinancing → Exit</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 pb-6 space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">1. Acquisition</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Each property enters the model at its acquisition date with a defined capital structure:
                </p>
                <div className="bg-background rounded p-3 font-mono text-sm space-y-1">
                  <div>Total Project Cost = Purchase Price + Closing Costs (2%) + Operating Reserve</div>
                  <div>Loan Amount = Purchase Price × LTV (default 75%) — for financed properties</div>
                  <div>Initial Equity = Total Project Cost − Loan Amount</div>
                </div>
                <ul className="mt-3 text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Full Equity</strong>: No debt, 100% equity funded</li>
                  <li>• <strong>Financed</strong>: Debt + equity per LTV ratio</li>
                  <li>• Balance sheet entries only appear after acquisition date</li>
                  <li>• Depreciation begins the first full month after acquisition</li>
                </ul>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">2. Operations</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Revenue and expenses begin at the operations start date with a ramp-up period:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Occupancy ramps from starting rate (default 55%) to maximum (default 85%)</li>
                  <li>• Ramp-up occurs over configurable months (default 6 months)</li>
                  <li>• ADR grows annually at the ADR growth rate (default 3%)</li>
                  <li>• Expenses escalate annually with inflation (variable) or fixed cost escalation rate</li>
                  <li>• NOI = Revenue − Operating Expenses − Management Fees − FF&E Reserve</li>
                </ul>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">3. Refinancing (Financed Properties Only)</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  At the refinance date (default: 3 years after operations start), the property is reappraised:
                </p>
                <div className="bg-background rounded p-3 font-mono text-sm space-y-1">
                  <div>Appraised Value = Trailing-12-Month NOI ÷ Cap Rate</div>
                  <div>New Loan = Appraised Value × Refi LTV (default 65%)</div>
                  <div>Proceeds = New Loan − Old Balance − Closing Costs (3%)</div>
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
                  <div>Gross Sale Value = Final Year NOI ÷ Exit Cap Rate (default 8.5%)</div>
                  <div>Less: Sales Commission (default 5%)</div>
                  <div>Less: Outstanding Debt Balance</div>
                  <div>= Net Proceeds to Equity</div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  All outstanding debt is fully repaid from gross sale proceeds — properties must be debt-free at exit.
                  Net exit proceeds combined with cumulative FCFE and refinancing proceeds determine the total return (IRR, equity multiple).
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="defaults" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Info className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Default Values & Assumptions</h3>
                  <p className="text-sm text-muted-foreground">Where the default numbers come from</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 pb-6 space-y-4">
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
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Key Default Assumptions</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Inflation Rate: 3% annually</li>
                  <li>• Management Base Fee: 5% of revenue</li>
                  <li>• Management Incentive Fee: 15% of GOP</li>
                  <li>• Loan-to-Value (LTV): 75%</li>
                  <li>• Interest Rate: 9%</li>
                  <li>• Loan Term: 25 years</li>
                  <li>• Exit Cap Rate: 8.5%</li>
                  <li>• FF&E Reserve: 4% of revenue</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="revenue" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Revenue Calculations</h3>
                  <p className="text-sm text-muted-foreground">How we project rooms, F&B, and events revenue</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 pb-6 space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Room Revenue</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  The primary revenue driver for each property, calculated monthly:
                </p>
                <div className="bg-background rounded p-3 font-mono text-sm">
                  Room Revenue = Room Count × ADR × Occupancy × 30.5 days
                </div>
                <ul className="mt-3 text-sm text-muted-foreground space-y-1">
                  <li>• <strong>ADR (Average Daily Rate)</strong>: Starts at the property's initial rate and grows annually at the ADR Growth Rate</li>
                  <li>• <strong>Occupancy</strong>: Ramps up from starting occupancy to maximum occupancy over the stabilization period</li>
                  <li>• <strong>Room Count</strong>: Fixed number of rooms per property</li>
                  <li>• <strong>Days in Month</strong>: Uses 30.5 days (365 ÷ 12 = 30.4167, rounded to 30.5) as the industry-standard average month length</li>
                </ul>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Food & Beverage Revenue</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Calculated as a percentage of room revenue:
                </p>
                <div className="bg-background rounded p-3 font-mono text-sm">
                  F&B Revenue = Room Revenue × F&B Revenue Share (default 22%) × Catering Boost
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Event Revenue</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Based on the property's catering level setting:
                </p>
                <div className="bg-background rounded p-3 font-mono text-sm">
                  Event Revenue = Room Revenue × Catering Level Rate
                </div>
                <ul className="mt-3 text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Full Service</strong>: 50% of room revenue</li>
                  <li>• <strong>Partial Service</strong>: 25% of room revenue</li>
                  <li>• <strong>None</strong>: No events revenue</li>
                </ul>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Other Revenue</h4>
                <p className="text-sm text-muted-foreground">
                  Includes spa, parking, retail, and miscellaneous income. Calculated as 7% of room revenue by default.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="expenses" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-red-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Operating Expenses</h3>
                  <p className="text-sm text-muted-foreground">How we calculate property operating costs</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 pb-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Operating expenses are calculated as percentages of total revenue and escalate annually with inflation:
              </p>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Direct Costs</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Room Expense: 36% of room revenue</li>
                    <li>• F&B Expense: 15% of F&B revenue</li>
                    <li>• Event Expense: 65% of event revenue</li>
                  </ul>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Overhead Costs</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Marketing: 5% of total revenue</li>
                    <li>• Admin & General: 8% of total revenue</li>
                    <li>• Property Operations: 4% of total revenue</li>
                    <li>• Utilities: 5% of total revenue</li>
                    <li>• Insurance: 2% of total revenue</li>
                    <li>• Property Taxes: 3% of total revenue</li>
                    <li>• IT Systems: 2% of total revenue</li>
                  </ul>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">FF&E Reserve</h4>
                <p className="text-sm text-muted-foreground">
                  4% of total revenue is set aside for Furniture, Fixtures & Equipment replacement. 
                  This is included in operating expenses following the Uniform System of Accounts for the Lodging Industry (USALI).
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="noi-gop" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">GOP and NOI</h3>
                  <p className="text-sm text-muted-foreground">Gross Operating Profit and Net Operating Income</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 pb-6 space-y-4">
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
                  L+B Hospitality earns fees for managing each property:
                </p>
                <div className="bg-background rounded p-3 font-mono text-sm space-y-1">
                  <div>Base Fee = Total Revenue × 5%</div>
                  <div>Incentive Fee = GOP × 15%</div>
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
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="debt" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-orange-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Debt & Financing</h3>
                  <p className="text-sm text-muted-foreground">Loan calculations and refinancing</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 pb-6 space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Initial Financing</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  For financed properties, the loan amount is based on Loan-to-Value (LTV):
                </p>
                <div className="bg-background rounded p-3 font-mono text-sm space-y-1">
                  <div>Loan Amount = Purchase Price × LTV Ratio (default 75%)</div>
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
                  <div>New Loan = Appraised Value × Refinance LTV (default 65%)</div>
                  <div>Net Proceeds = New Loan − Old Balance − Closing Costs (default 3%)</div>
                  <div>Pass 2: Re-amortize with new loan terms from refinance date forward</div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Net refinance proceeds appear as a financing activity in the cash flow statement — separate from
                  equity contributions and loan proceeds. Proceeds may be distributed to investors, but only to the
                  extent that doing so does not cause the property's cash balance to go negative (see No Over-Distribution Rule).
                  After refinancing, debt service recalculates based on the new loan amount and terms.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="cash-flow" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Free Cash Flow (GAAP Method)</h3>
                  <p className="text-sm text-muted-foreground">How we calculate cash available to investors</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 pb-6 space-y-4">
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
                  Buildings are depreciated over 27.5 years using the straight-line method (IRS requirement for residential rental property). 
                  Land is not depreciated.
                </p>
                <div className="bg-background rounded p-2 font-mono text-xs mt-2">
                  Annual Depreciation = (Purchase Price + Building Improvements) ÷ 27.5
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="balance-sheet" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-teal-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Balance Sheet</h3>
                  <p className="text-sm text-muted-foreground">Assets, liabilities, and equity per GAAP standards</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 pb-6 space-y-4">
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
                  Depreciation follows ASC 360: straight-line over 27.5 years from the first full month after acquisition.
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
                  <li>• <strong>FASB Conceptual Framework</strong>: Balance sheet equation and double-entry integrity</li>
                  <li>• <strong>ASC 360</strong>: Property carried at cost minus accumulated depreciation</li>
                  <li>• <strong>ASC 470</strong>: Debt recorded at outstanding principal balance</li>
                  <li>• <strong>ASC 230</strong>: Cash reconciliation ties to cash flow statement</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="returns" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <PieChart className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Investment Returns</h3>
                  <p className="text-sm text-muted-foreground">IRR, equity multiple, and exit value calculations</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 pb-6 space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Exit Value</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  The property's net sale proceeds in Year 10:
                </p>
                <div className="bg-background rounded p-3 font-mono text-sm space-y-1">
                  <div>Gross Value = Year 10 NOI ÷ Exit Cap Rate</div>
                  <div>Exit Value = Gross Value − Sales Commission − Outstanding Debt</div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  The exit cap rate defaults to 8.5% but can be customized per property. Lower cap rates result in higher valuations.
                </p>
                <div className="mt-3 p-3 bg-background rounded border-l-2 border-primary">
                  <p className="text-sm text-muted-foreground">
                    <strong>Why might exit value seem low?</strong> For financed properties, the outstanding 
                    loan balance is deducted from the gross property value. After 10 years of a 25-year loan, 
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
                  IRR = Rate where: Initial Equity + Σ(Annual FCFE ÷ (1+r)^n) + Exit Value ÷ (1+r)^10 = 0
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
                  The average shown in the dashboard is the mean of all 10 years.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="management-company" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-amber-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Management Company Financials</h3>
                  <p className="text-sm text-muted-foreground">L+B Hospitality Co. revenue and expenses</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 pb-6 space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Revenue Sources</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• <strong>Base Management Fees</strong>: 5% of each property's total revenue</li>
                  <li>• <strong>Incentive Fees</strong>: 15% of each property's GOP</li>
                </ul>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Operating Expenses</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• <strong>Partner Compensation</strong>: Defined per-year ($540K/yr Years 1-3, escalating to $900K/yr by Year 10, split across 3 partners)</li>
                  <li>• <strong>Fixed Costs</strong>: Office lease, professional services, insurance (escalate at fixed cost rate)</li>
                  <li>• <strong>Variable Costs</strong>: Travel, IT, marketing, misc operations (escalate at inflation rate)</li>
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
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="fixed-assumptions" className="border rounded-lg px-4 border-amber-200 bg-amber-50/30">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Info className="w-5 h-5 text-amber-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Fixed Assumptions (Not Configurable)</h3>
                  <p className="text-sm text-muted-foreground">Hardcoded values built into the calculation engine</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 pb-6 space-y-4">
              <div className="p-4 bg-amber-100/50 rounded-lg border border-amber-200">
                <p className="text-sm text-amber-800 font-medium">
                  The following assumptions are built into the financial model and cannot be changed through the app interface. 
                  These represent industry standards or regulatory requirements.
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Time & Calendar</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• <strong>Days per Month</strong>: 30.5 days (365 ÷ 12 = 30.4167, rounded to 30.5)</li>
                  <li>• <strong>Months per Year</strong>: 12 months</li>
                  <li>• <strong>Projection Period</strong>: Configurable 1-30 years (default 10 years / 120 months)</li>
                </ul>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Depreciation & Taxes</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• <strong>Depreciation Period</strong>: 27.5 years straight-line (IRS requirement for residential rental property)</li>
                  <li>• <strong>Land Depreciation</strong>: None (land is not depreciated per IRS rules)</li>
                  <li>• <strong>Depreciation Start</strong>: First month after acquisition date</li>
                </ul>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h4 className="font-semibold mb-2 text-green-800">Expense Ratios (Now Configurable in Systemwide Assumptions)</h4>
                <ul className="text-sm text-green-700 space-y-2">
                  <li>• <strong>Event Expense Rate</strong>: Default 65% of event revenue <span className="text-green-600">(editable)</span></li>
                  <li>• <strong>Other Revenue Expense Rate</strong>: Default 60% of other revenue <span className="text-green-600">(editable)</span></li>
                  <li>• <strong>Utilities Split</strong>: Default 60% variable / 40% fixed <span className="text-green-600">(editable)</span></li>
                </ul>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Default Loan Parameters (Used if Not Specified at Property Level)</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• <strong>Default LTV</strong>: 75%</li>
                  <li>• <strong>Default Interest Rate</strong>: 9%</li>
                  <li>• <strong>Default Loan Term</strong>: 25 years</li>
                  <li>• <strong>Default Refinance LTV</strong>: 65%</li>
                  <li>• <strong>Default Refinance Closing Costs</strong>: 3%</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">Override these at the property level in Property Assumptions.</p>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h4 className="font-semibold mb-2 text-green-800">Exit & Sale Assumptions (Now Configurable)</h4>
                <ul className="text-sm text-green-700 space-y-2">
                  <li>• <strong>Exit Cap Rate</strong>: Default 8.5% <span className="text-green-600">(editable in Systemwide & Property Assumptions)</span></li>
                  <li>• <strong>Sales Commission</strong>: Default 5% of gross sale price <span className="text-green-600">(editable in Systemwide Assumptions)</span></li>
                  <li>• <strong>Tax Rate</strong>: Default 25% <span className="text-green-600">(editable at property level)</span></li>
                </ul>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h4 className="font-semibold mb-2 text-green-800">Revenue Shares (Configurable Per Property)</h4>
                <ul className="text-sm text-green-700 space-y-2">
                  <li>• <strong>Events Revenue</strong>: Default 43% of room revenue <span className="text-green-600">(editable per property)</span></li>
                  <li>• <strong>F&B Revenue</strong>: Default 22% of room revenue <span className="text-green-600">(editable per property)</span></li>
                  <li>• <strong>Other Revenue</strong>: Default 7% of room revenue <span className="text-green-600">(editable per property)</span></li>
                </ul>
                <p className="text-xs text-green-600 mt-2">Configure these in Property Assumptions under "Revenue Mix".</p>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h4 className="font-semibold mb-2 text-green-800">Catering F&B Boost (Configurable)</h4>
                <ul className="text-sm text-green-700 space-y-2">
                  <li>• <strong>Full Catering Mix</strong>: Default 40% of events <span className="text-green-600">(editable per property)</span></li>
                  <li>• <strong>Partial Catering Mix</strong>: Default 30% of events <span className="text-green-600">(editable per property)</span></li>
                  <li>• <strong>Full Catering F&B Boost</strong>: Default +50% to base F&B <span className="text-green-600">(editable in Systemwide Assumptions)</span></li>
                  <li>• <strong>Partial Catering F&B Boost</strong>: Default +25% to base F&B <span className="text-green-600">(editable in Systemwide Assumptions)</span></li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="verification" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-cyan-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Financial Verification & Audit</h3>
                  <p className="text-sm text-muted-foreground">How we verify calculations for GAAP compliance</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 pb-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                The system includes a comprehensive <strong>PwC-level audit engine</strong> that independently 
                recalculates all financial values and compares them against the primary financial engine. 
                This ensures accuracy and GAAP compliance across all statements.
              </p>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Audit Sections</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• <strong>Timing Rules (ASC 606)</strong>: Verifies no revenue or expenses before acquisition/operations start dates</li>
                  <li>• <strong>Depreciation (ASC 360)</strong>: Verifies 27.5-year straight-line depreciation starting at acquisition</li>
                  <li>• <strong>Loan Amortization (ASC 470)</strong>: Recalculates PMT formula, verifies interest/principal split each month</li>
                  <li>• <strong>Income Statement</strong>: Verifies Revenue, GOP, NOI, and Net Income calculations</li>
                  <li>• <strong>Balance Sheet (FASB Framework)</strong>: Verifies Assets = Liabilities + Equity for every period</li>
                  <li>• <strong>Cash Flow Statement (ASC 230)</strong>: Verifies indirect method and Operating/Financing activity split</li>
                  <li>• <strong>Management Fees</strong>: Verifies base and incentive fee calculations</li>
                </ul>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Key GAAP Rules Enforced</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• <strong>ASC 470</strong>: Principal payments are NOT expenses - they reduce Net Income only for cash flow purposes, not on the income statement</li>
                  <li>• <strong>ASC 230-10-45</strong>: Operating Cash Flow = Net Income + Depreciation (indirect method)</li>
                  <li>• <strong>ASC 230-10-45-17</strong>: Interest expense is an operating activity; principal repayment is a financing activity</li>
                  <li>• <strong>ASC 360-10</strong>: Property assets carried at cost minus accumulated depreciation</li>
                </ul>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Known-Value Test Cases</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  The audit engine includes test cases with hand-calculated expected values to validate the calculation engine:
                </p>
                <div className="bg-background rounded p-3 font-mono text-sm space-y-1">
                  <div>10 rooms × $100 ADR × 70% occupancy × 30.5 days = $21,350</div>
                  <div>20 rooms × $150 ADR × 65% occupancy × 30.5 days = $59,475</div>
                  <div>Depreciation: $1,200,000 ÷ 27.5 years = $43,636.36/year</div>
                  <div>Loan PMT: $900,000 @ 9%/25yr = $7,549.94/month</div>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Audit Opinions</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• <strong>UNQUALIFIED</strong>: All calculations verified, no material or critical issues</li>
                  <li>• <strong>QUALIFIED</strong>: Minor material issues found but overall statements are fairly presented</li>
                  <li>• <strong>ADVERSE</strong>: Critical issues found that affect the reliability of the financial projections</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
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
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
