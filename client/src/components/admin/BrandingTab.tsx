/**
 * BrandingTab.tsx — Platform-wide branding configuration.
 *
 * Controls the visual identity of the entire platform instance:
 *   • Company name — displayed in the sidebar, headers, and PDF exports
 *   • Primary logo — selected from the LogosTab library; shown in the
 *     sidebar, login page, and exported documents
 *   • Property type label — the default noun used for properties throughout
 *     the UI (e.g. "Hotel", "Property", "Resort", "Asset")
 *   • Asset descriptions — configurable labels that appear in user groups
 *     and can be overridden per-group for white-labeling
 *
 * Changes here immediately affect all users (unless overridden by their
 * user group's branding). This is the platform-level default; user groups
 * can layer on their own logo, theme, and asset description.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Loader2, Plus, Trash2, Users, Building2, Tag, Image, Upload, Star } from "lucide-react";
import defaultLogo from "@/assets/logo.png";
import { invalidateAllFinancialQueries } from "@/lib/api";
import type { Logo, User, UserGroup, AssetDesc } from "./types";

interface BrandingTabProps {
  onNavigate?: (tab: string) => void;
}

export default function BrandingTab({ onNavigate }: BrandingTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newAssetDescName, setNewAssetDescName] = useState("");

  const { data: globalAssumptions } = useQuery({
    queryKey: ["globalAssumptions"],
    queryFn: async () => {
      const res = await fetch("/api/global-assumptions", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch global assumptions");
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

  const { data: userGroupsList } = useQuery<UserGroup[]>({
    queryKey: ["admin", "user-groups"],
    queryFn: async () => {
      const res = await fetch("/api/admin/user-groups", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch user groups");
      return res.json();
    },
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  const updateGlobalMutation = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      const res = await fetch("/api/global-assumptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...globalAssumptions, ...updates }),
      });
      if (!res.ok) throw new Error("Failed to update settings");
      return res.json();
    },
    onSuccess: () => {
      invalidateAllFinancialQueries(queryClient);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    },
  });

  const createAssetDescMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      const res = await fetch("/api/admin/asset-descriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create asset description");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "asset-descriptions"] });
      setNewAssetDescName("");
      toast({ title: "Asset Description Added", description: "New asset description has been created." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteAssetDescMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/asset-descriptions/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete asset description");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "asset-descriptions"] });
      toast({ title: "Asset Description Deleted", description: "Asset description has been removed." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" /> Management Company</CardTitle>
          <CardDescription className="label-text">Define the management company name and logo used in financial reports and navigation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="label-text text-gray-700">Company Name</Label>
              <Input
                value={globalAssumptions?.companyName || "Hospitality Business"}
                onChange={(e) => updateGlobalMutation.mutate({ companyName: e.target.value })}
                placeholder="Enter management company name"
                className="bg-white"
                data-testid="input-company-name"
              />
              <p className="text-xs text-muted-foreground">The entity name used in financial modeling and reports</p>
            </div>
            <div className="space-y-2">
              <Label className="label-text text-gray-700">Company Logo</Label>
              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 rounded-lg border-2 border-dashed border-primary/40 flex items-center justify-center overflow-hidden bg-white">
                  <img
                    src={(() => {
                      if (globalAssumptions?.companyLogoId) {
                        const logo = adminLogos?.find(l => l.id === globalAssumptions.companyLogoId);
                        if (logo) return logo.url;
                      }
                      return globalAssumptions?.companyLogoUrl || globalAssumptions?.companyLogo || defaultLogo;
                    })()}
                    alt="Company logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Select
                    value={globalAssumptions?.companyLogoId ? String(globalAssumptions.companyLogoId) : "default"}
                    onValueChange={(v) => {
                      const logoId = v === "default" ? null : Number(v);
                      updateGlobalMutation.mutate({ companyLogoId: logoId }, {
                        onSuccess: () => toast({ title: logoId ? "Logo updated" : "Logo reset", description: logoId ? "Management company logo has been updated." : "Logo has been reset to default." })
                      });
                    }}
                  >
                    <SelectTrigger data-testid="select-company-logo"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default Logo</SelectItem>
                      {adminLogos?.map(logo => (
                        <SelectItem key={logo.id} value={String(logo.id)}>{logo.name}{logo.isDefault ? " (Default)" : ""}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Select from Logo Portfolio below</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2"><Tag className="w-5 h-5 text-primary" /> Property Type</CardTitle>
          <CardDescription className="label-text">Set the property type label used across the application</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label className="label-text text-gray-700">Property Type Label</Label>
            <Input
              value={globalAssumptions?.propertyLabel || "Boutique Hotel"}
              onChange={(e) => updateGlobalMutation.mutate({ propertyLabel: e.target.value })}
              placeholder="e.g., Boutique Hotel, Estate Hotel, Private Estate"
              className="bg-white max-w-md"
              data-testid="input-property-label"
            />
            <p className="text-xs text-muted-foreground">This label appears in page titles, research prompts, and financial reports</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2"><Tag className="w-5 h-5 text-primary" /> Asset Descriptions</CardTitle>
          <CardDescription className="label-text">Define asset description labels that can be assigned to users</CardDescription>
        </CardHeader>
        <CardContent className="relative space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {assetDescriptions?.map(ad => (
              <div key={ad.id} className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center justify-between" data-testid={`asset-desc-card-${ad.id}`}>
                <div className="min-w-0">
                  <p className="text-foreground font-medium truncate">{ad.name}</p>
                  {ad.isDefault && <span className="text-xs text-primary font-mono">DEFAULT</span>}
                </div>
                {!ad.isDefault && (
                  <Button variant="ghost" size="sm" onClick={() => deleteAssetDescMutation.mutate(ad.id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10" data-testid={`button-delete-asset-desc-${ad.id}`}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <div className="border-t border-primary/20 pt-4">
            <div className="flex gap-3 items-end">
              <div className="flex-1 space-y-1">
                <Label className="text-muted-foreground text-xs">Name</Label>
                <Input value={newAssetDescName} onChange={(e) => setNewAssetDescName(e.target.value)} placeholder="e.g., Luxury Resort, Urban Boutique" className="bg-primary/5 border-primary/20" data-testid="input-new-asset-desc-name" />
              </div>
              <Button variant="outline" onClick={() => createAssetDescMutation.mutate({ name: newAssetDescName })} disabled={!newAssetDescName || createAssetDescMutation.isPending} className="flex items-center gap-2" data-testid="button-add-asset-desc">
                {createAssetDescMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-display flex items-center gap-2"><Image className="w-5 h-5 text-primary" /> Logo Portfolio</CardTitle>
              <CardDescription className="label-text">Manage logos available for user assignment</CardDescription>
            </div>
            <Button variant="outline" onClick={() => onNavigate?.("logos")} className="flex items-center gap-2" data-testid="button-go-to-logos">
              <Upload className="w-4 h-4" /> Manage Logos
            </Button>
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminLogos?.map(logo => (
              <div key={logo.id} className="relative bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center gap-4" data-testid={`logo-card-${logo.id}`}>
                <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/20">
                  <img src={logo.url} alt={logo.name} className="max-w-full max-h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).src = defaultLogo; }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground font-medium truncate">{logo.name}</p>
                  {logo.isDefault && <span className="text-xs text-amber-600 font-mono flex items-center gap-1"><Star className="w-3 h-3 fill-amber-500" /> DEFAULT</span>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> User Branding</CardTitle>
          <CardDescription className="label-text">Branding is managed at the User Group level. Assign users to groups in the User Groups tab to control their branding experience.</CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <Table>
            <TableHeader>
              <TableRow className="border-primary/20 hover:bg-transparent">
                <TableHead className="text-muted-foreground">User</TableHead>
                <TableHead className="text-muted-foreground">Role</TableHead>
                <TableHead className="text-muted-foreground">Group</TableHead>
                <TableHead className="text-muted-foreground">Effective Logo</TableHead>
                <TableHead className="text-muted-foreground">Effective Theme</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map(user => {
                const group = userGroupsList?.find((g: UserGroup) => g.id === user.userGroupId);
                const groupLogo = group?.logoId ? adminLogos?.find(l => l.id === group.logoId) : null;
                const groupTheme = group?.themeId ? allThemes?.find(t => t.id === group.themeId) : null;
                return (
                  <TableRow key={user.id} className="border-primary/20 hover:bg-primary/5" data-testid={`branding-row-${user.id}`}>
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
                    <TableCell className="text-muted-foreground">
                      {group ? <span className="text-sm font-medium">{group.name}</span> : <span className="text-muted-foreground text-sm italic">No group</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {groupLogo ? (
                        <div className="flex items-center gap-2">
                          <img src={groupLogo.url} alt={groupLogo.name} className="w-6 h-6 rounded object-contain bg-primary/10" />
                          <span className="text-sm">{groupLogo.name}</span>
                        </div>
                      ) : <span className="text-muted-foreground text-sm">Default</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {groupTheme ? <span className="text-sm">{groupTheme.name}</span> : <span className="text-muted-foreground text-sm">Default</span>}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}