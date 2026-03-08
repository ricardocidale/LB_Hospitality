import { SectionCard } from "@/components/ui/section-card";
import { ManualTable } from "@/components/ui/manual-table";
import { Callout } from "@/components/ui/callout";
import { IconInvestment } from "@/components/icons/brand-icons";

interface SectionProps {
  expanded: boolean;
  onToggle: () => void;
  sectionRef: (el: HTMLDivElement | null) => void;
}

export default function Section05PropertyDetails({ expanded, onToggle, sectionRef }: SectionProps) {
  return (
    <SectionCard
      id="property-details"
      title="5. Property Details & Financials"
      icon={IconInvestment}
      variant="light"
      expanded={expanded}
      onToggle={onToggle}
      sectionRef={sectionRef}
    >
      <p className="text-sm text-muted-foreground">
        Each property detail page shows comprehensive financial projections organized into tabs and sections.
      </p>

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-semibold mb-2">Financial Statements</h4>
        <ManualTable
          variant="light"
          headers={["Statement", "What It Shows"]}
          rows={[
            ["Income Statement", "Revenue, operating expenses, the full USALI waterfall (GOP → AGOP → NOI → ANOI), debt service, and GAAP net income — by month and year"],
            ["Balance Sheet", "Assets (cash, property, deferred costs), liabilities (mortgage notes), and equity (paid-in capital, retained earnings) for each period"],
            ["Cash Flow Statement", "Operating, investing, and financing activities using the indirect method (GAAP ASC 230), plus FCF, FCFE, DSCR, and cash-on-cash return"],
          ]}
        />
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-semibold mb-2">Income Statement Waterfall (USALI)</h4>
        <div className="bg-card/50 rounded p-3 font-mono text-xs space-y-1">
          <div>Total Revenue (Rooms + Events + F&B + Other)</div>
          <div>− Operating Expenses</div>
          <div className="font-semibold">= Gross Operating Profit (GOP)</div>
          <div>− Management Fees (Base + Incentive)</div>
          <div className="font-semibold">= Adjusted GOP (AGOP)</div>
          <div>− Fixed Charges (Insurance + Property Taxes)</div>
          <div className="font-semibold">= Net Operating Income (NOI)</div>
          <div>− FF&E Reserve</div>
          <div className="font-semibold">= Adjusted NOI (ANOI)</div>
          <div>− Interest Expense − Depreciation − Amortization</div>
          <div className="font-semibold">= GAAP Net Income</div>
        </div>
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-semibold mb-2">Cash Flow Statement Sections</h4>
        <ManualTable
          variant="light"
          headers={["Section", "Key Items"]}
          rows={[
            ["Cash from Operations", "Room revenue, event revenue, F&B, operating expenses, management fees, taxes, interest"],
            ["Cash from Investing", "Property acquisition, capital expenditures, exit sale proceeds"],
            ["Cash from Financing", "Loan proceeds, principal payments, equity contributions, refinancing"],
            ["Free Cash Flow (FCF)", "= CFO − Capital Expenditures"],
            ["Free Cash Flow to Equity (FCFE)", "= FCF − Net Debt Payments"],
          ]}
        />
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-semibold mb-2">Key Property Metrics</h4>
        <ManualTable
          variant="light"
          headers={["Metric", "Description"]}
          rows={[
            ["ADR (Rate)", "Rack rate — the posted average daily room rate"],
            ["ADR (Effective)", "Room Revenue ÷ Sold Rooms — the actual realized rate"],
            ["Occupancy", "Sold Rooms ÷ Available Rooms — percentage of rooms occupied"],
            ["RevPAR", "Room Revenue ÷ Available Rooms — revenue per available room"],
            ["GOP (Gross Operating Profit)", "Total Revenue minus departmental operating expenses"],
            ["NOI (Net Operating Income)", "AGOP minus fixed charges (insurance + taxes)"],
            ["ANOI (Adjusted NOI)", "NOI minus FF&E reserve"],
            ["DSCR (Debt Service Coverage Ratio)", "NOI ÷ Total Debt Service — measures ability to cover loan payments"],
            ["Cash-on-Cash Return", "Annual after-tax cash flow ÷ total equity invested"],
            ["IRR (Internal Rate of Return)", "Annualized return considering all cash flows including exit"],
            ["Equity Multiple", "Total cash returned to investors ÷ equity invested"],
          ]}
        />
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-semibold mb-2">Formula Rows</h4>
        <p className="text-sm text-muted-foreground">
          Every calculated subtotal and metric in the financial statements has a collapsible "Formula" row
          indicated by a chevron icon. Click it to reveal the exact formula and component values used for
          that line item. This includes operating expense breakdowns, metric calculations (ADR, RevPAR,
          Occupancy), and all waterfall subtotals.
        </p>
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-semibold mb-2">Balance Sheet Structure</h4>
        <ManualTable
          variant="light"
          headers={["Category", "Line Items"]}
          rows={[
            ["Current Assets", "Cash & Cash Equivalents (operating reserves + cumulative operating cash flow + refinancing proceeds)"],
            ["Fixed Assets", "Property, Plant & Equipment (acquisition cost + improvements) less Accumulated Depreciation"],
            ["Other Assets", "Deferred Financing Costs (refinancing closing costs)"],
            ["Liabilities", "Mortgage Notes Payable (outstanding debt per property)"],
            ["Equity", "Paid-In Capital (equity invested) + Retained Earnings (cumulative net income less pre-opening costs)"],
            ["Ratios", "Debt-to-Assets and Equity-to-Assets ratios"],
          ]}
        />
      </div>

      <Callout variant="light">
        All financial calculations are deterministic — computed by the financial engine, never estimated or
        approximated. Click any "Formula" chevron to see exactly how a value was derived.
      </Callout>
    </SectionCard>
  );
}
