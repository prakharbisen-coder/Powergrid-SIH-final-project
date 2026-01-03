import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "./contexts/AuthContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/AppSidebar";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Materials from "./pages/Materials";
import MaterialBreakdown from "./pages/MaterialBreakdown";
import Forecasting from "./pages/Forecasting";
import Budget from "./pages/Budget";
import BudgetOptimization from "./pages/BudgetOptimization";
import Scenarios from "./pages/Scenarios";
import Analytics from "./pages/Analytics";
import Procurement from "./pages/Procurement";
import Warehouse from "./pages/Warehouse";
import InventoryAlerts from "./pages/InventoryAlerts";
import AlertsCenter from "./pages/AlertsCenter";
import Chat from "./pages/Chat";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

import "./App.css";

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Layout with Sidebar
const LayoutWithSidebar = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-x-hidden">
          <div className="h-full w-full">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes with Sidebar */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <LayoutWithSidebar>
              <Dashboard />
            </LayoutWithSidebar>
          </ProtectedRoute>
        } />
        
        <Route path="/projects" element={
          <ProtectedRoute>
            <LayoutWithSidebar>
              <Projects />
            </LayoutWithSidebar>
          </ProtectedRoute>
        } />
        
        <Route path="/materials" element={
          <ProtectedRoute>
            <LayoutWithSidebar>
              <Materials />
            </LayoutWithSidebar>
          </ProtectedRoute>
        } />
        
        <Route path="/material-breakdown" element={
          <ProtectedRoute>
            <LayoutWithSidebar>
              <MaterialBreakdown />
            </LayoutWithSidebar>
          </ProtectedRoute>
        } />
        
        <Route path="/forecasting" element={
          <ProtectedRoute>
            <LayoutWithSidebar>
              <Forecasting />
            </LayoutWithSidebar>
          </ProtectedRoute>
        } />
        
        <Route path="/budget" element={
          <ProtectedRoute>
            <LayoutWithSidebar>
              <Budget />
            </LayoutWithSidebar>
          </ProtectedRoute>
        } />
        
        <Route path="/budget-optimization" element={
          <ProtectedRoute>
            <LayoutWithSidebar>
              <BudgetOptimization />
            </LayoutWithSidebar>
          </ProtectedRoute>
        } />
        
        <Route path="/scenarios" element={
          <ProtectedRoute>
            <LayoutWithSidebar>
              <Scenarios />
            </LayoutWithSidebar>
          </ProtectedRoute>
        } />
        
        <Route path="/analytics" element={
          <ProtectedRoute>
            <LayoutWithSidebar>
              <Analytics />
            </LayoutWithSidebar>
          </ProtectedRoute>
        } />
        
        <Route path="/procurement" element={
          <ProtectedRoute>
            <LayoutWithSidebar>
              <Procurement />
            </LayoutWithSidebar>
          </ProtectedRoute>
        } />
        
        <Route path="/warehouse" element={
          <ProtectedRoute>
            <LayoutWithSidebar>
              <Warehouse />
            </LayoutWithSidebar>
          </ProtectedRoute>
        } />

        <Route path="/inventory-alerts" element={
          <ProtectedRoute>
            <LayoutWithSidebar>
              <InventoryAlerts />
            </LayoutWithSidebar>
          </ProtectedRoute>
        } />

        <Route path="/materials/breakdown" element={<Navigate to="/material-breakdown" replace />} />
        
        <Route path="/alerts" element={
          <ProtectedRoute>
            <LayoutWithSidebar>
              <AlertsCenter />
            </LayoutWithSidebar>
          </ProtectedRoute>
        } />
        
        <Route path="/chat" element={
          <ProtectedRoute>
            <LayoutWithSidebar>
              <Chat />
            </LayoutWithSidebar>
          </ProtectedRoute>
        } />
        
        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      <Toaster />
    </Router>
  );
}

export default App;
