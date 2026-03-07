import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Users, UserRoundCog, Activity, Image, SwatchBook, Upload, PanelLeft,
  Building2, Package, TrendingUp, Bot, FileCheck, Database,
  Shield, Settings, Menu, X
} from "lucide-react";

export type AdminSection =
  | "users" | "groups" | "activity"
  | "branding" | "themes" | "logos" | "navigation"
  | "companies" | "services" | "market-rates"
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
    icon: Users,
    description: "Users, groups & activity",
    sections: [
      { value: "users", label: "Users", icon: UserRoundCog },
      { value: "groups", label: "Groups", icon: Users },
      { value: "activity", label: "Activity", icon: Activity },
    ],
  },
  {
    id: "platform",
    label: "Platform",
    icon: SwatchBook,
    description: "Look, feel & navigation",
    sections: [
      { value: "branding", label: "Branding", icon: Image },
      { value: "themes", label: "Themes", icon: SwatchBook },
      { value: "logos", label: "Logos", icon: Upload },
      { value: "navigation", label: "Navigation", icon: PanelLeft },
    ],
  },
  {
    id: "business",
    label: "Business",
    icon: Building2,
    description: "Entities, services & rates",
    sections: [
      { value: "companies", label: "Companies", icon: Building2 },
      { value: "services", label: "Services", icon: Package },
      { value: "market-rates", label: "Market Rates", icon: TrendingUp },
    ],
  },
  {
    id: "ai-agent",
    label: "AI Agent",
    icon: Bot,
    description: "Marcela configuration",
    sections: [
      { value: "marcela", label: "Configuration", icon: Bot },
    ],
  },
  {
    id: "system",
    label: "System",
    icon: Shield,
    description: "Verification & database",
    sections: [
      { value: "verification", label: "Verification", icon: FileCheck },
      { value: "database", label: "Database", icon: Database },
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
    <nav className="flex flex-col gap-1 py-3 px-3">
      {navGroups.map((group) => {
        const isGroupActive = group.id === activeGroup;
        const GroupIcon = group.icon;

        return (
          <div key={group.id} className="mb-1">
            <div className="px-3 pt-3 pb-1.5">
              <div className="flex items-center gap-2">
                <GroupIcon className={cn("w-3.5 h-3.5", isGroupActive ? "text-foreground" : "text-muted-foreground")} />
                <span
                  className={cn(
                    "text-[10.5px] font-semibold uppercase tracking-[0.08em]",
                    isGroupActive ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {group.label}
                </span>
              </div>
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
                        "w-[15px] h-[15px] shrink-0 transition-colors",
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
          className="lg:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
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
        <div className="h-full lg:h-auto bg-white border border-border/80 rounded-none lg:rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-border/80">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Settings className="w-4 h-4 text-white" />
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
