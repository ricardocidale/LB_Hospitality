import { SectionCard } from "@/components/ui/section-card";
import { ManualTable } from "@/components/ui/manual-table";
import { LayoutDashboard } from "lucide-react";

interface SectionProps {
  expanded: boolean;
  onToggle: () => void;
  sectionRef: (el: HTMLDivElement | null) => void;
}

export default function Section03Dashboard({ expanded, onToggle, sectionRef }: SectionProps) {
  return (
    <SectionCard
      id="dashboard"
      title="3. Dashboard"
      icon={LayoutDashboard}
      variant="light"
      expanded={expanded}
      onToggle={onToggle}
      sectionRef={sectionRef}
    >
      <p className="text-sm text-muted-foreground">
        The Dashboard provides a high-level overview of the entire portfolio. It shows key performance indicators (KPIs),
        consolidated financial charts, and summary cards for each property.
      </p>

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-semibold mb-2">KPI Cards</h4>
        <ManualTable
          variant="light"
          headers={["KPI", "Description"]}
          rows={[
            ["Portfolio IRR", "The internal rate of return across all properties combined"],
            ["Portfolio Equity Multiple", "Total distributions and exit proceeds divided by total equity invested"],
            ["Total Revenue", "Consolidated annual revenue across all properties"],
            ["Portfolio ANOI", "Adjusted NOI for the entire portfolio"],
            ["Weighted Avg Occupancy", "Average occupancy weighted by room count across properties"],
            ["Total Equity Invested", "Sum of all equity contributions across the portfolio"],
          ]}
        />
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-semibold mb-2">Charts & Visualizations</h4>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>&#8226; <strong>Revenue & NOI Trend</strong> — year-over-year revenue and NOI across the portfolio</li>
          <li>&#8226; <strong>Cash Flow Waterfall</strong> — visualizes how cash flows from revenue to distributions</li>
          <li>&#8226; <strong>Property Comparison</strong> — side-by-side metrics for each property</li>
        </ul>
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-semibold mb-2">Property Cards</h4>
        <p className="text-sm text-muted-foreground">
          Each property is shown as a summary card with its name, location, room count, ADR, occupancy, and key financial metrics.
          Click any property card to navigate to its detail page.
        </p>
      </div>
    </SectionCard>
  );
}
