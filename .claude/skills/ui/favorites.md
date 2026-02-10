---
name: favorites
description: Bookmark/pin system for frequently used properties and views. Use when building favorites functionality.
theme: inherit
---

# Favorites / Bookmarks

## Purpose
Let users pin properties, pages, or views for quick access.

## Storage
- Zustand store `useFavoritesStore` persisted to localStorage
- Shape: `{ items: { type: 'property'|'page'|'view', id: string, label: string }[] }`

## UI Elements
- Star icon on property cards and page headers (toggle favorite)
- Favorites section in command palette
- Favorites sidebar section (below navigation)

## Star Icon (toggle)
- Unfavorited: `text-muted-foreground/40 hover:text-[#9FBCA4]`
- Favorited: `text-[#9FBCA4] fill-[#9FBCA4]`
- Uses lucide `Star` icon
