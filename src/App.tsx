import { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";

const Layout = lazy(() => import("@/components/Layout"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Inventory = lazy(() => import("@/pages/Inventory"));
const AddPhone = lazy(() => import("@/pages/AddPhone"));
const Sales = lazy(() => import("@/pages/Sales"));
const Parties = lazy(() => import("@/pages/Parties"));
const Returns = lazy(() => import("@/pages/Returns"));
const Transactions = lazy(() => import("@/pages/Transactions"));
const Admin = lazy(() => import("@/pages/Admin"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient();

function AppRoutes() {
  const loadingFallback = (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  return (
    <Suspense fallback={loadingFallback}>
      <Routes>
        <Route path="/" element={<Layout><Navigate to="/dashboard" replace /></Layout>} />
        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
        <Route path="/inventory" element={<Layout><Inventory /></Layout>} />
        <Route path="/inventory/add" element={<Layout><AddPhone /></Layout>} />
        <Route path="/sales" element={<Layout><Sales /></Layout>} />
        <Route path="/returns" element={<Layout><Returns /></Layout>} />
        <Route path="/parties" element={<Layout><Parties /></Layout>} />
        <Route path="/transactions" element={<Layout><Transactions /></Layout>} />
        <Route path="/admin" element={<Layout><Admin /></Layout>} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Layout><NotFound /></Layout>} />
      </Routes>
    </Suspense>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
