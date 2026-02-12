/**
 * Test File — runs a single test file with compact summary output.
 * Shows pass/fail count + first few failures if any.
 *
 * Usage: npm run test:file -- tests/engine/loan-calculations.test.ts
 *        npm run test:file -- tests/calc/validation/
 */
import { execSync } from "child_process";

const target = process.argv[2];
if (!target) {
  console.log("Usage: npm run test:file -- <path>");
  console.log("  npm run test:file -- tests/engine/loan-calculations.test.ts");
  console.log("  npm run test:file -- tests/calc/validation/");
  process.exit(1);
}

try {
  const output = execSync(`npx vitest run ${target} 2>&1`, {
    encoding: "utf-8",
    timeout: 120_000,
    maxBuffer: 10 * 1024 * 1024,
  });

  const clean = output.replace(/\x1b\[[0-9;]*m/g, "");
  const testsMatch = clean.match(/Tests\s+(\d+) passed\s*\((\d+)\)/);
  const filesMatch = clean.match(/Test Files\s+(\d+) passed\s*\((\d+)\)/);
  const duration = clean.match(/Duration\s+([\d.]+s)/);

  if (testsMatch && filesMatch) {
    console.log(
      `PASS ${testsMatch[1]}/${testsMatch[2]} tests (${filesMatch[1]} files)${duration ? ` in ${duration[1]}` : ""}`,
    );
  } else {
    console.log("PASS");
  }
} catch (err: any) {
  const output = ((err.stdout ?? "") + (err.stderr ?? "")).replace(/\x1b\[[0-9;]*m/g, "");

  // Show failing test names
  const failLines = output
    .split("\n")
    .filter(
      (l: string) =>
        l.includes("FAIL") ||
        l.includes("AssertionError") ||
        l.includes("Error:") ||
        l.includes("expected"),
    )
    .slice(0, 10);

  if (failLines.length > 0) {
    console.log("FAILURES:");
    for (const line of failLines) {
      console.log("  " + line.trim().slice(0, 120));
    }
  }

  const failMatch = output.match(/(\d+) failed/);
  const passMatch = output.match(/(\d+) passed/);
  console.log(
    `FAIL ${failMatch ? failMatch[1] + " failed" : ""}${passMatch ? ", " + passMatch[1] + " passed" : ""}`,
  );
  process.exit(1);
}
