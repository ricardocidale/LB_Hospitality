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
    <nav className="flex flex-col gap-3 py-4 px-3">
      {navGroups.map((group) => {
        const isGroupActive = group.id === activeGroup;
        const GroupIcon = group.icon;

        return (
          <div
            key={group.id}
            className={cn(
              "rounded-2xl border transition-all duration-300 overflow-hidden",
              isGroupActive
                ? "border-primary/30 bg-primary/[0.06] shadow-[0_4px_20px_rgba(159,188,164,0.15)]"
                : "border-primary/10 bg-white/50"
            )}
          >
            <div className="px-3.5 pt-3 pb-0">
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-primary/15">
                <div
                  className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300",
                    isGroupActive
                      ? "bg-gradient-to-br from-[#2d4a5e] to-[#3a5a5e] shadow-sm shadow-[#2d4a5e]/20"
                      : "bg-gray-200/70"
                  )}
                >
                  <GroupIcon className={cn("w-3.5 h-3.5", isGroupActive ? "text-white/90" : "text-gray-500")} />
                </div>
                <span
                  className={cn(
                    "text-[10.5px] font-extrabold uppercase tracking-[0.12em] transition-colors",
                    isGroupActive ? "text-[#2d4a3e]" : "text-gray-400"
                  )}
                >
                  {group.label}
                </span>
              </div>
            </div>

            <div className="px-2 py-2 space-y-0.5">
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
                      "relative w-full flex items-center gap-2.5 px-3 py-[8px] rounded-xl text-left transition-all duration-200 group/item cursor-pointer",
                      isActive
                        ? "bg-[#2d4a3e] text-white shadow-[0_2px_10px_rgba(45,74,62,0.3)]"
                        : "text-gray-600 hover:bg-primary/8 hover:text-gray-900"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-[15px] h-[15px] shrink-0 transition-colors",
                        isActive
                          ? "text-white/80"
                          : "text-gray-400 group-hover/item:text-primary"
                      )}
                    />
                    <span
                      className={cn(
                        "text-[13px] transition-colors truncate",
                        isActive ? "font-semibold" : "font-medium"
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
        className="lg:hidden fixed bottom-4 right-4 z-50 w-12 h-12 rounded-2xl bg-[#2d4a3e] text-white shadow-lg shadow-[#2d4a3e]/30 flex items-center justify-center"
        data-testid="admin-mobile-menu-toggle"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
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
        <div className="h-full lg:h-auto bg-white/80 backdrop-blur-2xl border border-primary/15 rounded-none lg:rounded-2xl shadow-[0_8px_32px_rgba(159,188,164,0.12)] overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-primary/15">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2d4a5e] to-[#3a5a5e] flex items-center justify-center shadow-md shadow-[#2d4a5e]/20">
                <Settings className="w-[18px] h-[18px] text-white/90" />
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-gray-900 font-display">Admin</h3>
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
