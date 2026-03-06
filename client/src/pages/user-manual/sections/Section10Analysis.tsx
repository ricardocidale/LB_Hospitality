import { SectionCard } from "@/components/ui/section-card";
import { BarChart3 } from "lucide-react";

interface SectionProps {
  expanded: boolean;
  onToggle: () => void;
  sectionRef: (el: HTMLDivElement | null) => void;
}

export default function Section10Analysis({ expanded, onToggle, sectionRef }: SectionProps) {
  return (
    <SectionCard
      id="analysis"
      title="10. Analysis Tools"
      icon={BarChart3}
      variant="light"
      expanded={expanded}
      onToggle={onToggle}
      sectionRef={sectionRef}
    >
      <p className="text-sm text-muted-foreground">
        The Analysis section provides advanced tools for testing how changes in key variables affect financial outcomes.
      </p>

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-semibold mb-2">Sensitivity Analysis</h4>
        <p className="text-sm text-muted-foreground">
          Tests how changing one variable at a time (e.g., ADR, occupancy, cap rate) impacts key metrics like IRR,
          NOI, and equity multiple. Results are shown as tables and charts that highlight upside and downside scenarios.
        </p>
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-semibold mb-2">Financing Analysis</h4>
        <p className="text-sm text-muted-foreground">
          Compares different financing structures — varying LTV ratios, interest rates, and loan terms — to see
          how leverage affects returns. Useful for finding the optimal debt-to-equity ratio for each property.
        </p>
      </div>
    </SectionCard>
  );
}
