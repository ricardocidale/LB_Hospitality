---
name: verification-system
description: The three-tier financial verification and audit opinion system. Covers the independent server-side calculation checker, property/company/consolidated verification tiers, GAAP compliance checks, audit opinions, workpaper generation, and the AI review panel. Use this skill when working on verification, audit, financial validation, or checker-related features.
---

# Verification System

This skill documents the independent verification system that validates the financial engine's output. It provides institutional-grade confidence in projections through a three-tier checking architecture and formal audit opinions.

**Related skills:** `financial-engine` (what gets verified), `hbg-business-model` (business rules being checked), `marcela-ai-system` (AI narration of results), `api-backend-contract` (verification API endpoints), `hbg-product-vision` (why verification matters)

---

## Architecture: Independent "Second Look"

The verification system is a **completely independent** calculation engine on the server that:

1. Recalculates the entire financial model from raw assumptions
2. Compares its results against the client-side engine's output
3. Issues a formal audit opinion based on the comparison

**Critical design principle:** The server checker (`server/calculation-checker/`) **never shares code** with the client engines (`client/src/lib/financial/`). This independence is what makes the verification meaningful — if two independently coded engines produce the same results, the projections can be trusted.

---

## Three-Tier Verification

### Tier 1: Property-Level Verification
Independently calculates every monthly line item for each property:

| Check Category | What Is Verified | GAAP Reference |
|---------------|-----------------|----------------|
| Room Revenue | `roomCount × ADR × occupancy × 30.5 days` | ASC 606 |
| Events Revenue | `roomRevenue × eventsShare` | ASC 606 |
| Total Revenue | Sum of all revenue streams | ASC 606 |
| GOP | `Revenue − Operating Expenses` | USALI |
| AGOP | `GOP − Base Fee − Incentive Fee` | USALI |
| NOI | `AGOP − Property Taxes` | USALI |
| ANOI | `NOI − FF&E Reserve` | USALI |
| Net Income | `ANOI − Interest − Depreciation − Tax` | ASC 470 / ASC 360 |
| Depreciation | Land excluded from basis; 27.5yr straight-line | ASC 360 / IRS Pub 946 |
| Debt Service | PMT formula verification | ASC 470 |
| Interest + Principal = Payment | Amortization identity | ASC 470 |
| Cash Flow | `ANOI − Debt Service − Tax` | ASC 230 |
| Operating CF | `Net Income + Depreciation` (indirect method) | ASC 230 |
| Financing CF | `−Principal Payment` | ASC 230 |
| Balance Sheet A=L+E | Assets = Liabilities + Equity for every month | ASC 210 |
| Cumulative Cash | Sum of monthly cash flows + reserve = ending cash | ASC 230 |
| Pre-Ops Revenue = $0 | No revenue before operations start | ASC 606 |
| Working Capital AR/AP | Accounts receivable and payable tracking | ASC 310 / ASC 405 |
| NOL Carryforward | 80% utilization cap applied | IRC §172 |
| Cost Segregation | Accelerated depreciation > standard straight-line | IRS Pub 946 |

### Tier 2: Company-Level Verification
Verifies management company calculations across the portfolio:

- Management fee roll-up from all properties
- Staffing tier determination by active property count
- Fixed overhead escalation
- SAFE tranche timing and interest accrual
- ManCo cash flow and shortfall detection
- Partner compensation schedule

### Tier 3: Consolidated Verification
Portfolio-wide and intercompany checks:

- **Intercompany elimination** (ASC 810): Fees paid by properties = Fees received by ManCo
- **Aggregated totals**: Portfolio revenue = Σ property revenues
- **Cross-calculator validation**: Client-side vs server-side year-by-year comparison for revenue, NOI, net income, cash flow
- Revenue growth rate consistency (CAGR vs ADR growth)
- NOI margin reasonableness (5–60% range)
- DSCR reasonableness (> 1.0x)
- No negative cash balance detection

---

## Verification Pipeline

```
1. FORMULA CHECKER (Mathematical Identities)
   - Revenue sum = component sum
   - GOP = Revenue − Expenses
   - Interest + Principal = Total Payment
   - A = L + E

2. GAAP COMPLIANCE (Accounting Rules)
   - Principal excluded from Net Income (ASC 470)
   - Land excluded from depreciation basis (ASC 360)
   - Revenue = $0 before operations start (ASC 606)
   - Cash flow classified correctly (ASC 230)

3. FULL AUDITOR (Independent Recalculation)
   - Server independently computes every monthly line item
   - Compares against client-side engine output
   - Cross-validates Year 1, mid-projection, and final year

4. CROSS-CALCULATOR VALIDATION
   - IRS/GAAP authoritative formulas as ground truth
   - PMT formula verification
   - Depreciation basis verification
   - Tax with NOL carryforward verification
```

---

## Audit Opinions

The system issues one of four formal audit opinions, modeled after the professional auditing standards:

| Opinion | Criteria | Meaning |
|---------|----------|---------|
| **UNQUALIFIED** | Zero critical issues, zero material issues | Clean opinion — "presents fairly in all material respects" |
| **QUALIFIED** | Zero critical issues, one or more material issues | Mostly reliable but with minor exceptions noted |
| **ADVERSE** | One or more critical issues | Significant issues — "cannot be relied upon for decision-making" |
| **DISCLAIMER** | Unable to complete audit | Insufficient data or system error prevented verification |

### Severity Levels
| Level | Definition | Impact on Opinion |
|-------|-----------|-------------------|
| **Critical** | Core financial identity violation (revenue formula, A=L+E, cash reconciliation) | Any critical failure → ADVERSE |
| **Material** | Significant but non-core discrepancy (growth rate, margin reasonableness) | Material failures → QUALIFIED |
| **Info** | Informational observation (NOL balance, cost seg comparison) | No impact on opinion |

---

## GAAP Standard References

| Standard | Topic | How It's Used |
|----------|-------|--------------|
| **ASC 210** | Balance Sheet Presentation | A = L + E identity check |
| **ASC 230** | Statement of Cash Flows | Indirect method: OCF = NI + Depreciation |
| **ASC 310** | Receivables | Accounts receivable tracking |
| **ASC 360** | Property, Plant & Equipment | Depreciation basis (land excluded) |
| **ASC 405** | Liabilities | Accounts payable tracking |
| **ASC 470** | Debt | Loan amortization, interest vs principal |
| **ASC 606** | Revenue Recognition | Revenue timing (after operations start) |
| **ASC 810** | Consolidation | Intercompany fee elimination |
| **IRC §172** | Net Operating Losses | 80% utilization cap on NOL carryforward |
| **IRS Pub 946** | Depreciation | 27.5yr residential rental; cost segregation |

---

## AI Review Panel (Marcela)

After verification completes, Marcela (the AI financial advisor) can narrate the results:
- Reads the verification report with pass/fail counts
- Provides professional audit commentary in plain language
- Highlights critical issues requiring attention
- Recommends specific fixes for failed checks
- Uses hospitality-appropriate terminology (see `hbg-design-philosophy` skill)

---

## Automated Workpaper Generation

The system generates formatted "Independent Auditor's Report" documents:
- Title: "Independent Verification Report"
- Date/timestamp of verification run
- Properties checked count
- Per-property check results with pass/fail status
- Company-level check results
- Consolidated check results
- Summary: total checks, passed, failed, critical issues, material issues
- Audit opinion with supporting rationale
- Variance analysis for failed checks (expected vs actual values)

---

## Verification Thresholds

| Constant | Value | Purpose |
|----------|-------|---------|
| `AUDIT_VARIANCE_TOLERANCE` | 0.001 (0.1%) | Percentage tolerance for rounding differences |
| `AUDIT_DOLLAR_TOLERANCE` | $1 | Absolute dollar tolerance |
| `AUDIT_VERIFICATION_WINDOW_MONTHS` | 24 | Months of data checked in cross-validation |
| `AUDIT_CRITICAL_ISSUE_THRESHOLD` | 3 | Critical issues triggering enhanced review |

---

## Key Files

| File | Purpose |
|------|---------|
| `server/calculation-checker/index.ts` | Main verification orchestrator |
| `server/calculation-checker/property-checks.ts` | Independent property calculation + checks |
| `server/calculation-checker/portfolio-checks.ts` | Company + consolidated checks |
| `server/calculation-checker/gaap-checks.ts` | GAAP compliance check helpers |
| `server/calculation-checker/helpers/` | Aggregation and cross-validation utilities |
| `server/calculation-checker/types.ts` | VerificationReport, CheckResult, AuditOpinion types |
| `client/src/lib/financialAuditor.ts` | Client-side audit opinion formatting |
| `client/src/lib/runVerification.ts` | Client-side verification trigger |
| `client/src/lib/constants.ts` | Verification thresholds (tolerances) |
| `calc/validation/` | Additional validation calculators |
