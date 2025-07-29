import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import Sidebar from "@/components/sidebar";
import DashboardNew from "@/pages/dashboard-new";
import ClientsPage from "@/pages/clients";
import AnalyticsPage from "@/pages/analytics";
import TeamPage from "@/pages/team";
import SampleRequestsPage from "@/pages/sample-requests";
import FinancesPage from "@/pages/finances";
import MarketingPage from "@/pages/marketing";
import NotFound from "@/pages/not-found";
import PasscodeEntry from "@/components/passcode-entry";

function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-6 left-6 z-50 lg:hidden bg-slate-800 hover:bg-slate-700 shadow-lg"
        onClick={() => setSidebarOpen(true)}
      >
        <Menu className="h-5 w-5 text-white" />
      </Button>

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="lg:ml-64 pt-16 lg:pt-0">
        {children}
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={DashboardNew} />
      <Route path="/dashboard" component={DashboardNew} />
      <Route path="/clients" component={ClientsPage} />
      <Route path="/team" component={TeamPage} />
      <Route path="/sample-requests" component={SampleRequestsPage} />
      <Route path="/finances" component={FinancesPage} />
      <Route path="/marketing" component={MarketingPage} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is already authenticated (persist in sessionStorage)
  useEffect(() => {
    const authStatus = sessionStorage.getItem('app-authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleAuthentication = () => {
    setIsAuthenticated(true);
    sessionStorage.setItem('app-authenticated', 'true');
  };

  // Show passcode entry if not authenticated
  if (!isAuthenticated) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <PasscodeEntry onAuthenticated={handleAuthentication} />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Layout>
          <Router />
        </Layout>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
