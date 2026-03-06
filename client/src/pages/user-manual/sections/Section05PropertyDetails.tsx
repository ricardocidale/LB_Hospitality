import { SectionCard } from "@/components/ui/section-card";
import { ManualTable } from "@/components/ui/manual-table";
import { BarChart3 } from "lucide-react";

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
      icon={BarChart3}
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
            ["Income Statement", "Revenue, operating expenses, GOP, NOI, debt service, and net income by month and year"],
            ["Balance Sheet", "Assets (cash + property), liabilities (debt), and equity for each period"],
            ["Cash Flow Statement", "Operating, investing, and financing activities using the indirect method (GAAP ASC 230)"],
          ]}
        />
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-semibold mb-2">Key Property Metrics</h4>
        <ManualTable
          variant="light"
          headers={["Metric", "Description"]}
          rows={[
            ["ADR (Average Daily Rate)", "Average price per occupied room per night"],
            ["Occupancy", "Percentage of rooms occupied in a given period"],
            ["RevPAR", "Revenue Per Available Room = ADR x Occupancy"],
            ["GOP (Gross Operating Profit)", "Total Revenue minus departmental operating expenses"],
            ["NOI (Net Operating Income)", "GOP minus management fees and FF&E reserve"],
            ["DSCR (Debt Service Coverage Ratio)", "NOI divided by total debt service — measures ability to service debt"],
            ["IRR (Internal Rate of Return)", "Annualized return considering all cash flows including exit"],
            ["Equity Multiple", "Total cash returned to investors divided by equity invested"],
            ["Cash-on-Cash Return", "Annual free cash flow divided by total equity invested"],
          ]}
        />
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-semibold mb-2">AI Market Research</h4>
        <p className="text-sm text-muted-foreground">
          Click <strong>"Run AI Research"</strong> on a property detail page to have the AI analyze market conditions
          for the property's location. The research provides benchmarks for ADR, occupancy, expense rates, and cap rates
          based on comparable properties in the area. Research results appear as amber badges on the property edit page.
        </p>
      </div>
    </SectionCard>
  );
}
