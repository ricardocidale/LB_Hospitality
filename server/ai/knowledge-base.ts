import * as fs from "fs";
import * as path from "path";
import { logger } from "../logger";
import { getOpenAIClient } from "./clients";

const EMBEDDING_MODEL = "text-embedding-3-small";
const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;
const TOP_K = 8;
const MAX_RAG_CONTEXT_CHARS = 4000;

export function splitIntoChunks(text: string, title: string, source: string, category: string): { title: string; content: string; source: string; category: string }[] {
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 20);
  const chunks: { title: string; content: string; source: string; category: string }[] = [];
  let current = "";
  let currentTitle = title;

  for (const para of paragraphs) {
    const headerMatch = para.match(/^#{1,4}\s+(.+)/);
    if (headerMatch) {
      currentTitle = `${title} > ${headerMatch[1].trim()}`;
    }

    if ((current + "\n\n" + para).length > CHUNK_SIZE && current.length > 0) {
      chunks.push({ title: currentTitle, content: current.trim(), source, category });
      const words = current.split(/\s+/);
      const overlapWords = words.slice(-Math.floor(CHUNK_OVERLAP / 5));
      current = overlapWords.join(" ") + "\n\n" + para;
    } else {
      current = current ? current + "\n\n" + para : para;
    }
  }

  if (current.trim().length > 20) {
    chunks.push({ title: currentTitle, content: current.trim(), source, category });
  }

  return chunks;
}

function extractMethodologyContent(): { title: string; content: string; source: string; category: string }[] {
  const chunks: { title: string; content: string; source: string; category: string }[] = [];

  chunks.push({
    title: "Business Model Overview",
    content: `The Hospitality Business model consists of two distinct financial entities modeled independently but linked through management fees:

Properties P&L: Each property is modeled independently. Revenue from rooms, F&B, events, other. Expenses per USALI standards. Debt service for financed properties. Full balance sheet and cash flow statement. IRR and equity multiple at exit.

Management Company P&L: Revenue = management fees from all properties. Partner compensation (defined per-year array). Staff costs scale with property count (tiered). Fixed costs: office, insurance, professional services. Variable costs: travel, IT, marketing. Funding instrument for working capital.

Fund Flow: Guests pay Room + F&B + Event Revenue. Less: Operating Expenses, Debt Service = Free Cash Flow to Equity (FCFE). Management Fees (base + incentive) flow from properties to Management Company. Revenue = Management Fees from all properties. Less: Staff, Office, Travel, Partner Comp = Company Net Income.

The management company is initially funded through capital tranches that provide working capital until management fee revenue is sufficient to cover operating expenses. Funding instrument capital appears as cash inflows but is NOT recorded as revenue — it represents future equity, not income.`,
    source: "User Manual",
    category: "methodology",
  });

  chunks.push({
    title: "Business Rules & Constraints",
    content: `The system enforces 7 mandatory business rules that reflect real-world financial constraints. These rules cannot be overridden.

1. Management Company Funding Gate: Operations of the Management Company cannot begin before funding is received. The company requires Funding tranches to cover startup costs before management fee revenue begins flowing.

2. Property Activation Gate: A property cannot begin operating before it is purchased and funding is in place. Revenue and operating expenses only begin after the acquisition date and operations start date.

3. No Negative Cash Rule: Cash balances for each property, the Management Company, and the aggregated portfolio must never be negative.

4. Debt-Free at Exit: At exit, all properties must be debt-free. Outstanding loan balances are repaid from gross sale proceeds before calculating net proceeds to equity. Formula: Gross Sale Value = Final Year NOI / Exit Cap Rate. Less: Sales Commission. Less: Outstanding Debt Balance = Net Proceeds to Equity.

5. No Over-Distribution Rule: FCF distributions and refinancing proceeds returned to investors must not exceed available cash.

6. Income Statement: Interest Only (No Principal): The income statement must show only interest expense, never principal repayment. ANOI − Interest Expense − Depreciation − Income Tax = Net Income.

7. Capital Structure Presentation: All financial reports must present capital sources on separate lines: Equity (Cash) Infusion, Loan Proceeds, Refinancing Proceeds.`,
    source: "User Manual",
    category: "methodology",
  });

  chunks.push({
    title: "Capital Structure & Investor Returns",
    content: `The platform models realistic capital flows for both the management company and each property.

Property Capital Structure options:
- 100% Equity (Cash Purchase): No debt, fully funded by equity investors. May be refinanced later.
- Debt Financing + Equity: Loan based on LTV ratio. Monthly debt service.

How Equity Investors Are Repaid:
1. Free Cash Flow Distributions — annual cash flow after debt service and taxes
2. Refinancing Proceeds — cash-out from refi events
3. Exit / Sale Proceeds — net proceeds at property disposition`,
    source: "User Manual",
    category: "methodology",
  });

  chunks.push({
    title: "Property Lifecycle",
    content: `Properties follow a 4-phase lifecycle:

Acquisition: Purchased at month 0 or specified date. Closing costs (default 2%) capitalized into basis. Purchase price determines property basis for depreciation.

Operations: Monthly revenue and expenses based on occupancy ramp and ADR growth. Revenue = Room Count × ADR × Occupancy × Days in Month. Operating expenses follow USALI categories.

Refinancing: Cash-out refi possible at any point. New loan pays off old balance + closing costs. Excess cash distributed to equity holders.

Exit: Sold at end of holding period based on terminal cap rate. Exit Value = Final Year NOI ÷ Exit Cap Rate − Sales Commission − Debt Repayment.`,
    source: "User Manual",
    category: "methodology",
  });

  chunks.push({
    title: "Revenue Calculations",
    content: `Revenue is projected based on room revenue as the foundation, with ancillary streams as percentages.

Room Revenue = Room Count × ADR × Occupancy × Days in Month

Other Revenue Mix (as percentage of Room Revenue):
- F&B Revenue: percentage of Room Revenue (plus catering boost)
- Events Revenue: percentage of Room Revenue
- Other Revenue: percentage of Room Revenue

ADR Growth: Applied annually, compounds over the projection period. A 3.5% rate on a $250 ADR yields ~$259 in Year 2, ~$268 in Year 3.

Occupancy Ramp (step-up model): Occupancy does NOT grow smoothly — it increases in discrete jumps. Two settings control this:
- Occupancy Ramp (months): the interval between each step-up. Example: 9 months means occupancy jumps every 9 months.
- Occupancy Growth Step: the size of each jump in percentage points. Example: 5% means each step adds 5 percentage points.

So a property starting at 40% occupancy with a 9-month ramp and 5% step grows like this:
  Months 0–8: 40% → Months 9–17: 45% → Months 18–26: 50% → and so on until hitting the Stabilized Occupancy cap.

The total time to reach stabilized occupancy depends on the gap between starting and stabilized occupancy, divided by the growth step, multiplied by the ramp interval.

Catering Boost: Additional F&B revenue percentage from catering operations, applied as a multiplier to base F&B revenue.`,
    source: "User Manual",
    category: "methodology",
  });

  chunks.push({
    title: "Operating Expenses (USALI Standards)",
    content: `Operating expenses follow the Uniform System of Accounts for the Lodging Industry (USALI).

Departmental Expenses (as percentage of relevant revenue):
- Rooms Department: percentage of Room Revenue
- F&B Department: percentage of F&B Revenue
- Admin & General: percentage of Total Revenue
- Marketing: percentage of Total Revenue

Undistributed Expenses:
- Property Operations & Maintenance: percentage of Total Revenue
- Utilities: split between fixed and variable components
- Insurance: percentage of Total Revenue
- Property Taxes: percentage of Total Revenue
- IT Systems: percentage of Total Revenue

Fixed Cost Escalation: Fixed-portion expenses grow by the fixed cost escalation rate annually.
FF&E Reserve: percentage of Total Revenue set aside for furniture, fixtures, and equipment replacement.`,
    source: "User Manual",
    category: "methodology",
  });

  chunks.push({
    title: "GOP, AGOP, NOI, ANOI, and Financial Formulas",
    content: `Key financial formulas used in the model (USALI waterfall):

GOP (Gross Operating Profit) = Total Revenue − Total Operating Expenses
AGOP (Adjusted Gross Operating Profit) = GOP − Management Fees (base + incentive)
NOI (Net Operating Income) = AGOP − Fixed Charges (insurance + property taxes)
ANOI (Adjusted Net Operating Income) = NOI − FF&E Reserve

Management Fees:
- Base Management Fee: percentage of Total Revenue
- Incentive Management Fee: percentage of GOP (only if GOP > 0)

Income Statement flow:
ANOI − Interest Expense − Depreciation − Income Tax = Net Income

Free Cash Flow to Equity (FCFE):
ANOI − Debt Service (Principal + Interest) − Income Tax = FCFE

Depreciation: Straight-line over 27.5 years on depreciable basis (building portion of purchase price × (1 − land value percent) + building improvements).

Balance Sheet Identity: Assets = Liabilities + Equity
- Assets: Cash + Net Property (Purchase Price + Closing Costs − Accumulated Depreciation)
- Liabilities: Outstanding Debt Balance
- Equity: Contributed Capital + Retained Earnings`,
    source: "User Manual",
    category: "methodology",
  });

  chunks.push({
    title: "Investment Returns (IRR, NPV, Equity Multiple)",
    content: `Investment returns are calculated at the property level and consolidated portfolio level.

Exit Value = Final Year NOI ÷ Exit Cap Rate
Net Proceeds = Exit Value − Sales Commission − Outstanding Debt
Equity Multiple = Total Cash Returned ÷ Total Equity Invested

IRR (Internal Rate of Return): Calculated using the cash flow vector method. The cash flow vector includes: initial equity investment (negative), annual free cash flow distributions, refinancing proceeds, and final year exit proceeds.

NPV (Net Present Value): Present value of all future cash flows discounted at the required rate of return.

Cash-on-Cash Return = Annual FCFE ÷ Total Equity Invested

DSCR (Debt Service Coverage Ratio) = ANOI ÷ Annual Debt Service. DSCR > 1.0 means property generates enough income to cover debt payments.`,
    source: "User Manual",
    category: "methodology",
  });

  chunks.push({
    title: "Management Company Financials",
    content: `The Management Company earns revenue through management fees from all properties in the portfolio.

Revenue Sources:
- Base Management Fee: percentage of each property's Total Revenue
- Incentive Management Fee: percentage of each property's GOP (only if GOP > 0)

Expense Categories:
- Partner Compensation: defined per-year array for each of 3 partners
- Staff Costs: scale with property count in tiers (1-3, 4-6, 7-10 properties)
- Office Rent: fixed cost with annual escalation
- Insurance: fixed cost
- Professional Services: fixed cost (legal, accounting)
- Travel: variable cost per property
- IT: fixed cost with annual escalation
- Marketing: variable cost

Funding Instrument:
- Released in 2 tranches to support at least 12 months of operations
- Tranche 1: configured amount at model start
- Tranche 2: configured amount one year later
- Funding instrument is not revenue — it represents future equity or convertible investment
- The instrument type is configurable (e.g., SAFE, Convertible Note, Seed Round) via fundingSourceLabel
- Valuation cap and discount rate are optional and may not apply to all instrument types

Staff Scaling Tiers:
- 1-3 properties: 3 Partner FTEs + 2.5 Staff FTEs = 5.5 Total
- 4-6 properties: 3 Partner FTEs + 4.5 Staff FTEs = 7.5 Total
- 7-10 properties: 3 Partner FTEs + 7.0 Staff FTEs = 10.0 Total`,
    source: "User Manual",
    category: "methodology",
  });

  chunks.push({
    title: "Debt & Financing Calculations",
    content: `The model supports both acquisition financing and refinancing.

Acquisition Financing:
- Loan Amount = Purchase Price × LTV ratio
- Equity Required = Purchase Price + Closing Costs − Loan Amount
- Monthly Payment calculated using standard amortization formula: PMT = P × [r(1+r)^n] / [(1+r)^n − 1]
- Interest/Principal split: Interest = Outstanding Balance × Monthly Rate. Principal = PMT − Interest.
- Closing Costs: percentage of purchase price, capitalized into property basis.

Refinancing:
- New Loan Amount = Current Property Value × Refi LTV
- Current Property Value = Current Year NOI ÷ Current Cap Rate
- Cash Out = New Loan − Old Balance − Refi Closing Costs
- Refi Closing Costs: percentage of new loan amount
- New loan replaces old loan with new terms (rate, term)

Interest-Only Option: Some properties may use interest-only periods where monthly payment = interest only (no principal amortization).`,
    source: "User Manual",
    category: "methodology",
  });

  chunks.push({
    title: "Financial Verification & Audit System",
    content: `The platform includes a two-layer independent verification system to ensure GAAP compliance.

Layer 1 — Client-Side Financial Engine (client/src/lib/financialEngine.ts):
Performs all calculations in the browser using property and global assumptions.

Layer 2 — Server-Side Calculation Checker (server/calculationChecker.ts):
Independent implementation that recalculates all financial statements from raw assumptions.

Verification Process:
1. Both engines calculate independently from the same assumptions
2. Results are compared with tolerance thresholds
3. Any variance beyond tolerance triggers an audit finding
4. Audit opinion: UNQUALIFIED (all pass), QUALIFIED (minor issues), ADVERSE (critical failures)

The system runs 1,546 automated tests covering:
- Revenue calculations and projections
- Operating expense rates and escalation
- Debt service (interest/principal split)
- Depreciation schedules
- Cash flow statements (3-section GAAP method)
- Balance sheet identity (A = L + E)
- Investment return calculations (IRR, NPV, equity multiple)
- Management fee calculations
- Consolidated portfolio aggregation

GAAP Standards Applied:
- ASC 470: Debt Classification and Presentation
- ASC 230: Statement of Cash Flows (indirect method)
- ASC 606: Revenue Recognition
- ASC 360: Property, Plant, and Equipment (depreciation)
- USALI: Uniform System of Accounts for the Lodging Industry`,
    source: "User Manual",
    category: "methodology",
  });

  chunks.push({
    title: "GAAP/IRS Compliance Badges",
    content: `The property edit page displays blue ⓘ badges next to assumption fields that are governed by specific GAAP or IRS rules. Hover over any badge to see the applicable accounting standard.

GAAP/IRS Rules by Field:
- Purchase Price → ASC 805: Acquisition cost is fair value of consideration. Depreciable basis excludes the land allocation.
- Building Improvements → ASC 360 / IRS Pub 946: Capital improvements are capitalized and depreciated over 27.5 years straight-line. They are not expensed immediately.
- Land Value % → IRS Publication 946: Land is NOT depreciable. Only the building portion (Purchase Price × (1 − Land %) + Improvements) is depreciated. Higher land % = lower depreciation deduction.
- LTV → ASC 470: Debt must be separated into interest expense (Income Statement) and principal repayment (Balance Sheet/Financing Activity). Only interest reduces taxable income.
- Closing Costs → ASC 310-20: Loan origination costs are capitalized and amortized over the loan term. Not expensed immediately. Shown as a reduction of the loan liability on the balance sheet.
- Exit Cap Rate → ASC 360 / IRC §1250: The exit cap rate determines terminal value for impairment testing. Gain on sale = Sale Price − (Adjusted Basis − Accumulated Depreciation). Depreciation recapture is taxed at up to 25% under IRC §1250.
- Income Tax Rate → IRC §168: Taxable income = ANOI − Interest − Depreciation. The 27.5-year straight-line depreciation on the building portion creates a non-cash deduction that shelters cash flow from taxes.
- Events Revenue → ASC 606: Event revenue is recognized when the event occurs (point-in-time). Deposits are recorded as deferred revenue until the performance obligation is satisfied.
- F&B Revenue → ASC 606: F&B revenue is recognized at the point of sale. Bundled packages (e.g., room + breakfast) must allocate revenue to each performance obligation based on standalone selling prices.
- FF&E Reserve → USALI Standard: FF&E reserve is deducted below NOI to arrive at ANOI. Actual FF&E replacements are capitalized and depreciated over 5–7 years (IRS Class Life), not expensed. The reserve funds future CapEx.
- Insurance → GAAP Matching Principle: Insurance premiums are expensed as incurred over the policy period. Prepaid portions are recorded as current assets and amortized monthly. Not capitalizable into property basis.
- Property Taxes → IRC §164: Property taxes are fully deductible as an operating expense for income tax purposes. Based on assessed value, not market value. Reassessment may occur upon sale or significant improvement.
- Sale Commission → IRC §1001: Sales commission reduces the amount realized on disposition and is deducted from gross sale proceeds.`,
    source: "User Manual",
    category: "methodology",
  });

  chunks.push({
    title: "Research Badges & Market Calibration",
    content: `The property edit page displays Research Badges next to assumption fields that have AI-researched market data. A Research Badge is a small inline pill showing a label-value pair such as "(Industry: $240–$380)". Click any Research Badge to auto-fill the recommended value.

Research Badges appear on these fields after running AI market research for a property:
- Starting ADR: Market-dependent range from AI ADR analysis
- Starting Occupancy: Market-dependent range from AI occupancy analysis
- ADR Annual Growth: Generic range 3–5% per year
- Occupancy Growth Step: Generic range 4–6% per step
- Events Revenue Share: Generic range 20–35% of room revenue
- F&B Revenue Share: Generic range 15–25% of room revenue
- Other Revenue Share: Generic range 3–8% of room revenue
- Sale Commission: Generic range 4–6% of gross sale price
- Exit Cap Rate: Market-dependent from AI cap rate analysis

Research Badges are color-coded by source type: blue for live market API data (FRED, BLS), amber for industry benchmarks (HVS, CBRE, STR), and purple for AI-generated research.

AI research uses Claude Sonnet to analyze the property's market, competitive set, and location. The research covers ADR benchmarks, occupancy trends, cap rate analysis, revenue mix benchmarks, and disposition norms.

Important: Research Badges are advisory only. The financial engine never uses AI-generated values directly. Users must explicitly accept a recommendation by clicking the Research Badge. This ensures no LLM output enters financial calculations without human review.

Research can be run from the property detail page or the property edit page. Multiple research types are available: ADR analysis, occupancy analysis, cap rate analysis, operating cost benchmarks, and property value analysis.`,
    source: "Platform Guide",
    category: "guide",
  });

  return chunks;
}

function extractCheckerManualContent(): { title: string; content: string; source: string; category: string }[] {
  const chunks: { title: string; content: string; source: string; category: string }[] = [];

  chunks.push({
    title: "Checker Manual: Application Overview",
    content: `The Hospitality Business Group platform is a financial simulation portal for boutique hotel investment analysis. It models two entities: a Management Company that earns management fees, and individual Property SPVs (Special Purpose Vehicles) that hold and operate hotel assets.

The platform provides:
- Multi-year financial projections (income statement, cash flow, balance sheet)
- Property-level and portfolio-level analysis
- Scenario management for what-if analysis
- AI-powered market research calibration
- GAAP-compliant financial reporting
- Independent verification system with audit opinions

Navigation: Dashboard (consolidated view), Properties (individual SPVs), Management Company (fee revenue), Settings (assumptions), Scenarios (what-if), Help (manuals and guided tour).

User Roles: Admin (full access), Partner (management access), Checker (verification tools), Investor (limited view — Dashboard, Properties, Profile, Help only).`,
    source: "Checker Manual",
    category: "manual",
  });

  chunks.push({
    title: "Checker Manual: Cash Flow Streams",
    content: `Each property SPV has 6 distinct cash flow streams:

1. Operating Cash Flow: ANOI minus income tax. The primary recurring cash flow from hotel operations.

2. Debt Service: Monthly principal + interest payments on acquisition and refinancing loans.

3. Capital Expenditures: FF&E reserve allocations and any renovation spending.

4. Acquisition Cash Flow: Day-zero outflow for purchase price + closing costs, offset by loan proceeds.

5. Refinancing Cash Flow: Cash-out proceeds from refinancing events, net of closing costs and old loan payoff.

6. Disposition Cash Flow: Final-year proceeds from property sale. Gross sale value (final year NOI / exit cap rate) minus commission, minus outstanding debt, minus closing costs.

The Free Cash Flow to Equity (FCFE) aggregates these streams: FCFE = Operating CF − Debt Service − CapEx + Refi Proceeds + Disposition Proceeds.`,
    source: "Checker Manual",
    category: "manual",
  });

  chunks.push({
    title: "Checker Manual: Financial Statements",
    content: `Each property generates three GAAP-compliant financial statements:

Income Statement (USALI Waterfall):
- Revenue: Room Revenue + F&B + Events + Other
- Less: Operating Expenses (USALI departments)
- = Gross Operating Profit (GOP)
- Less: Management Fees (base + incentive)
- = Adjusted GOP (AGOP)
- Less: Fixed Charges (insurance + property taxes)
- = Net Operating Income (NOI)
- Less: FF&E Reserve
- = Adjusted NOI (ANOI)
- Less: Interest Expense (interest portion only, per Rule #6)
- Less: Depreciation (straight-line, 27.5 years)
- Less: Income Tax
- = Net Income

Cash Flow Statement (GAAP Indirect Method, ASC 230):
- Section 1: Operating Activities (Net Income + Depreciation adjustments)
- Section 2: Investing Activities (Property acquisitions, dispositions)
- Section 3: Financing Activities (Loan proceeds, principal repayments, equity, refinancing)

Balance Sheet:
- Assets = Cash + Net Property (cost basis − accumulated depreciation)
- Liabilities = Outstanding loan balance
- Equity = Contributed capital + Retained earnings
- Must satisfy: Assets = Liabilities + Equity`,
    source: "Checker Manual",
    category: "manual",
  });

  chunks.push({
    title: "Checker Manual: Testing Methodology",
    content: `The verification system uses a 7-phase testing workflow:

Phase 1: Input Validation — Verify all assumptions are within valid ranges.
Phase 2: Revenue Projection — Confirm room revenue, ancillary revenue calculations.
Phase 3: Expense Calculation — Validate USALI expense rates and escalation.
Phase 4: Financial Statement Generation — Check IS, CF, BS for each property.
Phase 5: Cross-Statement Reconciliation — Verify CF ties to BS cash changes, IS net income flows correctly.
Phase 6: Portfolio Consolidation — Confirm aggregated totals match sum of individual properties.
Phase 7: Return Calculations — Validate IRR, NPV, equity multiple, cash-on-cash.

The Checker role has access to: Full Data Export (PDF with all assumptions and financials), Manual Export (checker manual as PDF), Verification Runner (triggers server-side recalculation), and the AI Verification Review (LLM analysis of audit findings).`,
    source: "Checker Manual",
    category: "manual",
  });

  return chunks;
}

function extractPlatformGuide(): { title: string; content: string; source: string; category: string }[] {
  const chunks: { title: string; content: string; source: string; category: string }[] = [];

  chunks.push({
    title: "Platform Navigation Guide",
    content: `The platform has the following main pages and features:

Dashboard: Consolidated portfolio overview. Shows KPI cards (IRR, equity multiple, cash-on-cash return, total exit value), consolidated income statement with full USALI waterfall (GOP → AGOP → NOI → ANOI), operational metrics (ADR Effective, Occupancy, RevPAR), consolidated cash flow statement (CFO, CFI, CFF), balance sheet, and investment analysis charts. Every calculated subtotal has a clickable "Formula" row that reveals the exact derivation. All values are computed by the financial engine — never hardcoded.

Properties: List of hotel SPVs in the portfolio. Each property has its own detail page with financial projections, and an edit page where you can change property-specific assumptions (ADR, occupancy, room count, financing terms, expense rates).

Property Detail: Shows per-property income statement with USALI waterfall, cash flow statement (CFO, CFI, CFF, FCF, FCFE, DSCR, cash-on-cash return), balance sheet (assets, liabilities, equity, ratios), and investment returns across all projection years. Includes formula transparency accordions for every derived value — click any "Formula" chevron to see how a number is calculated.

Management Company: The management entity's P&L showing fee revenue (base + incentive fees from each property), operating expenses (partner comp, staff, office, travel), funding instrument status, and net income. Capital Raise analysis is available under the Simulation section.

Settings (Systemwide Assumptions): Four tabs:
- Portfolio tab: Asset definition (property type, tier, room count range, ADR range), disposition defaults, acquisition and refinancing defaults for new properties.
- Macro tab: Fiscal year start month, inflation rate, fixed cost escalation.
- Other tab: Calculation transparency toggles (show/hide formula details in reports), AI research model selection.
- Industry Research tab: AI-powered industry research with configurable focus areas.

Scenarios: Save, load, and compare different assumption sets. Useful for stress testing and sensitivity analysis.

Help: User Manual (17 chapters — role-filtered so users only see sections relevant to their access level), Checker Manual (21 sections, visible to checkers and admins), and Interactive Guided Tour.

Administration (Admin only): Users, Companies, Activity, Verification, User Groups, Logos, Branding, Themes, Navigation, Database, Marcela (AI assistant settings).

Role-based access: Investors see read-only dashboards and property details. Management users can edit properties, assumptions, scenarios, and run analysis. Checkers can access verification tools. Admins have full system access including user management and AI configuration.`,
    source: "Platform Guide",
    category: "guide",
  });

  chunks.push({
    title: "How to Add a Property",
    content: `To add a new property to the portfolio:

1. Navigate to Properties page
2. Click "Add Property" button
3. Fill in required fields:
   - Property Name: descriptive name for the hotel
   - Room Count: number of rooms (must be within asset definition range)
   - Starting ADR: average daily rate at acquisition
   - Purchase Price: acquisition cost
   - Acquisition Date: month and year of purchase
   - Location: city and state/country

4. Optional fields:
   - Financing: LTV ratio, interest rate, loan term (or select cash purchase)
   - Revenue mix: F&B, events, other revenue percentages
   - Expense rates: override system defaults per USALI category
   - Occupancy ramp: starting occupancy, stabilized occupancy, ramp interval (months between step-ups), and growth step size
   - Exit assumptions: holding period, exit cap rate, commission rate

5. Click Save to add the property. The financial engine immediately recalculates the entire portfolio.

Properties can also have AI-generated images and AI-powered market research to calibrate assumptions against real market data.`,
    source: "Platform Guide",
    category: "guide",
  });

  chunks.push({
    title: "How to Use Scenarios",
    content: `Scenarios allow you to save and compare different assumption sets:

Saving a Scenario:
1. Go to Scenarios page
2. Click "Save Current" button
3. Enter a name (e.g., "Base Case", "Recession", "High Growth")
4. The scenario saves a snapshot of all current assumptions

Loading a Scenario:
1. Select a saved scenario from the list
2. Click "Load" to restore those assumptions
3. All financial projections recalculate immediately

Comparing Scenarios:
- Switch between scenarios to see how different assumptions impact returns
- Use the Dashboard to compare KPIs across scenarios
- Key metrics to compare: IRR, equity multiple, cash-on-cash, total exit value

Best Practices:
- Always save a "Base Case" before making changes
- Create targeted scenarios: "High ADR", "Low Occupancy", "Rising Rates"
- Use scenarios for investor presentations to show best/worst/expected cases`,
    source: "Platform Guide",
    category: "guide",
  });

  chunks.push({
    title: "How to Use AI Market Research",
    content: `The platform includes AI-powered market research at two levels:

Property-Level Research:
1. Navigate to a property's detail page
2. Click "Run Market Research" or go to the Research tab
3. AI analyzes the property's location, type, and competitive set
4. Results include: market ADR benchmarks, occupancy trends, cap rate analysis, competitive landscape
5. Use findings to calibrate your property assumptions

Industry-Level Research:
1. Go to Settings > Industry Research tab
2. Configure focus areas: market trends, events, benchmarks, cap rates, debt market, emerging trends, supply pipeline, labor, technology, sustainability
3. Set target regions and time horizon (1/3/5/10 years)
4. Add custom questions
5. Click "Generate Research" — AI uses your portfolio's actual settings as context

Company-Level Research:
1. Go to Management Company > Research tab
2. AI benchmarks your management fee structure, staffing costs, and operational efficiency against industry standards

All research reports are saved and available to Marcela for context in future conversations.`,
    source: "Platform Guide",
    category: "guide",
  });

  return chunks;
}

async function loadAttachedAssets(): Promise<{ title: string; content: string; source: string; category: string }[]> {
  const assetsDir = path.resolve("attached_assets");
  const chunks: { title: string; content: string; source: string; category: string }[] = [];

  if (!fs.existsSync(assetsDir)) return chunks;

  const files = fs.readdirSync(assetsDir).filter(f => f.endsWith(".md") || f.endsWith(".txt"));

  for (const file of files) {
    if (file.includes("Design_Style_Guide") || file.includes("Graphical")) continue;

    try {
      const content = fs.readFileSync(path.join(assetsDir, file), "utf-8");
      if (content.length < 100) continue;

      let title = file
        .replace(/_\d+\.(?:md|txt)$/, "")
        .replace(/[-_]/g, " ")
        .replace(/Pasted\s+/i, "")
        .trim();

      if (title.length > 80) title = title.slice(0, 80);

      const category = file.includes("Business_Model") || file.includes("Market_Research")
        ? "specification"
        : "reference";

      const fileChunks = splitIntoChunks(content, title, `attached_assets/${file}`, category);
      chunks.push(...fileChunks);
    } catch {
      continue;
    }
  }

  return chunks;
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await getOpenAIClient().embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.slice(0, 8000),
  });
  return response.data[0].embedding;
}

async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const batchSize = 20;
  const results: number[][] = [];
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize).map(t => t.slice(0, 8000));
    const response = await getOpenAIClient().embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch,
    });
    results.push(...response.data.map((d: { embedding: number[] }) => d.embedding));
  }
  return results;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

let knowledgeCache: { title: string; content: string; source: string; category: string; embedding: number[] }[] = [];
let indexedAt: Date | null = null;
let indexingPromise: Promise<{ chunksIndexed: number; timeMs: number }> | null = null;

export async function indexKnowledgeBase(): Promise<{ chunksIndexed: number; timeMs: number }> {
  if (indexingPromise) {
    return indexingPromise;
  }

  indexingPromise = (async () => {
    const start = Date.now();
    logger.info("Starting indexing...", "knowledge-base");

    const allChunks: { title: string; content: string; source: string; category: string }[] = [];

    allChunks.push(...extractMethodologyContent());
    allChunks.push(...extractCheckerManualContent());
    allChunks.push(...extractPlatformGuide());

    const assetChunks = await loadAttachedAssets();
    allChunks.push(...assetChunks);

    logger.info(`${allChunks.length} chunks extracted, generating embeddings...`, "knowledge-base");

    const texts = allChunks.map(c => `${c.title}\n\n${c.content}`);
    const embeddings = await generateEmbeddings(texts);

    knowledgeCache = allChunks.map((chunk, i) => ({
      ...chunk,
      embedding: embeddings[i],
    }));

    indexedAt = new Date();
    const timeMs = Date.now() - start;
    logger.info(`Indexed ${knowledgeCache.length} chunks in ${timeMs}ms`, "knowledge-base");

    return { chunksIndexed: knowledgeCache.length, timeMs };
  })().finally(() => {
    indexingPromise = null;
  });

  return indexingPromise;
}

export async function retrieveRelevantChunks(query: string, topK: number = TOP_K): Promise<{ title: string; content: string; source: string; category: string; score: number }[]> {
  if (knowledgeCache.length === 0) {
    if (indexingPromise) {
      await indexingPromise;
    } else {
      indexKnowledgeBase().catch(e => logger.error(`Background indexing failed: ${e instanceof Error ? e.message : String(e)}`, "knowledge-base"));
      return [];
    }
  }

  if (knowledgeCache.length === 0) return [];

  const queryEmbedding = await generateEmbedding(query);

  const scored = knowledgeCache.map(chunk => ({
    title: chunk.title,
    content: chunk.content,
    source: chunk.source,
    category: chunk.category,
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  scored.sort((a, b) => b.score - a.score);
  const KB_MIN_CONFIDENCE = 0.50;
  return scored.slice(0, topK).filter(c => c.score > KB_MIN_CONFIDENCE);
}

export function buildRAGContext(chunks: { title: string; content: string; source: string; score: number }[]): string {
  if (chunks.length === 0) return "";

  let totalChars = 0;
  const parts = ["\n\n## Relevant Knowledge Base Context"];
  for (const chunk of chunks) {
    const section = `\n### ${chunk.title} (${chunk.source})\n${chunk.content}`;
    if (totalChars + section.length > MAX_RAG_CONTEXT_CHARS) break;
    parts.push(section);
    totalChars += section.length;
  }
  return parts.length > 1 ? parts.join("\n") : "";
}

export function getKnowledgeBaseStatus(): { indexed: boolean; chunkCount: number; indexedAt: string | null } {
  return {
    indexed: knowledgeCache.length > 0,
    chunkCount: knowledgeCache.length,
    indexedAt: indexedAt?.toISOString() || null,
  };
}

export function log(message: string, source = "kb") {
  logger.info(message, source);
}
