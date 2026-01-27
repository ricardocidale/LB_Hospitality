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
import { useUpload } from "@/hooks/use-upload";

export default function Portfolio() {
  const { data: properties, isLoading } = useProperties();
  const { data: global } = useGlobalAssumptions();
  const deleteProperty = useDeleteProperty();
  const createProperty = useCreateProperty();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { uploadFile } = useUpload({
    onSuccess: (response) => {
      setFormData(prev => ({ ...prev, imageUrl: response.objectPath }));
      setImagePreview(response.objectPath);
      toast({
        title: "Photo Uploaded",
        description: "Photo has been successfully uploaded.",
      });
      setIsUploadingPhoto(false);
    },
    onError: (error) => {
      console.error("Upload failed:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
      setIsUploadingPhoto(false);
    },
  });

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File",
        description: "Please select an image file (JPEG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image under 10MB.",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploadingPhoto(true);
    await uploadFile(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
    setIsUploadingPhoto(false);
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
      <div className="space-y-8">
        {/* Liquid Glass Header */}
        <div className="relative overflow-hidden rounded-3xl p-8">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#2d4a5e] via-[#3d5a6a] to-[#3a5a5e]" />
          {/* Top Edge Sheen */}
          <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          {/* Floating Color Orbs */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-[#9FBCA4]/25 blur-3xl" />
            <div className="absolute bottom-0 left-1/4 w-48 h-48 rounded-full bg-[#9FBCA4]/15 blur-3xl" />
          </div>
          
          <div className="relative flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-serif font-bold text-white">Property Portfolio</h2>
              <p className="text-white/60 mt-1">Managed assets & developments</p>
            </div>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <button 
                  data-testid="button-add-property" 
                  className="relative overflow-hidden px-5 py-2.5 text-sm font-medium text-white rounded-xl transition-all duration-300 group/add"
                >
                  {/* Glass Background */}
                  <div className="absolute inset-0 bg-white/12 backdrop-blur-xl rounded-xl" />
                  {/* Top Edge Sheen */}
                  <div className="absolute top-0 left-2 right-2 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                  {/* Border */}
                  <div className="absolute inset-0 rounded-xl border border-white/25 group-hover/add:border-white/40 transition-all duration-300" />
                  {/* Hover Glow */}
                  <div className="absolute inset-0 rounded-xl shadow-[0_0_20px_rgba(159,188,164,0.3)] group-hover/add:shadow-[0_0_30px_rgba(159,188,164,0.5)] transition-all duration-300" />
                  <span className="relative flex items-center"><Plus className="w-4 h-4 mr-2" />Add Property</span>
                </button>
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
                      <div className="relative w-full aspect-[16/10] rounded-lg overflow-hidden border">
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
                        className={`w-full aspect-[16/10] rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center transition-colors ${isUploadingPhoto ? 'cursor-wait' : 'cursor-pointer hover:border-primary/50'}`}
                        onClick={() => !isUploadingPhoto && fileInputRef.current?.click()}
                      >
                        {isUploadingPhoto ? (
                          <>
                            <Loader2 className="w-10 h-10 text-primary animate-spin mb-2" />
                            <p className="text-sm text-muted-foreground">Uploading photo...</p>
                          </>
                        ) : (
                          <>
                            <Upload className="w-10 h-10 text-muted-foreground/50 mb-2" />
                            <p className="text-sm text-muted-foreground">Click to upload property photo</p>
                            <p className="text-xs text-muted-foreground/70 mt-1">Photo will be cropped to fit card format</p>
                          </>
                        )}
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
                          <SelectItem value="Development">Planned</SelectItem>
                          <SelectItem value="Operational">Active</SelectItem>
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
        </div>

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
                      className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-xl ${
                        property.type === "Financed" 
                          ? "bg-[#257D41]/80 text-white border border-white/20" 
                          : "bg-[#9FBCA4]/80 text-white border border-white/20"
                      }`}
                    >
                      {property.type}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-xl border border-white/20 ${
                      property.status === "Operational" ? "bg-emerald-500/80 text-white" :
                      property.status === "Development" ? "bg-amber-500/80 text-white" : "bg-white/20 text-white"
                    }`}>
                      {property.status === "Operational" ? "Active" : property.status === "Development" ? "Planned" : property.status}
                    </span>
                  </div>
                </div>
                
                <div className="p-5">
                  <h3 className="font-serif text-xl font-bold text-white">{property.name}</h3>
                  <div className="flex items-center text-white/60 text-sm mt-1">
                    <MapPin className="w-3 h-3 mr-1" />
                    {property.location}
                  </div>
                </div>
                
                <div className="px-5 pb-4 flex-1">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 bg-white/10 backdrop-blur-xl rounded-xl border border-white/10">
                      <p className="text-xs text-white/50 mb-1">Acquisition</p>
                      <p className="font-semibold text-white">{formatMoney(property.purchasePrice)}</p>
                    </div>
                    <div className="p-3 bg-white/10 backdrop-blur-xl rounded-xl border border-white/10">
                      <p className="text-xs text-white/50 mb-1">Capacity</p>
                      <p className="font-semibold text-white flex items-center">
                        <Bed className="w-3 h-3 mr-1" />
                        {property.roomCount} Rooms
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-2 border-t border-white/10 flex justify-between items-center">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="relative overflow-hidden p-2 rounded-xl text-white/50 hover:text-red-400 transition-all duration-300 group/del">
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
