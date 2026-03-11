/**
 * App.tsx — Root component and routing hub for the hospitality business simulation platform.
 *
 * This file wires together the top-level React providers (React Query, Auth, Tooltips,
 * Toasts) and declares every client-side route in the application.
 *
 * Key architectural decisions:
 *   • All page components (except Login and NotFound) are lazy-loaded so the initial
 *     bundle stays small. Each page is wrapped in <Suspense> with a spinner fallback.
 *   • Four route-guard wrappers enforce role-based access:
 *       – ProtectedRoute: any authenticated user
 *       – AdminRoute: admin role only
 *       – ManagementRoute: any role except "investor"
 *       – CheckerRoute: admin or checker roles
 *   • Financial pages are additionally wrapped in <FinancialErrorBoundary> so a
 *     calculation error in one page doesn't crash the whole app.
 *   • On first login each session, a <ResearchRefreshOverlay> triggers a background
 *     refresh of cached AI research data so dashboards show up-to-date content.
 *   • Several legacy routes (e.g. /sensitivity, /financing, /map) redirect to their
 *     new consolidated locations.
 */
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { lazy, Suspense, useState, useEffect, useCallback } from "react";
import {
  ErrorBoundary,
  FinancialErrorBoundary,
} from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import { ResearchRefreshOverlay } from "@/components/ResearchRefreshOverlay";
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Company = lazy(() => import("@/pages/Company"));
const CompanyAssumptions = lazy(() => import("@/pages/CompanyAssumptions"));
const Portfolio = lazy(() => import("@/pages/Portfolio"));
const Settings = lazy(() => import("@/pages/Settings"));
const Profile = lazy(() => import("@/pages/Profile"));
const PropertyDetail = lazy(() => import("@/pages/PropertyDetail"));
const PropertyEdit = lazy(() => import("@/pages/PropertyEdit"));
const PropertyPhotos = lazy(() => import("@/pages/PropertyPhotos"));
const PropertyMarketResearch = lazy(
  () => import("@/pages/PropertyMarketResearch"),
);
const CompanyResearch = lazy(() => import("@/pages/CompanyResearch"));
const GlobalResearch = lazy(() => import("@/pages/GlobalResearch"));
const ResearchHub = lazy(() => import("@/pages/ResearchHub"));
const Admin = lazy(() => import("@/pages/Admin"));
const Logos = lazy(() => import("@/pages/Logos"));
const Scenarios = lazy(() => import("@/pages/Scenarios"));
const PropertyFinder = lazy(() => import("@/pages/PropertyFinder"));
const SensitivityAnalysis = lazy(() => import("@/pages/SensitivityAnalysis"));
const FinancingAnalysis = lazy(() => import("@/pages/FinancingAnalysis"));
const Analysis = lazy(() => import("@/pages/Analysis"));
const CheckerManual = lazy(() => import("@/pages/CheckerManual"));
const Help = lazy(() => import("@/pages/Help"));
const MapView = lazy(() => import("@/pages/MapView"));
const VoiceLab = lazy(() => import("@/pages/VoiceLab"));
const IcpStudio = lazy(() => import("@/pages/IcpStudio"));
const Icp = lazy(() => import("@/pages/Icp"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

function ProtectedRoute({
  component: Component,
}: {
  component: React.ComponentType;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}

function AdminRoute({
  component: Component,
}: {
  component: React.ComponentType;
}) {
  const { user, isLoading, isAdmin } = useAuth();

  if (isLoading) return <PageLoader />;
  if (!user) return <Redirect to="/login" />;
  if (!isAdmin) return <Redirect to="/" />;

  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}

function ManagementRoute({
  component: Component,
}: {
  component: React.ComponentType;
}) {
  const { user, isLoading, hasManagementAccess } = useAuth();

  if (isLoading) return <PageLoader />;
  if (!user) return <Redirect to="/login" />;
  if (!hasManagementAccess) return <Redirect to="/" />;

  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}

function CheckerRoute({
  component: Component,
}: {
  component: React.ComponentType;
}) {
  const { user, isLoading, isAdmin } = useAuth();

  if (isLoading) return <PageLoader />;
  if (!user) return <Redirect to="/login" />;

  const isChecker = isAdmin || user.role === "checker";
  if (!isChecker) return <Redirect to="/" />;

  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}

/** Router — declares all client-side routes and handles the research refresh overlay. */
function Router() {
  const { user, isLoading } = useAuth();
  const [showResearchRefresh, setShowResearchRefresh] = useState(false);
  const prevUserRef = useState<any>(null);

  useEffect(() => {
    if (user && !prevUserRef[0]) {
      const sessionGuard = sessionStorage.getItem("research_refresh_done");
      if (sessionGuard) {
        prevUserRef[0] = user;
        return;
      }

      const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
      fetch("/api/research/last-full-refresh", { credentials: "include" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!data || !data.lastRefresh) {
            setShowResearchRefresh(true);
          } else {
            const age = Date.now() - new Date(data.lastRefresh).getTime();
            if (age >= THIRTY_DAYS_MS) {
              setShowResearchRefresh(true);
            }
          }
        })
        .catch(() => {});
    }
    prevUserRef[0] = user;
  }, [user]);

  const handleResearchComplete = useCallback((skipped?: boolean) => {
    setShowResearchRefresh(false);
    sessionStorage.setItem("research_refresh_done", Date.now().toString());
    if (!skipped) {
      fetch("/api/research/mark-full-refresh", {
        method: "POST",
        credentials: "include",
      }).catch(() => {});
    }
    queryClient.invalidateQueries({ queryKey: ["research"] });
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      {showResearchRefresh && (
        <ResearchRefreshOverlay onComplete={handleResearchComplete} />
      )}
      <Switch>
        <Route path="/login">{user ? <Redirect to="/" /> : <Login />}</Route>
        <Route path="/">
          <FinancialErrorBoundary>
            <ProtectedRoute component={Dashboard} />
          </FinancialErrorBoundary>
        </Route>
        <Route path="/company">
          <FinancialErrorBoundary>
            <ManagementRoute component={Company} />
          </FinancialErrorBoundary>
        </Route>
        <Route path="/company/assumptions">
          <FinancialErrorBoundary>
            <ManagementRoute component={CompanyAssumptions} />
          </FinancialErrorBoundary>
        </Route>
        <Route path="/portfolio">
          <FinancialErrorBoundary>
            <ProtectedRoute component={Portfolio} />
          </FinancialErrorBoundary>
        </Route>
        <Route path="/property/:id/edit">
          <FinancialErrorBoundary>
            <ProtectedRoute component={PropertyEdit} />
          </FinancialErrorBoundary>
        </Route>
        <Route path="/property/:id/photos">
          <ProtectedRoute component={PropertyPhotos} />
        </Route>
        <Route path="/property/:id/research">
          <ProtectedRoute component={PropertyMarketResearch} />
        </Route>
        <Route path="/property/:id">
          <FinancialErrorBoundary>
            <ProtectedRoute component={PropertyDetail} />
          </FinancialErrorBoundary>
        </Route>
        <Route path="/settings">
          <ProtectedRoute component={Settings} />
        </Route>
        <Route path="/help">
          <ProtectedRoute component={Help} />
        </Route>
        <Route path="/methodology">
          <Redirect to="/help" />
        </Route>
        <Route path="/research">
          <Redirect to="/" />
        </Route>
        <Route path="/company/research">
          <ManagementRoute component={CompanyResearch} />
        </Route>
        <Route path="/global/research">
          <Redirect to="/company/research" />
        </Route>
        <Route path="/admin">
          <AdminRoute component={Admin} />
        </Route>
        <Route path="/admin/logos">
          <AdminRoute component={Logos} />
        </Route>
        <Route path="/admin/icp-studio">
          <AdminRoute component={IcpStudio} />
        </Route>
        <Route path="/icp">
          <ManagementRoute component={Icp} />
        </Route>
        <Route path="/profile">
          <ProtectedRoute component={Profile} />
        </Route>
        <Route path="/scenarios">
          <FinancialErrorBoundary>
            <ManagementRoute component={Scenarios} />
          </FinancialErrorBoundary>
        </Route>
        <Route path="/property-finder">
          <ManagementRoute component={PropertyFinder} />
        </Route>
        <Route path="/analysis">
          <FinancialErrorBoundary>
            <ProtectedRoute component={Analysis} />
          </FinancialErrorBoundary>
        </Route>
        <Route path="/sensitivity">
          <Redirect to="/analysis" />
        </Route>
        <Route path="/financing">
          <Redirect to="/analysis" />
        </Route>
        <Route path="/executive-summary">
          <Redirect to="/" />
        </Route>
        <Route path="/map">
          <FinancialErrorBoundary>
            <ManagementRoute component={MapView} />
          </FinancialErrorBoundary>
        </Route>
        <Route path="/voice">
          <ErrorBoundary fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Voice Lab failed to load. Please reload the page.</p></div>}>
            <ProtectedRoute component={VoiceLab} />
          </ErrorBoundary>
        </Route>
        <Route path="/checker-manual">
          <Redirect to="/help" />
        </Route>
        <Route path="/compare">
          <Redirect to="/analysis" />
        </Route>
        <Route path="/timeline">
          <Redirect to="/analysis" />
        </Route>
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
