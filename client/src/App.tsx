import { Switch, Route, useLocation } from "wouter";
import { useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import Sidebar from "@/components/Sidebar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { Menu } from "lucide-react";
import Dashboard from "@/pages/Dashboard";
import QuotePage from "@/pages/QuotePage";
import LeadsPage from "@/pages/LeadsPage";
import SMSPage from "@/pages/SMSPage";
import OptOutsPage from "@/pages/OptOutsPage";
import CompliancePage from "@/pages/CompliancePage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import QuotesPage from "@/pages/QuotesPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/leads" component={LeadsPage} />
      <Route path="/sms" component={SMSPage} />
      <Route path="/quotes" component={QuotesPage} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route path="/compliance" component={CompliancePage} />
      <Route path="/optouts" component={OptOutsPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/quote/:qfCode" component={QuotePage} />
      <Route path="/quote" component={QuotePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [location] = useLocation();
  const isMobile = useIsMobile();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
          {/* Desktop Sidebar */}
          {!isMobile && (
            <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} transition-all duration-300 bg-white dark:bg-gray-800 shadow-lg`}>
              <Sidebar 
                isOpen={true} 
                onClose={() => {}} 
                currentPage={location}
                isCollapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
              />
            </div>
          )}
          
          {/* Mobile Sidebar Overlay */}
          {isMobile && (
            <Sidebar 
              isOpen={sidebarOpen} 
              onClose={() => setSidebarOpen(false)} 
              currentPage={location}
              isCollapsed={false}
              onToggleCollapse={() => {}}
            />
          )}
          
          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Mobile Header */}
            {isMobile && (
              <header className="bg-white dark:bg-gray-800 shadow-sm p-4 flex items-center justify-between">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Insurance Lead Management
                </h1>
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Menu className="h-6 w-6" />
                </button>
              </header>
            )}
            
            {/* Page Content */}
            <main className="flex-1 overflow-y-auto">
              <Router />
            </main>
            
            {/* Mobile Bottom Navigation */}
            {isMobile && (
              <MobileBottomNav currentPage={location} />
            )}
          </div>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
