import { useState } from "react";
import { cn } from "@/lib/utils";
import { Menu, X, FlaskConical, HelpCircle } from "lucide-react";
import { Link } from "wouter";
import {
  IconPeople, IconUserCog, IconActivity, IconImage, IconSwatchBook,
  IconUpload, IconPanelLeft, IconProperties, IconPackage, IconTrending,
  IconBot, IconFileCheck, IconDatabase, IconShield, IconSettingsGear,
} from "@/components/icons/brand-icons";

export type AdminSection =
  | "users" | "groups" | "activity"
  | "branding" | "themes" | "logos" | "navigation"
  | "companies" | "market-rates" | "research"
  | "marcela"
  | "verification" | "database";

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
    id: "people",
    label: "People",
    icon: IconPeople,
    description: "Users, groups & activity",
    sections: [
      { value: "users", label: "Users", icon: IconUserCog },
      { value: "groups", label: "Groups", icon: IconPeople },
      { value: "activity", label: "Activity", icon: IconActivity },
    ],
  },
  {
    id: "platform",
    label: "Platform",
    icon: IconSwatchBook,
    description: "Look, feel & branding",
    sections: [
      { value: "branding", label: "Hospitality Brand", icon: IconImage },
      { value: "themes", label: "Themes", icon: IconSwatchBook },
      { value: "logos", label: "Logos", icon: IconUpload },
    ],
  },
  {
    id: "business",
    label: "Business",
    icon: IconProperties,
    description: "Entities, services & rates",
    sections: [
      { value: "companies", label: "Companies", icon: IconProperties },
      { value: "market-rates", label: "Market Rates", icon: IconTrending },
      { value: "research", label: "Research", icon: FlaskConical },
    ],
  },
  {
    id: "ai-agent",
    label: "AI Agent",
    icon: IconBot,
    description: "Marcela configuration",
    sections: [
      { value: "marcela", label: "Configuration", icon: IconBot },
    ],
  },
  {
    id: "system",
    label: "System",
    icon: IconShield,
    description: "Verification, database & navigation",
    sections: [
      { value: "verification", label: "Verification", icon: IconFileCheck },
      { value: "database", label: "Database", icon: IconDatabase },
      { value: "navigation", label: "Navigation", icon: IconPanelLeft },
    ],
  },
];

function getGroupForSection(section: AdminSection): string {
  for (const group of navGroups) {
    if (group.sections.some((s) => s.value === section)) return group.id;
  }
  return "people";
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
                  isGroupActive ? "text-foreground" : "text-muted-foreground"
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
        <Link
          href="/help"
          data-testid="admin-nav-help"
          className="relative w-full flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-left transition-all duration-150 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <HelpCircle className="w-4 h-4 shrink-0" />
          <span className="text-[13px] font-normal">Help</span>
        </Link>
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
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
