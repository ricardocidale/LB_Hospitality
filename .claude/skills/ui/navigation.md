---
name: navigation
description: Navigation shell components — Command Palette, Breadcrumbs, Favorites, Activity Feed, Dark Mode. Use when building navigation or shell features.
theme: dark-glass / inherit
---

# Navigation & Shell Components

## Command Palette (Ctrl+K)
Global search and quick-action launcher.

- **File**: `client/src/components/CommandPalette.tsx`
- **Trigger**: Ctrl+K (or Cmd+K on Mac)
- **Groups**: Navigation, Properties (live search), Quick Actions
- **Theme**: Dark Glass — `bg-[#0a0a0f]/95 backdrop-blur-xl`, `accent` highlighted results

---

## Breadcrumbs
Route-aware contextual breadcrumbs.

- **File**: `client/src/components/Breadcrumbs.tsx`
- **Behavior**: Static route map for all 22 pages; dynamic property name resolution via store
- **Property routes**: Home → Properties → {Property Name} → [Edit|Research]
- **Theme**: Inherits from parent — uses `text-foreground` / `text-muted-foreground` tokens

---

## Favorites / Bookmarks
Pin properties, pages, or views for quick access.

- **File**: `client/src/components/Favorites.tsx`
- **Storage**: Zustand `useFavoritesStore` persisted to localStorage
- **UI**: Star icon on property cards/headers, sidebar section, command palette group
- **Star Colors**: Unfavorited = `text-muted-foreground/40`, Favorited = `text-[#9FBCA4] fill-[#9FBCA4]`

---

## Activity Feed
Recent user actions and system events in chronological order.

- **File**: `client/src/components/ActivityFeed.tsx`
- **Storage**: Zustand `useActivityStore`, last 50 events persisted to localStorage
- **Events**: assumption_change (Sliders), scenario_run (Play), export (Download), property_add (Plus), research_refresh (RefreshCw), verification (CheckCircle)
- **Placement**: Dashboard widget or dedicated section

---

## Dark Mode
Dark mode is a theme variant, not a separate toggle.

- **Tokens**: Base `#0a0a0f`, Accent `#9FBCA4`, Text `#FFF9F5`, Card `#1a1a2e`, Borders `white/10`
- **Toggle**: Theme switcher in Settings; switching to "Dark" theme activates full dark mode
- **Persistence**: `useThemeStore` (localStorage)
