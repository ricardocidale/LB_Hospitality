/**
 * Lint Summary — runs tsc --noEmit, outputs 1 compact line.
 * On success: "PASS 0 errors"
 * On failure: "FAIL 12 errors" + first 10 error locations
 *
 * Usage: npm run lint:summary
 */
import { execSync } from "child_process";

try {
  execSync("npx tsc --noEmit 2>&1", {
    encoding: "utf-8",
    timeout: 120_000,
    maxBuffer: 10 * 1024 * 1024,
  });
  console.log("PASS 0 errors");
} catch (err: any) {
  const output = (err.stdout ?? "") + (err.stderr ?? "");
  const lines = output.trim().split("\n");
  const errors = lines.filter((l: string) => l.includes("error TS"));
  console.log(`FAIL ${errors.length} error${errors.length !== 1 ? "s" : ""}`);
  for (const line of errors.slice(0, 10)) {
    console.log("  " + line.trim().slice(0, 120));
  }
  if (errors.length > 10) {
    console.log(`  ... and ${errors.length - 10} more`);
  }
  process.exit(1);
}
