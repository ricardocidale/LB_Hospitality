/**
 * Health Check — compact single-command output for AI token savings.
 * Runs: tsc → tests → verify, outputs ~4-6 lines instead of hundreds.
 *
 * Usage: npm run health
 */
import { execSync } from "child_process";

interface Phase {
  name: string;
  cmd: string;
  parse: (output: string) => string;
}

const phases: Phase[] = [
  {
    name: "TypeScript",
    cmd: "npx tsc --noEmit 2>&1",
    parse: (out) => {
      if (!out.trim()) return "PASS (0 errors)";
      const lines = out.trim().split("\n");
      const errorLine = lines.find((l) => l.includes("error TS"));
      const count = lines.filter((l) => l.includes("error TS")).length;
      return `FAIL (${count} error${count !== 1 ? "s" : ""})${errorLine ? " — " + errorLine.trim().slice(0, 80) : ""}`;
    },
  },
  {
    name: "Tests",
    cmd: "npx vitest run 2>&1",
    parse: (out) => {
      // Strip ANSI escape codes for reliable parsing
      const clean = out.replace(/\x1b\[[0-9;]*m/g, "");
      const failMatch = clean.match(/(\d+) failed/);
      if (failMatch) {
        const failCount = failMatch[1];
        const failLine = clean
          .split("\n")
          .find((l) => l.includes("FAIL") || l.includes("✗") || l.includes("×"));
        return `FAIL (${failCount} failed)${failLine ? " — " + failLine.trim().slice(0, 80) : ""}`;
      }
      const testsMatch = clean.match(/Tests\s+(\d+) passed\s*\((\d+)\)/);
      const filesMatch = clean.match(/Test Files\s+(\d+) passed\s*\((\d+)\)/);
      if (testsMatch && filesMatch) {
        return `PASS (${testsMatch[1]}/${testsMatch[2]} tests, ${filesMatch[1]} files)`;
      }
      return clean.includes("passed") ? "PASS" : "FAIL (see npm test)";
    },
  },
  {
    name: "Verification",
    cmd: "npx tsx tests/proof/verify-runner.ts 2>&1",
    parse: (out) => {
      if (out.includes("ALL PHASES PASSED")) {
        const timeMatch = out.match(/Time:\s*([\d.]+s)/);
        return `PASS — UNQUALIFIED${timeMatch ? ` (${timeMatch[1]})` : ""}`;
      }
      // Find which phase failed
      const failedPhases: string[] = [];
      if (out.includes("Proof scenario tests FAILED"))
        failedPhases.push("scenarios");
      if (out.includes("Magic number detection FAILED"))
        failedPhases.push("hardcoded values");
      if (out.includes("Reconciliation report generation FAILED"))
        failedPhases.push("reconciliation");
      return `FAIL — ${failedPhases.join(", ") || "see npm run verify"}`;
    },
  },
];

console.log("\n  Health Check");
console.log("  " + "─".repeat(44));

let allPassed = true;

for (const phase of phases) {
  try {
    const output = execSync(phase.cmd, {
      timeout: 180_000,
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024,
    });
    const result = phase.parse(output);
    const passed = result.startsWith("PASS");
    if (!passed) allPassed = false;
    console.log(
      `  ${passed ? "✓" : "✗"} ${phase.name.padEnd(16)} ${result}`,
    );
  } catch (err: any) {
    allPassed = false;
    const output = (err.stdout ?? "") + (err.stderr ?? "");
    const result = phase.parse(output);
    console.log(`  ✗ ${phase.name.padEnd(16)} ${result}`);
  }
}

console.log("  " + "─".repeat(44));
console.log(`  ${allPassed ? "✓ ALL CLEAR" : "✗ ISSUES FOUND"}\n`);
process.exit(allPassed ? 0 : 1);
