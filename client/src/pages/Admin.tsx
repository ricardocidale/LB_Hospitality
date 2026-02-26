/**
 * Admin.tsx — Admin settings panel (admin-only access).
 *
 * A tabbed interface that gives platform administrators control over:
 *   • Users        — manage user accounts, roles, and passwords
 *   • Companies    — create/edit companies that users can belong to
 *   • Activity     — audit log of recent user actions (logins, saves, etc.)
 *   • Verification — run the server-side financial checker to validate model integrity
 *   • User Groups  — assign users to groups with shared branding and permissions
 *   • Customize    — consolidated appearance/config (Branding, Themes, Logos, Navigation)
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
  Palette, Database, Mic
} from "lucide-react";
import {
  UsersTab, CompaniesTab, ActivityTab, VerificationTab,
  UserGroupsTab, CustomizeTab, DatabaseTab, MarcelaTab
} from "@/components/admin";

type AdminView = "users" | "companies" | "activity" | "verification" | "user-groups" | "customize" | "marcela" | "database";

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
              { value: 'customize', label: 'Customize', icon: Palette },
              { value: 'marcela', label: 'Marcela', icon: Mic },
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
          <TabsContent value="customize" className="space-y-6 mt-6">
            {adminTab === "customize" && <CustomizeTab />}
          </TabsContent>
          <TabsContent value="marcela" className="space-y-6 mt-6">
            {adminTab === "marcela" && <MarcelaTab />}
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
