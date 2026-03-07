/**
 * NotificationCenter.tsx — In-app notification bell with unread badge.
 *
 * Provides a Zustand store (useNotificationStore) for creating, reading,
 * and dismissing notifications across the app. Notifications can be of type
 * info, success, warning, or error. The NotificationCenter component renders
 * a bell icon with an unread count badge and a dropdown panel showing recent
 * notifications with timestamps. Persisted to localStorage so notifications
 * survive page reloads.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useState, useRef, useEffect, useCallback } from "react";
import { Bell, Info, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

export interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (n: Omit<Notification, "id" | "timestamp" | "read">) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      addNotification: (n) =>
        set((state) => ({
          notifications: [
            {
              ...n,
              id: Math.random().toString(36).substring(2, 10),
              timestamp: Date.now(),
              read: false,
            },
            ...state.notifications,
          ].slice(0, 20),
        })),
      markRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),
      clearAll: () => set({ notifications: [] }),
      unreadCount: () => get().notifications.filter((n) => !n.read).length,
    }),
    { name: "notification-store" }
  )
);

const TYPE_CONFIG: Record<
  Notification["type"],
  { icon: typeof Info; color: string }
> = {
  info: { icon: Info, color: "var(--primary)" },
  success: { icon: CheckCircle, color: "#257D41" },
  warning: { icon: AlertTriangle, color: "#F59E0B" },
  error: { icon: XCircle, color: "#EF4444" },
};

function relativeTime(timestamp: number): string {
  const diff = Math.floor((Date.now() - timestamp) / 1000);
  if (diff < 60) return "just now";
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, markRead, markAllRead, clearAll, unreadCount } =
    useNotificationStore();
  const count = unreadCount();

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, handleClickOutside]);

  return (
    <div ref={ref} className="relative">
      <button
        data-testid="button-notifications"
        onClick={() => setOpen((o) => !o)}
        className="relative w-10 h-10 rounded-lg flex items-center justify-center bg-sidebar-accent hover:bg-sidebar-border transition-all duration-200"
      >
        <Bell className="w-4 h-4 text-sidebar-foreground/50" />
        {count > 0 && (
          <span
            data-testid="badge-unread-count"
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#EF4444] text-white text-[10px] font-bold flex items-center justify-center"
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div
          data-testid="panel-notifications"
          className="absolute right-0 top-12 w-80 max-h-[420px] rounded-xl overflow-hidden z-50 flex flex-col bg-white border border-gray-200 shadow-lg"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">
              Notifications
            </span>
            {notifications.length > 0 && (
              <button
                data-testid="button-mark-all-read"
                onClick={markAllRead}
                className="text-xs text-primary hover:text-primary/80 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div
                data-testid="text-no-notifications"
                className="flex items-center justify-center py-12 text-sm text-gray-400"
              >
                No notifications
              </div>
            ) : (
              notifications.map((n) => {
                const cfg = TYPE_CONFIG[n.type];
                const Icon = cfg.icon;
                return (
                  <button
                    key={n.id}
                    data-testid={`notification-item-${n.id}`}
                    onClick={() => markRead(n.id)}
                    className="w-full text-left px-4 py-3 flex gap-3 hover:bg-gray-50 transition-colors"
                    style={{
                      borderLeft: !n.read
                        ? "3px solid var(--primary)"
                        : "3px solid transparent",
                    }}
                  >
                    <Icon
                      className="w-5 h-5 mt-0.5 shrink-0"
                      style={{ color: cfg.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {relativeTime(n.timestamp)}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {notifications.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-2">
              <button
                data-testid="button-clear-all"
                onClick={clearAll}
                className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
