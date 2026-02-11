import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { lazy, Suspense, useState, useEffect, useCallback } from "react";
import { ErrorBoundary, FinancialErrorBoundary } from "@/components/ErrorBoundary";
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
const PropertyMarketResearch = lazy(() => import("@/pages/PropertyMarketResearch"));
const CompanyResearch = lazy(() => import("@/pages/CompanyResearch"));
const GlobalResearch = lazy(() => import("@/pages/GlobalResearch"));
const Admin = lazy(() => import("@/pages/Admin"));
const Scenarios = lazy(() => import("@/pages/Scenarios"));
const PropertyFinder = lazy(() => import("@/pages/PropertyFinder"));
const SensitivityAnalysis = lazy(() => import("@/pages/SensitivityAnalysis"));
const FinancingAnalysis = lazy(() => import("@/pages/FinancingAnalysis"));
const Analysis = lazy(() => import("@/pages/Analysis"));
const Methodology = lazy(() => import("@/pages/Methodology"));
const CheckerManual = lazy(() => import("@/pages/CheckerManual"));
const Help = lazy(() => import("@/pages/Help"));
const ExecutiveSummary = lazy(() => import("@/pages/ExecutiveSummary"));
const MapView = lazy(() => import("@/pages/MapView"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
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

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
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

function CheckerRoute({ component: Component }: { component: React.ComponentType }) {
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

function Router() {
  const { user, isLoading } = useAuth();
  const [showResearchRefresh, setShowResearchRefresh] = useState(false);
  const prevUserRef = useState<any>(null);
  
  useEffect(() => {
    if (user && !prevUserRef[0]) {
      const lastRefresh = sessionStorage.getItem("research_refresh_done");
      if (!lastRefresh) {
        setShowResearchRefresh(true);
      }
    }
    prevUserRef[0] = user;
  }, [user]);

  const handleResearchComplete = useCallback(() => {
    setShowResearchRefresh(false);
    sessionStorage.setItem("research_refresh_done", Date.now().toString());
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
    {showResearchRefresh && <ResearchRefreshOverlay onComplete={handleResearchComplete} />}
    <Switch>
      <Route path="/login">
        {user ? <Redirect to="/" /> : <Login />}
      </Route>
      <Route path="/">
        <FinancialErrorBoundary>
          <ProtectedRoute component={Dashboard} />
        </FinancialErrorBoundary>
      </Route>
      <Route path="/company">
        <FinancialErrorBoundary>
          <ProtectedRoute component={Company} />
        </FinancialErrorBoundary>
      </Route>
      <Route path="/company/assumptions">
        <FinancialErrorBoundary>
          <ProtectedRoute component={CompanyAssumptions} />
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
      <Route path="/company/research">
        <ProtectedRoute component={CompanyResearch} />
      </Route>
      <Route path="/global/research">
        <ProtectedRoute component={GlobalResearch} />
      </Route>
      <Route path="/admin">
        <AdminRoute component={Admin} />
      </Route>
      <Route path="/profile">
        <ProtectedRoute component={Profile} />
      </Route>
      <Route path="/scenarios">
        <FinancialErrorBoundary>
          <ProtectedRoute component={Scenarios} />
        </FinancialErrorBoundary>
      </Route>
      <Route path="/property-finder">
        <ProtectedRoute component={PropertyFinder} />
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
        <Redirect to="/analysis" />
      </Route>
      <Route path="/map">
        <Redirect to="/portfolio" />
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
