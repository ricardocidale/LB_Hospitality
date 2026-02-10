import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface User {
  id: number;
  email: string;
  name: string | null;
  company: string | null;
  title: string | null;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refetch: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * React context provider that manages authentication state including user fetching,
 * login, logout, and query cache invalidation. Wraps children with AuthContext
 * so descendant components can access auth state via the useAuth hook.
 * @param {{ children: ReactNode }} props - The component props.
 * @param {ReactNode} props.children - Child components to render within the auth context.
 * @returns {JSX.Element} The AuthContext provider wrapping the children.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  
  const { data, isLoading, refetch: refetchQuery } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) return null;
        throw new Error("Failed to fetch user");
      }
      const data = await res.json();
      return data.user as User;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Login failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Logout failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      queryClient.clear();
    },
  });

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const user = data ?? null;
  const isAdmin = user?.role === "admin";
  
  const refetch = () => {
    refetchQuery();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin, login, logout, refetch }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * React hook that returns the current authentication context. Must be used
 * within an AuthProvider. Provides access to the current user, loading state,
 * admin status, and login/logout/refetch functions.
 * @returns {AuthContextType} The authentication context containing user, isLoading, isAdmin, login, logout, and refetch.
 * @throws {Error} If called outside of an AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
