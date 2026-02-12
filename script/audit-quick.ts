/**
 * Audit Quick — fast code quality scan in ~15-20 lines.
 * Checks: `any` types in finance paths, TODO/FIXME/HACK counts,
 * console.log in production code, empty catch blocks, large files.
 *
 * Usage: npm run audit:quick
 */
import { execSync } from "child_process";

function grep(pattern: string, path: string, glob?: string): string[] {
  try {
    const globFlag = glob ? ` --glob '${glob}'` : "";
    const out = execSync(`rg -n '${pattern}' ${path}${globFlag} 2>/dev/null`, {
      encoding: "utf-8",
      timeout: 15_000,
      maxBuffer: 5 * 1024 * 1024,
    });
    return out.trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

function countMatches(pattern: string, path: string, glob?: string): number {
  return grep(pattern, path, glob).length;
}

interface Finding {
  label: string;
  count: number;
  severity: "critical" | "warning" | "info";
  samples: string[];
}

const findings: Finding[] = [];

// 1. `any` types in finance calculation paths
const financeFiles = [
  "client/src/lib/financialEngine.ts",
  "client/src/lib/loanCalculations.ts",
  "client/src/lib/yearlyAggregator.ts",
  "client/src/lib/cashFlowAggregator.ts",
  "client/src/lib/equityCalculations.ts",
  "calc/",
];
let anyCount = 0;
let anySamples: string[] = [];
for (const f of financeFiles) {
  const matches = grep(": any[^.]|as any", f);
  anyCount += matches.length;
  anySamples.push(...matches);
}
findings.push({
  label: "`any` types in finance code",
  count: anyCount,
  severity: anyCount > 0 ? "critical" : "info",
  samples: anySamples.slice(0, 3),
});

// 2. TODO/FIXME/HACK in source code
const todoCount = countMatches("TODO|FIXME|HACK|XXX", "client/src/", "*.{ts,tsx}") +
  countMatches("TODO|FIXME|HACK|XXX", "server/", "*.ts") +
  countMatches("TODO|FIXME|HACK|XXX", "calc/", "*.ts");
const todoSamples = [
  ...grep("TODO|FIXME|HACK|XXX", "client/src/", "*.{ts,tsx}"),
  ...grep("TODO|FIXME|HACK|XXX", "server/", "*.ts"),
  ...grep("TODO|FIXME|HACK|XXX", "calc/", "*.ts"),
].slice(0, 3);
findings.push({
  label: "TODO/FIXME/HACK comments",
  count: todoCount,
  severity: todoCount > 10 ? "warning" : "info",
  samples: todoSamples,
});

// 3. console.log in production code (not test files)
const consoleCount = countMatches("console\\.log\\(", "client/src/", "*.{ts,tsx}") +
  countMatches("console\\.log\\(", "server/", "*.ts");
const consoleSamples = [
  ...grep("console\\.log\\(", "client/src/", "*.{ts,tsx}"),
  ...grep("console\\.log\\(", "server/", "*.ts"),
].slice(0, 3);
findings.push({
  label: "console.log in production code",
  count: consoleCount,
  severity: consoleCount > 20 ? "warning" : "info",
  samples: consoleSamples,
});

// 4. Empty catch blocks
const emptyCatch = grep("catch.*\\{\\s*\\}", "client/src/", "*.{ts,tsx}").length +
  grep("catch.*\\{\\s*\\}", "server/", "*.ts").length;
findings.push({
  label: "Empty catch blocks",
  count: emptyCatch,
  severity: emptyCatch > 5 ? "warning" : "info",
  samples: [],
});

// 5. Large files (>500 lines)
const largeFiles: string[] = [];
try {
  const wc = execSync(
    `find client/src server shared calc -name '*.ts' -o -name '*.tsx' 2>/dev/null | xargs wc -l 2>/dev/null | sort -rn | head -12`,
    { encoding: "utf-8", timeout: 10_000 },
  );
  for (const line of wc.trim().split("\n")) {
    const match = line.trim().match(/^(\d+)\s+(.+)/);
    if (match && parseInt(match[1]) > 500 && !match[2].includes("total")) {
      largeFiles.push(`${match[2]} (${match[1]} lines)`);
    }
  }
} catch {}
findings.push({
  label: "Files over 500 lines",
  count: largeFiles.length,
  severity: largeFiles.length > 5 ? "warning" : "info",
  samples: largeFiles.slice(0, 5),
});

// 6. Non-null assertions (!) in finance code
let bangCount = 0;
for (const f of financeFiles) {
  bangCount += grep("!\\.", f).length;
}
findings.push({
  label: "Non-null assertions (!) in finance code",
  count: bangCount,
  severity: bangCount > 10 ? "warning" : "info",
  samples: [],
});

// Output
console.log("");
console.log("  Quick Audit");
console.log("  " + "─".repeat(52));

let issues = 0;
for (const f of findings) {
  const icon = f.count === 0 ? "✓" : f.severity === "critical" ? "✗" : f.severity === "warning" ? "!" : "·";
  console.log(`  ${icon} ${f.label.padEnd(38)} ${f.count.toString().padStart(4)}`);
  if (f.count > 0 && f.samples.length > 0) {
    for (const s of f.samples) {
      // Trim to just file:line portion
      const short = s.length > 100 ? s.slice(0, 100) + "…" : s;
      console.log(`      ${short}`);
    }
  }
  if (f.severity === "critical" && f.count > 0) issues++;
}

console.log("  " + "─".repeat(52));
console.log(`  ${issues === 0 ? "✓ No critical issues" : `✗ ${issues} critical issue${issues !== 1 ? "s" : ""}`}`);
console.log("");
process.exit(issues > 0 ? 1 : 0);
