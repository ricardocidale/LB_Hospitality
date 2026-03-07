import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Building2, Tag, Save } from "lucide-react";
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

  const [companyName, setCompanyName] = useState("");
  const [companyLogoId, setCompanyLogoId] = useState<number | null>(null);
  const [assetLogoId, setAssetLogoId] = useState<number | null>(null);
  const [propertyLabel, setPropertyLabel] = useState("");
  const [assetDescription, setAssetDescription] = useState("");

  const [companyDirty, setCompanyDirty] = useState(false);
  const [assetDirty, setAssetDirty] = useState(false);

  useEffect(() => {
    if (globalAssumptions) {
      setCompanyName(globalAssumptions.companyName || "Hospitality Business");
      setCompanyLogoId(globalAssumptions.companyLogoId ?? null);
      setAssetLogoId(globalAssumptions.assetLogoId ?? null);
      setPropertyLabel(globalAssumptions.propertyLabel || "Boutique Hotel");
      setAssetDescription(globalAssumptions.assetDescription || "");
      setCompanyDirty(false);
      setAssetDirty(false);
    }
  }, [globalAssumptions]);

  const handleSaveCompany = () => {
    updateGlobalMutation.mutate(
      { companyName, companyLogoId },
      {
        onSuccess: () => {
          setCompanyDirty(false);
          toast({ title: "Saved", description: "Management company settings saved." });
        },
      }
    );
  };

  const handleSaveAsset = () => {
    updateGlobalMutation.mutate(
      { assetLogoId, propertyLabel, assetDescription },
      {
        onSuccess: () => {
          setAssetDirty(false);
          toast({ title: "Saved", description: "Asset type settings saved." });
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2"><Building2 className="w-4 h-4 text-muted-foreground" /> Management Company</CardTitle>
          <CardDescription className="label-text">Define the management company name and logo used in financial reports and navigation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="label-text text-foreground">Company Name</Label>
              <Input
                value={companyName}
                onChange={(e) => { setCompanyName(e.target.value); setCompanyDirty(true); }}
                placeholder="Enter management company name"
                className="bg-card"
                data-testid="input-company-name"
              />
              <p className="text-xs text-muted-foreground">The entity name used in financial modeling and reports</p>
            </div>
            <LogoSelector
              label="Company Logo"
              value={companyLogoId}
              onChange={(logoId) => { setCompanyLogoId(logoId); setCompanyDirty(true); }}
              showNone={true}
              emptyLabel="Default Logo"
              helpText="Select from Logo Portfolio"
              testId="select-company-logo"
            />
          </div>
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSaveCompany}
              disabled={!companyDirty || updateGlobalMutation.isPending}
              data-testid="button-save-company"
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2"><Tag className="w-4 h-4 text-muted-foreground" /> Asset Type</CardTitle>
          <CardDescription className="label-text">Define the type of property being profiled — used across page titles, research prompts, and financial reports</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <LogoSelector
            label="Asset Logo"
            value={assetLogoId}
            onChange={(logoId) => { setAssetLogoId(logoId); setAssetDirty(true); }}
            showNone={false}
            useDefaultFallback={true}
            helpText="Select from Logo Portfolio"
            testId="select-asset-logo"
          />

          <div className="space-y-2">
            <Label className="label-text text-foreground">Asset Label</Label>
            <Input
              value={propertyLabel}
              onChange={(e) => { setPropertyLabel(e.target.value); setAssetDirty(true); }}
              placeholder="e.g., Boutique Hotel, Estate Hotel, Private Estate"
              className="bg-card max-w-md"
              data-testid="input-property-label"
            />
            <p className="text-xs text-muted-foreground">A one-line label for the kind of property being profiled — appears in the UI and feeds into AI research prompts</p>
          </div>

          <div className="space-y-2">
            <Label className="label-text text-foreground">Asset Description</Label>
            <textarea
              value={assetDescription}
              onChange={(e) => { setAssetDescription(e.target.value); setAssetDirty(true); }}
              placeholder="Describe the type of property in detail to educate the research engines. For example: Independently operated, design-forward boutique hotels with 20-60 rooms, situated on 5+ acres of private grounds. Properties feature curated F&B programs, wellness amenities, and distinctive event spaces for retreats and experiential hospitality."
              className={ADMIN_TEXTAREA}
              data-testid="input-asset-description"
            />
            <p className="text-xs text-muted-foreground">A detailed description that educates the AI research engines on the exact type of property being analyzed — the more specific, the better the research quality</p>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSaveAsset}
              disabled={!assetDirty || updateGlobalMutation.isPending}
              data-testid="button-save-asset"
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
