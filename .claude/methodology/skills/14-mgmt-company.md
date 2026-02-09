# Management Company Financials

## Section ID: `management-company`

## Content Summary
L+B Hospitality Co. financial model:

### Revenue
- **Base Management Fee**: `baseManagementFee` (default 5%) × Total Portfolio Revenue
- **Incentive Fee**: `incentiveManagementFee` (default 15%) × GOP above threshold
- Revenue only starts after `companyOpsStartDate`

### Expenses
- **Staff**: FTE count × `DEFAULT_STAFF_SALARY` ($75,000/yr)
- **Office Lease**: `DEFAULT_OFFICE_LEASE` ($36,000/yr)
- **Professional Services**: `DEFAULT_PROFESSIONAL_SERVICES` ($24,000/yr)
- **Technology**: `DEFAULT_TECH_INFRA` ($18,000/yr)
- **Insurance**: `DEFAULT_BUSINESS_INSURANCE` ($12,000/yr)
- **Travel**: `DEFAULT_TRAVEL_PER_CLIENT` ($12,000/yr) × active properties
- **IT Licenses**: `DEFAULT_IT_LICENSE_PER_CLIENT` ($3,000/yr) × active properties
- **Marketing**: `DEFAULT_MARKETING_RATE` (5%) × revenue
- **Misc Ops**: `DEFAULT_MISC_OPS_RATE` (3%) × revenue
- **Partner Compensation**: Per-year schedule from `DEFAULT_PARTNER_COMP`

### Staffing Tiers
Dynamic FTE based on active property count (configurable in global assumptions):
- Tier 1: Up to 3 properties → 2.5 FTE
- Tier 2: Up to 6 properties → 4.5 FTE
- Tier 3: 7+ properties → 7.0 FTE

### Funding Gate
Company operations gated on SAFE funding receipt. `DEFAULT_SAFE_TRANCHE` ($800,000).

## Cross-References
- Formulas: `.claude/checker-manual/formulas/company-financials.md`
- Constants: `DEFAULT_STAFF_SALARY`, `STAFFING_TIERS`, `DEFAULT_SAFE_TRANCHE`
