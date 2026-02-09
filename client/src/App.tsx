import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { lazy, Suspense } from "react";
import { ErrorBoundary, FinancialErrorBoundary } from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Company from "@/pages/Company";
import CompanyAssumptions from "@/pages/CompanyAssumptions";
import Portfolio from "@/pages/Portfolio";
import PropertyDetail from "@/pages/PropertyDetail";
import PropertyEdit from "@/pages/PropertyEdit";
import Settings from "@/pages/Settings";
import PropertyMarketResearch from "@/pages/PropertyMarketResearch";
import CompanyResearch from "@/pages/CompanyResearch";
import GlobalResearch from "@/pages/GlobalResearch";
import Admin from "@/pages/Admin";
import Profile from "@/pages/Profile";
import Scenarios from "@/pages/Scenarios";
import PropertyFinder from "@/pages/PropertyFinder";
import SensitivityAnalysis from "@/pages/SensitivityAnalysis";
import FinancingAnalysis from "@/pages/FinancingAnalysis";
const Methodology = lazy(() => import("@/pages/Methodology"));
const CheckerManual = lazy(() => import("@/pages/CheckerManual"));

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF9F5]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    return <Redirect to="/login" />;
  }
  
  return <Component />;
}

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading, isAdmin } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF9F5]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    return <Redirect to="/login" />;
  }
  
  if (!isAdmin) {
    return <Redirect to="/" />;
  }
  
  return <Component />;
}

function CheckerRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading, isAdmin } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF9F5]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    return <Redirect to="/login" />;
  }
  
  const isChecker = isAdmin || user.role === "checker";
  if (!isChecker) {
    return <Redirect to="/" />;
  }
  
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FFF9F5]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <Component />
    </Suspense>
  );
}

function Router() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF9F5]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
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
        <ProtectedRoute component={CompanyAssumptions} />
      </Route>
      <Route path="/portfolio">
        <ProtectedRoute component={Portfolio} />
      </Route>
      <Route path="/property/:id">
        <FinancialErrorBoundary>
          <ProtectedRoute component={PropertyDetail} />
        </FinancialErrorBoundary>
      </Route>
      <Route path="/property/:id/edit">
        <ProtectedRoute component={PropertyEdit} />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={Settings} />
      </Route>
      <Route path="/methodology">
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-[#FFF9F5]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        }>
          <ProtectedRoute component={Methodology} />
        </Suspense>
      </Route>
      <Route path="/property/:id/research">
        <ProtectedRoute component={PropertyMarketResearch} />
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
        <ProtectedRoute component={Scenarios} />
      </Route>
      <Route path="/property-finder">
        <ProtectedRoute component={PropertyFinder} />
      </Route>
      <Route path="/sensitivity">
        <FinancialErrorBoundary>
          <ProtectedRoute component={SensitivityAnalysis} />
        </FinancialErrorBoundary>
      </Route>
      <Route path="/financing">
        <ProtectedRoute component={FinancingAnalysis} />
      </Route>
      <Route path="/checker-manual">
        <CheckerRoute component={CheckerManual} />
      </Route>
      <Route component={NotFound} />
    </Switch>
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
