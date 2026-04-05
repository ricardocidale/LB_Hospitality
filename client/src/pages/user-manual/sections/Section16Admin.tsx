import { SectionCard } from "@/components/ui/section-card";
import { ManualTable } from "@/components/ui/manual-table";
import { IconShield } from "@/components/icons";interface SectionProps {
  expanded: boolean;
  onToggle: () => void;
  sectionRef: (el: HTMLDivElement | null) => void;
}

export default function Section16Admin({ expanded, onToggle, sectionRef }: SectionProps) {
  return (
    <SectionCard
      id="admin"
      title="16. Admin Settings"
      icon={IconShield}
      variant="light"
      expanded={expanded}
      onToggle={onToggle}
      sectionRef={sectionRef}
    >
      <p className="text-sm text-muted-foreground">
        Admin Settings is available only to users with the Admin role. It provides system-wide configuration and management tools.
      </p>

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-semibold mb-2">Admin Tabs</h4>
        <ManualTable
          variant="light"
          headers={["Tab", "Purpose"]}
          rows={[
            ["Users", "Manage user accounts — create, edit, assign roles and groups, reset passwords"],
            ["Companies", "Configure company entities and their details"],
            ["User Groups", "Create and manage groups for organizing users and applying group-level branding"],
            ["Logos", "Upload and manage logos used across the portal and in exports"],
            ["Branding", "Configure colors, fonts, and visual identity for different user groups"],
            ["Themes", "Manage the design themes available in the system"],
            ["Navigation", "Control which sidebar items are visible to different user roles"],
            ["Verification", "Run the financial verification engine and review audit results"],
            ["Activity", "View system activity logs and user actions"],
            ["Database", "Database management tools for administrators"],
          ]}
        />
      </div>
    </SectionCard>
  );
}
