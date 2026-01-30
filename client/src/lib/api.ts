import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Property, InsertProperty, UpdateProperty } from "@shared/schema";

// --- TYPES ---
export type PropertyResponse = Property & { id: number };

export interface GlobalResponse {
  id: number;
  companyName: string;
  companyLogo: string | null;
  modelStartDate: string;
  companyOpsStartDate: string;
  fiscalYearStartMonth: number;
  inflationRate: number;
  fixedCostEscalationRate: number;
  // Revenue
  baseManagementFee: number;
  incentiveManagementFee: number;
  // SAFE Funding
  safeTranche1Amount: number;
  safeTranche1Date: string;
  safeTranche2Amount: number;
  safeTranche2Date: string;
  safeValuationCap: number;
  safeDiscountRate: number;
  // Compensation
  partnerSalary: number;
  staffSalary: number;
  // Fixed overhead
  officeLeaseStart: number;
  professionalServicesStart: number;
  techInfraStart: number;
  businessInsuranceStart: number;
  // Variable costs
  travelCostPerClient: number;
  itLicensePerClient: number;
  marketingRate: number;
  miscOpsRate: number;
  // Portfolio
  commissionRate: number;
  fullCateringFBBoost: number;
  partialCateringFBBoost: number;
  // Tax
  companyTaxRate: number;
  standardAcqPackage: {
    monthsToOps: number;
    purchasePrice: number;
    preOpeningCosts: number;
    operatingReserve: number;
    buildingImprovements: number;
  };
  debtAssumptions: {
    acqLTV: number;
    refiLTV: number;
    interestRate: number;
    amortizationYears: number;
    acqClosingCostRate: number;
    refiClosingCostRate: number;
    refiInterestRate?: number;
    refiAmortizationYears?: number;
    refiPeriodYears?: number;
  };
  updatedAt: string;
}

// --- API FUNCTIONS ---

async function fetchGlobalAssumptions(): Promise<GlobalResponse> {
  const res = await fetch("/api/global-assumptions");
  if (!res.ok) throw new Error("Failed to fetch global assumptions");
  return res.json();
}

async function updateGlobalAssumptions(data: Partial<GlobalResponse>): Promise<GlobalResponse> {
  const res = await fetch("/api/global-assumptions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update global assumptions");
  return res.json();
}

async function fetchProperties(): Promise<PropertyResponse[]> {
  const res = await fetch("/api/properties");
  if (!res.ok) throw new Error("Failed to fetch properties");
  return res.json();
}

async function fetchProperty(id: number): Promise<PropertyResponse> {
  const res = await fetch(`/api/properties/${id}`);
  if (!res.ok) throw new Error("Failed to fetch property");
  return res.json();
}

async function createProperty(data: InsertProperty): Promise<PropertyResponse> {
  const res = await fetch("/api/properties", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create property");
  return res.json();
}

async function updateProperty(id: number, data: UpdateProperty): Promise<PropertyResponse> {
  const res = await fetch(`/api/properties/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update property");
  return res.json();
}

async function deleteProperty(id: number): Promise<void> {
  const res = await fetch(`/api/properties/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete property");
}

// --- HOOKS ---

export function useGlobalAssumptions() {
  return useQuery({
    queryKey: ["globalAssumptions"],
    queryFn: fetchGlobalAssumptions,
  });
}

export function useUpdateGlobalAssumptions() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateGlobalAssumptions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["globalAssumptions"] });
    },
  });
}

export function useProperties() {
  return useQuery({
    queryKey: ["properties"],
    queryFn: fetchProperties,
  });
}

export function useProperty(id: number) {
  return useQuery({
    queryKey: ["properties", id],
    queryFn: () => fetchProperty(id),
    enabled: !!id,
  });
}

export function useCreateProperty() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
}

export function useUpdateProperty() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProperty }) => 
      updateProperty(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["properties", variables.id] });
    },
  });
}

export function useDeleteProperty() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
}

// --- SCENARIOS ---

export interface ScenarioResponse {
  id: number;
  userId: number;
  name: string;
  description: string | null;
  globalAssumptions: any;
  properties: any[];
  createdAt: string;
  updatedAt: string;
}

async function fetchScenarios(): Promise<ScenarioResponse[]> {
  const res = await fetch("/api/scenarios");
  if (!res.ok) throw new Error("Failed to fetch scenarios");
  return res.json();
}

async function createScenario(data: { name: string; description?: string }): Promise<ScenarioResponse> {
  const res = await fetch("/api/scenarios", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create scenario");
  return res.json();
}

async function loadScenario(id: number): Promise<void> {
  const res = await fetch(`/api/scenarios/${id}/load`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to load scenario");
}

async function updateScenario(id: number, data: { name?: string; description?: string }): Promise<ScenarioResponse> {
  const res = await fetch(`/api/scenarios/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update scenario");
  return res.json();
}

async function deleteScenario(id: number): Promise<void> {
  const res = await fetch(`/api/scenarios/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete scenario");
}

export function useScenarios() {
  return useQuery({
    queryKey: ["scenarios"],
    queryFn: fetchScenarios,
  });
}

export function useCreateScenario() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createScenario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenarios"] });
    },
  });
}

export function useLoadScenario() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: loadScenario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["globalAssumptions"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
}

export function useUpdateScenario() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; description?: string } }) => 
      updateScenario(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenarios"] });
    },
  });
}

export function useDeleteScenario() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteScenario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scenarios"] });
    },
  });
}
