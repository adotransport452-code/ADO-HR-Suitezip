import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import NotFound from "@/pages/not-found";
import { NepaliDateDisplay } from "@/components/NepaliDateDisplay";

import Employees from "@/pages/Employees";
import LeaveReport from "@/pages/LeaveReport";
import MealExpenses from "@/pages/MealExpenses";
import Overall from "@/pages/Overall";

function Router() {
  return (
    <>
      <NepaliDateDisplay />
      <Layout>
      <Switch>
        <Route path="/">
          {/* Default redirect to overall */}
          {() => <Redirect to="/overall" />}
        </Route>
        <Route path="/overall" component={Overall} />
        <Route path="/employees" component={Employees} />
        <Route path="/leaves" component={LeaveReport} />
        <Route path="/meals" component={MealExpenses} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
    </>
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
