import { SectionCard } from "@/components/ui/section-card";
import { Callout } from "@/components/ui/callout";
import { IconScenarios } from "@/components/icons/brand-icons";

interface SectionProps {
  expanded: boolean;
  onToggle: () => void;
  sectionRef: (el: HTMLDivElement | null) => void;
}

export default function Section09Scenarios({ expanded, onToggle, sectionRef }: SectionProps) {
  return (
    <SectionCard
      id="scenarios"
      title="9. Scenarios"
      icon={IconScenarios}
      variant="light"
      expanded={expanded}
      onToggle={onToggle}
      sectionRef={sectionRef}
    >
      <p className="text-sm text-muted-foreground">
        Scenarios let you save and load different sets of assumptions to compare "what if" situations.
      </p>

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-semibold mb-2">Saving a Scenario</h4>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>&#8226; Go to the <strong>Scenarios</strong> page from the sidebar.</li>
          <li>&#8226; Click <strong>"Save Current Scenario"</strong>.</li>
          <li>&#8226; Give it a descriptive name (e.g., "Base Case", "Conservative", "Aggressive Growth").</li>
          <li>&#8226; All current systemwide and property-level assumptions are captured in the snapshot.</li>
        </ul>
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-semibold mb-2">Loading a Scenario</h4>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>&#8226; Select a previously saved scenario from the list.</li>
          <li>&#8226; Click <strong>"Load"</strong> to restore all assumptions from that snapshot.</li>
          <li>&#8226; The entire portfolio recalculates with the loaded assumptions.</li>
        </ul>
      </div>

      <Callout variant="light">
        Loading a scenario replaces all current assumptions. Save your current work before loading a different scenario.
      </Callout>
    </SectionCard>
  );
}
