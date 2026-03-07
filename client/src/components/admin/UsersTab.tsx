/**
 * UsersTab.tsx — User management panel for platform administrators.
 *
 * Provides full CRUD for user accounts:
 *   • List all registered users with search/filter
 *   • Create new users with username, password, and role assignment
 *   • Edit user details (name, email, role)
 *   • Reset passwords (generates a temporary password)
 *   • Delete users (with confirmation dialog)
 *   • Assign users to a UserGroup for branded experiences
 *
 * Roles:
 *   • "admin"   – full platform access including this admin panel
 *   • "user"    – standard access to portfolio and financial views
 *   • "checker" – read-only access for financial verification/audit
 *
 * User data is fetched via TanStack Query from GET /api/admin/users
 * and mutations go to POST/PATCH/DELETE /api/admin/users.
 */
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Loader2, Trash2, Users, Key, Eye, EyeOff, Pencil, UserPlus, Shield, Mail, LayoutGrid, Calendar, Settings, Save, ArrowUp, ArrowDown, ArrowUpDown, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime } from "@/lib/formatters";
import { UserAvatar } from "@/components/ui/user-avatar";
import { adminFetch, useAdminLogos } from "./hooks";
import defaultLogo from "@/assets/logo.png";
import type { User, UserGroup } from "./types";

type Company = { id: number; name: string; logoId: number | null; isActive: boolean };

type SortField = "name" | "role" | "group";
type SortDir = "asc" | "desc";

export default function UsersTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [newUser, setNewUser] = useState({ email: "", password: "", firstName: "", lastName: "", companyId: null as number | null, title: "", role: "partner" as string });
  const [editUser, setEditUser] = useState({ email: "", firstName: "", lastName: "", companyId: null as number | null, title: "", role: "partner" as string, password: "" });
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [originalEmail, setOriginalEmail] = useState("");
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  const { data: userGroupsList } = useQuery<UserGroup[]>({
    queryKey: ["admin", "user-groups"],
    queryFn: adminFetch<UserGroup[]>("/api/user-groups", "Failed to fetch user groups"),
  });

  const { data: adminLogos } = useAdminLogos();

  const { data: companiesList } = useQuery<Company[]>({
    queryKey: ["admin", "companies"],
    queryFn: async () => {
      const res = await fetch("/api/companies", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch companies");
      return res.json();
    },
  });

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

  const groupNameMap = useMemo(() => {
    const map: Record<number, string> = {};
    userGroupsList?.forEach(g => { map[g.id] = g.name; });
    return map;
  }, [userGroupsList]);

  const userLogoMap = useMemo(() => {
    const map: Record<number, string> = {};
    if (!userGroupsList || !adminLogos) return map;
    const logoUrlMap: Record<number, string> = {};
    adminLogos.forEach(l => { logoUrlMap[l.id] = l.url; });
    userGroupsList.forEach(g => {
      if (g.logoId && logoUrlMap[g.logoId]) {
        map[g.id] = logoUrlMap[g.logoId];
      }
    });
    return map;
  }, [userGroupsList, adminLogos]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />;
    return sortDir === "asc" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />;
  };

  const sortedUsers = useMemo(() => {
    if (!users) return [];
    const sorted = [...users].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = (a.name || a.email).localeCompare(b.name || b.email);
          break;
        case "role":
          cmp = a.role.localeCompare(b.role);
          break;
        case "group": {
          const ga = (a.userGroupId ? groupNameMap[a.userGroupId] : "") || "";
          const gb = (b.userGroupId ? groupNameMap[b.userGroupId] : "") || "";
          cmp = ga.localeCompare(gb);
          break;
        }
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [users, sortField, sortDir, groupNameMap]);

  const createMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; firstName?: string; lastName?: string; companyId?: number | null; title?: string; role?: string }) => {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setDialogOpen(false);
      setNewUser({ email: "", password: "", firstName: "", lastName: "", companyId: null, title: "", role: "partner" });
      toast({ title: "User Created", description: "New user has been registered." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete user");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast({ title: "User Deleted", description: "User has been removed." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: async ({ id, password }: { id: number; password: string }) => {
      const res = await fetch(`/api/admin/users/${id}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update password");
      }
      return { id };
    },
    onSuccess: () => {
      setPasswordDialogOpen(false);
      setSelectedUser(null);
      setNewPassword("");
      toast({ title: "Password Updated", description: "User password has been changed." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetAllPasswordsMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/reset-all-passwords", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to reset passwords");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Passwords Reset", description: data.message });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { email?: string; firstName?: string; lastName?: string; companyId?: number | null; title?: string; role?: string } }) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const ct = res.headers.get("content-type") || "";
        if (!ct.includes("application/json")) {
          throw new Error(`Server returned ${res.status} (non-JSON)`);
        }
        const err = await res.json();
        throw new Error(err.error || "Failed to update user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setEditDialogOpen(false);
      setSelectedUser(null);
      toast({ title: "User Updated", description: "User information has been saved." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <>
    <Card className="bg-white border border-gray-200/80 shadow-sm">

      
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-gray-900">User Management</CardTitle>
            <CardDescription className="label-text">
              {users?.length || 0} registered users
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => { if (confirm("Reset ALL user passwords to the default admin password?")) resetAllPasswordsMutation.mutate(); }} disabled={resetAllPasswordsMutation.isPending} data-testid="button-reset-all-passwords">
              {resetAllPasswordsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
              Reset All Passwords
            </Button>
            <Button variant="default" onClick={() => setDialogOpen(true)} data-testid="button-add-user">
              <UserPlus className="w-4 h-4" />
              Add User
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative">
        {usersLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200 hover:bg-transparent">
                <TableHead className="text-muted-foreground font-display cursor-pointer select-none" onClick={() => toggleSort("name")} data-testid="sort-user-name"><div className="flex items-center gap-2"><Users className="w-4 h-4" />User <SortIcon field="name" /></div></TableHead>
                <TableHead className="text-muted-foreground font-display cursor-pointer select-none" onClick={() => toggleSort("role")} data-testid="sort-user-role"><div className="flex items-center gap-2"><Shield className="w-4 h-4" />Role <SortIcon field="role" /></div></TableHead>
                <TableHead className="text-muted-foreground font-display cursor-pointer select-none" onClick={() => toggleSort("group")} data-testid="sort-user-group"><div className="flex items-center gap-2"><LayoutGrid className="w-4 h-4" />Group <SortIcon field="group" /></div></TableHead>
                <TableHead className="text-muted-foreground font-display text-right"><div className="flex items-center justify-end gap-2"><Settings className="w-4 h-4" />Actions</div></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedUsers.map((user) => (
                <TableRow key={user.id} className="border-gray-200 hover:bg-gray-50" data-testid={`row-user-${user.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <UserAvatar firstName={user.firstName} lastName={user.lastName} name={user.name} email={user.email} size="sm" />
                      {user.userGroupId && userLogoMap[user.userGroupId] && (
                        <img
                          src={userLogoMap[user.userGroupId]}
                          alt=""
                          className="w-7 h-7 rounded-md border border-gray-200 bg-white object-contain p-0.5"
                          onError={(e) => { (e.target as HTMLImageElement).src = defaultLogo; }}
                        />
                      )}
                      <div>
                        <div className="font-display font-medium">{user.name || user.email}</div>
                        {user.name && <div className="text-xs text-muted-foreground">{user.email}</div>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${user.role === 'admin' ? 'bg-secondary/15 text-secondary' : 'bg-gray-100 text-muted-foreground'}`}>
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{user.userGroupId ? groupNameMap[user.userGroupId] || "—" : "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-gray-100"
                        onClick={() => { setSelectedUser(user); setOriginalEmail(user.email); setEditUser({ email: user.email, firstName: user.firstName || "", lastName: user.lastName || "", companyId: user.companyId ?? null, title: user.title || "", role: user.role || "partner", password: "" }); setShowEditPassword(false); setEditDialogOpen(true); }}
                        data-testid={`button-edit-user-${user.id}`}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-gray-100"
                        onClick={() => { setSelectedUser(user); setPasswordDialogOpen(true); }}
                        data-testid={`button-password-user-${user.id}`}>
                        <Key className="w-4 h-4" />
                      </Button>
                      {user.role !== 'admin' && (
                        <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          onClick={() => deleteMutation.mutate(user.id)}
                          data-testid={`button-delete-user-${user.id}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>

    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Add New User</DialogTitle>
          <DialogDescription className="label-text">Create a new user account</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-500" />Email</Label>
            <Input value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="user@example.com" data-testid="input-new-user-email" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Key className="w-4 h-4 text-gray-500" />Password</Label>
            <div className="relative">
              <Input type={showNewUserPassword ? "text" : "password"} value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="Secure password" data-testid="input-new-user-password" />
              <button type="button" onClick={() => setShowNewUserPassword(!showNewUserPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" data-testid="button-toggle-new-password">
                {showNewUserPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label className="flex items-center gap-2"><Users className="w-4 h-4 text-gray-500" />First Name</Label><Input value={newUser.firstName} onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })} placeholder="First name" data-testid="input-new-user-firstName" /></div>
            <div className="space-y-2"><Label>Last Name</Label><Input value={newUser.lastName} onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })} placeholder="Last name" data-testid="input-new-user-lastName" /></div>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Building2 className="w-4 h-4 text-gray-500" />Company</Label>
            <Select value={newUser.companyId != null ? String(newUser.companyId) : "none"} onValueChange={(v) => setNewUser({ ...newUser, companyId: v === "none" ? null : parseInt(v) })} data-testid="select-new-user-company">
              <SelectTrigger data-testid="select-new-user-company"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Company</SelectItem>
                {companiesList?.filter(c => c.isActive).map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    <span className="flex items-center gap-2">
                      {companyLogoMap[c.id] && <img src={companyLogoMap[c.id]} alt="" className="w-5 h-5 rounded object-contain" />}
                      {c.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label className="flex items-center gap-2"><Shield className="w-4 h-4 text-gray-500" />Title</Label><Input value={newUser.title} onChange={(e) => setNewUser({ ...newUser, title: e.target.value })} placeholder="Job title" data-testid="input-new-user-title" /></div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Shield className="w-4 h-4 text-gray-500" />Role</Label>
            <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v })} data-testid="select-new-user-role">
              <SelectTrigger data-testid="select-new-user-role"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="partner">Partner</SelectItem>
                <SelectItem value="investor">Investor</SelectItem>
                <SelectItem value="checker">Checker</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel-add-user">Cancel</Button>
          <Button variant="outline" onClick={() => createMutation.mutate(newUser)} disabled={createMutation.isPending || !newUser.email || !newUser.password} data-testid="button-create-user" className="flex items-center gap-2">
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Change Password</DialogTitle>
          <DialogDescription className="label-text">Set a new password for {selectedUser?.email}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>New Password</Label>
            <div className="relative">
              <Input type={showChangePassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" data-testid="input-new-password" />
              <button type="button" onClick={() => setShowChangePassword(!showChangePassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" data-testid="button-toggle-change-password">
                {showChangePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setPasswordDialogOpen(false)} data-testid="button-cancel-password">Cancel</Button>
          <Button variant="outline" onClick={() => selectedUser && passwordMutation.mutate({ id: selectedUser.id, password: newPassword })} disabled={passwordMutation.isPending || !newPassword} data-testid="button-update-password" className="flex items-center gap-2">
            {passwordMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
            Update Password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Edit User</DialogTitle>
          <DialogDescription className="label-text">Update user information</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {selectedUser?.createdAt && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
              <Calendar className="w-3.5 h-3.5" />
              Created {formatDateTime(selectedUser.createdAt)}
            </div>
          )}
          <div className="space-y-2"><Label className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-500" />Email</Label><Input value={editUser.email} onChange={(e) => setEditUser({ ...editUser, email: e.target.value })} data-testid="input-edit-email" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label className="flex items-center gap-2"><Users className="w-4 h-4 text-gray-500" />First Name</Label><Input value={editUser.firstName} onChange={(e) => setEditUser({ ...editUser, firstName: e.target.value })} data-testid="input-edit-firstName" /></div>
            <div className="space-y-2"><Label>Last Name</Label><Input value={editUser.lastName} onChange={(e) => setEditUser({ ...editUser, lastName: e.target.value })} data-testid="input-edit-lastName" /></div>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Building2 className="w-4 h-4 text-gray-500" />Company</Label>
            <Select value={editUser.companyId != null ? String(editUser.companyId) : "none"} onValueChange={(v) => setEditUser({ ...editUser, companyId: v === "none" ? null : parseInt(v) })} data-testid="select-edit-company">
              <SelectTrigger data-testid="select-edit-company"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Company</SelectItem>
                {companiesList?.filter(c => c.isActive).map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    <span className="flex items-center gap-2">
                      {companyLogoMap[c.id] && <img src={companyLogoMap[c.id]} alt="" className="w-5 h-5 rounded object-contain" />}
                      {c.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label className="flex items-center gap-2"><Shield className="w-4 h-4 text-gray-500" />Title</Label><Input value={editUser.title} onChange={(e) => setEditUser({ ...editUser, title: e.target.value })} data-testid="input-edit-title" /></div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Shield className="w-4 h-4 text-gray-500" />Role</Label>
            <Select value={editUser.role} onValueChange={(v) => setEditUser({ ...editUser, role: v })} data-testid="select-edit-user-role">
              <SelectTrigger data-testid="select-edit-user-role"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="partner">Partner</SelectItem>
                <SelectItem value="investor">Investor</SelectItem>
                <SelectItem value="checker">Checker</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Key className="w-4 h-4 text-gray-500" />Password</Label>
            <div className="relative">
              <Input type={showEditPassword ? "text" : "password"} value={editUser.password} onChange={(e) => setEditUser({ ...editUser, password: e.target.value })} placeholder="Leave blank to keep current" data-testid="input-edit-password" />
              <button type="button" onClick={() => setShowEditPassword(!showEditPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" data-testid="button-toggle-edit-password">
                {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">Leave blank to keep the current password unchanged</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setEditDialogOpen(false)} data-testid="button-cancel-edit">Cancel</Button>
          <Button variant="outline" onClick={() => {
            if (!selectedUser) return;
            const data: { email?: string; firstName?: string; lastName?: string; companyId?: number | null; title?: string; role?: string } = {
              firstName: editUser.firstName,
              lastName: editUser.lastName,
              companyId: editUser.companyId,
              title: editUser.title,
            };
            if (editUser.email !== originalEmail) {
              data.email = editUser.email;
            }
            if (editUser.role !== selectedUser.role) {
              data.role = editUser.role;
            }
            if (editUser.password) {
              passwordMutation.mutate({ id: selectedUser.id, password: editUser.password });
            }
            editMutation.mutate({ id: selectedUser.id, data });
          }} disabled={editMutation.isPending} data-testid="button-save-user" className="flex items-center gap-2">
            {editMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
