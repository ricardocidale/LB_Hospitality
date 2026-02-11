import { useStore } from "@/lib/store";
import { Link } from "wouter";
import { MapPin, Building2, Users, DollarSign } from "lucide-react";

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const statusColor = (status: string) => {
  switch (status) {
    case "Operational":
      return "bg-green-100 text-green-700";
    case "Development":
      return "bg-amber-100 text-amber-700";
    case "Acquisition":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

function hasCompleteAddress(property: any): boolean {
  return !!(property.streetAddress && property.city && property.country);
}

function formatAddress(property: any): string {
  const parts = [property.streetAddress, property.city];
  if (property.stateProvince) parts.push(property.stateProvince);
  if (property.zipPostalCode) parts.push(property.zipPostalCode);
  parts.push(property.country);
  return parts.filter(Boolean).join(", ");
}

export default function MapView() {
  const properties = useStore((s) => s.properties);
  const mappableProperties = properties.filter(hasCompleteAddress);
  const unmappableCount = properties.length - mappableProperties.length;

  return (
    <div data-testid="map-view" className="min-h-screen bg-background">
      <div
        className="min-h-screen"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="mb-10">
            <h1
              className="text-3xl font-bold text-gray-900"
              data-testid="map-view-title"
            >
              Portfolio Map
            </h1>
            <p className="mt-1 text-gray-500">
              Geographic overview of properties with complete addresses
            </p>
          </div>

          {unmappableCount > 0 && (
            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800" data-testid="text-unmappable-notice">
              <span className="font-medium">{unmappableCount} {unmappableCount === 1 ? "property" : "properties"}</span> not shown — missing address details. Add a street address, city, and country on the property page to include {unmappableCount === 1 ? "it" : "them"} here.
            </div>
          )}

          {mappableProperties.length === 0 && (
            <div className="text-center py-20" data-testid="text-no-mappable">
              <MapPin className="mx-auto mb-4 text-gray-300" size={48} />
              <h2 className="text-lg font-semibold text-gray-600 mb-2">No properties with addresses yet</h2>
              <p className="text-sm text-gray-400 max-w-md mx-auto">
                Add a street address, city, and country to your properties to see them on the map. You can do this from each property's detail page.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mappableProperties.map((property) => {
              const pinColor =
                property.market === "North America" ? "#9FBCA4" : "#3B82F6";
              const marketBadge =
                property.market === "North America"
                  ? "bg-[#E8F0E9] text-[#5A7D60]"
                  : "bg-blue-100 text-blue-700";

              return (
                <Link
                  key={property.id}
                  href={`/property/${property.id}`}
                  data-testid={`card-property-${property.id}`}
                >
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
                    <div className="flex items-start gap-3 mb-3">
                      <MapPin
                        className="mt-0.5 flex-shrink-0"
                        size={22}
                        color={pinColor}
                        data-testid={`icon-pin-${property.id}`}
                      />
                      <div className="min-w-0">
                        <h3
                          className="font-bold text-gray-900 truncate"
                          data-testid={`text-name-${property.id}`}
                        >
                          {property.name}
                        </h3>
                        <p
                          className="text-sm text-gray-500"
                          data-testid={`text-location-${property.id}`}
                        >
                          {formatAddress(property)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${marketBadge}`}
                        data-testid={`badge-market-${property.id}`}
                      >
                        {property.market}
                      </span>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(property.status)}`}
                        data-testid={`badge-status-${property.id}`}
                      >
                        {property.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div
                        className="flex items-center gap-1"
                        data-testid={`stat-rooms-${property.id}`}
                      >
                        <Building2 size={14} className="text-gray-400" />
                        <span>{property.roomCount} rooms</span>
                      </div>
                      <div
                        className="flex items-center gap-1"
                        data-testid={`stat-adr-${property.id}`}
                      >
                        <DollarSign size={14} className="text-gray-400" />
                        <span>{formatMoney(property.startAdr)} ADR</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
