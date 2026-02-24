/**
 * auth.tsx — Authentication context and provider for the entire client application.
 *
 * How it works:
 *   1. On mount, <AuthProvider> calls GET /api/auth/me to check if the browser
 *      has a valid session cookie. If it does, the server returns the User object;
 *      if not, it returns 401 and the user is treated as unauthenticated.
 *   2. The provider exposes `login(email, password)` and `logout()` mutations
 *      that POST to /api/auth/login and /api/auth/logout respectively. On success
 *      they invalidate the "auth/me" query so the user state refreshes instantly.
 *
 * Roles and access levels:
 *   • "admin"    — full platform access, can manage users, companies, and all settings
 *   • "checker"  — can view the Checker Manual and verification tools
 *   • "partner"  — a managing partner with company-level access
 *   • "investor" — read-only portfolio viewer; cannot access company settings,
 *                   scenario management, or property finder
 *   • Any other role defaults to standard management access.
 *
 * The `hasManagementAccess` flag is true for every role EXCEPT "investor". This
 * flag is used by route guards and sidebar visibility to hide management features
 * from investor users.
 *
 * The auth state is cached for 5 minutes (staleTime) to avoid redundant network
 * calls on every page navigation.
 */
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface User {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  company: string | null;
  companyId: number | null;
  companyName: string | null;
  title: string | null;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  isChecker: boolean;
  isPartner: boolean;
  isInvestor: boolean;
  hasManagementAccess: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refetch: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

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
  const isChecker = user?.role === "checker";
  const isPartner = user?.role === "partner";
  const isInvestor = user?.role === "investor";
  const hasManagementAccess = user?.role !== "investor";
  
  const refetch = () => {
    refetchQuery();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin, isChecker, isPartner, isInvestor, hasManagementAccess, login, logout, refetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
