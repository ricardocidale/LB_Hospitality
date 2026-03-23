export interface GlossaryEntry {
  term: string;
  definition: string;
  formula?: string;
  formulaRef?: string;
  category?: string;
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  "ADR": {
    term: "ADR (Average Daily Rate)",
    definition: "Average revenue earned per occupied room per day.",
    formula: "Room Revenue / Rooms Sold",
    formulaRef: "F-P-03",
    category: "Revenue",
  },
  "AGOP": {
    term: "Adjusted Gross Operating Profit",
    definition: "GOP minus management fees (base + incentive). Isolates property-level performance after management compensation.",
    formula: "GOP − Base Fee − Incentive Fee",
    formulaRef: "F-P-09a",
    category: "Profitability",
  },
  "ANOI": {
    term: "Adjusted Net Operating Income",
    definition: "NOI minus FF&E Reserve. The true owner's cash flow from property operations before debt service and taxes.",
    formula: "NOI − FF&E Reserve",
    formulaRef: "F-P-11",
    category: "Profitability",
  },
  "ATCF": {
    term: "After-Tax Cash Flow",
    definition: "Cash remaining after operating expenses, debt service, and income taxes.",
    formulaRef: "F-R-02",
    category: "Returns",
  },
  "Cap Rate": {
    term: "Capitalization Rate",
    definition: "NOI divided by property value. Used to value income-producing real estate.",
    formula: "NOI / Property Value",
    formulaRef: "F-R-05",
    category: "Valuation",
  },
  "CFO": {
    term: "Cash from Operations",
    definition: "Cash generated from core business operations, following ASC 230 classification.",
    formulaRef: "F-P-17",
    category: "Cash Flow",
  },
  "CFI": {
    term: "Cash from Investing",
    definition: "Cash flows from property acquisition and disposition activities.",
    formulaRef: "F-P-18",
    category: "Cash Flow",
  },
  "CFF": {
    term: "Cash from Financing",
    definition: "Cash flows from debt, equity, and distribution activities.",
    formulaRef: "F-P-19",
    category: "Cash Flow",
  },
  "DCF": {
    term: "Discounted Cash Flow",
    definition: "Valuation method summing the present value of all projected future cash flows.",
    category: "Valuation",
  },
  "DSCR": {
    term: "Debt Service Coverage Ratio",
    definition: "Measures ability to cover debt payments from operating income. Lenders typically require ≥1.25×.",
    formula: "ANOI / Annual Debt Service",
    category: "Financing",
  },
  "EBITDA": {
    term: "Earnings Before Interest, Taxes, Depreciation & Amortization",
    definition: "Common metric for valuing asset-light management companies. Strips out non-cash and capital structure effects.",
    formulaRef: "F-C-09a",
    category: "Profitability",
  },
  "Equity Multiple": {
    term: "Equity Multiple (MOIC)",
    definition: "Total distributions returned to investors divided by total equity invested.",
    formula: "Total Distributions / Total Equity Invested",
    formulaRef: "F-R-04",
    category: "Returns",
  },
  "Exit Cap Rate": {
    term: "Exit Capitalization Rate",
    definition: "Cap rate applied to terminal-year NOI to determine gross sale price at disposition.",
    formula: "Gross Sale Value = Terminal NOI / Exit Cap Rate",
    formulaRef: "F-R-05",
    category: "Valuation",
  },
  "FCF": {
    term: "Free Cash Flow",
    definition: "Cash from operations minus capital expenditures. Available for debt service, distributions, or reinvestment.",
    formulaRef: "F-R-01",
    category: "Returns",
  },
  "FF&E": {
    term: "Furniture, Fixtures & Equipment",
    definition: "Capital reserve set aside for replacement of hotel furniture, fixtures, and equipment. Typically 4% of total revenue per USALI standards.",
    category: "Capital",
  },
  "FFE": {
    term: "Furniture, Fixtures & Equipment",
    definition: "Capital reserve set aside for replacement of hotel furniture, fixtures, and equipment. Typically 4% of total revenue per USALI standards.",
    category: "Capital",
  },
  "GOP": {
    term: "Gross Operating Profit",
    definition: "Total revenue minus total operating expenses. The first profitability line in the USALI waterfall, before management fees and fixed charges.",
    formula: "Total Revenue − Total Operating Expenses",
    formulaRef: "F-P-09",
    category: "Profitability",
  },
  "IRR": {
    term: "Internal Rate of Return",
    definition: "The discount rate that makes the net present value of all cash flows equal to zero. The primary return metric for real estate investments.",
    formulaRef: "F-R-04",
    category: "Returns",
  },
  "LTV": {
    term: "Loan-to-Value",
    definition: "Ratio of loan amount to property purchase price. Determines how much of the acquisition is financed with debt.",
    formula: "Loan Amount / Purchase Price",
    formulaRef: "F-F-01",
    category: "Financing",
  },
  "MOIC": {
    term: "Multiple on Invested Capital",
    definition: "Total distributions returned to investors divided by total equity invested.",
    formula: "Total Distributions / Total Equity Invested",
    formulaRef: "F-R-04",
    category: "Returns",
  },
  "NOI": {
    term: "Net Operating Income",
    definition: "AGOP minus property taxes. In this engine, management fees are deducted before NOI (via AGOP), then property taxes are subtracted.",
    formula: "AGOP − Property Taxes",
    formulaRef: "F-P-10",
    category: "Profitability",
  },
  "NOL": {
    term: "Net Operating Loss",
    definition: "When taxable income is negative, the loss is carried forward to offset future taxable income per IRC §172.",
    formulaRef: "F-P-16a",
    category: "Tax",
  },
  "NPV": {
    term: "Net Present Value",
    definition: "Sum of all future cash flows discounted to present value. A positive NPV indicates the investment exceeds the required return.",
    category: "Returns",
  },
  "RevPAR": {
    term: "Revenue Per Available Room",
    definition: "Key hotel performance metric combining both occupancy and rate into a single number.",
    formula: "ADR × Occupancy",
    category: "Revenue",
  },
  "SPV": {
    term: "Special Purpose Vehicle",
    definition: "A separate legal entity created to isolate each property's financial risk from the management company.",
    category: "Legal",
  },
  "USALI": {
    term: "Uniform System of Accounts for the Lodging Industry",
    definition: "The standard chart of accounts and income statement ordering for hotels (12th Edition). Waterfall: Revenue → OpEx → GOP → Mgmt Fees → AGOP → Property Taxes → NOI → FF&E → ANOI.",
    category: "Accounting Standard",
  },
  "WACC": {
    term: "Weighted Average Cost of Capital",
    definition: "Blended cost of debt and equity financing, used as the discount rate in DCF analysis.",
    formula: "E/(E+D) × Ke + D/(E+D) × Kd × (1−t)",
    category: "Valuation",
  },
  "GAAP": {
    term: "Generally Accepted Accounting Principles",
    definition: "The US framework of accounting standards (ASC 230, ASC 360, ASC 470) governing financial reporting.",
    category: "Accounting Standard",
  },
  "PMT": {
    term: "Loan Payment (PMT)",
    definition: "Fixed periodic loan payment combining interest and principal repayment.",
    formula: "P × [r(1+r)^n / ((1+r)^n − 1)]",
    formulaRef: "F-F-04",
    category: "Financing",
  },
  "FCFE": {
    term: "Free Cash Flow to Equity",
    definition: "Cash available to equity holders after all operating expenses, capital expenditures, and debt service.",
    formulaRef: "F-R-02",
    category: "Returns",
  },
  "Occupancy Ramp": {
    term: "Occupancy Ramp",
    definition: "The gradual increase in occupancy from opening day to stabilized levels. New hotels don't fill instantly — occupancy grows in steps until reaching the target maximum. Industry standard: 24–36 months to stabilization.",
    formulaRef: "F-P-03",
    category: "Revenue",
  },
  "Base Fee": {
    term: "Base Management Fee",
    definition: "Percentage of total property revenue paid to the management company. Typically 3–5% of gross revenue per HVS 2024 fee survey.",
    formulaRef: "F-C-01",
    category: "Fees",
  },
  "Incentive Fee": {
    term: "Incentive Management Fee",
    definition: "Performance-based fee calculated on GOP, rewarding the management company for exceeding profit targets. Typically 8–12% of GOP per HVS 2024.",
    formulaRef: "F-C-02",
    category: "Fees",
  },
};

export function lookupGlossary(term: string): GlossaryEntry | undefined {
  if (GLOSSARY[term]) return GLOSSARY[term];
  const upper = term.toUpperCase();
  for (const [key, entry] of Object.entries(GLOSSARY)) {
    if (key.toUpperCase() === upper) return entry;
  }
  return undefined;
}
