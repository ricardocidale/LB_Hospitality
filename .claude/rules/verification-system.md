# Financial Verification & Audit System

## Overview

The verification system provides PwC-level independent verification of all financial calculations against GAAP standards. It operates at two levels: client-side formula and compliance checking, and server-side independent recalculation.

## Architecture

```
Verification System
│
├── CLIENT-SIDE (runs in browser)
│   ├── financialAuditor.ts    → GAAP audit with ASC references
│   ├── formulaChecker.ts      → Formula integrity validation
│   ├── gaapComplianceChecker.ts → Cash flow & compliance checks
│   └── runVerification.ts     → Orchestrator that runs all checkers
│
├── SERVER-SIDE (runs on server)
│   └── calculationChecker.ts  → Independent recalculation engine
│       │
│       └── Completely separate implementation of financial math
│           (does NOT import from financialEngine.ts)
│
└── AI-POWERED (optional)
    └── LLM methodology review via /api/admin/ai-verification
```

## GAAP Standards Referenced

| Standard | Topic | Where Applied |
|----------|-------|---------------|
| ASC 230 | Statement of Cash Flows | Cash flow classification (operating/investing/financing) |
| ASC 360 | Property, Plant & Equipment | Depreciation calculation and asset valuation |
| ASC 470 | Debt | Loan amortization, interest/principal separation |
| ASC 606 | Revenue Recognition | Revenue timing and calculation verification |
| USALI | Uniform System of Accounts for Lodging Industry | Hospitality-specific expense categorization |
| FASB Conceptual Framework | General | Balance sheet equation, double-entry integrity |

## Client-Side Verification

### Financial Auditor (`financialAuditor.ts`)

Performs detailed GAAP compliance audits on each property's financial data.

**Audit Sections**:
1. **Timing Rules** - Verifies revenue/expenses only appear after operations start
2. **Depreciation** - Validates straight-line calculation matches expected values
3. **Loan Amortization** - Checks PMT formula, interest/principal split accuracy
4. **Income Statement** - Validates revenue, expense, and NOI calculations
5. **Balance Sheet** - Confirms Assets = Liabilities + Equity for every period
6. **Cash Flow Statement** - Verifies indirect method classification
7. **Management Fees** - Checks base and incentive fee calculations

### Formula Checker (`formulaChecker.ts`)

Validates mathematical relationships:
- Revenue = sum of component revenues
- GOP = Revenue - Operating Expenses
- NOI = GOP - Undistributed Expenses - Management Fees - FF&E
- Net Income = NOI - Interest - Depreciation
- Cash Flow = NOI - Total Debt Service

### GAAP Compliance Checker (`gaapComplianceChecker.ts`)

Specific compliance validations:
- Cash flow statement classification (operating vs financing vs investing)
- Principal payments correctly classified as financing activities (ASC 470)
- Depreciation add-back in operating cash flow (ASC 230)
- Revenue recognition timing (ASC 606)

## Server-Side Verification

### Calculation Checker (`server/calculationChecker.ts`)

A completely independent recalculation engine that does NOT import from the client-side financial engine. This ensures true independence of verification.

**Key Design Principle**: The server-side checker reimplements all financial math from scratch, using only the raw property data and global assumptions as inputs. If both the client engine and server checker produce the same results, we have high confidence in accuracy.

**What It Checks** (89 checks per property set):

| Category | Check | GAAP Reference |
|----------|-------|----------------|
| Revenue | Room revenue = rooms × ADR × occupancy × 30.5 | ASC 606 |
| Revenue | Year 1 and last year total revenue | Industry |
| Depreciation | Monthly depreciation = buildingValue / 27.5 / 12 | ASC 360 |
| Depreciation | Only after acquisition date | ASC 360 |
| Loan | PMT calculation matches formula | ASC 470 |
| Loan | Interest = balance × monthly rate | ASC 470 |
| Loan | Principal = PMT - Interest | ASC 470 |
| Balance Sheet | Assets = Liabilities + Equity (every month) | FASB |
| Cash Flow | Operating CF = Net Income + Depreciation | ASC 230 |
| Reasonableness | NOI margin between 15-45% | Industry |
| Reasonableness | Revenue growth is positive | Industry |

**Dynamic Configuration**: The checker respects `global.projectionYears` for projection length, falling back to the default constant of 10 years.

### Check Result Structure

```typescript
interface CheckResult {
  name: string;           // "Room Revenue (First Operational Month)"
  category: string;       // "Revenue"
  gaapReference: string;  // "ASC 606"
  methodology: string;    // "10 rooms × $330 ADR × 70% occ × 30.5 days"
  expected: number;       // 70,455
  actual: number;         // 70,455
  passed: boolean;        // true
  severity: string;       // "critical" | "material" | "info"
  variance: number;       // 0.00 (percentage)
}
```

### Audit Opinions

Based on check results, the system issues one of three opinions:

| Opinion | Criteria | Meaning |
|---------|----------|---------|
| **UNQUALIFIED** | 0 critical, 0 material issues | Clean opinion - all calculations verified |
| **QUALIFIED** | 0 critical, some material issues | Minor discrepancies found |
| **ADVERSE** | Any critical issues | Significant errors requiring attention |

**Tolerance**: 1% variance allowed for rounding differences. Variances above 1% are flagged as failures.

## AI-Powered Verification

### Endpoint
```
POST /api/admin/ai-verification
Authorization: Admin or Checker role
```

### Process
1. Server runs the independent verification to generate a report
2. The full verification report is sent to an AI model (configurable provider)
3. AI reviews the methodology, identifies potential issues, and provides commentary
4. Response is streamed back via Server-Sent Events (SSE)

### AI Providers Supported
- **Anthropic Claude** (default - Claude Sonnet 4.5)
- **OpenAI** (GPT models)
- **Google Gemini**

## Running Verification

### From the UI
Navigate to **Admin > Verification** tab. Click "Run Verification" to see all checks with pass/fail status and audit opinion.

### From the API
```bash
# Login first
curl -c cookies.txt -X POST /api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin","password":"..."}'

# Run verification
curl -b cookies.txt /api/admin/run-verification
```

### Expected Results
When properly configured, all 89 checks should pass with an **UNQUALIFIED** audit opinion. Any failures indicate a calculation discrepancy between the client-side engine and the independent server-side checker.
