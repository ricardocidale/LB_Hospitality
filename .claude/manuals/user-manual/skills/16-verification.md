# Cross-Verification & Audit Trail

## Section ID: `verification`

## Content Summary
Explains the independent verification system:

### Two-Layer Verification
1. **Client-side**: Formula checker, GAAP compliance checker, financial auditor — runs in the browser
2. **Server-side**: Independent recalculation engine (`calculationChecker.ts`) — completely separate implementation that does NOT import from the client engine

### Audit Opinions
| Opinion | Meaning |
|---------|---------|
| UNQUALIFIED | Clean — all calculations verified |
| QUALIFIED | Minor discrepancies found |
| ADVERSE | Significant errors requiring attention |

### What Gets Checked
- Revenue calculations (ASC 606)
- Depreciation (ASC 360)
- Loan math (ASC 470)
- Balance sheet balance (FASB)
- Cash flow classification (ASC 230)
- Reasonableness (NOI margin 15-45%)

### Activity Logging
All user actions are logged for audit trail. Verification results are persisted with timestamps and user attribution.

## Cross-References
- System: `.claude/rules/verification-system.md` (complete verification architecture)
- Checker Manual: `.claude/manuals/checker-manual/skills/15-testing-methodology.md` (7-phase testing)
- Tools: `.claude/manuals/checker-manual/tools/` (validation check schemas)
