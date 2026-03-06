import { createKBDocumentFromText, deleteKBDocument, getConvaiAgent, updateConvaiAgent } from "./integrations/elevenlabs";
import { storage } from "./storage";

function buildKnowledgeDocument(): string {
  const sections: string[] = [];

  sections.push(`# Hospitality Business Group — Marcela Knowledge Base

## About the Company
Hospitality Business Group (HBG) is a boutique hotel management company that operates a portfolio of high-end hospitality assets across North America and Latin America. The company uses a dual-entity financial model:

- **Property Portfolio (SPVs):** Each hotel is held in a Special Purpose Vehicle to isolate liability. Properties generate revenue from Rooms, Food & Beverage, and Events.
- **Management Company (HBG):** Manages properties and earns Base Management Fees (percentage of Gross Revenue) and Incentive Management Fees (percentage of Gross Operating Profit).
- **Funding:** The management company's startup operations are funded via SAFE (Simple Agreement for Future Equity) tranches that provide working capital until management fee revenue covers operating expenses.

## About This Portal
This is a financial simulation portal for boutique hotel investment analysis. It provides:
- Multi-year GAAP-compliant financial projections (30-year / 360-month horizon)
- Property-level and portfolio-level income statements, cash flow statements, and balance sheets
- Scenario management for what-if analysis
- AI-powered market research for calibrating property assumptions
- An independent verification system with audit opinions (Unqualified, Qualified, Adverse)
- 1,546 automated tests ensuring mathematical accuracy

The portal is the "Single Source of Truth" for the company's financial projections.`);

  sections.push(`## User Roles
- **Admin (Ricardo Cidale):** Full system access including user management, branding, themes, verification, and AI assistant configuration.
- **Partner:** Management team members who can view and edit property assumptions and financial models.
- **Checker:** Independent auditor with read-only access plus verification tools, full data export, and audit review capabilities.
- **Investor:** Limited view — can see Dashboard, Property reports, Profile, and Help only.`);

  sections.push(`## Portal Pages & Navigation

### Dashboard
Consolidated portfolio overview with KPI cards (IRR, equity multiple, cash-on-cash return, total exit value), income statement, cash flow statement, balance sheet, and investment analysis charts. All values are computed by the financial engine — never hardcoded.

### Portfolio
Map and list view of all hotel properties in the portfolio.

### Property Detail
Per-property financial projections including income statement, cash flow, balance sheet, and investment returns across all projection years. Includes charts and formula transparency.

### Property Editor
Edit property-specific assumptions: ADR, occupancy, room count, financing terms, expense rates, revenue mix, exit assumptions. Changes trigger a full portfolio recalculation.

### Company (Management Company)
The management entity's P&L showing fee revenue (base + incentive from each property), operating expenses (partner compensation, staff, office, travel), SAFE funding status, and net income.

### Company Assumptions
System-wide financial parameters: discount rate, inflation rate, tax rates, hold period, management fee rates, SAFE funding amounts.

### Analysis
Financial analysis page with sensitivity analysis, financing details, property comparisons, and executive summary.

### Scenarios
Save, load, and compare different assumption sets. Useful for stress testing and investor presentations showing best/worst/expected cases.

### Property Finder
Search for new hotel acquisition opportunities using AI-powered market analysis.

### Help
Three sections: User Manual (16 chapters), Checker Manual (21 sections), and Interactive Guided Tour.

### Settings
User preferences and display settings.

### Admin (Admin only)
11 tabs: Users, Companies, Activity, Verification, User Groups, Logos, Branding, Themes, Navigation, Database, Marcela (AI assistant settings).`);

  sections.push(`## Business Model — Financial Engine

### Property Lifecycle
Properties follow a 4-phase lifecycle:
1. **Acquisition:** Purchased at specified date. Closing costs (default 2%) capitalized into basis.
2. **Operations:** Monthly revenue and expenses based on occupancy ramp and ADR growth.
3. **Refinancing:** Cash-out refi possible at any point. New loan pays off old balance + closing costs.
4. **Exit/Disposition:** Sold at end of holding period. Exit Value = Final Year NOI ÷ Exit Cap Rate − Sales Commission − Debt Repayment.

### Revenue Calculations
- Room Revenue = Room Count × ADR × Occupancy × Days in Month
- F&B Revenue = percentage of Room Revenue (plus catering boost)
- Events Revenue = percentage of Room Revenue
- Other Revenue = percentage of Room Revenue
- ADR Growth: Applied annually, compounds over the projection period
- Occupancy Ramp (step-up model): Occupancy increases in discrete jumps at set intervals until hitting stabilized occupancy cap

### Operating Expenses (USALI Standards)
Expenses follow the Uniform System of Accounts for the Lodging Industry:
- Departmental: Rooms, F&B, Admin & General, Marketing (as % of relevant revenue)
- Undistributed: Property Ops & Maintenance, Utilities, Insurance, Property Taxes, IT Systems
- FF&E Reserve: percentage of Total Revenue set aside for furniture/fixtures/equipment

### Key Financial Formulas
- **GOP** (Gross Operating Profit) = Total Revenue − Total Operating Expenses
- **NOI** (Net Operating Income) = GOP − Management Fees − FF&E Reserve
- **Net Income** = NOI − Interest Expense − Depreciation − Income Tax
- **FCFE** (Free Cash Flow to Equity) = NOI − Debt Service (Principal + Interest) − Income Tax
- **Depreciation:** Straight-line over 27.5 years on depreciable basis (building portion × (1 − land value %) + improvements)
- **Balance Sheet Identity:** Assets = Liabilities + Equity

### Investment Returns
- **Exit Value** = Final Year NOI ÷ Exit Cap Rate
- **Equity Multiple** = Total Cash Returned ÷ Total Equity Invested
- **IRR** (Internal Rate of Return): Calculated using cash flow vector method
- **NPV** (Net Present Value): Present value of future cash flows discounted at required rate of return
- **Cash-on-Cash Return** = Annual FCFE ÷ Total Equity Invested
- **DSCR** (Debt Service Coverage Ratio) = NOI ÷ Annual Debt Service`);

  sections.push(`## Capital Structure & Financing

### Property Capital Structure Options
- **100% Equity (Cash Purchase):** No debt, fully funded by equity investors. May be refinanced later.
- **Debt Financing + Equity:** Loan based on LTV ratio with monthly debt service.

### How Equity Investors Are Repaid
1. Free Cash Flow Distributions — annual cash flow after debt service and taxes
2. Refinancing Proceeds — cash-out from refi events
3. Exit/Sale Proceeds — net proceeds at property disposition

### Debt Calculations
- Loan Amount = Purchase Price × LTV ratio
- Equity Required = Purchase Price + Closing Costs − Loan Amount
- Monthly Payment uses standard amortization formula
- Interest-only periods available where monthly payment = interest only

### Refinancing
- New Loan Amount = Current Property Value × Refi LTV
- Cash Out = New Loan − Old Balance − Refi Closing Costs
- New loan replaces old loan with new terms`);

  sections.push(`## Management Company Financials

### Revenue Sources
- Base Management Fee: percentage of each property's Total Revenue
- Incentive Management Fee: percentage of each property's GOP (only if GOP > 0)

### Expense Categories
- Partner Compensation: defined per-year array for each of 3 partners
- Staff Costs: scale with property count in tiers (1-3, 4-6, 7-10 properties)
- Office Rent, Insurance, Professional Services, Travel, IT, Marketing

### SAFE Funding
- Released in 2 tranches to support at least 12 months of operations
- Tranche 1: $225,000 at model start; Tranche 2: $225,000 one year later
- SAFE is NOT revenue — it represents future equity, not income

### Staff Scaling Tiers
- 1-3 properties: 3 Partners + 2.5 Staff = 5.5 FTEs
- 4-6 properties: 3 Partners + 4.5 Staff = 7.5 FTEs
- 7-10 properties: 3 Partners + 7.0 Staff = 10.0 FTEs`);

  sections.push(`## 7 Mandatory Business Rules
These rules reflect real-world financial constraints and cannot be overridden:

1. **Management Company Funding Gate:** Operations cannot begin before funding is received.
2. **Property Activation Gate:** A property cannot operate before purchase and funding are in place.
3. **No Negative Cash Rule:** Cash balances must never be negative for any entity.
4. **Debt-Free at Exit:** All outstanding debt is repaid from gross sale proceeds before calculating net proceeds to equity.
5. **No Over-Distribution Rule:** Distributions must not exceed available cash.
6. **Income Statement Interest Only:** The income statement shows only interest expense, never principal repayment.
7. **Capital Structure Presentation:** Financial reports present equity infusion, loan proceeds, and refinancing proceeds on separate lines.`);

  sections.push(`## GAAP & IRS Compliance
The platform follows these accounting standards:
- **ASC 470:** Debt Classification and Presentation
- **ASC 230:** Statement of Cash Flows (indirect method)
- **ASC 606:** Revenue Recognition
- **ASC 360:** Property, Plant, and Equipment (depreciation)
- **ASC 805:** Business Combinations (acquisition cost)
- **IRS Publication 946:** Depreciation rules — 27.5-year straight-line on buildings; land is NOT depreciable
- **IRC §1250:** Depreciation recapture on sale (taxed up to 25%)
- **IRC §168:** Tax depreciation creating non-cash deduction that shelters cash flow
- **USALI:** Uniform System of Accounts for the Lodging Industry`);

  sections.push(`## Verification & Audit System
The platform includes a two-layer independent verification system:

**Layer 1 — Client-Side Financial Engine:** Performs all calculations in the browser using property and global assumptions.

**Layer 2 — Server-Side Calculation Checker:** Independent implementation that recalculates all financial statements from raw assumptions.

Both engines calculate independently from the same assumptions. Results are compared with tolerance thresholds. Any variance beyond tolerance triggers an audit finding.

**Audit Opinions:**
- **Unqualified:** All checks pass — highest confidence level
- **Qualified:** Minor issues found but financials are substantially correct
- **Adverse:** Critical failures — financials should not be relied upon

The system runs 1,546 automated tests covering revenue, expenses, debt service, depreciation, cash flows, balance sheets, returns, management fees, and portfolio consolidation.`);

  sections.push(`## Cash Flow Streams (per Property)
Each property SPV has 6 distinct cash flow streams:
1. **Operating Cash Flow:** NOI minus income tax
2. **Debt Service:** Monthly principal + interest payments
3. **Capital Expenditures:** FF&E reserve allocations
4. **Acquisition Cash Flow:** Day-zero outflow for purchase price + closing costs, offset by loan proceeds
5. **Refinancing Cash Flow:** Cash-out proceeds from refi events
6. **Disposition Cash Flow:** Final-year sale proceeds minus commission and debt

FCFE = Operating CF − Debt Service − CapEx + Refi Proceeds + Disposition Proceeds`);

  sections.push(`## Financial Statements (per Property)

### Income Statement
Revenue (Room + F&B + Events + Other) − Operating Expenses = GOP − Management Fees − FF&E Reserve = NOI − Interest Expense − Depreciation − Income Tax = Net Income

### Cash Flow Statement (GAAP Indirect Method, ASC 230)
- Section 1: Operating Activities (Net Income + Depreciation adjustments)
- Section 2: Investing Activities (Property acquisitions, dispositions)
- Section 3: Financing Activities (Loan proceeds, principal repayments, equity, refinancing)

### Balance Sheet
- Assets = Cash + Net Property (cost basis − accumulated depreciation)
- Liabilities = Outstanding loan balance
- Equity = Contributed capital + Retained earnings
- Must satisfy: Assets = Liabilities + Equity`);

  sections.push(`## AI Market Research
The platform includes AI-powered market research at multiple levels:

### Property-Level Research
- ADR benchmarks and market analysis
- Occupancy trends
- Cap rate analysis
- Competitive landscape assessment
- Revenue mix benchmarks

### Industry-Level Research
Configurable focus areas: market trends, events, benchmarks, cap rates, debt market, emerging trends, supply pipeline, labor, technology, sustainability.

### Important
Research values are advisory only. The financial engine never uses AI-generated values directly. Users must explicitly accept a recommendation. This ensures no LLM output enters financial calculations without human review.`);

  sections.push(`## How-To Guides

### Adding a Property
1. Navigate to Properties page
2. Click "Add Property"
3. Fill in: Property Name, Room Count, Starting ADR, Purchase Price, Acquisition Date, Location
4. Optionally configure: Financing (LTV, rate, term), Revenue mix, Expense rates, Occupancy ramp, Exit assumptions
5. Click Save — the entire portfolio recalculates immediately

### Using Scenarios
1. Go to Scenarios page → "Save Current" to snapshot current assumptions
2. Name it (e.g., "Base Case", "Recession", "High Growth")
3. Load any scenario to restore those assumptions
4. Compare KPIs across scenarios for investor presentations

### Running Market Research
1. Go to a property's detail page
2. Click "Run Market Research" or go to the Research tab
3. Review AI analysis and optionally accept recommended values by clicking research badges`);

  sections.push(`## About Me (Marcela)
I am Marcela, the AI assistant for the Hospitality Business Group portal. I can help you with:

- **Navigation:** I can take you to any page in the portal — just ask to see the dashboard, a property, the analysis page, scenarios, or any other section.
- **Property Information:** I can look up details about any property in the portfolio including financial metrics, occupancy, ADR, and investment returns.
- **Portfolio Overview:** I can provide aggregated portfolio metrics and summaries.
- **Financial Concepts:** I can explain how the financial model works, what specific metrics mean, and how calculations are performed.
- **Platform Guidance:** I can help you find features, explain how to use the portal, and start a guided tour.
- **Scenario Analysis:** I can show you saved scenarios and explain how to create what-if analyses.

I support English, Portuguese, and Spanish. I will automatically detect and respond in your language.

Important: I provide information and guidance. All financial calculations in this portal are performed by the deterministic financial engine — I never calculate financial numbers myself. When I quote financial data, I retrieve it directly from the calculation engine's output.`);

  return sections.join("\n\n---\n\n");
}

export async function uploadKnowledgeBase(): Promise<{ success: boolean; documentId?: string; error?: string }> {
  try {
    const ga = await storage.getGlobalAssumptions();
    const agentId = (ga as any)?.marcelaAgentId;
    if (!agentId) {
      return { success: false, error: "No Marcela agent ID configured" };
    }

    const documentText = buildKnowledgeDocument();
    console.log(`[marcela-kb] Compiled knowledge base: ${documentText.length} characters`);

    const existingAgent = await getConvaiAgent(agentId);
    const existingKB = (existingAgent as any)?.conversation_config?.agent?.prompt?.knowledge_base;
    if (Array.isArray(existingKB) && existingKB.length > 0) {
      for (const doc of existingKB) {
        if (doc.id && doc.name?.startsWith("HBG-Marcela-KB")) {
          try {
            await deleteKBDocument(doc.id);
            console.log(`[marcela-kb] Deleted old KB document: ${doc.id}`);
          } catch {
            console.log(`[marcela-kb] Could not delete old doc ${doc.id}, continuing...`);
          }
        }
      }
    }

    const doc = await createKBDocumentFromText("HBG-Marcela-KB", documentText);
    console.log(`[marcela-kb] Created KB document: ${doc.id}`);

    await updateConvaiAgent(agentId, {
      conversation_config: {
        agent: {
          prompt: {
            knowledge_base: [
              { type: "file", id: doc.id, name: "HBG-Marcela-KB" },
            ],
          },
        },
      },
    });

    console.log(`[marcela-kb] Attached KB document to agent ${agentId}`);
    return { success: true, documentId: doc.id };
  } catch (error: any) {
    console.error("[marcela-kb] Error uploading knowledge base:", error.message);
    return { success: false, error: error.message };
  }
}

export function getKnowledgeDocumentPreview(): { sections: number; characters: number; preview: string } {
  const doc = buildKnowledgeDocument();
  const sectionCount = doc.split("---").length;
  return {
    sections: sectionCount,
    characters: doc.length,
    preview: doc.slice(0, 500) + "...",
  };
}
