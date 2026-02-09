# 07 — Financial Statements

> This section describes the financial statement reports produced for each entity in the Hospitality Business platform. All statements are generated at **monthly granularity** and displayed at **yearly granularity** in the UI. The checker should understand each statement's structure, line items, and applicable GAAP standards.

---

## Entity–Statement Matrix

| Entity | Income Statement | Cash Flow Statement | Balance Sheet | Investment Analysis |
|--------|:---:|:---:|:---:|:---:|
| Property SPV | ✓ | ✓ (ASC 230 indirect) | ✓ | ✓ |
| Management Company | ✓ | ✓ | ✓ | — |
| Consolidated Portfolio | ✓ (aggregated) | ✓ (aggregated) | ✓ (consolidated) | ✓ |

---

## Time Period Convention

| Aspect | Detail |
|--------|--------|
| Generation frequency | Monthly (120 months for 10-year projection) |
| Display granularity | Yearly (10 fiscal years) |
| Aggregation method | Sum for flow items (revenue, expenses); pick-last for stock items (ending cash, balances) |
| Fiscal year support | Configurable fiscal year start month (default: January) |

---

## 1. Property-Level Income Statement

The Income Statement follows the **USALI (Uniform System of Accounts for the Lodging Industry)** departmental structure, with below-the-line items added for financing and tax effects.

### Structure

| Section | Line Items | Formula Reference |
|---------|-----------|-------------------|
| **Revenue** | | `formulas/property-financials.md` §1 |
| | Room Revenue | Sold Rooms × ADR |
| | F&B Revenue | Room Revenue × F&B Revenue Share |
| | Events Revenue | Room Revenue × Events Revenue Share |
| | Other Revenue | Room Revenue × Other Revenue Share |
| | **Total Revenue** | Sum of all revenue streams |
| **Departmental Expenses** | | `formulas/property-financials.md` §2 |
| | Rooms Expense | Total Revenue × Cost Rate (Rooms) |
| | F&B Expense | Total Revenue × Cost Rate (F&B) |
| | Events Expense | Events Revenue × Event Expense Rate |
| | Other Expense | Other Revenue × Other Expense Rate |
| **Undistributed Operating Expenses** | | `formulas/property-financials.md` §2 |
| | Administrative & General | Total Revenue × Cost Rate (Admin) |
| | Marketing | Total Revenue × Cost Rate (Marketing) |
| | Property Operations & Maintenance | Total Revenue × Cost Rate (Property Ops) |
| | Utilities (Variable + Fixed) | Total Revenue × Cost Rate (Utilities) + Fixed |
| | IT & Telecom | Total Revenue × Cost Rate (IT) |
| **Fixed Charges** | | |
| | Insurance | Total Revenue × Cost Rate (Insurance) |
| | Property Taxes | Total Revenue × Cost Rate (Taxes) |
| | FF&E Reserve | Total Revenue × Cost Rate (FF&E) |
| **Management Fees** | | `formulas/company-financials.md` §1 |
| | Base Management Fee | Total Revenue × Base Mgmt Fee Rate |
| | Incentive Management Fee | max(0, GOP × Incentive Fee Rate) |
| **Profitability Metrics** | | `formulas/property-financials.md` §3 |
| | **Total Operating Expenses** | Sum of all expense categories |
| | **Gross Operating Profit (GOP)** | Total Revenue − Departmental & Undistributed Expenses |
| | **Net Operating Income (NOI)** | GOP − Fixed Charges − Management Fees |
| **Below-the-Line** | | `formulas/property-financials.md` §4 |
| | Interest Expense | From amortization schedule (ASC 470) |
| | Depreciation | Building Value ÷ 39 years (ASC 360) |
| | Income Tax | Taxable Income × Tax Rate |
| | **Net Income** | NOI − Interest − Depreciation − Tax |

---

## 2. Property-Level Cash Flow Statement (ASC 230 — Indirect Method)

The Cash Flow Statement reconciles Net Income to actual cash movement using the indirect method per ASC 230.

### Structure

| Section | Line Items | Formula Reference |
|---------|-----------|-------------------|
| **Cash from Operations (CFO)** | | `formulas/property-financials.md` §5 |
| | Total Revenue | All revenue streams |
| | Less: Operating Expenses (ex-FF&E) | All operating costs excluding FF&E reserve |
| | Less: Interest Expense | Per amortization schedule |
| | Less: Income Tax | Per tax calculation |
| | **Net CFO** | Revenue − OpEx − Interest − Tax |
| **Cash from Investing (CFI)** | | `formulas/property-financials.md` §6 |
| | Property Acquisition | (Year 0 only) Total Property Cost as outflow |
| | FF&E / Capital Expenditures | Annual FF&E reserve spending |
| | Exit / Sale Proceeds | (Terminal year only) Net disposition value |
| | **Net CFI** | −Acquisition − FF&E + Exit Proceeds |
| **Cash from Financing (CFF)** | | `formulas/funding-financing-refi.md` §1–3 |
| | Equity Contribution | (Year 0 only) Sponsor equity injection |
| | Loan Proceeds | (Year 0 only) Acquisition debt drawn |
| | Principal Repayment | Monthly principal portion of debt service |
| | Refinancing Net Proceeds | (Refi year only) New loan − old balance − costs |
| | **Net CFF** | Equity + Loan − Principal + Refi Proceeds |
| **Summary** | | |
| | **Net Change in Cash** | CFO + CFI + CFF |
| | Opening Cash Balance | Prior period ending cash |
| | **Closing Cash Balance** | Opening + Net Change |
| **Investment Metrics** | | `formulas/dcf-fcf-irr.md` §1–2 |
| | Free Cash Flow (FCF) | CFO − FF&E CapEx |
| | Free Cash Flow to Equity (FCFE) | FCF − Principal Repayment |

---

## 3. Property-Level Balance Sheet

The Balance Sheet presents a point-in-time snapshot of the property SPV's financial position at each year-end.

### Structure

| Section | Line Items | Notes |
|---------|-----------|-------|
| **Assets** | | |
| | Cash & Cash Equivalents | Closing cash from Cash Flow Statement |
| | Property (Gross) | Purchase Price + Building Improvements |
| | Less: Accumulated Depreciation | Cumulative depreciation (ASC 360) |
| | Property (Net) | Gross − Accumulated Depreciation |
| | **Total Assets** | Cash + Net Property |
| **Liabilities** | | |
| | Outstanding Loan Balance | Per amortization schedule (acquisition or refi) |
| | **Total Liabilities** | Outstanding loan balance |
| **Owners' Equity** | | |
| | Contributed Equity | Initial equity investment |
| | Retained Earnings | Cumulative net income + refi distributions |
| | **Total Equity** | Contributed + Retained |
| **Check** | **Total Assets = Total Liabilities + Total Equity** | Must balance every period |

---

## 4. Management Company Income Statement

The Management Company earns fees from managing the property portfolio and incurs its own operating costs.

### Structure

| Section | Line Items | Formula Reference |
|---------|-----------|-------------------|
| **Revenue** | | `formulas/company-financials.md` §1 |
| | Base Management Fees | Sum across all properties |
| | Incentive Management Fees | Sum across all properties |
| | **Total Fee Revenue** | Base + Incentive |
| **Operating Expenses** | | `formulas/company-financials.md` §2 |
| | Partner Compensation | Per-partner salary × partner count (by year) |
| | Staff Salaries | FTE count × salary (tiered by portfolio size) |
| | Office Lease | Fixed annual cost with escalation |
| | Professional Services | Legal, accounting, consulting |
| | Technology Infrastructure | Software, hosting, IT systems |
| | Business Insurance | Corporate insurance |
| | Travel | Per-property travel cost × property count |
| | IT Licenses | Per-property license cost × property count |
| | Marketing | Total Fee Revenue × Marketing Rate |
| | Miscellaneous Operations | Total Fee Revenue × Misc Ops Rate |
| | **Total Expenses** | Sum of all company operating costs |
| **Profitability** | | |
| | **Net Operating Income** | Total Fee Revenue − Total Expenses |
| | SAFE Dilution Payments | If applicable, based on SAFE funding terms |
| | **Net Income** | NOI − SAFE payments |

---

## 5. Management Company Cash Flow Statement & Balance Sheet

| Statement | Key Characteristics |
|-----------|-------------------|
| Cash Flow | Simplified: operating cash = Net Income (no depreciation or major non-cash items); financing cash includes SAFE tranche inflows |
| Balance Sheet | Assets = Cash; Liabilities = SAFE obligations; Equity = Retained Earnings |

---

## 6. Consolidated Portfolio Statements

Consolidated statements aggregate across all entities to present the total portfolio view.

| Statement | Aggregation Method | Notes |
|-----------|--------------------|-------|
| Aggregated Income Statement | Sum revenue and expenses across all properties | Eliminates inter-entity management fees (property expense = company revenue) |
| Aggregated Cash Flow | Sum CFO, CFI, CFF across all properties + Management Company | Shows total portfolio cash generation |
| Consolidated Balance Sheet | Sum assets, liabilities, equity across all entities | Inter-entity balances eliminated |

### Elimination Entries

Management fees are an **intra-group transaction** — they appear as expense on the property IS and revenue on the company IS. In consolidation, these are eliminated:

```
Consolidated Revenue = Σ Property Revenue  (management fees excluded)
                     + Σ External Company Revenue (if any)

Consolidated Expenses = Σ Property OpEx (ex-mgmt fees)
                      + Σ Company OpEx
```

---

## 7. Investment Analysis Metrics

These metrics evaluate return on invested capital across the projection period.

| Metric | Formula | Reference |
|--------|---------|-----------|
| Free Cash Flow (FCF) | CFO − FF&E Capital Expenditures | `formulas/dcf-fcf-irr.md` §1 |
| Free Cash Flow to Equity (FCFE) | FCF − Principal Repayment | `formulas/dcf-fcf-irr.md` §2 |
| Internal Rate of Return (IRR) | Discount rate where NPV of equity cash flows = 0 | `formulas/dcf-fcf-irr.md` §3 |
| Equity Multiple | Total Cash Distributions ÷ Total Equity Invested | `formulas/dcf-fcf-irr.md` §5 |

### IRR Cash Flow Series

The IRR is calculated on the following cash flow series:

| Year | Cash Flow Components |
|------|---------------------|
| Year 0 | −Equity Invested (negative, outflow) |
| Years 1–(N−1) | FCFE (operating cash after debt service) + Refi Proceeds (if any) |
| Year N (terminal) | FCFE + Net Exit Proceeds |

---

## GAAP Compliance Standards

### ASC 230 — Statement of Cash Flows

| Requirement | Implementation |
|-------------|---------------|
| Method | Indirect method (start from net income, adjust for non-cash items) |
| Three sections | Operating, Investing, Financing activities |
| Interest classification | Operating activity (per ASC 230-10-45-17) |
| Principal classification | Financing activity |
| Acquisition costs | Investing activity |
| Non-cash adjustment | Add back depreciation to operating cash flow |

### ASC 360 — Property, Plant, and Equipment

| Requirement | Implementation |
|-------------|---------------|
| Depreciable basis | Building value only (land excluded per IRS Pub 946) |
| Building value | Purchase Price × (1 − Land Value %) + Building Improvements |
| Useful life | 39 years (commercial real property, straight-line) |
| Annual depreciation | Building Value ÷ 39 |
| Accumulated depreciation | Cumulative sum of annual depreciation |

### ASC 470 — Debt

| Requirement | Implementation |
|-------------|---------------|
| Classification | Long-term liability on Balance Sheet |
| Interest | Expense on Income Statement |
| Principal | Cash Flow Statement only (financing activity) |
| Refinancing | Old debt derecognized, new debt recognized at fair value |
| Amortization | Standard mortgage amortization schedule |

### USALI — Uniform System of Accounts for the Lodging Industry

USALI provides the standard chart of accounts and departmental expense structure for the hospitality industry.

| USALI Concept | Platform Implementation |
|---------------|----------------------|
| Departmental revenue | Rooms, F&B, Events, Other — each tracked separately |
| Departmental expenses | Direct costs allocated by department (Rooms, F&B, Events) |
| Undistributed operating expenses | A&G, Marketing, Property Ops, Utilities, IT |
| Fixed charges | Insurance, Property Taxes, FF&E Reserve |
| Gross Operating Profit (GOP) | Revenue − Departmental − Undistributed expenses |
| Net Operating Income (NOI) | GOP − Fixed Charges − Management Fees |

> **Checker note:** Verify that the Income Statement line item order matches USALI standards. Departmental expenses should appear before undistributed expenses, followed by fixed charges, then management fees, then below-the-line items (interest, depreciation, tax).

---

## Checker Verification Summary

| Verification | What to Check | Reference |
|-------------|---------------|-----------|
| IS structure | Line items follow USALI order | This file |
| CF three-section split | CFO + CFI + CFF = Net Change | `formulas/property-financials.md` §5–6 |
| BS balance | Assets = Liabilities + Equity every year | `tools/balance-sheet-checks.json` |
| Fee linkage | Property fee expense = Company fee revenue | `tools/fee-linkage-checks.json` |
| Depreciation | Building Value ÷ 39, land excluded | `formulas/property-financials.md` §4 |
| Interest vs. Principal | Interest → IS, Principal → CFF only | ASC 470 |
| Consolidation eliminations | Mgmt fees eliminated in consolidated view | This file §6 |
| IRR inputs | Equity outflow Year 0, FCFE + exit Year N | `formulas/dcf-fcf-irr.md` §3 |
