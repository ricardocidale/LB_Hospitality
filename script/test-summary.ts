/**
 * Test Summary — runs all tests, outputs only failures + one summary line.
 * Saves ~40-50 lines of token context vs `npm test`.
 *
 * Usage: npm run test:summary
 */
import { execSync } from "child_process";

try {
  const output = execSync("npx vitest run 2>&1", {
    encoding: "utf-8",
    timeout: 180_000,
    maxBuffer: 10 * 1024 * 1024,
  });

  // Extract summary line
  const testsLine = output
    .split("\n")
    .find((l) => l.includes("Tests") && l.includes("passed"));
  const filesLine = output
    .split("\n")
    .find((l) => l.includes("Test Files") && l.includes("passed"));
  const durationLine = output.split("\n").find((l) => l.includes("Duration"));

  const tests = testsLine?.match(/(\d+) passed.*?\((\d+)\)/);
  const files = filesLine?.match(/(\d+) passed.*?\((\d+)\)/);
  const duration = durationLine?.match(/Duration\s+([\d.]+s)/);

  if (tests && files) {
    console.log(
      `PASS ${tests[1]}/${tests[2]} tests (${files[1]} files)${duration ? ` in ${duration[1]}` : ""}`,
    );
  } else {
    console.log("PASS — all tests passed");
  }
} catch (err: any) {
  const output = (err.stdout ?? "") + (err.stderr ?? "");
  const lines = output.split("\n");

  // Show failing test files
  const failLines = lines.filter(
    (l: string) =>
      l.includes("FAIL") || l.includes("✗") || l.includes("×") || l.includes("AssertionError") || l.includes("Error:"),
  );

  if (failLines.length > 0) {
    console.log("FAILURES:");
    for (const line of failLines.slice(0, 15)) {
      console.log("  " + line.trim());
    }
  }

  // Summary
  const failMatch = output.match(/(\d+) failed/);
  const passMatch = output.match(/(\d+) passed/);
  console.log(
    `\nFAIL ${failMatch ? failMatch[1] + " failed" : ""}${passMatch ? ", " + passMatch[1] + " passed" : ""}`,
  );
  process.exit(1);
}
