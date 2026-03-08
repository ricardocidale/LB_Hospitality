import { useState } from "react";
import Layout from "@/components/Layout";
import { PageHeader } from "@/components/ui/page-header";
import { TooltipProvider } from "@/components/ui/tooltip";
import AdminSidebar, { type AdminSection, navGroups, getGroupForSection } from "@/components/admin/AdminSidebar";
import {
  CompaniesTab, ActivityTab, VerificationTab,
  DatabaseTab, MarcelaTab,
} from "@/components/admin";
import { KnowledgeBaseCard } from "@/components/admin/marcela/KnowledgeBase";
import PeopleTab from "@/components/admin/PeopleTab";
import BrandingTab from "@/components/admin/BrandingTab";
import AssetDefinitionTab from "@/components/admin/AssetDefinitionTab";
import ServicesTab from "@/components/admin/ServicesTab";
import RevenueShareTab from "@/components/admin/RevenueShareTab";
import OtherAssumptionsTab from "@/components/admin/OtherAssumptionsTab";
import GroupsTab from "@/components/admin/GroupsTab";
import DesignTab from "@/components/admin/DesignTab";
import ResearchCenterTab from "@/components/admin/ResearchCenterTab";
import NavigationTab from "@/components/admin/NavigationTab";
import { AnimatedPage } from "@/components/graphics/motion/AnimatedPage";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const sectionMeta: Record<AdminSection, { title: string; subtitle: string }> = {
  users:            { title: "Users",                subtitle: "Manage user accounts and assignments" },
  activity:         { title: "Activity",             subtitle: "Login logs, audit trail, and session monitoring" },
  branding:         { title: "Management Company",   subtitle: "Identity and contact information" },
  icp:              { title: "Ideal Customer Profile", subtitle: "Define the target property type for AI research" },
  services:         { title: "Services",             subtitle: "Centralized services with category toggles and starter fees" },
  revshare:         { title: "Revenue Share",        subtitle: "Suggested starting values for incentive fees" },
  otherassumptions: { title: "Other Assumptions",    subtitle: "Company-specific inflation and financial defaults" },
  companies:        { title: "Companies",            subtitle: "Manage SPV companies for individual properties" },
  groups:           { title: "Groups",               subtitle: "User groups for branded experiences" },
  design:           { title: "Design",               subtitle: "Logos, color themes, and visual identity" },
  marcela:          { title: "AI Agent",             subtitle: "Configure Marcela — voice, prompt, tools, and telephony" },
  kb:               { title: "Knowledge Base",       subtitle: "Marcela's knowledge base documents and data" },
  twilio:           { title: "Twilio",               subtitle: "Phone and SMS telephony configuration" },
  research:         { title: "Research Center",      subtitle: "AI research configuration and live market rate monitoring" },
  navigation:       { title: "Navigation",           subtitle: "Control which sidebar pages are visible to users" },
  verification:     { title: "Verification",         subtitle: "Independent GAAP financial audit and compliance" },
  database:         { title: "Database",             subtitle: "Entity monitoring, seed data, and canonical sync" },
};

function SectionContent({ section, onNavigate }: { section: AdminSection; onNavigate: (s: AdminSection) => void }) {
  switch (section) {
    case "users":            return <PeopleTab />;
    case "activity":         return <ActivityTab />;
    case "branding":         return <BrandingTab />;
    case "icp":              return <AssetDefinitionTab />;
    case "services":         return <ServicesTab />;
    case "revshare":         return <RevenueShareTab />;
    case "otherassumptions": return <OtherAssumptionsTab />;
    case "companies":        return <CompaniesTab />;
    case "groups":           return <GroupsTab />;
    case "design":           return <DesignTab />;
    case "navigation":       return <NavigationTab />;
    case "research":         return <ResearchCenterTab />;
    case "marcela":          return (
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
    case "kb":               return (
      <ErrorBoundary fallback={
        <div className="mt-6 p-8 flex flex-col items-center gap-4 text-center rounded-xl border border-amber-200/60 bg-amber-50/40">
          <AlertTriangle className="w-10 h-10 text-amber-500" />
          <div>
            <p className="font-semibold text-foreground">Knowledge Base failed to load</p>
            <p className="text-sm text-muted-foreground mt-1">A component error occurred. Reload the page to try again.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Reload page
          </Button>
        </div>
      }><KnowledgeBaseCard agentName="Marcela" /></ErrorBoundary>
    );
    case "twilio":           return (
      <ErrorBoundary fallback={
        <div className="mt-6 p-8 flex flex-col items-center gap-4 text-center rounded-xl border border-amber-200/60 bg-amber-50/40">
          <AlertTriangle className="w-10 h-10 text-amber-500" />
          <div>
            <p className="font-semibold text-foreground">Twilio configuration failed to load</p>
            <p className="text-sm text-muted-foreground mt-1">A component error occurred. Reload the page to try again.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Reload page
          </Button>
        </div>
      }><MarcelaTab initialTab="channels" /></ErrorBoundary>
    );
    case "verification":     return <VerificationTab />;
    case "database":         return <DatabaseTab />;
    default:                 return null;
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
