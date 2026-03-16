# Marcela & ElevenLabs Isolation Plan

**Date**: 2026-03-16
**Planned by**: Claude Code Opus 4.6 (Anthropic)
**Status**: Ready for implementation
**Priority**: Execute BEFORE the UX Redesign Plan

---

## Purpose

Marcela (the ElevenLabs-powered voice AI agent) is not currently working. Rather than debugging it during the UX redesign, we will **isolate** it — disable all active code paths so Marcela cannot run, while preserving every file, function, SDK integration, tool, route, component, and database field intact. Nothing gets deleted. Everything can be restored by reversing these changes.

**Rebecca** (the Gemini-powered text chatbot) becomes the sole AI agent for the app.

---

## What "Isolate" Means

- Marcela's widget does NOT load in the browser (no ElevenLabs script execution)
- Marcela's API routes still exist but return graceful "disabled" responses
- Marcela's admin configuration tabs still exist but show a "Marcela is currently disabled" banner
- All 40+ database fields for Marcela remain in the schema (no migration needed)
- All NPM dependencies remain in package.json
- All source files remain untouched in their directories
- Voice Lab page (`/voice`) is hidden from navigation but the route still works for testing
- Twilio voice/SMS endpoints return graceful "disabled" responses
- Rebecca operates independently with no mutual exclusion constraint

---

## Changes Required (8 Total)

### Change 1: Stop Loading ElevenLabs Widget in Browser

**File:** `client/src/main.tsx` (lines 5-15)

**Current:**
```typescript
if (!customElements.get("elevenlabs-convai")) {
  import("@elevenlabs/convai-widget-core")
    .then(({ registerWidget }) => {
      if (!customElements.get("elevenlabs-convai")) {
        registerWidget("elevenlabs-convai");
        console.info("[ElevenLabs] Widget element registered");
      }
    })
    .catch(() => {});
}
```

**Change to:**
```typescript
// MARCELA ISOLATED: ElevenLabs widget registration disabled.
// To restore: uncomment the block below.
// See .claude/plans/MARCELA-ISOLATION.md for full restoration guide.
/*
if (!customElements.get("elevenlabs-convai")) {
  import("@elevenlabs/convai-widget-core")
    .then(({ registerWidget }) => {
      if (!customElements.get("elevenlabs-convai")) {
        registerWidget("elevenlabs-convai");
        console.info("[ElevenLabs] Widget element registered");
      }
    })
    .catch(() => {});
}
*/
```

**Why:** This is the single entry point that loads the ElevenLabs SDK into the browser. Commenting it out means no ElevenLabs JavaScript executes, no network calls to `api.elevenlabs.io`, no WebSocket connections. The widget custom element simply never registers.

---

### Change 2: Disable Marcela Widget in Layout

**File:** `client/src/components/Layout.tsx` (lines 37-45)

**Current:**
```typescript
function MarcelaWidgetGated() {
  const { data: global } = useGlobalAssumptions();
  const { tourActive, promptVisible } = useWelcomeTour();
  const [location] = useLocation();
  const onAdminPage = location.startsWith("/admin");
  const rebeccaActive = !!(global as any)?.rebeccaEnabled;
  const enabled = !!(global as any)?.showAiAssistant && !!(global as any)?.marcelaEnabled && !rebeccaActive && !tourActive && !promptVisible && !onAdminPage;
  return <ElevenLabsWidget enabled={enabled} />;
}
```

**Change to:**
```typescript
function MarcelaWidgetGated() {
  // MARCELA ISOLATED: Widget always disabled.
  // To restore: remove the early return below.
  return null;

  // Original logic preserved for restoration:
  // const { data: global } = useGlobalAssumptions();
  // const { tourActive, promptVisible } = useWelcomeTour();
  // const [location] = useLocation();
  // const onAdminPage = location.startsWith("/admin");
  // const rebeccaActive = !!(global as any)?.rebeccaEnabled;
  // const enabled = !!(global as any)?.showAiAssistant && !!(global as any)?.marcelaEnabled && !rebeccaActive && !tourActive && !promptVisible && !onAdminPage;
  // return <ElevenLabsWidget enabled={enabled} />;
}
```

**Why:** Even if Change 1 is bypassed, the widget renders `null`. Belt and suspenders.

---

### Change 3: Hide Voice Lab from App Routes (Keep Route Working)

**File:** `client/src/App.tsx`

No change to the route itself — `/voice` continues to work if someone navigates directly. But it's already not in the sidebar navigation (confirmed by audit). If it appears anywhere as a link, those links should be hidden.

**Action:** Search for any link to `/voice` outside of App.tsx routes. If found, wrap in a `marcelaEnabled` check or comment out. The route definition stays.

---

### Change 4: Remove Mutual Exclusion on Rebecca

**File:** `server/routes/admin/marcela.ts`

Find the mutual exclusion logic in the `POST /api/admin/voice-settings` handler where saving Marcela settings sets `rebeccaEnabled = false`.

**Change:** When saving Marcela settings, do NOT touch `rebeccaEnabled`. Rebecca should be independently controllable.

**Also:** In the client-side `AIAgentsTab.tsx`, the toggle bar shows Marcela and Rebecca as mutually exclusive. Change the UI to:
- Show Marcela as disabled/grayed with a banner: "Marcela is temporarily unavailable. See admin for details."
- Rebecca toggle operates independently (no mutual exclusion)

---

### Change 5: Add "Disabled" Banner to Admin AI Agents Tab

**File:** `client/src/components/admin/AIAgentsTab.tsx`

At the top of the Marcela configuration section, add a prominent but non-alarming banner:

```tsx
<div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
  <div className="flex items-center gap-3">
    <Shield className="h-5 w-5 text-amber-600" />
    <div>
      <p className="font-display font-semibold text-amber-800">Marcela is temporarily disabled</p>
      <p className="text-sm text-amber-700 mt-1">
        The ElevenLabs voice agent is isolated while under maintenance.
        All configuration is preserved and will be restored when ready.
        Rebecca is the active AI agent.
      </p>
    </div>
  </div>
</div>
```

The Marcela config tabs can remain visible (read-only reference) or be collapsed — implementer's choice. The important thing is the user understands Marcela is intentionally disabled, not broken.

---

### Change 6: Graceful Server-Side Route Responses

**File:** `server/routes/admin/marcela.ts`

Add an early return at the top of Marcela-specific endpoints:

```typescript
// MARCELA ISOLATED: Return graceful disabled response
const MARCELA_DISABLED_MSG = "Marcela is temporarily disabled. Configuration is preserved.";

// Add to: POST /api/marcela/scribe-token, GET /api/marcela/signed-url
// Before any ElevenLabs API calls:
if (true) { // MARCELA ISOLATED — change to feature flag check when restoring
  return res.status(503).json({ error: MARCELA_DISABLED_MSG, isolated: true });
}
```

**Endpoints to guard:**
- `POST /api/marcela/scribe-token` — returns 503
- `GET /api/marcela/signed-url` — returns 503
- `GET /api/admin/convai/health` — returns `{ healthy: false, reason: "isolated" }`
- `POST /api/admin/convai/configure-tools` — returns 503
- `PATCH /api/admin/convai/agent/*` — returns 503

**Endpoints to leave working (read-only, no ElevenLabs API calls):**
- `GET /api/admin/voice-settings` — still returns stored config (useful for reference)
- `POST /api/admin/voice-settings` — still saves to DB (preserves config for restoration)
- `GET /api/admin/convai/conversations` — may return empty or cached data

---

### Change 7: Disable Twilio Voice Webhook

**File:** `server/routes/twilio.ts`

At the top of the incoming call handler:

```typescript
// POST /api/twilio/voice/incoming
// MARCELA ISOLATED: Return TwiML "temporarily unavailable" message
const twiml = new VoiceResponse();
twiml.say("The voice assistant is temporarily unavailable. Please try again later.");
twiml.hangup();
return res.type("text/xml").send(twiml.toString());
```

This ensures any incoming phone calls get a polite message instead of an error.

---

### Change 8: Set Database Flags

Run this SQL (or do it via the admin UI):

```sql
UPDATE global_assumptions
SET marcela_enabled = false,
    show_ai_assistant = false,
    rebecca_enabled = true
WHERE user_id IS NULL;
```

This ensures:
- `marcelaEnabled = false` — all client-side gating returns false
- `showAiAssistant = false` — the widget mount point in Layout returns null
- `rebeccaEnabled = true` — Rebecca is active

---

## What NOT to Change

| Item | Action | Reason |
|------|--------|--------|
| NPM dependencies (`@elevenlabs/*`, `twilio`, `ws`) | Keep | Tree-shaken in production build; no runtime cost |
| Schema fields (40+ Marcela columns) | Keep | No migration needed; values preserved for restoration |
| Server route files | Keep all files | Routes still registered but return 503 |
| Client components (`features/ai-agent/`) | Keep all 44 files | Not imported when widget disabled |
| Admin Marcela sub-components (13 files) | Keep | Visible for reference in admin panel |
| Knowledge base files (`server/ai/kb/`) | Keep | Static markdown, no runtime cost |
| Skills/docs (`.claude/skills/marcela-ai/`, `elevenlabs/`, `twilio-telephony/`) | Keep | Documentation for restoration |
| Tool schemas (`.claude/tools/marcela/`) | Keep | Schema files, no runtime cost |
| Environment variables (`ELEVENLABS_API_KEY`, etc.) | Keep in Replit Secrets | No cost when not called |
| CSP headers (ElevenLabs domains) | Keep | No cost; simplifies restoration |
| Type definitions (`elevenlabs-convai.d.ts`) | Keep | TypeScript-only, no runtime |

---

## Verification After Isolation

Run these checks to confirm isolation is complete:

```bash
# 1. All tests still pass (Marcela code isn't deleted, just gated)
npm run test:summary

# 2. Financial verification unaffected
npm run verify:summary

# 3. No ElevenLabs network calls in browser
# Open DevTools > Network tab > filter "elevenlabs"
# Should show ZERO requests

# 4. Rebecca works independently
# Enable Rebecca in admin > AI Agents
# Verify chatbot appears and responds

# 5. Voice Lab page shows disabled state
# Navigate to /voice — should show Marcela disabled message or empty state

# 6. Admin AI Agents tab shows disabled banner
# Navigate to /admin > AI Agents — Marcela section shows isolation banner
```

---

## How to Restore Marcela & ElevenLabs (When Ready)

When Marcela is working again, reverse these 8 changes:

### Restoration Checklist

1. **`client/src/main.tsx`** — Uncomment the ElevenLabs widget registration block
2. **`client/src/components/Layout.tsx`** — Remove `return null;` from `MarcelaWidgetGated`, uncomment original logic
3. **`client/src/App.tsx`** — No change needed (route was never removed)
4. **`server/routes/admin/marcela.ts`** — Remove mutual exclusion bypass. Restore Rebecca toggle logic if desired.
5. **`client/src/components/admin/AIAgentsTab.tsx`** — Remove "temporarily disabled" banner. Restore mutual exclusion toggle UI.
6. **`server/routes/admin/marcela.ts`** — Remove `503` early returns from guarded endpoints
7. **`server/routes/twilio.ts`** — Remove "temporarily unavailable" TwiML response, restore WebSocket bridge
8. **Database** — Set `marcela_enabled = true`, `show_ai_assistant = true` via admin UI or SQL

### Restoration Verification

```bash
# 1. Tests still pass
npm run test:summary

# 2. ElevenLabs widget loads
# DevTools > Network > filter "elevenlabs" — should see signed-url request

# 3. Admin > AI Agents > Marcela config is editable

# 4. Convai health check passes
# GET /api/admin/convai/health — should return { healthy: true }

# 5. Voice Lab page works
# Navigate to /voice — voice orb should respond

# 6. If Twilio enabled, test incoming call
```

### Key Files to Review Before Restoration

| File | What to Check |
|------|--------------|
| `server/integrations/elevenlabs.ts` | API key still valid, client initializes |
| `server/ai/marcela-agent-config.ts` | Agent ID still valid on ElevenLabs platform |
| `server/ai/marcela-knowledge-base.ts` | KB documents may need re-upload |
| `client/src/features/ai-agent/ElevenLabsWidget.tsx` | Widget props still match ElevenLabs API |
| `package.json` | `@elevenlabs/convai-widget-core` version still compatible |

### Possible Issues After Long Isolation

- **ElevenLabs agent may have been deleted** — Check agent ID still exists on ElevenLabs dashboard
- **API key may have expired/rotated** — Verify `ELEVENLABS_API_KEY` in Replit Secrets
- **Widget SDK version** — `@elevenlabs/convai-widget-core` may have breaking changes. Run `npm update @elevenlabs/convai-widget-core` and test.
- **Knowledge base stale** — Run "Rebuild Knowledge Base" from admin after restoration
- **Twilio number may have been released** — Verify phone number still active if telephony was enabled

---

## Summary

| What | Before | After Isolation |
|------|--------|----------------|
| Marcela widget in browser | Loads ElevenLabs SDK + widget | Returns null, no network calls |
| Rebecca chatbot | Mutually exclusive with Marcela | Independent, sole AI agent |
| Voice Lab (`/voice`) | Accessible | Route exists but not in navigation |
| Admin AI Agents | Marcela + Rebecca toggle | Marcela shows "disabled" banner |
| Marcela API endpoints | Active, call ElevenLabs | Return 503 "isolated" |
| Twilio voice webhook | Bridges to ElevenLabs | Returns "unavailable" TwiML |
| All Marcela source code | Active | Preserved, untouched |
| Database schema | 40+ Marcela fields | All fields remain, `marcelaEnabled = false` |
| NPM packages | Installed | Installed but unused (tree-shaken) |
| Documentation | Active | Preserved, tagged with isolation notes |

**Total files modified: 5-6 files**
**Total files deleted: 0**
**Total lines of code preserved: ~3,000+ lines of Marcela/ElevenLabs code**
**Restoration time: ~30 minutes** (reverse 8 changes + verify)
