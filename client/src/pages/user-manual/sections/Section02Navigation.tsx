import { SectionCard } from "@/components/ui/section-card";
import { ManualTable } from "@/components/ui/manual-table";
import { Callout } from "@/components/ui/callout";
import { IconPanelLeft } from "@/components/icons";interface SectionProps {
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
          ["Simulation", "Four-tab modeling suite: Sensitivity, Compare, Timeline, and Financing analysis", "Partners, Admins"],
          ["Research Hub", "AI-generated market research for properties, company operations, and global industry trends", "Partners, Admins"],
          ["Systemwide Assumptions", "Configure model-wide parameters like inflation and staffing", "Partners, Admins"],
          ["Scenarios", "Save and load different assumption snapshots", "Partners, Admins"],
          ["Property Finder", "Search for prospective investment properties on the external market", "Partners, Admins"],
          ["Help", "User Manual, Checker Manual, and Guided Tour", "Everyone"],
          ["My Profile", "Account settings and password management", "Everyone"],
          ["Admin Settings", "User management, verification, branding, and system tools", "Admins only"],
        ]}
      />

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-semibold mb-2">Research Status Indicator</h4>
        <p className="text-sm text-muted-foreground">
          At the bottom of the sidebar, a compact <strong>Research</strong> panel shows the freshness of your AI-generated
          market research across four categories: <strong>Property</strong>, <strong>Operations</strong>, <strong>Marketing</strong>, and <strong>Industry</strong>.
        </p>
        <ul className="text-sm text-muted-foreground space-y-1 mt-2">
          <li>&#8226; <strong className="text-emerald-600">Green dot</strong> — research is current (within the configured refresh interval)</li>
          <li>&#8226; <strong className="text-red-600">Red dot</strong> — research is stale or has never been generated</li>
        </ul>
        <p className="text-sm text-muted-foreground mt-2">
          Click the panel to navigate to the Research Hub and regenerate any stale research.
        </p>
      </div>

      <Callout variant="light">
        Use the Guided Tour (under Help) for an interactive walkthrough of the interface.
      </Callout>
    </SectionCard>
  );
}
