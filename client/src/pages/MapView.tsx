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

export default function MapView() {
  const properties = useStore((s) => s.properties);

  return (
    <div data-testid="map-view" className="min-h-screen bg-[#FFF9F5]">
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
              Geographic overview of your properties
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => {
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
                          {property.location}
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
