import { SectionCard } from "@/components/ui/section-card";
  import { ManualTable } from "@/components/ui/manual-table";
  import { Callout } from "@/components/ui/callout";
  import { IconHelp } from "@/components/icons";interface SectionProps {
    expanded: boolean;
    onToggle: () => void;
    sectionRef: (el: HTMLDivElement | null) => void;
  }

  export default function Section21Glossary({ expanded, onToggle, sectionRef }: SectionProps) {
    return (
      <SectionCard
        id="glossary"
        title="21. Glossary"
        icon={IconHelp}
        expanded={expanded}
        onToggle={onToggle}
        sectionRef={sectionRef}
      >
        <ManualTable
          headers={["Term", "Definition", "Formula Ref", "Category"]}
          rows={[
            ["ADR (Average Daily Rate)", "Average revenue earned per occupied room per day", "F-P-03", "Revenue"],
            ["Amortization", "Gradual repayment of loan principal over time via scheduled payments", "F-F-01", "Financing"],
            ["ASC 230", "GAAP standard governing Statement of Cash Flows", "—", "Accounting Standard"],
            ["ASC 310-20", "GAAP standard for loan origination costs; capitalized and amortized over loan term", "—", "Accounting Standard"],
            ["ASC 360", "GAAP standard for property depreciation and impairment", "F-P-13", "Accounting Standard"],
            ["ASC 470", "GAAP standard for debt accounting and classification", "—", "Accounting Standard"],
            ["ASC 606", "GAAP revenue recognition standard; point-in-time vs. over-time; bundled package allocation", "—", "Accounting Standard"],
            ["ASC 805", "GAAP standard for business combinations and acquisition cost measurement", "—", "Accounting Standard"],
            ["ASC 810", "GAAP consolidation standard; inter-company elimination entries", "—", "Accounting Standard"],
            ["ATCF (After-Tax Cash Flow)", "Cash remaining after operating expenses, debt service, and taxes", "F-R-02", "Returns"],
            ["Balance Sheet", "Point-in-time snapshot of assets, liabilities, and equity", "—", "Financial Statement"],
            ["Base Management Fee", "Percentage of total property revenue paid to management company", "F-C-01", "Fees"],
            ["Boutique Hotel", "Independently owned, typically 10–80 rooms, with F&B and events", "—", "Property Type"],
            ["Building Improvements", "Capital expenditures to improve property post-acquisition", "—", "Capital"],
            ["Cap Rate", "NOI / Property Value; used to value income-producing real estate", "F-R-05", "Valuation"],
            ["Cash from Financing (CFF)", "Cash flows from debt, equity, and distributions", "F-P-19", "Cash Flow"],
            ["Cash from Investing (CFI)", "Cash flows from property acquisition/disposition", "F-P-18", "Cash Flow"],
            ["Cash from Operations (CFO)", "Cash generated from core business operations", "F-P-17", "Cash Flow"],
            ["Closing Costs", "Fees/expenses associated with finalizing a loan (% of loan amount)", "F-F-02", "Financing"],
            ["DCF (Discounted Cash Flow)", "Valuation method summing present value of projected cash flows", "—", "Valuation"],
            ["Debt Service", "Total loan payment combining interest and principal = PMT", "F-F-04", "Financing"],
            ["Depreciable Basis", "Portion of property value subject to depreciation", "F-P-13", "Depreciation"],
            ["Depreciation", "Non-cash expense allocating building cost over 27.5 years (straight-line)", "F-P-14", "Depreciation"],
            ["DSCR", "Debt Service Coverage Ratio = ANOI / Annual Debt Service", "—", "Financing"],
            ["Equity Invested", "Total capital contributed by equity investors = Total Cost − Loan", "F-R-03", "Returns"],
            ["Equity Multiple (MOIC)", "Total Distributions / Total Equity Invested", "F-R-04", "Returns"],
            ["Exit Cap Rate", "Cap rate used to value property at disposition/sale", "F-R-05", "Valuation"],
            ["Exit Proceeds", "Net cash at property sale = Gross Value − Commission − Debt", "F-R-06", "Returns"],
            ["FCFE (Free Cash Flow to Equity)", "Cash available to equity holders after debt", "F-R-02", "Returns"],
            ["FCF (Free Cash Flow)", "Cash from operations minus capital expenditures", "F-R-01", "Returns"],
            ["FF&E", "Furniture, Fixtures & Equipment reserve (typically 4% of revenue)", "—", "Capital"],
            ["Fiscal Year", "12-month accounting period; configurable start month", "—", "Accounting"],
            ["GAAP", "Generally Accepted Accounting Principles (US framework)", "—", "Accounting Standard"],
            ["GAAP Badge", "Blue inline icon (ⓘ) showing the GAAP or IRS rule governing an assumption field; hover to view", "—", "UI"],
            ["GOP (Gross Operating Profit)", "Total Revenue − Total Operating Expenses", "F-P-09", "Profitability"],
            ["Gross Disposition Value", "Property sale price = Terminal NOI / Exit Cap Rate", "F-R-05", "Valuation"],
            ["HMA", "Hotel Management Agreement defining fee structure", "—", "Legal"],
            ["Incentive Management Fee", "Performance-based fee calculated on GOP", "F-C-02", "Fees"],
            ["Income Statement (P&L)", "Statement showing revenue, expenses, and net income over a period", "—", "Financial Statement"],
            ["Inflation Rate", "Annual rate of general price increase; affects variable costs", "—", "Assumptions"],
            ["IRC §164", "IRS code: property taxes fully deductible as operating expense; based on assessed value", "—", "Tax Code"],
            ["IRC §168", "IRS code: MACRS depreciation; 27.5-year straight-line for residential rental property", "F-P-14", "Tax Code"],
            ["IRC §1001", "IRS code: amount realized on sale = gross proceeds minus selling expenses (commission)", "F-R-06", "Tax Code"],
            ["IRC §1250", "IRS code: depreciation recapture on sale of real property; taxed at up to 25%", "F-R-06", "Tax Code"],
            ["IRR (Internal Rate of Return)", "Discount rate making NPV of cash flows equal to zero", "F-R-04", "Returns"],
            ["IRS Pub 946", "IRS publication on depreciation: land is non-depreciable; buildings use 27.5-year life", "F-P-13", "Tax Code"],
            ["Land Value Percent", "Portion of purchase price allocated to land (non-depreciable per IRS Pub 946)", "F-P-13", "Depreciation"],
            ["LTV (Loan-to-Value)", "Ratio of loan amount to property purchase price", "F-F-01", "Financing"],
            ["Management Company", "Asset-light service entity earning fees from managed properties", "—", "Entity"],
            ["MOIC", "Multiple on Invested Capital (see Equity Multiple)", "F-R-04", "Returns"],
            ["Monthly Depreciation", "Depreciable Basis / 27.5 / 12", "F-P-14", "Depreciation"],
            ["Net Income", "ANOI − Interest − Depreciation − Income Tax", "F-P-16", "Profitability"],
            ["NOI (Net Operating Income)", "IBFC − Fixed Charges (insurance + property taxes)", "F-P-11", "Profitability"],
            ["IBFC (Income Before Fixed Charges)", "GOP − Management Fees (base + incentive)", "F-P-10", "Profitability"],
            ["ANOI (Adjusted NOI)", "NOI − FF&E Reserve", "F-P-12", "Profitability"],
            ["Occupancy Rate", "Percentage of available rooms sold; ramps from start to max", "—", "Revenue"],
            ["Operating Reserve", "Cash set aside for initial working capital needs", "—", "Capital"],
            ["PMT", "Loan payment formula = P × [r(1+r)^n / ((1+r)^n − 1)]", "F-F-04", "Financing"],
            ["Pre-Opening Costs", "Expenses before property begins operations", "—", "Capital"],
            ["Pro Forma", "Projected financial statements based on assumptions", "—", "Financial Statement"],
            ["Projection Period", "Number of years modeled (configurable, default 10)", "—", "Assumptions"],
            ["Purchase Price", "Acquisition cost of the property asset", "—", "Capital"],
            ["Benchmark Range Label", "Light yellow inline label showing AI-researched market range (e.g., 55%-70%); hover for source and date; click to auto-fill recommended value", "—", "UI"],
            ["Refinancing", "Replacing existing debt with new loan, typically post-stabilization", "F-F-06", "Financing"],
            ["Refi Proceeds", "Net cash from refinancing = New Loan − Old Balance − Costs", "F-F-07", "Financing"],
            ["RevPAR", "Revenue Per Available Room = ADR × Occupancy", "—", "Revenue"],
            ["Room Revenue", "ADR × Sold Rooms", "F-P-03", "Revenue"],
            ["Funding Instrument", "Configurable funding instrument (e.g., SAFE, Convertible Note, Seed, Series A). Valuation cap and discount rate are optional.", "F-F-10", "Funding"],
            ["Scenario", "Saved snapshot of all assumptions and property configurations", "—", "System"],
            ["SPV (Special Purpose Vehicle)", "Legal entity isolating each property's financial risk", "—", "Legal"],
            ["Stabilization", "Period when property reaches target occupancy (12–24 months)", "—", "Operations"],
            ["Straight-Line Depreciation", "Equal depreciation expense each period over useful life", "—", "Depreciation"],
            ["Terminal Year", "Final year of projection period; used for exit valuation", "—", "Valuation"],
            ["Total Property Cost", "Purchase + Improvements + Pre-Opening + Reserve + Closing", "F-F-03", "Capital"],
            ["USALI", "Uniform System of Accounts for the Lodging Industry", "—", "Accounting Standard"],
            ["Variable Costs", "Operating expenses that scale with revenue/occupancy", "—", "Expenses"],
          ]}
        />
      </SectionCard>
    );
  }
  