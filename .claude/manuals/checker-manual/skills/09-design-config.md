# 09 — Design Configuration

> The platform uses a consistent design system across all pages. The checker should verify visual consistency and ensure that all components render correctly in both theme modes.

---

## Color Palette

| Color | Hex Code | Usage |
|-------|----------|-------|
| Sage Green | `#9FBCA4` | Primary brand color, buttons, active states, chart revenue lines |
| Secondary Green | `#257D41` | Accent highlights, success indicators |
| Warm Off-White | `#FFF9F5` | Light mode backgrounds, content areas |
| Coral Accent | `#E07A5F` | Alerts, FCFE chart lines, attention-drawing elements |
| Black | `#000000` | Text, dark mode elements |
| Dark Blue-Gray | Gradient | Navigation sidebar, glass-effect backgrounds |

---

## Typography

| Typeface | Style | Usage |
|----------|-------|-------|
| Playfair Display | Serif | Page headings, section titles, brand typography |
| Inter | Sans-serif | Body text, UI labels, data tables, form inputs, numerical values |

---

## Theme Modes

The application operates in two distinct visual themes depending on page context:

| Theme | Applied To | Characteristics |
|-------|-----------|----------------|
| **Dark Glass** | Main application pages (Dashboard, Property Detail, Portfolio, Company, Financing Analysis, Sensitivity Analysis, Investment Analysis) | Dark blue-gray gradient backgrounds; frosted glass (backdrop-blur) panels; white text; translucent borders; subtle top-edge highlight gradients |
| **Light** | Assumption/edit pages (Property Edit, Global Assumptions, Company Assumptions, Settings, Profile) | Warm off-white (`#FFF9F5`) backgrounds; dark text; clean borders; standard form styling |

---

## Component Library

The platform uses a consistent set of custom components. The checker should verify that each component renders correctly in its intended context.

| Component | Purpose | Theme Context |
|-----------|---------|--------------|
| `GlassButton` | Primary action buttons on dark backgrounds | Dark Glass — translucent with backdrop blur, white text, hover glow |
| `SaveButton` | Form submission / save actions | Light — solid button with loading state |
| `PageHeader` | Page title bar with optional subtitle and action buttons | Both — adapts to current theme |
| `StatCard` | KPI display cards showing key metrics (revenue, NOI, IRR, etc.) | Dark Glass — glass-effect card with icon, value, and label |
| `ContentPanel` | Section wrapper for grouping related content | Both — provides consistent padding, borders, and background |
| `FinancialChart` | Line/bar charts for financial data visualization | Both — see chart styling below |
| `FinancialTable` | Structured tabular display for financial statements | Both — alternating row styles, section headers, subtotals |
| `ExportMenu` | Dropdown button for export format selection | Both — glass variant on dark, light variant on edit pages |

---

## Chart Styling

All financial charts follow a consistent visual language:

| Element | Style |
|---------|-------|
| Background | White |
| Grid lines | Light gray, dashed |
| Revenue line | Green gradient (Sage Green) |
| GOP line | Blue gradient |
| FCFE line | Coral Accent (`#E07A5F`) |
| Data points | Visible dots on data lines |
| Axis labels | Inter font, gray text |
| Legend | Bottom or right-aligned, Inter font |
| Tooltip | Rounded card with value and label |

---

## Table Styling

Financial tables follow USALI-informed structure:

| Element | Style |
|---------|-------|
| Section headers | Bold, slightly larger font, distinct background |
| Subtotal rows | Bold text, top border separator |
| Grand total rows | Bold, heavier border, emphasized background |
| Data cells | Right-aligned numeric values, monospace-influenced formatting |
| Negative values | Displayed in parentheses: `($1,234)` |
| Row hover | Subtle background highlight |

---

## Navigation

| Element | Description |
|---------|-------------|
| Sidebar | Dark blue-gray gradient background; brand logo at top; navigation links with icons; active state highlighted with sage green accent |
| Breadcrumbs | Available on detail/edit pages for hierarchical navigation |
| Mobile responsive | Sidebar collapses to hamburger menu on smaller viewports |

---

## Checker Visual Consistency Checklist

| Check | Description |
|-------|-------------|
| ☐ | All dark-theme pages use consistent glass-effect backgrounds |
| ☐ | All light-theme pages use warm off-white backgrounds |
| ☐ | Headings use Playfair Display; data uses Inter |
| ☐ | Charts use correct color mapping (green=revenue, blue=GOP, coral=FCFE) |
| ☐ | StatCards display consistent formatting across Dashboard and detail pages |
| ☐ | ExportMenu renders correctly in both glass and light variants |
| ☐ | Financial tables follow consistent row styling and number formatting |
| ☐ | Negative values displayed in parentheses format |
| ☐ | Navigation sidebar shows correct active state highlighting |
| ☐ | All pages are responsive and readable on smaller screens |
| ☐ | Color palette matches the hex codes specified above |
| ☐ | No visual inconsistencies between pages using the same theme |
