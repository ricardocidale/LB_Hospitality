import { SectionCard } from "@/components/ui/section-card";
  import { ManualTable } from "@/components/ui/manual-table";
  import { Callout } from "@/components/ui/callout";
  import { FolderOpen } from "lucide-react";

  interface SectionProps {
    expanded: boolean;
    onToggle: () => void;
    sectionRef: (el: HTMLDivElement | null) => void;
  }

  export default function Section10ScenarioMgmt({ expanded, onToggle, sectionRef }: SectionProps) {
    return (
      <SectionCard
        id="scenario-mgmt"
        title="10. Scenario Management"
        icon={FolderOpen}
        expanded={expanded}
        onToggle={onToggle}
        sectionRef={sectionRef}
      >
        <ManualTable
          headers={["Action", "Description", "Effect"]}
          rows={[
            ["Save", "Snapshot current assumptions + properties", "Creates named copy"],
            ["Load", "Restore saved scenario", "Replaces current state"],
            ["Save", "Modify scenario name/description", "Metadata only"],
            ["Delete", "Remove scenario permanently", "Cannot be undone"],
          ]}
        />
        <Callout>Save a baseline scenario before any testing. Create separate test scenarios for each verification round.</Callout>
      </SectionCard>
    );
  }
  