import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Inventory from "@/pages/Inventory";
import AddPhone from "@/pages/AddPhone";
import Sales from "@/pages/Sales";
import Parties from "@/pages/Parties";
import Returns from "@/pages/Returns";
import Transactions from "@/pages/Transactions";
import Admin from "@/pages/Admin";
import Auth from "@/pages/Auth";
import ResetPassword from "@/pages/ResetPassword";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/reset-password" element={<ResetPassword />} />
      {!session ? (
        <Route path="*" element={<Auth />} />
      ) : (
        <>
          <Route path="/" element={<Layout><Navigate to="/dashboard" replace /></Layout>} />
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/inventory" element={<Layout><Inventory /></Layout>} />
          <Route path="/inventory/add" element={<Layout><AddPhone /></Layout>} />
          <Route path="/sales" element={<Layout><Sales /></Layout>} />
          <Route path="/returns" element={<Layout><Returns /></Layout>} />
          <Route path="/parties" element={<Layout><Parties /></Layout>} />
          <Route path="/transactions" element={<Layout><Transactions /></Layout>} />
          <Route path="/admin" element={<Layout><Admin /></Layout>} />
          <Route path="*" element={<Layout><NotFound /></Layout>} />
        </>
      )}
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
