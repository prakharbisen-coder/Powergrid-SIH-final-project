import { 
  LayoutDashboard, 
  TrendingUp,
  ShoppingCart,
  Warehouse, 
  BarChart3, 
  FlaskConical,
  MessageSquare,
  Bell,
  Settings,
  Zap,
  LogOut,
  Package,
  Brain,
  Target
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

const mainMenuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, description: "Overview & KPIs" },
  { title: "Projects", url: "/projects", icon: Settings, description: "Manage projects" },
  { title: "Forecasting", url: "/forecasting", icon: TrendingUp, description: "Demand prediction" },
  { title: "Procurement", url: "/procurement", icon: ShoppingCart, description: "Purchase orders" },
  { title: "Warehouse", url: "/warehouse", icon: Warehouse, description: "Inventory management" },
];

const additionalMenuItems = [
  { title: "Material Breakdown", url: "/material-breakdown", icon: Package, description: "Category analysis" },
  { title: "Budget Optimization", url: "/budget-optimization", icon: Brain, description: "ML predictions" },
  { title: "Analytics", url: "/analytics", icon: BarChart3, description: "Reports & insights" },
  { title: "Scenarios", url: "/scenarios", icon: FlaskConical, description: "Simulation" },
  { title: "Inventory Alerts", url: "/inventory-alerts", icon: Target, description: "Geospatial alerts" },
  { title: "AI Assistant", url: "/chat", icon: MessageSquare, description: "Ask MATRIX" },
  { title: "Alerts", url: "/alerts", icon: Bell, description: "Notifications" },
];

export function AppSidebar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error during logout", error);
    } finally {
      localStorage.removeItem("userRole");
      localStorage.removeItem("userEmail");
      navigate("/login");
    }
  };

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-sidebar-foreground text-lg">MATRIX</h2>
            <p className="text-xs text-sidebar-foreground/60">POWERGRID Intelligence</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="flex flex-col gap-4">
        {/* Main Operations */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider font-semibold text-sidebar-foreground/60">
            Core Operations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url}
                      className={({ isActive }) => 
                        isActive 
                          ? "bg-gradient-accent text-white shadow-md rounded-lg" 
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-lg transition-colors"
                      }
                      title={item.description}
                    >
                      <item.icon className="h-5 w-5" />
                      <div className="flex flex-col">
                        <span className="font-medium">{item.title}</span>
                        <span className="text-xs opacity-70">{item.description}</span>
                      </div>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Analytics & Tools */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider font-semibold text-sidebar-foreground/60">
            Analytics & Tools
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {additionalMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url}
                      className={({ isActive }) => 
                        isActive 
                          ? "bg-gradient-accent text-white shadow-md rounded-lg" 
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-lg transition-colors"
                      }
                      title={item.description}
                    >
                      <item.icon className="h-5 w-5" />
                      <div className="flex flex-col">
                        <span className="font-medium">{item.title}</span>
                        <span className="text-xs opacity-70">{item.description}</span>
                      </div>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4 space-y-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink to="/settings" className="text-sidebar-foreground hover:bg-sidebar-accent/50 rounded-lg transition-colors">
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="cursor-pointer text-sidebar-foreground hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="text-xs text-sidebar-foreground/50 px-2 py-2">
          <p>v2.0.0</p>
          <p>© 2024 POWERGRID</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
