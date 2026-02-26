import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const EMBEDDING_MODEL = "text-embedding-3-small";
const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;
const TOP_K = 8;
const MAX_RAG_CONTEXT_CHARS = 4000;

function splitIntoChunks(text: string, title: string, source: string, category: string): { title: string; content: string; source: string; category: string }[] {
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

6. Income Statement: Interest Only (No Principal): The income statement must show only interest expense, never principal repayment. NOI - Interest Expense - Depreciation - Income Tax = Net Income.

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

ADR Growth: Applied annually, compounds over projection period.
Occupancy Ramp: Starts at initial occupancy, ramps to stabilized occupancy over specified months.
Catering Boost: Additional F&B revenue percentage that phases in over operating years.`,
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
    title: "GOP, NOI, and Financial Formulas",
    content: `Key financial formulas used in the model:

GOP (Gross Operating Profit) = Total Revenue − Total Operating Expenses
NOI (Net Operating Income) = GOP − Management Fees − FF&E Reserve

Management Fees:
- Base Management Fee: percentage of Total Revenue
- Incentive Management Fee: percentage of GOP (only if GOP > 0)

Income Statement flow:
NOI − Interest Expense − Depreciation − Income Tax = Net Income

Free Cash Flow to Equity (FCFE):
NOI − Debt Service (Principal + Interest) − Income Tax = FCFE

Depreciation: Straight-line over 39 years on depreciable basis (property value minus land value, typically 80% of purchase price).

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

DSCR (Debt Service Coverage Ratio) = NOI ÷ Annual Debt Service. DSCR > 1.0 means property generates enough income to cover debt payments.`,
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

SAFE Funding:
- Released in 2 tranches to support at least 12 months of operations
- Tranche 1: $225,000 at model start
- Tranche 2: $225,000 one year later
- SAFE is not revenue — it's future equity

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

The system runs 1,529 automated tests covering:
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

1. Operating Cash Flow: NOI minus income tax. The primary recurring cash flow from hotel operations.

2. Debt Service: Monthly principal + interest payments on acquisition and refinancing loans.

3. Capital Expenditures: FF&E reserve allocations and any renovation spending.

4. Acquisition Cash Flow: Day-zero outflow for purchase price + closing costs, offset by loan proceeds.

5. Refinancing Cash Flow: Cash-out proceeds from refinancing events, net of closing costs and old loan payoff.

6. Disposition Cash Flow: Final-year proceeds from property sale. Gross sale value (NOI / exit cap rate) minus commission, minus outstanding debt, minus closing costs.

The Free Cash Flow to Equity (FCFE) aggregates these streams: FCFE = Operating CF − Debt Service − CapEx + Refi Proceeds + Disposition Proceeds.`,
    source: "Checker Manual",
    category: "manual",
  });

  chunks.push({
    title: "Checker Manual: Financial Statements",
    content: `Each property generates three GAAP-compliant financial statements:

Income Statement:
- Revenue: Room Revenue + F&B + Events + Other
- Less: Operating Expenses (USALI departments)
- = Gross Operating Profit (GOP)
- Less: Management Fees + FF&E Reserve
- = Net Operating Income (NOI)
- Less: Interest Expense (interest portion only, per Rule #6)
- Less: Depreciation (straight-line, 39 years)
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

Dashboard: Consolidated portfolio overview. Shows KPI cards (IRR, equity multiple, cash-on-cash return, total exit value), income statement, cash flow statement, balance sheet, and investment analysis charts. All values are computed by the financial engine — never hardcoded.

Properties: List of hotel SPVs in the portfolio. Each property has its own detail page with financial projections, and an edit page where you can change property-specific assumptions (ADR, occupancy, room count, financing terms, expense rates).

Property Detail: Shows per-property income statement, cash flow, balance sheet, and investment returns across all projection years. Includes charts and formula transparency accordions.

Management Company: The management entity's P&L showing fee revenue (base + incentive fees from each property), operating expenses (partner comp, staff, office, travel), SAFE funding status, and net income.

Settings (Systemwide Assumptions): Four tabs:
- Portfolio tab: Asset definition (property type, tier, room count range, ADR range), disposition defaults, acquisition and refinancing defaults for new properties.
- Macro tab: Fiscal year start month, inflation rate, fixed cost escalation.
- Other tab: Calculation transparency toggles (show/hide formula details in reports), AI research model selection.
- Industry Research tab: AI-powered industry research with configurable focus areas.

Scenarios: Save, load, and compare different assumption sets. Useful for stress testing and sensitivity analysis.

Help: User Manual (16 chapters), Checker Manual (21 sections), and Interactive Guided Tour.

Administration (Admin only): Users, Companies, Activity, Verification, User Groups, Logos, Branding, Themes, Navigation, Database, Marcela (AI assistant settings).`,
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
   - Occupancy ramp: initial occupancy and ramp-up period
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
  const response = await openai.embeddings.create({
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
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch,
    });
    results.push(...response.data.map(d => d.embedding));
  }
  return results;
}

function cosineSimilarity(a: number[], b: number[]): number {
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
    console.log("[Knowledge Base] Starting indexing...");

    const allChunks: { title: string; content: string; source: string; category: string }[] = [];

    allChunks.push(...extractMethodologyContent());
    allChunks.push(...extractCheckerManualContent());
    allChunks.push(...extractPlatformGuide());

    const assetChunks = await loadAttachedAssets();
    allChunks.push(...assetChunks);

    console.log(`[Knowledge Base] ${allChunks.length} chunks extracted, generating embeddings...`);

    const texts = allChunks.map(c => `${c.title}\n\n${c.content}`);
    const embeddings = await generateEmbeddings(texts);

    knowledgeCache = allChunks.map((chunk, i) => ({
      ...chunk,
      embedding: embeddings[i],
    }));

    indexedAt = new Date();
    const timeMs = Date.now() - start;
    console.log(`[Knowledge Base] Indexed ${knowledgeCache.length} chunks in ${timeMs}ms`);

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
      indexKnowledgeBase().catch(e => console.error("[Knowledge Base] Background indexing failed:", e));
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
  return scored.slice(0, topK).filter(c => c.score > 0.25);
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
