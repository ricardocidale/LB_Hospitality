# Management Company — Financial Statements

## Source Components
- `client/src/lib/financialEngine.ts` (`generateCompanyProForma`)
- `client/src/pages/Company.tsx`

---

The Management Company is a **service company** — it has NO real estate assets, NO depreciation, NO debt (it is SAFE-funded). Its financial statements are fundamentally simpler.

## Management Company Income Statement

```
┌──────────────────────────────────────────────────────────────────┐
│            MANAGEMENT COMPANY INCOME STATEMENT                   │
│                   (Service Company)                              │
├──────────────────────────────────────────────────────────────────┤
│ REVENUE                                                          │
│   Base Management Fee Revenue   = Σ(Property Revenue) × baseFee  │
│   Incentive Fee Revenue         = max(0, Σ(Property GOP) × fee)  │
│   ───────────────────────────                                    │
│   TOTAL REVENUE                                                  │
├──────────────────────────────────────────────────────────────────┤
│ OPERATING EXPENSES                                               │
│   Partner Compensation          (yearly schedule ÷ 12)           │
│   Staff Compensation            (FTE × salary × escalation ÷ 12)│
│   Office Lease                  (fixed, escalated)               │
│   Professional Services         (fixed, escalated)               │
│   Technology Infrastructure     (fixed, escalated)               │
│   Business Insurance            (fixed, escalated)               │
│   Travel Costs                  (per property, variable)         │
│   IT Licensing                  (per property, variable)         │
│   Marketing                     (% of revenue)                   │
│   Miscellaneous Operations      (% of revenue)                   │
│   ───────────────────────────                                    │
│   TOTAL EXPENSES                                                 │
├──────────────────────────────────────────────────────────────────┤
│ NET INCOME                      = Revenue − Expenses             │
├──────────────────────────────────────────────────────────────────┤
│ SAFE FUNDING                    (not revenue — capital inflow)   │
│ CASH FLOW                      = Net Income + SAFE Funding       │
└──────────────────────────────────────────────────────────────────┘
```

**Key Differences from Property SPV:**
- No depreciation (no real estate assets)
- No interest expense (no debt — funded by SAFE agreements)
- No principal payments
- No NOI concept (NOI is a real estate metric)
- SAFE funding is NOT revenue — it is equity capital (classified as financing activity)
- Expenses begin only AFTER company operations start (Funding Gate rule)
- Revenue begins only when properties are operational and generating fees

**Fee Linkage Rule:** The Management Company's revenue MUST exactly match the sum of Management Fee expenses across all properties. This is a mandatory cross-entity validation.

**Expense Categories:**
- **Fixed costs** (escalate at `fixedCostEscalationRate`): Partner comp, staff comp, office lease, professional services, tech infra, business insurance
- **Variable costs** (escalate at `inflationRate`): Travel (per active property), IT licensing (per active property)
- **Revenue-linked**: Marketing (% of revenue), Misc Ops (% of revenue)

**Staffing Tiers:** Staff FTE is determined by active property count:
- Tier 1: ≤ N properties → X FTE
- Tier 2: ≤ M properties → Y FTE
- Tier 3: > M properties → Z FTE

**SAFE Funding Treatment:**
- SAFE (Simple Agreement for Future Equity) tranches are capital contributions, NOT revenue
- They appear on the Cash Flow Statement as financing activities
- They increase the company's cash position but do not affect Net Income
- The Funding Gate rule prevents expenses from being incurred before SAFE capital is received
