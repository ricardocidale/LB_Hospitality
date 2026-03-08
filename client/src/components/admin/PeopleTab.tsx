import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Building2, LayoutGrid } from "lucide-react";
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
          <h2 className="text-2xl font-display font-bold text-foreground" data-testid="text-people-title">Users</h2>
          <p className="text-muted-foreground text-sm">Manage user accounts and assignments.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 h-auto p-1 bg-muted border border-border" data-testid="tabs-people">
          <TabsTrigger value="users" className="py-2.5 gap-2" data-testid="tab-people-users">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="company-assignment" className="py-2.5 gap-2" data-testid="tab-people-company-assignment">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">Company Assignment</span>
          </TabsTrigger>
          <TabsTrigger value="group-assignment" className="py-2.5 gap-2" data-testid="tab-people-group-assignment">
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Group Assignment</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          <UsersTab />
        </TabsContent>

        <TabsContent value="company-assignment" className="mt-6">
          <CompanyAssignmentTab />
        </TabsContent>

        <TabsContent value="group-assignment" className="mt-6">
          <UserGroupsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CompanyAssignmentTab() {
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  const { data: companiesList } = useQuery<AdminCompany[]>({
    queryKey: ["admin", "companies"],
    queryFn: async () => {
      const res = await fetch("/api/companies", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch companies");
      return res.json();
    },
  });

  const { data: adminLogos } = useAdminLogos();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const companyLogoMap = useMemo(() => {
    const map: Record<number, string> = {};
    if (!companiesList || !adminLogos) return map;
    const logoUrlMap: Record<number, string> = {};
    adminLogos.forEach(l => { logoUrlMap[l.id] = l.url; });
    companiesList.forEach(c => {
      if (c.logoId && logoUrlMap[c.logoId]) {
        map[c.id] = logoUrlMap[c.logoId];
      }
    });
    return map;
  }, [companiesList, adminLogos]);

  const assignCompanyMutation = useMutation({
    mutationFn: async ({ userId, companyId }: { userId: number; companyId: number | null }) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to assign company");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast({ title: "Company Assigned", description: "User has been assigned to the company." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (usersLoading) {
    return (
      <Card className="bg-card border border-border/80 shadow-sm">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
          <Building2 className="w-4 h-4 text-muted-foreground" /> Company Assignment
        </CardTitle>
        <CardDescription className="label-text">Assign users to management companies.</CardDescription>
      </CardHeader>
      <CardContent className="relative">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">User</TableHead>
              <TableHead className="text-muted-foreground">Role</TableHead>
              <TableHead className="text-muted-foreground">Company</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map(user => (
              <TableRow key={user.id} className="border-border hover:bg-muted" data-testid={`company-assign-row-${user.id}`}>
                <TableCell className="text-foreground">
                  <div>
                    <span className="font-medium">{user.name || user.email}</span>
                    {user.name && <span className="text-muted-foreground text-xs ml-2">{user.email}</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`text-xs px-2 py-0.5 rounded font-mono ${
                    user.role === "admin" ? "bg-muted/80 text-muted-foreground" :
                    user.role === "checker" ? "bg-muted text-blue-400" :
                    user.role === "investor" ? "bg-amber-500/20 text-amber-400" :
                    "bg-muted text-muted-foreground"
                  }`}>{user.role}</span>
                </TableCell>
                <TableCell>
                  <Select
                    value={user.companyId != null ? String(user.companyId) : "none"}
                    onValueChange={(v) => {
                      const companyId = v === "none" ? null : parseInt(v);
                      assignCompanyMutation.mutate({ userId: user.id, companyId });
                    }}
                  >
                    <SelectTrigger className="h-9 max-w-[200px]" data-testid={`select-user-company-${user.id}`}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Company</SelectItem>
                      {companiesList?.filter(c => c.isActive).map(c => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          <span className="flex items-center gap-2">
                            {companyLogoMap[c.id] && <img src={companyLogoMap[c.id]} alt="" className="w-5 h-5 rounded object-contain shrink-0" />}
                            {c.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminLogos } from "./hooks";
import type { User, AdminCompany } from "./types";
