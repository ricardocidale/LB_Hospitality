import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Recalculation Enforcement", () => {
  const apiDir = path.resolve(__dirname, "../../client/src/lib/api");
  const apiContent = fs.readdirSync(apiDir)
    .filter(f => f.endsWith(".ts"))
    .map(f => fs.readFileSync(path.join(apiDir, f), "utf-8"))
    .join("\n");

  it("ALL_FINANCIAL_QUERY_KEYS should be complete", () => {
    // 1. Find all query keys used in useQuery
    const queryKeyMatches = apiContent.matchAll(/queryKey:\s*\[\s*"([^"]+)"/g);
    const usedKeys = new Set<string>();
    for (const match of queryKeyMatches) {
      usedKeys.add(match[1]);
    }

    // 2. Find ALL_FINANCIAL_QUERY_KEYS
    const financialKeysMatch = apiContent.match(/const ALL_FINANCIAL_QUERY_KEYS = \[\s*([\s\S]*?)\s*\] as const;/);
    expect(financialKeysMatch).toBeDefined();
    const financialKeysContent = financialKeysMatch![1];
    const definedFinancialKeys = new Set(
      [...financialKeysContent.matchAll(/\[\s*"([^"]+)"\s*\]/g)].map(m => m[1])
    );

    // 3. Check for completeness
    // Keys like "research-questions", "propertySearch", "prospectiveFavorites", "savedSearches" might not be "financial" 
    // but let's see what's missing.
    const financialRelatedPrefixes = ["globalAssumptions", "properties", "feeCategories", "scenarios", "research"];
    
    for (const key of usedKeys) {
      if (financialRelatedPrefixes.includes(key)) {
        expect(definedFinancialKeys.has(key)).toBe(true);
      }
    }
  });

  it("Every mutation hook touching financial data must call invalidateAllFinancialQueries", () => {
    // 1. Find all useMutation calls
    const mutationMatches = apiContent.matchAll(/export function (use\w+)\(\) \{[\s\S]*?return useMutation\(\{([\s\S]*?)\}\);/g);
    
    const financialMutations = [
      "useUpdateGlobalAssumptions",
      "useCreateProperty",
      "useUpdateProperty",
      "useDeleteProperty",
      "useUpdateFeeCategories",
      "useCreateScenario",
      "useLoadScenario",
      "useUpdateScenario",
      "useDeleteScenario"
    ];

    for (const match of mutationMatches) {
      const hookName = match[1];
      const mutationBody = match[2];

      if (financialMutations.includes(hookName)) {
        expect(mutationBody).toContain("invalidateAllFinancialQueries(queryClient)");
      }
    }
  });

  it("No direct invalidateQueries calls should bypass the centralized helper for financial data", () => {
    const definedFinancialKeys = ["globalAssumptions", "properties", "feeCategories", "scenarios", "research"];
    
    // Find direct invalidateQueries calls: queryClient.invalidateQueries({ queryKey: ["xxx"] })
    const directInvalidateMatches = apiContent.matchAll(/queryClient\.invalidateQueries\(\{\s*queryKey:\s*\[\s*"([^"]+)"/g);
    
    for (const match of directInvalidateMatches) {
      const key = match[1];
      // If it's a financial key, it should probably be using the helper, 
      // UNLESS it's inside the helper itself (which we check differently)
      if (definedFinancialKeys.includes(key)) {
        // Find the context of this call
        const index = match.index!;
        const before = apiContent.slice(Math.max(0, index - 500), index);
        // If it's not inside invalidateAllFinancialQueries, it's a bypass
        if (!before.includes("function invalidateAllFinancialQueries")) {
           // We allow it if it's not one of the core financial ones or if we want to be strict.
           // The task says: "No direct invalidateQueries calls bypass the centralized helper for financial data"
           expect(key).not.toBe(key); // Force failure if found
        }
      }
    }
  });
});
