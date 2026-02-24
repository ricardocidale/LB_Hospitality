/**
 * ActivityFeed.tsx — Chronological feed of user actions and system events.
 *
 * Tracks meaningful actions in the app via a Zustand store persisted to
 * localStorage. Event types include:
 *   • assumption_change  — user modified a financial assumption
 *   • scenario_run       — what-if scenario was evaluated
 *   • export             — data exported to Excel/PDF/PPTX
 *   • property_add       — new property added to portfolio
 *   • research_refresh   — AI research regenerated for a property
 *   • verification       — GAAP compliance check executed
 *
 * The ActivityFeedPanel component renders a scrollable list of recent events
 * with icons, timestamps, and detail text.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Activity, Sliders, Play, Download, Plus, RefreshCw, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ActivityEvent {
  id: string;
  type: 'assumption_change' | 'scenario_run' | 'export' | 'property_add' | 'research_refresh' | 'verification';
  title: string;
  detail: string;
  timestamp: number;
}

interface ActivityState {
  events: ActivityEvent[];
  addEvent: (event: Omit<ActivityEvent, 'id' | 'timestamp'>) => void;
  clearEvents: () => void;
}

export const useActivityStore = create<ActivityState>()(
  persist(
    (set) => ({
      events: [],
      addEvent: (event) =>
        set((state) => {
          const newEvent: ActivityEvent = {
            ...event,
            id: crypto.randomUUID(),
            timestamp: Date.now(),
          };
          const updated = [newEvent, ...state.events].slice(0, 50);
          return { events: updated };
        }),
      clearEvents: () => set({ events: [] }),
    }),
    { name: "activity-store" }
  )
);

const EVENT_ICONS: Record<ActivityEvent['type'], React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  assumption_change: Sliders,
  scenario_run: Play,
  export: Download,
  property_add: Plus,
  research_refresh: RefreshCw,
  verification: CheckCircle,
};

const EVENT_COLORS: Record<ActivityEvent['type'], string> = {
  assumption_change: '#F59E0B',
  scenario_run: '#9FBCA4',
  export: '#3B82F6',
  property_add: '#257D41',
  research_refresh: '#8B5CF6',
  verification: '#10B981',
};

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ActivityFeed() {
  const { events, clearEvents } = useActivityStore();
  const recentEvents = events.slice(0, 10);

  return (
    <div data-testid="activity-feed" className="bg-white rounded-xl border shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-gray-700" />
          <h3 className="text-base font-semibold text-gray-900">Recent Activity</h3>
        </div>
        {events.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearEvents}
            className="text-xs text-gray-400 hover:text-gray-600"
            data-testid="button-clear-activity"
          >
            Clear
          </Button>
        )}
      </div>

      {recentEvents.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">No recent activity</p>
      ) : (
        <div className="space-y-3">
          {recentEvents.map((event) => {
            const Icon = EVENT_ICONS[event.type];
            const color = EVENT_COLORS[event.type];
            return (
              <div key={event.id} className="flex items-start gap-3" data-testid={`activity-event-${event.id}`}>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: `${color}15` }}
                >
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{event.title}</p>
                  <p className="text-xs text-gray-500 truncate">{event.detail}</p>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap shrink-0 mt-0.5">
                  {formatRelativeTime(event.timestamp)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
