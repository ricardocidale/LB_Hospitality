import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { Building2, Play, Calendar, MapPin } from "lucide-react";

interface TimelineEvent {
  date: string;
  type: "acquisition" | "operations";
  propertyName: string;
  location: string;
  detail: string;
  color: string;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function formatCurrency(value: number): string {
  return "$" + value.toLocaleString("en-US");
}

export default function TimelineView() {
  const properties = useStore((s) => s.properties);

  const events = useMemo(() => {
    const items: TimelineEvent[] = [];
    for (const p of properties) {
      items.push({
        date: p.acquisitionDate,
        type: "acquisition",
        propertyName: p.name,
        location: p.location,
        detail: `Purchase: ${formatCurrency(p.purchasePrice)}`,
        color: "#9FBCA4",
      });
      items.push({
        date: p.operationsStartDate,
        type: "operations",
        propertyName: p.name,
        location: p.location,
        detail: `Rooms: ${p.roomCount}, ADR: ${formatCurrency(p.startAdr)}`,
        color: "#257D41",
      });
    }
    items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return items;
  }, [properties]);

  return (
    <div data-testid="timeline-view" className="min-h-screen bg-[#FFF9F5] p-6 md:p-10">
      <h1 className="text-3xl font-bold text-center mb-10" data-testid="timeline-title">
        Portfolio Timeline
      </h1>

      <div className="relative max-w-4xl mx-auto">
        <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[2px] bg-border hidden md:block" />
        <div className="absolute left-5 top-0 bottom-0 w-[2px] bg-border md:hidden" />

        <div className="flex flex-col gap-10">
          {events.map((evt, i) => {
            const isLeft = i % 2 === 0;
            const Icon = evt.type === "acquisition" ? Building2 : Play;
            const label =
              evt.type === "acquisition"
                ? `${evt.propertyName} - Acquisition`
                : `${evt.propertyName} - Operations Begin`;

            return (
              <div
                key={`${evt.propertyName}-${evt.type}-${i}`}
                data-testid={`timeline-event-${i}`}
                className="relative"
              >
                {/* Icon on timeline - desktop */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 top-4 z-10 hidden md:flex items-center justify-center rounded-full"
                  style={{
                    width: 40,
                    height: 40,
                    backgroundColor: evt.color,
                  }}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>

                {/* Icon on timeline - mobile */}
                <div
                  className="absolute left-5 -translate-x-1/2 top-4 z-10 flex md:hidden items-center justify-center rounded-full"
                  style={{
                    width: 40,
                    height: 40,
                    backgroundColor: evt.color,
                  }}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>

                {/* Card */}
                <div
                  className={`
                    md:w-[calc(50%-40px)]
                    ${isLeft ? "md:mr-auto md:pr-6" : "md:ml-auto md:pl-6"}
                    ml-12 md:ml-auto
                  `}
                  style={
                    !isLeft
                      ? { marginLeft: "auto" }
                      : {}
                  }
                >
                  <div className="bg-white rounded-xl border shadow-sm p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: "rgba(159,188,164,0.1)",
                          color: "#9FBCA4",
                        }}
                        data-testid={`timeline-date-${i}`}
                      >
                        <Calendar className="w-3 h-3" />
                        {formatDate(evt.date)}
                      </span>
                    </div>

                    <h3 className="font-semibold text-sm mb-1" data-testid={`timeline-label-${i}`}>
                      {label}
                    </h3>

                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                      <MapPin className="w-3 h-3" />
                      <span data-testid={`timeline-location-${i}`}>{evt.location}</span>
                    </div>

                    <p className="text-xs text-muted-foreground" data-testid={`timeline-detail-${i}`}>
                      {evt.detail}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
