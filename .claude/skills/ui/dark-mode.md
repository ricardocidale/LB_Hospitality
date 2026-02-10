---
name: dark-mode
description: Dark mode as a theme variant within the theme engine. Use when toggling or building dark mode support.
theme: dark-glass (variant)
---

# Dark Mode

## Approach
Dark mode is a **theme variant**, not a separate toggle. It's a built-in theme called "Dark" that applies dark tokens across all surfaces.

## Dark Theme Tokens
- Base: `#0a0a0f`
- Accent: `#9FBCA4`
- Text: `#FFF9F5`
- Card: `#1a1a2e`
- Borders: `white/10`
- Muted: `white/40`

## Toggle
- Theme switcher in Settings or header dropdown
- Switching to "Dark" theme activates full dark mode
- Persisted in `useThemeStore` (localStorage)
