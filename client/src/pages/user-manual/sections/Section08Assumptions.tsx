import { SectionCard } from "@/components/ui/section-card";
import { ManualTable } from "@/components/ui/manual-table";
import { Callout } from "@/components/ui/callout";
import { Settings } from "lucide-react";

interface SectionProps {
  expanded: boolean;
  onToggle: () => void;
  sectionRef: (el: HTMLDivElement | null) => void;
}

export default function Section08Assumptions({ expanded, onToggle, sectionRef }: SectionProps) {
  return (
    <SectionCard
      id="assumptions"
      title="8. Systemwide Assumptions"
      icon={Settings}
      variant="light"
      expanded={expanded}
      onToggle={onToggle}
      sectionRef={sectionRef}
    >
      <p className="text-sm text-muted-foreground">
        Systemwide Assumptions are model-wide parameters that affect all properties and the management company.
        Changes here trigger a full portfolio recalculation.
      </p>

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-semibold mb-2">Key Parameters</h4>
        <ManualTable
          variant="light"
          headers={["Category", "Examples"]}
          rows={[
            ["Economic", "Inflation rate, income tax rate, property tax rate"],
            ["Revenue Growth", "ADR growth rate, occupancy growth rate"],
            ["Expense Escalation", "Fixed cost escalation, variable cost growth"],
            ["Financing Defaults", "Default LTV, interest rate, loan term"],
            ["Management Fees", "Base fee rate, incentive fee rate"],
            ["Exit Parameters", "Exit cap rate, sales commission rate"],
            ["Staffing", "Staff FTE tiers based on property count"],
          ]}
        />
      </div>

      <Callout variant="light">
        Individual properties can override any systemwide assumption with property-specific values.
        When a property-level value is not set, the systemwide default is used automatically.
      </Callout>
    </SectionCard>
  );
}
