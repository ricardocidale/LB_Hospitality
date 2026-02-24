/**
 * Favorites.tsx — User favorites system with persistent local storage.
 *
 * Manages a list of starred items (properties, pages, or views) using a
 * Zustand store persisted to localStorage. The FavoritesDropdown renders
 * a popover with the user's bookmarked items for quick navigation.
 * The useFavoritesStore hook can be used anywhere to add/remove favorites
 * or check whether a specific item is starred.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Star, Building2, FileText, Eye, ChevronDown } from "lucide-react";
import { useState } from "react";

export interface FavoriteItem {
  type: 'property' | 'page' | 'view';
  id: string;
  label: string;
}

interface FavoritesState {
  items: FavoriteItem[];
  addFavorite: (item: FavoriteItem) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (item: FavoriteItem) => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      items: [],
      addFavorite: (item) =>
        set((state) => ({
          items: state.items.some((i) => i.id === item.id)
            ? state.items
            : [...state.items, item],
        })),
      removeFavorite: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),
      isFavorite: (id) => get().items.some((i) => i.id === id),
      toggleFavorite: (item) => {
        const state = get();
        if (state.items.some((i) => i.id === item.id)) {
          set({ items: state.items.filter((i) => i.id !== item.id) });
        } else {
          set({ items: [...state.items, item] });
        }
      },
    }),
    { name: "favorites-store" }
  )
);

export function FavoritesStar({ item, className }: { item: FavoriteItem; className?: string }) {
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const favorited = isFavorite(item.id);

  return (
    <button
      data-testid={`button-favorite-${item.id}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(item);
      }}
      className={`transition-all duration-300 ease-in-out ${
        favorited
          ? "text-primary"
          : "text-background/30 hover:text-primary"
      } ${className ?? ""}`}
    >
      <Star
        className="w-4 h-4"
        fill={favorited ? "currentColor" : "none"}
      />
    </button>
  );
}

const typeIcon = {
  property: Building2,
  page: FileText,
  view: Eye,
};

function getHref(item: FavoriteItem) {
  if (item.type === "property") return `/property/${item.id}`;
  return `/${item.id}`;
}

export default function FavoritesSidebar() {
  const { items } = useFavoritesStore();
  const [open, setOpen] = useState(true);

  return (
    <div data-testid="favorites-sidebar">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-background/60 hover:text-white transition-colors duration-200"
      >
        <Star className="w-3.5 h-3.5" />
        <span>Favorites</span>
        <ChevronDown
          className={`w-3.5 h-3.5 ml-auto transition-transform duration-200 ${
            open ? "" : "-rotate-90"
          }`}
        />
      </button>

      {open && (
        <div className="px-2 pb-2 space-y-0.5">
          {items.length === 0 ? (
            <p className="px-4 py-2 text-xs text-background/30">No favorites yet</p>
          ) : (
            items.map((item) => {
              const Icon = typeIcon[item.type];
              return (
                <a
                  key={item.id}
                  href={getHref(item)}
                  className="flex items-center gap-2 px-4 py-1.5 text-sm text-background/60 hover:text-white rounded-lg hover:bg-white/5 transition-all duration-200"
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </a>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
