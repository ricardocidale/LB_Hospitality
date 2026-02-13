# No Hardcoded Financial/Operational Assumptions

## Rule

Never hardcode financial or operational assumption values as literals in code. All configurable values must be read from `globalAssumptions` (database) with fallback to named constants in `shared/constants.ts`. The user must always be able to change and save these values from the Management Company Assumptions page.

## Fallback Pattern (mandatory)

```typescript
// CORRECT — database value → named constant fallback
const taxRate = globalAssumptions.companyTaxRate ?? DEFAULT_COMPANY_TAX_RATE;

// WRONG — hardcoded literal
const taxRate = 0.30;

// WRONG — unnamed magic number even as fallback
const taxRate = globalAssumptions.companyTaxRate ?? 0.30;
```

## Protected Variables — Management Company Assumptions

These are user-configurable via the Company Assumptions page (`CompanyAssumptions.tsx`). Every one of these must come from `globalAssumptions.*` in code, never as a literal.

### Company Setup
| Field | DB Column | Constant Fallback | Never Hardcode |
|-------|-----------|-------------------|----------------|
| Company Name | `companyName` | — | `"Hospitality Business"` |
| Company Logo | `companyLogoId` | — | any logo URL |
| Operations Start Date | `companyOpsStartDate` | — | `"2026-06-01"` |
| Projection Years | `projectionYears` | `DEFAULT_PROJECTION_YEARS` | `10` |
| Fiscal Year Start Month | `fiscalYearStartMonth` | — | `1` |
| Model Start Date | `modelStartDate` | `DEFAULT_MODEL_START_DATE` | `"2026-04-01"` |

### Funding
| Field | DB Column | Constant Fallback | Never Hardcode |
|-------|-----------|-------------------|----------------|
| Funding Source Label | `fundingSourceLabel` | — | `"Funding Vehicle"`, `"SAFE"` |
| Tranche 1 Amount | `safeTranche1Amount` | — | `800000` |
| Tranche 1 Date | `safeTranche1Date` | — | `"2026-06-01"` |
| Tranche 2 Amount | `safeTranche2Amount` | — | `800000` |
| Tranche 2 Date | `safeTranche2Date` | — | `"2027-04-01"` |
| Valuation Cap | `safeValuationCap` | `DEFAULT_SAFE_VALUATION_CAP` | `2500000` |
| Discount Rate | `safeDiscountRate` | `DEFAULT_SAFE_DISCOUNT_RATE` | `0.20` |

### Revenue — Management Fees (per-property)
| Field | DB Column | Constant Fallback | Never Hardcode |
|-------|-----------|-------------------|----------------|
| Base Management Fee | `baseManagementFee` | `DEFAULT_BASE_MANAGEMENT_FEE_RATE` | `0.085` |
| Incentive Management Fee | `incentiveManagementFee` | `DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE` | `0.12` |

### Compensation
| Field | DB Column | Constant Fallback | Never Hardcode |
|-------|-----------|-------------------|----------------|
| Staff Salary (Avg) | `staffSalary` | `DEFAULT_STAFF_SALARY` | `75000` |
| Staffing Tier 1 Max Properties | `staffTier1MaxProperties` | — | `3` |
| Staffing Tier 1 FTE | `staffTier1Fte` | — | `2.5` |
| Staffing Tier 2 Max Properties | `staffTier2MaxProperties` | — | `6` |
| Staffing Tier 2 FTE | `staffTier2Fte` | — | `4.5` |
| Staffing Tier 3 FTE | `staffTier3Fte` | — | `7.0` |
| Partner Comp Years 1–10 | `partnerCompYear1`…`partnerCompYear10` | `DEFAULT_PARTNER_COMP[i]` | `540000`, `600000`, etc. |
| Partner Count Years 1–10 | `partnerCountYear1`…`partnerCountYear10` | `DEFAULT_PARTNER_COUNT` | `3` |

### Fixed Overhead
| Field | DB Column | Constant Fallback | Never Hardcode |
|-------|-----------|-------------------|----------------|
| Fixed Cost Escalation Rate | `fixedCostEscalationRate` | `DEFAULT_FIXED_COST_ESCALATION_RATE` | `0.03` |
| Office Lease | `officeLeaseStart` | `DEFAULT_OFFICE_LEASE` | `36000` |
| Professional Services | `professionalServicesStart` | `DEFAULT_PROFESSIONAL_SERVICES` | `24000` |
| Tech Infrastructure | `techInfraStart` | `DEFAULT_TECH_INFRA` | `18000` |
| Business Insurance | `businessInsuranceStart` | `DEFAULT_BUSINESS_INSURANCE` | `12000` |

### Variable Costs
| Field | DB Column | Constant Fallback | Never Hardcode |
|-------|-----------|-------------------|----------------|
| Travel Cost per Client | `travelCostPerClient` | `DEFAULT_TRAVEL_PER_CLIENT` | `12000` |
| IT/Licensing per Client | `itLicensePerClient` | `DEFAULT_IT_LICENSE_PER_CLIENT` | `3000` |
| Marketing Rate (% of Revenue) | `marketingRate` | `DEFAULT_MARKETING_RATE` | `0.05` |
| Misc Ops Rate (% of Revenue) | `miscOpsRate` | `DEFAULT_MISC_OPS_RATE` | `0.03` |

### Tax, Exit & Sale
| Field | DB Column | Constant Fallback | Never Hardcode |
|-------|-----------|-------------------|----------------|
| Company Income Tax Rate | `companyTaxRate` | `DEFAULT_COMPANY_TAX_RATE` | `0.30` |
| Exit Cap Rate | `exitCapRate` | `DEFAULT_EXIT_CAP_RATE` | `0.085` |
| Sales Commission Rate | `salesCommissionRate` | `DEFAULT_COMMISSION_RATE` | `0.05` |
| Inflation Rate | `inflationRate` | — | any literal |

### Property Expense Rates
| Field | DB Column | Constant Fallback | Never Hardcode |
|-------|-----------|-------------------|----------------|
| Event Expense Rate | `eventExpenseRate` | `DEFAULT_EVENT_EXPENSE_RATE` | `0.65` |
| Other Revenue Expense Rate | `otherExpenseRate` | `DEFAULT_OTHER_EXPENSE_RATE` | `0.60` |
| Utilities Variable Split | `utilitiesVariableSplit` | `DEFAULT_UTILITIES_VARIABLE_SPLIT` | `0.60` |

### Property-Level Cost Rates (per property, from properties table)
| Field | DB Column | Constant Fallback | Never Hardcode |
|-------|-----------|-------------------|----------------|
| Rooms Cost Rate | `costRateRooms` | `DEFAULT_COST_RATE_ROOMS` | `0.20` |
| F&B Cost Rate | `costRateFB` | `DEFAULT_COST_RATE_FB` | `0.09` |
| Admin Cost Rate | `costRateAdmin` | `DEFAULT_COST_RATE_ADMIN` | `0.08` |
| Marketing Cost Rate | `costRateMarketing` | `DEFAULT_COST_RATE_MARKETING` | `0.01` |
| Property Ops Cost Rate | `costRatePropertyOps` | `DEFAULT_COST_RATE_PROPERTY_OPS` | `0.04` |
| Utilities Cost Rate | `costRateUtilities` | `DEFAULT_COST_RATE_UTILITIES` | `0.05` |
| Insurance Cost Rate | `costRateInsurance` | `DEFAULT_COST_RATE_INSURANCE` | `0.02` |
| Taxes Cost Rate | `costRateTaxes` | `DEFAULT_COST_RATE_TAXES` | `0.03` |
| IT Cost Rate | `costRateIT` | `DEFAULT_COST_RATE_IT` | `0.005` |
| FF&E Reserve Rate | `costRateFFE` | `DEFAULT_COST_RATE_FFE` | `0.04` |
| Other Cost Rate | `costRateOther` | `DEFAULT_COST_RATE_OTHER` | `0.05` |

### Property-Level Revenue & Operations (per property)
| Field | DB Column | Constant Fallback | Never Hardcode |
|-------|-----------|-------------------|----------------|
| ADR Growth Rate | `adrGrowthRate` | `DEFAULT_ADR_GROWTH_RATE` | `0.03` |
| Start Occupancy | `startOccupancy` | `DEFAULT_START_OCCUPANCY` | `0.55` |
| Max Occupancy | `maxOccupancy` | `DEFAULT_MAX_OCCUPANCY` | `0.85` |
| Occupancy Growth Step | `occupancyGrowthStep` | `DEFAULT_OCCUPANCY_GROWTH_STEP` | `0.05` |
| Occupancy Ramp Months | `occupancyRampMonths` | `DEFAULT_OCCUPANCY_RAMP_MONTHS` | `6` |
| Land Value Percent | `landValuePercent` | `DEFAULT_LAND_VALUE_PERCENT` | `0.25` |
| Revenue Share Events | `revShareEvents` | `DEFAULT_REV_SHARE_EVENTS` | `0.30` |
| Revenue Share F&B | `revShareFB` | `DEFAULT_REV_SHARE_FB` | `0.18` |
| Revenue Share Other | `revShareOther` | `DEFAULT_REV_SHARE_OTHER` | `0.05` |
| Catering Boost % | `cateringBoostPct` | `DEFAULT_CATERING_BOOST_PCT` | `0.22` |

## Exceptions — Immutable Constants

These are mandated by external standards and are NOT user-configurable. They may appear as literals or named constants:

| Constant | Value | Source |
|----------|-------|--------|
| `DEPRECIATION_YEARS` | 27.5 | IRS Publication 946 |
| `DAYS_PER_MONTH` | 30.5 | Industry standard (365/12) |

## How to Check

Before writing any financial value in code, ask:
1. Is this value on the Company Assumptions page or a property edit page?
2. If yes → it MUST come from the database (`globalAssumptions.*` or `property.*`)
3. If a fallback is needed → use the named constant from `shared/constants.ts`
4. Never use a raw number where a named constant or DB field exists
