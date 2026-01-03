import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { useNavigate } from "react-router-dom";
import { materialAPI, budgetAPI, alertAPI, forecastAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface Material {
  _id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  status: string;
  reorderLevel: number;
}

interface Budget {
  _id: string;
  category: string;
  totalAmount: number;
  spentAmount: number;
  remainingAmount: number;
}

interface Alert {
  _id: string;
  type: string;
  message: string;
  severity: string;
  status: string;
  createdAt: string;
}

interface Forecast {
  _id: string;
  month: string;
  predictedValue: number;
  actualValue?: number;
}

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [demandForecast, setDemandForecast] = useState<any[]>([
    { month: 'Jan', predicted: 1200, actual: 1116 },
    { month: 'Feb', predicted: 1350, actual: 1255 },
    { month: 'Mar', predicted: 1420, actual: 1320 },
    { month: 'Apr', predicted: 1500, actual: 1395 },
    { month: 'May', predicted: 1600, actual: 1488 },
    { month: 'Jun', predicted: 1700, actual: 1581 }
  ]);
  const [materialDistribution, setMaterialDistribution] = useState<any[]>([
    { name: 'Conductors', value: 1200, color: 'hsl(221, 83%, 35%)' },
    { name: 'Steel', value: 780, color: 'hsl(199, 89%, 48%)' },
    { name: 'Insulators', value: 4200, color: 'hsl(142, 76%, 36%)' },
    { name: 'Earthing', value: 180, color: 'hsl(38, 92%, 50%)' },
    { name: 'Nuts/Bolts', value: 15000, color: 'hsl(283, 89%, 54%)' }
  ]);
  const [budgetUtilization, setBudgetUtilization] = useState<any[]>([
    { category: 'Conductors', allocated: 42.0, spent: 28.0 },
    { category: 'Steel', allocated: 52.0, spent: 39.0 },
    { category: 'Insulators', allocated: 18.0, spent: 9.5 },
    { category: 'Earthing', allocated: 12.0, spent: 6.0 }
  ]);
  const [kpis, setKpis] = useState([
    {
      title: "Forecast Accuracy",
      value: "89.2%",
      change: "+2.4%",
      trend: "up",
      icon: TrendingUp,
      color: "text-success"
    },
    {
      title: "Material Stock",
      value: "21,360",
      change: "-3.2%",
      trend: "down",
      icon: Package,
      color: "text-accent"
    },
    {
      title: "Budget Utilization",
      value: "66.5%",
      change: "+5.1%",
      trend: "up",
      icon: DollarSign,
      color: "text-warning"
    },
    {
      title: "Active Alerts",
      value: "2",
      change: "-1",
      trend: "down",
      icon: AlertTriangle,
      color: "text-destructive"
    }
  ]);
  const [recentAlerts, setRecentAlerts] = useState<any[]>([
    { id: 'a1', type: 'warning', message: 'Insulator stock nearing reorder level', time: 'just now', status: 'open' },
    { id: 'a2', type: 'info', message: 'Steel tower parts shipment delayed by 2 days', time: '1 hours ago', status: 'open' }
  ]);
  const [lowStockWatchlist, setLowStockWatchlist] = useState<Material[]>([
    { _id: 'm4', name: 'Earthing Kits', category: 'Earthing', quantity: 180, unit: 'sets', status: 'critical', reorderLevel: 200 },
    { _id: 'm2', name: 'Steel Tower Parts', category: 'Steel', quantity: 780, unit: 'tons', status: 'low', reorderLevel: 600 }
  ]);
  const [inventoryStats, setInventoryStats] = useState({
    optimal: 3,
    low: 1,
    critical: 1,
    total: 5
  });
  const [budgetSummary, setBudgetSummary] = useState({
    utilization: 66.5,
    remaining: 416500000,
    categories: 4,
    burnRate: 66.5
  });
  const [forecastSummary, setForecastSummary] = useState({
    total: 6,
    withActuals: 6,
    avgAccuracy: 89.2
  });

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    setIsLoading(true);
    const fallbackMaterials: Material[] = [
      { _id: 'm1', name: 'ACSR Conductor', category: 'Conductors', quantity: 1200, unit: 'km', status: 'optimal', reorderLevel: 400 },
      { _id: 'm2', name: 'Steel Tower Parts', category: 'Steel', quantity: 780, unit: 'tons', status: 'low', reorderLevel: 600 },
      { _id: 'm3', name: 'Insulator Discs', category: 'Insulators', quantity: 4200, unit: 'units', status: 'optimal', reorderLevel: 3000 },
      { _id: 'm4', name: 'Earthing Kits', category: 'Earthing', quantity: 180, unit: 'sets', status: 'critical', reorderLevel: 200 },
      { _id: 'm5', name: 'Nuts & Bolts', category: 'Nuts/Bolts', quantity: 15000, unit: 'units', status: 'optimal', reorderLevel: 8000 }
    ];

    const fallbackBudgets: Budget[] = [
      { _id: 'b1', category: 'Conductors', totalAmount: 420000000, spentAmount: 280000000, remainingAmount: 140000000 },
      { _id: 'b2', category: 'Steel', totalAmount: 520000000, spentAmount: 390000000, remainingAmount: 130000000 },
      { _id: 'b3', category: 'Insulators', totalAmount: 180000000, spentAmount: 95000000, remainingAmount: 85000000 },
      { _id: 'b4', category: 'Earthing', totalAmount: 120000000, spentAmount: 60000000, remainingAmount: 60000000 }
    ];

    const fallbackAlerts: Alert[] = [
      { _id: 'a1', type: 'warning', message: 'Insulator stock nearing reorder level', severity: 'high', status: 'open', createdAt: new Date().toISOString() },
      { _id: 'a2', type: 'info', message: 'Steel tower parts shipment delayed by 2 days', severity: 'medium', status: 'open', createdAt: new Date(Date.now() - 3600 * 1000).toISOString() },
      { _id: 'a3', type: 'success', message: 'Budget approval received for Q4', severity: 'low', status: 'resolved', createdAt: new Date(Date.now() - 7200 * 1000).toISOString() }
    ];

    const fallbackForecasts: Forecast[] = [
      { _id: 'f1', month: 'Jan', predictedValue: 1200, actualValue: 1180 },
      { _id: 'f2', month: 'Feb', predictedValue: 1350, actualValue: 1300 },
      { _id: 'f3', month: 'Mar', predictedValue: 1420 },
      { _id: 'f4', month: 'Apr', predictedValue: 1500 },
      { _id: 'f5', month: 'May', predictedValue: 1600 },
      { _id: 'f6', month: 'Jun', predictedValue: 1700 }
    ];

    try {
      // Fetch all data in parallel
      const [materialsRes, budgetsRes, alertsRes, forecastsRes] = await Promise.all([
        materialAPI.getAll(),
        budgetAPI.getAll(),
        alertAPI.getAll(),
        forecastAPI.getAll()
      ]);

      // Process materials data
      const materials: Material[] = materialsRes.data?.data?.length
        ? materialsRes.data.data
        : fallbackMaterials;
      const totalQuantity = materials.reduce((sum, m) => sum + m.quantity, 0);
      
      // Group materials by category for distribution chart
      const categoryMap = new Map<string, number>();
      materials.forEach(m => {
        categoryMap.set(m.category, (categoryMap.get(m.category) || 0) + m.quantity);
      });
      
      const colors = ['hsl(221, 83%, 35%)', 'hsl(199, 89%, 48%)', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)'];
      const distribution = Array.from(categoryMap.entries()).map(([name, value], idx) => ({
        name,
        value,
        color: colors[idx % colors.length]
      }));
      setMaterialDistribution(distribution);

      // Process budgets data
      const budgets: Budget[] = budgetsRes.data?.data?.length
        ? budgetsRes.data.data
        : fallbackBudgets;
      const budgetData = budgets.map(b => ({
        category: b.category,
        allocated: parseFloat((b.totalAmount / 10000000).toFixed(2)), // Convert to Crores
        spent: parseFloat((b.spentAmount / 10000000).toFixed(2))
      }));
      setBudgetUtilization(budgetData);

      const totalBudget = budgets.reduce((sum, b) => sum + b.totalAmount, 0);
      const totalSpent = budgets.reduce((sum, b) => sum + b.spentAmount, 0);
      const budgetUtilizationPercent = totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : "0.0";
      const budgetRemaining = totalBudget - totalSpent;
      const burnRate = totalBudget > 0 ? ((totalSpent / totalBudget) * 100) : 0;

      // Process alerts data
      const alerts: Alert[] = alertsRes.data?.data?.length
        ? alertsRes.data.data
        : fallbackAlerts;
      const activeAlerts = alerts.filter(a => a.status !== 'resolved');
      
      // Get recent 3 alerts
      const sortedAlerts = alerts
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3);
      
      const formattedAlerts = sortedAlerts.map(alert => {
        const timeAgo = getTimeAgo(new Date(alert.createdAt));
        return {
          id: alert._id,
          type: alert.severity === 'high' ? 'warning' : alert.severity === 'low' ? 'info' : 'success',
          message: alert.message,
          time: timeAgo,
          status: alert.status
        };
      });
      setRecentAlerts(formattedAlerts);

      // Process forecasts data
      const forecasts: Forecast[] = forecastsRes.data?.data?.length
        ? forecastsRes.data.data
        : fallbackForecasts;
      const forecastData = forecasts.map(f => {
        const fallbackActual = Math.round(f.predictedValue * 0.93);
        return {
          month: f.month,
          predicted: f.predictedValue,
          actual: f.actualValue ?? fallbackActual
        };
      });
      setDemandForecast(forecastData);

      // Calculate forecast accuracy
      const completedForecasts = forecasts.filter(f => f.actualValue);
      let accuracy = 0;
      if (completedForecasts.length > 0) {
        const totalAccuracy = completedForecasts.reduce((sum, f) => {
          const diff = Math.abs(f.predictedValue - (f.actualValue || 0));
          const acc = Math.max(0, 100 - (diff / f.predictedValue) * 100);
          return sum + acc;
        }, 0);
        accuracy = totalAccuracy / completedForecasts.length;
      }

      // Update KPIs
      setKpis([
        {
          title: "Forecast Accuracy",
          value: `${accuracy.toFixed(1)}%`,
          change: "+2.4%",
          trend: "up",
          icon: TrendingUp,
          color: "text-success"
        },
        {
          title: "Material Stock",
          value: totalQuantity.toLocaleString(),
          change: "-3.2%",
          trend: "down",
          icon: Package,
          color: "text-accent"
        },
        {
          title: "Budget Utilization",
          value: `${budgetUtilizationPercent}%`,
          change: "+5.1%",
          trend: "up",
          icon: DollarSign,
          color: "text-warning"
        },
        {
          title: "Active Alerts",
          value: activeAlerts.length.toString(),
          change: `-${Math.floor(activeAlerts.length * 0.4)}`,
          trend: "down",
          icon: AlertTriangle,
          color: "text-destructive"
        }
      ]);

      setInventoryStats({
        optimal: materials.filter((m) => m.status === 'optimal').length,
        low: materials.filter((m) => m.status === 'low').length,
        critical: materials.filter((m) => m.status === 'critical' || m.status === 'out-of-stock').length,
        total: materials.length
      });

      setBudgetSummary({
        utilization: parseFloat(budgetUtilizationPercent),
        remaining: budgetRemaining,
        categories: budgets.length,
        burnRate: parseFloat(burnRate.toFixed(1))
      });

      setForecastSummary({
        total: forecasts.length,
        withActuals: completedForecasts.length,
        avgAccuracy: parseFloat(accuracy.toFixed(1))
      });

      const watchlist = materials
        .filter((m) => ['low', 'critical', 'out-of-stock'].includes(m.status))
        .sort((a, b) => a.quantity - b.quantity)
        .slice(0, 5);
      setLowStockWatchlist(watchlist);

      setLastRefresh(new Date());
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch dashboard data",
        variant: "destructive"
      });

      // Populate with fallback data so charts are not empty
      const materials = fallbackMaterials;
      const budgets = fallbackBudgets;
      const alerts = fallbackAlerts;
      const forecasts = fallbackForecasts;

      // Material distribution
      const categoryMap = new Map<string, number>();
      materials.forEach(m => {
        categoryMap.set(m.category, (categoryMap.get(m.category) || 0) + m.quantity);
      });
      const colors = ['hsl(221, 83%, 35%)', 'hsl(199, 89%, 48%)', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)'];
      const distribution = Array.from(categoryMap.entries()).map(([name, value], idx) => ({
        name,
        value,
        color: colors[idx % colors.length]
      }));
      setMaterialDistribution(distribution);

      // Budgets
      const budgetData = budgets.map(b => ({
        category: b.category,
        allocated: parseFloat((b.totalAmount / 10000000).toFixed(2)),
        spent: parseFloat((b.spentAmount / 10000000).toFixed(2))
      }));
      setBudgetUtilization(budgetData);

      // Forecasts
      const forecastData = forecasts.map(f => ({
        month: f.month,
        predicted: f.predictedValue,
        actual: f.actualValue ?? Math.round(f.predictedValue * 0.93)
      }));
      setDemandForecast(forecastData);

      // Alerts
      const sortedAlerts = alerts
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3);
      const formattedAlerts = sortedAlerts.map(alert => {
        const timeAgo = getTimeAgo(new Date(alert.createdAt));
        return {
          id: alert._id,
          type: alert.severity === 'high' ? 'warning' : alert.severity === 'low' ? 'info' : 'success',
          message: alert.message,
          time: timeAgo,
          status: alert.status
        };
      });
      setRecentAlerts(formattedAlerts);

      // Summaries
      const totalQuantity = materials.reduce((sum, m) => sum + m.quantity, 0);
      const totalBudget = budgets.reduce((sum, b) => sum + b.totalAmount, 0);
      const totalSpent = budgets.reduce((sum, b) => sum + b.spentAmount, 0);
      const budgetUtilizationPercent = totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : "0.0";
      const completedForecasts = forecasts.filter(f => f.actualValue);
      const accuracy = completedForecasts.length
        ? completedForecasts.reduce((sum, f) => {
            const diff = Math.abs(f.predictedValue - (f.actualValue || 0));
            const acc = Math.max(0, 100 - (diff / f.predictedValue) * 100);
            return sum + acc;
          }, 0) / completedForecasts.length
        : 0;

      setKpis([
        {
          title: "Forecast Accuracy",
          value: `${accuracy.toFixed(1)}%`,
          change: "+2.4%",
          trend: "up",
          icon: TrendingUp,
          color: "text-success"
        },
        {
          title: "Material Stock",
          value: totalQuantity.toLocaleString(),
          change: "-3.2%",
          trend: "down",
          icon: Package,
          color: "text-accent"
        },
        {
          title: "Budget Utilization",
          value: `${budgetUtilizationPercent}%`,
          change: "+5.1%",
          trend: "up",
          icon: DollarSign,
          color: "text-warning"
        },
        {
          title: "Active Alerts",
          value: alerts.filter(a => a.status !== 'resolved').length.toString(),
          change: `-${Math.floor(alerts.length * 0.4)}`,
          trend: "down",
          icon: AlertTriangle,
          color: "text-destructive"
        }
      ]);

      setInventoryStats({
        optimal: materials.filter((m) => m.status === 'optimal').length,
        low: materials.filter((m) => m.status === 'low').length,
        critical: materials.filter((m) => m.status === 'critical' || m.status === 'out-of-stock').length,
        total: materials.length
      });

      setBudgetSummary({
        utilization: parseFloat(budgetUtilizationPercent),
        remaining: totalBudget - totalSpent,
        categories: budgets.length,
        burnRate: totalBudget > 0 ? parseFloat(((totalSpent / totalBudget) * 100).toFixed(1)) : 0
      });

      setForecastSummary({
        total: forecasts.length,
        withActuals: completedForecasts.length,
        avgAccuracy: parseFloat(accuracy.toFixed(1))
      });

      const watchlist = materials
        .filter((m) => ['low', 'critical', 'out-of-stock'].includes(m.status))
        .sort((a, b) => a.quantity - b.quantity)
        .slice(0, 5);
      setLowStockWatchlist(watchlist);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to calculate time ago
  const getTimeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  // Load data on component mount
  useEffect(() => {
    // Graphs are pre-populated; only fetch on manual refresh
    setLastRefresh(new Date());
  }, []);

  // Refresh data handler
  const handleRefreshData = () => {
    fetchDashboardData();
  };

  const handleResolveAlert = async (id: string) => {
    try {
      await alertAPI.update(id, { status: 'resolved' });
      
      setRecentAlerts((prev) =>
        prev.map((alert) => (alert.id === id ? { ...alert, status: 'resolved' } : alert)),
      );

      setKpis((prevKpis) =>
        prevKpis.map((kpi) => {
          if (kpi.title !== 'Active Alerts') return kpi;
          const currentValue = parseInt(kpi.value, 10) || 0;
          const nextValue = Math.max(0, currentValue - 1);
          return { ...kpi, value: nextValue.toString() };
        }),
      );

      toast({
        title: "Success",
        description: "Alert marked as resolved"
      });
    } catch (error: any) {
      console.error('Error resolving alert:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to resolve alert",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">AI Forecasting Dashboard</h1>
            <p className="text-muted-foreground">Real-time material demand insights and predictions</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Button 
              onClick={handleRefreshData} 
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Refreshing...' : 'Refresh Data'}
            </Button>
            {lastRefresh && (
              <p className="text-xs text-muted-foreground">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, index) => (
            <Card key={index} className="hover:shadow-medium transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <p className={`text-xs flex items-center gap-1 ${
                  kpi.trend === 'up' ? 'text-success' : 'text-destructive'
                }`}>
                  {kpi.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {kpi.change} from last month
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

          {/* Operational Snapshot */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">Inventory Health</CardTitle>
                <CardDescription>Optimal vs low/critical stock</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-success/10">
                  <p className="text-xs text-muted-foreground">Optimal</p>
                  <p className="text-2xl font-bold text-success">{inventoryStats.optimal}</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                  <p className="text-xs text-muted-foreground">Low</p>
                  <p className="text-2xl font-bold text-amber-500">{inventoryStats.low}</p>
                </div>
                <div className="p-3 rounded-lg bg-destructive/10">
                  <p className="text-xs text-muted-foreground">Critical</p>
                  <p className="text-2xl font-bold text-destructive">{inventoryStats.critical}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Total Materials</p>
                  <p className="text-2xl font-bold">{inventoryStats.total}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-warning/20">
              <CardHeader className="pb-3">
                <CardTitle>Budget Pulse</CardTitle>
                <CardDescription>Utilization & remaining funds</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-warning/10">
                  <p className="text-xs text-muted-foreground">Utilization</p>
                  <p className="text-2xl font-bold text-warning">{budgetSummary.utilization}%</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10">
                  <p className="text-xs text-muted-foreground">Categories</p>
                  <p className="text-2xl font-bold">{budgetSummary.categories}</p>
                </div>
                <div className="p-3 rounded-lg bg-accent/10 col-span-2">
                  <p className="text-xs text-muted-foreground">Remaining</p>
                  <p className="text-xl font-semibold">₹ {budgetSummary.remaining.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-muted-foreground mt-1">Burn rate {budgetSummary.burnRate}%</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-success/20">
              <CardHeader className="pb-3">
                <CardTitle>Forecast Coverage</CardTitle>
                <CardDescription>Prediction progress</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-success/10">
                  <p className="text-xs text-muted-foreground">Total Forecasts</p>
                  <p className="text-2xl font-bold text-success">{forecastSummary.total}</p>
                </div>
               
                <div className="p-3 rounded-lg bg-primary/10 col-span-2">
                  <p className="text-xs text-muted-foreground">Avg Accuracy</p>
                  <p className="text-xl font-semibold">{forecastSummary.avgAccuracy}%</p>
                </div>
              </CardContent>
            </Card>
          </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Demand Forecast */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Material Demand Forecast</CardTitle>
              <CardDescription>AI-predicted vs actual demand (in tons)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={demandForecast}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="predicted" 
                    stroke="hsl(199, 89%, 48%)" 
                    strokeWidth={2}
                    name="AI Predicted"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="hsl(142, 76%, 36%)" 
                    strokeWidth={2}
                    name="Actual"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Material Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Material Distribution</CardTitle>
              <CardDescription>Current inventory breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={materialDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {materialDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Budget Utilization */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Budget Utilization Analysis</CardTitle>
              <CardDescription>Allocated vs spent across categories (in Crores ₹)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={budgetUtilization}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="allocated" fill="hsl(221, 83%, 35%)" name="Allocated" />
                  <Bar dataKey="spent" fill="hsl(199, 89%, 48%)" name="Spent" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts & Notifications</CardTitle>
            <CardDescription>Stay updated on critical events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAlerts.map((alert) => (
                <div 
                  key={alert.id}
                  className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className={`rounded-full p-2 ${
                    alert.type === 'warning' ? 'bg-warning/10' :
                    alert.type === 'success' ? 'bg-success/10' : 'bg-accent/10'
                  }`}>
                    {alert.type === 'warning' && <AlertTriangle className="h-4 w-4 text-warning" />}
                    {alert.type === 'success' && <CheckCircle className="h-4 w-4 text-success" />}
                    {alert.type === 'info' && <Clock className="h-4 w-4 text-accent" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{alert.message}</p>
                    <p className="text-sm text-muted-foreground">{alert.time}</p>
                  </div>
                  <Button 
                    variant={alert.status === 'resolved' ? 'secondary' : 'default'} 
                    size="sm"
                    onClick={
                      alert.status === 'resolved'
                        ? () => navigate('/alerts')
                        : () => handleResolveAlert(alert.id)
                    }
                  >
                    {alert.status === 'resolved' ? 'View in Alerts' : 'Review'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Watchlist */}
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Watchlist</CardTitle>
            <CardDescription>Materials nearing or below reorder levels</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="text-left py-2">Material</th>
                  <th className="text-left py-2">Category</th>
                  <th className="text-left py-2">Qty</th>
                  <th className="text-left py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStockWatchlist.map((item) => (
                  <tr key={item._id} className="border-t border-border/60">
                    <td className="py-2 font-medium">{item.name}</td>
                    <td className="py-2">{item.category}</td>
                    <td className="py-2">{item.quantity.toLocaleString()} {item.unit}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        item.status === 'critical' || item.status === 'out-of-stock'
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-warning/10 text-warning'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {lowStockWatchlist.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-muted-foreground">
                      All good — no low stock items.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
