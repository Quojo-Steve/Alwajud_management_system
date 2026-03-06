import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthContextProvider, useAuthContext } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import AppLayout from "@/components/layout/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import CyclesList from "@/pages/cycles/CyclesList";
import NewCycle from "@/pages/cycles/NewCycle";
import CycleDetails from "@/pages/cycles/CycleDetails";
import ClientsList from "@/pages/clients/ClientsList";
import NewClient from "@/pages/clients/NewClient";
import ClientDetails from "@/pages/clients/ClientDetails";
import OrdersList from "@/pages/orders/OrdersList";
import NewOrder from "@/pages/orders/NewOrder";
import OrderDetails from "@/pages/orders/OrderDetails";
import ReceiptsList from "@/pages/receipts/ReceiptsList";
import Analytics from "@/pages/analytics/Analytics";
import Settings from "@/pages/settings/Settings";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
const { currentUser } = useAuthContext();
  if (!currentUser) return <Navigate to="/" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function AppRoutes() {
const { currentUser } = useAuthContext();
  
  return (
    <Routes>
      <Route path="/" element={currentUser ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/cycles" element={<ProtectedRoute><CyclesList /></ProtectedRoute>} />
      <Route path="/cycles/new" element={<ProtectedRoute><NewCycle /></ProtectedRoute>} />
      <Route path="/cycles/:id" element={<ProtectedRoute><CycleDetails /></ProtectedRoute>} />
      <Route path="/clients" element={<ProtectedRoute><ClientsList /></ProtectedRoute>} />
      <Route path="/clients/new" element={<ProtectedRoute><NewClient /></ProtectedRoute>} />
      <Route path="/clients/:id" element={<ProtectedRoute><ClientDetails /></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute><OrdersList /></ProtectedRoute>} />
      <Route path="/orders/new" element={<ProtectedRoute><NewOrder /></ProtectedRoute>} />
      <Route path="/orders/:id" element={<ProtectedRoute><OrderDetails /></ProtectedRoute>} />
      <Route path="/receipts" element={<ProtectedRoute><ReceiptsList /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthContextProvider>
          <DataProvider>
            <AppRoutes />
          </DataProvider>
        </AuthContextProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
