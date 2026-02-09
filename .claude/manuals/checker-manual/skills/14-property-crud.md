# 14 — Adding, Editing, and Deleting Properties

## Overview

Properties (SPVs) are the fundamental investment entities in the portfolio. The platform supports full CRUD (Create, Read, Update, Delete) operations on properties, with each change triggering immediate recalculation of all consolidated financials, management company fee revenue, and portfolio-level metrics.

---

## Adding a Property

| Step | Action | Detail |
|------|--------|--------|
| 1 | Navigate to Portfolio | Go to `/portfolio` |
| 2 | Click "Add Property" | Opens the Add Property dialog |
| 3 | Fill required fields | Property identity, capital structure, revenue drivers (see field table below) |
| 4 | Save | Property is created in the database and immediately appears in the portfolio |

### Required Fields for New Property

| Section | Field | Default | Notes |
|---------|-------|---------|-------|
| **Identity** | Name | — | Descriptive property name |
| | Location | — | City/region (e.g., "Asheville, NC") |
| | Market | — | Market classification (e.g., "Southeast US") |
| | Status | Development | Development, Operational, or Stabilized |
| | Image URL | — | Optional; property card thumbnail |
| **Timing** | Acquisition Date | — | Date of property purchase |
| | Operations Start Date | Acquisition + 6 months | Auto-calculated; user-overridable |
| **Capital Structure** | Purchase Price | — | Total acquisition cost |
| | Building Improvements | $0 | Renovation / repositioning CapEx |
| | Pre-Opening Costs | $0 | Soft costs before operations commence |
| | Operating Reserve | $0 | Working capital cushion |
| | Type | Full Equity | "Full Equity" (all-cash) or "Leveraged" |
| **Revenue Drivers** | Room Count | 20 | Number of keys |
| | Start ADR | $350 | Average Daily Rate at launch |
| | ADR Growth Rate | 3% | Annual ADR escalation |
| | Start Occupancy | 45% | Opening occupancy rate |
| | Max Occupancy | 75% | Stabilized occupancy target |
| | Occupancy Ramp Months | 18 | Months to reach stabilized occupancy |
| | Catering Boost % | 15% | F&B revenue uplift from catering programs |

> **Cross-reference:** See `skills/05-property-assumptions.md` for the full assumption catalog and `formulas/property-financials.md` for how each assumption feeds into the financial engine.

---

## Editing a Property

| Step | Action | Detail |
|------|--------|--------|
| 1 | Navigate to Portfolio | Go to `/portfolio` |
| 2 | Click edit icon | On the property card → navigates to `/property/:id/edit` (PropertyEdit page) |
| 3 | Modify fields | All configurable fields organized in collapsible sections |
| 4 | Save | SaveButton in page header persists changes via `PATCH /api/properties/:id` |

### PropertyEdit Page Sections

| Section | Fields Included |
|---------|----------------|
| **Property Identity** | Name, location, market, status, image |
| **Acquisition & Timing** | Purchase price, acquisition date, operations start date |
| **Capital Improvements** | Building improvements, pre-opening costs, operating reserve, land value % |
| **Revenue Assumptions** | Room count, start ADR, ADR growth rate, start/max occupancy, occupancy ramp months, catering boost % |
| **Revenue Shares** | Event revenue share, F&B revenue share, other revenue share (as % of room revenue) |
| **Operating Cost Rates** | Rooms, F&B, admin, marketing, property ops, utilities, insurance, taxes, IT, FF&E, other (each as % of total revenue) |
| **Financing** | Acquisition type (Full Equity / Leveraged), LTV, interest rate, term, closing cost rate |
| **Refinancing** | Will refinance (Yes/No), refinance date, refi LTV, refi interest rate, refi term, refi closing cost rate |
| **Exit** | Exit cap rate, tax rate |

Research badges (from AI market research) appear inline next to applicable fields, showing recommended ranges.

---

## Deleting a Property

| Step | Action | Detail |
|------|--------|--------|
| 1 | Navigate to Portfolio | Go to `/portfolio` |
| 2 | Click delete icon | On the property card → opens confirmation dialog (AlertDialog) |
| 3 | Confirm deletion | Property is permanently removed via `DELETE /api/properties/:id` |

**Cascading Effects of Deletion:**

| Impact Area | Effect |
|-------------|--------|
| Portfolio totals | Consolidated financials immediately exclude the deleted property |
| Management Company revenue | Fee revenue from the deleted property drops to zero; Management Company P&L recalculates |
| Dashboard KPIs | All portfolio metrics update to reflect the reduced property count |
| Investment analysis | IRR, equity multiple, and FCF recalculate without the deleted property |
| Scenarios | Saved scenarios retain their snapshot; only the active state is affected |

---

## Property Images

Properties support visual assets for display on property cards and detail pages:

| Image Source | Method | Storage |
|-------------|--------|---------|
| **URL** | Paste an external image URL into the Image URL field | Referenced directly; no upload |
| **Upload** | Use the PropertyImagePicker / ObjectUploader component to upload a file | Stored in Replit Object Storage; URL is persisted to the property record |
| **AI-Generated** | Use the image generation feature to create a property rendering | Generated image is stored in Object Storage |

Images appear on:
- Portfolio page property cards (thumbnail)
- Property Detail page (hero image)
- Property Edit page (editable)
- Exported reports (where supported)

---

## Recalculation Behavior

> **Critical:** Adding, editing, or removing properties triggers an **immediate, full recalculation** of all downstream financials.

| Trigger | Recalculation Scope |
|---------|-------------------|
| Add property | New property's pro forma is generated; consolidated totals include the new entity; Management Company fee revenue increases |
| Edit property assumptions | That property's pro forma regenerates; consolidated totals and Management Company revenue update accordingly |
| Delete property | Property excluded from all aggregations; Management Company fee revenue decreases; portfolio metrics contract |

This recalculation is **client-side and instantaneous** — there is no batch processing or queue.

> **Cross-reference:** See `formulas/company-financials.md` §1 for Management Company fee linkage and `formulas/consolidated.md` for portfolio aggregation formulas.

---

## Verification Notes for Checkers

| Check | What to Verify |
|-------|---------------|
| Add → recalculate | Add a new property → confirm Dashboard KPIs, consolidated statements, and Management Company fees all reflect the addition |
| Edit → recalculate | Change a single assumption (e.g., ADR) on one property → confirm only that property's financials change; consolidated totals update by the correct delta |
| Delete → recalculate | Remove a property → confirm its revenue/expenses are fully excluded from all consolidated views |
| Fee linkage | Property management fee expense must equal the Management Company's fee revenue from that property (to the penny) |
| Image persistence | Upload an image → save → reload page → confirm the image displays correctly |
| Default values | Add a property with minimal inputs → confirm all default assumptions are correctly applied per `shared/constants.ts` |
