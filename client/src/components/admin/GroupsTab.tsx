/**
 * GroupsTab.tsx — Standalone Group CRUD management.
 * 
 * Extracted from UserGroupsTab to provide a dedicated interface for 
 * managing user groups, including branding, asset descriptions, 
 * and property visibility.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Loader2, ChevronDown, ChevronUp } from "@/components/icons/themed-icons";
import { IconPlus, IconSave, IconEye, IconPeople, IconProperties, IconPencil, IconTrash, IconPalette, IconBuilding } from "@/components/icons";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useAdminLogos, useAdminCompanies, useAdminUserGroups, useAdminThemes, useAdminAssetDescriptions } from "./hooks";
import type { UserGroup } from "./types";
import type { Property } from "@shared/schema";

type GroupUser = { id: number; email: string; firstName: string | null; lastName: string | null; name: string | null; role: string; userGroupId: number | null; company: string | null; companyId: number | null; title: string | null };
type Company = { id: number; name: string; logoId: number | null; isActive: boolean };

export default function GroupsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  const [groupForm, setGroupForm] = useState({ 
    name: "", 
    themeId: null as number | null, 
    assetDescriptionId: null as number | null 
  });
  const [expandedVisibility, setExpandedVisibility] = useState<number | null>(null);
  const [pendingVisibility, setPendingVisibility] = useState<Record<number, Set<number>>>({});

  const { data: adminLogos } = useAdminLogos();
  const { data: companies } = useAdminCompanies();
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

  const { data: allUsers } = useQuery<GroupUser[]>({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
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
    mutationFn: async (data: { name: string; themeId?: number | null; assetDescriptionId?: number | null }) => {
      const res = await fetch("/api/user-groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), credentials: "include" });
      if (!res.ok) throw new Error("Failed to create group");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "user-groups"] });
      setGroupDialogOpen(false);
      setGroupForm({ name: "", themeId: null, assetDescriptionId: null });
      setEditingGroup(null);
      toast({ title: "Group Created", description: "User group has been created." });
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; name?: string; themeId?: number | null; assetDescriptionId?: number | null }) => {
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

  return (
    <div className="space-y-6">
      <Card className="bg-card border border-border/80 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2"><IconPeople className="w-4 h-4 text-muted-foreground" /> User Groups</CardTitle>
              <CardDescription className="label-text">Create and manage groups with custom branding, themes, and asset labels.</CardDescription>
            </div>
            <Button variant="outline" onClick={() => {
              setEditingGroup(null);
              setGroupForm({ name: "", themeId: null, assetDescriptionId: null });
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
              <p className="text-sm">Create a group to define custom branding for your users.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {userGroupsList.map(group => {
                const groupTheme = allThemes?.find(t => t.id === group.themeId);
                const groupAssetDesc = assetDescriptions?.find(a => a.id === group.assetDescriptionId);
                const members = (allUsers ?? []).filter(u => u.userGroupId === group.id);
                const memberCompanyIds = Array.from(new Set(members.map(m => m.companyId).filter((id): id is number => id != null)));
                const singleCompany = memberCompanyIds.length === 1 ? companies?.find(c => c.id === memberCompanyIds[0]) : null;
                const derivedLogo = singleCompany?.logoId ? adminLogos?.find(l => l.id === singleCompany.logoId) : null;
                const initials = group.name.split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <div key={group.id} className="bg-muted border border-border rounded-xl p-4" data-testid={`group-card-${group.id}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {derivedLogo ? (
                          <div className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center overflow-hidden">
                            <img src={derivedLogo.url} alt={derivedLogo.name} className="max-w-full max-h-full object-contain" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-border flex items-center justify-center">
                            <span className="text-xs font-semibold text-primary">{initials}</span>
                          </div>
                        )}
                        <div>
                          <h3 className="font-display text-foreground font-medium">{group.name}{group.isDefault && <span className="ml-2 text-xs bg-muted/80 text-muted-foreground px-2 py-0.5 rounded">Default</span>}</h3>
                          <p className="text-sm text-muted-foreground">{derivedLogo ? <>Logo: <span className="text-foreground">{singleCompany?.name}</span></> : members.length > 0 ? <span className="italic">Mixed companies</span> : <span className="italic">No members</span>}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => {
                          setEditingGroup(group);
                          setGroupForm({ name: group.name, themeId: group.themeId, assetDescriptionId: group.assetDescriptionId });
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
                      <span className="bg-muted px-2 py-0.5 rounded flex items-center gap-1 border border-border/40">
                        <IconPalette className="w-3 h-3 text-muted-foreground/70" />
                        Theme: {groupTheme ? groupTheme.name : <span className="italic">None</span>}
                      </span>
                      {groupAssetDesc && (
                        <span className="bg-muted px-2 py-0.5 rounded flex items-center gap-1 border border-border/40">
                          <IconProperties className="w-3 h-3 text-muted-foreground/70" />
                          Asset: {groupAssetDesc.name}
                        </span>
                      )}
                    </div>

                    {/* Group Members */}
                    {members.length > 0 && (
                        <div className="border-t border-border/60 pt-3 mt-1 mb-1">
                          <div className="flex items-center gap-2 mb-2">
                            <IconPeople className="w-3.5 h-3.5 text-muted-foreground/60" />
                            <span className="text-xs font-medium text-muted-foreground">{members.length} member{members.length !== 1 ? "s" : ""}</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {members.map(m => (
                              <div key={m.id} className="flex items-center gap-2 bg-card/60 border border-border/40 rounded-lg px-2.5 py-1.5" data-testid={`group-member-${m.id}`}>
                                <UserAvatar firstName={m.firstName} lastName={m.lastName} name={m.name} email={m.email} size="sm" />
                                <div className="leading-tight">
                                  <div className="text-xs font-medium text-foreground">{m.firstName}{m.lastName ? ` ${m.lastName}` : ""}</div>
                                  <div className="text-[10px] text-muted-foreground">{m.title || m.role}</div>
                                </div>
                              </div>
                            ))}
                          </div>
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
                                  Save
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

      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">{editingGroup ? "Edit Group" : "Create User Group"}</DialogTitle>
            <DialogDescription className="label-text">{editingGroup ? "Update group settings" : "Create a new group with custom branding and preferences"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium"><IconPeople className="w-4 h-4 text-muted-foreground/80" /> Group Name</Label>
              <Input value={groupForm.name} onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })} placeholder="e.g., KIT Capital Team" data-testid="input-group-name" />
            </div>
            <p className="text-xs text-muted-foreground italic">Logo is derived automatically from the company if all members share the same company.</p>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium"><IconPalette className="w-4 h-4 text-muted-foreground/80" /> Theme</Label>
              <Select value={groupForm.themeId != null ? String(groupForm.themeId) : "default"} onValueChange={(v) => setGroupForm({ ...groupForm, themeId: v === "default" ? null : parseInt(v) })}>
                <SelectTrigger data-testid="select-group-theme"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default Theme</SelectItem>
                  {allThemes?.map(theme => (
                    <SelectItem key={theme.id} value={String(theme.id)}>{theme.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium"><IconProperties className="w-4 h-4 text-muted-foreground/80" /> Property Description (Property Label)</Label>
              <Select value={groupForm.assetDescriptionId != null ? String(groupForm.assetDescriptionId) : "default"} onValueChange={(v) => setGroupForm({ ...groupForm, assetDescriptionId: v === "default" ? null : parseInt(v) })}>
                <SelectTrigger data-testid="select-group-asset-desc"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default Label</SelectItem>
                  {assetDescriptions?.map(ad => (
                    <SelectItem key={ad.id} value={String(ad.id)}>{ad.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGroupDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => {
                if (!groupForm.name) return toast({ title: "Name Required", description: "Please enter a group name.", variant: "destructive" });
                if (editingGroup) {
                  updateGroupMutation.mutate({ id: editingGroup.id, ...groupForm });
                } else {
                  createGroupMutation.mutate(groupForm);
                }
              }}
              disabled={createGroupMutation.isPending || updateGroupMutation.isPending}
              data-testid="button-save-group"
            >
              {(createGroupMutation.isPending || updateGroupMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingGroup ? "Save Changes" : "Create Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
