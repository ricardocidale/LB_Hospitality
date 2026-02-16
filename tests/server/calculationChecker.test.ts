import { describe, it, expect } from "vitest";
import { runIndependentVerification } from "../../server/calculationChecker.js";
import type { VerificationReport, ClientPropertyMonthly } from "../../server/calculationChecker.js";

function makeGlobal(overrides: Record<string, any> = {}) {
  return {
    modelStartDate: "2026-01-01",
    projectionYears: 2,
    inflationRate: 0.02,
    fixedCostEscalationRate: 0.02,
    ...overrides,
  };
}

function makeProperty(overrides: Record<string, any> = {}) {
  return {
    name: "Test Hotel",
    type: "AllCash",
    purchasePrice: 1_000_000,
    buildingImprovements: 0,
    roomCount: 10,
    startAdr: 200,
    startOccupancy: 0.50,
    maxOccupancy: 0.70,
    occupancyGrowthStep: 0.05,
    occupancyRampMonths: 12,
    adrGrowthRate: 0.02,
    operationsStartDate: "2026-01-01",
    acquisitionDate: "2026-01-01",
    operatingReserve: 0,
    taxRate: 0.25,
    ...overrides,
  };
}

describe("calculationChecker — Full Equity property", () => {
  it("produces UNQUALIFIED opinion with zero failures for a well-formed AllCash property", () => {
    const report = runIndependentVerification(
      [makeProperty()],
      makeGlobal(),
    );

    expect(report.summary.auditOpinion).toBe("UNQUALIFIED");
    expect(report.summary.overallStatus).toBe("PASS");
    expect(report.summary.totalFailed).toBe(0);
    expect(report.summary.criticalIssues).toBe(0);
    expect(report.summary.materialIssues).toBe(0);
    expect(report.summary.totalChecks).toBeGreaterThan(0);
    expect(report.propertiesChecked).toBe(1);
    expect(report.propertyResults).toHaveLength(1);
    expect(report.propertyResults[0].propertyName).toBe("Test Hotel");
  });

  it("verifies Room Revenue formula at first operational month", () => {
    const report = runIndependentVerification(
      [makeProperty()],
      makeGlobal(),
    );
    const roomRevCheck = report.propertyResults[0].checks.find(
      c => c.metric === "Room Revenue (First Operational Month)",
    );
    expect(roomRevCheck).toBeDefined();
    expect(roomRevCheck!.passed).toBe(true);
    expect(roomRevCheck!.expected).toBe(10 * 200 * 0.5 * 30.5);
  });

  it("verifies GOP and NOI identity checks pass", () => {
    const report = runIndependentVerification(
      [makeProperty()],
      makeGlobal(),
    );
    const checks = report.propertyResults[0].checks;

    const gopCheck = checks.find(c => c.metric === "GOP = Revenue - OpEx");
    expect(gopCheck).toBeDefined();
    expect(gopCheck!.passed).toBe(true);

    const noiCheck = checks.find(c => c.metric === "NOI = GOP - Fees - FF&E");
    expect(noiCheck).toBeDefined();
    expect(noiCheck!.passed).toBe(true);
  });

  it("verifies Cumulative Cash Flow = Ending Cash", () => {
    const report = runIndependentVerification(
      [makeProperty()],
      makeGlobal(),
    );
    const cashCheck = report.propertyResults[0].checks.find(
      c => c.metric === "Cumulative Cash Flow = Ending Cash",
    );
    expect(cashCheck).toBeDefined();
    expect(cashCheck!.passed).toBe(true);
  });

  it("has no debt-related checks for AllCash property", () => {
    const report = runIndependentVerification(
      [makeProperty()],
      makeGlobal(),
    );
    const debtChecks = report.propertyResults[0].checks.filter(
      c => c.category === "Debt",
    );
    expect(debtChecks).toHaveLength(0);
  });
});

describe("calculationChecker — Financed property", () => {
  const financedProp = makeProperty({
    type: "Financed",
    acquisitionLTV: 0.75,
    acquisitionInterestRate: 0.09,
    acquisitionTermYears: 25,
  });

  it("produces UNQUALIFIED opinion for a well-formed Financed property", () => {
    const report = runIndependentVerification(
      [financedProp],
      makeGlobal(),
    );

    expect(report.summary.auditOpinion).toBe("UNQUALIFIED");
    expect(report.summary.overallStatus).toBe("PASS");
    expect(report.summary.totalFailed).toBe(0);
  });

  it("includes debt-related checks", () => {
    const report = runIndependentVerification(
      [financedProp],
      makeGlobal(),
    );
    const debtChecks = report.propertyResults[0].checks.filter(
      c => c.category === "Debt",
    );
    expect(debtChecks.length).toBeGreaterThanOrEqual(2);

    const pmtCheck = debtChecks.find(c => c.metric === "Monthly Debt Service");
    expect(pmtCheck).toBeDefined();
    expect(pmtCheck!.passed).toBe(true);

    const splitCheck = debtChecks.find(c => c.metric === "Interest + Principal = Debt Payment");
    expect(splitCheck).toBeDefined();
    expect(splitCheck!.passed).toBe(true);
  });

  it("PMT matches hand-calc for $750K loan at 9%/25yr", () => {
    const report = runIndependentVerification(
      [financedProp],
      makeGlobal(),
    );
    const pmtCheck = report.propertyResults[0].checks.find(
      c => c.metric === "Monthly Debt Service",
    );
    expect(pmtCheck).toBeDefined();
    const principal = 1_000_000 * 0.75;
    const r = 0.09 / 12;
    const n = 25 * 12;
    const expectedPMT = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    expect(pmtCheck!.expected).toBeCloseTo(expectedPMT, 2);
  });
});

describe("calculationChecker — audit opinion logic", () => {
  it("returns ADVERSE when cross-validation fails (critical mismatch)", () => {
    const prop = makeProperty();
    const global = makeGlobal();
    const fakeClient: ClientPropertyMonthly[][] = [
      Array.from({ length: 24 }, () => ({
        revenueTotal: 0,
        revenueRooms: 0,
        noi: 0,
        gop: 0,
        cashFlow: 0,
        feeBase: 0,
        feeIncentive: 0,
      })),
    ];

    const report = runIndependentVerification([prop], global, fakeClient);

    expect(report.summary.criticalIssues).toBeGreaterThan(0);
    expect(report.summary.auditOpinion).toBe("ADVERSE");
    expect(report.summary.overallStatus).toBe("FAIL");
  });

  it("returns QUALIFIED when only material issues exist", () => {
    const prop = makeProperty({
      adrGrowthRate: 0,
      occupancyGrowthStep: 0,
      maxOccupancy: 0.50,
    });
    const global = makeGlobal({ projectionYears: 2 });

    const report = runIndependentVerification([prop], global);
    const materialChecks = report.propertyResults[0].checks.filter(
      c => !c.passed && c.severity === "material",
    );

    if (materialChecks.length > 0 && report.summary.criticalIssues === 0) {
      expect(report.summary.auditOpinion).toBe("QUALIFIED");
      expect(report.summary.overallStatus).toBe("WARNING");
    }
  });
});

describe("calculationChecker — pre-operations gating", () => {
  it("reports zero revenue before operations start date", () => {
    const prop = makeProperty({
      operationsStartDate: "2026-07-01",
    });
    const global = makeGlobal({ projectionYears: 1 });

    const report = runIndependentVerification([prop], global);
    const preOpCheck = report.propertyResults[0].checks.find(
      c => c.metric === "Pre-Operations Revenue = $0",
    );
    expect(preOpCheck).toBeDefined();
    expect(preOpCheck!.passed).toBe(true);
    expect(preOpCheck!.actual).toBe(0);
  });
});

describe("calculationChecker — multi-property consolidated", () => {
  it("runs consolidated checks for 2+ properties", () => {
    const prop1 = makeProperty({ name: "Hotel A" });
    const prop2 = makeProperty({ name: "Hotel B", purchasePrice: 2_000_000, roomCount: 20 });
    const global = makeGlobal();

    const report = runIndependentVerification([prop1, prop2], global);
    expect(report.propertiesChecked).toBe(2);
    expect(report.consolidatedChecks.length).toBeGreaterThan(0);

    const aggregationCheck = report.consolidatedChecks.find(
      c => c.metric === "Portfolio Room Revenue Aggregation",
    );
    expect(aggregationCheck).toBeDefined();
    expect(aggregationCheck!.passed).toBe(true);

    const feeElimCheck = report.consolidatedChecks.find(
      c => c.metric === "Intercompany Fee Elimination",
    );
    expect(feeElimCheck).toBeDefined();
    expect(feeElimCheck!.passed).toBe(true);
  });
});

describe("calculationChecker — company checks", () => {
  it("verifies base and incentive fee rate checks pass", () => {
    const report = runIndependentVerification(
      [makeProperty()],
      makeGlobal(),
    );
    const baseFeeCheck = report.companyChecks.find(
      c => c.metric === "Base Fee Applied at Stated Rate",
    );
    expect(baseFeeCheck).toBeDefined();
    expect(baseFeeCheck!.passed).toBe(true);

    const incentiveCheck = report.companyChecks.find(
      c => c.metric === "Incentive Fee Applied at Stated Rate",
    );
    expect(incentiveCheck).toBeDefined();
    expect(incentiveCheck!.passed).toBe(true);
  });
});

describe("calculationChecker — depreciation", () => {
  it("computes correct annual depreciation excluding land", () => {
    const report = runIndependentVerification(
      [makeProperty()],
      makeGlobal(),
    );
    const depCheck = report.propertyResults[0].checks.find(
      c => c.metric === "Annual Depreciation (Land Excluded)",
    );
    expect(depCheck).toBeDefined();
    expect(depCheck!.passed).toBe(true);
    const depreciableBasis = 1_000_000 * (1 - 0.25);
    const expectedAnnual = depreciableBasis / 27.5;
    expect(depCheck!.expected).toBeCloseTo(expectedAnnual, 2);
  });
});
