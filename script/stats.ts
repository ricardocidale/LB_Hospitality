/**
 * Stats — codebase health metrics in ~12 compact lines.
 * File counts, line counts, test counts, TS error count.
 *
 * Usage: npm run stats
 */
import { execSync } from "child_process";
import { readdirSync, statSync } from "fs";
import { join, extname } from "path";

function run(cmd: string): string {
  try {
    return execSync(cmd, { encoding: "utf-8", timeout: 30_000 }).trim();
  } catch (err: any) {
    return (err.stdout ?? "") + (err.stderr ?? "");
  }
}

function countFiles(dir: string, exts: string[]): { files: number; lines: number } {
  let files = 0;
  let lines = 0;
  function walk(d: string) {
    try {
      for (const entry of readdirSync(d)) {
        if (entry === "node_modules" || entry === "dist" || entry === ".git") continue;
        const full = join(d, entry);
        const stat = statSync(full);
        if (stat.isDirectory()) {
          walk(full);
        } else if (exts.includes(extname(entry))) {
          files++;
          try {
            const content = run(`wc -l < "${full}"`);
            lines += parseInt(content) || 0;
          } catch {}
        }
      }
    } catch {}
  }
  walk(dir);
  return { files, lines };
}

const root = process.cwd();

// Source code
const client = countFiles(join(root, "client/src"), [".ts", ".tsx"]);
const server = countFiles(join(root, "server"), [".ts"]);
const calc = countFiles(join(root, "calc"), [".ts"]);
const shared = countFiles(join(root, "shared"), [".ts"]);
const tests = countFiles(join(root, "tests"), [".ts"]);

// TS errors
const tscOut = run("npx tsc --noEmit 2>&1");
const tsErrors = tscOut ? tscOut.split("\n").filter((l) => l.includes("error TS")).length : 0;

// Test count from last run
const testOut = run("npx vitest run --reporter=json 2>&1");
let testCount = 0;
let testFileCount = 0;
try {
  const json = JSON.parse(testOut);
  testCount = json.numTotalTests ?? 0;
  testFileCount = json.numTotalTestSuites ?? 0;
} catch {
  // Fallback: run summary parser
  const summaryOut = run("npx vitest run 2>&1").replace(/\x1b\[[0-9;]*m/g, "");
  const tm = summaryOut.match(/Tests\s+(\d+) passed\s*\((\d+)\)/);
  const fm = summaryOut.match(/Test Files\s+(\d+) passed\s*\((\d+)\)/);
  if (tm) testCount = parseInt(tm[2]);
  if (fm) testFileCount = parseInt(fm[2]);
}

// Skills & rules
const skills = countFiles(join(root, ".claude/skills"), [".md"]);
const rules = countFiles(join(root, ".claude/rules"), [".md"]);
const tools = countFiles(join(root, ".claude/tools"), [".md", ".ts", ".json"]);

console.log("");
console.log("  Codebase Stats");
console.log("  " + "─".repeat(44));
console.log(`  Source        ${(client.files + server.files + calc.files + shared.files).toString().padStart(5)} files   ${(client.lines + server.lines + calc.lines + shared.lines).toLocaleString().padStart(7)} lines`);
console.log(`    client/     ${client.files.toString().padStart(5)} files   ${client.lines.toLocaleString().padStart(7)} lines`);
console.log(`    server/     ${server.files.toString().padStart(5)} files   ${server.lines.toLocaleString().padStart(7)} lines`);
console.log(`    calc/       ${calc.files.toString().padStart(5)} files   ${calc.lines.toLocaleString().padStart(7)} lines`);
console.log(`    shared/     ${shared.files.toString().padStart(5)} files   ${shared.lines.toLocaleString().padStart(7)} lines`);
console.log(`  Tests         ${tests.files.toString().padStart(5)} files   ${tests.lines.toLocaleString().padStart(7)} lines   (${testCount} tests)`);
console.log(`  TypeScript    ${tsErrors === 0 ? "    0 errors ✓" : `${tsErrors.toString().padStart(5)} errors ✗`}`);
console.log(`  Skills        ${skills.files.toString().padStart(5)} files`);
console.log(`  Rules         ${rules.files.toString().padStart(5)} files`);
console.log(`  Tools         ${tools.files.toString().padStart(5)} files`);
console.log("  " + "─".repeat(44));
console.log("");
