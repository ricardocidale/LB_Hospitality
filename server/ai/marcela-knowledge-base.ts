import { createKBDocumentFromText, deleteKBDocument, getConvaiAgent, updateConvaiAgent } from "../integrations/elevenlabs";
import { storage } from "../storage";
import { logger } from "../logger";

function pct(v: number | null | undefined): string {
  if (v == null) return "N/A";
  return `${(v * 100).toFixed(1)}%`;
}
function usd(v: number | null | undefined): string {
  if (v == null) return "N/A";
  return `$${Number(v).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}
function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long" });
}

async function buildKnowledgeDocument(): Promise<string> {
  const sections: string[] = [];

  sections.push(`Hospitality Business Group — Knowledge Base for Marcela

About the Company

Hospitality Business Group, or HBG, is a boutique hotel management company. We operate a growing portfolio of high-end hospitality properties across North America and Latin America.

The business works on a dual-entity model. On one side you have the individual hotel properties, each held in its own SPV (Special Purpose Vehicle) to keep the finances and liability separate. On the other side you have the Management Company, which is HBG itself. The management company earns its revenue by charging management fees to the properties it manages.

There are two types of management fees:
- A base fee, which is a percentage of each property's total revenue
- An incentive fee, which is a percentage of each property's Gross Operating Profit (but only when the property is actually profitable)

To get started before management fees kicked in, HBG raised working capital through SAFE tranches (Simple Agreement for Future Equity). These come in two rounds and are not counted as revenue — they represent future equity in the company.`);

  sections.push(`What This Portal Does

This portal is a financial simulation tool for modeling boutique hotel investments. Think of it as the single source of truth for all of our financial projections.

Here is what it covers:
- Full financial projections for each property and the portfolio as a whole — income statements, cash flow statements, and balance sheets, projected over 10 years
- Investment return metrics like IRR, equity multiple, cash-on-cash return, and NPV
- Scenario analysis so you can save different sets of assumptions and compare outcomes side by side
- AI-powered market research to help calibrate property assumptions against real market data
- An independent verification system that cross-checks every calculation and issues an audit opinion

Every number you see in the portal is calculated by the financial engine. Nothing is hardcoded. When you change an assumption, the entire portfolio recalculates automatically.`);

  sections.push(`Where to Find Things in the Portal

Dashboard — This is your home base. It shows the consolidated portfolio with key performance indicators (IRR, equity multiple, cash-on-cash return, total exit value), plus income statement, cash flow, and balance sheet summaries with charts.

Portfolio — A map and list of all properties in the portfolio. You can click into any property to see its details.

Property Detail — When you click on a property, you get its full financial picture: income statement, cash flow, balance sheet, and investment returns year by year. There are also charts and you can expand formulas to see exactly how each number was calculated.

Property Editor — This is where you change a property's assumptions. Things like ADR, occupancy targets, room count, financing terms, expense rates, and exit assumptions. When you hit Save, the whole portfolio recalculates.

Company — Shows the management company's profit and loss. You can see how much fee revenue is coming in from each property, what the operating expenses look like (partner compensation, staff costs, office, travel), and whether the SAFE funding is still needed.

Company Assumptions — The global settings that apply across the whole model: discount rate, inflation, tax rates, hold period, management fee percentages, and SAFE funding amounts.

Analysis — Financial analysis tools including sensitivity analysis, financing comparisons, and an executive summary. This is where you can stress-test assumptions.

Scenarios — Save the current set of assumptions as a named snapshot (like "Base Case" or "Recession Scenario"). You can load any saved scenario and compare the results.

Property Finder — Search for new hotel acquisition opportunities. Uses AI to analyze potential markets.

Help — Contains the User Manual, the Checker Manual, and an interactive guided tour that walks you through the portal step by step.`);

  sections.push(`How a Property's Finances Work

Every property goes through four phases:

1. Acquisition — The property is purchased. Closing costs (typically around 2–3% of the purchase price) get added to the cost basis. If the property uses debt financing, the loan is drawn at this point.

2. Operations — This is the ongoing phase. Revenue comes in from rooms, food and beverage, events, and other sources. Expenses go out following standard hotel accounting categories. The property ramps up occupancy over time in steps until it reaches its stabilized level.

3. Refinancing — At some point the property may refinance. A new loan is taken out based on the property's current value, the old loan is paid off, and any excess cash goes to investors.

4. Exit — At the end of the holding period, the property is sold. The sale price is based on the final year's NOI divided by the exit cap rate. After paying the sales commission and any remaining debt, the net proceeds go to equity investors.`);

  sections.push(`Revenue — How It Is Calculated

Room revenue is the foundation. It is calculated as:
Room Count times ADR times Occupancy times Days in the Month.

ADR stands for Average Daily Rate — it is the average price per room per night. ADR grows at a set annual rate that compounds over time.

Occupancy does not grow smoothly. It uses a step-up model. You set a starting occupancy, a stabilized occupancy target, how many months between each step, and how many percentage points each step adds. For example, if a property starts at 40% occupancy with a 9-month ramp and 5% steps, it goes 40% for the first 9 months, then 45%, then 50%, and so on until it hits its target.

The other revenue streams are calculated as percentages of room revenue:
- Food and Beverage revenue (with a possible catering boost)
- Events revenue
- Other revenue`);

  sections.push(`Expenses — USALI Categories

Operating expenses follow the USALI standard (Uniform System of Accounts for the Lodging Industry). This is the industry standard for hotel accounting.

Departmental expenses are tied to their revenue sources:
- Rooms department expenses are a percentage of room revenue
- F&B department expenses are a percentage of F&B revenue
- Admin and General is a percentage of total revenue
- Marketing is a percentage of total revenue

Undistributed expenses cover the rest:
- Property operations and maintenance
- Utilities (split between fixed and variable)
- Insurance
- Property taxes
- IT systems

There is also an FF&E Reserve (Furniture, Fixtures, and Equipment). This is a percentage of total revenue set aside for replacing worn-out items. It is deducted below GOP to arrive at NOI.`);

  sections.push(`Key Financial Metrics — What They Mean

GOP (Gross Operating Profit) — Total revenue minus total operating expenses. This tells you how profitable the hotel's operations are before management fees and reserves.

NOI (Net Operating Income) — GOP minus management fees minus the FF&E reserve. This is the income the property generates before debt payments, depreciation, and taxes.

Net Income — NOI minus interest expense, minus depreciation, minus income tax. This is the bottom line on the income statement.

FCFE (Free Cash Flow to Equity) — NOI minus all debt service (principal and interest) minus income tax. This is the actual cash available to equity investors each year.

IRR (Internal Rate of Return) — The annualized return on the equity investment, accounting for the timing of all cash flows: the initial investment, annual distributions, any refinancing proceeds, and the final sale proceeds.

Equity Multiple — Total cash returned divided by total equity invested. An equity multiple of 2.0x means investors got back twice what they put in.

Cash-on-Cash Return — Annual FCFE divided by total equity invested. It tells you what percentage of your investment you are getting back each year in cash.

NPV (Net Present Value) — The present value of all future cash flows, discounted at the required rate of return. If NPV is positive, the investment exceeds the target return.

DSCR (Debt Service Coverage Ratio) — NOI divided by annual debt service. A DSCR above 1.0 means the property earns enough to cover its debt payments. Lenders typically want to see 1.25 or higher.

Cap Rate — NOI divided by property value. It is used to value properties. A lower cap rate means a higher valuation relative to income.`);

  sections.push(`Capital Structure and How Investors Get Paid

A property can be purchased two ways:
- All cash (100% equity) — no debt at all. The property can still be refinanced later.
- With financing — a loan covers part of the purchase based on the LTV (Loan-to-Value) ratio. The rest comes from equity.

Equity investors get their money back through three channels:
1. Annual free cash flow distributions — the cash left over after operating expenses, debt payments, and taxes
2. Refinancing proceeds — when a property refinances and pulls out cash, that excess goes to investors
3. Sale proceeds — when the property is sold at exit, investors receive the net proceeds after paying off any remaining debt and commissions

For financed properties, the loan amount equals the purchase price times the LTV ratio. Monthly payments follow standard amortization. The equity required is the purchase price plus closing costs minus the loan amount.

When a property refinances, the new loan is sized based on the property's current value times the refi LTV. The old loan gets paid off, closing costs come out, and the remaining cash is distributed.`);

  sections.push(`The Seven Business Rules

The financial model enforces seven rules that reflect how things work in the real world. These are baked into the engine and cannot be overridden:

1. The management company cannot start operating until it has received its funding.
2. A property cannot generate revenue or expenses until it has been purchased and funded.
3. Cash balances can never go negative — not for any property, not for the management company, not for the portfolio.
4. At exit, all debt must be paid off from the sale proceeds before anything goes to equity investors.
5. You cannot distribute more cash than what is actually available.
6. The income statement only shows interest expense — principal repayment is a balance sheet and cash flow item, not an income statement expense.
7. Financial reports always show equity, loan proceeds, and refinancing proceeds as separate line items.`);

  sections.push(`Financial Statements

Each property produces three GAAP-compliant financial statements:

Income Statement — Starts with total revenue (rooms, F&B, events, other). Subtract operating expenses to get GOP. Subtract management fees and FF&E reserve to get NOI. Then subtract interest expense, depreciation, and income tax to arrive at net income.

Cash Flow Statement — Follows the indirect method required by GAAP (ASC 230). It has three sections:
- Operating activities: starts with net income and adds back non-cash items like depreciation
- Investing activities: property purchases and sales
- Financing activities: loan proceeds, principal repayments, equity contributions, and refinancing

Balance Sheet — Shows what the property owns and owes:
- Assets: cash on hand plus net property value (original cost minus accumulated depreciation)
- Liabilities: outstanding loan balance
- Equity: the capital investors put in plus retained earnings
The balance sheet must always balance: assets equal liabilities plus equity.`);

  sections.push(`Depreciation and Taxes

Buildings are depreciated using straight-line depreciation over 27.5 years, following IRS rules (Publication 946). Only the building portion is depreciable — land is not. So the depreciable basis is the purchase price times (1 minus the land value percentage) plus any building improvements.

Depreciation is a non-cash expense. It reduces taxable income but does not reduce cash flow. This is one of the key tax advantages of real estate — the depreciation deduction shelters actual cash income from taxes.

When a property is sold, the IRS recaptures some of the depreciation benefit. The gain attributable to prior depreciation deductions is taxed at up to 25% under IRC Section 1250.

Income tax is calculated on taxable income, which equals NOI minus interest expense minus depreciation. If taxable income is negative (because depreciation is large enough), no tax is owed.`);

  sections.push(`Accounting Standards the Model Follows

The model is built to comply with generally accepted accounting principles:

ASC 230 — How cash flow statements are structured (the indirect method with three sections)
ASC 360 — How property assets are recorded and depreciated
ASC 470 — How debt is classified and presented (interest on the income statement, principal on the balance sheet)
ASC 606 — How revenue is recognized (room revenue when the stay happens, event revenue when the event occurs)
ASC 805 — How acquisitions are recorded (at fair value of consideration paid)
USALI — The hotel industry's standard chart of accounts for categorizing revenue and expenses
IRS Publication 946 — The rules for depreciating real property (27.5-year straight-line for residential rental)

The portal also has an independent verification system. Two separate engines calculate the same numbers from the same assumptions. If they do not match, the system flags it. The audit opinion tells you whether the numbers can be trusted: Unqualified means everything checks out, Qualified means there are minor issues, and Adverse means something is seriously wrong.`);

  sections.push(`Market Research

The portal includes AI-powered market research to help set realistic assumptions for properties.

At the property level, you can run research that analyzes the local market — what comparable hotels charge (ADR), what occupancy levels look like, what cap rates are in the area, and who the competitive set is.

At the industry level, you can generate broader research covering market trends, the debt market, labor conditions, supply pipeline, and other factors that affect hotel investments.

One important thing to know: research values are just recommendations. The financial engine never uses AI-generated numbers directly. You have to review the research and explicitly accept any recommendation before it changes your assumptions. This keeps the model honest — no AI output enters the financial calculations without a human choosing to use it.`);

  sections.push(`How To Do Common Things

To add a new property:
Go to the Portfolio page and click Add Property. Fill in the basics — name, room count, starting ADR, purchase price, acquisition date, and location. You can also set up financing, revenue percentages, expense rates, occupancy ramp settings, and exit assumptions. Hit Save and the whole portfolio recalculates.

To compare scenarios:
Go to Scenarios and click Save Current to snapshot your assumptions. Give it a name like "Base Case." Then change some assumptions and save another snapshot. You can switch between scenarios to see how changes affect your returns.

To run market research:
Open a property's detail page and click the Research tab. Choose what type of research to run. The AI will analyze the market and give you recommended values. Click any research badge to apply a recommendation.

To see how a number was calculated:
On any property's detail page, look for the formula transparency sections. You can expand them to see exactly what inputs went into each calculation.

To take a guided tour:
Go to the Help page and select the Guided Tour tab. It walks you through the whole portal step by step.`);

  sections.push(`About Me

I am Marcela, the AI assistant for Hospitality Business Group. I am here to help you understand the financial model, find your way around the portal, and answer questions about the properties and the portfolio.

I can help with things like:
- Explaining what a financial metric means and how it is calculated
- Looking up details about a specific property — its ADR, occupancy, returns, and more
- Giving you a summary of the overall portfolio
- Showing you where to find things in the portal
- Walking you through how to use features like scenarios or market research

I speak English, Portuguese, and Spanish — I will respond in whatever language you use.

One thing to know: I do not calculate financial numbers myself. Every number I share comes directly from the financial engine. I explain and retrieve, but the math is always done by the engine.`);

  try {
    const ga = await storage.getGlobalAssumptions();
    if (ga) {
      sections.push(`Management Company Assumptions — Current Settings

Company name: ${(ga as any).companyName || "Hospitality Management"}
Model start date: ${fmtDate((ga as any).modelStartDate)}
Company operations start: ${fmtDate((ga as any).companyOpsStartDate)}
Projection period: ${(ga as any).projectionYears || 10} years
Fiscal year starts: Month ${(ga as any).fiscalYearStartMonth || 1}

Fee Structure:
- Base management fee rate: ${pct((ga as any).baseManagementFee)}
- Incentive management fee rate: ${pct((ga as any).incentiveManagementFee)}
- Inflation rate: ${pct((ga as any).inflationRate)}
- Fixed cost escalation rate: ${pct((ga as any).fixedCostEscalationRate)}
- Company tax rate: ${pct((ga as any).companyTaxRate)}

SAFE Funding:
- Tranche 1: ${usd((ga as any).safeTranche1Amount)} on ${fmtDate((ga as any).safeTranche1Date)}
- Tranche 2: ${usd((ga as any).safeTranche2Amount)} on ${fmtDate((ga as any).safeTranche2Date)}
- SAFE valuation cap: ${usd((ga as any).safeValuationCap)}
- SAFE discount rate: ${pct((ga as any).safeDiscountRate)}

Partner Compensation per Partner per Year:
- Year 1: ${usd((ga as any).partnerCompYear1)} | Year 2: ${usd((ga as any).partnerCompYear2)} | Year 3: ${usd((ga as any).partnerCompYear3)}
- Year 4: ${usd((ga as any).partnerCompYear4)} | Year 5: ${usd((ga as any).partnerCompYear5)} | Year 6: ${usd((ga as any).partnerCompYear6)}
- Year 7: ${usd((ga as any).partnerCompYear7)} | Year 8: ${usd((ga as any).partnerCompYear8)} | Year 9: ${usd((ga as any).partnerCompYear9)}
- Year 10: ${usd((ga as any).partnerCompYear10)}

Partner Count per Year:
- Year 1: ${(ga as any).partnerCountYear1} | Year 2: ${(ga as any).partnerCountYear2} | Year 3: ${(ga as any).partnerCountYear3}
- Year 4: ${(ga as any).partnerCountYear4} | Year 5: ${(ga as any).partnerCountYear5} | Year 6: ${(ga as any).partnerCountYear6}
- Year 7: ${(ga as any).partnerCountYear7} | Year 8: ${(ga as any).partnerCountYear8} | Year 9: ${(ga as any).partnerCountYear9}
- Year 10: ${(ga as any).partnerCountYear10}

Staffing Tiers:
- Tier 1 (up to ${(ga as any).staffTier1MaxProperties} properties): ${(ga as any).staffTier1Fte} FTE at ${usd((ga as any).staffSalary)}/year
- Tier 2 (up to ${(ga as any).staffTier2MaxProperties} properties): ${(ga as any).staffTier2Fte} FTE at ${usd((ga as any).staffSalary)}/year
- Tier 3 (7+ properties): ${(ga as any).staffTier3Fte} FTE at ${usd((ga as any).staffSalary)}/year

Operating Costs (annual, escalate with inflation):
- Office lease: ${usd((ga as any).officeLeaseStart)}
- Professional services (legal & accounting): ${usd((ga as any).professionalServicesStart)}
- Technology infrastructure: ${usd((ga as any).techInfraStart)}
- Business insurance: ${usd((ga as any).businessInsuranceStart)}
- Travel per property: ${usd((ga as any).travelCostPerClient)}
- IT license per property: ${usd((ga as any).itLicensePerClient)}
- Marketing rate: ${pct((ga as any).marketingRate)} of revenue
- Miscellaneous operations: ${pct((ga as any).miscOpsRate)} of revenue`);
    }

    const properties = await storage.getAllProperties();
    if (properties && properties.length > 0) {
      let portfolioSection = `Current Property Portfolio — ${properties.length} Properties\n\nThe portfolio currently contains the following boutique hotel properties:\n`;

      for (const p of properties) {
        const loc = [p.city, p.stateProvince, p.country].filter(Boolean).join(", ");
        portfolioSection += `
Property: ${p.name}
Location: ${loc || p.location || "N/A"}
Status: ${p.status || "Planned"}
Financing type: ${p.type || "Full Equity"}
Acquisition date: ${fmtDate(p.acquisitionDate)}
Operations start: ${fmtDate(p.operationsStartDate)}
Room count: ${p.roomCount}
Purchase price: ${usd(p.purchasePrice as any)}
Building improvements: ${usd(p.buildingImprovements as any)}
Pre-opening costs: ${usd(p.preOpeningCosts as any)}
Operating reserve: ${usd(p.operatingReserve as any)}

Revenue assumptions:
- Starting ADR: ${usd(p.startAdr as any)}
- ADR growth rate: ${pct(Number(p.adrGrowthRate))}
- Starting occupancy: ${pct(Number(p.startOccupancy))}
- Maximum (stabilized) occupancy: ${pct(Number(p.maxOccupancy))}
- Occupancy ramp period: ${p.occupancyRampMonths} months between steps
- Occupancy growth step: ${pct(Number(p.occupancyGrowthStep))}
- Stabilization period: ${p.stabilizationMonths} months
- F&B revenue share: ${pct(Number(p.revShareFB))} of room revenue
- Events revenue share: ${pct(Number(p.revShareEvents))} of room revenue
- Other revenue share: ${pct(Number(p.revShareOther))} of room revenue
- Catering boost: ${pct(Number(p.cateringBoostPercent))}

Expense rates:
- Rooms department: ${pct(Number(p.costRateRooms))}
- F&B department: ${pct(Number(p.costRateFB))}
- Admin & General: ${pct(Number(p.costRateAdmin))}
- Marketing: ${pct(Number(p.costRateMarketing))}
- Property operations & maintenance: ${pct(Number(p.costRatePropertyOps))}
- Utilities: ${pct(Number(p.costRateUtilities))}
- Insurance: ${pct(Number(p.costRateInsurance))}
- Property taxes: ${pct(Number(p.costRateTaxes))}
- IT systems: ${pct(Number(p.costRateIT))}
- FF&E reserve: ${pct(Number(p.costRateFFE))}

Management fees:
- Base management fee: ${pct(Number(p.baseManagementFeeRate))}
- Incentive management fee: ${pct(Number(p.incentiveManagementFeeRate))}

Exit assumptions:
- Exit cap rate: ${pct(Number(p.exitCapRate))}
- Income tax rate: ${pct(Number(p.taxRate))}
- Disposition commission: ${pct(Number(p.dispositionCommission))}
- Land value percentage: ${pct(Number(p.landValuePercent))}`;

        if (p.acquisitionLTV && Number(p.acquisitionLTV) > 0) {
          portfolioSection += `

Acquisition financing:
- LTV ratio: ${pct(Number(p.acquisitionLTV))}
- Interest rate: ${pct(Number(p.acquisitionInterestRate))}
- Loan term: ${p.acquisitionTermYears} years
- Closing cost rate: ${pct(Number(p.acquisitionClosingCostRate))}`;
        }

        if (p.willRefinance === "Yes") {
          portfolioSection += `

Refinancing plan:
- Will refinance: Yes, ${p.refinanceYearsAfterAcquisition} years after acquisition
- Refinance LTV: ${pct(Number(p.refinanceLTV))}
- Refinance interest rate: ${pct(Number(p.refinanceInterestRate))}
- Refinance term: ${p.refinanceTermYears} years
- Refinance closing cost rate: ${pct(Number(p.refinanceClosingCostRate))}`;
        }

        portfolioSection += "\n";
      }

      sections.push(portfolioSection);
    }
  } catch (err: any) {
    logger.error(`Failed to load live data for KB: ${err.message}`, "marcela-kb");
  }

  sections.push(`User Roles and Permissions

There are four user roles in the portal:

Admin — Full access to everything. Can manage users, configure settings, edit any property, access verification, and manage the AI agent. Ricardo Cidale is the sole admin.

Partner — Can view the full portfolio, edit property assumptions, run scenarios, and use analysis tools. Partners are the primary users of the financial model.

Investor — Read-only access to the portfolio and financial statements. Investors can see the numbers but cannot change assumptions.

Checker — A specialized role focused on verification and audit. Checkers can access the independent audit system and review calculation integrity. They have a dedicated Checker Manual with formula documentation.`);

  sections.push(`Sensitivity Analysis and Scenario Planning

The portal offers multiple ways to stress-test assumptions:

Sensitivity Analysis — Available on the Analysis page. You can see how changes to key inputs (ADR, occupancy, cap rate, expense rates) affect portfolio returns. The tool shows a range of outcomes so you can understand what drives value.

Scenario Comparison — Save the current set of assumptions as a named scenario. Create multiple scenarios (for example, "Base Case," "Optimistic," "Recession") and compare them side by side. Each scenario captures a full snapshot of all global and property assumptions.

What-If Analysis — Change any assumption in the property editor or company assumptions page and see the impact immediately. The entire portfolio recalculates in real time.`);

  return sections.join("\n\n---\n\n");
}

export async function uploadKnowledgeBase(): Promise<{ success: boolean; documentId?: string; error?: string }> {
  try {
    const ga = await storage.getGlobalAssumptions();
    const agentId = (ga as any)?.marcelaAgentId;
    if (!agentId) {
      return { success: false, error: "No Marcela agent ID configured" };
    }

    const documentText = await buildKnowledgeDocument();
    logger.info(`Compiled knowledge base: ${documentText.length} characters`, "marcela-kb");

    const existingAgent = await getConvaiAgent(agentId);
    const existingKB = (existingAgent as any)?.conversation_config?.agent?.prompt?.knowledge_base;
    if (Array.isArray(existingKB) && existingKB.length > 0) {
      for (const doc of existingKB) {
        if (doc.id && doc.name?.startsWith("HBG-Marcela-KB")) {
          try {
            await deleteKBDocument(doc.id);
            logger.info(`Deleted old KB document: ${doc.id}`, "marcela-kb");
          } catch {
            logger.info(`Could not delete old doc ${doc.id}, continuing...`, "marcela-kb");
          }
        }
      }
    }

    const doc = await createKBDocumentFromText("HBG-Marcela-KB", documentText);
    logger.info(`Created KB document: ${doc.id}`, "marcela-kb");

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

    logger.info(`Attached KB document to agent ${agentId}`, "marcela-kb");
    return { success: true, documentId: doc.id };
  } catch (error: any) {
    logger.error(`Error uploading knowledge base: ${error.message}`, "marcela-kb");
    return { success: false, error: error.message };
  }
}

export async function getKnowledgeDocumentPreview(): Promise<{ sections: number; characters: number; preview: string }> {
  const doc = await buildKnowledgeDocument();
  const sectionCount = doc.split("---").length;
  return {
    sections: sectionCount,
    characters: doc.length,
    preview: doc.slice(0, 500) + "...",
  };
}
