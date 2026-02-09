# 06 — Cash Flow Streams (Property SPV)

> **This is the MOST IMPORTANT section of the checker manual.** Every property SPV generates multiple interacting cash flow streams that must reconcile across Income Statement, Balance Sheet, and Cash Flow Statement. Understanding these streams — and where they land in each financial statement — is essential for verification.

---

## Overview: Six Cash Flow Streams

Each property Special Purpose Vehicle (SPV) produces the following cash flow streams over the projection period:

| Stream | Direction | Timing | Statement Impact |
|--------|-----------|--------|-----------------|
| A. Equity Injection | Inflow | Year 0 (acquisition) | CFF — Cash from Financing |
| B. Acquisition Debt | Inflow (proceeds) / Outflow (service) | Year 0 proceeds; monthly service | CFF (proceeds & principal); IS (interest) |
| C. Refinancing | Inflow (net proceeds) / Outflow (new service) | Post-stabilization | CFF (proceeds & principal); IS (interest) |
| D. Exit / Disposition | Inflow (net sale proceeds) | Terminal year | CFI — Cash from Investing |
| E. Management Fees | Outflow from property | Monthly | IS (operating expense) |
| F. Operating Cash Flow | Net of operations | Monthly | CFO — Cash from Operations |

---

## A. Cash Injections (Equity)

The equity contribution represents the sponsor's initial capital commitment to acquire and prepare the property for operations.

### Total Property Cost Composition

| Component | Description |
|-----------|-------------|
| Purchase Price | Contracted acquisition price of the real property |
| Building Improvements | Capital expenditures for renovation / repositioning |
| Pre-Opening Costs | Staff training, marketing, soft opening expenses |
| Operating Reserve | Working capital cushion (typically 3–6 months of operating expenses) |
| Closing Costs | Loan origination, title, legal, and transaction fees |

**Formula:** _(see `formulas/funding-financing-refi.md` §1)_

```
Total Property Cost = Purchase Price + Building Improvements + Pre-Opening Costs
                    + Operating Reserve + Closing Costs
```

### Equity Investment

```
Equity Invested = Total Property Cost − Loan Amount
```

- Appears as a **positive inflow** in Year 0 under **Cash from Financing (CFF)**.
- Recorded on the Balance Sheet as contributed equity (owners' equity).
- Closing Costs on the loan = Loan Amount × Acquisition Closing Cost Rate.

---

## B. Acquisition Financing (Debt)

Acquisition debt is constrained by the Loan-to-Value (LTV) ratio applied to the purchase price.

### Loan Sizing

| Parameter | Formula / Source |
|-----------|-----------------|
| Loan Amount | `Purchase Price × LTV` |
| Monthly Interest Rate | `Annual Interest Rate / 12` |
| Total Payments | `Amortization Term (years) × 12` |
| Monthly Payment (P&I) | Standard PMT formula _(see `formulas/funding-financing-refi.md` §2)_ |

**PMT Formula:**

```
PMT = Loan Amount × [ r × (1 + r)^n ] / [ (1 + r)^n − 1 ]
```

Where `r` = monthly interest rate, `n` = total number of monthly payments.

### GAAP Treatment (ASC 470 — Debt)

| Component | Financial Statement | Line Item |
|-----------|-------------------|-----------|
| Interest expense | Income Statement | Below GOP, above Net Income |
| Principal repayment | Cash Flow Statement only | CFF — principal payment (outflow) |
| Loan proceeds (Year 0) | Cash Flow Statement | CFF — loan proceeds (inflow) |
| Outstanding balance | Balance Sheet | Long-term liabilities |

> **Key rule:** Principal repayment is **never** an expense on the Income Statement. It reduces the liability on the Balance Sheet and appears only in Cash from Financing. This is per ASC 470 debt classification.

### Amortization Schedule

Each monthly payment is split between interest and principal:

```
Interest_m   = Outstanding Balance_{m-1} × Monthly Rate
Principal_m  = Monthly Payment − Interest_m
Balance_m    = Balance_{m-1} − Principal_m
```

Interest declines over time; principal increases — standard amortization behavior.

---

## C. Refinancing Post-Stabilization

### What Is Stabilization?

**Stabilization** is the point at which a property reaches its target (mature) occupancy level after the initial ramp-up period following acquisition or renovation. The ramp-up period is typically **12–24 months**, during which occupancy grows incrementally from an initial rate toward the maximum sustainable occupancy.

| Term | Definition |
|------|-----------|
| Ramp-Up Period | Number of months from operations start to stabilized occupancy |
| Stabilized Occupancy | Target occupancy rate the property can sustain at maturity |
| Stabilized NOI | Net Operating Income at stabilized occupancy (annualized) |

### Why Refinance?

Once stabilized, the property's demonstrated income stream supports a higher appraised value, enabling:
- A larger loan based on the improved valuation
- Potentially better interest rates (lower risk profile)
- Equity recapture — returning invested capital to sponsors

### Refinance Loan Sizing

_(see `formulas/funding-financing-refi.md` §3)_

```
Implied Property Value  = Stabilized NOI / Exit Cap Rate
Refi Loan Amount        = Implied Property Value × Refi LTV
```

### Refinance Proceeds

```
Refi Proceeds = New Loan Amount − Old Outstanding Balance − Refi Closing Costs
```

Where:
- `Refi Closing Costs = New Loan Amount × Refi Closing Cost Rate`
- If Refi Proceeds > 0, excess is distributed to equity investors via CFF
- New debt service (PMT on new loan) **replaces** old debt service from the refinance month forward

### Statement Impact

| Event | Statement | Treatment |
|-------|-----------|-----------|
| New loan proceeds | CFF | Inflow |
| Payoff of old loan | CFF | Outflow (nets against proceeds) |
| Refi closing costs | CFF | Outflow |
| Net refi proceeds | CFF | Net inflow distributed to equity |
| New monthly interest | IS | Expense (replaces old interest from refi month) |
| New monthly principal | CFF | Outflow (replaces old principal from refi month) |

---

## D. Exit Proceeds (Cap Rate Valuation)

At the end of the projection period (typically Year 10), the property is valued and sold using direct capitalization.

### Terminal Valuation

_(see `formulas/dcf-fcf-irr.md` §4)_

```
Gross Disposition Value = Terminal Year NOI / Exit Cap Rate
```

### Net Proceeds Waterfall

| Step | Calculation |
|------|------------|
| Gross Value | Terminal Year NOI ÷ Exit Cap Rate |
| Less: Sales Commission | Gross Value × Sales Commission Rate |
| Less: Outstanding Debt | Remaining loan balance at exit |
| **Net Proceeds to Equity** | **Gross Value − Commission − Outstanding Debt** |

- Exit proceeds appear as a **positive inflow** under **Cash from Investing (CFI)** in the terminal year.
- **Mandatory Business Rule #4** requires all outstanding debt to be fully repaid at disposition.

---

## E. Management Fee Linkage

Management fees create a **dual-entity cash flow** — they are an expense at the property level and revenue at the Management Company level.

### Fee Calculations

_(see `formulas/company-financials.md` §1)_

| Fee Type | Formula | Basis |
|----------|---------|-------|
| Base Management Fee | `Total Property Revenue × Base Mgmt Fee Rate` | Gross revenue (all streams) |
| Incentive Management Fee | `max(0, GOP × Incentive Mgmt Fee Rate)` | Gross Operating Profit only if positive |

### Dual-Entity Treatment

| Entity | Statement | Classification |
|--------|-----------|---------------|
| Property SPV | Income Statement | Operating expense (below departmental expenses, above NOI) |
| Management Company | Income Statement | Fee revenue (top line) |

> **Checker note:** The sum of all Base Fees + Incentive Fees across all properties must equal the Management Company's total fee revenue. Any mismatch is a reconciliation error. See `tools/fee-linkage-checks.json`.

---

## F. Operating Cash Flow

Operating cash flow represents the net cash generated by the property's core hospitality operations after servicing debt and paying taxes.

### Calculation

_(see `formulas/property-financials.md` §5)_

```
Operating Cash Flow = NOI − Debt Service − Income Tax
```

Where:
- **NOI** = Total Revenue − Total Operating Expenses (including management fees)
- **Debt Service** = Interest + Principal (total monthly payment × 12 for annual)
- **Income Tax** = Taxable Income × Tax Rate
- **Taxable Income** = NOI − Interest Expense − Depreciation

### Running Cash Balance

```
Ending Cash_y = Opening Cash_y + Operating Cash Flow_y + Financing Cash Flow_y
```

> **Mandatory Business Rule #3:** The running cash balance must **never go negative** in any period. A negative balance indicates the property cannot meet its obligations and the model assumptions must be revised.

---

## Cash Flow Interaction Diagram

The following diagram shows how all six streams interact within the ASC 230 Cash Flow Statement framework:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PROPERTY SPV CASH FLOWS                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────┐                       │
│  │  CASH FROM OPERATIONS (CFO)              │                       │
│  │  ├─ (+) Total Revenue                    │                       │
│  │  │    ├─ Room Revenue                    │                       │
│  │  │    ├─ F&B Revenue                     │                       │
│  │  │    ├─ Events Revenue                  │                       │
│  │  │    └─ Other Revenue                   │                       │
│  │  ├─ (−) Operating Expenses (ex-FF&E)     │                       │
│  │  ├─ (−) Management Fees ──────────────────── → Mgmt Co Revenue  │
│  │  ├─ (−) Interest Expense (ASC 470)       │                       │
│  │  └─ (−) Income Tax                       │                       │
│  └──────────────────────────────────────────┘                       │
│                        │                                            │
│  ┌──────────────────────────────────────────┐                       │
│  │  CASH FROM INVESTING (CFI)               │                       │
│  │  ├─ (−) Property Acquisition (Year 0)    │                       │
│  │  ├─ (−) FF&E / CapEx (annual reserve)    │                       │
│  │  └─ (+) Exit / Sale Proceeds (terminal)  │                       │
│  └──────────────────────────────────────────┘                       │
│                        │                                            │
│  ┌──────────────────────────────────────────┐                       │
│  │  CASH FROM FINANCING (CFF)               │                       │
│  │  ├─ (+) Equity Injection (Year 0)        │                       │
│  │  ├─ (+) Loan Proceeds (Year 0)           │                       │
│  │  ├─ (−) Principal Repayment (monthly)    │                       │
│  │  └─ (+) Refinance Net Proceeds           │                       │
│  └──────────────────────────────────────────┘                       │
│                        │                                            │
│                        ▼                                            │
│  ┌──────────────────────────────────────────┐                       │
│  │  NET CHANGE IN CASH = CFO + CFI + CFF    │                       │
│  │  Opening Cash + Net Change = Closing Cash│                       │
│  └──────────────────────────────────────────┘                       │
│                                                                     │
│  ┌──────────────────────────────────────────┐                       │
│  │  INVESTMENT METRICS                      │                       │
│  │  FCF  = CFO − FF&E CapEx                 │                       │
│  │  FCFE = FCF − Principal Repayment        │                       │
│  └──────────────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## The 5 Mandatory Business Rules

These rules act as **hard constraints** on the financial model. Any violation indicates invalid assumptions or a calculation error.

| # | Rule | Description | Where Enforced |
|---|------|-------------|----------------|
| 1 | **Equity ≥ 0** | Equity invested must be non-negative. If Loan Amount > Total Property Cost, the model is over-leveraged. | Acquisition sizing |
| 2 | **DSCR Floor** | Debt Service Coverage Ratio (NOI / Debt Service) must meet lender minimum (typically ≥ 1.20×). While not a hard block in the model, the checker should flag properties below this threshold. | Financing analysis |
| 3 | **Cash Never Negative** | The running cash balance must never go negative in any month or year. A negative balance means the property cannot meet obligations. | Monthly & yearly cash flow |
| 4 | **Debt Repaid at Exit** | All outstanding debt (acquisition or refinanced) must be fully repaid from disposition proceeds before equity distributions. | Exit waterfall |
| 5 | **Balance Sheet Must Balance** | Total Assets = Total Liabilities + Owners' Equity in every period. Any imbalance signals a posting or rounding error. | Balance Sheet reconciliation |

### How Rules Constrain Cash Flows

- **Rule 1** limits maximum leverage — if LTV is set too high relative to non-purchase costs, the model must reject or adjust.
- **Rule 2** ensures debt service is supportable by property income — the checker should calculate DSCR independently using `formulas/funding-financing-refi.md` §4.
- **Rule 3** propagates through the entire projection — if any month produces a negative ending cash position, upstream assumptions (occupancy ramp, ADR, expense ratios) must be revisited.
- **Rule 4** means exit proceeds are not "free money" — the outstanding loan balance at terminal year is deducted before equity receives any residual value.
- **Rule 5** is the master reconciliation check — see `tools/balance-sheet-checks.json` for the automated verification schema.

---

## Checker Verification Checklist

| Check | Method | Reference |
|-------|--------|-----------|
| Equity = Total Cost − Loan Amount | Export to Excel, verify cell formula | `formulas/funding-financing-refi.md` §1 |
| PMT matches amortization schedule | Recalculate PMT independently | `formulas/funding-financing-refi.md` §2 |
| Interest + Principal = Monthly Payment | Sum columns in amortization export | `formulas/funding-financing-refi.md` §2 |
| Refi proceeds = New Loan − Old Balance − Costs | Verify at refi month | `formulas/funding-financing-refi.md` §3 |
| Exit Value = Terminal NOI / Exit Cap | Check terminal year NOI and cap rate | `formulas/dcf-fcf-irr.md` §4 |
| Mgmt fees match across entities | Compare property expense to company revenue | `tools/fee-linkage-checks.json` |
| Cash balance never negative | Scan all periods in cash flow export | `tools/constraint-checks.json` |
| Balance Sheet balances every period | Assets = Liabilities + Equity | `tools/balance-sheet-checks.json` |
