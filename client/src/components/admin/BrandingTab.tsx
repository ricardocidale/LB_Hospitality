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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Loader2, Plus, Trash2, Users, Building2, Tag, Image, Upload } from "lucide-react";
import defaultLogo from "@/assets/logo.png";
import { invalidateAllFinancialQueries } from "@/lib/api";
import type { Logo, AssetDesc } from "./types";

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
      const res = await fetch("/api/logos", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch logos");
      return res.json();
    },
  });

  const { data: assetDescriptions } = useQuery<AssetDesc[]>({
    queryKey: ["admin", "asset-descriptions"],
    queryFn: async () => {
      const res = await fetch("/api/asset-descriptions", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch asset descriptions");
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
      const res = await fetch("/api/asset-descriptions", {
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
      const res = await fetch(`/api/asset-descriptions/${id}`, { method: "DELETE", credentials: "include" });
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => onNavigate?.("logos")}
          className="group bg-white/60 backdrop-blur-sm border border-primary/15 rounded-xl p-4 flex items-center gap-4 hover:border-primary/30 hover:bg-primary/[0.03] transition-all duration-200 text-left cursor-pointer"
          data-testid="button-go-to-logos"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
            <Upload className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800">Logo Portfolio</p>
            <p className="text-xs text-gray-500 mt-0.5">{adminLogos?.length || 0} logos available — manage in Logos section</p>
          </div>
        </button>
        <button
          onClick={() => onNavigate?.("groups")}
          className="group bg-white/60 backdrop-blur-sm border border-primary/15 rounded-xl p-4 flex items-center gap-4 hover:border-primary/30 hover:bg-primary/[0.03] transition-all duration-200 text-left cursor-pointer"
          data-testid="button-go-to-groups"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800">User Branding</p>
            <p className="text-xs text-gray-500 mt-0.5">Assign logos and themes per group in Groups section</p>
          </div>
        </button>
      </div>
    </div>
  );
}