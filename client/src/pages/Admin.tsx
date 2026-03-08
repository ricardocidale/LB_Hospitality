import { useState } from "react";
import Layout from "@/components/Layout";
import { PageHeader } from "@/components/ui/page-header";
import { TooltipProvider } from "@/components/ui/tooltip";
import AdminSidebar, { type AdminSection, navGroups, getGroupForSection } from "@/components/admin/AdminSidebar";
import {
  UsersTab, CompaniesTab, ActivityTab, VerificationTab,
  UserGroupsTab, DatabaseTab, MarcelaTab, ServicesTab,
  MarketRatesTab, ResearchTab
} from "@/components/admin";
import BrandingTab from "@/components/admin/BrandingTab";
import ThemesTab from "@/components/admin/ThemesTab";
import LogosTab from "@/components/admin/LogosTab";
import NavigationTab from "@/components/admin/NavigationTab";
import { AnimatedPage } from "@/components/graphics/motion/AnimatedPage";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const sectionMeta: Record<AdminSection, { title: string; subtitle: string }> = {
  users:        { title: "Users",          subtitle: "Manage user accounts, roles, and passwords" },
  groups:       { title: "User Groups",    subtitle: "Branded groups with shared themes, logos, and labels" },
  activity:     { title: "Activity",       subtitle: "Login logs, audit trail, and session monitoring" },
  branding:     { title: "Branding",       subtitle: "Company name, logo, property labels, and asset descriptions" },
  themes:       { title: "Themes",         subtitle: "Color palettes and visual styles for the platform" },
  logos:        { title: "Logos",           subtitle: "Upload, generate, and manage logo images" },
  navigation:   { title: "Navigation",     subtitle: "Control which sidebar pages are visible to users" },
  companies:    { title: "Companies",      subtitle: "Management company and special purpose vehicles" },
  services:     { title: "Services",       subtitle: "Service templates, markup rates, and property sync" },
  "market-rates": { title: "Market Rates", subtitle: "Live economic data, FRED/BLS rates, and manual overrides" },
  research:     { title: "Research",       subtitle: "Configure AI research behavior — tools, focus areas, and custom context per event" },
  marcela:      { title: "AI Agent",       subtitle: "Configure Marcela — voice, prompt, tools, and telephony" },
  verification: { title: "Verification",   subtitle: "Independent GAAP financial audit and compliance" },
  database:     { title: "Database",       subtitle: "Entity monitoring, seed data, and canonical sync" },
};

function SectionContent({ section, onNavigate }: { section: AdminSection; onNavigate: (s: AdminSection) => void }) {
  switch (section) {
    case "users":        return <UsersTab />;
    case "groups":       return <UserGroupsTab />;
    case "activity":     return <ActivityTab />;
    case "branding":     return <BrandingTab onNavigate={(tab: string) => { if (tab === "logos") onNavigate("logos"); else if (tab === "themes") onNavigate("themes"); else if (tab === "groups") onNavigate("groups"); }} />;
    case "themes":       return <ThemesTab />;
    case "logos":        return <LogosTab />;
    case "navigation":   return <NavigationTab />;
    case "companies":    return <CompaniesTab />;
    case "services":     return <ServicesTab />;
    case "market-rates": return <MarketRatesTab />;
    case "research":     return <ResearchTab />;
    case "marcela":      return (
      <ErrorBoundary fallback={
        <div className="mt-6 p-8 flex flex-col items-center gap-4 text-center rounded-xl border border-amber-200/60 bg-amber-50/40">
          <AlertTriangle className="w-10 h-10 text-amber-500" />
          <div>
            <p className="font-semibold text-foreground">AI Agent configuration failed to load</p>
            <p className="text-sm text-muted-foreground mt-1">A component error occurred. Reload the page to try again.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Reload page
          </Button>
        </div>
      }><MarcelaTab /></ErrorBoundary>
    );
    case "verification": return <VerificationTab />;
    case "database":     return <DatabaseTab />;
    default:             return null;
  }
}

export default function Admin() {
  const [activeSection, setActiveSection] = useState<AdminSection>("users");

  const meta = sectionMeta[activeSection];
  const activeGroupId = getGroupForSection(activeSection);
  const activeGroup = navGroups.find((g) => g.id === activeGroupId);

  return (
    <AnimatedPage>
    <TooltipProvider>
      <Layout>
        <div className="space-y-5">
          <PageHeader
            title={meta.title}
            subtitle={meta.subtitle}
            variant="dark"
            actions={
              activeGroup ? (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border">
                  {activeGroup.icon && <activeGroup.icon className="w-3.5 h-3.5 text-white/60" />}
                  <span className="text-xs font-medium text-white/70">{activeGroup.label}</span>
                </div>
              ) : undefined
            }
          />

          <div className="flex gap-6 items-start">
            <AdminSidebar
              activeSection={activeSection}
              onSectionChange={setActiveSection}
            />

            <div className="flex-1 min-w-0">
              <div className="space-y-6" data-testid={`admin-content-${activeSection}`}>
                <SectionContent section={activeSection} onNavigate={setActiveSection} />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </TooltipProvider>
    </AnimatedPage>
  );
}
