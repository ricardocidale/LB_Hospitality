# Glossary of Terms — Real Estate & Hospitality Finance

This glossary defines every financial and operational term used in the L+B Hospitality Group Business Simulation Portal. Each entry includes a cross-reference to the relevant formula ID in the `formulas/` directory where applicable.

## Formula Reference Key

| Prefix | Source File |
|--------|------------|
| F-P-xx | `formulas/property-financials.md` |
| F-C-xx | `formulas/company-financials.md` |
| F-X-xx | `formulas/consolidated.md` |
| F-R-xx | `formulas/dcf-fcf-irr.md` |
| F-F-xx | `formulas/funding-financing-refi.md` |

---

## Terms

| Term | Definition | Formula Reference | Category |
|------|-----------|-------------------|----------|
| ADR (Average Daily Rate) | Average revenue earned per occupied room per day. | F-P-03 | Revenue |
| Amortization | Gradual repayment of loan principal over time via scheduled payments. | F-F-01 | Financing |
| ASC 230 | GAAP standard governing Statement of Cash Flows; requires classification into Operating, Investing, Financing activities. | — | Accounting Standard |
| ASC 360 | GAAP standard for property depreciation; governs useful life and method selection. | — | Accounting Standard |
| ASC 470 | GAAP standard for debt accounting; interest on Income Statement, principal on Cash Flow only. | — | Accounting Standard |
| ASC 810 | GAAP consolidation standard; governs inter-company elimination entries. | — | Accounting Standard |
| ATCF (After-Tax Cash Flow) | Cash remaining after operating expenses, debt service, and taxes. = NOI − Debt Service − Income Tax. | F-R-02 | Returns |
| Balance Sheet | Point-in-time snapshot of assets, liabilities, and equity. | — | Financial Statement |
| Base Management Fee | Percentage of total property revenue paid to management company. | F-C-01 | Fees |
| Boutique Hotel | Independently owned, typically 10–80 rooms, with F&B and events capability. | — | Property Type |
| Building Improvements | Capital expenditures to improve property post-acquisition; added to depreciable basis. | — | Capital |
| Cap Rate (Capitalization Rate) | NOI / Property Value. Used to value income-producing real estate. | F-R-05 | Valuation |
| Cash from Financing (CFF) | Cash flows from debt, equity, and distributions. | F-P-18 | Cash Flow |
| Cash from Investing (CFI) | Cash flows from property acquisition/disposition. | F-P-17 | Cash Flow |
| Cash from Operations (CFO) | Cash generated from core business operations. | F-P-16 | Cash Flow |
| Closing Costs | Fees and expenses associated with finalizing a loan (% of loan amount). | F-F-02 | Financing |
| DCF (Discounted Cash Flow) | Valuation method summing present value of projected cash flows. | — | Valuation |
| Debt Service | Total loan payment combining interest and principal. = PMT(rate, nper, pv). | F-F-04 | Financing |
| Depreciable Basis | Portion of property value subject to depreciation = Purchase Price × (1 − Land %) + Improvements. | F-P-11 | Depreciation |
| Depreciation | Non-cash expense allocating building cost over 27.5-year useful life (straight-line). | F-P-12 | Depreciation |
| DSCR (Debt Service Coverage Ratio) | NOI / Annual Debt Service. Measures ability to cover debt payments. | — | Financing |
| Equity Invested | Total capital contributed by equity investors = Total Cost − Loan Amount. | F-R-03 | Returns |
| Equity Multiple (MOIC) | Total Distributions / Total Equity Invested. | F-R-04 | Returns |
| Exit Cap Rate | Cap rate used to value property at disposition/sale. | F-R-05 | Valuation |
| Exit Proceeds | Net cash received at property sale = Gross Value − Commission − Debt. | F-R-06 | Returns |
| FC (Fixed Costs) | Operating expenses that don't vary with occupancy; escalate at fixed rate annually. | — | Expenses |
| FCFE (Free Cash Flow to Equity) | Cash available to equity holders after debt. | F-R-02 | Returns |
| FCF (Free Cash Flow) | Cash from operations minus capital expenditures. | F-R-01 | Returns |
| FF&E (Furniture, Fixtures & Equipment) | Reserve fund for replacement of furnishing/equipment, typically 4% of revenue. | — | Capital |
| Fiscal Year | 12-month accounting period; configurable start month (default January). | — | Accounting |
| GAAP (Generally Accepted Accounting Principles) | US accounting standards framework. | — | Accounting Standard |
| GOP (Gross Operating Profit) | Total Revenue − Total Operating Expenses. | F-P-08 | Profitability |
| Gross Disposition Value | Property sale price = Terminal NOI / Exit Cap Rate. | F-R-05 | Valuation |
| HMA (Hotel Management Agreement) | Contract defining management fee structure between owner and operator. | — | Legal |
| Incentive Management Fee | Performance-based fee calculated on GOP or NOI. | F-C-02 | Fees |
| Income Statement (P&L) | Financial statement showing revenue, expenses, and net income over a period. | — | Financial Statement |
| Indirect Method | ASC 230 approach starting with Net Income and adjusting for non-cash items to derive CFO. | — | Accounting |
| Inflation Rate | Annual rate of general price increase; affects variable costs. | — | Assumptions |
| IRR (Internal Rate of Return) | Discount rate making NPV of cash flows equal to zero. | F-R-04 | Returns |
| Land Value Percent | Portion of purchase price allocated to land (non-depreciable), typically 25%. | — | Depreciation |
| LTV (Loan-to-Value) | Ratio of loan amount to property purchase price. | F-F-01 | Financing |
| Management Company | Asset-light service entity earning fees from managed properties. See `skills/02-mgmt-company.md`. | — | Entity |
| MOIC | Multiple on Invested Capital. See Equity Multiple. | F-R-04 | Returns |
| Monthly Depreciation | Depreciable Basis / 27.5 / 12. | F-P-12 | Depreciation |
| Net Income | NOI − Interest − Depreciation − Income Tax. | F-P-14 | Profitability |
| NOI (Net Operating Income) | GOP − Management Fees − FF&E Reserve. | F-P-10 | Profitability |
| Occupancy Rate | Percentage of available rooms sold. Ramps from start to max over stabilization period. | — | Revenue |
| Operating Reserve | Cash set aside for initial working capital needs post-acquisition. | — | Capital |
| PMT | Standard loan payment formula = P × [r(1+r)^n / ((1+r)^n − 1)]. | F-F-04 | Financing |
| Pre-Opening Costs | Expenses incurred before property begins operations (staffing, marketing, setup). | — | Capital |
| Pro Forma | Projected financial statements based on assumptions. | — | Financial Statement |
| Projection Period | Number of years modeled (configurable, default 10). | — | Assumptions |
| Purchase Price | Acquisition cost of the property asset. | — | Capital |
| Refinancing | Replacing existing debt with new loan, typically after stabilization at better terms. | F-F-06 | Financing |
| Refi Proceeds | Net cash from refinancing = New Loan − Old Balance − Closing Costs. | F-F-07 | Financing |
| RevPAR (Revenue Per Available Room) | Room Revenue / Available Rooms = ADR × Occupancy. | — | Revenue |
| Room Revenue | ADR × Sold Rooms. | F-P-03 | Revenue |
| SAFE (Simple Agreement for Future Equity) | Convertible instrument funding the management company. | F-F-10 | Funding |
| Scenario | Saved snapshot of all assumptions and property configurations for comparison. | — | System |
| SPV (Special Purpose Vehicle) | Legal entity isolating each property's financial risk. | — | Legal |
| Stabilization | Period when property reaches target occupancy after opening (typically 12–24 months). | — | Operations |
| Straight-Line Depreciation | Equal depreciation expense each period over useful life. | — | Depreciation |
| Terminal Year | Final year of projection period; used for exit valuation. | — | Valuation |
| Total Property Cost | Purchase Price + Building Improvements + Pre-Opening + Operating Reserve + Closing Costs. | F-F-03 | Capital |
| USALI | Uniform System of Accounts for the Lodging Industry. Standard chart of accounts for hotel operations. | — | Accounting Standard |
| Variable Costs | Operating expenses that scale with revenue/occupancy. | — | Expenses |
