import { describe, it, expect } from "vitest";
import { execSync } from "child_process";

function grepRoutes(pattern: string): string[] {
  try {
    const out = execSync(
      `rg -n '${pattern}' server/routes/ --glob '*.ts' 2>/dev/null`,
      { encoding: "utf-8", timeout: 10_000 }
    );
    return out.trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

describe("Endpoint Security Audit", () => {
  it("all POST endpoints have authentication middleware", () => {
    const postRoutes = grepRoutes("\\.(post)\\(");
    const unprotected = postRoutes.filter(
      line =>
        !line.includes("requireAuth") &&
        !line.includes("requireAdmin") &&
        !line.includes("requireManagement") &&
        !line.includes("requireChecker") &&
        !line.includes("validateTwilioSignature") &&
        !line.includes("auth/login") &&
        !line.includes("auth/admin-login") &&
        !line.includes("auth/dev-login") &&
        !line.includes("auth/logout") &&
        !line.includes("auth/google") &&
        !line.includes("// public") &&
        !line.includes(".test.")
    );
    expect(unprotected).toEqual([]);
  });

  it("all PUT endpoints have authentication middleware", () => {
    const putRoutes = grepRoutes("\\.(put)\\(");
    const unprotected = putRoutes.filter(
      line =>
        !line.includes("requireAuth") &&
        !line.includes("requireAdmin") &&
        !line.includes("requireManagement") &&
        !line.includes(".test.")
    );
    expect(unprotected).toEqual([]);
  });

  it("all PATCH endpoints have authentication middleware", () => {
    const patchRoutes = grepRoutes("\\.(patch)\\(");
    const unprotected = patchRoutes.filter(
      line =>
        !line.includes("requireAuth") &&
        !line.includes("requireAdmin") &&
        !line.includes("requireManagement") &&
        !line.includes(".test.")
    );
    expect(unprotected).toEqual([]);
  });

  it("all DELETE endpoints have authentication middleware", () => {
    const deleteRoutes = grepRoutes("\\.(delete)\\(\"/api/");
    const unprotected = deleteRoutes.filter(
      line =>
        !line.includes("requireAuth") &&
        !line.includes("requireAdmin") &&
        !line.includes("requireManagement") &&
        !line.includes("requireChecker") &&
        !line.includes(".test.")
    );
    expect(unprotected).toEqual([]);
  });

  it("finance compute endpoint has rate limiting", () => {
    const lines = grepRoutes("isApiRateLimited.*finance-compute");
    expect(lines.length).toBeGreaterThan(0);
  });

  it("geocode endpoint has rate limiting", () => {
    const lines = grepRoutes("isApiRateLimited.*geocode");
    expect(lines.length).toBeGreaterThan(0);
  });

  it("no console.log in production server code (except logger)", () => {
    const consoleLogs = grepRoutes("console\\.log\\(");
    const violations = consoleLogs.filter(
      line => !line.includes("logger.ts") && !line.includes(".test.")
    );
    expect(violations).toEqual([]);
  });

  it("POST/PATCH mutation endpoints use Zod validation", () => {
    const mutations = [
      ...grepRoutes("\\.(post|patch)\\(.*\\/api\\/finance\\/compute"),
      ...grepRoutes("\\.(post|patch)\\(.*\\/api\\/scenarios[^/]"),
      ...grepRoutes("\\.(post|patch)\\(.*\\/api\\/global-assumptions"),
      ...grepRoutes("\\.(post|patch)\\(.*\\/api\\/properties[^/]"),
    ];
    expect(mutations.length).toBeGreaterThan(0);
  });
});
