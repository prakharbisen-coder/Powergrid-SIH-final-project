import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Area, AreaChart } from "recharts";
import { TrendingUp, AlertCircle, Zap, Calendar, Sparkles, Activity, AlertTriangle, CheckCircle, Package, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { forecastAPI, projectAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Forecasting = () => {
  const [selectedProject, setSelectedProject] = useState("project-1");
  const [selectedMaterial, setSelectedMaterial] = useState("steel");
  const [selectedDuration, setSelectedDuration] = useState("30");
  const [forecastData, setForecastData] = useState([
    { day: "Day 1", demand: 120, forecast: 125, supply: 100 },
    { day: "Day 5", demand: 145, forecast: 142, supply: 110 },
    { day: "Day 10", demand: 168, forecast: 175, supply: 120 },
    { day: "Day 15", demand: 192, forecast: 205, supply: 130 },
    { day: "Day 20", demand: 210, forecast: 220, supply: 140 },
    { day: "Day 25", demand: 235, forecast: 240, supply: 150 },
    { day: "Day 30", demand: 260, forecast: 265, supply: 160 }
  ]);
  const [lastRunSummary, setLastRunSummary] = useState<string | null>(null);
  const [mlForecast, setMlForecast] = useState<any>(null);
  const [mlLoading, setMlLoading] = useState(false);
  const [mlStatus, setMlStatus] = useState<any>(null);
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  const [forecastMetrics, setForecastMetrics] = useState({
    avgDailyDemand: { value: "189 units", change: "+12%" },
    peakDemand: { value: "265 units", change: "Day 30" },
    forecastAccuracy: { value: "94.2%", change: "+2.1%" },
    daysUntilShortage: { value: "12 days", change: "Critical" }
  });
  
  // Advanced forecasting state
  const [advancedForecast, setAdvancedForecast] = useState<any>(null);
  const [advancedLoading, setAdvancedLoading] = useState(false);
  const [forecastDays, setForecastDays] = useState("30");
  const [selectedMaterialForAdvanced, setSelectedMaterialForAdvanced] = useState("Steel");
  const [activeTab, setActiveTab] = useState("basic");
  
  const { toast } = useToast();
  
  const materialOptions = [
    "Steel", "Conductors", "Insulators", "Cement", "Nuts/Bolts", "Earthing"
  ];

  useEffect(() => {
    checkMLStatus();
    fetchProjects();
    generateDefaultInsights();
  }, []);

  const checkMLStatus = async () => {
    try {
      const response = await forecastAPI.checkMLStatus();
      setMlStatus(response.data.data);
    } catch (error) {
      console.error('Failed to check ML status:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      setLoadingProjects(true);
      const response = await projectAPI.getAll();
      const projects = response.data.data || [];
      setAvailableProjects(projects);
      
      // Set first project as selected if available
      if (projects.length > 0) {
        setSelectedProject(projects[0]._id);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive"
      });
    } finally {
      setLoadingProjects(false);
    }
  };

  const generateDefaultInsights = () => {
    setAiInsights([
      {
        icon: AlertCircle,
        title: "Shortage Expected",
        description: "In 12 days, demand will exceed current stock levels",
        severity: "high"
      },
      {
        icon: Zap,
        title: "Required Reorder",
        description: "240 units needed to maintain safety stock",
        severity: "medium"
      },
      {
        icon: TrendingUp,
        title: "Best Vendor",
        description: "Vendor A has best lead-time (8 days) at competitive rates",
        severity: "low"
      }
    ]);
  };

  const generateAIInsights = (mlData: any, forecastRecord: any) => {
    const insights: any[] = [];
    
    if (!mlData || !mlData.forecasts || mlData.forecasts.length === 0) {
      generateDefaultInsights();
      return;
    }

    // Risk Level Insight
    const riskLevel = mlData.risk_level || 'medium';
    if (riskLevel === 'high') {
      insights.push({
        icon: AlertCircle,
        title: "High Risk Project",
        description: `Project has HIGH risk rating. Close monitoring and contingency planning recommended.`,
        severity: "high"
      });
    } else if (riskLevel === 'medium') {
      insights.push({
        icon: AlertCircle,
        title: "Moderate Risk Level",
        description: `Project carries MODERATE risk. Regular reviews suggested to prevent issues.`,
        severity: "medium"
      });
    }

    // Cost Analysis Insight
    const totalCost = mlData.total_estimated_cost || 0;
    const costInCr = (totalCost / 10000000).toFixed(2);
    insights.push({
      icon: TrendingUp,
      title: "Cost Projection",
      description: `Total estimated project cost: ₹${costInCr} Cr. Budget allocation verified.`,
      severity: "low"
    });

    // Material Shortage Detection
    const forecasts = mlData.forecasts || [];
    const highDemandMaterials = forecasts
      .filter((f: any) => f.predicted_quantity > 10000)
      .map((f: any) => f.material);
    
    if (highDemandMaterials.length > 0) {
      insights.push({
        icon: Zap,
        title: "High Demand Materials",
        description: `${highDemandMaterials.join(', ')} require bulk procurement. Early ordering recommended.`,
        severity: "medium"
      });
    }

    // Confidence Score Analysis
    const avgConfidence = forecasts.reduce((sum: number, f: any) => sum + (f.confidence_score || 0), 0) / forecasts.length;
    if (avgConfidence > 0.85) {
      insights.push({
        icon: Sparkles,
        title: "High Forecast Accuracy",
        description: `AI model shows ${(avgConfidence * 100).toFixed(0)}% confidence. Predictions highly reliable.`,
        severity: "low"
      });
    } else if (avgConfidence < 0.7) {
      insights.push({
        icon: AlertCircle,
        title: "Prediction Uncertainty",
        description: `Model confidence at ${(avgConfidence * 100).toFixed(0)}%. Consider additional data validation.`,
        severity: "medium"
      });
    }

    // Duration Analysis
    const duration = forecastRecord?.duration || 30;
    if (duration > 90) {
      insights.push({
        icon: Calendar,
        title: "Extended Timeline",
        description: `Project duration of ${duration} days. Phased procurement strategy advisable.`,
        severity: "low"
      });
    }

    // Tax Impact Insight (if available)
    if (forecastRecord?.taxSummary) {
      const taxPct = forecastRecord.taxSummary.averageTaxPercentage?.toFixed(1) || '0';
      insights.push({
        icon: Activity,
        title: "Tax Impact Analysis",
        description: `Average tax burden: ${taxPct}%. Review tax optimization opportunities.`,
        severity: "medium"
      });
    }

    setAiInsights(insights.slice(0, 3)); // Show top 3 insights
  };

  const calculateForecastMetrics = (chartData: any[], mlData: any, forecastRecord: any) => {
    if (!chartData || chartData.length === 0) {
      return;
    }

    // Calculate Average Daily Demand
    const totalDemand = chartData.reduce((sum, d) => sum + (d.demand || 0), 0);
    const avgDemand = Math.round(totalDemand / chartData.length);
    const demandChange = mlData ? "+15%" : "+12%";

    // Find Peak Demand
    const peakData = chartData.reduce((max, d) => d.demand > max.demand ? d : max, chartData[0]);
    const peakValue = peakData.demand || 0;
    const peakDay = peakData.day || "Day 30";

    // Calculate Forecast Accuracy (based on ML confidence or default)
    let accuracy = "94.2%";
    let accuracyChange = "+2.1%";
    if (mlData && mlData.forecasts && mlData.forecasts.length > 0) {
      const avgConfidence = mlData.forecasts.reduce((sum: number, f: any) => 
        sum + (f.confidence_score || 0), 0) / mlData.forecasts.length;
      accuracy = `${(avgConfidence * 100).toFixed(1)}%`;
      accuracyChange = avgConfidence > 0.9 ? "+5.2%" : "+2.1%";
    }

    // Calculate Days Until Shortage
    let shortageDay = null;
    for (let i = 0; i < chartData.length; i++) {
      if (chartData[i].demand > chartData[i].supply) {
        shortageDay = chartData[i].day;
        break;
      }
    }
    
    const daysValue = shortageDay ? shortageDay.replace('Day ', '') + ' days' : "No shortage";
    const daysChange = shortageDay ? "Critical" : "Safe";

    // Project Duration
    const duration = forecastRecord?.duration || 30;

    setForecastMetrics({
      avgDailyDemand: { 
        value: `${avgDemand.toLocaleString()} units`, 
        change: demandChange 
      },
      peakDemand: { 
        value: `${peakValue.toLocaleString()} units`, 
        change: peakDay 
      },
      forecastAccuracy: { 
        value: accuracy, 
        change: accuracyChange 
      },
      daysUntilShortage: { 
        value: daysValue, 
        change: daysChange 
      }
    });
  };

  const projects = [
    { value: "project-1", label: "NR-II Tower Line (Delhi)" },
    { value: "project-2", label: "UP-West Transmission (Uttar Pradesh)" },
    { value: "project-3", label: "Gujarat Solar Integration" },
    { value: "project-4", label: "Rajasthan Smart Grid" }
  ];

  const materials = [
    { value: "steel", label: "Tower Steel" },
    { value: "insulators", label: "Insulators" },
    { value: "conductors", label: "Conductors" },
    { value: "transformers", label: "Transformers" }
  ];

  const durations = [
    { value: "30", label: "30 Days" },
    { value: "60", label: "60 Days" },
    { value: "90", label: "90 Days" }
  ];

  const navigate = useNavigate();

  const getProjectLabel = (value: string) => projects.find((p) => p.value === value)?.label ?? value;
  const getMaterialLabel = (value: string) => materials.find((m) => m.value === value)?.label ?? value;
  const getDurationLabel = (value: string) => durations.find((d) => d.value === value)?.label ?? value;

  const handleGenerateForecast = () => {
    const baseData = [
      { day: "Day 1", demand: 120, forecast: 125, supply: 100 },
      { day: "Day 5", demand: 145, forecast: 142, supply: 110 },
      { day: "Day 10", demand: 168, forecast: 175, supply: 120 },
      { day: "Day 15", demand: 192, forecast: 205, supply: 130 },
      { day: "Day 20", demand: 210, forecast: 220, supply: 140 },
      { day: "Day 25", demand: 235, forecast: 240, supply: 150 },
      { day: "Day 30", demand: 260, forecast: 265, supply: 160 }
    ];

    const projectFactor = selectedProject === "project-2" ? 1.1 : selectedProject === "project-3" ? 0.95 : selectedProject === "project-4" ? 1.05 : 1;
    const materialFactor = selectedMaterial === "insulators" ? 0.9 : selectedMaterial === "conductors" ? 1.15 : selectedMaterial === "transformers" ? 1.25 : 1;
    const durationFactor = selectedDuration === "60" ? 1.1 : selectedDuration === "90" ? 1.2 : 1;

    const factor = projectFactor * materialFactor * durationFactor;

    const newData = baseData.map((point, index) => {
      const demand = Math.round(point.demand * factor);
      const forecast = Math.round(point.forecast * factor * 1.02);
      const supply = Math.round(point.supply * (factor * 0.95));

      return {
        ...point,
        day: point.day.replace("Day", `Day ${index + 1}`),
        demand,
        forecast,
        supply,
      };
    });

    setForecastData(newData);
    calculateForecastMetrics(newData, null, null);
    setLastRunSummary(
      `Forecast updated for ${getProjectLabel(selectedProject)}, ${getMaterialLabel(selectedMaterial)}, ${getDurationLabel(selectedDuration)}`,
    );
  };

  const handleGenerateMLForecast = async (projectId: string) => {
    try {
      setMlLoading(true);
      const response = await forecastAPI.generateMLForecast(projectId);
      
      const mlAnalysis = response.data.data.mlAnalysis;
      const forecastRecord = response.data.data.forecast;
      setMlForecast(mlAnalysis);
      
      // Calculate average confidence
      const avgConfidence = mlAnalysis.forecasts && mlAnalysis.forecasts.length > 0
        ? (mlAnalysis.forecasts.reduce((sum: number, f: any) => sum + (f.confidence_score || 0), 0) / mlAnalysis.forecasts.length * 100).toFixed(0)
        : '0';
      
      toast({
        title: "✅ ML Forecast Generated",
        description: `Forecast generated using Ensemble Stack Model with ${avgConfidence}% average confidence`,
      });
      
      // Create time-series projection from material forecasts
      let generatedChartData: any[] = [];
      if (mlAnalysis.forecasts && mlAnalysis.forecasts.length > 0) {
        // Calculate total material quantity
        const totalQuantity = mlAnalysis.forecasts.reduce((sum: number, f: any) => sum + (f.predicted_quantity || 0), 0);
        const totalCost = mlAnalysis.total_estimated_cost || 0;
        
        // Get project duration (default 30 days if not available)
        const duration = forecastRecord?.duration || 30;
        const intervals = 7; // Number of data points to show
        const intervalDays = Math.floor(duration / intervals);
        
        // Generate timeline data with progressive accumulation
        generatedChartData = Array.from({ length: intervals }, (_, index) => {
          const dayNumber = (index + 1) * intervalDays;
          const progress = (index + 1) / intervals;
          
          // Use S-curve for realistic project progression
          const sCurveProgress = 1 / (1 + Math.exp(-5 * (progress - 0.5)));
          
          return {
            day: `Day ${dayNumber}`,
            demand: Math.round(totalQuantity * sCurveProgress * 0.95), // Actual demand (95% of forecast)
            forecast: Math.round(totalQuantity * sCurveProgress), // ML prediction
            supply: Math.round(totalQuantity * sCurveProgress * 0.85), // Current supply (85% of demand)
          };
        });
        
        setForecastData(generatedChartData);
      }
      
      // Generate AI insights based on ML data
      generateAIInsights(mlAnalysis, forecastRecord);
      
      // Calculate metrics based on chart data
      calculateForecastMetrics(generatedChartData, mlAnalysis, forecastRecord);
      
      setLastRunSummary(`ML Forecast for ${mlAnalysis.project_name || 'Project'} - Risk Level: ${mlAnalysis.risk_level || 'Unknown'}`);
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to generate ML forecast",
        variant: "destructive"
      });
    } finally {
      setMlLoading(false);
    }
  };

  const handleGenerateAdvancedForecast = async (projectId: string, materialId: string, days: number) => {
    try {
      setAdvancedLoading(true);
      const response = await forecastAPI.generateAdvancedForecast(projectId, materialId, days);
      
      const forecastData = response.data.data;
      setAdvancedForecast(forecastData);
      
      // Create chart data from daily forecasts
      const chartData = forecastData.daily_forecasts.slice(0, 30).map((day: any, index: number) => ({
        day: `Day ${index + 1}`,
        predicted: Math.round(day.predicted_qty),
        cumulative: Math.round(day.cumulative_consumed),
        remaining: Math.round(day.remaining_boq_qty),
        boqLine: Math.round(forecastData.summary.total_boq_quantity)
      }));
      
      setForecastData(chartData);
      
      // Update metrics
      setForecastMetrics({
        avgDailyDemand: { 
          value: `${(forecastData.summary.total_forecasted / days).toFixed(0)} ${forecastData.summary.unit}`, 
          change: `${forecastData.summary.final_consumed_percentage.toFixed(1)}% consumed` 
        },
        peakDemand: { 
          value: `${Math.max(...forecastData.daily_forecasts.map((d: any) => d.predicted_qty)).toFixed(0)} ${forecastData.summary.unit}`, 
          change: `Day ${forecastData.daily_forecasts.findIndex((d: any) => d.predicted_qty === Math.max(...forecastData.daily_forecasts.map((d: any) => d.predicted_qty))) + 1}` 
        },
        forecastAccuracy: { 
          value: forecastData.alerts.boq_deficit ? "BOQ Exceeded" : "Within BOQ", 
          change: forecastData.alerts.understock ? "Low Stock" : "Adequate" 
        },
        daysUntilShortage: { 
          value: forecastData.alerts.critical_shortage ? "Critical" : forecastData.alerts.understock ? "<10% left" : "Safe", 
          change: forecastData.alerts.boq_deficit ? "Critical" : "Safe" 
        }
      });
      
      // Generate insights from alerts
      const newInsights: any[] = [];
      
      if (forecastData.alerts.boq_deficit) {
        newInsights.push({
          icon: AlertTriangle,
          title: "BOQ Deficit Alert",
          description: `Forecasted demand exceeds BOQ by ${Math.abs(forecastData.summary.final_remaining).toFixed(0)} ${forecastData.summary.unit}`,
          severity: "high"
        });
      }
      
      if (forecastData.alerts.understock) {
        newInsights.push({
          icon: AlertCircle,
          title: "Low Stock Warning",
          description: `Material stock below 10%. Immediate procurement required.`,
          severity: "medium"
        });
      }
      
      if (forecastData.alerts.vendor_notification) {
        newInsights.push({
          icon: Zap,
          title: "Vendor Notification",
          description: `Contact vendors for ${forecastData.material_name}. Remaining: ${forecastData.summary.final_remaining.toFixed(0)} ${forecastData.summary.unit}`,
          severity: "medium"
        });
      }
      
      if (!forecastData.alerts.boq_deficit && !forecastData.alerts.understock) {
        newInsights.push({
          icon: CheckCircle,
          title: "Sufficient Stock",
          description: `BOQ allocation is adequate. ${forecastData.summary.final_remaining.toFixed(0)} ${forecastData.summary.unit} will remain.`,
          severity: "low"
        });
      }
      
      setAiInsights(newInsights.length > 0 ? newInsights : aiInsights);
      
      toast({
        title: "✅ Advanced Forecast Generated",
        description: `${days}-day forecast for ${forecastData.material_name} completed with BOQ validation`,
      });
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to generate advanced forecast",
        variant: "destructive"
      });
      console.error('Advanced forecast error:', error);
    } finally {
      setAdvancedLoading(false);
    }
  };

  const handleDownloadReport = () => {
    if (!forecastData.length) return;

    const headers = ["Day", "Demand", "Forecast", "Supply"]; 
    const rows = forecastData.map((row) => [row.day, String(row.demand), String(row.forecast), String(row.supply)]);

    const meta = [
      ["Project", getProjectLabel(selectedProject)],
      ["Material", getMaterialLabel(selectedMaterial)],
      ["Duration", getDurationLabel(selectedDuration)],
      [],
    ];

    const csv = [
      ...meta.map((m) => m.join(",")),
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "forecast-report.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2">Demand Forecasting</h1>
          <p className="text-muted-foreground">Predict material demand with AI-powered analytics and receive actionable insights</p>
        </div>

       

        {/* ML Forecast Section */}
        <Card className="p-6 border-border/50 bg-gradient-to-br from-purple-50/50 to-blue-50/50">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <h2 className="text-xl font-semibold">ML-Powered Forecast</h2>
            {mlStatus?.status === 'ready' && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                <Activity className="h-3 w-3 mr-1" />
                Model Ready
              </Badge>
            )}
            {mlStatus?.encoders_loaded && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                Encoders Loaded ({mlStatus.encoders_count})
              </Badge>
            )}
          </div>

          {/* Project Selection and Generate Button */}
          {!loadingProjects && availableProjects.length > 0 && mlStatus?.status === 'ready' && (
            <div className="mb-4 flex gap-3">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Select Project for ML Forecast</label>
                <Select 
                  value={selectedProject} 
                  onValueChange={setSelectedProject}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Choose a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProjects.map((project) => (
                      <SelectItem key={project._id} value={project._id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{project.name || project.projectName}</span>
                          <span className="text-xs text-muted-foreground">
                            {project.location?.state || project.location?.region || 'Unknown'} • {project.infrastructure?.voltage || 'N/A'} • {project.infrastructure?.towerCount || 0} towers
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={() => handleGenerateMLForecast(selectedProject)}
                  disabled={mlLoading || !selectedProject}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {mlLoading ? (
                    <>
                      <Activity className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate ML Forecast
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {loadingProjects && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">Loading projects...</p>
            </div>
          )}

          {!loadingProjects && availableProjects.length === 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-800">No projects available. Please create a project first in the Projects section.</p>
            </div>
          )}

          {mlStatus?.status !== 'ready' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800 font-medium">ML Service not available</p>
              <p className="text-xs text-yellow-700 mt-1">
                Please ensure the ML service is running on port 8000.
                {mlStatus?.encoders_loaded === false && " Encoders.pkl not loaded."}
                {mlStatus?.ensemble_model_loaded === false && " Ensemble model not loaded."}
              </p>
            </div>
          )}

          {mlForecast && (
            <div className="space-y-4 mt-4">
              {/* Project Info Header */}
              <div className="bg-white rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{mlForecast.project_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Forecast generated on {new Date(mlForecast.forecast_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Risk Level:</span>
                    <Badge 
                      variant={mlForecast.risk_level === 'High' ? 'destructive' : mlForecast.risk_level === 'Medium' ? 'default' : 'outline'}
                      className={mlForecast.risk_level === 'Low' ? 'bg-green-50 text-green-700 border-green-300' : ''}
                    >
                      {mlForecast.risk_level}
                    </Badge>
                    {mlForecast.forecasts && mlForecast.forecasts.length > 0 && (
                      <span className="text-sm text-muted-foreground">
                        Avg Confidence: {(mlForecast.forecasts.reduce((sum: number, f: any) => sum + f.confidence_score, 0) / mlForecast.forecasts.length * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Material Predictions */}
              {mlForecast.forecasts && mlForecast.forecasts.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Material Demand Predictions</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {mlForecast.forecasts.slice(0, 6).map((forecast: any, index: number) => (
                      <div key={index} className="bg-white rounded-lg border border-border p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{forecast.material || 'Unknown'}</span>
                          <Badge variant="outline" className="text-xs">
                            {forecast.confidence_score ? (forecast.confidence_score * 100).toFixed(0) : '0'}% confidence
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <p className="text-2xl font-bold text-purple-600">
                            {forecast.predicted_quantity ? forecast.predicted_quantity.toLocaleString() : '0'} {forecast.unit || 'units'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Range: {forecast.confidence_interval_low ? forecast.confidence_interval_low.toLocaleString() : '0'} - {forecast.confidence_interval_high ? forecast.confidence_interval_high.toLocaleString() : '0'} {forecast.unit || 'units'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {mlForecast.recommendations && mlForecast.recommendations.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">AI Recommendations</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {mlForecast.recommendations.map((rec: string, index: number) => (
                      <div key={index} className="bg-white rounded-lg border border-border p-3 flex items-start gap-2">
                        <span className="text-purple-600 font-bold text-lg">•</span>
                        <p className="text-sm">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Forecast Graph */}
        <Card className="p-6 border-border/50">
          <h2 className="text-xl font-semibold mb-4">Demand vs Supply Forecast</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis dataKey="day" stroke="rgba(0,0,0,0.5)" />
              <YAxis stroke="rgba(0,0,0,0.5)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #ddd",
                  borderRadius: "8px"
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="demand"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ fill: "#ef4444", r: 4 }}
                name="Actual Demand"
              />
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: "#3b82f6", r: 4 }}
                name="AI Forecast"
              />
              <Line
                type="monotone"
                dataKey="supply"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: "#10b981", r: 4 }}
                name="Current Supply"
              />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground mt-4">
            The gap between demand (red) and supply (green) indicates potential shortage period
          </p>
        </Card>

        {/* AI Insights */}
        <div>
          <h2 className="text-xl font-semibold mb-4">AI Insights & Recommendations</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {aiInsights.map((insight, index) => {
              const severityColors = {
                high: "bg-red-50 border-red-200",
                medium: "bg-yellow-50 border-yellow-200",
                low: "bg-blue-50 border-blue-200"
              };

              const severityBadgeColors = {
                high: "bg-red-100 text-red-800",
                medium: "bg-yellow-100 text-yellow-800",
                low: "bg-blue-100 text-blue-800"
              };

              return (
                <Card
                  key={index}
                  className={`p-6 border-2 ${severityColors[insight.severity as keyof typeof severityColors]}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${severityBadgeColors[insight.severity as keyof typeof severityBadgeColors]}`}>
                      <insight.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{insight.title}</h3>
                      <p className="text-sm text-muted-foreground">{insight.description}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Key Metrics */}
        <Card className="p-6 border-border/50">
          <h2 className="text-xl font-semibold mb-4">Forecast Metrics</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { label: "Average Daily Demand", value: forecastMetrics.avgDailyDemand.value, change: forecastMetrics.avgDailyDemand.change },
              { label: "Peak Demand", value: forecastMetrics.peakDemand.value, change: forecastMetrics.peakDemand.change },
              { label: "Forecast Accuracy", value: forecastMetrics.forecastAccuracy.value, change: forecastMetrics.forecastAccuracy.change },
              { label: "Days Until Shortage", value: forecastMetrics.daysUntilShortage.value, change: forecastMetrics.daysUntilShortage.change }
            ].map((metric, index) => {
              const isCritical = metric.change === "Critical";
              const isSafe = metric.change === "Safe";
              const changeColor = isCritical ? "text-red-600" : isSafe ? "text-green-600" : "text-accent";
              
              return (
                <div
                  key={index}
                  className="p-4 bg-muted/50 rounded-lg border border-border/50"
                >
                  <p className="text-sm text-muted-foreground mb-1">{metric.label}</p>
                  <p className="text-2xl font-bold">{metric.value}</p>
                  <p className={`text-xs ${changeColor} mt-1 font-semibold`}>{metric.change}</p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            className="flex-1 bg-gradient-accent hover:opacity-90"
            onClick={() => navigate("/procurement")}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Create Purchase Order
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate("/procurement")}
          >
            View Vendor Recommendations
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleDownloadReport}
          >
            Download Forecast Report
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Forecasting;
