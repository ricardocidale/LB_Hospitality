import { SectionCard } from "@/components/ui/section-card";
  import { ManualTable } from "@/components/ui/manual-table";
  import { Callout } from "@/components/ui/callout";
  import { IconVerify } from "@/components/icons";interface SectionProps {
    expanded: boolean;
    onToggle: () => void;
    sectionRef: (el: HTMLDivElement | null) => void;
  }

  export default function Section15TestingMethodology({ expanded, onToggle, sectionRef }: SectionProps) {
    return (
      <SectionCard
        id="testing-methodology"
        title="15. Testing Methodology"
        icon={IconVerify}
        expanded={expanded}
        onToggle={onToggle}
        sectionRef={sectionRef}
      >
        <ManualTable
          headers={["Method", "Description", "Target"]}
          rows={[
            ["Unit Tests", "Vitest suite for core calculation functions", "loanCalculations, equityCalculations, financialEngine"],
            ["Golden Tests", "Comparison of engine output against known correct snapshots", "Full pro-forma outputs"],
            ["Identity Tests", "Verifying BS/CF/IS identities hold across 10 years", "Data integrity"],
            ["Manual Sync", "Cross-checking UI values against Excel export", "End-to-end verification"],
          ]}
        />
      </SectionCard>
    );
  }
  