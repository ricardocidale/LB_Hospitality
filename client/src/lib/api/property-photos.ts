import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PropertyPhoto, InsertPropertyPhoto, UpdatePropertyPhoto } from "@shared/schema";
import { invalidateAllFinancialQueries } from "./properties";

// --- Fetch helpers ---

async function fetchPropertyPhotos(propertyId: number): Promise<PropertyPhoto[]> {
  const res = await fetch(`/api/properties/${propertyId}/photos`);
  if (!res.ok) throw new Error("Failed to fetch property photos");
  return res.json();
}

async function addPhoto(propertyId: number, data: { imageUrl: string; caption?: string; skipProcessing?: boolean }): Promise<PropertyPhoto> {
  const res = await fetch(`/api/properties/${propertyId}/photos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to add photo");
  return res.json();
}

async function updatePhoto(propertyId: number, photoId: number, data: UpdatePropertyPhoto): Promise<PropertyPhoto> {
  const res = await fetch(`/api/properties/${propertyId}/photos/${photoId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update photo");
  return res.json();
}

async function deletePhoto(propertyId: number, photoId: number): Promise<void> {
  const res = await fetch(`/api/properties/${propertyId}/photos/${photoId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete photo");
}

async function setHero(propertyId: number, photoId: number): Promise<void> {
  const res = await fetch(`/api/properties/${propertyId}/photos/${photoId}/set-hero`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to set hero photo");
}

async function reorderPhotos(propertyId: number, orderedIds: number[]): Promise<void> {
  const res = await fetch(`/api/properties/${propertyId}/photos/reorder`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderedIds }),
  });
  if (!res.ok) throw new Error("Failed to reorder photos");
}

// --- Hooks ---

export function usePropertyPhotos(propertyId: number) {
  return useQuery({
    queryKey: ["propertyPhotos", propertyId],
    queryFn: () => fetchPropertyPhotos(propertyId),
    enabled: !!propertyId,
  });
}

export function useAddPropertyPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ propertyId, imageUrl, caption, skipProcessing }: { propertyId: number; imageUrl: string; caption?: string; skipProcessing?: boolean }) =>
      addPhoto(propertyId, { imageUrl, caption, skipProcessing }),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["propertyPhotos", vars.propertyId] });
      invalidateAllFinancialQueries(queryClient);
    },
  });
}

export function useUpdatePropertyPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ propertyId, photoId, data }: { propertyId: number; photoId: number; data: UpdatePropertyPhoto }) =>
      updatePhoto(propertyId, photoId, data),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["propertyPhotos", vars.propertyId] });
    },
  });
}

export function useDeletePropertyPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ propertyId, photoId }: { propertyId: number; photoId: number }) =>
      deletePhoto(propertyId, photoId),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["propertyPhotos", vars.propertyId] });
      invalidateAllFinancialQueries(queryClient);
    },
  });
}

export function useSetHeroPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ propertyId, photoId }: { propertyId: number; photoId: number }) =>
      setHero(propertyId, photoId),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["propertyPhotos", vars.propertyId] });
      invalidateAllFinancialQueries(queryClient);
    },
  });
}

export function useReorderPhotos() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ propertyId, orderedIds }: { propertyId: number; orderedIds: number[] }) =>
      reorderPhotos(propertyId, orderedIds),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["propertyPhotos", vars.propertyId] });
    },
  });
}
