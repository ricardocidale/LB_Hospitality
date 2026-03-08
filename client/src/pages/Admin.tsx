import { useState } from "react";
import Layout from "@/components/Layout";
import { PageHeader } from "@/components/ui/page-header";
import { TooltipProvider } from "@/components/ui/tooltip";
import AdminSidebar, { type AdminSection, navGroups, getGroupForSection } from "@/components/admin/AdminSidebar";
import {
  CompaniesTab, ActivityTab, VerificationTab,
  DatabaseTab, MarcelaTab,
} from "@/components/admin";
import PeopleTab from "@/components/admin/PeopleTab";
import ManagementCompanyTab from "@/components/admin/ManagementCompanyTab";
import ResearchCenterTab from "@/components/admin/ResearchCenterTab";
import ThemesTab from "@/components/admin/ThemesTab";
import LogosTab from "@/components/admin/LogosTab";
import NavigationTab from "@/components/admin/NavigationTab";
import { AnimatedPage } from "@/components/graphics/motion/AnimatedPage";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const sectionMeta: Record<AdminSection, { title: string; subtitle: string }> = {
  users:        { title: "Users",            subtitle: "Manage user accounts and group assignments" },
  activity:     { title: "Activity",       subtitle: "Login logs, audit trail, and session monitoring" },
  branding:     { title: "Hospitality Brand", subtitle: "Identity, asset definition, and centralized services" },
  themes:       { title: "Themes",         subtitle: "Color palettes and visual styles for the platform" },
  logos:        { title: "Logos",           subtitle: "Upload, generate, and manage logo images" },
  navigation:   { title: "Navigation",     subtitle: "Control which sidebar pages are visible to users" },
  companies:    { title: "Companies",      subtitle: "Management company and special purpose vehicles" },
  research:     { title: "Research Center", subtitle: "AI research configuration and live market rate monitoring" },
  marcela:      { title: "AI Agent",       subtitle: "Configure Marcela — voice, prompt, tools, and telephony" },
  verification: { title: "Verification",   subtitle: "Independent GAAP financial audit and compliance" },
  database:     { title: "Database",       subtitle: "Entity monitoring, seed data, and canonical sync" },
};

function SectionContent({ section, onNavigate }: { section: AdminSection; onNavigate: (s: AdminSection) => void }) {
  switch (section) {
    case "users":        return <PeopleTab />;
    case "activity":     return <ActivityTab />;
    case "branding":     return <ManagementCompanyTab onNavigate={(tab: string) => { if (tab === "logos") onNavigate("logos"); else if (tab === "themes") onNavigate("themes"); else if (tab === "users") onNavigate("users"); }} />;
    case "themes":       return <ThemesTab />;
    case "logos":        return <LogosTab />;
    case "navigation":   return <NavigationTab />;
    case "companies":    return <CompaniesTab />;
    case "research":     return <ResearchCenterTab />;
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
