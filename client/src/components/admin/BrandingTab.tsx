import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Tag } from "lucide-react";
import { useGlobalAssumptions, useUpdateGlobalAssumptions } from "./hooks";
import LogoSelector from "./LogoSelector";
import { ADMIN_TEXTAREA } from "./styles";

interface BrandingTabProps {
  onNavigate?: (tab: string) => void;
}

export default function BrandingTab({ onNavigate }: BrandingTabProps) {
  const { toast } = useToast();
  const { data: globalAssumptions } = useGlobalAssumptions();
  const updateGlobalMutation = useUpdateGlobalAssumptions();

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
            <LogoSelector
              label="Company Logo"
              value={globalAssumptions?.companyLogoId ?? null}
              onChange={(logoId) => {
                updateGlobalMutation.mutate({ companyLogoId: logoId }, {
                  onSuccess: () => toast({ title: logoId ? "Logo updated" : "Logo reset", description: logoId ? "Management company logo has been updated." : "Logo has been reset to default." })
                });
              }}
              showNone={true}
              emptyLabel="Default Logo"
              helpText="Select from Logo Portfolio"
              testId="select-company-logo"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur-xl border-primary/20 shadow-[0_8px_32px_rgba(159,188,164,0.1)]">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2"><Tag className="w-5 h-5 text-primary" /> Asset Type</CardTitle>
          <CardDescription className="label-text">Define the type of property being profiled — used across page titles, research prompts, and financial reports</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <LogoSelector
            label="Asset Logo"
            value={globalAssumptions?.assetLogoId ?? null}
            onChange={(logoId) => {
              updateGlobalMutation.mutate({ assetLogoId: logoId }, {
                onSuccess: () => toast({ title: "Asset logo updated", description: "The asset type logo has been updated." })
              });
            }}
            showNone={false}
            useDefaultFallback={true}
            helpText="Select from Logo Portfolio"
            testId="select-asset-logo"
          />

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
              className={ADMIN_TEXTAREA}
              data-testid="input-asset-description"
            />
            <p className="text-xs text-muted-foreground">A detailed description that educates the AI research engines on the exact type of property being analyzed — the more specific, the better the research quality</p>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
