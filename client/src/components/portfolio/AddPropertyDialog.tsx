/**
 * AddPropertyDialog.tsx — Modal dialog for creating a new portfolio property.
 *
 * Presents a multi-field form collecting the minimum inputs needed to
 * bootstrap a property's financial model:
 *   • Property name and street address / market
 *   • Room count (drives all per-room revenue calculations)
 *   • ADR (Average Daily Rate — the nightly rack rate)
 *   • Purchase price and optional renovation budget
 *   • Hero image — either a URL or AI-generated via the PropertyImagePicker
 *   • Optional SPV company assignment
 *
 * On submit, the form data is POSTed to the API which creates the property
 * row with default assumptions (global defaults merged with user inputs).
 * The user is then redirected to the Edit Property page to refine assumptions.
 *
 * Exports AddPropertyFormData — the shape of the form's validated output.
 */
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus } from "lucide-react";
import { PropertyImagePicker } from "@/features/property-images";
import { CurrencyInput } from "./CurrencyInput";

export interface AddPropertyFormData {
  name: string;
  location: string;
  market: string;
  imageUrl: string;
  status: string;
  acquisitionDate: string;
  operationsStartDate: string;
  purchasePrice: number;
  buildingImprovements: number;
  preOpeningCosts: number;
  operatingReserve: number;
  roomCount: number;
  startAdr: number;
  adrGrowthRate: number;
  startOccupancy: number;
  maxOccupancy: number;
  occupancyRampMonths: number;
  occupancyGrowthStep: number;
  stabilizationMonths: number;
  type: string;
  cateringBoostPercent: number;
}

interface AddPropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: AddPropertyFormData;
  setFormData: React.Dispatch<React.SetStateAction<AddPropertyFormData>>;
  onSubmit: () => void;
  isPending: boolean;
  onCancel: () => void;
  onAcquisitionDateChange: (date: string) => void;
  trigger: React.ReactNode;
}

export function AddPropertyDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  isPending,
  onCancel,
  onAcquisitionDateChange,
  trigger,
}: AddPropertyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="font-display text-2xl">Add New Property</DialogTitle>
        <DialogDescription className="label-text">
          Enter the details for the new property in your portfolio.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-6 py-4">
        <div className="space-y-4">
          <h3 className="font-display text-lg border-b pb-2">Property Photo</h3>
          <PropertyImagePicker
            imageUrl={formData.imageUrl}
            onImageChange={(url) => setFormData(prev => ({ ...prev, imageUrl: url }))}
            propertyName={formData.name}
            location={formData.location}
            variant="light"
          />
        </div>

        <div className="space-y-4">
          <h3 className="font-display text-lg border-b pb-2">Basic Information</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Property Name</Label>
              <Input
                id="name"
                data-testid="input-property-name"
                placeholder="e.g., Casa Verde B&B"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                data-testid="input-property-location"
                placeholder="e.g., Oaxaca, Mexico"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="market">Market</Label>
              <Input
                id="market"
                data-testid="input-property-market"
                placeholder="e.g., Leisure/Tourism"
                value={formData.market}
                onChange={(e) => setFormData(prev => ({ ...prev, market: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}>
                <SelectTrigger data-testid="select-property-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pipeline">Pipeline</SelectItem>
                  <SelectItem value="In Negotiation">In Negotiation</SelectItem>
                  <SelectItem value="Acquired">Acquired</SelectItem>
                  <SelectItem value="Improvements">Improvements</SelectItem>
                  <SelectItem value="Operating">Operating</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-display text-lg border-b pb-2">Property Details</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="roomCount">Room Count</Label>
              <Input
                id="roomCount"
                type="number"
                data-testid="input-room-count"
                value={formData.roomCount}
                onChange={(e) => setFormData(prev => ({ ...prev, roomCount: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Acquisition Type</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData(prev => ({ ...prev, type: v }))}>
                <SelectTrigger data-testid="select-acquisition-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Full Equity">Full Equity</SelectItem>
                  <SelectItem value="Financed">Financed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-display text-lg border-b pb-2">Catering Boost</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cateringBoostPercent">Catering Boost %</Label>
              <div className="relative">
                <Input
                  id="cateringBoostPercent"
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  data-testid="input-catering-boost-pct"
                  className="pr-7"
                  value={(formData.cateringBoostPercent * 100).toFixed(0)}
                  onChange={(e) => setFormData(prev => ({ ...prev, cateringBoostPercent: (parseFloat(e.target.value) || 0) / 100 }))}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
              </div>
              <p className="text-xs text-muted-foreground">Percentage uplift applied to F&B revenue from catered events. Should reflect blended average across all events.</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-display text-lg border-b pb-2">Timeline</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="acquisitionDate">Acquisition Date</Label>
              <Input
                id="acquisitionDate"
                type="date"
                data-testid="input-acquisition-date"
                value={formData.acquisitionDate}
                onChange={(e) => onAcquisitionDateChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="operationsStartDate">Operations Start Date</Label>
              <Input
                id="operationsStartDate"
                type="date"
                data-testid="input-operations-date"
                value={formData.operationsStartDate}
                min={formData.acquisitionDate || undefined}
                onChange={(e) => setFormData(prev => ({ ...prev, operationsStartDate: e.target.value }))}
              />
              {formData.acquisitionDate && !formData.operationsStartDate && (
                <p className="text-xs text-muted-foreground">Suggested: 6 months after acquisition</p>
              )}
              {formData.operationsStartDate && formData.acquisitionDate && formData.operationsStartDate < formData.acquisitionDate && (
                <p className="text-xs text-red-500">Operations cannot start before acquisition</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-display text-lg border-b pb-2">Financial Details</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Purchase Price</Label>
              <CurrencyInput
                id="purchasePrice"
                testId="input-purchase-price"
                value={formData.purchasePrice}
                onChange={(val) => setFormData(prev => ({ ...prev, purchasePrice: val }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buildingImprovements">Building Improvements</Label>
              <CurrencyInput
                id="buildingImprovements"
                testId="input-building-improvements"
                value={formData.buildingImprovements}
                onChange={(val) => setFormData(prev => ({ ...prev, buildingImprovements: val }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preOpeningCosts">Pre-Opening Costs</Label>
              <CurrencyInput
                id="preOpeningCosts"
                testId="input-pre-opening-costs"
                value={formData.preOpeningCosts}
                onChange={(val) => setFormData(prev => ({ ...prev, preOpeningCosts: val }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="operatingReserve">Operating Reserve</Label>
              <CurrencyInput
                id="operatingReserve"
                testId="input-operating-reserve"
                value={formData.operatingReserve}
                onChange={(val) => setFormData(prev => ({ ...prev, operatingReserve: val }))}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-display text-lg border-b pb-2">Revenue Assumptions</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startAdr">Starting ADR</Label>
              <CurrencyInput
                id="startAdr"
                testId="input-start-adr"
                value={formData.startAdr}
                onChange={(val) => setFormData(prev => ({ ...prev, startAdr: val }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adrGrowthRate">ADR Growth Rate</Label>
              <div className="relative">
                <Input
                  id="adrGrowthRate"
                  type="number"
                  step="0.1"
                  data-testid="input-adr-growth"
                  className="pr-7"
                  value={(formData.adrGrowthRate * 100).toFixed(1)}
                  onChange={(e) => setFormData(prev => ({ ...prev, adrGrowthRate: (parseFloat(e.target.value) || 0) / 100 }))}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startOccupancy">Starting Occupancy</Label>
              <div className="relative">
                <Input
                  id="startOccupancy"
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  data-testid="input-start-occupancy"
                  className="pr-7"
                  value={(formData.startOccupancy * 100).toFixed(0)}
                  onChange={(e) => setFormData(prev => ({ ...prev, startOccupancy: (parseFloat(e.target.value) || 0) / 100 }))}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxOccupancy">Max Occupancy</Label>
              <div className="relative">
                <Input
                  id="maxOccupancy"
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  data-testid="input-max-occupancy"
                  className="pr-7"
                  value={(formData.maxOccupancy * 100).toFixed(0)}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxOccupancy: (parseFloat(e.target.value) || 0) / 100 }))}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          variant="outline"
          data-testid="button-submit-property"
          onClick={onSubmit} 
          disabled={isPending}
          className="flex items-center gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Add Property
            </>
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
    </Dialog>
  );
}
