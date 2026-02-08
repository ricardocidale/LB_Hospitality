import { create } from "zustand";

// --- Types ---

export type Property = {
  id: string;
  name: string;
  location: string;
  market: string;
  imageUrl: string;
  status: "Operational" | "Development" | "Acquisition";
  acquisitionDate: string;
  operationsStartDate: string;
  purchasePrice: number;
  roomCount: number;
  adr: number; // Average Daily Rate
  occupancyRate: number; // 0-1
  type: "Full Equity" | "Financed";
  description: string;
};

export type ManagementCompanyStats = {
  partners: number;
  staffFTE: number;
  totalFTE: number;
  clients: number;
  baseFeeRate: number; // 0.04
  incentiveFeeRate: number; // 0.10
  cashOnHand: number;
};

// --- Mock Data ---

const INITIAL_PROPERTIES: Property[] = [
  {
    id: "prop-1",
    name: "The Hudson Estate",
    location: "Upstate New York",
    market: "North America",
    imageUrl: "/images/property-ny.png",
    status: "Development",
    acquisitionDate: "2026-06-01",
    operationsStartDate: "2026-12-01",
    purchasePrice: 2300000,
    roomCount: 20,
    adr: 275,
    occupancyRate: 0.60,
    type: "Full Equity",
    description: "A cozy boutique hotel nestled in the autumn foliage of Upstate New York."
  },
  {
    id: "prop-2",
    name: "Eden Summit Lodge",
    location: "Eden, Utah",
    market: "North America",
    imageUrl: "/images/property-utah.png",
    status: "Acquisition",
    acquisitionDate: "2027-01-01",
    operationsStartDate: "2027-07-01",
    purchasePrice: 2300000,
    roomCount: 20,
    adr: 325,
    occupancyRate: 0.60,
    type: "Full Equity",
    description: "Modern luxury ski lodge offering premium access to powder and peaks."
  },
  {
    id: "prop-3",
    name: "Austin Hillside",
    location: "Austin, Texas",
    market: "North America",
    imageUrl: "/images/property-austin.png",
    status: "Acquisition",
    acquisitionDate: "2027-07-01",
    operationsStartDate: "2028-01-01",
    purchasePrice: 2300000,
    roomCount: 20,
    adr: 225,
    occupancyRate: 0.60,
    type: "Full Equity",
    description: "Stylish boutique hotel in the heart of Austin's vibrant culture."
  },
  {
    id: "prop-4",
    name: "Casa Medellín",
    location: "Medellín, Colombia",
    market: "Latin America",
    imageUrl: "/images/property-medellin.png",
    status: "Acquisition",
    acquisitionDate: "2028-01-01",
    operationsStartDate: "2028-07-01",
    purchasePrice: 2300000,
    roomCount: 20,
    adr: 150,
    occupancyRate: 0.60,
    type: "Financed",
    description: "Tropical luxury meets urban sophistication in the City of Eternal Spring."
  },
  {
    id: "prop-5",
    name: "Blue Ridge Manor",
    location: "Asheville, North Carolina",
    market: "North America",
    imageUrl: "/images/property-asheville.png",
    status: "Acquisition",
    acquisitionDate: "2028-01-01",
    operationsStartDate: "2028-07-01",
    purchasePrice: 2300000,
    roomCount: 20,
    adr: 285,
    occupancyRate: 0.60,
    type: "Financed",
    description: "Historic charm with modern amenities overlooking the Blue Ridge Mountains."
  }
];

// --- Store ---

interface AppState {
  properties: Property[];
  companyStats: ManagementCompanyStats;
  addProperty: (property: Omit<Property, "id">) => void;
  deleteProperty: (id: string) => void;
  updateProperty: (id: string, data: Partial<Property>) => void;
  refreshCalculations: () => void; // Placeholder for recalculating derived stats
}

export const useStore = create<AppState>((set, get) => ({
  properties: INITIAL_PROPERTIES,
  companyStats: {
    partners: 3,
    staffFTE: 2.5, // Starts at 2.5 for 1-3 clients
    totalFTE: 5.5,
    clients: 1, // Start with 1 owned property active in Year 1 partial
    baseFeeRate: 0.04,
    incentiveFeeRate: 0.10,
    cashOnHand: 225000, // Tranche 1
  },
  
  addProperty: (property) => set((state) => {
    const newProp = { ...property, id: Math.random().toString(36).substring(7) };
    const newProperties = [...state.properties, newProp];
    return { 
      properties: newProperties,
      companyStats: recalculateCompanyStats(newProperties, state.companyStats)
    };
  }),

  deleteProperty: (id) => set((state) => {
    const newProperties = state.properties.filter(p => p.id !== id);
    return {
      properties: newProperties,
      companyStats: recalculateCompanyStats(newProperties, state.companyStats)
    };
  }),

  updateProperty: (id, data) => set((state) => {
    const newProperties = state.properties.map(p => p.id === id ? { ...p, ...data } : p);
    return {
      properties: newProperties,
    };
  }),

  refreshCalculations: () => set((state) => ({
    companyStats: recalculateCompanyStats(state.properties, state.companyStats)
  }))
}));

// --- Helpers ---

function recalculateCompanyStats(properties: Property[], currentStats: ManagementCompanyStats): ManagementCompanyStats {
  const clientCount = properties.length;
  let staffFTE = 2.5;
  
  if (clientCount >= 7) staffFTE = 7.0;
  else if (clientCount >= 4) staffFTE = 4.5;
  
  return {
    ...currentStats,
    clients: clientCount,
    staffFTE,
    totalFTE: currentStats.partners + staffFTE
  };
}


