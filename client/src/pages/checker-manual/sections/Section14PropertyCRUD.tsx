import { SectionCard } from "@/components/ui/section-card";
  import { ManualTable } from "@/components/ui/manual-table";
  import { Callout } from "@/components/ui/callout";
  import { IconImage } from "@/components/icons/brand-icons";

  interface SectionProps {
    expanded: boolean;
    onToggle: () => void;
    sectionRef: (el: HTMLDivElement | null) => void;
  }

  export default function Section14PropertyCRUD({ expanded, onToggle, sectionRef }: SectionProps) {
    return (
      <SectionCard
        id="property-crud"
        title="14. Property CRUD & Images"
        icon={IconImage}
        expanded={expanded}
        onToggle={onToggle}
        sectionRef={sectionRef}
      >
        <ManualTable
          headers={["Feature", "Description", "Business Logic"]}
          rows={[
            ["Add Property", "Create new SPV entity", "Initializes with global defaults; increments portfolio count"],
            ["Edit Property", "Modify assumptions", "Triggers instant recalculation across all tabs"],
            ["Delete Property", "Remove SPV from portfolio", "Removes from consolidated financials; cannot be undone"],
            ["Image Management", "Upload and crop property photos", "Uses AspectRatio 16:9; stored as base64 in local state / DB"],
          ]}
        />
      </SectionCard>
    );
  }
