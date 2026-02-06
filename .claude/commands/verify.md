Run the independent financial verification system to check all calculations:

1. Login as admin user via the API
2. Call GET /api/admin/run-verification to run all 89 checks
3. Review the audit opinion (UNQUALIFIED = all checks pass)
4. If any checks fail, identify the category and GAAP reference
5. Compare the expected vs actual values and variance percentage
6. For failures, check both client/src/lib/financialEngine.ts and server/calculationChecker.ts
7. Ensure the same calculation logic exists in both files independently

Expected result: 89/89 checks passed, UNQUALIFIED audit opinion.
