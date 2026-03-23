import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ScenarioResponse } from "./types";
import { invalidateAllFinancialQueries } from "./properties";

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
      invalidateAllFinancialQueries(queryClient);
    },
  });
}

export function useLoadScenario() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: loadScenario,
    onSuccess: () => {
      invalidateAllFinancialQueries(queryClient);
    },
  });
}

export function useUpdateScenario() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; description?: string } }) => 
      updateScenario(id, data),
    onSuccess: () => {
      invalidateAllFinancialQueries(queryClient);
    },
  });
}

export function useDeleteScenario() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteScenario,
    onSuccess: () => {
      invalidateAllFinancialQueries(queryClient);
    },
  });
}

async function shareScenario(data: { recipientEmail: string; mode: "single" | "all"; scenarioId?: number }): Promise<{ shares: any[]; recipientName: string }> {
  const res = await fetch("/api/scenarios/shares", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to share scenario");
  }
  return res.json();
}

export function useShareScenario() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: shareScenario,
    onSuccess: () => {
      invalidateAllFinancialQueries(queryClient);
    },
  });
}
