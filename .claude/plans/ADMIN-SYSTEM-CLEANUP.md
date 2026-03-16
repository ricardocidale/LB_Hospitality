# Admin System Tabs Cleanup

**Version**: 1.0
**Date**: 2026-03-16
**Planned by**: Claude Code Opus 4.6 (Anthropic)
**Status**: Recommendation — discuss with owner before implementing

---

## For Replit Agent

This is a small cleanup plan for the Admin panel's System group. Three changes: move Diagrams to Help, simplify Integrations, update the sidebar. Do not combine with the UX Redesign Plan — this is independent work.

---

## Problem

The Admin System group has 7 items. Two of them have issues:

- **Diagrams** — 15 static Mermaid diagrams with zero interactivity. No data binding. No admin actions. Just documentation rendered as an admin tab. Adds `mermaid@^11.13.0` to the production bundle for no operational value.
- **Integrations** — Monitors 5 services, but 2 are dead (Twilio + ElevenLabs — Marcela isolated). Resend health check just verifies an API key exists. The only useful part is the cache management section.

---

## Change 1: Move Diagrams to Help Page

### What to do
1. Add a new **"Architecture"** tab to the Help page (`/help`) alongside User Manual, Checker Manual, and Guided Tour
2. Move all 15 Mermaid diagram definitions from `DiagramsTab.tsx` into the new Help tab
3. Remove "Diagrams" from the admin sidebar (`AdminSidebar.tsx`)
4. Remove `DiagramsTab` from the admin section renderer (`Admin.tsx`)

### Why
- Diagrams are documentation, not configuration
- Every other admin tab has actions (CRUD, toggles, buttons). Diagrams has none.
- Help page is where documentation belongs
- Reduces admin sidebar from 7 to 6 System items
- Users interested in architecture can find it in Help without needing admin access

### Files to change
- `client/src/pages/Help.tsx` — add Architecture tab, import MermaidChart + diagram definitions
- `client/src/components/admin/DiagramsTab.tsx` — extract diagram data into a shared file, or move entirely
- `client/src/components/admin/AdminSidebar.tsx` — remove Diagrams section
- `client/src/pages/Admin.tsx` — remove Diagrams from section renderer
- `client/src/lib/admin-nav.ts` — remove "diagrams" from AdminSection type (if defined there)

### Access control consideration
Currently Diagrams requires admin role. On the Help page, it would be visible to all authenticated users. This is fine — the diagrams contain no sensitive information. They describe system architecture, not credentials or business data.

---

## Change 2: Simplify Integrations to "Cache & Services"

### What to do
1. Rename tab from "Integrations" to **"Cache & Services"**
2. Remove Twilio and ElevenLabs health cards (both are dead — Marcela isolated)
3. Keep remaining health cards: Resend, Geospatial, Document AI
4. Keep cache statistics section (hit rate, key count, connection status)
5. Keep cache clear buttons (clear by property ID, clear all)
6. Update sidebar label

### Why
- Twilio and ElevenLabs show "healthy" badges for services that are gated at every endpoint with `MARCELA_ISOLATED = true`. This is misleading — they're not operational.
- Removing dead services makes the tab honest about what's actually monitored
- Cache management is the most useful part of this tab — make it prominent

### When Marcela returns
When `MARCELA-RESTORATION.md` is executed:
- Add Twilio and ElevenLabs health cards back
- Consider renaming back to "Integrations" if the full set makes sense
- Or keep "Cache & Services" and add a sub-section for voice integrations

### Files to change
- `client/src/components/admin/IntegrationHealthTab.tsx` — remove Twilio and ElevenLabs card rendering, rename component if desired
- `client/src/components/admin/AdminSidebar.tsx` — update label from "Integrations" to "Cache & Services"
- `client/src/pages/Admin.tsx` — update section label if it's rendered there

---

## Change 3: Updated Admin System Group

### Before (7 items)
```
SYSTEM
├── Navigation & Display
├── Notifications
├── Diagrams              ← documentation in wrong place
├── Verification
├── Database
├── Integrations          ← 2 of 5 services are dead
└── Activity
```

### After (6 items)
```
SYSTEM
├── Navigation & Display
├── Notifications
├── Verification
├── Database
├── Cache & Services      ← renamed, simplified
└── Activity
```

Diagrams content moves to Help > Architecture tab.

---

## What NOT to Change

| Tab | Status | Keep as-is because |
|-----|--------|-------------------|
| Navigation & Display | Keep | Operational — sidebar toggles, display settings |
| Notifications | Keep | Operational — alert rules, email channels |
| Verification | Keep | Production audit tool with GAAP checks, PDF export, audit history |
| Database | Keep | Entity monitoring, seed data, canonical sync |
| Activity | Keep | Login logs, activity feed, checker audit trail — compliance value |

---

## Effort Estimate

| Change | Effort | Risk |
|--------|--------|------|
| Move Diagrams to Help | Small (2-3 hours) | Low — just moving components |
| Simplify Integrations | Small (1-2 hours) | Low — removing UI elements |
| Update sidebar | Tiny (15 minutes) | Low — label changes |
| **Total** | **Half day** | **Low** |

---

## Verification

```bash
# After changes:
npm run test:summary      # All tests pass
npm run health            # Doc harmony passes

# Manual checks:
# 1. Admin sidebar shows 6 System items (no Diagrams)
# 2. Help page has new Architecture tab with 15 diagrams
# 3. Integrations tab shows 3 services (no Twilio/ElevenLabs)
# 4. Cache management still works (clear by ID, clear all)
```

---

*This is independent from the UX Redesign Plan. Can be done before, during, or after the defaults governance work.*
