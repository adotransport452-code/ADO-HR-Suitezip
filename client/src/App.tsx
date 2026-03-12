import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import NotFound from "@/pages/not-found";
import { NepaliDateDisplay } from "@/components/NepaliDateDisplay";

import Dashboard from "@/pages/Dashboard";
import Employees from "@/pages/Employees";
import Attendance from "@/pages/Attendance";
import Overtime from "@/pages/Overtime";
import OvertimeEmployeeDetail from "@/pages/OvertimeEmployeeDetail";
import LeaveReport from "@/pages/LeaveReport";
import MealExpenses from "@/pages/MealExpenses";
import KitchenExpenses from "@/pages/KitchenExpenses";
import Overall from "@/pages/Overall";

function Router() {
  return (
    <>
      <NepaliDateDisplay />
      <Layout>
        <Switch>
          <Route path="/">{() => <Redirect to="/dashboard" />}</Route>
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/employees" component={Employees} />
          <Route path="/attendance" component={Attendance} />
          <Route path="/overtime" component={Overtime} />
          <Route path="/overtime/employee/:id" component={OvertimeEmployeeDetail} />
          <Route path="/leaves" component={LeaveReport} />
          <Route path="/meals" component={MealExpenses} />
          <Route path="/kitchen" component={KitchenExpenses} />
          <Route path="/overall" component={Overall} />
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
