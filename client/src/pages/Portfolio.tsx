import Layout from "@/components/Layout";
import { useProperties, useDeleteProperty } from "@/lib/api";
import { formatMoney } from "@/lib/financialEngine";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, MapPin, Bed, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function Portfolio() {
  const { data: properties, isLoading } = useProperties();
  const deleteProperty = useDeleteProperty();
  const { toast } = useToast();

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
        <div>
          <h2 className="text-3xl font-serif font-bold text-foreground">Property Portfolio</h2>
          <p className="text-muted-foreground mt-1">Managed assets & developments</p>
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
