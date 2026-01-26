import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Company from "@/pages/Company";
import CompanyAssumptions from "@/pages/CompanyAssumptions";
import Portfolio from "@/pages/Portfolio";
import PropertyDetail from "@/pages/PropertyDetail";
import PropertyEdit from "@/pages/PropertyEdit";
import Settings from "@/pages/Settings";
import Research from "@/pages/Research";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/company" component={Company} />
      <Route path="/company/assumptions" component={CompanyAssumptions} />
      <Route path="/portfolio" component={Portfolio} />
      <Route path="/property/:id" component={PropertyDetail} />
      <Route path="/property/:id/edit" component={PropertyEdit} />
      <Route path="/settings" component={Settings} />
      <Route path="/research" component={Research} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
