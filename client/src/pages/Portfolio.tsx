import { useState, useRef } from "react";
import Layout from "@/components/Layout";
import { useProperties, useDeleteProperty, useCreateProperty, useGlobalAssumptions } from "@/lib/api";
import { formatMoney } from "@/lib/financialEngine";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, MapPin, Bed, ArrowRight, Loader2, Plus, Upload, X } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { InsertProperty } from "@shared/schema";

export default function Portfolio() {
  const { data: properties, isLoading } = useProperties();
  const { data: global } = useGlobalAssumptions();
  const deleteProperty = useDeleteProperty();
  const createProperty = useCreateProperty();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    roomCount: 10,
    startAdr: 250,
    adrGrowthRate: 0.03,
    startOccupancy: 0.45,
    maxOccupancy: 0.75,
    occupancyRampMonths: 12,
    occupancyGrowthStep: 0.05,
    stabilizationMonths: 24,
    type: "Full Equity",
    cateringLevel: "None",
  });

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        setFormData(prev => ({ ...prev, imageUrl: base64 }));
      };
      reader.readAsDataURL(file);
    }
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
      roomCount: 10,
      startAdr: 250,
      adrGrowthRate: 0.03,
      startOccupancy: 0.45,
      maxOccupancy: 0.75,
      occupancyRampMonths: 12,
      occupancyGrowthStep: 0.05,
      stabilizationMonths: 24,
      type: "Full Equity",
      cateringLevel: "None",
    });
    setImagePreview(null);
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

    const propertyData: InsertProperty = {
      ...formData,
      costRateRooms: 0.36,
      costRateFB: 0.15,
      costRateAdmin: 0.08,
      costRateMarketing: 0.05,
      costRatePropertyOps: 0.04,
      costRateUtilities: 0.05,
      costRateInsurance: 0.02,
      costRateTaxes: 0.03,
      costRateIT: 0.02,
      costRateFFE: 0.04,
      costRateOther: 0.05,
      revShareEvents: 0.43,
      revShareFB: 0.22,
      revShareOther: 0.07,
      fullCateringPercent: 0.40,
      partialCateringPercent: 0.30,
      exitCapRate: 0.085,
      taxRate: 0.25,
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

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-serif font-bold text-foreground">Property Portfolio</h2>
            <p className="text-muted-foreground mt-1">Managed assets & developments</p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-property" className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Add Property
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl">Add New Property</DialogTitle>
                <DialogDescription>
                  Enter the details for the new property in your portfolio.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-6 py-4">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Property Photo</h3>
                  <div className="flex flex-col items-center gap-4">
                    {imagePreview ? (
                      <div className="relative w-full aspect-video rounded-lg overflow-hidden border">
                        <img src={imagePreview} alt="Property preview" className="w-full h-full object-cover" />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setImagePreview(null);
                            setFormData(prev => ({ ...prev, imageUrl: "" }));
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div 
                        className="w-full aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="w-10 h-10 text-muted-foreground/50 mb-2" />
                        <p className="text-sm text-muted-foreground">Click to upload property photo</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">JPG, PNG, WebP supported</p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      data-testid="input-property-image"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Basic Information</h3>
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
                          <SelectItem value="Development">Development</SelectItem>
                          <SelectItem value="Operational">Operational</SelectItem>
                          <SelectItem value="Pipeline">Pipeline</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Property Details</h3>
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
                    <div className="space-y-2">
                      <Label htmlFor="cateringLevel">Catering Level</Label>
                      <Select value={formData.cateringLevel} onValueChange={(v) => setFormData(prev => ({ ...prev, cateringLevel: v }))}>
                        <SelectTrigger data-testid="select-catering-level">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="None">None</SelectItem>
                          <SelectItem value="Partial Service">Partial Service</SelectItem>
                          <SelectItem value="Full Service">Full Service</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Timeline</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="acquisitionDate">Acquisition Date</Label>
                      <Input
                        id="acquisitionDate"
                        type="date"
                        data-testid="input-acquisition-date"
                        value={formData.acquisitionDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, acquisitionDate: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="operationsStartDate">Operations Start Date</Label>
                      <Input
                        id="operationsStartDate"
                        type="date"
                        data-testid="input-operations-date"
                        value={formData.operationsStartDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, operationsStartDate: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Financial Details</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="purchasePrice">Purchase Price</Label>
                      <Input
                        id="purchasePrice"
                        type="number"
                        data-testid="input-purchase-price"
                        placeholder="0"
                        value={formData.purchasePrice || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, purchasePrice: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="buildingImprovements">Building Improvements</Label>
                      <Input
                        id="buildingImprovements"
                        type="number"
                        data-testid="input-building-improvements"
                        placeholder="0"
                        value={formData.buildingImprovements || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, buildingImprovements: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="preOpeningCosts">Pre-Opening Costs</Label>
                      <Input
                        id="preOpeningCosts"
                        type="number"
                        data-testid="input-pre-opening-costs"
                        placeholder="0"
                        value={formData.preOpeningCosts || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, preOpeningCosts: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="operatingReserve">Operating Reserve</Label>
                      <Input
                        id="operatingReserve"
                        type="number"
                        data-testid="input-operating-reserve"
                        placeholder="0"
                        value={formData.operatingReserve || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, operatingReserve: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Revenue Assumptions</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="startAdr">Starting ADR ($)</Label>
                      <Input
                        id="startAdr"
                        type="number"
                        data-testid="input-start-adr"
                        value={formData.startAdr}
                        onChange={(e) => setFormData(prev => ({ ...prev, startAdr: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adrGrowthRate">ADR Growth Rate (%)</Label>
                      <Input
                        id="adrGrowthRate"
                        type="number"
                        step="0.01"
                        data-testid="input-adr-growth"
                        value={(formData.adrGrowthRate * 100).toFixed(1)}
                        onChange={(e) => setFormData(prev => ({ ...prev, adrGrowthRate: (parseFloat(e.target.value) || 0) / 100 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="startOccupancy">Starting Occupancy (%)</Label>
                      <Input
                        id="startOccupancy"
                        type="number"
                        step="1"
                        data-testid="input-start-occupancy"
                        value={(formData.startOccupancy * 100).toFixed(0)}
                        onChange={(e) => setFormData(prev => ({ ...prev, startOccupancy: (parseFloat(e.target.value) || 0) / 100 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxOccupancy">Max Occupancy (%)</Label>
                      <Input
                        id="maxOccupancy"
                        type="number"
                        step="1"
                        data-testid="input-max-occupancy"
                        value={(formData.maxOccupancy * 100).toFixed(0)}
                        onChange={(e) => setFormData(prev => ({ ...prev, maxOccupancy: (parseFloat(e.target.value) || 0) / 100 }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button 
                  data-testid="button-submit-property"
                  onClick={handleSubmit} 
                  disabled={createProperty.isPending}
                >
                  {createProperty.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Property
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {properties?.map((property) => (
            <Card key={property.id} className="group overflow-hidden flex flex-col">
              <div className="relative aspect-[16/10] overflow-hidden">
                <img 
                  src={property.imageUrl} 
                  alt={property.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3">
                  <Badge 
                    data-testid={`badge-type-${property.id}`}
                    variant={property.type === "Financed" ? "default" : "secondary"}
                    className={property.type === "Financed" ? "bg-blue-600" : "bg-emerald-600 text-white"}
                  >
                    {property.type}
                  </Badge>
                </div>
                <div className="absolute top-3 right-3">
                  <Badge variant={
                    property.status === "Operational" ? "default" :
                    property.status === "Development" ? "secondary" : "outline"
                  }>
                    {property.status}
                  </Badge>
                </div>
              </div>
              
              <CardHeader className="pb-2">
                <h3 className="font-serif text-xl font-bold">{property.name}</h3>
                <div className="flex items-center text-muted-foreground text-sm">
                  <MapPin className="w-3 h-3 mr-1" />
                  {property.location}
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 pb-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Acquisition</p>
                    <p className="font-semibold">{formatMoney(property.purchasePrice)}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Capacity</p>
                    <p className="font-semibold flex items-center">
                      <Bed className="w-3 h-3 mr-1" />
                      {property.roomCount} Rooms
                    </p>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="border-t pt-4 flex justify-between items-center">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
                  <Button variant="outline" size="sm">
                    View Details <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
