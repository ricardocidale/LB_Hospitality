import Layout from "@/components/Layout";
import { useStore, formatCurrency, Property } from "@/lib/mockData";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, MapPin, Bed, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function Portfolio() {
  const { properties, addProperty, deleteProperty } = useStore();
  const { toast } = useToast();

  const handleAddProperty = () => {
    // Mock adding a property for prototype
    const newProp: Omit<Property, "id"> = {
      name: "New Vineyard Estate",
      location: "Napa Valley, CA",
      market: "North America",
      imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1000",
      status: "Development",
      acquisitionDate: "2029-01-01",
      operationsStartDate: "2029-06-01",
      purchasePrice: 2500000,
      roomCount: 15,
      adr: 450,
      occupancyRate: 0.55,
      type: "Full Equity",
      description: "Exclusive vineyard retreat with luxury amenities."
    };
    addProperty(newProp);
    toast({
      title: "Property Added",
      description: "New Vineyard Estate has been added to the portfolio.",
    });
  };

  const handleDelete = (id: string, name: string) => {
    deleteProperty(id);
    toast({
      title: "Property Deleted",
      description: `${name} has been removed from the portfolio.`,
      variant: "destructive"
    });
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-serif text-primary mb-2">Property Portfolio</h2>
            <p className="text-muted-foreground">Managed Assets & Developments</p>
          </div>
          <Button onClick={handleAddProperty} className="bg-primary hover:bg-primary/90 text-white font-medium">
            <Plus className="w-4 h-4 mr-2" /> Add Property
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <Card key={property.id} className="group overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img 
                  src={property.imageUrl} 
                  alt={property.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute top-4 right-4">
                  <Badge className={
                    property.status === "Operational" ? "bg-green-600 hover:bg-green-700" :
                    property.status === "Development" ? "bg-accent hover:bg-accent/90" :
                    "bg-blue-600 hover:bg-blue-700"
                  }>
                    {property.status}
                  </Badge>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-serif text-xl font-semibold text-primary mb-1">{property.name}</h3>
                    <div className="flex items-center text-muted-foreground text-sm">
                      <MapPin className="w-3 h-3 mr-1" />
                      {property.location}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 pb-4">
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {property.description}
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex flex-col p-2 bg-muted/30 rounded-md">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Acquisition</span>
                    <span className="font-semibold text-foreground">{formatCurrency(property.purchasePrice)}</span>
                  </div>
                  <div className="flex flex-col p-2 bg-muted/30 rounded-md">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Capacity</span>
                    <span className="font-semibold text-foreground flex items-center">
                      <Bed className="w-3 h-3 mr-1.5" />
                      {property.roomCount} Rooms
                    </span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-0 border-t border-border/50 bg-muted/10 p-4 flex justify-between items-center mt-auto">
                 <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete {property.name} from the portfolio.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDelete(property.id, property.name)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <Link href={`/property/${property.id}`}>
                  <Button variant="outline" size="sm" className="group-hover:border-primary group-hover:text-primary transition-colors">
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
