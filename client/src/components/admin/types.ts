import type { AuditReport } from "@/lib/financialAuditor";
import type { KnownValueTestResult } from "@/lib/runVerification";

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

export interface User {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  company: string | null;
  companyId: number | null;
  title: string | null;
  role: string;
  createdAt: string;
  userGroupId: number | null;
}

export interface Logo {
  id: number;
  name: string;
  companyName: string;
  url: string;
  isDefault: boolean;
  createdAt: string;
}

export interface LoginLog {
  id: number;
  userId: number;
  sessionId: string;
  loginAt: string;
  logoutAt: string | null;
  ipAddress: string | null;
  userEmail: string;
  userName: string | null;
}

export interface CheckResult {
  metric: string;
  category: string;
  gaapRef: string;
  formula: string;
  expected: number;
  actual: number;
  variance: number;
  variancePct: number;
  passed: boolean;
  severity: "critical" | "material" | "minor" | "info";
}

export interface PropertyCheckResults {
  propertyName: string;
  propertyType: string;
  checks: CheckResult[];
  passed: number;
  failed: number;
  criticalIssues: number;
}

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

export interface UserGroup {
  id: number;
  name: string;
  logoId: number | null;
  themeId: number | null;
  assetDescriptionId: number | null;
  isDefault: boolean;
  createdAt: string;
}

export interface AdminCompany {
  id: number;
  name: string;
  type: string;
  description: string | null;
  logoId: number | null;
  isActive: boolean;
  createdAt: string;
}

export type AdminView = "users" | "companies" | "activity" | "verification" | "themes" | "branding" | "user-groups" | "sidebar" | "database" | "logos";
export type ActivitySubView = "login" | "feed" | "checker";

export interface ActivityLogEntry {
  id: number;
  userId: number;
  userEmail: string;
  userName: string | null;
  action: string;
  entityType: string;
  entityId: number | null;
  entityName: string | null;
  metadata: Record<string, any> | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface CheckerSummary {
  id: number;
  email: string;
  name: string | null;
  totalActions: number;
  lastActive: string | null;
  verificationRuns: number;
  manualViews: number;
  exports: number;
}

export interface CheckerActivityData {
  checkers: CheckerSummary[];
  summary: {
    totalActions: number;
    verificationRuns: number;
    manualViews: number;
    exports: number;
    pageVisits: number;
    roleChanges: number;
  };
  recentActivity: ActivityLogEntry[];
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

export interface ActiveSession {
  id: string;
  userId: number;
  userEmail: string;
  userName: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface AssetDesc {
  id: number;
  name: string;
  isDefault: boolean;
  createdAt: string;
}
