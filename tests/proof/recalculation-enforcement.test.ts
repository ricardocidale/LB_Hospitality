import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Recalculation Enforcement", () => {
  const apiDir = path.resolve(__dirname, "../../client/src/lib/api");
  const apiFiles = fs.readdirSync(apiDir).filter(f => f.endsWith(".ts"));
  const apiContent = apiFiles
    .map(f => fs.readFileSync(path.join(apiDir, f), "utf-8"))
    .join("\n");

  it("ALL_FINANCIAL_QUERY_KEYS should be complete", () => {
    const queryKeyMatches = apiContent.matchAll(/queryKey:\s*\[\s*"([^"]+)"/g);
    const usedKeys = new Set<string>();
    for (const match of queryKeyMatches) {
      usedKeys.add(match[1]);
    }

    const financialKeysMatch = apiContent.match(/const ALL_FINANCIAL_QUERY_KEYS = \[\s*([\s\S]*?)\s*\] as const;/);
    expect(financialKeysMatch).toBeDefined();
    const financialKeysContent = financialKeysMatch![1];
    const definedFinancialKeys = new Set(
      [...financialKeysContent.matchAll(/\[\s*"([^"]+)"\s*\]/g)].map(m => m[1])
    );

    const financialRelatedPrefixes = [
      "globalAssumptions", "properties", "feeCategories",
      "scenarios", "research", "serviceTemplates",
    ];

    for (const key of usedKeys) {
      if (financialRelatedPrefixes.includes(key)) {
        expect(definedFinancialKeys.has(key)).toBe(true);
      }
    }
  });

  it("Every mutation hook touching financial data must call invalidateAllFinancialQueries", () => {
    // For each financial mutation hook, check that its file contains
    // invalidateAllFinancialQueries within the function body.
    // We read per-file to avoid regex issues with concatenated content.
    const financialMutations = [
      "useUpdateGlobalAssumptions",
      "useCreateProperty",
      "useUpdateProperty",
      "useDeleteProperty",
      "useUpdateFeeCategories",
      "useCreateScenario",
      "useLoadScenario",
      "useUpdateScenario",
      "useDeleteScenario",
      "useCreateServiceTemplate",
      "useUpdateServiceTemplate",
      "useDeleteServiceTemplate",
      "useSyncServiceTemplates",
    ];

    for (const hookName of financialMutations) {
      // Find which file contains this hook
      let found = false;
      for (const fileName of apiFiles) {
        const fileContent = fs.readFileSync(path.join(apiDir, fileName), "utf-8");
        const funcStart = fileContent.indexOf(`export function ${hookName}(`);
        if (funcStart === -1) continue;

        found = true;
        // Extract from function start to the next "export function" or end of file
        const nextExport = fileContent.indexOf("export function ", funcStart + 1);
        const funcBody = nextExport === -1
          ? fileContent.slice(funcStart)
          : fileContent.slice(funcStart, nextExport);

        expect(
          funcBody.includes("invalidateAllFinancialQueries"),
          `${hookName} in ${fileName} must call invalidateAllFinancialQueries`
        ).toBe(true);
        break;
      }
      expect(found, `Could not find hook ${hookName} in any api file`).toBe(true);
    }
  });

  it("No direct invalidateQueries calls should bypass the centralized helper for financial data", () => {
    const definedFinancialKeys = [
      "globalAssumptions", "properties", "feeCategories",
      "scenarios", "research", "serviceTemplates",
    ];

    const directInvalidateMatches = apiContent.matchAll(
      /queryClient\.invalidateQueries\(\{\s*queryKey:\s*\[\s*"([^"]+)"/g
    );

    for (const match of directInvalidateMatches) {
      const key = match[1];
      if (definedFinancialKeys.includes(key)) {
        const index = match.index!;
        const before = apiContent.slice(Math.max(0, index - 500), index);
        if (!before.includes("function invalidateAllFinancialQueries")) {
          expect.fail(
            `Direct invalidateQueries call for "${key}" bypasses the centralized helper. ` +
            `Use invalidateAllFinancialQueries(queryClient) instead.`
          );
        }
      }
    }
  });
});
