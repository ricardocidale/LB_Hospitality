import { useState, useCallback, useEffect } from "react";
import Layout from "@/components/Layout";
import { PageHeader } from "@/components/ui/page-header";
import { TooltipProvider } from "@/components/ui/tooltip";
import { type AdminSection } from "@/components/admin/AdminSidebar";
import {
  CompaniesTab, ActivityTab, VerificationTab,
  DatabaseTab,
} from "@/components/admin";
import PeopleTab from "@/components/admin/PeopleTab";
import BrandingTab from "@/components/admin/BrandingTab";
import { IcpContent } from "@/pages/Icp";
import RevenueShareTab from "@/components/admin/RevenueShareTab";
import OtherAssumptionsTab from "@/components/admin/OtherAssumptionsTab";
import GroupsTab from "@/components/admin/GroupsTab";
import LogosTab from "@/components/admin/LogosTab";
import ThemesTab from "@/components/admin/ThemesTab";
import ResearchCenterTab from "@/components/admin/ResearchCenterTab";
import NavigationTab from "@/components/admin/NavigationTab";
import AIAgentsTab from "@/components/admin/AIAgentsTab";
import DiagramsTab from "@/components/admin/DiagramsTab";
import IntegrationHealthTab from "@/components/admin/IntegrationHealthTab";
import NotificationsTab from "@/components/admin/NotificationsTab";
import { AnimatedPage } from "@/components/graphics/motion/AnimatedPage";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { IconAlertTriangle } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/ui/save-button";
import { useAdminSection } from "@/lib/admin-nav";
import type { AdminSaveState } from "@/components/admin/types/save-state";

export type { AdminSaveState };

const sectionMeta: Record<AdminSection, { title: string; subtitle: string }> = {
  users:            { title: "Users",                subtitle: "Manage user accounts and assignments" },
  activity:         { title: "Activity",             subtitle: "Login logs, audit trail, and session monitoring" },
  branding:         { title: "Management Company",   subtitle: "Identity and contact information" },
  icp:              { title: "Ideal Customer Profile", subtitle: "Define the target property type for AI research" },
  revshare:         { title: "Revenue Streams",       subtitle: "Service categories, fee defaults, and incentive fees" },
  otherassumptions: { title: "Other Assumptions",    subtitle: "Company-specific inflation and financial defaults" },
  companies:        { title: "Companies",            subtitle: "Manage companies of interest" },
  groups:           { title: "Groups",               subtitle: "User groups for branded experiences" },
  logos:            { title: "Logos",                 subtitle: "Upload and manage platform logos" },
  themes:           { title: "Themes",                subtitle: "Color themes and visual identity" },
  "ai-agents":     { title: "AI Agents",             subtitle: "Configure and manage Marcela (voice) and Rebecca (text) assistants" },
  research:         { title: "Research Center",      subtitle: "AI research configuration and live market rate monitoring" },
  notifications:    { title: "Notifications",         subtitle: "Slack, email channels, alert rules, and delivery tracking" },
  navigation:       { title: "Navigation",           subtitle: "Control which sidebar pages are visible to users" },
  diagrams:         { title: "Diagrams",              subtitle: "Application workflow diagrams and architecture" },
  verification:     { title: "Verification",         subtitle: "Independent GAAP financial audit and compliance" },
  database:         { title: "Database",             subtitle: "Entity monitoring, seed data, and canonical sync" },
  integrations:     { title: "Integrations",         subtitle: "External service health, circuit breakers, and cache management" },
};

function SectionContent({ section, onNavigate, onSaveStateChange }: { section: AdminSection; onNavigate: (s: AdminSection) => void; onSaveStateChange: (state: AdminSaveState | null) => void }) {
  switch (section) {
    case "users":            return <PeopleTab />;
    case "activity":         return <ActivityTab />;
    case "branding":         return <BrandingTab onSaveStateChange={onSaveStateChange} />;
    case "icp":              return (
      <ErrorBoundary fallback={
        <div className="mt-6 p-8 flex flex-col items-center gap-4 text-center rounded-xl border border-amber-200/60 bg-amber-50/40">
          <IconAlertTriangle className="w-10 h-10 text-amber-500" />
          <div>
            <p className="font-semibold text-foreground">Ideal Customer Profile failed to load</p>
            <p className="text-sm text-muted-foreground mt-1">A component error occurred. Reload the page to try again.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Reload page
          </Button>
        </div>
      }><IcpContent onSaveStateChange={onSaveStateChange} /></ErrorBoundary>
    );
    case "revshare":         return <RevenueShareTab />;
    case "otherassumptions": return <OtherAssumptionsTab onSaveStateChange={onSaveStateChange} />;
    case "companies":        return <CompaniesTab />;
    case "groups":           return <GroupsTab />;
    case "logos":            return <LogosTab />;
    case "themes":           return <ThemesTab />;
    case "notifications":    return <NotificationsTab />;
    case "navigation":       return <NavigationTab />;
    case "research":         return <ResearchCenterTab onSaveStateChange={onSaveStateChange} />;
    case "ai-agents":       return (
      <ErrorBoundary fallback={
        <div className="mt-6 p-8 flex flex-col items-center gap-4 text-center rounded-xl border border-amber-200/60 bg-amber-50/40">
          <IconAlertTriangle className="w-10 h-10 text-amber-500" />
          <div>
            <p className="font-semibold text-foreground">AI Agents configuration failed to load</p>
            <p className="text-sm text-muted-foreground mt-1">A component error occurred. Reload the page to try again.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Reload page
          </Button>
        </div>
      }><AIAgentsTab onSaveStateChange={onSaveStateChange} /></ErrorBoundary>
    );
    case "diagrams":         return <DiagramsTab />;
    case "verification":     return <VerificationTab />;
    case "database":         return <DatabaseTab />;
    case "integrations":     return <IntegrationHealthTab />;
    default:                 return null;
  }
}

export default function Admin() {
  const [activeSection, setActiveSection] = useAdminSection();
  const [saveState, setSaveState] = useState<AdminSaveState | null>(null);

  useEffect(() => {
    setSaveState(null);
  }, [activeSection]);

  const handleSaveStateChange = useCallback((state: AdminSaveState | null) => {
    setSaveState(state);
  }, []);

  const meta = sectionMeta[activeSection];

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
              saveState ? (
                <SaveButton
                  onClick={saveState.onSave}
                  hasChanges={saveState.isDirty}
                  isPending={saveState.isPending}
                  size="sm"
                  data-testid="button-admin-save"
                />
              ) : undefined
            }
          />

          <div className="space-y-6" data-testid={`admin-content-${activeSection}`}>
            <SectionContent section={activeSection} onNavigate={setActiveSection} onSaveStateChange={handleSaveStateChange} />
          </div>
        </div>
      </Layout>
    </TooltipProvider>
    </AnimatedPage>
  );
}
