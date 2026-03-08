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

This document defines the ideal property acquisition target for the management company. It is served as context to AI research engines, financial modeling, ADR estimation, revenue mix projections, vendor service scoping, and market analysis. Each attribute is classified as MUST HAVE (M) or NICE TO HAVE (N).

═══════════════════════════════════════════════════
1. PROPERTY TYPE & POSITIONING
═══════════════════════════════════════════════════
(M) Luxury boutique hotel, estate hotel, hacienda, lodge, manor, or large private estate suitable for conversion into a full-service hospitality operation
(M) Property must convey exclusivity, architectural character, and a strong sense of place
(M) Operational or readily convertible to hospitality use (not raw land)
(M) Chain-affiliated or conventional box hotels are excluded
(N) Historic or heritage designation acceptable if renovation flexibility exists
(N) Unique architectural provenance (colonial, farmhouse, mid-century modern, Mediterranean)

═══════════════════════════════════════════════════
2. SIZE, CAPACITY & PHYSICAL DIMENSIONS
═══════════════════════════════════════════════════

Guest Rooms & Suites:
(M) 10–50 guest rooms or suites (sweet spot: 20–30 rooms)
(M) Minimum 2 master suites (400+ sq ft each) with en-suite bathrooms
(N) 3–5 master suites preferred for premium ADR positioning
(M) All guest rooms must have private bathrooms (minimum 1 per room)
(N) Mix of room types: standard kings, premium suites, family suites, honeymoon/bridal suite

Bedrooms & Bathrooms (Total Property):
(M) 15–55 total bedrooms including guest rooms and staff/owner quarters
(M) 15–55 total bathrooms (at least 1:1 ratio to bedrooms)
(N) 2–4 additional half-baths in public/common areas

Land & Built Area:
(M) Total land area: 5–100+ acres; minimum 5 acres for privacy buffer and outdoor programming
(M) Built area: 8,000–40,000+ sq ft of usable interior space
(N) 15,000–25,000 sq ft is the ideal range for operational efficiency
(M) Zoned or zone-convertible for commercial hospitality use

Living & Common Areas:
(M) At least 2 distinct living/lounge areas for guest use (lobby/great room + secondary lounge)
(M) Dedicated dining room or dining area seating 30–60 guests
(N) Library, reading room, or quiet lounge
(N) Game room, media room, or entertainment lounge
(N) Wine cellar or tasting room

Event Capacity:
(M) Indoor event space for 50–150 guests (ballroom, great hall, or convertible space)
(M) Outdoor event space for 80–200 guests (lawn, terrace, garden, courtyard)
(N) Multiple distinct venue options for simultaneous events
(N) Covered outdoor pavilion or tent-ready flat area
(M) Adequate parking: 30–80+ spaces, or valet-ready circular drive

═══════════════════════════════════════════════════
3. OPERATIONAL FACILITIES (HOSPITALITY INFRASTRUCTURE)
═══════════════════════════════════════════════════

Kitchen & Food Service:
(M) Commercial or semi-commercial kitchen (1,000+ sq ft) with hood ventilation, grease trap, walk-in cooler/freezer
(M) Prep area, dish pit, dry storage, and receiving dock
(N) Secondary prep kitchen or pantry kitchen for events
(N) Outdoor cooking area (wood-fired oven, grill station, smoker)
(M) Health department compliant or readily upgradeable to code

Storage & Back-of-House:
(M) Housekeeping storage: linen closets, laundry room with commercial washers/dryers
(M) Maintenance workshop and general storage (1,000+ sq ft)
(M) Receiving/loading area for vendor deliveries
(N) Climate-controlled wine/beverage storage
(N) Dedicated IT/server room or closet

Staff & Operations:
(M) Staff quarters or break room (on-site or adjacent housing for 4–8 key staff)
(M) Administrative office space (front desk, back office, manager's office)
(N) Staff housing: 2–4 separate units or converted barn/casita for live-in staff
(N) Employee parking separate from guest parking

═══════════════════════════════════════════════════
4. AMENITIES & GUEST FACILITIES
═══════════════════════════════════════════════════

Aquatic & Wellness:
(M) Swimming pool (minimum 400 sq ft surface area)
(N) Second pool or infinity/plunge pool
(N) Hot tub or jacuzzi (1–2 units)
(N) Spa facility: 2–4 treatment rooms, sauna, steam room, relaxation lounge
(N) Cold plunge pool or hydrotherapy circuit
(N) Yoga/meditation pavilion or studio

Fitness & Recreation:
(N) Gym/fitness center (500–1,500 sq ft with cardio + weights)
(N) Tennis court (1–2 courts, hard or clay surface)
(N) Pickleball court (1–2 courts)
(N) Basketball half-court
(N) Bocce ball, croquet lawn, or putting green
(N) Hiking/walking trails on property

Equestrian & Agricultural:
(N) Horse barn/stable (4–12+ stalls)
(N) Riding arena or paddock
(N) Pasture/turnout areas (5–20+ acres)
(N) Tack room, feed storage, wash bay
(N) Vegetable garden, herb garden, or small farm (farm-to-table programming)
(N) Orchard, vineyard, or olive grove

Outbuildings & Ancillary Structures:
(N) Casitas, cottages, or guesthouses (2–6 units for premium-rate standalone accommodations)
(N) Barn or converted barn for events, dining, or guest use
(N) Glamping platforms, A-frames, or treehouses for ancillary revenue
(N) Greenhouse or conservatory
(N) Garage: 4–10+ bays for property vehicles, guest overflow, equipment
(N) Chapel, gazebo, or ceremony structure
(N) Fire pit areas, outdoor amphitheater, or stargazing deck

═══════════════════════════════════════════════════
5. PROPERTY CONDITION & AGE
═══════════════════════════════════════════════════
(M) Structural condition: good to excellent; no foundation, roof, or load-bearing issues
(M) Roof age: less than 15 years old or recently replaced
(M) HVAC: functional central or zoned system; upgradeable to modern efficiency standards
(M) Plumbing: copper or PEX; no polybutylene or galvanized pipes requiring full replacement
(M) Electrical: 200+ amp service, up to code or readily upgradeable
(N) Property age: 10–100+ years (character properties preferred; new construction is acceptable if architecturally distinctive)
(N) Recent renovations within last 10 years are a strong plus
(M) No active pest infestation, mold, asbestos, or lead paint issues
(M) Estimated renovation/FF&E budget must stay under $3M for conversion to hotel standard

═══════════════════════════════════════════════════
6. GROUNDS, TOPOGRAPHY & VEGETATION
═══════════════════════════════════════════════════
(M) Topography: gentle rolling hills, flat meadows, or terraced hillside; no extreme slopes requiring retaining walls
(N) Mature landscaping: established trees (oaks, maples, palms, olive trees, or region-appropriate)
(N) Manicured gardens, flowering borders, hedgerows for privacy
(N) Water feature: pond, creek, lake frontage, or fountain
(N) Mountain, valley, ocean, vineyard, or pastoral views
(M) Yard/grounds must support outdoor events, dining, and recreation without major grading
(N) Irrigation system for landscaping

═══════════════════════════════════════════════════
7. PRIVACY & SECURITY
═══════════════════════════════════════════════════
(M) Near-total privacy: property not visible from public roads; setback of 200+ ft minimum
(M) Perimeter fencing, walls, hedgerows, or natural tree line providing visual and acoustic screening
(N) Gated entry with intercom or staffed gatehouse
(N) Security camera system or infrastructure for one
(N) Private road or long driveway approach (500+ ft)
(M) No shared driveways, easements, or right-of-way issues that compromise exclusivity

═══════════════════════════════════════════════════
8. LOCATION & ACCESSIBILITY
═══════════════════════════════════════════════════

Airport Proximity:
(M) Within 60 minutes of a regional or international airport
(N) Within 30 minutes of a major international airport (preferred)
(N) Private airstrip on or adjacent to property

Hospital & Medical:
(M) Within 30 minutes of a hospital or urgent care facility
(N) Within 15 minutes preferred

Transportation & Rideshare:
(M) Rideshare services (Uber/Lyft) available in the area
(M) Property accessible by paved road year-round
(N) Within 15 minutes of a town or village with shops, restaurants, pharmacies
(N) Proximity to scenic drives, wine trails, or recreational corridors

Tourism Demand Generators:
(M) Proximity to tourism attractions (wine regions, mountains, beaches, cultural landmarks, national parks, culinary destinations)
(N) Established wedding/event destination market
(N) Existing tourism infrastructure (tour operators, activity providers, transportation services)

═══════════════════════════════════════════════════
9. PREFERRED GEOGRAPHIES
═══════════════════════════════════════════════════

United States:
• Northeast: Hudson Valley NY, Berkshires MA, Catskills NY, Litchfield Hills CT, Bucks County PA
• Southeast: Asheville NC, Charleston SC, Savannah GA, Florida Gulf Coast, Charlottesville VA
• Southwest: Austin TX Hill Country, Sedona AZ, Santa Fe NM, Fredericksburg TX
• West: Napa/Sonoma CA, Park City/Eden UT, Jackson Hole WY, Bend OR, San Juan Islands WA

Latin America:
• Colombia: Medellín, Cartagena, Coffee Triangle (Eje Cafetero), Santa Marta/Tayrona, Villa de Leyva
• Mexico: San Miguel de Allende, Oaxaca, Riviera Nayarit, Tulum, Valle de Guadalupe
• Costa Rica: Guanacaste, Central Valley, Osa Peninsula

EMEA:
• France: Provence, Loire Valley, Bordeaux, Côte d'Azur, Dordogne
• UAE: Dubai (boutique/estate concepts in Jumeirah, Al Barari, Hatta)
• Portugal: Alentejo, Douro Valley, Algarve
• Italy: Tuscany, Umbria, Amalfi Coast, Lake Como
• Spain: Mallorca, Andalusia, Basque Country

═══════════════════════════════════════════════════
10. FINANCIAL PARAMETERS & REVENUE BENCHMARKS
═══════════════════════════════════════════════════

Acquisition & Investment:
(M) Acquisition price: $2M–$8M (target sweet spot: $3M–$5M)
(M) Total investment (acquisition + renovation + FF&E): $3M–$12M
(M) Renovation/conversion budget: $500K–$3M
(M) FF&E budget: $15,000–$30,000 per room

Revenue Benchmarks (research should validate per-market):
(M) Target ADR: $200–$500/night depending on market and positioning
(M) Stabilized occupancy: 55%–75% (12–18 month ramp)
(M) RevPAR target: $130–$350/night at stabilization

Revenue Mix (as % of Room Revenue — research should estimate per-property):
• Food & Beverage: 35%–60% of room revenue (full-service dining, bar, room service, catering)
• Events (weddings, retreats, corporate): 25%–50% of room revenue
• Spa & Wellness: 8%–15% of room revenue (if spa facility exists)
• Other Services (activities, tours, retail, experiences): 5%–12% of room revenue
• Total ancillary revenue target: 40%–70% of room revenue

Fee Structure:
• Base management fee: 8%–10% of total revenue
• Incentive management fee: 10%–15% of GOP above threshold
• Exit cap rate expectation: 8%–10%
• Target IRR: 15%+ over a 7–10 year hold
• Target equity multiple: 2.0x–3.0x

═══════════════════════════════════════════════════
11. VENDOR & MANAGED SERVICES (VIA MANAGEMENT COMPANY)
═══════════════════════════════════════════════════

The management company coordinates third-party vendor services to each property. Research should estimate costs for these services in each market:

Technology & IT Services:
• Property Management System (PMS), channel manager, booking engine
• Wi-Fi infrastructure (guest and back-of-house networks)
• Point-of-sale systems for F&B, spa, retail
• Security/surveillance systems
• Smart room technology (keyless entry, climate, lighting)
• IT support and managed services contract

Housekeeping & Laundry:
• Daily housekeeping staffing (in-house or outsourced)
• Commercial laundry service or on-site laundry operations
• Deep cleaning and turnover crews for events
• Pest control and property sanitation

Grounds & Maintenance:
• Landscaping and grounds maintenance
• Pool and spa maintenance
• HVAC and mechanical systems maintenance
• Painting, carpentry, and general property upkeep

Professional Services:
• Accounting and bookkeeping
• Legal and compliance
• Insurance (property, liability, workers' comp, business interruption)
• Marketing, PR, and digital advertising
• Revenue management and dynamic pricing

Food & Beverage Vendors:
• Food purveyors and specialty suppliers
• Beverage distributors (wine, spirits, beer)
• Equipment maintenance (kitchen, refrigeration)

═══════════════════════════════════════════════════
12. REGULATORY & COMPLIANCE
═══════════════════════════════════════════════════
(M) Clear zoning for hospitality/commercial use, or demonstrable path to re-zoning within 6 months
(M) Building permits and renovation regulations must allow conversion within 6–18 months
(M) No environmental remediation (wetlands, superfund, brownfield) or title encumbrances
(M) Fire code compliance or clear path to compliance (sprinklers, exits, alarms)
(M) ADA/accessibility compliance or feasible retrofit plan
(M) Health department and food service licensing achievable
(N) Liquor license available or transferable in the jurisdiction
(N) Short-term rental / hotel operating permits straightforward in the municipality

═══════════════════════════════════════════════════
13. EXCLUSIONS
═══════════════════════════════════════════════════
• Properties requiring more than $3M in structural renovation
• Urban high-rise or mid-rise buildings
• Properties in flood zones, wildfire extreme zones, or with unresolved environmental issues
• Locations more than 2 hours from a commercial airport
• Properties below 5 rooms or above 80 rooms
• Timeshare, fractional ownership, or condo-hotel structures
• Properties with active litigation, liens, or title disputes
• Gated communities with HOA restrictions on commercial use
• Properties without year-round road access`;

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
              rows={40}
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
