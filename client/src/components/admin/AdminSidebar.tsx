import { IconActivity, IconBookOpen, IconBot, IconBriefcase, IconDatabase, IconFileCheck, IconHelpCircle, IconImage, IconLink, IconMenu, IconPanelLeft, IconPhone, IconProperties, IconResearch, IconSettingsGear, IconShield, IconSwatchBook, IconTrending, IconUpload, IconUserCog, IconX, useState } from "@/components/icons/brand-icons";

export type AdminSection =
  | "users" | "activity"
  | "branding" | "icp" | "revshare" | "otherassumptions"
  | "companies" | "groups"
  | "logos" | "themes"
  | "marcela" | "kb" | "twilio"
  | "research" | "navigation" | "verification" | "database";

interface SectionItem {
  value: AdminSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  sections: SectionItem[];
}

const navGroups: NavGroup[] = [
  {
    id: "brand",
    label: "Brand",
    icon: IconImage,
    description: "Management company & services",
    sections: [
      { value: "branding", label: "Management Company", icon: IconImage },
      { value: "icp", label: "Ideal Customer Profile", icon: IconPeople },
      { value: "revshare", label: "Revenue Share", icon: IconTrending },
      { value: "otherassumptions", label: "Other Assumptions", icon: IconSettingsGear },
    ],
  },
  {
    id: "business",
    label: "Business",
    icon: IconBriefcase,
    description: "Users, companies & groups",
    sections: [
      { value: "users", label: "Users", icon: IconPeople },
      { value: "companies", label: "Companies", icon: IconProperties },
      { value: "groups", label: "Groups", icon: IconUserCog },
    ],
  },
  {
    id: "design",
    label: "Design",
    icon: IconSwatchBook,
    description: "Logos & themes",
    sections: [
      { value: "logos", label: "Logos", icon: IconImage },
      { value: "themes", label: "Themes", icon: IconSwatchBook },
    ],
  },
  {
    id: "ai-agent",
    label: "AI Agent",
    icon: IconBot,
    description: "Marcela configuration",
    sections: [
      { value: "marcela", label: "Configuration", icon: IconBot },
      { value: "kb", label: "Knowledge Base", icon: IconBookOpen },
      { value: "twilio", label: "Twilio", icon: IconPhone },
    ],
  },
  {
    id: "system",
    label: "System",
    icon: IconShield,
    description: "Research & infrastructure",
    sections: [
      { value: "research", label: "Research", icon: IconResearch },
      { value: "navigation", label: "Navigation", icon: IconPanelLeft },
      { value: "verification", label: "Verification", icon: IconFileCheck },
      { value: "database", label: "Database", icon: IconDatabase },
    ],
  },
];

function getGroupForSection(section: AdminSection): string {
  for (const group of navGroups) {
    if (group.sections.some((s) => s.value === section)) return group.id;
  }
  return "brand";
}

interface AdminSidebarProps {
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
}

export default function AdminSidebar({ activeSection, onSectionChange }: AdminSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeGroup = getGroupForSection(activeSection);

  const sidebarContent = (
    <nav className="flex flex-col gap-0.5 py-3 px-3">
      {navGroups.map((group) => {
        const isGroupActive = group.id === activeGroup;

        return (
          <div key={group.id} className="mb-0.5">
            <div className="px-3 pt-4 pb-1">
              <span
                className={cn(
                  "text-[11px] font-medium",
                  isGroupActive ? "text-primary" : "text-primary/60"
                )}
              >
                {group.label}
              </span>
            </div>

            <div className="space-y-0.5">
              {group.sections.map((section) => {
                const isActive = activeSection === section.value;
                const Icon = section.icon;
                return (
                  <button
                    key={section.value}
                    onClick={() => {
                      onSectionChange(section.value);
                      setMobileOpen(false);
                    }}
                    data-testid={`admin-nav-${section.value}`}
                    className={cn(
                      "relative w-full flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-left transition-all duration-150 group/item cursor-pointer",
                      isActive
                        ? "bg-muted text-foreground font-medium"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4 shrink-0 transition-colors",
                        isActive
                          ? "text-foreground"
                          : "text-muted-foreground group-hover/item:text-muted-foreground"
                      )}
                    />
                    <span
                      className={cn(
                        "text-[13px] transition-colors truncate",
                        isActive ? "font-medium" : "font-normal"
                      )}
                    >
                      {section.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="mt-1 pt-2 border-t border-border/60">
        <div className="px-3 pt-2 pb-1">
          <span className="text-[11px] font-medium text-primary/60">
            Logs
          </span>
        </div>
        <button
          onClick={() => {
            onSectionChange("activity");
            setMobileOpen(false);
          }}
          data-testid="admin-nav-activity"
          className={cn(
            "relative w-full flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-left transition-all duration-150 group/item cursor-pointer",
            activeSection === "activity"
              ? "bg-muted text-foreground font-medium"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          <IconActivity
            className={cn(
              "w-4 h-4 shrink-0 transition-colors",
              activeSection === "activity"
                ? "text-foreground"
                : "text-muted-foreground group-hover/item:text-muted-foreground"
            )}
          />
          <span
            className={cn(
              "text-[13px] transition-colors truncate",
              activeSection === "activity" ? "font-medium" : "font-normal"
            )}
          >
            Activity
          </span>
        </button>
      </div>

      <div className="mt-1 pt-2 border-t border-border/60">
        <IconLink
          href="/help"
          data-testid="admin-nav-help"
          className="relative w-full flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-left transition-all duration-150 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <IconHelpCircle className="w-4 h-4 shrink-0" />
          <span className="text-[13px] font-normal">Help</span>
        </IconLink>
      </div>
    </nav>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed bottom-4 right-4 z-50 w-12 h-12 rounded-xl bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
        data-testid="admin-mobile-menu-toggle"
      >
        {mobileOpen ? <IconX className="w-5 h-5" /> : <IconMenu className="w-5 h-5" />}
      </button>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "lg:sticky lg:top-4 lg:self-start",
          "fixed inset-y-0 left-0 z-40 w-[240px]",
          "lg:relative lg:z-0",
          "transition-transform duration-300 ease-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="h-full lg:h-auto bg-card border border-border/80 rounded-none lg:rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-border/80">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <IconSettingsGear className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Admin</h3>
                <p className="text-[11px] text-muted-foreground">Settings & Configuration</p>
              </div>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[calc(100vh-120px)] lg:max-h-[calc(100vh-200px)] scrollbar-thin">
            {sidebarContent}
          </div>
        </div>
      </aside>
    </>
  );
}

export { navGroups, getGroupForSection };
export type { NavGroup, SectionItem };
