# HBG Product Vision

Where the HBG Portal product is heading and the design principles that must govern all future work. Covers product identity, core design tenets, workflow principles, navigation architecture, user roles, white-labeling, active roadmap themes, future direction, and the cross-skill reference map. Use this skill when planning new features, making architectural decisions, or evaluating whether proposed work aligns with the product direction.

**Related skills:** `business-model/` (domain model), `finance/` (calculation contracts), `proof-system/` (audit system), `design-system/` (visual identity), `integrations/` (services), `marcela-ai/` (AI agent), `architecture/` (server architecture)

---

## Product Identity

> **HBG Portal is a "Bloomberg Terminal for boutique hospitality."**

It must feel like an indispensable institutional tool that hospitality investment professionals trust for decision-making. Every screen, interaction, and data point should convey:
- **Precision** — numbers are exact, formulas are transparent
- **Authority** — the tool knows hospitality finance deeply
- **Professional elegance** — it belongs in an investment committee presentation
- **Trustworthiness** — verification and audit opinions build institutional confidence

---

## Core Design Tenets

Every piece of future work must satisfy these five tenets:

### 1. Deterministic Integrity
Every number must be traceable to a formula, never approximated by AI. The financial engine is the sole source of truth for calculations. AI agents assist with research and narration but never compute financial values.

### 2. Transparency
Users can always see how any number was derived:
- **Formula accordions** — expand to see the calculation behind a metric
- **GAAP badges** — indicate which accounting standard applies
- **Audit opinions** — formal verification of projection accuracy
- **Research sourcing** — benchmarks show where data came from

### 3. Professional Elegance
Every screen should look like it belongs in an investment committee presentation:
- Swiss Modernist design language (see `design-system/` skill)
- High data density without clutter
- Monospaced financial figures for alignment
- Earth-tone warmth over cold corporate sterility

### 4. Hospitality-Native Vocabulary
Use the language of hotel operators and investors, never generic software terms:
- "Properties" not "items", "ADR" not "average price", "GOP" not "gross margin"
- See the vocabulary tables in `business-model/` and `design-system/` skills

### 5. Progressive Disclosure
Show summary first, let users drill into detail on demand:
- KPI cards → expandable sections → full financial tables
- Tooltips for contextual education without cluttering the main view
- Collapsible `SectionCard` components for optional detail

---

## Workflow Design Principles

### Minimize Navigation
Bring tools to the user's current context rather than sending them to separate pages:
- Inline research buttons next to property inputs
- "Apply Research" dialogs that overlay the current form
- Formula accordions that expand in-place
- Modal-based actions for quick operations

### Research Should Inform, Not Dictate
AI benchmarks appear as **suggestions** (yellow pills next to input fields) that users can:
- **Accept** — apply the research value to the assumption
- **Modify** — use the benchmark as a starting point, adjust manually
- **Ignore** — keep the current value unchanged

Research never auto-applies without explicit user consent.

### Verification Should Build Confidence
The audit opinion system exists to give users institutional-grade trust:
- Run verification with one click
- See a formal audit opinion (Unqualified/Qualified/Adverse)
- Drill into individual check results
- Marcela narrates findings in professional language

### Scenarios Should Be Effortless
- **Save** current state as a named snapshot with one action
- **Load** to compare — replace all assumptions and recalculate
- **Compare** side-by-side with the base case
- **Never lose the base case** — it's always preserved

---

## Navigation & Information Architecture

### Main Navigation

| Group | Items | Description |
|-------|-------|-------------|
| **Home** | Dashboard, Properties, Management Company | Core portfolio views |
| **Tools** | Simulation, Property Finder, Map View | Analysis and acquisition tools |
| **Settings** | Profile, Scenarios, General Settings | User configuration |
| **Footer** | Tour, Help, Admin, Sign Out | Utility actions |

### Admin Navigation
Admin has its own sidebar with sections:
- **Brand** — Theme, logo, white-labeling
- **Business** — Company settings, user management
- **Research** — Research configuration, ICP management
- **Design** — Theme presets, custom CSS
- **AI Agents** — Marcela/Rebecca configuration, voice settings, KB management
- **System** — Database tools, integration status, logs
- **Logs** — Application logs, error tracking

---

## User Roles

| Role | What They See | Key Capabilities |
|------|--------------|-----------------|
| **Admin** | Everything + admin panel | Full CRUD, user management, system configuration |
| **Partner** | Full investment toolkit | Edit assumptions, create scenarios, run research |
| **Checker** | Read-only + verification tools | Run verification, view audit opinions, export reports |
| **Investor** | Dashboard + filtered properties | View-only dashboard, properties filtered by user group |

---

## White-Labeling & Multi-Tenancy

Each user group can have custom branding:
- **Logo** — custom logo displayed in sidebar and exports
- **Theme** — custom color theme applied to the entire UI
- **Asset descriptions** — custom text used as AI context for research

### Theme Resolution Cascade
```
User's selected theme → Group's assigned theme → System default (Tuscan Olive Grove)
```

This enables multiple investment groups to use the same portal with their own branding, each seeing only their assigned properties.

---

## Roadmap

Current priorities and in-flight work are tracked in the project task system. Consult the active task list for the latest roadmap themes and their status rather than relying on a static list here.

---

## Future Direction

| Area | Direction |
|------|-----------|
| **Document Intelligence** | Enhanced automated data extraction from financial documents |
| **Scenario Comparison** | Richer side-by-side tools with sensitivity visualization |
| **Export Formats** | Expanded format support and template customization |
| **Role-Based Access** | More granular permissions (per-property access, per-feature access) |
| **Mobile** | Enhanced mobile experience for on-the-go portfolio monitoring |

---

## Quality Bar

Every new page or feature must follow these established patterns:

| Requirement | Reference Skill |
|------------|----------------|
| Width conventions | `ui/consistent-card-widths.md` |
| Save button patterns | `ui/save-button-placement.md` |
| Export patterns | `exports/` |
| Design system components | `design-export/` |
| Visual identity | `design-system/` |
| Business vocabulary | `business-model/` |
| Financial accuracy | `finance/` |
| Verification compatibility | `proof-system/` |

---

## Cross-Skill Reference Map

How all skills connect to each other:

```
                    ┌─────────────────────┐
                    │  product-vision     │
                    │   (this skill)       │
                    └─────────┬───────────┘
                              │ governs all
          ┌───────────────────┼───────────────────┐
          │                   │                   │
    ┌─────┴──────┐   ┌───────┴────────┐   ┌──────┴───────┐
    │  business- │   │  design-       │   │  architecture│
    │  model     │   │  system        │   │              │
    └─────┬──────┘   └───────┬────────┘   └──────┬───────┘
          │ defines          │ styles            │ serves
    ┌─────┴──────┐   ┌───────┴────────┐   ┌──────┴───────┐
    │  finance   │   │  ui/           │   │ integrations │
    │            │   │  card-widths   │   │              │
    └─────┬──────┘   │  save-buttons  │   └──────┬───────┘
          │           │  design-export │          │
          │ verified  │  exports       │          │ powers
          │ by        └───────────────┘          │
    ┌─────┴──────┐                        ┌──────┴───────┐
    │  proof-    │                        │  marcela-ai  │
    │  system    │                        │              │
    └────────────┘                        └──────────────┘
```

### Connections Summary
| Skill | Connects To | Relationship |
|-------|------------|-------------|
| `business-model` | `finance` | Business rules → engine contracts |
| `business-model` | `design-system` | Vocabulary → UI labels |
| `finance` | `proof-system` | Engine output → verification input |
| `finance` | `architecture` | Dual-engine architecture |
| `proof-system` | `marcela-ai` | Verification results → AI narration |
| `integrations` | `marcela-ai` | AI providers → Marcela |
| `integrations` | `architecture` | Services → route handlers |
| `design-system` | `ui/consistent-card-widths` | Layout system |
| `design-system` | `ui/save-button-placement` | Form patterns |
| `design-system` | `design-export` | Component library |
| `design-system` | `exports` | Chart → export styling |
| `product-vision` | All skills | Strategic alignment |
