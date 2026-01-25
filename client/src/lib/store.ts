import { create } from "zustand";

// --- GLOBAL ASSUMPTIONS ---
export interface GlobalAssumptions {
  modelStartDate: string;
  inflationRate: number; // 0.03
  baseManagementFee: number; // 0.04
  incentiveManagementFee: number; // 0.10
  partnerSalary: number; // 150000
  staffSalary: number; // 75000
  travelCostPerClient: number; // 12000
  itLicensePerClient: number; // 24000
  marketingRate: number; // 0.05
  miscOpsRate: number; // 0.03
  officeLeaseStart: number; // 36000
  professionalServicesStart: number; // 24000
  techInfraStart: number; // 18000
  businessInsuranceStart: number; // 12000
  standardAcqPackage: {
    purchasePrice: number; // 2300000
    buildingImprovements: number; // 800000
    preOpeningCosts: number; // 150000
    operatingReserve: number; // 200000
    monthsToOps: number; // 6
  };
  debtAssumptions: {
    interestRate: number; // 0.09
    amortizationYears: number; // 25
    refiLTV: number; // 0.75
    refiClosingCostRate: number; // 0.03
    acqLTV: number; // 0.75
    acqClosingCostRate: number; // 0.02
  };
}

// --- PROPERTY MODEL ---
export interface Property {
  id: string;
  name: string;
  location: string;
  market: "North America" | "Latin America";
  imageUrl: string;
  status: "Operational" | "Development" | "Acquisition";
  
  // Timeline
  acquisitionDate: string;
  operationsStartDate: string;
  
  // Development / Acquisition Costs
  purchasePrice: number;
  buildingImprovements: number;
  preOpeningCosts: number;
  operatingReserve: number;
  
  // Operations Specs
  roomCount: number;
  startAdr: number;
  adrGrowthRate: number;
  startOccupancy: number; // 0.60
  maxOccupancy: number; // 0.90
  occupancyRampMonths: number; // 6 months per step
  occupancyGrowthStep: number; // 0.05
  stabilizationMonths: number; // 36
  
  // Financial Config
  type: "Full Equity" | "Financed";
  cateringLevel: "Partial" | "Full";
  
  // Expense Adjustments (Multipliers)
  laborAdj: number;
  utilitiesAdj: number;
  taxAdj: number;
}

// --- STORE STATE ---
interface AppState {
  global: GlobalAssumptions;
  properties: Property[];
  
  // Actions
  updateGlobal: (data: Partial<GlobalAssumptions>) => void;
  updateProperty: (id: string, data: Partial<Property>) => void;
  addProperty: (property: Omit<Property, "id">) => void;
  deleteProperty: (id: string) => void;
}

// --- INITIAL DATA ---
const INITIAL_GLOBAL: GlobalAssumptions = {
  modelStartDate: "2026-04-01",
  inflationRate: 0.03,
  baseManagementFee: 0.04,
  incentiveManagementFee: 0.10,
  partnerSalary: 150000,
  staffSalary: 75000,
  travelCostPerClient: 12000,
  itLicensePerClient: 24000,
  marketingRate: 0.05,
  miscOpsRate: 0.03,
  officeLeaseStart: 36000,
  professionalServicesStart: 24000,
  techInfraStart: 18000,
  businessInsuranceStart: 12000,
  standardAcqPackage: {
    purchasePrice: 2300000,
    buildingImprovements: 800000,
    preOpeningCosts: 150000,
    operatingReserve: 200000,
    monthsToOps: 6
  },
  debtAssumptions: {
    interestRate: 0.09,
    amortizationYears: 25,
    refiLTV: 0.75,
    refiClosingCostRate: 0.03,
    acqLTV: 0.75,
    acqClosingCostRate: 0.02
  }
};

const INITIAL_PROPERTIES: Property[] = [
  {
    id: "prop-1",
    name: "The Hudson Estate",
    location: "Upstate New York",
    market: "North America",
    imageUrl: "/src/assets/property-ny.png",
    status: "Development",
    acquisitionDate: "2026-06-01",
    operationsStartDate: "2026-12-01",
    purchasePrice: 2300000, // Standard
    buildingImprovements: 800000,
    preOpeningCosts: 150000,
    operatingReserve: 200000,
    roomCount: 20,
    startAdr: 275,
    adrGrowthRate: 0.025,
    startOccupancy: 0.60,
    maxOccupancy: 0.90,
    occupancyRampMonths: 6,
    occupancyGrowthStep: 0.05,
    stabilizationMonths: 36,
    type: "Full Equity",
    cateringLevel: "Partial",
    laborAdj: 1.0,
    utilitiesAdj: 1.10,
    taxAdj: 1.20
  },
  {
    id: "prop-2",
    name: "Eden Summit Lodge",
    location: "Eden, Utah",
    market: "North America",
    imageUrl: "/src/assets/property-utah.png",
    status: "Acquisition",
    acquisitionDate: "2027-01-01",
    operationsStartDate: "2027-07-01",
    purchasePrice: 2300000,
    buildingImprovements: 800000,
    preOpeningCosts: 150000,
    operatingReserve: 200000,
    roomCount: 20,
    startAdr: 325,
    adrGrowthRate: 0.025,
    startOccupancy: 0.60,
    maxOccupancy: 0.90,
    occupancyRampMonths: 6,
    occupancyGrowthStep: 0.05,
    stabilizationMonths: 36,
    type: "Full Equity",
    cateringLevel: "Full",
    laborAdj: 0.95,
    utilitiesAdj: 1.0,
    taxAdj: 0.90
  },
  {
    id: "prop-3",
    name: "Austin Hillside",
    location: "Austin, Texas",
    market: "North America",
    imageUrl: "/src/assets/property-austin.png",
    status: "Acquisition",
    acquisitionDate: "2027-07-01",
    operationsStartDate: "2028-01-01",
    purchasePrice: 2300000,
    buildingImprovements: 800000,
    preOpeningCosts: 150000,
    operatingReserve: 200000,
    roomCount: 20,
    startAdr: 225,
    adrGrowthRate: 0.025,
    startOccupancy: 0.60,
    maxOccupancy: 0.90,
    occupancyRampMonths: 6,
    occupancyGrowthStep: 0.05,
    stabilizationMonths: 36,
    type: "Full Equity",
    cateringLevel: "Partial",
    laborAdj: 1.05,
    utilitiesAdj: 1.15,
    taxAdj: 1.00
  },
  {
    id: "prop-4",
    name: "Casa Medellín",
    location: "Medellín, Colombia",
    market: "Latin America",
    imageUrl: "/src/assets/property-medellin.png",
    status: "Acquisition",
    acquisitionDate: "2028-01-01",
    operationsStartDate: "2028-07-01",
    purchasePrice: 2300000,
    buildingImprovements: 800000,
    preOpeningCosts: 150000,
    operatingReserve: 200000,
    roomCount: 20,
    startAdr: 150,
    adrGrowthRate: 0.04,
    startOccupancy: 0.60,
    maxOccupancy: 0.90,
    occupancyRampMonths: 6,
    occupancyGrowthStep: 0.05,
    stabilizationMonths: 36,
    type: "Financed",
    cateringLevel: "Full",
    laborAdj: 0.65,
    utilitiesAdj: 0.80,
    taxAdj: 0.60
  },
  {
    id: "prop-5",
    name: "Blue Ridge Manor",
    location: "Asheville, North Carolina",
    market: "North America",
    imageUrl: "/src/assets/property-asheville.png",
    status: "Acquisition",
    acquisitionDate: "2028-01-01",
    operationsStartDate: "2028-07-01",
    purchasePrice: 2300000,
    buildingImprovements: 800000,
    preOpeningCosts: 150000,
    operatingReserve: 200000,
    roomCount: 20,
    startAdr: 285,
    adrGrowthRate: 0.025,
    startOccupancy: 0.60,
    maxOccupancy: 0.90,
    occupancyRampMonths: 6,
    occupancyGrowthStep: 0.05,
    stabilizationMonths: 36,
    type: "Financed",
    cateringLevel: "Full",
    laborAdj: 0.95,
    utilitiesAdj: 1.0,
    taxAdj: 0.95
  }
];

export const useStore = create<AppState>((set) => ({
  global: INITIAL_GLOBAL,
  properties: INITIAL_PROPERTIES,
  
  updateGlobal: (data) => set((state) => ({ 
    global: { ...state.global, ...data } 
  })),
  
  updateProperty: (id, data) => set((state) => ({
    properties: state.properties.map(p => p.id === id ? { ...p, ...data } : p)
  })),
  
  addProperty: (property) => set((state) => ({
    properties: [...state.properties, { ...property, id: Math.random().toString(36).substring(7) }]
  })),
  
  deleteProperty: (id) => set((state) => ({
    properties: state.properties.filter(p => p.id !== id)
  }))
}));
