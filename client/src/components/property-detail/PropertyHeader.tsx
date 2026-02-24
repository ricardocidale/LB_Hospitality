/**
 * PropertyHeader.tsx — Hero banner and navigation for the property detail page.
 *
 * Renders the property's hero image (with gradient overlay for readability),
 * property name, location pin, and quick-action buttons:
 *   • Back arrow  – navigates to the portfolio list
 *   • Settings    – links to the property's Edit Assumptions page
 *   • Map         – external link to the property's address on a map
 *
 * Also displays the acquisition date, room count, and purchase price as
 * compact badges so users get immediate context at a glance.
 */
import { Link } from "wouter";
import { ArrowLeft, MapPin, Settings2, Map } from "lucide-react";
import { PropertyPhotoUpload } from "@/components/PropertyPhotoUpload";
import type { PropertyHeaderProps } from "./types";

export default function PropertyHeader({ property, propertyId, onPhotoUploadComplete }: PropertyHeaderProps) {
  const getStatusLabel = (status: string) => {
    return status;
  };

  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl">
      <div className="relative h-[180px] sm:h-[280px]">
        <img src={property.imageUrl.startsWith("/objects/") ? property.imageUrl : property.imageUrl} alt={property.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <PropertyPhotoUpload 
          propertyId={propertyId} 
          currentImageUrl={property.imageUrl}
          onUploadComplete={onPhotoUploadComplete}
        />
      </div>
      
      <div className="relative overflow-hidden p-3 sm:p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2d4a5e] via-[#3d5a6a] to-[#3a5a5e]" />
        <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-primary/25 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-48 h-48 rounded-full bg-primary/15 blur-3xl" />
        </div>
        
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <Link href="/portfolio">
              <button className="relative overflow-hidden p-2 text-white rounded-xl transition-all duration-300 group/back">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-xl rounded-xl" />
                <div className="absolute inset-0 rounded-xl border border-white/20 group-hover/back:border-white/40 transition-all duration-300" />
                <ArrowLeft className="relative w-5 h-5" />
              </button>
            </Link>
            <div>
              <h1 className="text-lg sm:text-2xl font-display text-background">{property.name}</h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-background/70 text-sm mt-1 label-text">
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {property.location}</span>
                <span className="font-mono">{property.roomCount} Rooms</span>
                <span className="px-2 py-0.5 rounded-full bg-white/15 border border-white/25 text-white text-xs">
                  {getStatusLabel(property.status)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            {(() => {
              const addressParts = [property.streetAddress, property.city, property.stateProvince, property.zipPostalCode, property.country].filter(Boolean);
              const hasAddress = addressParts.length > 0;
              const mapQuery = hasAddress ? addressParts.join(", ") : "";
              const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
              return (
                <button
                  onClick={() => hasAddress && window.open(mapUrl, "_blank")}
                  disabled={!hasAddress}
                  title={hasAddress ? `View ${mapQuery} on Google Maps` : "No address provided — add address details in Assumptions"}
                  className={`relative overflow-hidden px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 flex items-center gap-2 ${hasAddress ? "text-white group/map cursor-pointer" : "text-white/40 cursor-not-allowed"}`}
                >
                  <div className={`absolute inset-0 backdrop-blur-xl rounded-xl ${hasAddress ? "bg-white/12" : "bg-white/5"}`} />
                  <div className={`absolute top-0 left-2 right-2 h-[1px] bg-gradient-to-r from-transparent ${hasAddress ? "via-white/40" : "via-white/15"} to-transparent`} />
                  <div className={`absolute inset-0 rounded-xl border ${hasAddress ? "border-white/25 group-hover/map:border-white/40" : "border-white/10"} transition-all duration-300`} />
                  {hasAddress && <div className="absolute inset-0 rounded-xl shadow-[0_0_20px_rgba(159,188,164,0.3)] group-hover/map:shadow-[0_0_30px_rgba(159,188,164,0.5)] transition-all duration-300" />}
                  <Map className="relative w-4 h-4" />
                  <span className="relative">Map</span>
                </button>
              );
            })()}
            <Link href={`/property/${propertyId}/edit`}>
              <button className="relative overflow-hidden px-4 py-2 text-sm font-medium text-white rounded-xl transition-all duration-300 group/edit flex items-center gap-2">
                <div className="absolute inset-0 bg-white/12 backdrop-blur-xl rounded-xl" />
                <div className="absolute top-0 left-2 right-2 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                <div className="absolute inset-0 rounded-xl border border-white/25 group-hover/edit:border-white/40 transition-all duration-300" />
                <div className="absolute inset-0 rounded-xl shadow-[0_0_20px_rgba(159,188,164,0.3)] group-hover/edit:shadow-[0_0_30px_rgba(159,188,164,0.5)] transition-all duration-300" />
                <Settings2 className="relative w-4 h-4" />
                <span className="relative">Assumptions</span>
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
