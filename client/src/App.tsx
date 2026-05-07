import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import NotFound from "@/pages/not-found";
import { NepaliDateDisplay } from "@/components/NepaliDateDisplay";
import { RealtimeProvider } from "@/components/RealtimeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute, AdminRoute } from "@/components/ProtectedRoute";

import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Employees from "@/pages/Employees";
import Attendance from "@/pages/Attendance";
import LeaveReport from "@/pages/LeaveReport";
import KitchenExpenses from "@/pages/KitchenExpenses";
import OfficeExpenses from "@/pages/OfficeExpenses";
import Overall from "@/pages/Overall";
import Salary from "@/pages/Salary";
import AdminUsers from "@/pages/AdminUsers";

function AppRoutes() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        {() => (
          <ProtectedRoute>
            <Redirect to="/dashboard" />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/dashboard">
        {() => (
          <ProtectedRoute>
            <NepaliDateDisplay />
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/employees">
        {() => (
          <ProtectedRoute>
            <NepaliDateDisplay />
            <Layout>
              <Employees />
            </Layout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/attendance">
        {() => (
          <ProtectedRoute>
            <NepaliDateDisplay />
            <Layout>
              <Attendance />
            </Layout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/leaves">
        {() => (
          <ProtectedRoute>
            <NepaliDateDisplay />
            <Layout>
              <LeaveReport />
            </Layout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/kitchen">
        {() => (
          <ProtectedRoute>
            <NepaliDateDisplay />
            <Layout>
              <KitchenExpenses />
            </Layout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/office">
        {() => (
          <ProtectedRoute>
            <NepaliDateDisplay />
            <Layout>
              <OfficeExpenses />
            </Layout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/overall">
        {() => (
          <ProtectedRoute>
            <NepaliDateDisplay />
            <Layout>
              <Overall />
            </Layout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/salary">
        {() => (
          <ProtectedRoute>
            <NepaliDateDisplay />
            <Layout>
              <Salary />
            </Layout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/admin/users">
        {() => (
          <AdminRoute>
            <NepaliDateDisplay />
            <Layout>
              <AdminUsers />
            </Layout>
          </AdminRoute>
        )}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <RealtimeProvider>
            <Toaster />
            <AppRoutes />
          </RealtimeProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
