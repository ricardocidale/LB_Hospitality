/**
 * PortfolioPropertyCard.tsx — Summary card for one property on the portfolio dashboard.
 *
 * Displays a compact overview of a hotel property:
 *   • Hero image (with fallback gradient if none exists)
 *   • Property name and location
 *   • Room count and key financial snapshot (ADR, purchase price)
 *   • Navigation arrow linking to the full property detail page
 *   • Delete button (with confirmation) to remove from the portfolio
 *
 * The card is rendered inside a responsive CSS grid on the Portfolio page.
 * Property order can be controlled by the parent (e.g. sort by name or IRR).
 */
import { formatMoney } from "@/lib/financialEngine";
import { ArrowRight } from "lucide-react";
import { IconTrash, IconMapPin, IconBed, IconCalendar, IconSettings } from "@/components/icons";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { StaggerItem, TiltCard } from "@/components/ui/animated";
import { AnimatedGridItem } from "@/components/graphics";
import type { Property } from "@shared/schema";
import { HeroImage } from "@/features/property-images";

interface PortfolioPropertyCardProps {
  property: Property;
  propertyNumber: number;
  onDelete: (id: number, name: string) => void;
}

export function PortfolioPropertyCard({ property, propertyNumber, onDelete }: PortfolioPropertyCardProps) {
  return (
    <AnimatedGridItem>
    <StaggerItem>
    <TiltCard intensity={5}>
    <div className="group relative overflow-hidden rounded-lg flex flex-col bg-card border border-border shadow-sm transition-shadow duration-300 hover:shadow-lg">
      <div className="relative">
        <HeroImage
          src={property.imageUrl}
          alt={property.name}
          aspectRatio="16/10"
          overlay="none"
          className="rounded-t-lg rounded-b-none"
          variants={null}
        >
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent" />
          <div className="absolute bottom-3 left-3">
            <span className="w-7 h-7 flex items-center justify-center rounded-full bg-foreground/40 text-white/80 text-xs font-mono font-semibold border border-white/15">
              {propertyNumber}
            </span>
          </div>
          <div className="absolute top-3 left-3">
            <span 
              data-testid={`badge-type-${property.id}`}
              className={`px-3 py-1 rounded-full text-xs font-medium label-text ${
                property.type === "Financed" 
                  ? "bg-secondary text-secondary-foreground border border-white/20" 
                  : "bg-primary text-primary-foreground border border-white/20"
              }`}
            >
              {property.type}
            </span>
          </div>
          <div className="absolute top-3 right-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium border border-white/20 label-text ${
              property.status === "Operating" ? "bg-emerald-500 text-white" :
              property.status === "Improvements" ? "bg-amber-500 text-white" :
              property.status === "Acquired" ? "bg-blue-500 text-white" :
              property.status === "Planned" ? "bg-sky-500 text-white" :
              property.status === "In Negotiation" ? "bg-purple-500 text-white" :
              property.status === "Pipeline" ? "bg-muted0 text-white" : "bg-card/20 text-white"
            }`}>
              {property.status}
            </span>
          </div>
        </HeroImage>

        <div className="p-5">
          <h3 className="font-display text-xl text-foreground">{property.name}</h3>
          <div className="flex items-center text-foreground/60 text-sm mt-1 label-text">
            <IconMapPin className="w-3 h-3 mr-1" />
            {property.location}
          </div>
          <div className="flex items-center text-foreground/50 text-xs mt-1.5 label-text">
            <IconCalendar className="w-3 h-3 mr-1" />
            {property.status === "Acquired" || property.status === "Operating" ? "Acquired" : "Planned"}{" "}
            {new Date(property.acquisitionDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
          </div>
        </div>
        
        <div className="px-5 pb-4 flex-1">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
              <p className="text-xs text-foreground/50 mb-1 label-text">Acquisition</p>
              <p className="font-mono font-semibold text-foreground">{formatMoney(property.purchasePrice)}</p>
            </div>
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
              <p className="text-xs text-foreground/50 mb-1 label-text">Capacity</p>
              <p className="font-semibold text-foreground flex items-center">
                <IconBed className="w-3 h-3 mr-1" />
                <span className="font-mono">{property.roomCount}</span> <span className="label-text ml-1">Rooms</span>
              </p>
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 pt-3 border-t border-border flex items-center justify-between gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                data-testid={`button-delete-property-${property.id}`}
              >
                <IconTrash className="w-4 h-4" />
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
                  onClick={() => onDelete(property.id, property.name)}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="flex items-center gap-2">
            <Link href={`/property/${property.id}/edit`}>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 hover:scale-[1.03] active:scale-[0.97] transition-transform"
                data-testid={`button-assumptions-${property.id}`}
              >
                <IconSettings className="w-3.5 h-3.5" />
                Assumptions
              </Button>
            </Link>
            <Link href={`/property/${property.id}`}>
              <Button
                size="sm"
                className="h-8 text-xs gap-1.5 hover:scale-[1.03] active:scale-[0.97] transition-transform"
                data-testid={`button-details-${property.id}`}
              >
                Details
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
    </TiltCard>
    </StaggerItem>
    </AnimatedGridItem>
  );
}
