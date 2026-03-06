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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Users, Building2, Tag, Image, Upload } from "lucide-react";
import defaultLogo from "@/assets/logo.png";
import { invalidateAllFinancialQueries } from "@/lib/api";
import type { Logo } from "./types";

interface BrandingTabProps {
  onNavigate?: (tab: string) => void;
}

export default function BrandingTab({ onNavigate }: BrandingTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
          <CardTitle className="font-display flex items-center gap-2"><Tag className="w-5 h-5 text-primary" /> Asset Type</CardTitle>
          <CardDescription className="label-text">Define the type of property being profiled — used across page titles, research prompts, and financial reports</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="label-text text-gray-700">Asset Label</Label>
            <Input
              value={globalAssumptions?.propertyLabel || "Boutique Hotel"}
              onChange={(e) => updateGlobalMutation.mutate({ propertyLabel: e.target.value })}
              placeholder="e.g., Boutique Hotel, Estate Hotel, Private Estate"
              className="bg-white max-w-md"
              data-testid="input-property-label"
            />
            <p className="text-xs text-muted-foreground">A one-line label for the kind of property being profiled — appears in the UI and feeds into AI research prompts</p>
          </div>

          <div className="space-y-2">
            <Label className="label-text text-gray-700">Asset Description</Label>
            <textarea
              value={globalAssumptions?.assetDescription || ""}
              onChange={(e) => updateGlobalMutation.mutate({ assetDescription: e.target.value })}
              placeholder="Describe the type of property in detail to educate the research engines. For example: Independently operated, design-forward boutique hotels with 20-60 rooms, situated on 5+ acres of private grounds. Properties feature curated F&B programs, wellness amenities, and distinctive event spaces for retreats and experiential hospitality."
              className="flex min-h-[120px] w-full rounded-xl border border-primary/20 bg-white px-3 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
              data-testid="input-asset-description"
            />
            <p className="text-xs text-muted-foreground">A detailed description that educates the AI research engines on the exact type of property being analyzed — the more specific, the better the research quality</p>
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