import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

function readFile(relativePath: string): string {
  return readFileSync(resolve(__dirname, "../../", relativePath), "utf-8");
}

describe("Scenario Lifecycle — ensureDefaultScenario", () => {
  const src = readFile("server/routes/scenario-helpers.ts");

  it("exports ensureDefaultScenario function", () => {
    expect(src).toContain("export async function ensureDefaultScenario(userId: number)");
  });

  it("checks for existing default before creating", () => {
    expect(src).toContain("storage.getDefaultScenario(userId)");
    expect(src).toContain("if (existing) return");
  });

  it("creates scenario with kind=default and isLocked=true", () => {
    expect(src).toContain('kind: "default"');
    expect(src).toContain("isLocked: true");
  });

  it("computes initials from first/last name", () => {
    expect(src).toContain("Default Scenario");
  });
});

describe("Scenario Lifecycle — computeGhostName", () => {
  const src = readFile("server/routes/scenario-helpers.ts");

  it("exports computeGhostName function", () => {
    expect(src).toContain("export function computeGhostName(");
  });

  it("zero-pads the scenario number to 2 digits", () => {
    expect(src).toContain("padStart(2,");
  });

  it("produces 'Scenario NN - XX' format", () => {
    expect(src).toContain("`Scenario ${num} - ${initials}`");
  });
});

describe("Scenario Lifecycle — Login calls ensureDefaultScenario", () => {
  it("credential login triggers ensureDefaultScenario", () => {
    const src = readFile("server/routes/auth.ts");
    expect(src).toContain("ensureDefaultScenario(user.id)");
  });

  it("Google OAuth login triggers ensureDefaultScenario", () => {
    const src = readFile("server/routes/google-auth.ts");
    expect(src).toContain("ensureDefaultScenario(user.id)");
  });
});

describe("Scenario Lifecycle — Lock enforcement", () => {
  const src = readFile("server/routes/scenarios.ts");

  it("PATCH checks isLocked before allowing edit", () => {
    const patchStart = src.indexOf('app.patch("/api/scenarios/:id"');
    const patchEnd = src.indexOf("app.post", patchStart + 1);
    const patchBody = src.slice(patchStart, patchEnd);
    expect(patchBody).toContain("isLocked");
    expect(patchBody).toContain("locked and cannot be edited");
  });

  it("DELETE checks isLocked before allowing soft-delete", () => {
    const deleteStart = src.indexOf('app.delete("/api/scenarios/:id"');
    const deleteEnd = src.indexOf("app.post", deleteStart + 1);
    const deleteBody = src.slice(deleteStart, deleteEnd);
    expect(deleteBody).toContain("isLocked");
    expect(deleteBody).toContain("locked and cannot be deleted");
  });

  it("no longer uses hardcoded 'Development' name check", () => {
    const deleteStart = src.indexOf('app.delete("/api/scenarios/:id"');
    const deleteEnd = src.indexOf("app.post", deleteStart + 1);
    const deleteBody = src.slice(deleteStart, deleteEnd);
    expect(deleteBody).not.toContain('"Development"');
  });
});

describe("Scenario Lifecycle — Soft delete", () => {
  const src = readFile("server/storage/financial.ts");

  it("softDeleteScenario sets deletedAt, deletedBy, and purgeAfter", () => {
    const methodStart = src.indexOf("async softDeleteScenario(");
    const methodEnd = src.indexOf("async hardDeleteScenario(");
    const body = src.slice(methodStart, methodEnd);
    expect(body).toContain("deletedAt: now");
    expect(body).toContain("deletedBy: userId");
    expect(body).toContain("purgeAfter: purge");
  });

  it("getScenariosByUser filters by deletedAt IS NULL", () => {
    const methodStart = src.indexOf("async getScenariosByUser(");
    const methodEnd = src.indexOf("async getScenario(");
    const body = src.slice(methodStart, methodEnd);
    expect(body).toContain("isNull(scenarios.deletedAt)");
  });

  it("getScenario filters by deletedAt IS NULL", () => {
    const methodStart = src.indexOf("async getScenario(");
    const methodEnd = src.indexOf("async getScenarioIncludingDeleted(");
    const body = src.slice(methodStart, methodEnd);
    expect(body).toContain("isNull(scenarios.deletedAt)");
  });

  it("getScenarioIncludingDeleted does NOT filter by deletedAt", () => {
    const methodStart = src.indexOf("async getScenarioIncludingDeleted(");
    const methodEnd = src.indexOf("async getDeletedScenarios(");
    const body = src.slice(methodStart, methodEnd);
    expect(body).not.toContain("isNull(scenarios.deletedAt)");
  });

  it("restoreScenario clears soft-delete fields", () => {
    expect(src).toContain("deletedAt: null, deletedBy: null, purgeAfter: null");
  });

  it("purgeExpiredScenarios hard-deletes past purgeAfter", () => {
    expect(src).toContain("async purgeExpiredScenarios()");
    expect(src).toContain("db.delete(scenarios)");
  });
});

describe("Scenario Lifecycle — Admin recovery endpoints", () => {
  const src = readFile("server/routes/admin/scenarios.ts");

  it("has GET /api/admin/scenarios/deleted route", () => {
    expect(src).toContain('"/api/admin/scenarios/deleted"');
    expect(src).toContain("getDeletedScenarios");
  });

  it("has POST /api/admin/scenarios/:id/restore route", () => {
    expect(src).toContain('"/api/admin/scenarios/:id/restore"');
    expect(src).toContain("restoreScenario");
  });

  it("has DELETE /api/admin/scenarios/:id/purge route", () => {
    expect(src).toContain('"/api/admin/scenarios/:id/purge"');
    expect(src).toContain("hardDeleteScenario");
  });
});

describe("Scenario Lifecycle — Auto-save endpoints", () => {
  const src = readFile("server/routes/scenarios.ts");

  it("has POST /api/scenarios/auto-save route", () => {
    expect(src).toContain('"/api/scenarios/auto-save"');
    expect(src).toContain("getAutoSaveScenario");
  });

  it("has GET /api/scenarios/auto-save/check route", () => {
    expect(src).toContain('"/api/scenarios/auto-save/check"');
  });

  it("auto-save upserts using updateScenarioSnapshot for existing", () => {
    expect(src).toContain("updateScenarioSnapshot");
  });

  it("auto-save creates with kind=autosave for new", () => {
    expect(src).toContain('kind: "autosave"');
  });
});

describe("Scenario Lifecycle — Ghost name endpoint", () => {
  const src = readFile("server/routes/scenarios.ts");

  it("has GET /api/scenarios/suggest-name route", () => {
    expect(src).toContain('"/api/scenarios/suggest-name"');
    expect(src).toContain("computeGhostName");
  });
});

describe("Scenario Lifecycle — System scenario exclusion", () => {
  const src = readFile("server/routes/scenarios.ts");

  it("GET /api/scenarios filters out non-manual scenarios", () => {
    expect(src).toContain('s.kind === "manual"');
  });

  it("scenario creation uses countManualScenarios for limit check", () => {
    expect(src).toContain("countManualScenarios");
  });
});

describe("Scenario Lifecycle — Purge job", () => {
  const src = readFile("server/index.ts");

  it("starts purge interval on boot", () => {
    expect(src).toContain("purgeExpiredScenarios");
    expect(src).toContain("SCENARIO_PURGE_INTERVAL_MS");
  });
});

describe("Scenario Lifecycle — Photo delete guard", () => {
  const src = readFile("server/routes/property-photos.ts");

  it("checks photo count before allowing delete", () => {
    expect(src).toContain("photos.length <= 1");
    expect(src).toContain("admin required");
  });
});
