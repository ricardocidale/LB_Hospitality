import { describe, it, expect } from "vitest";

/**
 * Storage Layer Static Analysis Tests
 *
 * Verifies storage implementation correctness by reading source files
 * and checking for known data integrity patterns:
 * - Shared ownership (userId: null)
 * - ORDER BY DESC for singleton queries
 * - Transaction usage in loadScenario
 * - Proper cascade behavior
 */

import * as fs from "fs";
import * as path from "path";

const storageDir = path.resolve(__dirname, "../../server/storage");

function readStorageFile(name: string): string {
  return fs.readFileSync(path.join(storageDir, name), "utf-8");
}

describe("Storage Layer — PropertyStorage", () => {
  const src = readStorageFile("properties.ts");

  it("getAllProperties returns shared properties (userId IS NULL)", () => {
    expect(src).toContain("isNull(properties.userId)");
  });

  it("getAllProperties combines user-owned and shared properties with OR", () => {
    expect(src).toContain("or(eq(properties.userId, userId), isNull(properties.userId))");
  });

  it("createProperty accepts data without forcing userId", () => {
    // The storage layer should pass through whatever userId is in data
    // (the route sets userId: null for shared properties)
    expect(src).toContain("async createProperty(data: InsertProperty)");
    expect(src).toContain(".insert(properties)");
    expect(src).toContain(".returning()");
  });

  it("updateProperty sets updatedAt on every update", () => {
    expect(src).toContain("updatedAt: new Date()");
  });

  it("deleteProperty uses eq on id", () => {
    expect(src).toContain("db.delete(properties).where(eq(properties.id, id))");
  });
});

describe("Storage Layer — FinancialStorage (Global Assumptions)", () => {
  const src = readStorageFile("financial.ts");

  it("getGlobalAssumptions uses ORDER BY DESC for shared row", () => {
    expect(src).toContain("orderBy(desc(globalAssumptions.id))");
  });

  it("getGlobalAssumptions filters shared rows with isNull", () => {
    expect(src).toContain("isNull(globalAssumptions.userId)");
  });

  it("getGlobalAssumptions checks user-specific row first if userId provided", () => {
    // User row takes priority over shared row
    const userCheck = src.indexOf("eq(globalAssumptions.userId, userId)");
    const sharedCheck = src.indexOf("isNull(globalAssumptions.userId)");
    expect(userCheck).toBeGreaterThan(-1);
    expect(sharedCheck).toBeGreaterThan(-1);
    expect(userCheck).toBeLessThan(sharedCheck);
  });

  it("upsertGlobalAssumptions updates existing row (not insert duplicate)", () => {
    expect(src).toContain("const existing = await this.getGlobalAssumptions(userId)");
    expect(src).toContain(".update(globalAssumptions)");
    expect(src).toContain(".where(eq(globalAssumptions.id, existing.id))");
  });
});

describe("Storage Layer — FinancialStorage (Scenarios)", () => {
  const src = readStorageFile("financial.ts");

  it("getScenariosByUser filters by userId", () => {
    expect(src).toContain("eq(scenarios.userId, userId)");
  });

  it("createScenario returns the created record", () => {
    expect(src).toContain(".insert(scenarios)");
    expect(src).toContain(".returning()");
  });

  it("updateScenario sets updatedAt on every update", () => {
    // Look specifically in the updateScenario method
    const methodStart = src.indexOf("async updateScenario(");
    const methodEnd = src.indexOf("async deleteScenario(");
    const methodBody = src.slice(methodStart, methodEnd);
    expect(methodBody).toContain("updatedAt: new Date()");
  });

  it("deleteScenario uses eq on id", () => {
    expect(src).toContain("db.delete(scenarios).where(eq(scenarios.id, id))");
  });
});

describe("Storage Layer — loadScenario integrity", () => {
  const src = readStorageFile("financial.ts");

  // Extract loadScenario method body
  const loadStart = src.indexOf("async loadScenario(");
  const loadEnd = src.indexOf("async getFeeCategoriesByProperty(");
  const loadBody = src.slice(loadStart, loadEnd);

  it("runs inside a transaction", () => {
    expect(loadBody).toContain("db.transaction(");
  });

  it("updates the shared global assumptions row (not user-specific)", () => {
    expect(loadBody).toContain("isNull(globalAssumptions.userId)");
  });

  it("deletes existing shared properties before restoring", () => {
    expect(loadBody).toContain("isNull(properties.userId)");
    expect(loadBody).toContain("tx.delete(properties)");
  });

  it("inserts restored properties with userId: null (shared ownership)", () => {
    expect(loadBody).toContain("userId: null");
    expect(loadBody).toContain("tx.insert(properties)");
  });

  it("restores fee categories keyed by property name", () => {
    expect(loadBody).toContain("savedFeeCategories");
    expect(loadBody).toContain("tx.insert(propertyFeeCategories)");
  });

  it("strips id/createdAt/updatedAt/userId from restored global assumptions", () => {
    expect(loadBody).toContain("id: _gaId");
    expect(loadBody).toContain("createdAt: _gaCreated");
    expect(loadBody).toContain("updatedAt: _gaUpdated");
    expect(loadBody).toContain("userId: _gaUser");
  });

  it("strips id/createdAt/updatedAt/userId from restored properties", () => {
    expect(loadBody).toContain("id, createdAt, updatedAt, userId: _uid");
  });
});

describe("Storage Layer — UserStorage", () => {
  const src = readStorageFile("users.ts");

  it("exists and exports UserStorage class", () => {
    expect(src).toContain("export class UserStorage");
  });

  it("has getUserById method", () => {
    expect(src).toContain("async getUserById(");
  });

  it("has createUser method", () => {
    expect(src).toContain("async createUser(");
  });
});

describe("Storage Layer — Index delegates to sub-modules", () => {
  const src = readStorageFile("index.ts");

  it("imports all sub-module storage classes", () => {
    expect(src).toContain("UserStorage");
    expect(src).toContain("PropertyStorage");
    expect(src).toContain("FinancialStorage");
  });

  it("exports IStorage interface", () => {
    expect(src).toContain("export interface IStorage");
  });

  it("exports DatabaseStorage class", () => {
    expect(src).toContain("export class DatabaseStorage");
  });

  it("binds scenario methods from financial sub-module", () => {
    expect(src).toContain("getScenariosByUser");
    expect(src).toContain("createScenario");
    expect(src).toContain("loadScenario");
  });
});
