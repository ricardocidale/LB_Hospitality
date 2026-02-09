# Fixed Assumptions (Not Configurable)

## Section ID: `fixed-assumptions`

## Content Summary
Two immutable constants built into the calculation engine. Rendered with `Callout severity="warning"`.

### Immutable Constants

| Constant | Value | Source | Rationale |
|----------|-------|--------|-----------|
| `DEPRECIATION_YEARS` | 27.5 years | IRS Publication 946 / ASC 360 | Tax law for residential rental property. Cannot be changed. |
| `DAYS_PER_MONTH` | 30.5 days | Industry standard (365 ÷ 12) | Hotel revenue calculation convention. |

### Now Configurable (Callout severity="success")
Parameters that were previously fixed but are now adjustable in Company Assumptions:
- Exit Cap Rate (default 8.5%)
- Tax Rate (default 25%)
- Sales Commission (default 5%)
- Loan terms (LTV, interest rate, amortization period)
- Revenue shares (events, F&B, other)

## In-App Guidance

Every input field in the application includes a **HelpTooltip** (? icon) that explains:
- What the field controls
- How it affects downstream calculations
- For GAAP-regulated values, the authoritative source and why it's fixed

Fields with AI market research data also show an amber/gold **ResearchBadge** displaying the recommended range. Click the badge to apply the AI-recommended midpoint value.

### GAAP-Standardized vs. Market-Variable

| Category | Examples | Variability |
|----------|----------|-------------|
| **GAAP/IRS Fixed** | Depreciation (27.5yr), Days/Month (30.5) | None — set by law/standard |
| **Market Convention** | Amortization (20–30yr), Closing Costs (1–3%), Broker Commission (4–6%) | Low — narrow industry range |
| **Market Variable** | ADR, Occupancy, Cap Rate, Catering Boost | High — requires local market research |

## Cross-References
- Constants: `.claude/rules/constants-and-config.md` → "Immutable Constants"
- GAAP: ASC 360 (depreciation), IRS Publication 946
- Research Badges: `.claude/skills/ui/research-badges.md`
- Auto-Refresh: `.claude/skills/research/auto-refresh/SKILL.md`
