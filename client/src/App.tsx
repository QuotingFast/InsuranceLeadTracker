import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/Dashboard";
import QuotePage from "@/pages/QuotePage";
import LeadsPage from "@/pages/LeadsPage";
import SMSPage from "@/pages/SMSPage";
import OptOutsPage from "@/pages/OptOutsPage";
import CompliancePage from "@/pages/CompliancePage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/leads" component={LeadsPage} />
      <Route path="/sms" component={SMSPage} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route path="/compliance" component={CompliancePage} />
      <Route path="/optouts" component={OptOutsPage} />
      <Route path="/quote/:qfCode" component={QuotePage} />
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
