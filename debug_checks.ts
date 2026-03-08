
  import { runIndependentVerification } from "./server/calculation-checker/index.ts";
  import { DEFAULT_INFLATION_RATE } from "./shared/constants.ts";

  function makeGlobal(overrides = {}) {
    return {
      modelStartDate: "2026-01-01",
      projectionYears: 2,
      inflationRate: DEFAULT_INFLATION_RATE,
      fixedCostEscalationRate: DEFAULT_INFLATION_RATE,
      ...overrides,
    };
  }

  function makeProperty(overrides = {}) {
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

  const report = runIndependentVerification(
    [makeProperty()],
    makeGlobal(),
  );

  report.propertyResults[0].checks.filter(c => !c.passed).forEach(c => {
    console.log('FAILED_CHECK_START');
    console.log('Metric:', c.metric);
    console.log('Formula:', c.formula);
    console.log('Expected:', c.expected);
    console.log('Actual:', c.actual);
    console.log('Severity:', c.severity);
    console.log('FAILED_CHECK_END');
  });
  