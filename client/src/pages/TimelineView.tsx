import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { IconBuilding2, IconPlay, IconCalendar, IconMapPin } from "@/components/icons";
import { AnimatedPage } from "@/components/graphics/motion/AnimatedPage";
import Timeline, {
  TimelineItem,
  TimelineItemDate,
  TimelineItemTitle,
  TimelineItemDescription,
} from "@/components/ui/timeline";

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

export default function TimelineView({ embedded }: { embedded?: boolean }) {
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
        color: "var(--primary)",
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
    <AnimatedPage>
    <div data-testid="timeline-view" className={embedded ? "" : "min-h-screen bg-background p-6 md:p-10"}>
      {!embedded && (
      <h1 className="text-3xl font-bold text-center mb-10" data-testid="timeline-title">
        Portfolio Timeline
      </h1>
      )}

      <div className="bg-card rounded-xl border border-border p-4 shadow-sm max-w-5xl mx-auto mb-8">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">Portfolio Timeline</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Visualizes the chronological sequence of your portfolio — when each property was acquired and when operations began. 
              This timeline helps you understand your deployment cadence, identify gaps between acquisitions, 
              and plan future property additions based on historical patterns.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent pb-4">
        <Timeline
          orientation="horizontal"
          alternating={true}
          horizItemWidth={240}
          horizItemSpacing={140}
        >
          {events.map((evt, i) => {
            const Icon = evt.type === "acquisition" ? IconBuilding2 : IconPlay;
            const label =
              evt.type === "acquisition"
                ? `${evt.propertyName} — Acquisition`
                : `${evt.propertyName} — Operations Begin`;

            return (
              <TimelineItem
                key={`${evt.propertyName}-${evt.type}-${i}`}
                variant={evt.type === "acquisition" ? "default" : "outline"}
                data-testid={`timeline-event-${i}`}
              >
                <TimelineItemDate data-testid={`timeline-date-${i}`}>
                  {formatDate(evt.date)}
                </TimelineItemDate>

                <TimelineItemTitle
                  className="text-sm flex items-center gap-1.5"
                  data-testid={`timeline-label-${i}`}
                >
                  <span
                    className="inline-flex items-center justify-center rounded-full flex-shrink-0"
                    style={{
                      width: 22,
                      height: 22,
                      backgroundColor: evt.color,
                    }}
                  >
                    <Icon className="w-3 h-3 text-white" />
                  </span>
                  <span className="truncate">{label}</span>
                </TimelineItemTitle>

                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <IconMapPin className="w-3 h-3 flex-shrink-0" />
                  <span data-testid={`timeline-location-${i}`} className="truncate">{evt.location}</span>
                </div>

                <TimelineItemDescription data-testid={`timeline-detail-${i}`}>
                  {evt.detail}
                </TimelineItemDescription>
              </TimelineItem>
            );
          })}
        </Timeline>
      </div>

      <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground max-w-5xl mx-auto">
        <div className="flex items-center gap-1.5">
          <span
            className="inline-flex items-center justify-center rounded-full"
            style={{ width: 18, height: 18, backgroundColor: "var(--primary)" }}
          >
            <IconBuilding2 className="w-2.5 h-2.5 text-white" />
          </span>
          <span>Acquisition</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="inline-flex items-center justify-center rounded-full"
            style={{ width: 18, height: 18, backgroundColor: "#257D41" }}
          >
            <IconPlay className="w-2.5 h-2.5 text-white" />
          </span>
          <span>Operations Begin</span>
        </div>
      </div>
    </div>
    </AnimatedPage>
  );
}
