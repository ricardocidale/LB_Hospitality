import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

// ─────────────────────────────────────────────────────────────
// Helper: recursively collect .ts files from a directory
// ─────────────────────────────────────────────────────────────
function collectTsFiles(dir: string, results: string[] = []): string[] {
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectTsFiles(full, results);
    } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
      results.push(full);
    }
  }
  return results;
}

// ─────────────────────────────────────────────────────────────
// Section 1: Admin config literals
// Rule: no-hardcoded-admin-config.md
// ─────────────────────────────────────────────────────────────
describe("Admin config literals (no-hardcoded-admin-config)", () => {
  const FORBIDDEN_ADMIN_STRINGS = [
    "Norfolk Group",
    "KIT Capital",
    "Hospitality Business Group",
    "Boutique Hotel",
    "Estate Hotel",
    "Fluid Glass",
  ];

  // Directories to scan
  const SCAN_DIRS = [
    path.resolve("client/src/lib"),
    path.resolve("server"),
  ];

  // Files/paths where these strings are allowed
  function isExempt(filePath: string): boolean {
    const rel = path.relative(path.resolve("."), filePath).replace(/\\/g, "/");
    // Seed files (any file with "seed" in the path)
    if (/seed/i.test(rel)) return true;
    // Test files
    if (rel.endsWith(".test.ts") || rel.endsWith(".test.tsx")) return true;
    if (rel.includes("__test__") || rel.includes("__tests__")) return true;
    // Markdown files
    if (rel.endsWith(".md")) return true;
    // Knowledge base and agent config (Marcela AI system prompts)
    if (rel.includes("knowledge-base")) return true;
    if (rel.includes("marcela-agent-config")) return true;
    if (rel.includes("elevenlabs-audio")) return true;
    // .claude directory
    if (rel.startsWith(".claude/")) return true;
    // Seeds directory
    if (rel.includes("server/seeds/")) return true;
    // Sync helpers (fill-only seed defaults per database-seeding.md)
    if (rel.includes("syncHelpers")) return true;
    // Auth file contains seedAdminUser() which is a seed mechanism (database-seeding.md)
    if (rel.includes("server/auth")) return true;
    // AI/Marcela system prompts and tool context — same role as marcela-agent-config
    if (rel.includes("replit_integrations/chat")) return true;
    if (rel.includes("routes/marcela")) return true;
    if (rel.includes("routes/twilio")) return true;
    if (rel.includes("routes/calculations")) return true;
    // Branding route (fallback company name resolved from DB, literal is last-resort default)
    if (rel.includes("routes/branding")) return true;
    // Export templates use company name as fallback when branding data unavailable
    if (rel.includes("exports/")) return true;
    // Verification runner (display-only fallback)
    if (rel.includes("runVerification")) return true;
    return false;
  }

  it("no forbidden admin-config strings in client/src/lib/ or server/ (outside exemptions)", () => {
    const violations: string[] = [];

    for (const dir of SCAN_DIRS) {
      const files = collectTsFiles(dir);
      for (const filePath of files) {
        if (isExempt(filePath)) continue;

        const content = fs.readFileSync(filePath, "utf-8");
        const lines = content.split("\n");

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const trimmed = line.trim();
          // Skip comments
          if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) continue;

          for (const forbidden of FORBIDDEN_ADMIN_STRINGS) {
            if (line.includes(forbidden)) {
              const rel = path.relative(path.resolve("."), filePath).replace(/\\/g, "/");
              violations.push(
                `  ${rel}:${i + 1} — found "${forbidden}"\n    ${trimmed.substring(0, 120)}`
              );
            }
          }
        }
      }
    }

    if (violations.length > 0) {
      expect.fail(
        `Found ${violations.length} hardcoded admin-config string(s) outside allowed files:\n` +
        `${violations.join("\n")}\n\n` +
        `These values are managed through the Administration page and must come from the database.\n` +
        `Allowed locations: seed files, test files, knowledge-base.ts, marcela-agent-config.ts, .claude/ files.`
      );
    }
  });
});

// ─────────────────────────────────────────────────────────────
// Section 2: Constants re-export parity
// Rule: constants-and-config.md
// ─────────────────────────────────────────────────────────────
describe("Constants re-export parity (constants-and-config)", () => {
  const sharedPath = path.resolve("shared/constants.ts");
  const clientPath = path.resolve("client/src/lib/constants.ts");

  it("shared/constants.ts exists", () => {
    expect(fs.existsSync(sharedPath), "shared/constants.ts must exist").toBe(true);
  });

  it("client/src/lib/constants.ts exists", () => {
    expect(fs.existsSync(clientPath), "client/src/lib/constants.ts must exist").toBe(true);
  });

  it("client constants file re-exports from @shared/constants", () => {
    if (!fs.existsSync(clientPath)) return;
    const content = fs.readFileSync(clientPath, "utf-8");
    const hasSharedImport =
      content.includes('from "@shared/constants"') ||
      content.includes("from '@shared/constants'") ||
      content.includes('from "../../shared/constants"') ||
      content.includes("from '../../shared/constants'");
    expect(
      hasSharedImport,
      `client/src/lib/constants.ts must re-export from @shared/constants`
    ).toBe(true);
  });

  it("all DEFAULT_*, DEPRECIATION_*, DAYS_* from shared are re-exported in client", () => {
    if (!fs.existsSync(sharedPath) || !fs.existsSync(clientPath)) return;

    const sharedContent = fs.readFileSync(sharedPath, "utf-8");
    const clientContent = fs.readFileSync(clientPath, "utf-8");

    // Extract all exported constant names matching the target patterns
    const exportRegex = /export\s+const\s+((?:DEFAULT_|DEPRECIATION_|DAYS_)[A-Z_0-9]+)\b/g;
    const sharedExports: string[] = [];
    let match;
    while ((match = exportRegex.exec(sharedContent)) !== null) {
      sharedExports.push(match[1]);
    }

    // Filter to financial constants only (skip AI agent, service template, service model constants
    // that may be server-only)
    const financialConstants = sharedExports.filter((name) => {
      // These are core financial constants that the client must have
      if (name.startsWith("DEFAULT_COST_RATE_")) return true;
      if (name.startsWith("DEFAULT_REV_SHARE_")) return true;
      if (name === "DEPRECIATION_YEARS") return true;
      if (name === "DAYS_PER_MONTH") return true;
      if (name === "DEFAULT_EXIT_CAP_RATE") return true;
      if (name === "DEFAULT_TAX_RATE") return true;
      if (name === "DEFAULT_COMMISSION_RATE") return true;
      if (name === "DEFAULT_LAND_VALUE_PERCENT") return true;
      if (name === "DEFAULT_CATERING_BOOST_PCT") return true;
      if (name === "DEFAULT_EVENT_EXPENSE_RATE") return true;
      if (name === "DEFAULT_OTHER_EXPENSE_RATE") return true;
      if (name === "DEFAULT_UTILITIES_VARIABLE_SPLIT") return true;
      if (name === "DEFAULT_OCCUPANCY_RAMP_MONTHS") return true;
      if (name === "DEFAULT_BASE_MANAGEMENT_FEE_RATE") return true;
      if (name === "DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE") return true;
      if (name === "DEFAULT_SAFE_VALUATION_CAP") return true;
      if (name === "DEFAULT_SAFE_DISCOUNT_RATE") return true;
      if (name === "DEFAULT_FIXED_COST_ESCALATION_RATE") return true;
      if (name === "DEFAULT_COMPANY_TAX_RATE") return true;
      if (name === "DEFAULT_PROJECTION_YEARS") return true;
      if (name === "DEFAULT_SERVICE_FEE_CATEGORIES") return true;
      return false;
    });

    // Check each financial constant is re-exported in the client file
    const missing = financialConstants.filter((name) => {
      // Check for re-export in an export { ... } block or direct export
      return !clientContent.includes(name);
    });

    if (missing.length > 0) {
      expect.fail(
        `client/src/lib/constants.ts is missing re-exports for ${missing.length} shared constant(s):\n` +
        `  ${missing.join("\n  ")}\n\n` +
        `Add these to the export { ... } from "@shared/constants" block in client/src/lib/constants.ts.`
      );
    }
  });
});

// ─────────────────────────────────────────────────────────────
// Section 3: parseLocalDate single source of truth
// Rule: context-reduction.md
// ─────────────────────────────────────────────────────────────
describe("parseLocalDate single source of truth (context-reduction)", () => {
  const CANONICAL_FILE = path.resolve("shared/dates.ts");

  it("shared/dates.ts exists with parseLocalDate definition", () => {
    expect(
      fs.existsSync(CANONICAL_FILE),
      "shared/dates.ts must exist as the canonical location for parseLocalDate"
    ).toBe(true);

    const content = fs.readFileSync(CANONICAL_FILE, "utf-8");
    expect(
      /export\s+function\s+parseLocalDate/.test(content),
      "shared/dates.ts must export parseLocalDate"
    ).toBe(true);
  });

  it("no local parseLocalDate definitions outside shared/dates.ts", () => {
    const scanDirs = [
      path.resolve("client/src"),
      path.resolve("server"),
      path.resolve("calc"),
      path.resolve("shared"),
    ];

    const violations: string[] = [];

    for (const dir of scanDirs) {
      const files = collectTsFiles(dir);
      for (const filePath of files) {
        // Skip the canonical file
        if (path.resolve(filePath) === CANONICAL_FILE) continue;
        // Skip test files
        if (filePath.endsWith(".test.ts") || filePath.endsWith(".test.tsx")) continue;

        const content = fs.readFileSync(filePath, "utf-8");
        const lines = content.split("\n");

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          // Match local function definitions (not re-exports)
          if (/function\s+parseLocalDate\s*\(/.test(line)) {
            // Allow re-exports like: export { parseLocalDate } from ...
            if (/export\s*\{[^}]*parseLocalDate[^}]*\}\s*from/.test(line)) continue;
            const rel = path.relative(path.resolve("."), filePath).replace(/\\/g, "/");
            violations.push(
              `  ${rel}:${i + 1} — local function definition found\n    ${line.trim().substring(0, 120)}`
            );
          }
        }
      }
    }

    if (violations.length > 0) {
      expect.fail(
        `Found ${violations.length} local parseLocalDate definition(s) outside shared/dates.ts:\n` +
        `${violations.join("\n")}\n\n` +
        `parseLocalDate must be defined ONLY in shared/dates.ts.\n` +
        `Other files should import it: import { parseLocalDate } from "@shared/dates";`
      );
    }
  });
});

// ─────────────────────────────────────────────────────────────
// Section 4: .claude is the sole source of truth
// Rule: claude-is-sole-truth.md
// ─────────────────────────────────────────────────────────────
describe(".claude is the sole source of truth (claude-is-sole-truth)", () => {
  const ROOT = path.resolve(".");
  const claudeMd = path.join(ROOT, ".claude", "claude.md");
  const replitMd = path.join(ROOT, "replit.md");

  it(".claude/claude.md exists as the master document", () => {
    expect(
      fs.existsSync(claudeMd),
      ".claude/claude.md must exist as the sole source of truth"
    ).toBe(true);
  });

  it(".claude/claude.md contains required sections", () => {
    if (!fs.existsSync(claudeMd)) return;
    const content = fs.readFileSync(claudeMd, "utf-8");
    const required = ["Architecture", "Rules", "Session"];
    const missing = required.filter((s) => !content.includes(s));
    expect(
      missing.length,
      `.claude/claude.md is missing required sections: ${missing.join(", ")}`
    ).toBe(0);
  });

  it("replit.md exists and is a slim pointer (≤ 150 lines)", () => {
    expect(fs.existsSync(replitMd), "replit.md must exist").toBe(true);
    if (!fs.existsSync(replitMd)) return;
    const lines = fs.readFileSync(replitMd, "utf-8").split("\n").length;
    expect(
      lines,
      `replit.md must be ≤ 150 lines (slim pointer only). Currently ${lines} lines. Move details to .claude/claude.md.`
    ).toBeLessThanOrEqual(150);
  });

  it("replit.md references .claude/claude.md as the master document", () => {
    if (!fs.existsSync(replitMd)) return;
    const content = fs.readFileSync(replitMd, "utf-8");
    const hasRef =
      content.includes(".claude/claude.md") ||
      content.includes(".claude\\claude.md");
    expect(
      hasRef,
      "replit.md must reference .claude/claude.md as the authoritative document"
    ).toBe(true);
  });

  it("no root-level CLAUDE.md or instructions.md that could shadow .claude/", () => {
    const forbidden = ["CLAUDE.md", "instructions.md", "INSTRUCTIONS.md"];
    const found = forbidden.filter((f) => fs.existsSync(path.join(ROOT, f)));
    expect(
      found,
      `Found root-level file(s) that could shadow .claude/: ${found.join(", ")}. ` +
      `All project knowledge must live inside .claude/.`
    ).toHaveLength(0);
  });

  it("replit.md exists and contains a pointer to .claude/claude.md", () => {
    expect(fs.existsSync(replitMd), "replit.md must exist").toBe(true);
    if (!fs.existsSync(replitMd)) return;
    const content = fs.readFileSync(replitMd, "utf-8");
    const hasPointer =
      content.includes(".claude/claude.md") ||
      content.includes(".claude/");
    expect(
      hasPointer,
      "replit.md must contain a pointer to .claude/ as the project knowledge source"
    ).toBe(true);
  });

  it("no .md rule files exist outside .claude/rules/", () => {
    // Only check known alternative locations — not the whole repo
    const suspectDirs = [
      path.join(ROOT, "docs"),
      path.join(ROOT, ".github"),
    ];
    const violations: string[] = [];
    for (const dir of suspectDirs) {
      if (!fs.existsSync(dir)) continue;
      const entries = fs.readdirSync(dir);
      for (const entry of entries) {
        if (/^(rules?|constraints?|instructions?)\.md$/i.test(entry)) {
          violations.push(path.join(dir, entry));
        }
      }
    }
    expect(
      violations,
      `Found rule/instruction files outside .claude/rules/: ${violations.join(", ")}. ` +
      `All binding rules must live in .claude/rules/.`
    ).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────
// Section 5: No raw Date constructor with date strings in
// financial engine files (prevents timezone bugs)
// ─────────────────────────────────────────────────────────────
describe("No raw Date constructor with date strings in financial files", () => {
  const FINANCE_ENGINE_FILES = [
    "client/src/lib/financial/property-engine.ts",
    "client/src/lib/financial/company-engine.ts",
    "client/src/lib/financial/utils.ts",
    "client/src/lib/cashFlowAggregator.ts",
    "client/src/lib/yearlyAggregator.ts",
    "client/src/lib/equityCalculations.ts",
    "client/src/lib/loanCalculations.ts",
  ];

  // Pattern: new Date("20... — raw date string construction
  const RAW_DATE_PATTERN = /new\s+Date\s*\(\s*["']20/;

  it("financial engine files do not use raw new Date() with date strings", () => {
    const violations: string[] = [];

    for (const relFile of FINANCE_ENGINE_FILES) {
      const absPath = path.resolve(relFile);
      if (!fs.existsSync(absPath)) continue;

      const content = fs.readFileSync(absPath, "utf-8");
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Skip comments
        if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) continue;

        if (RAW_DATE_PATTERN.test(line)) {
          // Exception: lines that already include T00:00:00 (which is what parseLocalDate does)
          if (line.includes("T00:00:00")) continue;

          violations.push(
            `  ${relFile}:${i + 1} — raw new Date("20...") found\n    ${trimmed.substring(0, 120)}`
          );
        }
      }
    }

    if (violations.length > 0) {
      expect.fail(
        `Found ${violations.length} raw Date constructor call(s) with date strings in financial files:\n` +
        `${violations.join("\n")}\n\n` +
        `Use parseLocalDate() instead of new Date("YYYY-MM-DD") to prevent timezone bugs.\n` +
        `Import from shared/dates.ts: import { parseLocalDate } from "@shared/dates";`
      );
    }
  });
});
