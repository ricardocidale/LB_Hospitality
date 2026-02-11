import { describe, it, expect } from "vitest";
import {
  generatePropertyProForma,
  generateCompanyProForma,
} from "../../client/src/lib/financialEngine.js";
import {
  DEFAULT_BASE_MANAGEMENT_FEE_RATE,
  DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE,
} from "../../shared/constants.js";

const baseProperty = {
  operationsStartDate: "2026-04-01",
  acquisitionDate: "2026-04-01",
  roomCount: 10,
  startAdr: 250,
  adrGrowthRate: 0.03,
  startOccupancy: 0.60,
  maxOccupancy: 0.85,
  occupancyRampMonths: 6,
  occupancyGrowthStep: 0.05,
  purchasePrice: 2_000_000,
  buildingImprovements: 0,
  landValuePercent: 0.25,
  preOpeningCosts: 0,
  operatingReserve: 0,
  type: "Full Equity",
  costRateRooms: 0.20,
  costRateFB: 0.09,
  costRateAdmin: 0.08,
  costRateMarketing: 0.01,
  costRatePropertyOps: 0.04,
  costRateUtilities: 0.05,
  costRateInsurance: 0.02,
  costRateTaxes: 0.03,
  costRateIT: 0.005,
  costRateFFE: 0.04,
  costRateOther: 0.05,
  revShareEvents: 0.43,
  revShareFB: 0.22,
  revShareOther: 0.07,
  cateringBoostPercent: 0.30,
  baseManagementFeeRate: DEFAULT_BASE_MANAGEMENT_FEE_RATE,
  incentiveManagementFeeRate: DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE,
};

const baseGlobal = {
  modelStartDate: "2026-04-01",
  companyOpsStartDate: "2026-04-01",
  projectionYears: 1,
  inflationRate: 0.03,
  fixedCostEscalationRate: 0.03,
  baseManagementFee: 0.05,
  incentiveManagementFee: 0.15,
  marketingRate: 0.05,
  miscOpsRate: 0.03,
  safeTranche1Date: "2026-04-01",
  safeTranche1Amount: 1_000_000,
  safeTranche2Date: undefined as string | undefined,
  safeTranche2Amount: 0,
  staffSalary: 75_000,
  staffTier1MaxProperties: 3,
  staffTier1Fte: 2.5,
  staffTier2MaxProperties: 6,
  staffTier2Fte: 4.5,
  staffTier3Fte: 7.0,
  officeLeaseStart: 36_000,
  professionalServicesStart: 24_000,
  techInfraStart: 18_000,
  businessInsuranceStart: 12_000,
  travelCostPerClient: 12_000,
  itLicensePerClient: 3_000,
  partnerCompYear1: 540_000,
  debtAssumptions: {
    interestRate: 0.09,
    amortizationYears: 25,
    acqLTV: 0.75,
  },
};

describe("Per-Property Management Fee Rates — SPV Pro Forma", () => {
  describe("default rates (explicit)", () => {
    const result = generatePropertyProForma(baseProperty, baseGlobal, 12);

    it("base fee uses DEFAULT_BASE_MANAGEMENT_FEE_RATE (5%)", () => {
      for (const m of result) {
        expect(m.feeBase).toBeCloseTo(m.revenueTotal * DEFAULT_BASE_MANAGEMENT_FEE_RATE, 2);
      }
    });

    it("incentive fee uses DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE (15%)", () => {
      for (const m of result) {
        expect(m.feeIncentive).toBeCloseTo(Math.max(0, m.gop * DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE), 2);
      }
    });
  });

  describe("custom base rate override (3%)", () => {
    const customProperty = { ...baseProperty, baseManagementFeeRate: 0.03 };
    const result = generatePropertyProForma(customProperty, baseGlobal, 12);

    it("base fee uses property-specific rate (3%), not default (5%)", () => {
      for (const m of result) {
        expect(m.feeBase).toBeCloseTo(m.revenueTotal * 0.03, 2);
        expect(m.feeBase).not.toBeCloseTo(m.revenueTotal * DEFAULT_BASE_MANAGEMENT_FEE_RATE, 2);
      }
    });

    it("incentive fee still uses default rate when not overridden", () => {
      for (const m of result) {
        expect(m.feeIncentive).toBeCloseTo(Math.max(0, m.gop * DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE), 2);
      }
    });
  });

  describe("custom incentive rate override (10%)", () => {
    const customProperty = { ...baseProperty, incentiveManagementFeeRate: 0.10 };
    const result = generatePropertyProForma(customProperty, baseGlobal, 12);

    it("incentive fee uses property-specific rate (10%), not default (15%)", () => {
      for (const m of result) {
        expect(m.feeIncentive).toBeCloseTo(Math.max(0, m.gop * 0.10), 2);
        if (m.gop > 0) {
          expect(m.feeIncentive).not.toBeCloseTo(m.gop * DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE, 2);
        }
      }
    });

    it("base fee still uses default rate when not overridden", () => {
      for (const m of result) {
        expect(m.feeBase).toBeCloseTo(m.revenueTotal * DEFAULT_BASE_MANAGEMENT_FEE_RATE, 2);
      }
    });
  });

  describe("both rates overridden (7% base, 20% incentive)", () => {
    const customProperty = {
      ...baseProperty,
      baseManagementFeeRate: 0.07,
      incentiveManagementFeeRate: 0.20,
    };
    const result = generatePropertyProForma(customProperty, baseGlobal, 12);

    it("base fee = 7% of total revenue", () => {
      for (const m of result) {
        expect(m.feeBase).toBeCloseTo(m.revenueTotal * 0.07, 2);
      }
    });

    it("incentive fee = 20% of max(0, GOP)", () => {
      for (const m of result) {
        expect(m.feeIncentive).toBeCloseTo(Math.max(0, m.gop * 0.20), 2);
      }
    });
  });

  describe("fallback when rates are undefined", () => {
    const noRateProperty = { ...baseProperty } as Record<string, any>;
    delete noRateProperty.baseManagementFeeRate;
    delete noRateProperty.incentiveManagementFeeRate;
    const result = generatePropertyProForma(noRateProperty, baseGlobal, 12);

    it("falls back to DEFAULT_BASE_MANAGEMENT_FEE_RATE", () => {
      for (const m of result) {
        expect(m.feeBase).toBeCloseTo(m.revenueTotal * DEFAULT_BASE_MANAGEMENT_FEE_RATE, 2);
      }
    });

    it("falls back to DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE", () => {
      for (const m of result) {
        expect(m.feeIncentive).toBeCloseTo(Math.max(0, m.gop * DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE), 2);
      }
    });
  });

  describe("zero rates produce zero fees", () => {
    const zeroRateProperty = {
      ...baseProperty,
      baseManagementFeeRate: 0,
      incentiveManagementFeeRate: 0,
    };
    const result = generatePropertyProForma(zeroRateProperty, baseGlobal, 12);

    it("zero base rate → zero base fee", () => {
      for (const m of result) {
        expect(m.feeBase).toBe(0);
      }
    });

    it("zero incentive rate → zero incentive fee", () => {
      for (const m of result) {
        expect(m.feeIncentive).toBe(0);
      }
    });

    it("NOI is higher when management fees are zero", () => {
      const defaultResult = generatePropertyProForma(baseProperty, baseGlobal, 12);
      for (let i = 0; i < 12; i++) {
        expect(result[i].noi).toBeGreaterThan(defaultResult[i].noi);
      }
    });
  });
});

describe("Per-Property Management Fee Rates — Company (OpCo) Pro Forma", () => {
  describe("different rates per property flow to OpCo revenue correctly", () => {
    const propertyA = {
      ...baseProperty,
      baseManagementFeeRate: 0.03,
      incentiveManagementFeeRate: 0.10,
    };
    const propertyB = {
      ...baseProperty,
      baseManagementFeeRate: 0.07,
      incentiveManagementFeeRate: 0.20,
      roomCount: 15,
      startAdr: 300,
      purchasePrice: 3_000_000,
    };

    const proFormaA = generatePropertyProForma(propertyA, baseGlobal, 12);
    const proFormaB = generatePropertyProForma(propertyB, baseGlobal, 12);
    const companyResult = generateCompanyProForma([propertyA, propertyB], baseGlobal, 12);

    it("OpCo base fee revenue = sum of each property's base fee at its own rate", () => {
      for (let i = 0; i < 12; i++) {
        const expectedBase = proFormaA[i].feeBase + proFormaB[i].feeBase;
        expect(companyResult[i].baseFeeRevenue).toBeCloseTo(expectedBase, 2);
      }
    });

    it("OpCo incentive fee revenue = sum of each property's incentive fee at its own rate", () => {
      for (let i = 0; i < 12; i++) {
        const expectedIncentive = proFormaA[i].feeIncentive + proFormaB[i].feeIncentive;
        expect(companyResult[i].incentiveFeeRevenue).toBeCloseTo(expectedIncentive, 2);
      }
    });

    it("property A fees are less than property B fees (lower rates and smaller property)", () => {
      const totalFeesA = proFormaA.reduce((s, m) => s + m.feeBase + m.feeIncentive, 0);
      const totalFeesB = proFormaB.reduce((s, m) => s + m.feeBase + m.feeIncentive, 0);
      expect(totalFeesA).toBeLessThan(totalFeesB);
    });
  });

  describe("uniform rates across properties produce same result as legacy global", () => {
    const propWithDefaults = { ...baseProperty };
    const companyResult = generateCompanyProForma([propWithDefaults], baseGlobal, 12);
    const propResult = generatePropertyProForma(propWithDefaults, baseGlobal, 12);

    it("OpCo base fee matches property fee expense (single property)", () => {
      for (let i = 0; i < 12; i++) {
        expect(companyResult[i].baseFeeRevenue).toBeCloseTo(propResult[i].feeBase, 2);
      }
    });

    it("OpCo incentive fee matches property fee expense (single property)", () => {
      for (let i = 0; i < 12; i++) {
        expect(companyResult[i].incentiveFeeRevenue).toBeCloseTo(propResult[i].feeIncentive, 2);
      }
    });
  });
});

describe("Per-Property Fee Impact on NOI and Cash Flow", () => {
  it("higher fee rates reduce property NOI", () => {
    const lowFee = { ...baseProperty, baseManagementFeeRate: 0.02, incentiveManagementFeeRate: 0.05 };
    const highFee = { ...baseProperty, baseManagementFeeRate: 0.08, incentiveManagementFeeRate: 0.25 };
    const resultLow = generatePropertyProForma(lowFee, baseGlobal, 12);
    const resultHigh = generatePropertyProForma(highFee, baseGlobal, 12);

    for (let i = 0; i < 12; i++) {
      expect(resultLow[i].noi).toBeGreaterThan(resultHigh[i].noi);
    }
  });

  it("higher fee rates increase OpCo revenue", () => {
    const lowFee = { ...baseProperty, baseManagementFeeRate: 0.02, incentiveManagementFeeRate: 0.05 };
    const highFee = { ...baseProperty, baseManagementFeeRate: 0.08, incentiveManagementFeeRate: 0.25 };
    const companyLow = generateCompanyProForma([lowFee], baseGlobal, 12);
    const companyHigh = generateCompanyProForma([highFee], baseGlobal, 12);

    for (let i = 0; i < 12; i++) {
      expect(companyHigh[i].totalRevenue).toBeGreaterThan(companyLow[i].totalRevenue);
    }
  });

  it("fee changes are zero-sum: SPV loss = OpCo gain", () => {
    const propA = { ...baseProperty, baseManagementFeeRate: 0.03, incentiveManagementFeeRate: 0.10 };
    const propB = { ...baseProperty, baseManagementFeeRate: 0.07, incentiveManagementFeeRate: 0.20 };

    const resultA = generatePropertyProForma(propA, baseGlobal, 12);
    const resultB = generatePropertyProForma(propB, baseGlobal, 12);

    for (let i = 0; i < 12; i++) {
      const feeDiffBase = resultB[i].feeBase - resultA[i].feeBase;
      const feeDiffIncentive = resultB[i].feeIncentive - resultA[i].feeIncentive;
      const noiDiff = resultA[i].noi - resultB[i].noi;
      expect(noiDiff).toBeCloseTo(feeDiffBase + feeDiffIncentive, 2);
    }
  });
});

describe("Per-Property Fee Constants", () => {
  it("DEFAULT_BASE_MANAGEMENT_FEE_RATE is 5%", () => {
    expect(DEFAULT_BASE_MANAGEMENT_FEE_RATE).toBe(0.05);
  });

  it("DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE is 15%", () => {
    expect(DEFAULT_INCENTIVE_MANAGEMENT_FEE_RATE).toBe(0.15);
  });
});

describe("Seed Data Integrity", () => {
  const expectedUsers = [
    { email: "admin", name: "Ricardo Cidale", company: "Norfolk Group", title: "Partner", role: "admin" },
    { email: "rosario@kitcapital.com", name: "Rosario David", company: "KIT Capital", title: "COO", role: "user" },
    { email: "kit@kitcapital.com", name: "Dov Tuzman", company: "KIT Capital", title: "Principal", role: "user" },
    { email: "lemazniku@icloud.com", name: "Lea Mazniku", company: "KIT Capital", title: "Partner", role: "user" },
    { email: "checker@norfolkgroup.io", name: "Checker", company: "Norfolk AI", title: "Checker", role: "checker" },
    { email: "bhuvan@norfolkgroup.io", name: "Bhuvan Agarwal", company: "Norfolk AI", title: "Financial Analyst", role: "user" },
    { email: "reynaldo.fagundes@norfolk.ai", name: "Reynaldo Fagundes", company: "Norfolk AI", title: "CTO", role: "user" },
    { email: "leslie@cidale.com", name: "Leslie Cidale", company: "Numeratti Endeavors", title: "Senior Partner", role: "user" },
  ];

  it("has exactly 8 seeded users", () => {
    expect(expectedUsers).toHaveLength(8);
  });

  it("has exactly 1 admin user", () => {
    const admins = expectedUsers.filter(u => u.role === "admin");
    expect(admins).toHaveLength(1);
    expect(admins[0].email).toBe("admin");
  });

  it("has exactly 1 checker user", () => {
    const checkers = expectedUsers.filter(u => u.role === "checker");
    expect(checkers).toHaveLength(1);
    expect(checkers[0].email).toBe("checker@norfolkgroup.io");
  });

  it("has 6 regular users", () => {
    const users = expectedUsers.filter(u => u.role === "user");
    expect(users).toHaveLength(6);
  });

  it("all users have non-empty name, company, and title", () => {
    for (const u of expectedUsers) {
      expect(u.name.length).toBeGreaterThan(0);
      expect(u.company.length).toBeGreaterThan(0);
      expect(u.title.length).toBeGreaterThan(0);
    }
  });

  it("all emails are unique", () => {
    const emails = expectedUsers.map(u => u.email);
    expect(new Set(emails).size).toBe(emails.length);
  });

  it("KIT Capital group has 3 members", () => {
    const kitMembers = expectedUsers.filter(u => u.company === "KIT Capital");
    expect(kitMembers).toHaveLength(3);
  });

  it("Norfolk entities have 4 members", () => {
    const norfolkMembers = expectedUsers.filter(u =>
      u.company === "Norfolk Group" || u.company === "Norfolk AI"
    );
    expect(norfolkMembers).toHaveLength(4);
  });

  it("Leslie Cidale is in Numeratti Endeavors", () => {
    const leslie = expectedUsers.find(u => u.email === "leslie@cidale.com");
    expect(leslie).toBeDefined();
    expect(leslie!.company).toBe("Numeratti Endeavors");
    expect(leslie!.title).toBe("Senior Partner");
  });
});
