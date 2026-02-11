/**
 * Verify Summary — runs the 4-phase verification, outputs only failures + opinion.
 * Saves hundreds of lines of verbose test output.
 *
 * Usage: npm run verify:summary
 */
import { execSync } from "child_process";

const phases = [
  { name: "Proof Scenarios", cmd: "npx vitest run tests/proof/scenarios.test.ts 2>&1" },
  { name: "Hardcoded Detection", cmd: "npx vitest run tests/proof/hardcoded-detection.test.ts 2>&1" },
  { name: "Reconciliation", cmd: "npx vitest run tests/proof/reconciliation-report.test.ts 2>&1" },
];

let allPassed = true;
const results: string[] = [];

for (const phase of phases) {
  try {
    const output = execSync(phase.cmd, {
      encoding: "utf-8",
      timeout: 180_000,
      maxBuffer: 10 * 1024 * 1024,
    });
    const testsMatch = output.match(/(\d+) passed.*?\((\d+)\)/);
    results.push(`  ✓ ${phase.name.padEnd(22)} ${testsMatch ? testsMatch[1] + "/" + testsMatch[2] : "PASS"}`);
  } catch (err: any) {
    allPassed = false;
    const output = (err.stdout ?? "") + (err.stderr ?? "");
    const failMatch = output.match(/(\d+) failed/);
    const passMatch = output.match(/(\d+) passed/);

    results.push(`  ✗ ${phase.name.padEnd(22)} ${failMatch ? failMatch[1] + " failed" : "FAIL"}${passMatch ? ", " + passMatch[1] + " passed" : ""}`);

    // Show first few failure details
    const failLines = output
      .split("\n")
      .filter((l: string) => l.includes("AssertionError") || l.includes("Error:") || l.includes("expected"))
      .slice(0, 5);
    for (const line of failLines) {
      results.push(`    → ${line.trim().slice(0, 100)}`);
    }
  }
}

console.log("\n  Verification Summary");
console.log("  " + "─".repeat(44));
for (const r of results) console.log(r);
console.log("  " + "─".repeat(44));
console.log(`  Opinion: ${allPassed ? "UNQUALIFIED" : "ADVERSE"}`);
console.log(`  Status:  ${allPassed ? "PASS" : "FAIL"}\n`);
process.exit(allPassed ? 0 : 1);
