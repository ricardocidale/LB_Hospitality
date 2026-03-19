/**
 * UserGroupsTab.tsx — Branded user group management.
 *
 * User Groups enable white-labeling: each group can have its own logo,
 * color theme, and "asset description" (the label used for properties,
 * e.g. "Luxury Resort" vs. "Boutique Hotel"). When a user belongs to a
 * group, the platform's UI adapts to show that group's branding.
 *
 * Admin capabilities:
 *   • Create / edit / delete user groups
 *   • Assign a logo (from the Logos library) to a group
 *   • Assign a theme (from ThemesTab) to a group
 *   • Set the asset description label
 *   • Add or remove users from groups
 *
 * This powers multi-tenant scenarios where a single platform instance
 * serves multiple hotel brands or investor groups, each seeing their
 * own branded experience.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Loader2, ChevronDown, ChevronUp } from "@/components/icons/themed-icons";
import {
  IconPlus, IconTrash, IconUsers, IconPencil, IconBuilding2, IconUserPlus,
  IconPalette, IconTag, IconImage, IconSave, IconEye, IconPeople, IconProperties,
} from "@/components/icons";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAdminUsers, useAdminLogos, useAdminUserGroups, useAdminThemes, useAdminAssetDescriptions } from "./hooks";
import type { UserGroup } from "./types";
import type { Property } from "@shared/schema";

export default function UserGroupsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  const [groupForm, setGroupForm] = useState({ name: "", logoId: null as number | null, themeId: null as number | null, assetDescriptionId: null as number | null });
  const [expandedVisibility, setExpandedVisibility] = useState<number | null>(null);
  const [pendingVisibility, setPendingVisibility] = useState<Record<number, Set<number>>>({});

  const { data: users } = useAdminUsers();
  const { data: adminLogos } = useAdminLogos();
  const { data: userGroupsList } = useAdminUserGroups();
  const { data: allThemes } = useAdminThemes();
  const { data: assetDescriptions } = useAdminAssetDescriptions();

  const { data: allProperties } = useQuery<Property[]>({
    queryKey: ["properties"],
    queryFn: async () => {
      const res = await fetch("/api/properties", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch properties");
      return res.json();
    },
  });

  const { data: groupPropertyMap } = useQuery<Record<number, number[]>>({
    queryKey: ["admin", "group-properties"],
    enabled: !!userGroupsList,
    queryFn: async () => {
      const map: Record<number, number[]> = {};
      await Promise.all(
        (userGroupsList ?? []).map(async (g) => {
          const res = await fetch(`/api/user-groups/${g.id}/properties`, { credentials: "include" });
          map[g.id] = res.ok ? await res.json() : [];
        })
      );
      return map;
    },
  });

  const setGroupPropertiesMutation = useMutation({
    mutationFn: async ({ groupId, propertyIds }: { groupId: number; propertyIds: number[] }) => {
      const res = await fetch(`/api/user-groups/${groupId}/properties`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyIds }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to save property visibility");
    },
    onSuccess: (_data, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "group-properties"] });
      setPendingVisibility((prev) => { const next = { ...prev }; delete next[groupId]; return next; });
      toast({ title: "Visibility Saved", description: "Property visibility updated for this group." });
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: async (data: { name: string; logoId?: number | null; themeId?: number | null; assetDescriptionId?: number | null }) => {
      const res = await fetch("/api/user-groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), credentials: "include" });
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
      const res = await fetch(`/api/user-groups/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), credentials: "include" });
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
      const res = await fetch(`/api/user-groups/${id}`, { method: "DELETE", credentials: "include" });
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
      <Card className="bg-card border border-border/80 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2"><IconPeople className="w-4 h-4 text-muted-foreground" /> User Groups</CardTitle>
              <CardDescription className="label-text">Create groups with a company name and logo. Assign users to groups so they see the group's branding.</CardDescription>
            </div>
            <Button variant="outline" onClick={() => {
              setEditingGroup(null);
              setGroupForm({ name: "", logoId: null, themeId: null, assetDescriptionId: null });
              setGroupDialogOpen(true);
            }} className="flex items-center gap-2" data-testid="button-add-group">
              <IconPlus className="w-4 h-4" /> New Group
            </Button>
          </div>
        </CardHeader>
        <CardContent className="relative space-y-4">
          {(!userGroupsList || userGroupsList.length === 0) ? (
            <div className="text-center py-8 text-muted-foreground">
              <IconPeople className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>No user groups created yet.</p>
              <p className="text-sm">Create a group to assign a company name and logo to one or more users.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {userGroupsList.map(group => {
                const groupLogo = adminLogos?.find(l => l.id === group.logoId);
                const groupTheme = allThemes?.find(t => t.id === group.themeId);
                const groupAssetDesc = assetDescriptions?.find(a => a.id === group.assetDescriptionId);
                const groupUsers = (users?.filter(u => u.userGroupId === group.id) || []).sort((a, b) => ((a.name || a.email).split(" ")[0]).localeCompare((b.name || b.email).split(" ")[0]));
                return (
                  <div key={group.id} className="bg-muted border border-border rounded-xl p-4" data-testid={`group-card-${group.id}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {groupLogo ? (
                          <div className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center overflow-hidden">
                            <img src={groupLogo.url} alt={groupLogo.name} className="max-w-full max-h-full object-contain" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center">
                            <IconProperties className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-display text-foreground font-medium">{group.name}{group.isDefault && <span className="ml-2 text-xs bg-muted/80 text-muted-foreground px-2 py-0.5 rounded">Default</span>}</h3>
                          <p className="text-sm text-muted-foreground">Logo: <span className="text-foreground">{groupLogo ? groupLogo.name : "Default"}</span></p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => {
                          setEditingGroup(group);
                          setGroupForm({ name: group.name, logoId: group.logoId, themeId: group.themeId, assetDescriptionId: group.assetDescriptionId });
                          setGroupDialogOpen(true);
                        }} className="text-muted-foreground hover:text-foreground hover:bg-muted" data-testid={`button-edit-group-${group.id}`}>
                          <IconPencil className="w-4 h-4" />
                        </Button>
                        {!group.isDefault && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10" data-testid={`button-delete-group-${group.id}`}>
                                <IconTrash className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Group</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Delete this group? Users will be moved to the default group.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteGroupMutation.mutate(group.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3">
                      <span className="bg-muted px-2 py-0.5 rounded flex items-center gap-1">
                        <IconPalette className="w-3 h-3" />
                        Theme: {groupTheme ? groupTheme.name : <span className="italic">None</span>}
                      </span>
                      {groupAssetDesc && <span className="bg-muted px-2 py-0.5 rounded flex items-center gap-1"><IconProperties className="w-3 h-3" />Asset: {groupAssetDesc.name}</span>}
                      <span className="bg-muted px-2 py-0.5 rounded">{groupUsers.length} member{groupUsers.length !== 1 ? "s" : ""}</span>
                    </div>
                    {groupUsers.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {groupUsers.map(u => (
                          <span key={u.id} className="inline-flex items-center gap-1 bg-muted border border-border rounded-full px-3 py-1 text-sm">
                            <span className="font-medium">{u.name || u.email}</span>
                            <Button variant="ghost" size="icon" onClick={() => assignGroupMutation.mutate({ userId: u.id, groupId: null })} className="text-red-400 hover:text-red-600 ml-1 h-5 w-5" title="Remove from group" data-testid={`button-remove-user-${u.id}-from-group`}>
                              &times;
                            </Button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Property Visibility */}
                    {allProperties && allProperties.length > 0 && (() => {
                      const savedIds = new Set(groupPropertyMap?.[group.id] ?? []);
                      const pending = pendingVisibility[group.id];
                      const activeIds = pending ?? savedIds;
                      const isExpanded = expandedVisibility === group.id;
                      const isAllVisible = activeIds.size === 0;
                      const visibleCount = isAllVisible ? allProperties.length : activeIds.size;
                      return (
                        <div className="border-t border-border/60 pt-3 mt-1">
                          <Button
                            variant="ghost"
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full text-left justify-start h-auto py-1"
                            onClick={() => setExpandedVisibility(isExpanded ? null : group.id)}
                          >
                            <IconEye className="w-4 h-4 text-muted-foreground/60" />
                            <span className="font-medium">Property Visibility</span>
                            <span className="text-xs bg-muted px-2 py-0.5 rounded ml-1">
                              {visibleCount} of {allProperties.length} visible
                            </span>
                            <span className="ml-auto">{isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</span>
                          </Button>
                          {isExpanded && (
                            <div className="mt-3 space-y-2">
                              <p className="text-xs text-muted-foreground mb-2">
                                Uncheck to hide a property from this group's members. Unchecking all resets to "show all".
                              </p>
                              {allProperties.map((prop) => {
                                const checked = isAllVisible || activeIds.has(prop.id);
                                return (
                                  <label key={prop.id} className="flex items-center gap-3 cursor-pointer group/prop">
                                    <Checkbox
                                      checked={checked}
                                      onCheckedChange={(val) => {
                                        const base = pending ?? new Set(savedIds.size === 0 ? allProperties.map(p => p.id) : savedIds);
                                        const next = new Set(base);
                                        if (val) next.add(prop.id); else next.delete(prop.id);
                                        const allChecked = next.size === allProperties.length;
                                        setPendingVisibility((prev) => ({ ...prev, [group.id]: allChecked ? new Set() : next }));
                                      }}
                                    />
                                    <span className="text-sm group-hover/prop:text-foreground transition-colors">{prop.name}</span>
                                    <span className="text-xs text-muted-foreground">{prop.location}</span>
                                  </label>
                                );
                              })}
                              <div className="flex gap-2 mt-3 pt-2 border-t border-border/60">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={!pending || setGroupPropertiesMutation.isPending}
                                  onClick={() => {
                                    const ids = Array.from(pending ?? new Set<number>());
                                    setGroupPropertiesMutation.mutate({ groupId: group.id, propertyIds: ids });
                                  }}
                                  className="flex items-center gap-1"
                                >
                                  {setGroupPropertiesMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <IconSave className="w-3 h-3" />}
                                  Save Changes
                                </Button>
                                {pending && (
                                  <Button size="sm" variant="ghost" onClick={() => setPendingVisibility((prev) => { const next = { ...prev }; delete next[group.id]; return next; })}>
                                    Cancel
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2"><IconUserPlus className="w-4 h-4 text-muted-foreground" /> Assign Users to Groups</CardTitle>
          <CardDescription className="label-text">Set which group each user belongs to. Group branding overrides defaults.</CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">User</TableHead>
                <TableHead className="text-muted-foreground text-right">Group</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user, idx) => {
                const currentGroup = userGroupsList?.find(g => g.id === user.userGroupId);
                return (
                  <TableRow key={user.id} className={`border-border hover:bg-muted ${idx % 2 === 1 ? "bg-muted/30" : ""}`} data-testid={`group-assign-row-${user.id}`}>
                    <TableCell className="text-foreground">
                      <div>
                        <span className="font-medium">{user.name || user.email}</span>
                        {user.name && <span className="text-muted-foreground text-xs ml-2">{user.email}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        <Select
                          value={user.userGroupId != null ? String(user.userGroupId) : "none"}
                          onValueChange={(v) => {
                            const groupId = v === "none" ? null : parseInt(v);
                            assignGroupMutation.mutate({ userId: user.id, groupId });
                          }}
                        >
                          <SelectTrigger className="h-9 w-[200px]" data-testid={`select-user-group-${user.id}`}><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Group</SelectItem>
                            {userGroupsList?.map(g => (
                              <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
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
            <Label className="flex items-center gap-2"><IconPeople className="w-4 h-4 text-muted-foreground" />Group Name</Label>
            <Input value={groupForm.name} onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })} placeholder="e.g., KIT Capital Team" data-testid="input-group-name" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><IconImage className="w-4 h-4 text-muted-foreground" />Logo (includes company name)</Label>
            <Select value={groupForm.logoId != null ? String(groupForm.logoId) : "default"} onValueChange={(v) => setGroupForm({ ...groupForm, logoId: v === "default" ? null : parseInt(v) })} data-testid="select-group-logo">
              <SelectTrigger data-testid="select-group-logo"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default Logo</SelectItem>
                {adminLogos?.map(logo => (
                  <SelectItem key={logo.id} value={String(logo.id)}>
                    <span className="flex items-center gap-2">
                      <img src={logo.url} alt="" className="w-5 h-5 rounded object-contain shrink-0" />
                      {logo.name}{logo.isDefault ? " (Default)" : ""}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><IconPalette className="w-4 h-4 text-muted-foreground" />Theme</Label>
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
            <Label className="flex items-center gap-2"><IconProperties className="w-4 h-4 text-muted-foreground" />Property Description</Label>
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
            {(createGroupMutation.isPending || updateGroupMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : <IconSave className="w-4 h-4" />}
            {editingGroup ? "Save Changes" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
