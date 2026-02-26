---
name: admin
description: Admin page architecture. 10-tab shell pattern, extraction guide, API routes, shared types.
---

# Admin Page — Entry Point

## Purpose
Documents the Admin Settings page architecture — refactored from a 3,235-line monolith into 10 standalone tab components + 87-line shell.

## Sub-Skills
| File | What It Covers |
|------|---------------|
| `admin-refactor-map.md` | Component structure, file map, prop interfaces, data flow |
| `tab-extraction-guide.md` | How to extract new tabs from monolithic pages |
| `admin-shell-template.md` | Shell pattern with tab navigation |
| `component-checklist.md` | Checklist for new admin components |
| `admin-api-routes.md` | Admin API endpoints |
| `database-sync-behavior.md` | DB sync and seed behavior |

## Key Files
- `client/src/pages/Admin.tsx` — 87-line shell (tab navigation only)
- `client/src/components/admin/` — 11 tab components + barrel export + shared types
- `server/routes/admin.ts` — Admin API routes

## Tabs
Users, Companies, Activity, Verification, User Groups, Logos, Branding, Themes, Navigation, Marcela, Database

## Related Rules
- `rules/api-routes.md` — API naming conventions
- `rules/ui-patterns.md` — Button labels, entity cards
