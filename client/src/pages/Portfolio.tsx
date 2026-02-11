import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useProperties, useDeleteProperty, useCreateProperty, useGlobalAssumptions } from "@/lib/api";
import { formatMoney } from "@/lib/financialEngine";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, MapPin, Bed, ArrowRight, Loader2, Plus, Building2 as BuildingIcon, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import MapView from "./MapView";
import { PageHeader } from "@/components/ui/page-header";
import { GlassButton } from "@/components/ui/glass-button";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { InsertProperty } from "@shared/schema";
import {
  DEFAULT_ADR_GROWTH_RATE,
  DEFAULT_START_OCCUPANCY,
  DEFAULT_MAX_OCCUPANCY,
  DEFAULT_OCCUPANCY_GROWTH_STEP,
  DEFAULT_OCCUPANCY_RAMP_MONTHS,
  DEFAULT_COST_RATE_ROOMS,
  DEFAULT_COST_RATE_FB,
  DEFAULT_COST_RATE_ADMIN,
  DEFAULT_COST_RATE_MARKETING,
  DEFAULT_COST_RATE_PROPERTY_OPS,
  DEFAULT_COST_RATE_UTILITIES,
  DEFAULT_COST_RATE_INSURANCE,
  DEFAULT_COST_RATE_TAXES,
  DEFAULT_COST_RATE_IT,
  DEFAULT_COST_RATE_FFE,
  DEFAULT_COST_RATE_OTHER,
  DEFAULT_REV_SHARE_EVENTS,
  DEFAULT_REV_SHARE_FB,
  DEFAULT_REV_SHARE_OTHER,
  DEFAULT_CATERING_BOOST_PCT,
  DEFAULT_EXIT_CAP_RATE,
  DEFAULT_TAX_RATE,
  DEFAULT_ROOM_COUNT,
  DEFAULT_START_ADR,
  DEFAULT_STABILIZATION_MONTHS,
} from "@/lib/constants";
import { PropertyImagePicker } from "@/features/property-images";

function formatCurrencyDisplay(value: number): string {
  if (!value) return "";
  return new Intl.NumberFormat("en-US").format(value);
}

function parseCurrencyInput(raw: string): number {
  return parseFloat(raw.replace(/[^0-9.]/g, "")) || 0;
}

function addMonths(dateStr: string, months: number): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function CurrencyInput({
  value,
  onChange,
  id,
  testId,
  placeholder = "$0",
}: {
  value: number;
  onChange: (val: number) => void;
  id: string;
  testId: string;
  placeholder?: string;
}) {
  const [displayValue, setDisplayValue] = useState(value ? formatCurrencyDisplay(value) : "");
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(value ? formatCurrencyDisplay(value) : "");
    }
  }, [value, isFocused]);

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
      <Input
        id={id}
        data-testid={testId}
        placeholder={placeholder}
        className="pl-7"
        value={isFocused ? displayValue : (value ? formatCurrencyDisplay(value) : "")}
        onFocus={() => {
          setIsFocused(true);
          setDisplayValue(value ? String(value) : "");
        }}
        onBlur={() => {
          setIsFocused(false);
          const parsed = parseCurrencyInput(displayValue);
          onChange(parsed);
        }}
        onChange={(e) => {
          setDisplayValue(e.target.value);
          const parsed = parseCurrencyInput(e.target.value);
          onChange(parsed);
        }}
      />
    </div>
  );
}

type PortfolioTab = "properties" | "map";

export default function Portfolio() {
  const { data: properties, isLoading, isError } = useProperties();
  const { data: global } = useGlobalAssumptions();
  const deleteProperty = useDeleteProperty();
  const createProperty = useCreateProperty();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<PortfolioTab>("properties");

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    market: "",
    imageUrl: "",
    status: "Development",
    acquisitionDate: "",
    operationsStartDate: "",
    purchasePrice: 0,
    buildingImprovements: 0,
    preOpeningCosts: 0,
    operatingReserve: 0,
    roomCount: DEFAULT_ROOM_COUNT,
    startAdr: DEFAULT_START_ADR,
    adrGrowthRate: DEFAULT_ADR_GROWTH_RATE,
    startOccupancy: DEFAULT_START_OCCUPANCY,
    maxOccupancy: DEFAULT_MAX_OCCUPANCY,
    occupancyRampMonths: DEFAULT_OCCUPANCY_RAMP_MONTHS,
    occupancyGrowthStep: DEFAULT_OCCUPANCY_GROWTH_STEP,
    stabilizationMonths: DEFAULT_STABILIZATION_MONTHS,
    type: "Full Equity",
    cateringBoostPercent: DEFAULT_CATERING_BOOST_PCT,
  });

  const handleAcquisitionDateChange = (date: string) => {
    const updates: Partial<typeof formData> = { acquisitionDate: date };
    if (date && !formData.operationsStartDate) {
      updates.operationsStartDate = addMonths(date, 6);
    }
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleDelete = (id: number, name: string) => {
    deleteProperty.mutate(id, {
      onSuccess: () => {
        toast({
          title: "Property Deleted",
          description: `${name} has been removed from the portfolio.`,
        });
      }
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      location: "",
      market: "",
      imageUrl: "",
      status: "Development",
      acquisitionDate: "",
      operationsStartDate: "",
      purchasePrice: 0,
      buildingImprovements: 0,
      preOpeningCosts: 0,
      operatingReserve: 0,
      roomCount: DEFAULT_ROOM_COUNT,
      startAdr: DEFAULT_START_ADR,
      adrGrowthRate: DEFAULT_ADR_GROWTH_RATE,
      startOccupancy: DEFAULT_START_OCCUPANCY,
      maxOccupancy: DEFAULT_MAX_OCCUPANCY,
      occupancyRampMonths: DEFAULT_OCCUPANCY_RAMP_MONTHS,
      occupancyGrowthStep: DEFAULT_OCCUPANCY_GROWTH_STEP,
      stabilizationMonths: DEFAULT_STABILIZATION_MONTHS,
      type: "Full Equity",
      cateringBoostPercent: DEFAULT_CATERING_BOOST_PCT,
    });
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.location || !formData.imageUrl) {
      toast({
        title: "Missing Information",
        description: "Please fill in the property name, location, and upload a photo.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.acquisitionDate || !formData.operationsStartDate) {
      toast({
        title: "Missing Dates",
        description: "Please set both the acquisition date and operations start date.",
        variant: "destructive",
      });
      return;
    }

    if (formData.operationsStartDate < formData.acquisitionDate) {
      toast({
        title: "Invalid Dates",
        description: "Operations start date cannot be before the acquisition date.",
        variant: "destructive",
      });
      return;
    }

    const propertyData: InsertProperty = {
      ...formData,
      costRateRooms: DEFAULT_COST_RATE_ROOMS,
      costRateFB: DEFAULT_COST_RATE_FB,
      costRateAdmin: DEFAULT_COST_RATE_ADMIN,
      costRateMarketing: DEFAULT_COST_RATE_MARKETING,
      costRatePropertyOps: DEFAULT_COST_RATE_PROPERTY_OPS,
      costRateUtilities: DEFAULT_COST_RATE_UTILITIES,
      costRateInsurance: DEFAULT_COST_RATE_INSURANCE,
      costRateTaxes: DEFAULT_COST_RATE_TAXES,
      costRateIT: DEFAULT_COST_RATE_IT,
      costRateFFE: DEFAULT_COST_RATE_FFE,
      costRateOther: DEFAULT_COST_RATE_OTHER,
      revShareEvents: DEFAULT_REV_SHARE_EVENTS,
      revShareFB: DEFAULT_REV_SHARE_FB,
      revShareOther: DEFAULT_REV_SHARE_OTHER,
      cateringBoostPercent: formData.cateringBoostPercent,
      exitCapRate: DEFAULT_EXIT_CAP_RATE,
      taxRate: DEFAULT_TAX_RATE,
    };

    createProperty.mutate(propertyData, {
      onSuccess: () => {
        toast({
          title: "Property Added",
          description: `${formData.name} has been added to the portfolio.`,
        });
        setIsAddDialogOpen(false);
        resetForm();
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to add property. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (isError) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
          <AlertTriangle className="w-8 h-8 text-destructive" />
          <p className="text-muted-foreground">Failed to load portfolio data. Please try refreshing the page.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <PageHeader
          title="Property Portfolio"
          subtitle="Managed assets & developments"
          variant="dark"
          actions={
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <GlassButton data-testid="button-add-property">
                  <Plus className="w-4 h-4" />
                  Add Property
                </GlassButton>
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
                          <SelectItem value="Development">Planned</SelectItem>
                          <SelectItem value="Operational">Active</SelectItem>
                          <SelectItem value="Pipeline">Pipeline</SelectItem>
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
                        onChange={(e) => handleAcquisitionDateChange(e.target.value)}
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
                <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button 
                  variant="outline"
                  data-testid="button-submit-property"
                  onClick={handleSubmit} 
                  disabled={createProperty.isPending}
                  className="flex items-center gap-2"
                >
                  {createProperty.isPending ? (
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
          }
        />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {properties?.slice().sort((a, b) => new Date(a.acquisitionDate).getTime() - new Date(b.acquisitionDate).getTime()).map((property) => (
            <div key={property.id} className="group relative overflow-hidden rounded-2xl flex flex-col">
              {/* Liquid Glass Card Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#2d4a5e] via-[#3d5a6a] to-[#3a5a5e]" />
              {/* Top Edge Sheen */}
              <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              {/* Border */}
              <div className="absolute inset-0 rounded-2xl border border-white/15" />
              
              <div className="relative">
                <div className="relative aspect-[16/10] overflow-hidden rounded-t-2xl">
                  <img 
                    src={property.imageUrl} 
                    alt={property.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Gradient overlay at bottom of image */}
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#2d4a5e] to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span 
                      data-testid={`badge-type-${property.id}`}
                      className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-xl label-text ${
                        property.type === "Financed" 
                          ? "bg-secondary/80 text-white border border-white/20" 
                          : "bg-primary/80 text-white border border-white/20"
                      }`}
                    >
                      {property.type}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-xl border border-white/20 label-text ${
                      property.status === "Operational" ? "bg-emerald-500/80 text-white" :
                      property.status === "Development" ? "bg-amber-500/80 text-white" : "bg-white/20 text-white"
                    }`}>
                      {property.status === "Operational" ? "Active" : property.status === "Development" ? "Planned" : property.status}
                    </span>
                  </div>
                </div>
                
                <div className="p-5">
                  <h3 className="font-display text-xl text-background">{property.name}</h3>
                  <div className="flex items-center text-background/60 text-sm mt-1 label-text">
                    <MapPin className="w-3 h-3 mr-1" />
                    {property.location}
                  </div>
                </div>
                
                <div className="px-5 pb-4 flex-1">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 bg-white/10 backdrop-blur-xl rounded-xl border border-white/10">
                      <p className="text-xs text-background/50 mb-1 label-text">Acquisition</p>
                      <p className="font-mono font-semibold text-background">{formatMoney(property.purchasePrice)}</p>
                    </div>
                    <div className="p-3 bg-white/10 backdrop-blur-xl rounded-xl border border-white/10">
                      <p className="text-xs text-background/50 mb-1 label-text">Capacity</p>
                      <p className="font-semibold text-white flex items-center">
                        <Bed className="w-3 h-3 mr-1" />
                        <span className="font-mono">{property.roomCount}</span> <span className="label-text ml-1">Rooms</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-2 border-t border-white/10 flex justify-between items-center">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="relative overflow-hidden p-2 rounded-xl text-background/50 hover:text-red-400 transition-all duration-300 group/del">
                        <div className="absolute inset-0 bg-white/0 group-hover/del:bg-white/5 rounded-xl transition-all duration-300" />
                        <Trash2 className="w-4 h-4 relative" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Property?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove {property.name} from the portfolio.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90" 
                          onClick={() => handleDelete(property.id, property.name)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <Link href={`/property/${property.id}`}>
                    <button 
                      className="relative overflow-hidden px-4 py-2 text-sm font-medium text-white rounded-xl transition-all duration-300 group/btn"
                    >
                      {/* Glass Background */}
                      <div className="absolute inset-0 bg-white/10 backdrop-blur-xl rounded-xl" />
                      {/* Top Edge Sheen */}
                      <div className="absolute top-0 left-1 right-1 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                      {/* Border */}
                      <div className="absolute inset-0 rounded-xl border border-white/20 group-hover/btn:border-white/40 transition-all duration-300" />
                      {/* Hover Glow */}
                      <div className="absolute inset-0 rounded-xl opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 shadow-[0_0_20px_rgba(159,188,164,0.3)]" />
                      <span className="relative flex items-center">View Details <ArrowRight className="w-4 h-4 ml-2" /></span>
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
