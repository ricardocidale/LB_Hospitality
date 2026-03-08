import type { CheckResult } from "../types";
import { check } from "../gaap-checks";
import type { YearMetrics } from "./year-aggregation";

const FORMULA = "Server independent calc vs client generatePropertyProForma";

/**
 * Push five cross-validation checks (Revenue, GOP, AGOP, NOI, ANOI) for one
 * year period. Collapses the 15-check repetition in index.ts into a single call.
 */
export function addCrossValidationChecks(
  checks: CheckResult[],
  yearLabel: string,
  server: YearMetrics,
  client: YearMetrics
): void {
  const metrics: Array<{ key: keyof YearMetrics; label: string }> = [
    { key: "revenue", label: "Revenue" },
    { key: "gop",     label: "GOP" },
    { key: "agop",    label: "AGOP" },
    { key: "noi",     label: "NOI" },
    { key: "anoi",    label: "ANOI" },
  ];

  for (const { key, label } of metrics) {
    checks.push(check(
      `${yearLabel} ${label} (Server vs Client Engine)`,
      "Cross-Validation",
      "Independence",
      FORMULA,
      server[key],
      client[key],
      "critical"
    ));
  }
}
