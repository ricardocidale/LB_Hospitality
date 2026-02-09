# Property SPV — Balance Sheet

## Source Components
- `client/src/components/ConsolidatedBalanceSheet.tsx`

---

## Source: GAAP Fundamental Equation

```
ASSETS = LIABILITIES + EQUITY
```

This equation MUST balance at all times. Every transaction affects at least two accounts.

### Assets

```
CURRENT ASSETS
  Cash & Cash Equivalents         = Cumulative Cash Flow (ending cash)
  Accounts Receivable             = 0 (simplified for pro forma)
  ─────────────────────────────────────────────────
  Total Current Assets

FIXED ASSETS (ASC 360)
  Land                            = Purchase Price × landValuePercent
  Building & Improvements         = Purchase Price × (1 − landValuePercent) + Building Improvements
  Less: Accumulated Depreciation  = Monthly Depreciation × Months Since Acquisition
  ─────────────────────────────────────────────────
  Net Property Value              = Land + Building − Accumulated Depreciation
  ─────────────────────────────────────────────────
  TOTAL ASSETS                    = Current Assets + Net Property Value
```

**IRS / ASC 360 Rules:**
- Land NEVER depreciates (IRS Pub 946, Section 3)
- Building depreciates over 27.5 years (residential rental, straight-line)
- Building Improvements are added to the depreciable basis
- Accumulated depreciation is cumulative from acquisition date
- Property is NOT revalued to market (held at historical cost less depreciation per GAAP)

### Liabilities

```
LONG-TERM LIABILITIES
  Mortgage / Loan Outstanding     = Original Loan − Cumulative Principal Paid
  ─────────────────────────────────────────────────
  TOTAL LIABILITIES               = Debt Outstanding
```

**ASC 470 Rules:**
- Debt is recorded at face value (no fair value adjustment for pro forma)
- Each monthly payment splits into interest (expense) and principal (liability reduction)
- After refinance: old loan is extinguished, new loan balance replaces it (ASC 470-50)
- At exit: all outstanding debt must be repaid from sale proceeds

### Equity

```
EQUITY
  Initial Equity Investment       = Total Investment − Loan Amount
  Retained Earnings               = Cumulative Net Income
  ─────────────────────────────────────────────────
  TOTAL EQUITY                    = Total Assets − Total Liabilities
```

### Balance Sheet Check

```
TOTAL ASSETS = TOTAL LIABILITIES + TOTAL EQUITY
```

If this does not balance within rounding tolerance ($1), there is a calculation error.
