/**
 * Admin.tsx — Admin settings panel (admin-only access).
 *
 * A tabbed interface that gives platform administrators control over:
 *   • Users        — manage user accounts, roles, and passwords
 *   • Companies    — create/edit companies that users can belong to
 *   • Activity     — audit log of recent user actions (logins, saves, etc.)
 *   • Verification — run the server-side financial checker to validate model integrity
 *   • User Groups  — assign users to groups with shared branding and permissions
 *   • Logos        — upload and manage company logos used throughout the platform
 *   • Branding     — assign logos and themes to user groups for white-label presentation
 *   • Themes       — manage visual theme definitions (color palettes, CSS classes)
 *   • Navigation   — toggle sidebar items on/off for all non-admin users
 *   • Database     — sync tools and data management utilities
 *
 * Each tab is lazy-rendered — the component only mounts when the tab is active,
 * keeping the Admin page lightweight even with many management features.
 */
import { useState } from "react";
import Layout from "@/components/Layout";
import { Tabs, TabsContent, CurrentThemeTab } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/page-header";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Users, Building2, Activity, FileCheck, LayoutGrid,
  Upload, Image, SwatchBook, PanelLeft, Database
} from "lucide-react";
import {
  UsersTab, CompaniesTab, ActivityTab, VerificationTab,
  UserGroupsTab, LogosTab, BrandingTab, ThemesTab,
  NavigationTab, DatabaseTab
} from "@/components/admin";

type AdminView = "users" | "companies" | "activity" | "verification" | "themes" | "branding" | "user-groups" | "sidebar" | "database" | "logos";

export default function Admin() {
  const [adminTab, setAdminTab] = useState<AdminView>("users");

  return (
    <TooltipProvider>
    <Layout>
      <div className="space-y-6">
        <PageHeader 
          title="Admin Settings"
          subtitle="Manage users, monitor activity, and run system verification"
          variant="dark"
        />

        <Tabs value={adminTab} onValueChange={(v) => setAdminTab(v as AdminView)} className="w-full">
          <CurrentThemeTab
            tabs={[
              { value: 'users', label: 'Users', icon: Users },
              { value: 'companies', label: 'Companies', icon: Building2 },
              { value: 'activity', label: 'Activity', icon: Activity },
              { value: 'verification', label: 'Verification', icon: FileCheck },
              { value: 'user-groups', label: 'User Groups', icon: LayoutGrid },
              { value: 'logos', label: 'Logos', icon: Upload },
              { value: 'branding', label: 'Branding', icon: Image },
              { value: 'themes', label: 'Themes', icon: SwatchBook },
              { value: 'sidebar', label: 'Navigation', icon: PanelLeft },
              { value: 'database', label: 'Database', icon: Database },
            ]}
            activeTab={adminTab}
            onTabChange={(v) => setAdminTab(v as AdminView)}
          />

          <TabsContent value="users" className="space-y-6 mt-6">
            {adminTab === "users" && <UsersTab />}
          </TabsContent>
          <TabsContent value="companies" className="space-y-6 mt-6">
            {adminTab === "companies" && <CompaniesTab />}
          </TabsContent>
          <TabsContent value="activity" className="space-y-6 mt-6">
            {adminTab === "activity" && <ActivityTab />}
          </TabsContent>
          <TabsContent value="verification" className="space-y-6 mt-6">
            {adminTab === "verification" && <VerificationTab />}
          </TabsContent>
          <TabsContent value="user-groups" className="space-y-6 mt-6">
            {adminTab === "user-groups" && <UserGroupsTab />}
          </TabsContent>
          <TabsContent value="logos" className="space-y-6 mt-6">
            {adminTab === "logos" && <LogosTab />}
          </TabsContent>
          <TabsContent value="branding" className="space-y-6 mt-6">
            {adminTab === "branding" && <BrandingTab onNavigate={(tab) => setAdminTab(tab as AdminView)} />}
          </TabsContent>
          <TabsContent value="themes" className="space-y-6 mt-6">
            {adminTab === "themes" && <ThemesTab />}
          </TabsContent>
          <TabsContent value="sidebar" className="space-y-6 mt-6">
            {adminTab === "sidebar" && <NavigationTab />}
          </TabsContent>
          <TabsContent value="database" className="space-y-6 mt-6">
            {adminTab === "database" && <DatabaseTab />}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
    </TooltipProvider>
  );
}
