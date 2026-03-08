import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tag, Save } from "lucide-react";
import { useGlobalAssumptions, useUpdateGlobalAssumptions } from "./hooks";
import LogoSelector from "./LogoSelector";
import { ADMIN_TEXTAREA } from "./styles";

export default function AssetDefinitionTab() {
  const { toast } = useToast();
  const { data: globalAssumptions } = useGlobalAssumptions();
  const updateGlobalMutation = useUpdateGlobalAssumptions();

  const [assetLogoId, setAssetLogoId] = useState<number | null>(null);
  const [propertyLabel, setPropertyLabel] = useState("");
  const [assetDescription, setAssetDescription] = useState("");
  const [assetDirty, setAssetDirty] = useState(false);

  useEffect(() => {
    if (globalAssumptions) {
      setAssetLogoId(globalAssumptions.assetLogoId ?? null);
      setPropertyLabel(globalAssumptions.propertyLabel || "Boutique Hotel");
      setAssetDescription(globalAssumptions.assetDescription || "");
      setAssetDirty(false);
    }
  }, [globalAssumptions]);

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
              placeholder="Describe the type of property in detail to educate the research engines."
              className={ADMIN_TEXTAREA}
              data-testid="input-asset-description"
            />
            <p className="text-xs text-muted-foreground">A detailed description that educates the AI research engines on the exact type of property being analyzed</p>
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
