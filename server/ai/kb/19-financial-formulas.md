Financial Formulas and Calculations Reference

This is the authoritative reference for every formula used in the financial engine. All calculations are deterministic — the engine computes them, not the AI. When users ask about formulas, reference this document.

## Revenue Formulas

F-P-01: Room Revenue = Room Count × ADR × Occupancy × Days Per Month (30.5 days, industry convention of 365 ÷ 12)
F-P-02: ADR Growth = Starting ADR × (1 + ADR Growth Rate) ^ year (compound, not additive)
F-P-03: F&B Revenue = Room Revenue × F&B Revenue % × (1 + Catering Boost %)
F-P-04: Events Revenue = Room Revenue × Events Revenue %
F-P-05: Other Revenue = Room Revenue × Other Revenue %
F-P-06: Total Revenue = Room Revenue + F&B Revenue + Events Revenue + Other Revenue

## Occupancy Ramp-Up

Occupancy uses a step-up model, not a smooth curve. Parameters: starting occupancy, stabilized target, ramp interval (months between steps), step size (percentage points per step). Example: 40% start, 70% target, 9-month interval, 5% steps → 40% for months 1–9, 45% for months 10–18, 50% for months 19–27, etc.

## Expense Formulas

F-P-07: Rooms Department Expense = Total Revenue × Rooms Expense %
F-P-07: F&B Department Expense = Total Revenue × F&B Expense %
F-P-07: Admin & General Expense = Total Revenue × Admin %
F-P-07: Marketing Expense = Total Revenue × Marketing %
F-P-07: Property Operations = Total Revenue × Property Ops %
F-P-07: Utilities = Total Revenue × Utilities %
F-P-07: IT Systems = Total Revenue × IT %
F-P-08: Total Operating Expenses = Sum of all expense categories above (each category inflates annually)

## Profitability Waterfall (USALI)

F-P-09: GOP (Gross Operating Profit) = Total Revenue − Total Operating Expenses
F-P-12a: Base Management Fee = Total Revenue × Base Fee Rate (default 8.5%, per HVS 2024 Specialty Fee Survey)
F-P-12b: Incentive Management Fee = max(0, GOP) × Incentive Fee Rate (default 12%, only charged when GOP > 0)
F-P-09a: AGOP (Adjusted GOP) = GOP − Base Management Fee − Incentive Management Fee
F-P-12c: Property Taxes = Purchase Price × Property Tax Rate (fixed charge, deducted after AGOP)
F-P-10: NOI (Net Operating Income) = AGOP − Property Taxes
F-P-11: FF&E Reserve = Total Revenue × FF&E Reserve Rate (default 4%, deducted below NOI)
F-P-11: ANOI (Adjusted NOI) = NOI − FF&E Reserve

## Depreciation (IRS / GAAP)

F-P-13: Depreciable Basis = (Purchase Price × (1 − Land Value %)) + Building Improvements
F-P-14: Monthly Depreciation = Depreciable Basis / 39 / 12 (straight-line per IRS Pub 946 / IRC §168(e)(2)(A))
F-P-14: Annual Depreciation = Depreciable Basis / 39
Authority: Hotels are nonresidential real property under IRC §168(e)(2)(A) — 39-year MACRS straight-line. The 27.5-year period applies only to residential rental property (apartments), not hotels.

## Net Income and Tax

F-P-15: Interest Expense = Beginning Loan Balance × Monthly Interest Rate (per ASC 835)
F-P-16: Taxable Income = ANOI − Interest Expense − Depreciation
F-P-16a: Income Tax = max(0, Taxable Income − NOL Carryforward) × Income Tax Rate (default 25%)
F-P-16a: NOL Carryforward — if taxable income is negative, the loss carries forward to offset future income per IRC §172
F-P-16: Net Income = ANOI − Interest Expense − Depreciation − Income Tax

## Cash Flow Statement (ASC 230 Indirect Method)

F-P-17: Cash from Operations (CFO) = Net Income + Depreciation (depreciation is a non-cash add-back)
F-P-18: Cash from Investing (CFI) = −Acquisition Cost (at purchase) or +Sale Proceeds (at exit)
F-P-19: Cash from Financing (CFF) = +Loan Proceeds − Principal Payments + Refi Proceeds − Equity Contributions
F-P-20: Net Change in Cash = CFO + CFI + CFF
F-P-20: Closing Cash = Opening Cash + Net Change in Cash

## Debt Service and Loan Formulas

F-F-01: Loan Amount = Purchase Price × LTV (Loan-to-Value ratio)
F-F-02: Closing Costs = Loan Amount × Closing Cost Rate (default ~2–3%)
F-F-03: Equity Required = Purchase Price + Closing Costs − Loan Amount
F-F-04: Monthly Payment (PMT) = standard amortization formula: P × r × (1+r)^n / ((1+r)^n − 1) where P = principal, r = monthly rate, n = total months
F-F-04: Interest-Only Payment = Loan Balance × Monthly Interest Rate (no principal reduction)
F-F-05: Balloon Payment — remaining loan balance at maturity if the amortization period exceeds the loan term
F-F-06: DSCR = ANOI / Annual Debt Service (lenders typically require ≥ 1.25x)

## Refinancing

When a property refinances:
1. New Loan Amount = Current Property Value × Refi LTV
2. Current Property Value = Current Year NOI / Exit Cap Rate
3. Old Loan is paid off from new loan proceeds
4. Closing costs are deducted from new loan
5. Cash Out = New Loan − Old Loan Balance − Refi Closing Costs
6. If Cash Out > 0, it is distributed to equity investors

## Investment Returns

F-R-01: FCF (Free Cash Flow) = CFO − Capital Expenditures
F-R-02: FCFE (Free Cash Flow to Equity) = ANOI − Debt Service (principal + interest) − Income Tax
F-R-03: Equity Invested = Purchase Price + Closing Costs − Loan Amount
F-R-04: Equity Multiple (MOIC) = Total Distributions / Total Equity Invested
F-R-04: IRR = Internal Rate of Return — the discount rate that makes NPV of all cash flows equal to zero
F-R-05: Exit Value = Terminal Year NOI / Exit Cap Rate
F-R-06: Exit Proceeds = Exit Value − Sales Commission − Remaining Debt Balance
F-R-07: Cash-on-Cash Return = Annual FCFE / Equity Invested
F-R-08: NPV = Sum of (Cash Flow_t / (1 + discount rate)^t) for all periods

## Balance Sheet (ASC 360)

Total Assets = Cash & Equivalents + Net Book Value of Property
Net Book Value = Total Property Cost − Accumulated Depreciation
Total Liabilities = Outstanding Loan Balance
Total Equity = Total Assets − Total Liabilities
Identity Check: Assets = Liabilities + Equity (must always balance)

## Management Company

The management company is an asset-light service entity. Its revenue comes entirely from fees charged to the managed properties:
- Base Fee Revenue = Sum of all properties' base management fees
- Incentive Fee Revenue = Sum of all properties' incentive management fees

On consolidation (portfolio view), intercompany management fees are eliminated — they are revenue to the management company and an expense to each property, so they net to zero per ASC 810.

## Key Constants (Authority-Backed)

- Depreciation Years: 39 (IRS Pub 946 / IRC §168(e)(2)(A) for nonresidential real property)
- Days Per Month: 30.5 (industry convention, 365 ÷ 12)
- Default Income Tax Rate: 25% (per-property, jurisdiction-specific)
- Default Inflation Rate: 3% (user-configurable per property)
- Default Base Management Fee: 8.5% of revenue (HVS 2024 Specialty Fee Survey, range 6–10%)
- Default Incentive Management Fee: 12% of GOP (HVS 2024 Specialty Fee Survey, range 10–20%)
- Default FF&E Reserve: 4% of revenue (USALI / lender covenants, range 3–5%)
- Default Land Value: 25% of purchase price (IRS Pub 946 guidelines, range 15–40%)
- Default Sales Commission: 5% (broker industry standard, range 4–6%)
- Default Exit Cap Rate: 8.5% (HVS / CBRE cap rate surveys, range 7–10%)
- Default LTV: 65% (typical commercial hotel lending)
- Default Closing Cost Rate: 2% of loan amount
