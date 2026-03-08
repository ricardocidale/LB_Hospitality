import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tag, Save } from "lucide-react";
import { useGlobalAssumptions, useUpdateGlobalAssumptions } from "./hooks";
import { ADMIN_TEXTAREA } from "./styles";

const DEFAULT_ICP_DESCRIPTION = `IDEAL CUSTOMER PROFILE — TARGET PROPERTY DEFINITION

PROPERTY TYPE & POSITIONING
Luxury boutique hotel, estate hotel, or private estate suitable for conversion into a hospitality asset. Properties must convey exclusivity, character, and a sense of place. Chain-affiliated or conventional box hotels are excluded.

SIZE & CAPACITY
• 10–50 guest rooms (sweet spot: 20–30 rooms)
• Total land area: 2–50+ acres preferred; sufficient acreage for outdoor programming, privacy buffer, and potential expansion
• Built area: 5,000–30,000+ sq ft of usable interior space
• Event capacity for 50–200 guests (weddings, retreats, corporate offsites)
• Adequate parking for guests and events (20–60+ spaces or valet-ready)

PHYSICAL CONDITION & REGULATORY
• Property in good to excellent structural condition; cosmetic renovation acceptable but no major structural remediation
• Clear zoning for hospitality/commercial use, or demonstrable path to re-zoning
• Building permits and renovation regulations must allow conversion within 6–18 months
• No environmental remediation or encumbrances that would delay opening
• Utilities (water, sewer, electrical, internet) must be adequate for hotel operations or readily upgradeable
• Properties with historic designation are acceptable if renovation flexibility exists

LOCATION CHARACTERISTICS
• Near-total privacy: secluded or estate-like setting, ideally not visible from public roads
• Within 60–90 minutes of a major or regional airport
• Proximity to tourism demand generators (wine regions, mountains, beaches, cultural landmarks, national parks)
• Walkable or short drive to dining, shopping, and recreation

PREFERRED GEOGRAPHIES
United States:
• Northeast: Hudson Valley NY, Berkshires MA, Catskills NY, Connecticut
• Southeast: Asheville NC, Charleston SC, Savannah GA, Florida Gulf Coast
• Southwest: Austin TX Hill Country, Sedona AZ, Santa Fe NM
• West: Napa/Sonoma CA, Park City/Eden UT, Jackson Hole WY, Bend OR

Latin America:
• Colombia: Medellín, Cartagena, Coffee Triangle (Eje Cafetero), Santa Marta/Tayrona
• Mexico: San Miguel de Allende, Oaxaca, Riviera Nayarit, Tulum
• Costa Rica: Guanacaste, Central Valley, Osa Peninsula

EMEA:
• France: Provence, Loire Valley, Bordeaux, Côte d'Azur
• UAE: Dubai (boutique/estate concepts in Jumeirah, Al Barari, Hatta)
• Portugal: Alentejo, Douro Valley, Algarve
• Italy: Tuscany, Umbria, Amalfi Coast
• Spain: Mallorca, Andalusia, Basque Country

PRICING & FINANCIAL PARAMETERS
• Acquisition price: $2M–$8M (target: $3M–$5M)
• Total investment (acquisition + renovation): $3M–$12M
• Target ADR: $200–$500/night depending on market
• Stabilized occupancy: 55%–75%
• Revenue diversification: events (weddings/retreats), F&B, spa/wellness must represent 30%–60% of total revenue
• Exit cap rate expectation: 8%–10%
• Target IRR: 15%+ over a 7–10 year hold

AMENITIES & FEATURES (PREFERRED)
• Pool, hot tub, or spa/wellness facilities
• Commercial or semi-commercial kitchen for F&B operations
• Outdoor event spaces (gardens, terraces, lawns, courtyards)
• Indoor meeting/breakout rooms for corporate retreats
• Unique architectural character (historic manor, hacienda, farmhouse, lodge)
• Potential for ancillary structures (A-frames, glamping, treehouses, casitas)

EXCLUSIONS
• Properties requiring more than $3M in structural renovation
• Urban high-rise or mid-rise buildings
• Properties in flood zones or with unresolved environmental issues
• Locations more than 2 hours from a commercial airport
• Properties below 5 rooms or above 80 rooms
• Timeshare or fractional ownership structures`;

export default function AssetDefinitionTab() {
  const { toast } = useToast();
  const { data: globalAssumptions } = useGlobalAssumptions();
  const updateGlobalMutation = useUpdateGlobalAssumptions();

  const [propertyLabel, setPropertyLabel] = useState("");
  const [assetDescription, setAssetDescription] = useState("");
  const [assetDirty, setAssetDirty] = useState(false);

  useEffect(() => {
    if (globalAssumptions) {
      setPropertyLabel(globalAssumptions.propertyLabel || "Boutique Hotel");
      setAssetDescription(globalAssumptions.assetDescription || DEFAULT_ICP_DESCRIPTION);
      setAssetDirty(false);
    }
  }, [globalAssumptions]);

  const handleSaveAsset = () => {
    updateGlobalMutation.mutate(
      { propertyLabel, assetDescription },
      {
        onSuccess: () => {
          setAssetDirty(false);
          toast({ title: "Saved", description: "Ideal Customer Profile saved." });
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2"><Tag className="w-4 h-4 text-muted-foreground" /> Ideal Customer Profile — Asset Definition</CardTitle>
          <CardDescription className="label-text">Define the target property profile — used across page titles, AI research prompts, and financial reports</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="label-text text-foreground">ICP Label</Label>
            <Input
              value={propertyLabel}
              onChange={(e) => { setPropertyLabel(e.target.value); setAssetDirty(true); }}
              placeholder="e.g., Boutique Hotel, Estate Hotel, Private Estate"
              className="bg-card max-w-md"
              data-testid="input-property-label"
            />
            <p className="text-xs text-muted-foreground">A one-line label for the target property type — appears in the UI and feeds into AI research prompts</p>
          </div>

          <div className="space-y-2">
            <Label className="label-text text-foreground">ICP Description (context)</Label>
            <textarea
              value={assetDescription}
              onChange={(e) => { setAssetDescription(e.target.value); setAssetDirty(true); }}
              placeholder="Describe the ideal target property in detail to educate the research engines."
              className={ADMIN_TEXTAREA}
              rows={24}
              data-testid="input-asset-description"
            />
            <p className="text-xs text-muted-foreground">Comprehensive description of the ideal target property — educates AI research engines on size, location, pricing, amenities, and exclusion criteria</p>
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
