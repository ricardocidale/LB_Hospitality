# Operating Expenses

## Section ID: `expenses`

## Content Summary
Two categories of expenses: direct costs and overhead costs. Rendered as `ManualTable` components in the UI.

### Direct Costs (% of Revenue)
| Cost | Default Rate | Source Constant |
|------|-------------|----------------|
| Rooms | 36% | `DEFAULT_COST_RATE_ROOMS` |
| F&B | 32% | `DEFAULT_COST_RATE_FB` |
| Events | 65% | `DEFAULT_EVENT_EXPENSE_RATE` |
| Other | 60% | `DEFAULT_OTHER_EXPENSE_RATE` |

### Overhead Costs (% of Total Revenue)
| Cost | Default Rate | Source Constant |
|------|-------------|----------------|
| Admin | 8% | `DEFAULT_COST_RATE_ADMIN` |
| Marketing | 5% | `DEFAULT_COST_RATE_MARKETING` |
| Property Ops | 4% | `DEFAULT_COST_RATE_PROPERTY_OPS` |
| Utilities | 5% | `DEFAULT_COST_RATE_UTILITIES` |
| Insurance | 2% | `DEFAULT_COST_RATE_INSURANCE` |
| Property Taxes | 3% | `DEFAULT_COST_RATE_TAXES` |
| IT | 2% | `DEFAULT_COST_RATE_IT` |
| FF&E Reserve | 4% | `DEFAULT_COST_RATE_FFE` |

### Utilities Split
Utilities are split between variable and fixed components:
- Variable portion: `DEFAULT_UTILITIES_VARIABLE_SPLIT` (60%) — scales with revenue
- Fixed portion: 40% — escalates at fixed cost escalation rate

### Cost Escalation
- Variable costs: escalate at the inflation rate (compounding annually)
- Fixed costs: escalate at `fixedCostEscalationRate` (default 3%)

## Cross-References
- Formulas: `.claude/checker-manual/formulas/property-financials.md` § Expenses
- Constants: `DEFAULT_COST_RATE_*` in `shared/constants.ts`
