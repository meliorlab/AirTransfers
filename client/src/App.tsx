import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import AdminLogin from "@/pages/AdminLogin";
import AdminBookings from "@/pages/AdminBookings";
import AdminBookingDetail from "@/pages/AdminBookingDetail";
import AdminDrivers from "@/pages/AdminDrivers";
import AdminZones from "@/pages/AdminZones";
import AdminRates from "@/pages/AdminRates";
import AdminPricingRules from "@/pages/AdminPricingRules";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/bookings" component={AdminBookings} />
      <Route path="/admin/bookings/:id" component={AdminBookingDetail} />
      <Route path="/admin/drivers" component={AdminDrivers} />
      <Route path="/admin/zones" component={AdminZones} />
      <Route path="/admin/rates" component={AdminRates} />
      <Route path="/admin/pricing-rules" component={AdminPricingRules} />
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
