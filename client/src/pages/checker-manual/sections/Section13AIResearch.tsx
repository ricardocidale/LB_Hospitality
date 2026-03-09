import { SectionCard } from "@/components/ui/section-card";
  import { ManualTable } from "@/components/ui/manual-table";
  import { Callout } from "@/components/ui/callout";
  import { IconResearch } from "@/components/icons/brand-icons";

  interface SectionProps {
    expanded: boolean;
    onToggle: () => void;
    sectionRef: (el: HTMLDivElement | null) => void;
  }

  export default function Section13AIResearch({ expanded, onToggle, sectionRef }: SectionProps) {
    return (
      <SectionCard
        id="ai-research"
        title="13. AI Research & Calibration"
        icon={IconResearch}
        expanded={expanded}
        onToggle={onToggle}
        sectionRef={sectionRef}
      >
        <p className="text-muted-foreground text-sm">AI-powered market research uses Claude Sonnet to analyze markets and provide assumption calibration guidance. Research is available at the property level and globally.</p>
        <ManualTable
          headers={["Research Area", "What It Produces", "Badge Fields Affected"]}
          rows={[
            ["ADR Analysis", "Market ADR benchmarks, competitive set comparison, growth trends", "Starting ADR, ADR Annual Growth (3–5%)"],
            ["Occupancy Analysis", "Seasonal patterns, market penetration rates, ramp-up timelines", "Starting Occupancy, Occupancy Growth Step (4–6%)"],
            ["Cap Rate Analysis", "Market cap rates by location and property type", "Exit Cap Rate"],
            ["Revenue Mix", "F&B, events, and other revenue benchmarks for the market", "Events Share (20–35%), F&B Share (15–25%), Other Share (3–8%)"],
            ["Disposition", "Sale commission norms by market", "Sale Commission (4–6%)"],
          ]}
        />
        <p className="text-muted-foreground text-sm mt-2">When research is available, amber research badges appear next to assumption fields showing the AI-recommended market range. Click a badge to auto-fill the recommended value.</p>
      </SectionCard>
    );
  }
  