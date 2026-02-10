import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const SAFE_NUMBERS = new Set([
  "0", "1", "-1", "2", "12", "100", "0.0", "1.0",
]);

const SAFE_PATTERNS = [
  /^\d+e[+-]?\d+$/i,
  /^0[xX][0-9a-fA-F]+$/,
];

const FINANCE_FILES = [
  "client/src/lib/financialEngine.ts",
  "client/src/lib/cashFlowAggregator.ts",
  "client/src/lib/yearlyAggregator.ts",
  "client/src/lib/equityCalculations.ts",
  "calc/refinance/refinance-calculator.ts",
  "calc/validation/financial-identities.ts",
  "calc/validation/schedule-reconcile.ts",
  "calc/analysis/consolidation.ts",
];

const CONSTANT_IMPORT_PATTERN = /from\s+['"].*constants['"]/;
const NUMERIC_LITERAL = /(?<![a-zA-Z_$.'"`])(\d+\.?\d*|\.\d+)(?![a-zA-Z_$])/g;

const CONTEXT_EXCEPTIONS = [
  /\.toFixed\s*\(/,
  /\.toPrecision\s*\(/,
  /\.slice\s*\(/,
  /\.substring\s*\(/,
  /\.length\s*/,
  /index|Index|idx|Idx/,
  /Math\.(min|max|floor|ceil|round|pow|abs)\s*\(/,
  /getMonth|getFullYear|getDate/,
  /\[\s*\d+\s*\]/,
  /monthIndex|yearIndex|monthsSince/,
  /for\s*\(\s*(let|const|var)\s+\w+\s*=\s*\d+/,
  /i\s*[<>]=?\s*\d+/,
  /i\s*\+\+|i\s*--|\+\+\s*i|--\s*i/,
  /\?\s*\d+\s*:/,
  /\/\/|\/\*|\*/,
  /["'].*ASC\s+\d+/,
  /["'].*FASB/,
  /["'].*IRS/,
  /gaap_ref/i,
  /gaap_reference/i,
  /["'][^"']*\d+[^"']*["']/,
];

interface MagicNumberFinding {
  file: string;
  line: number;
  value: string;
  context: string;
}

function scanFileForMagicNumbers(filePath: string): MagicNumberFinding[] {
  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) return [];

  const content = fs.readFileSync(absPath, "utf-8");
  const lines = content.split("\n");
  const findings: MagicNumberFinding[] = [];

  let importsConstants = false;
  for (const line of lines) {
    if (CONSTANT_IMPORT_PATTERN.test(line)) {
      importsConstants = true;
      break;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) continue;
    if (trimmed.startsWith("import ") || trimmed.startsWith("export {")) continue;
    if (trimmed.startsWith("export const ") || trimmed.startsWith("const ")) {
      if (/^(export\s+)?const\s+[A-Z_]+\s*=/.test(trimmed)) continue;
    }

    let match;
    const regex = new RegExp(NUMERIC_LITERAL.source, "g");
    while ((match = regex.exec(line)) !== null) {
      const value = match[1];

      if (SAFE_NUMBERS.has(value)) continue;
      if (SAFE_PATTERNS.some((p) => p.test(value))) continue;

      const surroundingContext = line.substring(
        Math.max(0, match.index - 30),
        Math.min(line.length, match.index + match[0].length + 30),
      );

      if (CONTEXT_EXCEPTIONS.some((p) => p.test(surroundingContext))) continue;

      findings.push({
        file: filePath,
        line: i + 1,
        value,
        context: trimmed.substring(0, 120),
      });
    }
  }

  return findings;
}

describe("Hardcoded Value Detection", () => {
  const allFindings: MagicNumberFinding[] = [];

  for (const file of FINANCE_FILES) {
    const findings = scanFileForMagicNumbers(file);
    allFindings.push(...findings);
  }

  it("finance-critical files contain no magic numbers", () => {
    if (allFindings.length > 0) {
      const report = allFindings
        .map((f) => `  ${f.file}:${f.line} — value ${f.value}\n    ${f.context}`)
        .join("\n");
      expect.fail(
        `Found ${allFindings.length} potential magic number(s) in finance-critical files:\n${report}\n\n` +
        `All numeric literals in finance paths must come from constants.ts or function parameters.\n` +
        `If a number is safe (array index, loop counter), add it to SAFE_NUMBERS or CONTEXT_EXCEPTIONS.`,
      );
    }
  });

  it("primary finance engine imports from constants", () => {
    const primaryFiles = FINANCE_FILES.filter(f => f.includes("financialEngine"));
    for (const file of primaryFiles) {
      const absPath = path.resolve(file);
      if (!fs.existsSync(absPath)) continue;
      const content = fs.readFileSync(absPath, "utf-8");
      expect(
        CONSTANT_IMPORT_PATTERN.test(content),
        `${file} must import from constants`,
      ).toBe(true);
    }
  });
});
