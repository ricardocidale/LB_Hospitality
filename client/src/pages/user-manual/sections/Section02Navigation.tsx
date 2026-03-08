import { SectionCard } from "@/components/ui/section-card";
import { ManualTable } from "@/components/ui/manual-table";
import { Callout } from "@/components/ui/callout";
import { IconPanelLeft } from "@/components/icons/brand-icons";

interface SectionProps {
  expanded: boolean;
  onToggle: () => void;
  sectionRef: (el: HTMLDivElement | null) => void;
}

export default function Section02Navigation({ expanded, onToggle, sectionRef }: SectionProps) {
  return (
    <SectionCard
      id="navigation"
      title="2. Navigating the Portal"
      icon={IconPanelLeft}
      variant="light"
      expanded={expanded}
      onToggle={onToggle}
      sectionRef={sectionRef}
    >
      <p className="text-sm text-muted-foreground">
        The sidebar on the left is your primary navigation. It shows different menu items depending on your role.
        On mobile, a bottom navigation bar provides access to the most common pages.
      </p>

      <ManualTable
        variant="light"
        headers={["Menu Item", "What It Does", "Who Can See It"]}
        rows={[
          ["Dashboard", "Portfolio overview with KPI cards and consolidated charts", "Everyone"],
          ["Properties", "View and manage individual hotel properties", "Everyone"],
          ["Management Co.", "Management company financials and assumptions", "Partners, Admins"],
          ["Analysis", "Sensitivity and financing analysis tools", "Partners, Admins"],
          ["Systemwide Assumptions", "Configure model-wide parameters like inflation and staffing", "Partners, Admins"],
          ["Scenarios", "Save and load different assumption snapshots", "Partners, Admins"],
          ["Property Finder", "Search for prospective investment properties", "Partners, Admins"],
          ["Help", "User Manual, Checker Manual, and Guided Tour", "Everyone"],
          ["My Profile", "Account settings and password management", "Everyone"],
          ["Admin Settings", "User management, verification, branding, and system tools", "Admins only"],
        ]}
      />

      <Callout variant="light">
        Use the Guided Tour (under Help) for an interactive walkthrough of the interface.
      </Callout>
    </SectionCard>
  );
}
