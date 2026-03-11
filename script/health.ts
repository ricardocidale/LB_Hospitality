/**
 * Health Check — compact single-command output for AI token savings.
 * Runs: tsc → tests (including proof tests) → doc harmony, outputs ~5-7 lines.
 *
 * Optimization: proof test results are parsed from the single vitest run,
 * avoiding a redundant verify-runner invocation.
 *
 * Usage: npm run health
 */
import { execSync } from "child_process";
import { readFileSync } from "fs";

const PROOF_FILES = [
  "scenarios.test.ts",
  "hardcoded-detection.test.ts",
  "golden-values.test.ts",
  "reconciliation-report.test.ts",
  "data-integrity.test.ts",
  "portfolio-dynamics.test.ts",
  "recalculation-enforcement.test.ts",
  "rule-compliance.test.ts",
];

function parseTestOutput(raw: string): { passed: boolean; summary: string; clean: string } {
  const clean = raw.replace(/\x1b\[[0-9;]*m/g, "");
  const failMatch = clean.match(/(\d+) failed/);
  if (failMatch) {
    const failCount = failMatch[1];
    const failLine = clean
      .split("\n")
      .find((l) => l.includes("FAIL") || l.includes("✗") || l.includes("×"));
    return {
      passed: false,
      summary: `FAIL (${failCount} failed)${failLine ? " — " + failLine.trim().slice(0, 80) : ""}`,
      clean,
    };
  }
  const testsMatch = clean.match(/Tests\s+(\d+)\s+passed\s*(?:\|\s*\d+\s+skipped\s*)?\((\d+)\)/);
  const filesMatch = clean.match(/Test Files\s+(\d+)\s+passed\s*(?:\|\s*\d+\s+skipped\s*)?\((\d+)\)/);
  if (testsMatch && filesMatch) {
    return {
      passed: true,
      summary: `PASS (${testsMatch[1]}/${testsMatch[2]} tests, ${filesMatch[1]} files)`,
      clean,
    };
  }
  return {
    passed: clean.includes("passed") && !clean.includes("failed"),
    summary: clean.includes("passed") ? "PASS" : "FAIL (see npm test)",
    clean,
  };
}

function parseVerificationFromTestOutput(clean: string): { passed: boolean; summary: string } {
  const startTime = Date.now();
  let allProofPassed = true;

  for (const file of PROOF_FILES) {
    const fileRegex = new RegExp(file.replace(".test.ts", ""));
    const lines = clean.split("\n").filter((l) => fileRegex.test(l));
    const hasFail = lines.some(
      (l) => l.includes("FAIL") || l.includes("✗") || l.includes("×"),
    );
    if (hasFail) {
      allProofPassed = false;
      break;
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  if (allProofPassed) {
    return { passed: true, summary: `PASS — UNQUALIFIED (${elapsed}s)` };
  }
  const failedNames = PROOF_FILES.filter((file) => {
    const fileRegex = new RegExp(file.replace(".test.ts", ""));
    return clean.split("\n").filter((l) => fileRegex.test(l)).some(
      (l) => l.includes("FAIL") || l.includes("✗") || l.includes("×"),
    );
  }).map((f) => f.replace(".test.ts", ""));
  return { passed: false, summary: `FAIL — ${failedNames.join(", ")}` };
}

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
let testRawOutput = "";
let testCleanOutput = "";

// Phase 1: TypeScript
try {
  const output = execSync("npx tsc --noEmit 2>&1", {
    timeout: 180_000,
    encoding: "utf-8",
    maxBuffer: 10 * 1024 * 1024,
  });
  if (!output.trim()) {
    console.log(`  ✓ ${"TypeScript".padEnd(16)} PASS (0 errors)`);
  } else {
    const lines = output.trim().split("\n");
    const count = lines.filter((l) => l.includes("error TS")).length;
    if (count > 0) {
      allPassed = false;
      const errorLine = lines.find((l) => l.includes("error TS"));
      console.log(`  ✗ ${"TypeScript".padEnd(16)} FAIL (${count} error${count !== 1 ? "s" : ""})${errorLine ? " — " + errorLine.trim().slice(0, 80) : ""}`);
    } else {
      console.log(`  ✓ ${"TypeScript".padEnd(16)} PASS (0 errors)`);
    }
  }
} catch (err: any) {
  const output = (err.stdout ?? "") + (err.stderr ?? "");
  const lines = output.trim().split("\n");
  const count = lines.filter((l: string) => l.includes("error TS")).length;
  if (count > 0) {
    allPassed = false;
    const errorLine = lines.find((l: string) => l.includes("error TS"));
    console.log(`  ✗ ${"TypeScript".padEnd(16)} FAIL (${count} error${count !== 1 ? "s" : ""})${errorLine ? " — " + errorLine.trim().slice(0, 80) : ""}`);
  } else {
    console.log(`  ✓ ${"TypeScript".padEnd(16)} PASS (0 errors)`);
  }
}

// Phase 2: Tests (single vitest run — includes all proof tests)
try {
  testRawOutput = execSync("npx vitest run 2>&1", {
    timeout: 180_000,
    encoding: "utf-8",
    maxBuffer: 10 * 1024 * 1024,
  });
} catch (err: any) {
  testRawOutput = (err.stdout ?? "") + (err.stderr ?? "");
}

const testResult = parseTestOutput(testRawOutput);
testCleanOutput = testResult.clean;
if (!testResult.passed) allPassed = false;
console.log(`  ${testResult.passed ? "✓" : "✗"} ${"Tests".padEnd(16)} ${testResult.summary}`);

// Phase 3: Verification (parsed from the same test output — no re-run)
const verifyResult = parseVerificationFromTestOutput(testCleanOutput);
if (!verifyResult.passed) allPassed = false;
console.log(`  ${verifyResult.passed ? "✓" : "✗"} ${"Verification".padEnd(16)} ${verifyResult.summary}`);

// Phase 4: Doc Harmony
{
  const result = checkDocHarmony(testRawOutput);
  const passed = result.startsWith("PASS");
  if (!passed) allPassed = false;
  console.log(`  ${passed ? "✓" : "✗"} ${"Doc Harmony".padEnd(16)} ${result}`);
}

console.log("  " + "─".repeat(44));
console.log(`  ${allPassed ? "✓ ALL CLEAR" : "✗ ISSUES FOUND"}\n`);
process.exit(allPassed ? 0 : 1);
