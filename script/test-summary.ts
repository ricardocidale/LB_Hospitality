/**
 * Test Summary — runs all tests, outputs only failures + one summary line.
 * Saves ~40-50 lines of token context vs `npm test`.
 *
 * Usage: npm run test:summary
 */
import { execSync } from "child_process";

try {
  const raw = execSync("npx vitest run 2>&1", {
    encoding: "utf-8",
    timeout: 180_000,
    maxBuffer: 10 * 1024 * 1024,
  });

  const output = raw.replace(/\x1b\[[0-9;]*m/g, "");

  const testsLine = output
    .split("\n")
    .find((l) => l.includes("Tests") && (l.includes("passed") || l.includes("skipped")));
  const filesLine = output
    .split("\n")
    .find((l) => l.includes("Test Files") && (l.includes("passed") || l.includes("skipped")));
  const durationLine = output.split("\n").find((l) => l.includes("Duration"));

  const tests = testsLine?.match(/(\d+)\s+passed/);
  const skipped = testsLine?.match(/(\d+)\s+skipped/);
  const totalTests = testsLine?.match(/\((\d+)\)/);
  const files = filesLine?.match(/(\d+)\s+passed/);
  const skippedFiles = filesLine?.match(/(\d+)\s+skipped/);
  const duration = durationLine?.match(/Duration\s+([\d.]+s)/);

  const parts: string[] = [];
  if (tests) parts.push(`${tests[1]} passed`);
  if (skipped && parseInt(skipped[1]) > 0) parts.push(`${skipped[1]} skipped`);
  const total = totalTests ? totalTests[1] : tests?.[1] ?? "?";
  const fileCount = files ? files[1] : "?";
  const skippedFileCount = skippedFiles && parseInt(skippedFiles[1]) > 0 ? `, ${skippedFiles[1]} skipped` : "";

  console.log(
    `PASS ${parts.join(", ")} (${total} total, ${fileCount} files${skippedFileCount})${duration ? ` in ${duration[1]}` : ""}`,
  );
} catch (err: any) {
  const raw = (err.stdout ?? "") + (err.stderr ?? "");
  const output = raw.replace(/\x1b\[[0-9;]*m/g, "");
  const lines = output.split("\n");

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

  const failMatch = output.match(/(\d+) failed/);
  const passMatch = output.match(/(\d+) passed/);
  const skipMatch = output.match(/(\d+) skipped/);
  const parts: string[] = [];
  if (failMatch) parts.push(`${failMatch[1]} failed`);
  if (passMatch) parts.push(`${passMatch[1]} passed`);
  if (skipMatch && parseInt(skipMatch[1]) > 0) parts.push(`${skipMatch[1]} skipped`);
  console.log(`\nFAIL ${parts.join(", ")}`);
  process.exit(1);
}
