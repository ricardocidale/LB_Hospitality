import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, LayoutGrid } from "lucide-react";
import UsersTab from "./UsersTab";
import UserGroupsTab from "./UserGroupsTab";

interface PeopleTabProps {
  initialTab?: string;
}

export default function PeopleTab({ initialTab }: PeopleTabProps) {
  const [activeTab, setActiveTab] = useState(initialTab || "users");

  return (
    <div className="space-y-6 mt-2">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground" data-testid="text-people-title">People</h2>
          <p className="text-muted-foreground text-sm">Manage user accounts and group assignments.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 h-auto p-1 bg-muted border border-border" data-testid="tabs-people">
          <TabsTrigger value="users" className="py-2.5 gap-2" data-testid="tab-people-users">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="groups" className="py-2.5 gap-2" data-testid="tab-people-groups">
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Group Assignment</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <UsersTab />
        </TabsContent>

        <TabsContent value="groups" className="mt-6">
          <UserGroupsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
