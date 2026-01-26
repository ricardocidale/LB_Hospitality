import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Calculator, TrendingUp, Building2, DollarSign, PieChart, BarChart3, Wallet } from "lucide-react";

export default function Methodology() {
  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Methodology</h1>
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
              This financial model generates 10-year projections for a portfolio of hospitality properties. 
              It uses a combination of <strong>Global Assumptions</strong> (market-wide parameters) and 
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
                <h4 className="font-semibold mb-2">Rooms Revenue</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  The primary revenue driver for each property, calculated monthly:
                </p>
                <div className="bg-background rounded p-3 font-mono text-sm">
                  Rooms Revenue = Room Count × ADR × Occupancy × Days in Month
                </div>
                <ul className="mt-3 text-sm text-muted-foreground space-y-1">
                  <li>• <strong>ADR (Average Daily Rate)</strong>: Starts at the property's initial rate and grows annually at the ADR Growth Rate</li>
                  <li>• <strong>Occupancy</strong>: Ramps up from starting occupancy to maximum occupancy over the stabilization period</li>
                  <li>• <strong>Room Count</strong>: Fixed number of rooms per property</li>
                </ul>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Food & Beverage Revenue</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Calculated as a percentage of rooms revenue:
                </p>
                <div className="bg-background rounded p-3 font-mono text-sm">
                  F&B Revenue = Rooms Revenue × F&B Rate (default 28%)
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Events Revenue</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Based on the property's catering level setting:
                </p>
                <div className="bg-background rounded p-3 font-mono text-sm">
                  Events Revenue = Rooms Revenue × Catering Level Rate
                </div>
                <ul className="mt-3 text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Full Service</strong>: 50% of rooms revenue</li>
                  <li>• <strong>Partial Service</strong>: 25% of rooms revenue</li>
                  <li>• <strong>None</strong>: No events revenue</li>
                </ul>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Other Revenue</h4>
                <p className="text-sm text-muted-foreground">
                  Includes spa, parking, retail, and miscellaneous income. Calculated as 7% of rooms revenue by default.
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
                    <li>• Rooms Expense: 36% of rooms revenue</li>
                    <li>• F&B Expense: 15% of F&B revenue</li>
                    <li>• Events Expense: Based on catering level (80-92%)</li>
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
                  <div>Loan Amount = Purchase Price × LTV Ratio (default 65%)</div>
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
                  Each payment is split between interest expense (deductible) and principal repayment.
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Refinancing</h4>
                <p className="text-sm text-muted-foreground">
                  Properties can be refinanced based on their new appraised value. The new loan pays off the 
                  existing mortgage, and any excess proceeds are distributed to investors. Refinancing typically 
                  occurs when property values increase significantly.
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
                  <li>• <strong>Partner Salaries</strong>: Starting at $15,000/month per partner, escalating at inflation + 10% (capped at $30,000/month)</li>
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
                  All assumptions can be customized in the Global Assumptions and Property Assumptions pages. 
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
