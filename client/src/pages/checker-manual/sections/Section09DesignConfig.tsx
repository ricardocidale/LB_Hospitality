import { SectionCard } from "@/components/ui/section-card";
  import { ManualTable } from "@/components/ui/manual-table";
  import { Callout } from "@/components/ui/callout";
  import { IconSwatchBook } from "@/components/icons/brand-icons";

  interface SectionProps {
    expanded: boolean;
    onToggle: () => void;
    sectionRef: (el: HTMLDivElement | null) => void;
  }

  export default function Section09DesignConfig({ expanded, onToggle, sectionRef }: SectionProps) {
    return (
      <SectionCard
        id="design-config"
        title="9. Design Configuration"
        icon={IconSwatchBook}
        expanded={expanded}
        onToggle={onToggle}
        sectionRef={sectionRef}
      >
        <ManualTable
          headers={["Element", "Value"]}
          rows={[
            ["Primary Color", "Sage Green (#9FBCA4)"],
            ["Secondary Color", "Green (#257D41)"],
            ["Background", "Warm Off-White (#FFF9F5)"],
            ["Accent", "Coral (#E07A5F)"],
            ["Heading Font", "Playfair Display (serif)"],
            ["Body Font", "Inter (sans-serif)"],
            ["Dark Theme", "Glass effect with backdrop blur"],
            ["Light Theme", "Clean white cards for assumption pages"],
          ]}
        />
      </SectionCard>
    );
  }
  