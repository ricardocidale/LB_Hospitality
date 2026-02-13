# Session Memory Rule

**Every session MUST begin by reading this file and `replit.md` to restore full context.**
**Every session MUST end by updating this file with all decisions, changes, and pending work.**

This rule ensures continuity across chat resets. The agent must treat this file as a living changelog of the project's evolution.

---

## Session: February 13, 2026

### What Was Done

#### 1. Logo Management Moved Into Administration Page
- **Removed** the separate "Logo Management" sidebar link from `Layout.tsx`
- **Added** a "Logos" tab to the Admin page's `DarkGlassTabs` (using `Upload` icon)
- **Created** `renderLogos()` function inside `Admin.tsx` with:
  - Grid of logo cards showing image preview, name, company name, default badge (star icon), delete button
  - "Add Logo" button opening a create dialog
  - Empty state with icon and guidance text
- **Added** logo create dialog with:
  - Logo name field
  - Company name field
  - File upload via object storage presigned URLs (5MB limit, image validation)
  - OR manual URL input
  - Image preview before saving
- **Added** delete confirmation dialog for logos
- **Replaced** the old inline Logo Portfolio card in the Branding tab with a read-only summary view + "Manage Logos" button that navigates to the Logos tab
- **Removed** duplicate state variables (`newLogoName`, `newLogoUrl`) and old duplicate mutations (`createLogoMutation`, `deleteLogoMutation`) that existed from the previous inline implementation
- **Files changed:** `client/src/pages/Admin.tsx`, `client/src/components/Layout.tsx`

#### 2. Image Generation Updated to Nano Banana
- **Updated** `server/replit_integrations/image/client.ts` to use Nano Banana (`gemini-2.5-flash-image`) via `generateContent` API
- **Old approach:** Used deprecated `gemini.models.generateImages()` with `imagen-3.0-generate-002`
- **New approach:** Uses `gemini.models.generateContent()` with `gemini-2.5-flash-image` model and `responseModalities: ["image", "text"]`
- **Fallback:** Still falls back to OpenAI `gpt-image-1` if Nano Banana fails
- **Files changed:** `server/replit_integrations/image/client.ts`

#### 3. Generic AIImagePicker Component Created (IN PROGRESS)
- **Created** `client/src/components/ui/ai-image-picker.tsx` — a reusable component supporting:
  - Three modes: Upload, AI Generate, URL input
  - Configurable aspect ratio (square, landscape, portrait)
  - Dark/light variant support
  - Default prompt and auto-prompt display
  - Progress states (uploading, generating)
  - Error display for generation failures
  - Nano Banana branding in generate button
  - Max file size validation
  - data-testid attributes on all interactive elements
- **Refactored** `PropertyImagePicker` to wrap `AIImagePicker` with property-specific defaults (auto-prompt from name + location)
- **Files changed:** `client/src/components/ui/ai-image-picker.tsx` (new), `client/src/features/property-images/PropertyImagePicker.tsx` (refactored)

### Still Pending / In Progress
- Wire AI image generation into Admin Logos tab (add "Generate with AI" option in logo creation dialog)
- Create skill documentation for the new reusable image picker components
- Verify TypeScript compiles, health check passes, end-to-end testing
- Final architect review of all changes

### Key Architecture Decisions
- **Nano Banana (gemini-2.5-flash-image)** is the primary image generation model; fallback to OpenAI `gpt-image-1`
- **Image generation endpoint:** `POST /api/generate-property-image` — generates image and uploads to object storage, returns `objectPath`
- **Logo upload endpoint:** `POST /api/admin/logos/upload` — returns presigned URL for direct upload
- **Logo CRUD:** `GET/POST /api/admin/logos`, `DELETE /api/admin/logos/:id`
- **AIImagePicker** is the canonical reusable image component; all specific pickers (property, logo) should wrap it
- **Branding resolution:** User Group logoId → Company logoId → Default Logo

### User Preferences Noted
- User calls the image generation model "Nano Banana" (Google's gemini-2.5-flash-image)
- User wants reusable UI tools that can be shared across features
- User wants **100% session memory** — all decisions, changes, and context must be saved to persist across chat resets
- User wants "formula-like" accordion details in statements to remain toggleable via Settings > Other tab > Calculation Transparency (two switches: `showCompanyCalculationDetails` and `showPropertyCalculationDetails`)

### Important File Map
| File | Purpose |
|------|---------|
| `client/src/components/ui/ai-image-picker.tsx` | Generic AI image picker (upload + generate + URL) |
| `client/src/features/property-images/PropertyImagePicker.tsx` | Property-specific wrapper around AIImagePicker |
| `client/src/features/property-images/useGenerateImage.ts` | Hook for AI image generation (calls `/api/generate-property-image`) |
| `client/src/hooks/use-upload.ts` | Hook for file uploads via presigned URLs |
| `client/src/components/ui/entity-card.tsx` | Reusable entity card components (container, item, empty state) |
| `client/src/pages/Admin.tsx` | Administration page with tabs: Users, Companies, Activity, Verification, User Groups, Logos, Branding, Themes, Navigation, Database |
| `server/replit_integrations/image/client.ts` | Server-side image gen client (Nano Banana + OpenAI fallback) |
| `server/routes.ts` | All API routes including logo CRUD, image generation, branding |
| `client/src/pages/Settings.tsx` | Settings page — "Other" tab has Calculation Transparency toggles |

### Sidebar Navigation Structure (by role)
- **Admin:** sees everything — all pages + Administration
- **Partner/Checker:** sees management-level pages (dashboard, properties, company, settings, etc.) but NOT Administration
- **Investor:** sees limited view — Dashboard, Properties, Profile, Help only
- Consecutive dividers are auto-filtered to prevent visual gaps
