# 10 — Scenario Management

> Scenario Management allows users to save, load, compare, and restore complete snapshots of the financial model's assumptions and property configurations. Accessible via **My Scenarios** in the sidebar navigation.

---

## Overview

A **scenario** is a named snapshot that captures the entire state of:
- All global assumptions (inflation, fee rates, debt terms, staffing, SAFE funding, etc.)
- All property configurations (room count, ADR, occupancy, cost rates, financing terms, etc.)
- Property portfolio composition (which properties exist and their parameters)

Scenarios enable side-by-side comparison of different investment strategies without losing prior work.

---

## Scenario Operations

| Operation | Description | Effect |
|-----------|-------------|--------|
| **Save** | Captures the current state of ALL global assumptions and property configurations as a named snapshot | Creates a new scenario record with a timestamp; does not modify the current working state |
| **Load** | Restores a previously saved scenario | Replaces ALL current assumptions and property configurations with the saved snapshot values |
| **Update** | Rename or change the description of an existing scenario | Metadata change only — does not alter the saved assumption data |
| **Delete** | Permanently remove a saved scenario | Irreversible — the scenario and all its saved data are deleted |
| **Export** | Download a scenario as a JSON file | Creates a portable backup that can be imported elsewhere |
| **Import** | Upload a previously exported JSON scenario | Creates a new scenario from the imported file |
| **Clone** | Duplicate an existing scenario with a new name | Creates an exact copy with " (Copy)" suffix |
| **Compare** | Side-by-side diff of two scenarios | Shows which assumptions and properties differ between the two snapshots |

---

## Save Behavior

When saving a scenario:

| Captured Data | Examples |
|--------------|---------|
| Global assumptions | Model start date, projection years, inflation rate, management fee rates, debt assumptions, staffing tiers, partner compensation, SAFE funding terms |
| Property configurations | Per-property: room count, ADR, growth rates, occupancy targets, ramp-up period, purchase price, improvements, cost rates, financing terms, refinance settings |
| Portfolio composition | Which properties are included and their operating parameters |
| Metadata | Scenario name, description, creation timestamp, last modified |

> **Important:** Scenarios capture a complete point-in-time snapshot. Loading a scenario **replaces** all current working data — the previous working state is lost unless it was saved as its own scenario first.

---

## Use Cases

| Use Case | Recommended Approach |
|----------|---------------------|
| Compare investment strategies | Save a "Base Case" scenario, then modify assumptions and save as "Aggressive Growth" — use Compare to see differences |
| Test sensitivity | Save current state as baseline, adjust one variable (e.g., ADR growth rate), observe impact, then reload baseline |
| Preserve baseline | Before any experimentation, always save the current state as "Baseline" or "Original" |
| Client presentations | Save scenarios representing different options (Conservative, Moderate, Aggressive) for investor review |
| Version history | Save periodically during model building to create a traceable history of assumption evolution |

---

## Scenario Comparison

The Compare feature shows a structured diff between two saved scenarios:

| Diff Type | Description |
|-----------|-------------|
| Assumption differences | Lists each global assumption that differs, showing the value in each scenario |
| Property changes | Shows properties that were added, removed, or modified between scenarios |
| Per-property field diffs | For modified properties, lists each field that changed with both values |

---

## Checker Guidelines for Scenario Management

### Before Testing
1. **Always save a baseline scenario** before beginning any verification session
2. Name it clearly (e.g., "Checker Baseline — 2026-02-09")
3. Include a description noting the purpose (e.g., "Pre-verification snapshot of production assumptions")

### During Testing
1. Create test scenarios for specific verification tasks:
   - "Zero Occupancy Test" — set all occupancies to 0 to verify expense floors
   - "Max Leverage Test" — set LTV to maximum to verify equity constraints
   - "No Refinance Test" — disable all refinancing to verify base case debt service
   - "Single Property Test" — remove all but one property to verify isolation

2. After each test, **reload the baseline** before starting the next test

### After Testing
1. Clean up test scenarios (delete temporary test snapshots)
2. Verify the baseline scenario still loads correctly
3. Confirm that loading a scenario fully replaces all assumptions (no stale data)

### Verification Checklist

| Check | Description |
|-------|-------------|
| ☐ | Save creates a new scenario with correct timestamp |
| ☐ | Load replaces ALL global assumptions (verify several fields) |
| ☐ | Load replaces ALL property configurations (verify several fields) |
| ☐ | Load replaces portfolio composition (correct property count) |
| ☐ | Update changes name/description without altering saved data |
| ☐ | Delete permanently removes the scenario |
| ☐ | Export downloads a valid JSON file |
| ☐ | Import creates a scenario from uploaded JSON |
| ☐ | Clone creates an exact copy with modified name |
| ☐ | Compare correctly identifies assumption differences |
| ☐ | Compare correctly identifies property additions/removals/changes |
| ☐ | Loading scenario A then scenario B yields different financial outputs |
| ☐ | Saving then immediately loading returns identical assumptions |
