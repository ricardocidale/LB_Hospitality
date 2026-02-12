/**
 * Exports Check — finds unused public exports from calc/ and client/src/lib/.
 * Scans for `export function`, `export const`, `export class`, `export type`,
 * `export interface` and checks if they're imported anywhere else.
 *
 * Usage: npm run exports:check
 */
import { execSync } from "child_process";

interface UnusedExport {
  file: string;
  name: string;
  kind: string;
}

function run(cmd: string): string {
  try {
    return execSync(cmd, { encoding: "utf-8", timeout: 30_000, maxBuffer: 5 * 1024 * 1024 }).trim();
  } catch {
    return "";
  }
}

// Directories to scan for exports
const exportDirs = ["calc/", "client/src/lib/"];

// Directories to search for usages
const usageDirs = ["client/src/", "server/", "calc/", "shared/", "tests/"];

const unused: UnusedExport[] = [];
const used: number[] = [0];

for (const dir of exportDirs) {
  // Find all exported names
  const exportLines = run(
    `rg -n '^export (function|const|class|type|interface|enum) (\\w+)' ${dir} --glob '*.ts' --glob '*.tsx' -o 2>/dev/null`,
  );

  if (!exportLines) continue;

  for (const line of exportLines.split("\n").filter(Boolean)) {
    // Format: file:line:export kind name
    const match = line.match(/^(.+?):(\d+):export (function|const|class|type|interface|enum) (\w+)/);
    if (!match) continue;

    const [, file, , kind, name] = match;

    // Skip index.ts barrel re-exports
    if (file.endsWith("index.ts")) continue;

    // Skip common names that are too generic to search
    if (name.length <= 2) continue;

    // Search for this name being imported or referenced in other files
    const usageCount = run(
      `rg -l '\\b${name}\\b' ${usageDirs.join(" ")} --glob '*.ts' --glob '*.tsx' 2>/dev/null | grep -v '${file}' | wc -l`,
    );

    const count = parseInt(usageCount) || 0;
    if (count === 0) {
      unused.push({ file, name, kind });
    } else {
      used[0]++;
    }
  }
}

// Output
console.log("");
console.log("  Exports Check");
console.log("  " + "─".repeat(52));

if (unused.length === 0) {
  console.log(`  ✓ All ${used[0]} public exports are used`);
} else {
  console.log(`  ${used[0]} exports used, ${unused.length} potentially unused:`);
  console.log("");

  // Group by file
  const byFile = new Map<string, UnusedExport[]>();
  for (const u of unused) {
    const existing = byFile.get(u.file) ?? [];
    existing.push(u);
    byFile.set(u.file, existing);
  }

  for (const [file, exports] of byFile) {
    console.log(`  ${file}`);
    for (const e of exports) {
      console.log(`    ${e.kind} ${e.name}`);
    }
  }
}

console.log("  " + "─".repeat(52));
console.log("");
