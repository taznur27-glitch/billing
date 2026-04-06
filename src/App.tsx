import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import AddPhone from "./pages/AddPhone";
import Sales from "./pages/Sales";
import Parties from "./pages/Parties";
import Returns from "./pages/Returns";
import Transactions from "./pages/Transactions";
import Admin from "./pages/Admin";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  return (
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
    </Routes>
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
