import * as fs from "fs";
import * as path from "path";

const adminPath = path.join(__dirname, "../client/src/pages/Admin.tsx");
const content = fs.readFileSync(adminPath, "utf-8");
const lines = content.split("\n");

console.log(`\n  Admin.tsx Structure Analysis`);
console.log(`  ${"─".repeat(50)}`);
console.log(`  Total lines: ${lines.length}`);

const renderFns: { name: string; start: number; end: number }[] = [];
let currentFn = "";
let currentStart = 0;
let braceDepth = 0;
let inRenderFn = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const renderMatch = line.match(/const (render\w+)\s*=\s*\(/);
  if (renderMatch) {
    currentFn = renderMatch[1];
    currentStart = i + 1;
    inRenderFn = true;
    braceDepth = 0;
  }
  if (inRenderFn) {
    for (const ch of line) {
      if (ch === "(") braceDepth++;
      if (ch === ")") braceDepth--;
    }
    if (braceDepth <= 0 && i > currentStart) {
      renderFns.push({ name: currentFn, start: currentStart, end: i + 1 });
      inRenderFn = false;
    }
  }
}

console.log(`\n  Render functions:`);
for (const fn of renderFns) {
  console.log(`    ${fn.name.padEnd(30)} lines ${fn.start}-${fn.end} (${fn.end - fn.start} lines)`);
}

const hookCounts = {
  useState: (content.match(/useState/g) || []).length,
  useQuery: (content.match(/useQuery/g) || []).length,
  useMutation: (content.match(/useMutation/g) || []).length,
  useEffect: (content.match(/useEffect/g) || []).length,
  useRef: (content.match(/useRef/g) || []).length,
};
console.log(`\n  Hook usage:`);
for (const [hook, count] of Object.entries(hookCounts)) {
  console.log(`    ${hook.padEnd(20)} ${count}`);
}

const adminDir = path.join(__dirname, "../client/src/components/admin");
if (fs.existsSync(adminDir)) {
  const files = fs.readdirSync(adminDir).filter(f => f.endsWith(".tsx") || f.endsWith(".ts"));
  console.log(`\n  Extracted components (${adminDir}):`);
  if (files.length === 0) {
    console.log("    (none yet)");
  }
  for (const file of files) {
    const filePath = path.join(adminDir, file);
    const fileLines = fs.readFileSync(filePath, "utf-8").split("\n").length;
    console.log(`    ${file.padEnd(30)} ${fileLines} lines`);
  }
} else {
  console.log(`\n  No admin components directory yet`);
}

console.log(`  ${"─".repeat(50)}\n`);
