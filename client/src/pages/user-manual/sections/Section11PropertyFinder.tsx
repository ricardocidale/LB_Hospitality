import { SectionCard } from "@/components/ui/section-card";
import { IconPropertyFinder } from "@/components/icons/brand-icons";

interface SectionProps {
  expanded: boolean;
  onToggle: () => void;
  sectionRef: (el: HTMLDivElement | null) => void;
}

export default function Section11PropertyFinder({ expanded, onToggle, sectionRef }: SectionProps) {
  return (
    <SectionCard
      id="property-finder"
      title="11. Property Finder"
      icon={IconPropertyFinder}
      variant="light"
      expanded={expanded}
      onToggle={onToggle}
      sectionRef={sectionRef}
    >
      <p className="text-sm text-muted-foreground">
        The Property Finder helps you search for and evaluate prospective investment properties before adding them to the portfolio.
      </p>

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-semibold mb-2">How to Use</h4>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>&#8226; Enter a city or region to search for boutique hotel opportunities.</li>
          <li>&#8226; AI-powered research analyzes market conditions, comparable properties, and local demand drivers.</li>
          <li>&#8226; Review the results including suggested ADR ranges, occupancy rates, and cap rates.</li>
          <li>&#8226; Save promising prospects to revisit later or add them directly to your portfolio.</li>
        </ul>
      </div>
    </SectionCard>
  );
}
