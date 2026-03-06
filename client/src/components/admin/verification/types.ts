import type { AuditReport } from "@/lib/financialAuditor";
import type { KnownValueTestResult } from "@/lib/runVerification";

// Import + re-export shared verification types — single source of truth
import type { CheckResult, PropertyCheckResults } from "@shared/verification-types";
export type { CheckResult, PropertyCheckResults };

export interface VerificationResult {
  timestamp: string;
  propertiesChecked: number;
  propertyResults: PropertyCheckResults[];
  companyChecks: CheckResult[];
  consolidatedChecks: CheckResult[];
  summary: {
    totalChecks: number;
    totalPassed: number;
    totalFailed: number;
    criticalIssues: number;
    materialIssues: number;
    auditOpinion: "UNQUALIFIED" | "QUALIFIED" | "ADVERSE";
    overallStatus: "PASS" | "FAIL" | "WARNING";
  };
  clientAuditWorkpaper?: string;
  clientAuditReports?: AuditReport[];
  clientKnownValueTests?: { passed: boolean; results: string; structured: KnownValueTestResult[] };
}

export interface VerificationHistoryEntry {
  id: number;
  userId: number;
  totalChecks: number;
  passed: number;
  failed: number;
  auditOpinion: string;
  overallStatus: string;
  createdAt: string;
}

export interface DesignCheckResult {
  timestamp: string;
  totalChecks: number;
  passed: number;
  failed: number;
  warnings: number;
  overallStatus: "PASS" | "FAIL" | "WARNING";
  checks: Array<{
    category: string;
    rule: string;
    status: "pass" | "fail" | "warning";
    details: string;
  }>;
}
