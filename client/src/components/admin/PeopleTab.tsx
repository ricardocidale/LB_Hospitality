import { useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Building2, LayoutGrid, Loader2 } from "lucide-react";
import { IconPeople, IconProperties, IconUserCog } from "@/components/icons/brand-icons";
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
            <IconPeople className="w-4 h-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="company-assignment" className="py-2.5 gap-2" data-testid="tab-people-company-assignment">
            <IconProperties className="w-4 h-4" />
            <span className="hidden sm:inline">Company Assignment</span>
          </TabsTrigger>
          <TabsTrigger value="group-assignment" className="py-2.5 gap-2" data-testid="tab-people-group-assignment">
            <IconUserCog className="w-4 h-4" />
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

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: number; data: Record<string, any> }) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleCompanyChange = useCallback((userId: number, companyId: number | null) => {
    updateUserMutation.mutate({ userId, data: { companyId } });
    toast({ title: "Company Assigned", description: "User has been assigned to the company." });
  }, [updateUserMutation, toast]);

  const handleTitleBlur = useCallback((userId: number, title: string, original: string | null) => {
    const trimmed = title.trim();
    if (trimmed === (original || "")) return;
    updateUserMutation.mutate({ userId, data: { title: trimmed || null } });
    toast({ title: "Title Updated", description: "User job title has been saved." });
  }, [updateUserMutation, toast]);

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
          <IconProperties className="w-4 h-4 text-muted-foreground" /> Company Assignment
        </CardTitle>
        <CardDescription className="label-text">Assign users to management companies.</CardDescription>
      </CardHeader>
      <CardContent className="relative">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">User</TableHead>
              <TableHead className="text-muted-foreground">Job Title</TableHead>
              <TableHead className="text-muted-foreground">Company</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user, idx) => (
              <TableRow
                key={user.id}
                className={`border-border ${idx % 2 === 1 ? "bg-muted/30" : ""}`}
                data-testid={`company-assign-row-${user.id}`}
              >
                <TableCell className="text-foreground">
                  <span className="font-medium">{user.name || user.email}</span>
                </TableCell>
                <TableCell>
                  <JobTitleInput
                    userId={user.id}
                    value={user.title}
                    onBlur={handleTitleBlur}
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={user.companyId != null ? String(user.companyId) : "none"}
                    onValueChange={(v) => {
                      const companyId = v === "none" ? null : parseInt(v);
                      handleCompanyChange(user.id, companyId);
                    }}
                  >
                    <SelectTrigger className="h-8 max-w-[200px] text-sm" data-testid={`select-user-company-${user.id}`}><SelectValue /></SelectTrigger>
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
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAdminLogos } from "./hooks";
import type { User, AdminCompany } from "./types";

function JobTitleInput({
  userId,
  value,
  onBlur,
}: {
  userId: number;
  value: string | null;
  onBlur: (userId: number, title: string, original: string | null) => void;
}) {
  const [local, setLocal] = useState(value || "");
  return (
    <Input
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => onBlur(userId, local, value)}
      placeholder="Optional"
      className="h-8 text-sm bg-transparent border-border/50 max-w-[180px] placeholder:text-muted-foreground/40"
      data-testid={`input-job-title-${userId}`}
    />
  );
}
