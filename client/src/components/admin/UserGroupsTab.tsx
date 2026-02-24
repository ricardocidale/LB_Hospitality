import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Loader2, Plus, Trash2, Users, Pencil, Building2, UserPlus, Palette, Tag, Image, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User, Logo, UserGroup, AssetDesc } from "./types";

export default function UserGroupsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  const [groupForm, setGroupForm] = useState({ name: "", logoId: null as number | null, themeId: null as number | null, assetDescriptionId: null as number | null });

  const { data: users } = useQuery<User[]>({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  const { data: adminLogos } = useQuery<Logo[]>({
    queryKey: ["admin", "logos"],
    queryFn: async () => {
      const res = await fetch("/api/admin/logos", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch logos");
      return res.json();
    },
  });

  const { data: userGroupsList } = useQuery<UserGroup[]>({
    queryKey: ["admin", "user-groups"],
    queryFn: async () => {
      const res = await fetch("/api/admin/user-groups", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch user groups");
      return res.json();
    },
  });

  const { data: allThemes } = useQuery<Array<{ id: number; name: string; isDefault: boolean }>>({
    queryKey: ["admin", "all-themes"],
    queryFn: async () => {
      const res = await fetch("/api/design-themes", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch themes");
      return res.json();
    },
  });

  const { data: assetDescriptions } = useQuery<AssetDesc[]>({
    queryKey: ["admin", "asset-descriptions"],
    queryFn: async () => {
      const res = await fetch("/api/admin/asset-descriptions", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch asset descriptions");
      return res.json();
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: async (data: { name: string; logoId?: number | null; themeId?: number | null; assetDescriptionId?: number | null }) => {
      const res = await fetch("/api/admin/user-groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), credentials: "include" });
      if (!res.ok) throw new Error("Failed to create group");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "user-groups"] });
      setGroupDialogOpen(false);
      setGroupForm({ name: "", logoId: null, themeId: null, assetDescriptionId: null });
      setEditingGroup(null);
      toast({ title: "Group Created", description: "User group has been created." });
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; name?: string; logoId?: number | null; themeId?: number | null; assetDescriptionId?: number | null }) => {
      const res = await fetch(`/api/admin/user-groups/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), credentials: "include" });
      if (!res.ok) throw new Error("Failed to update group");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "user-groups"] });
      setGroupDialogOpen(false);
      setEditingGroup(null);
      toast({ title: "Group Updated", description: "User group has been updated." });
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/user-groups/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete group");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "user-groups"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast({ title: "Group Deleted", description: "User group has been deleted." });
    },
  });

  const assignGroupMutation = useMutation({
    mutationFn: async ({ userId, groupId }: { userId: number; groupId: number | null }) => {
      const res = await fetch(`/api/admin/users/${userId}/group`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ groupId }), credentials: "include" });
      if (!res.ok) throw new Error("Failed to assign group");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast({ title: "Group Assigned", description: "User has been assigned to the group." });
    },
  });

  return (
    <>
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-display flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> User Groups</CardTitle>
              <CardDescription className="label-text">Create groups with a company name and logo. Assign users to groups so they see the group's branding.</CardDescription>
            </div>
            <Button variant="outline" onClick={() => {
              setEditingGroup(null);
              setGroupForm({ name: "", logoId: null, themeId: null, assetDescriptionId: null });
              setGroupDialogOpen(true);
            }} className="flex items-center gap-2" data-testid="button-add-group">
              <Plus className="w-4 h-4" /> New Group
            </Button>
          </div>
        </CardHeader>
        <CardContent className="relative space-y-4">
          {(!userGroupsList || userGroupsList.length === 0) ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>No user groups created yet.</p>
              <p className="text-sm">Create a group to assign a company name and logo to one or more users.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {userGroupsList.map(group => {
                const groupLogo = adminLogos?.find(l => l.id === group.logoId);
                const groupTheme = allThemes?.find(t => t.id === group.themeId);
                const groupAssetDesc = assetDescriptions?.find(a => a.id === group.assetDescriptionId);
                const groupUsers = users?.filter(u => u.userGroupId === group.id) || [];
                return (
                  <div key={group.id} className="bg-primary/5 border border-primary/20 rounded-xl p-4" data-testid={`group-card-${group.id}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {groupLogo ? (
                          <div className="w-10 h-10 rounded-lg bg-white border border-primary/20 flex items-center justify-center overflow-hidden">
                            <img src={groupLogo.url} alt={groupLogo.name} className="max-w-full max-h-full object-contain" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-primary" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-display text-foreground font-medium">{group.name}{group.isDefault && <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Default</span>}</h3>
                          <p className="text-sm text-muted-foreground">Logo: <span className="text-foreground">{group.logoId ? `ID ${group.logoId}` : "Default"}</span></p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => {
                          setEditingGroup(group);
                          setGroupForm({ name: group.name, logoId: group.logoId, themeId: group.themeId, assetDescriptionId: group.assetDescriptionId });
                          setGroupDialogOpen(true);
                        }} className="text-primary hover:text-foreground hover:bg-primary/10" data-testid={`button-edit-group-${group.id}`}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        {!group.isDefault && (
                          <Button variant="ghost" size="sm" onClick={() => {
                            if (confirm("Delete this group? Users will be moved to the default group.")) {
                              deleteGroupMutation.mutate(group.id);
                            }
                          }} className="text-red-400 hover:text-red-300 hover:bg-red-500/10" data-testid={`button-delete-group-${group.id}`}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3">
                      {groupTheme && <span className="bg-primary/10 px-2 py-0.5 rounded">Theme: {groupTheme.name}</span>}
                      {groupAssetDesc && <span className="bg-primary/10 px-2 py-0.5 rounded">Asset: {groupAssetDesc.name}</span>}
                      <span className="bg-primary/10 px-2 py-0.5 rounded">{groupUsers.length} member{groupUsers.length !== 1 ? "s" : ""}</span>
                    </div>
                    {groupUsers.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {groupUsers.map(u => (
                          <span key={u.id} className="inline-flex items-center gap-1 bg-white/80 border border-primary/20 rounded-full px-3 py-1 text-sm">
                            <span className="font-medium">{u.name || u.email}</span>
                            <button onClick={() => assignGroupMutation.mutate({ userId: u.id, groupId: null })} className="text-red-400 hover:text-red-600 ml-1" title="Remove from group" data-testid={`button-remove-user-${u.id}-from-group`}>
                              &times;
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2"><UserPlus className="w-5 h-5 text-primary" /> Assign Users to Groups</CardTitle>
          <CardDescription className="label-text">Set which group each user belongs to. Group branding overrides defaults.</CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <Table>
            <TableHeader>
              <TableRow className="border-primary/20 hover:bg-transparent">
                <TableHead className="text-muted-foreground">User</TableHead>
                <TableHead className="text-muted-foreground">Role</TableHead>
                <TableHead className="text-muted-foreground">Group</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map(user => {
                const currentGroup = userGroupsList?.find(g => g.id === user.userGroupId);
                return (
                  <TableRow key={user.id} className="border-primary/20 hover:bg-primary/5" data-testid={`group-assign-row-${user.id}`}>
                    <TableCell className="text-foreground">
                      <div>
                        <span className="font-medium">{user.name || user.email}</span>
                        {user.name && <span className="text-muted-foreground text-xs ml-2">{user.email}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded font-mono ${
                        user.role === "admin" ? "bg-primary/20 text-primary" :
                        user.role === "checker" ? "bg-blue-500/20 text-blue-400" :
                        user.role === "investor" ? "bg-amber-500/20 text-amber-400" :
                        "bg-primary/10 text-muted-foreground"
                      }`}>{user.role}</span>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.userGroupId != null ? String(user.userGroupId) : "none"}
                        onValueChange={(v) => {
                          const groupId = v === "none" ? null : parseInt(v);
                          assignGroupMutation.mutate({ userId: user.id, groupId });
                        }}
                      >
                        <SelectTrigger className="h-9 max-w-[200px]" data-testid={`select-user-group-${user.id}`}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Group</SelectItem>
                          {userGroupsList?.map(g => (
                            <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>

    <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">{editingGroup ? "Edit Group" : "Create User Group"}</DialogTitle>
          <DialogDescription className="label-text">{editingGroup ? "Update group settings" : "Create a new group with a company name and logo"}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Users className="w-4 h-4 text-gray-500" />Group Name</Label>
            <Input value={groupForm.name} onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })} placeholder="e.g., KIT Capital Team" data-testid="input-group-name" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Image className="w-4 h-4 text-gray-500" />Logo (includes company name)</Label>
            <Select value={groupForm.logoId != null ? String(groupForm.logoId) : "default"} onValueChange={(v) => setGroupForm({ ...groupForm, logoId: v === "default" ? null : parseInt(v) })} data-testid="select-group-logo">
              <SelectTrigger data-testid="select-group-logo"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default Logo</SelectItem>
                {adminLogos?.map(logo => (
                  <SelectItem key={logo.id} value={String(logo.id)}>{logo.name} — {logo.companyName}{logo.isDefault ? " (Default)" : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Palette className="w-4 h-4 text-gray-500" />Theme</Label>
            <Select value={groupForm.themeId != null ? String(groupForm.themeId) : "default"} onValueChange={(v) => setGroupForm({ ...groupForm, themeId: v === "default" ? null : parseInt(v) })} data-testid="select-group-theme">
              <SelectTrigger data-testid="select-group-theme"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default Theme</SelectItem>
                {allThemes?.map(theme => (
                  <SelectItem key={theme.id} value={String(theme.id)}>{theme.name}{theme.isDefault ? " (Default)" : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Tag className="w-4 h-4 text-gray-500" />Asset Description</Label>
            <Select value={groupForm.assetDescriptionId != null ? String(groupForm.assetDescriptionId) : "default"} onValueChange={(v) => setGroupForm({ ...groupForm, assetDescriptionId: v === "default" ? null : parseInt(v) })} data-testid="select-group-asset-desc">
              <SelectTrigger data-testid="select-group-asset-desc"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                {assetDescriptions?.map(ad => (
                  <SelectItem key={ad.id} value={String(ad.id)}>{ad.name}{ad.isDefault ? " (Default)" : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setGroupDialogOpen(false); setEditingGroup(null); }} data-testid="button-cancel-group">Cancel</Button>
          <Button variant="outline" onClick={() => {
            if (editingGroup) {
              updateGroupMutation.mutate({ id: editingGroup.id, ...groupForm });
            } else {
              createGroupMutation.mutate(groupForm);
            }
          }} disabled={!groupForm.name || createGroupMutation.isPending || updateGroupMutation.isPending} data-testid="button-save-group" className="flex items-center gap-2">
            {(createGroupMutation.isPending || updateGroupMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {editingGroup ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
