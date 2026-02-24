import { formatMoney } from "@/lib/financialEngine";
import { Trash2, MapPin, Bed, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { StaggerItem, HoverScale } from "@/components/ui/animated";
import { AnimatedGridItem } from "@/components/graphics";
import type { Property } from "@shared/schema";

interface PortfolioPropertyCardProps {
  property: Property;
  onDelete: (id: number, name: string) => void;
}

export function PortfolioPropertyCard({ property, onDelete }: PortfolioPropertyCardProps) {
  return (
    <AnimatedGridItem>
    <StaggerItem>
    <HoverScale>
    <div className="group relative overflow-hidden rounded-2xl flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-br from-[#2d4a5e] via-[#3d5a6a] to-[#3a5a5e]" />
      <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      <div className="absolute inset-0 rounded-2xl border border-white/15" />
      
      <div className="relative">
        <div className="relative aspect-[16/10] overflow-hidden rounded-t-2xl">
          <img 
            src={property.imageUrl} 
            alt={property.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
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
              property.status === "Operating" ? "bg-emerald-500/80 text-white" :
              property.status === "Improvements" ? "bg-amber-500/80 text-white" :
              property.status === "Acquired" ? "bg-blue-500/80 text-white" :
              property.status === "In Negotiation" ? "bg-purple-500/80 text-white" :
              property.status === "Pipeline" ? "bg-gray-500/80 text-white" : "bg-white/20 text-white"
            }`}>
              {property.status}
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
                  onClick={() => onDelete(property.id, property.name)}
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
              <div className="absolute inset-0 bg-white/10 backdrop-blur-xl rounded-xl" />
              <div className="absolute top-0 left-1 right-1 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              <div className="absolute inset-0 rounded-xl border border-white/20 group-hover/btn:border-white/40 transition-all duration-300" />
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 shadow-[0_0_20px_rgba(159,188,164,0.3)]" />
              <span className="relative flex items-center">View Details <ArrowRight className="w-4 h-4 ml-2" /></span>
            </button>
          </Link>
        </div>
      </div>
    </div>
    </HoverScale>
    </StaggerItem>
    </AnimatedGridItem>
  );
}
