---
name: admin
description: Admin page architecture. 12-tab shell pattern, extraction guide, API routes, shared types, AI Agent dashboard, Services tab.
---

# Admin Page — Entry Point

## Purpose
Documents the Admin Settings page architecture — refactored from a 3,235-line monolith into 12 standalone tab components + 87-line shell.

## Sub-Skills
| File | What It Covers |
|------|---------------|
| `admin-refactor-map.md` | Component structure, file map, prop interfaces, data flow |
| `tab-extraction-guide.md` | How to extract new tabs from monolithic pages |
| `admin-shell-template.md` | Shell pattern with tab navigation |
| `component-checklist.md` | Checklist for new admin components |
| `admin-api-routes.md` | Admin API endpoints |
| `database-sync-behavior.md` | DB sync and seed behavior |
| `ai-agent-admin.md` | AI Agent tab: 7-tab dashboard, components, hooks, API endpoints |

## Key Files
- `client/src/pages/Admin.tsx` — 87-line shell (tab navigation only)
- `client/src/components/admin/` — 12 tab components + barrel export + shared types
- `server/routes/admin.ts` — Admin API routes
- `server/routes/admin/marcela.ts` — AI Agent admin API + ConvAI proxy endpoints

## Tabs
Users, Companies, Activity, Verification, User Groups, Logos, Branding, Themes, Navigation, Services, AI Agent, Database

## AI Agent Tab (7 sub-tabs)
The AI Agent tab is a comprehensive dashboard with its own sub-navigation:
General, Prompt, Voice & Audio, LLM, Tools, Knowledge Base, Telephony

See `ai-agent-admin.md` for full architecture.

## Related Rules
- `rules/api-routes.md` — API naming conventions
- `rules/ui-patterns.md` — Button labels, entity cards
- `rules/context-reduction.md` — Skills required for every feature
