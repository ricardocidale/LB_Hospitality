# Hospitality Business Group — Verification Manual

## About This Manual

This manual serves as the authoritative reference guide for verification officers and financial auditors tasked with validating the Hospitality Business Group Business Simulation Portal. It provides comprehensive guidance on the platform's financial modeling architecture, calculation methodologies, and the structured verification procedures required to certify the accuracy of all financial outputs.

The portal is a full-stack financial modeling platform built for a boutique hotel management company. It performs real-time financial simulation, multi-year projection, and scenario analysis across a portfolio of luxury boutique hotels in North America and Latin America. Every financial calculation in the system is deterministic — identical inputs always produce identical outputs — making systematic verification both feasible and essential.

## How to Use This Manual

Begin with Chapter 1 for a high-level understanding of the platform's purpose and architecture. Chapters 2 through 5 describe the entities, assumptions, and parameters that drive the financial model. Chapters 6 and 7 explain the cash flow mechanics and financial statement structures. Chapters 8 through 14 cover supporting features such as exports, design, scenarios, and property management. Chapter 15 — the Testing Methodology — is the core of this manual, defining the structured 7-phase verification workflow that every checker must follow.

The Glossary at the end of this manual provides definitions for all financial and operational terms used throughout the platform, organized by category for quick reference.

## Table of Contents

| Chapter | Title | Description |
|---------|-------|-------------|
| 1 | Application Overview | Platform purpose, two-entity architecture, navigation, and calculation principles |
| 2 | Management Company Entity | Fee revenue model, SAFE funding, expense structure, and financial statements |
| 3 | Property Portfolio | SPV structure, seed properties, acquisition types, refinancing, exit valuation, and investor returns |
| 4 | Global Assumptions | Systemwide parameters — inflation, fees, debt terms, staffing, SAFE funding, boutique definition |
| 5 | Property-Level Assumptions | Per-property overrides — revenue drivers, cost rates, financing, exit terms, and the fallback chain |
| 6 | Cash Flow Streams | The six cash flow streams per SPV — equity, debt, refinancing, exit, management fees, and operations |
| 7 | Financial Statements | Income Statement, Cash Flow Statement, Balance Sheet, and Investment Analysis for each entity |
| 8 | Export System | Six export formats, verification workflows, and the Full Data Export |
| 9 | Design Configuration | Color palette, typography, theme modes, chart and table styling |
| 10 | Scenario Management | Save, load, compare, and stress-test model snapshots |
| 11 | User Profile | Account management, password changes, and role-based access |
| 12 | Dashboard & Portfolio KPIs | Consolidated financial views, KPI cards, charts, and data flow |
| 13 | AI Research & Assumption Calibration | Market research tools, output schemas, and research-to-assumption integration |
| 14 | Property Management | Adding, editing, and deleting properties — recalculation behavior and cascading effects |
| 15 | Testing Methodology | The 7-phase verification workflow — the core of this manual |

## The 7-Phase Verification Workflow

The verification process is organized into seven sequential phases, each building on the results of the previous:

1. **Phase 1 — Input Verification.** Confirm that all default assumption values are correct, and that key performance metrics fall within USALI benchmark ranges for boutique hospitality properties.

2. **Phase 2 — Calculation Verification.** Cross-validate revenue, cost, and fee formulas by independently hand-calculating results and comparing them against the platform's outputs.

3. **Phase 3 — Financial Statement Reconciliation.** Verify that the balance sheet equation holds (Assets = Liabilities + Equity), that cash flow statements reconcile per ASC 230, and that income statement figures flow correctly to downstream statements.

4. **Phase 4 — IRR / DCF / FCF Verification.** Validate investment return analytics — confirm that NPV equals approximately zero at the calculated IRR, verify free cash flow derivations, and check terminal value calculations.

5. **Phase 5 — Scenario & Stress Testing.** Test edge cases, boundary conditions, and extreme configurations. Create saved scenarios to systematically compare results across different assumption sets.

6. **Phase 6 — Reports & Exports Completeness.** Verify that all export formats generate correctly, that exported values match on-screen displays, and that charts render properly.

7. **Phase 7 — Documentation & Sign-Off.** Issue a formal audit opinion (Unqualified, Qualified, or Adverse), complete the final verification checklist, and sign off on the engagement.

## Additional Resources

- **Glossary:** A comprehensive reference of all financial and operational terms used in the platform, organized by category.
- **Formulas:** All financial formulas are presented naturally within their respective chapters, with particular depth in Chapters 5, 6, and 7.
- **Verification Checklists:** Each chapter concludes with specific verification points for the checker to validate.

## In-App Access

This manual is rendered within the application at the Checker Manual page, accessible to users with the checker or admin role. The in-app version includes a collapsible table of contents, PDF export of the manual, and a Full Data Export function that produces a comprehensive PDF of all assumptions, statements, and configuration data for offline review.
