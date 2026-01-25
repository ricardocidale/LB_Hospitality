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
        toast({ title: "Property Deleted", description: `${name} removed.` });
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
          <h2 className="text-2xl font-bold text-foreground">Property Portfolio</h2>
          <p className="text-muted-foreground text-sm">Managed assets & developments</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {properties?.map((property) => (
            <Card key={property.id} className="bg-card border-border group overflow-hidden flex flex-col">
              <div className="relative aspect-video overflow-hidden bg-secondary">
                <img 
                  src={property.imageUrl} 
                  alt={property.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-foreground text-xs">
                    {property.status}
                  </Badge>
                </div>
              </div>
              
              <CardHeader className="py-3 px-4">
                <h3 className="font-semibold text-foreground">{property.name}</h3>
                <div className="flex items-center text-muted-foreground text-xs">
                  <MapPin className="w-3 h-3 mr-1" />
                  {property.location}
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 px-4 pb-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-secondary rounded">
                    <p className="text-muted-foreground">Acquisition</p>
                    <p className="font-medium text-foreground">{formatMoney(property.purchasePrice)}</p>
                  </div>
                  <div className="p-2 bg-secondary rounded">
                    <p className="text-muted-foreground">Rooms</p>
                    <p className="font-medium text-foreground flex items-center">
                      <Bed className="w-3 h-3 mr-1" />{property.roomCount}
                    </p>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="border-t border-border px-4 py-3 flex justify-between items-center">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive h-8 w-8 p-0">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-card border-border">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Property?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Remove {property.name} from the portfolio permanently.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        className="bg-destructive text-destructive-foreground" 
                        onClick={() => handleDelete(property.id, property.name)}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <Link href={`/property/${property.id}`}>
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">
                    Details <ArrowRight className="w-3 h-3 ml-1" />
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
