import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
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
import Methodology from "@/pages/Methodology";
import Research from "@/pages/Research";
import AdminUsers from "@/pages/AdminUsers";
import Profile from "@/pages/Profile";

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
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/company">
        <ProtectedRoute component={Company} />
      </Route>
      <Route path="/company/assumptions">
        <ProtectedRoute component={CompanyAssumptions} />
      </Route>
      <Route path="/portfolio">
        <ProtectedRoute component={Portfolio} />
      </Route>
      <Route path="/property/:id">
        <ProtectedRoute component={PropertyDetail} />
      </Route>
      <Route path="/property/:id/edit">
        <ProtectedRoute component={PropertyEdit} />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={Settings} />
      </Route>
      <Route path="/methodology">
        <ProtectedRoute component={Methodology} />
      </Route>
      <Route path="/research">
        <ProtectedRoute component={Research} />
      </Route>
      <Route path="/admin/users">
        <AdminRoute component={AdminUsers} />
      </Route>
      <Route path="/profile">
        <ProtectedRoute component={Profile} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
