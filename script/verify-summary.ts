/**
 * Verify Summary — runs 8-phase financial verification in a single vitest invocation.
 * Outputs only failures + audit opinion. ~3× faster than running each phase separately.
 *
 * Usage: npm run verify:summary
 */
import { execSync } from "child_process";

const phases = [
  { name: "Proof Scenarios", file: "scenarios.test.ts" },
  { name: "Hardcoded Detection", file: "hardcoded-detection.test.ts" },
  { name: "Golden Values", file: "golden-values.test.ts" },
  { name: "Reconciliation", file: "reconciliation-report.test.ts" },
  { name: "Data Integrity", file: "data-integrity.test.ts" },
  { name: "Portfolio Dynamics", file: "portfolio-dynamics.test.ts" },
  { name: "Recalc Enforcement", file: "recalculation-enforcement.test.ts" },
  { name: "Rule Compliance", file: "rule-compliance.test.ts" },
];

const allFiles = phases.map((p) => `tests/proof/${p.file}`).join(" ");
let allPassed = true;
const results: string[] = [];

function parseOutput(raw: string) {
  const clean = raw.replace(/\x1b\[[0-9;]*m/g, "");
  const lines = clean.split("\n");

  for (const phase of phases) {
    const fileLine = lines.find((l) => l.includes(phase.file));

    if (!fileLine) {
      allPassed = false;
      results.push(`  ✗ ${phase.name.padEnd(22)} FAIL (not found in output)`);
      continue;
    }

    const isFail = fileLine.includes("×") || fileLine.includes("✗") || fileLine.trimStart().startsWith("×");
    const isPass = fileLine.includes("✓") || fileLine.trimStart().startsWith("✓");

    if (isFail) {
      allPassed = false;
      const testCount = fileLine.match(/\((\d+) tests?.*?\)/);
      results.push(`  ✗ ${phase.name.padEnd(22)} FAIL${testCount ? ` (${testCount[1]} tests)` : ""}`);

      const failDetails = lines
        .filter((l: string) =>
          (l.includes("AssertionError") || l.includes("expected") || l.includes("Error:")) &&
          !l.includes("node_modules"),
        )
        .slice(0, 3);
      for (const line of failDetails) {
        results.push(`    → ${line.trim().slice(0, 100)}`);
      }
    } else if (isPass) {
      const testCount = fileLine.match(/\((\d+) tests?.*?\)/);
      results.push(`  ✓ ${phase.name.padEnd(22)} PASS${testCount ? ` (${testCount[1]})` : ""}`);
    } else {
      allPassed = false;
      results.push(`  ✗ ${phase.name.padEnd(22)} UNKNOWN`);
    }
  }
}

try {
  const raw = execSync(`npx vitest run ${allFiles} 2>&1`, {
    encoding: "utf-8",
    timeout: 180_000,
    maxBuffer: 10 * 1024 * 1024,
  });
  parseOutput(raw);
} catch (err: any) {
  const raw = (err.stdout ?? "") + (err.stderr ?? "");
  parseOutput(raw);
}

console.log("\n  Verification Summary");
console.log("  " + "─".repeat(44));
for (const r of results) console.log(r);
console.log("  " + "─".repeat(44));
console.log(`  Opinion: ${allPassed ? "UNQUALIFIED" : "ADVERSE"}`);
console.log(`  Status:  ${allPassed ? "PASS" : "FAIL"}\n`);
process.exit(allPassed ? 0 : 1);
