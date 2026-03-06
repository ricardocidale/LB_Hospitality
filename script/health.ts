/**
 * Health Check — compact single-command output for AI token savings.
 * Runs: tsc → tests → verify → doc harmony, outputs ~5-7 lines instead of hundreds.
 *
 * Usage: npm run health
 */
import { execSync } from "child_process";
import { readFileSync } from "fs";

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

function checkDocHarmony(rawTestOutput: string): string {
  const claudeMd = readFileSync(".claude/claude.md", "utf-8");
  const replitMd = readFileSync("replit.md", "utf-8");

  const clean = rawTestOutput.replace(/\x1b\[[0-9;]*m/g, "");
  const totalMatch = clean.match(/Tests\s+\d+\s+passed\s*(?:\|\s*\d+\s+skipped\s*)?\((\d+)\)/);
  const actualTests = totalMatch ? parseInt(totalMatch[1], 10) : 0;

  const rulesOut = execSync("ls .claude/rules/*.md 2>/dev/null | wc -l", { encoding: "utf-8", timeout: 5_000 });
  const actualRules = parseInt(rulesOut.trim(), 10) || 0;

  if (actualTests === 0) return "PASS (skipped — no test count)";

  const stale: string[] = [];

  function checkAll(content: string, file: string, pattern: RegExp, actual: number, label: string) {
    let m: RegExpExecArray | null;
    const re = new RegExp(pattern.source, "g");
    while ((m = re.exec(content)) !== null) {
      const documented = parseInt(m[1].replace(/,/g, ""), 10);
      if (documented !== actual) {
        stale.push(`${label}: ${file} says ${documented}, actual ${actual}`);
      }
    }
  }

  checkAll(claudeMd, "claude.md", /(\d[,\d]*)\s*tests/, actualTests, "tests");
  checkAll(replitMd, "replit.md", /(\d[,\d]*)\s*tests/, actualTests, "tests");
  checkAll(claudeMd, "claude.md", /Rules\s*\((\d+)/, actualRules, "rules");
  checkAll(replitMd, "replit.md", /rules\/?\s*\((\d+)/i, actualRules, "rules");

  if (stale.length === 0) return "PASS";
  const unique = [...new Set(stale)];
  return `FAIL — ${unique[0]}${unique.length > 1 ? ` (+${unique.length - 1} more)` : ""}`;
}

console.log("\n  Health Check");
console.log("  " + "─".repeat(44));

let allPassed = true;
let testOutput = "";

for (const phase of phases) {
  try {
    const output = execSync(phase.cmd, {
      timeout: 180_000,
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024,
    });
    if (phase.name === "Tests") testOutput = output;
    const result = phase.parse(output);
    const passed = result.startsWith("PASS");
    if (!passed) allPassed = false;
    console.log(
      `  ${passed ? "✓" : "✗"} ${phase.name.padEnd(16)} ${result}`,
    );
  } catch (err: any) {
    const output = (err.stdout ?? "") + (err.stderr ?? "");
    if (phase.name === "Tests") testOutput = output;
    const result = phase.parse(output);
    const passed = result.startsWith("PASS");
    if (!passed) allPassed = false;
    console.log(
      `  ${passed ? "✓" : "✗"} ${phase.name.padEnd(16)} ${result}`,
    );
  }
}

{
  const result = checkDocHarmony(testOutput);
  const passed = result.startsWith("PASS");
  if (!passed) allPassed = false;
  console.log(`  ${passed ? "✓" : "✗"} ${"Doc Harmony".padEnd(16)} ${result}`);
}

console.log("  " + "─".repeat(44));
console.log(`  ${allPassed ? "✓ ALL CLEAR" : "✗ ISSUES FOUND"}\n`);
process.exit(allPassed ? 0 : 1);
