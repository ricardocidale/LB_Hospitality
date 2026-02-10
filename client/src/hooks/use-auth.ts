import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/models/auth";

/**
 * Fetches the currently authenticated user from the /api/auth/user endpoint.
 * Returns null if the server responds with a 401 status (unauthenticated).
 * @returns {Promise<User | null>} A promise that resolves to the authenticated User object, or null if not authenticated.
 * @throws {Error} If the response is not OK and the status is not 401.
 */
async function fetchUser(): Promise<User | null> {
  const response = await fetch("/api/auth/user", {
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Initiates a logout by redirecting the browser to the /api/logout endpoint.
 * @returns {Promise<void>} A promise that resolves immediately after setting the redirect.
 */
async function logout(): Promise<void> {
  window.location.href = "/api/logout";
}

/**
 * React hook that provides authentication state and actions using React Query.
 * Returns the current user, loading state, authentication status, logout trigger,
 * and logout pending state. Caches user data for 5 minutes.
 * @returns {{ user: User | null | undefined, isLoading: boolean, isAuthenticated: boolean, logout: Function, isLoggingOut: boolean }} An object containing user data, loading/authentication flags, and logout controls.
 */
export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
