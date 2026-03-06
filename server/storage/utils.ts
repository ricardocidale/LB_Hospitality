export function stripAutoFields<T extends Record<string, unknown>>(data: T): Omit<T, "id" | "createdAt" | "updatedAt"> {
  const { id: _id, createdAt: _ca, updatedAt: _ua, ...rest } = data as Record<string, unknown>;
  return rest as Omit<T, "id" | "createdAt" | "updatedAt">;
}
