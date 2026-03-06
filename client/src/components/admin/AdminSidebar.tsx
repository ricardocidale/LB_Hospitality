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
    <nav className="flex flex-col gap-2.5 py-3 px-3">
      {navGroups.map((group) => {
        const isGroupActive = group.id === activeGroup;
        const GroupIcon = group.icon;

        return (
          <div
            key={group.id}
            className={cn(
              "rounded-xl border transition-all duration-300 overflow-hidden",
              isGroupActive
                ? "border-primary/20 bg-gradient-to-b from-primary/[0.04] to-primary/[0.02] shadow-[0_2px_12px_rgba(159,188,164,0.1)]"
                : "border-gray-100 bg-white/60 hover:border-gray-200 hover:bg-white/80"
            )}
          >
            <div
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 border-b transition-colors",
                isGroupActive
                  ? "border-primary/10 bg-primary/[0.06]"
                  : "border-transparent"
              )}
            >
              <div
                className={cn(
                  "w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-all duration-200",
                  isGroupActive
                    ? "bg-primary/15 text-primary"
                    : "bg-gray-100 text-gray-400"
                )}
              >
                <GroupIcon className="w-3 h-3" />
              </div>
              <span
                className={cn(
                  "text-[10.5px] font-bold uppercase tracking-[0.1em] transition-colors",
                  isGroupActive ? "text-primary" : "text-gray-400"
                )}
              >
                {group.label}
              </span>
            </div>

            <div className="px-1.5 py-1.5 space-y-0.5">
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
                      "relative w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-left transition-all duration-200 group/item cursor-pointer",
                      isActive
                        ? "bg-primary/12 text-primary"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-primary rounded-r-full" />
                    )}
                    <Icon
                      className={cn(
                        "w-[15px] h-[15px] shrink-0 transition-colors",
                        isActive
                          ? "text-primary"
                          : "text-gray-400 group-hover/item:text-gray-600"
                      )}
                    />
                    <span
                      className={cn(
                        "text-[13px] transition-colors truncate",
                        isActive ? "text-primary font-semibold" : "font-medium"
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
        className="lg:hidden fixed bottom-4 right-4 z-50 w-12 h-12 rounded-2xl bg-primary text-white shadow-lg shadow-primary/25 flex items-center justify-center"
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
          "fixed inset-y-0 left-0 z-40 w-[260px]",
          "lg:relative lg:z-0",
          "transition-transform duration-300 ease-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="h-full lg:h-auto bg-white/80 backdrop-blur-2xl border border-primary/10 rounded-none lg:rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.06)] lg:shadow-[0_8px_32px_rgba(159,188,164,0.1)] overflow-hidden">
          <div className="px-5 pt-5 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2d4a5e] to-[#3a5a5e] flex items-center justify-center shadow-md">
                <Settings className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 font-display">Admin</h3>
                <p className="text-[11px] text-gray-400">Settings & Configuration</p>
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
