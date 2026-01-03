import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { 
  FlaskConical,
  Play,
  RotateCcw,
  Save,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Lightbulb
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Legend
} from "recharts";
import { Slider } from "@/components/ui/slider";

const Scenarios = () => {
  const [budgetMultiplier, setBudgetMultiplier] = useState([100]);
  const [demandMultiplier, setDemandMultiplier] = useState([100]);
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [projectType, setProjectType] = useState("transmission");
  const [timeline, setTimeline] = useState("6months");
  const [costVariance, setCostVariance] = useState("5");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResults, setSimulationResults] = useState<any>(null);
  const { toast } = useToast();

  const [baselineData, setBaselineData] = useState([
    { month: 'Month 1', demand: 450, supply: 430, cost: 2200 },
    { month: 'Month 2', demand: 520, supply: 510, cost: 2400 },
    { month: 'Month 3', demand: 480, supply: 475, cost: 2300 },
    { month: 'Month 4', demand: 610, supply: 590, cost: 2800 },
    { month: 'Month 5', demand: 590, supply: 585, cost: 2700 },
    { month: 'Month 6', demand: 670, supply: 650, cost: 3100 }
  ]);

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    
    // Add jitter for varying results
    const jitter = 0.95 + Math.random() * 0.1;
    const demandFactor = demandMultiplier[0] / 100;
    const budgetFactor = budgetMultiplier[0] / 100;
    const costFactor = 1 + parseFloat(costVariance || '0') / 100;
    
    try {
      const timelineMonths = timeline === "3months" ? 3 : timeline === "6months" ? 6 : timeline === "12months" ? 12 : 24;
      
      const response = await axios.post('http://localhost:8000/api/scenario/run', {
        project_region: selectedRegion === "all" ? "North" : selectedRegion,
        project_type: projectType,
        timeline_months: timelineMonths,
        budget_adjustment: budgetMultiplier[0],
        demand_projection: demandMultiplier[0],
        material_cost_variance: parseFloat(costVariance)
      }, { timeout: 3000 });

      const data = response.data;
      setSimulationResults(data);

      // Update baseline data with simulation results
      const newData = data.demand.map((demand: number, index: number) => ({
        month: `Month ${index + 1}`,
        demand: Math.round(demand),
        supply: Math.round(data.supply[index]),
        cost: Math.round(data.cost_projection[index])
      }));
      setBaselineData(newData);

      // Update comparison data with simulation results
      const newComparison = [
        { scenario: 'Current', fulfillment: data.comparison_matrix.Current.fulfillment, cost: Math.round(data.comparison_matrix.Current.cost), efficiency: data.comparison_matrix.Current.eff },
        { scenario: 'Optimistic', fulfillment: data.comparison_matrix.Optimistic.fulfillment, cost: Math.round(data.comparison_matrix.Optimistic.cost), efficiency: data.comparison_matrix.Optimistic.eff },
        { scenario: 'Pessimistic', fulfillment: data.comparison_matrix.Pessimistic.fulfillment, cost: Math.round(data.comparison_matrix.Pessimistic.cost), efficiency: data.comparison_matrix.Pessimistic.eff },
        { scenario: 'Realistic', fulfillment: data.comparison_matrix.Realistic.fulfillment, cost: Math.round(data.comparison_matrix.Realistic.cost), efficiency: data.comparison_matrix.Realistic.eff }
      ];
      setComparisonData(newComparison);

      toast({
        title: "✅ Simulation Complete",
        description: `Additional cost: ₹${data.summary?.additional_cost?.toFixed(0) || 0} | Demand factor: ${((data.summary?.demand_change_factor || 1) * 100).toFixed(0)}%`,
      });
    } catch (error: any) {
      // Fallback to offline simulation with varying data
      const baselineFulfillment = 87;
      const scenarioFulfillment = Math.min(100, Math.max(60, 
        Math.round(baselineFulfillment * (budgetFactor / demandFactor) * jitter)
      ));
      
      const baselineCost = 2450;
      const scenarioCost = Math.round(baselineCost * budgetFactor * costFactor * jitter);
      
      const efficiencyScore = Math.min(100, Math.max(60,
        Math.round(85 + (budgetMultiplier[0] - demandMultiplier[0]) / 4 + (Math.random() * 10 - 5))
      ));
      
      const materialsAtRisk = Math.max(0, Math.round(8 - (budgetFactor - 1) * 20 + (demandFactor - 1) * 15 + Math.random() * 3));
      const baselineRisk = 7;
      
      const offlineResults = {
        summary: {
          fulfillment_baseline: baselineFulfillment,
          fulfillment_scenario: scenarioFulfillment,
          baseline_total_cost_crore: baselineCost / 100,
          scenario_total_cost_crore: scenarioCost / 100,
          total_extra_cost_crore: Math.abs(scenarioCost - baselineCost) / 100,
          efficiency_score: efficiencyScore,
          materials_at_risk_baseline: baselineRisk,
          materials_at_risk_scenario: materialsAtRisk,
          risk_label: materialsAtRisk > 9 ? 'HIGH RISK' : materialsAtRisk > 5 ? 'MEDIUM RISK' : 'LOW RISK',
          additional_cost: Math.abs(scenarioCost - baselineCost),
          demand_change_factor: demandFactor
        }
      };
      
      setSimulationResults(offlineResults);
      
      // Update comparison data
      const newComparison = [
        { scenario: 'Baseline', fulfillment: baselineFulfillment, cost: baselineCost, efficiency: 82 },
        { scenario: 'Optimistic', fulfillment: Math.min(100, baselineFulfillment + 8), cost: Math.round(baselineCost * 0.92), efficiency: 91 },
        { scenario: 'Pessimistic', fulfillment: Math.max(60, baselineFulfillment - 12), cost: Math.round(baselineCost * 1.16), efficiency: 70 },
        { scenario: 'Simulated', fulfillment: scenarioFulfillment, cost: scenarioCost, efficiency: efficiencyScore }
      ];
      setComparisonData(newComparison);
      
      // Update baseline data with varying monthly values
      const months = timeline === '3months' ? 3 : timeline === '6months' ? 6 : timeline === '12months' ? 12 : 24;
      const newBaselineData = [];
      for (let i = 0; i < Math.min(months, 6); i++) {
        const monthlyVariance = 0.9 + Math.random() * 0.2;
        const baseDemand = Math.round((450 + i * 30) * demandFactor * monthlyVariance);
        newBaselineData.push({
          month: `Month ${i + 1}`,
          demand: baseDemand,
          supply: Math.round(baseDemand * 0.95),
          cost: Math.round(2200 + i * 150 + Math.random() * 200)
        });
      }
      setBaselineData(newBaselineData);
      
      toast({
        title: "✅ Offline Simulation",
        description: `ML service unavailable - showing simulated outcomes with varying data`,
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const handleReset = () => {
    setBudgetMultiplier([100]);
    setDemandMultiplier([100]);
    setSelectedRegion("all");
    setProjectType("transmission");
    setTimeline("6months");
    setCostVariance("5");
    setBaselineData([
      { month: 'Month 1', demand: 450, supply: 430, cost: 2200 },
      { month: 'Month 2', demand: 520, supply: 510, cost: 2400 },
      { month: 'Month 3', demand: 480, supply: 475, cost: 2300 },
      { month: 'Month 4', demand: 610, supply: 590, cost: 2800 },
      { month: 'Month 5', demand: 590, supply: 585, cost: 2700 },
      { month: 'Month 6', demand: 670, supply: 650, cost: 3100 }
    ]);
    setSimulationResults(null);
    toast({
      title: "Reset Complete",
      description: "All parameters restored to defaults"
    });
  };

  const scenarioResults = [
    {
      id: 1,
      name: 'Budget Increase Scenario',
      description: 'Increase budget by 20% across all categories',
      impact: {
        fulfillmentRate: '+12.5%',
        costPerUnit: '-8.3%',
        efficiency: '+15.2%',
        risk: 'low'
      },
      status: 'simulated'
    },
    {
      id: 2,
      name: 'High Demand Scenario',
      description: 'Material demand increases by 30% due to new projects',
      impact: {
        fulfillmentRate: '-18.7%',
        costPerUnit: '+22.4%',
        efficiency: '-25.8%',
        risk: 'high'
      },
      status: 'simulated'
    },
    {
      id: 3,
      name: 'Vendor Optimization',
      description: 'Switch to alternative vendors for 40% of materials',
      impact: {
        fulfillmentRate: '+5.2%',
        costPerUnit: '-12.1%',
        efficiency: '+8.5%',
        risk: 'medium'
      },
      status: 'saved'
    }
  ];

  const [comparisonData, setComparisonData] = useState([
    { scenario: 'Current', fulfillment: 87, cost: 2450, efficiency: 82 },
    { scenario: 'Optimistic', fulfillment: 95, cost: 2200, efficiency: 91 },
    { scenario: 'Pessimistic', fulfillment: 75, cost: 2850, efficiency: 70 },
    { scenario: 'Realistic', fulfillment: 89, cost: 2380, efficiency: 85 }
  ]);

  const savedScenarios = [
    { id: 1, name: 'Q3 Expansion Plan', date: '2024-05-15', status: 'approved' },
    { id: 2, name: 'Budget Cut Analysis', date: '2024-05-10', status: 'pending' },
    { id: 3, name: 'New Region Entry', date: '2024-05-08', status: 'draft' }
  ];

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-success/10 text-success border-success/20';
      case 'medium':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'high':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-success/10 text-success';
      case 'pending':
        return 'bg-warning/10 text-warning';
      case 'draft':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted';
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Scenario Simulation</h1>
            <p className="text-muted-foreground">Test different project scenarios and forecast outcomes</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Save className="h-4 w-4" />
              Save Scenario
            </Button>
          </div>
        </div>

        {/* Scenario Builder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-accent" />
              Build New Scenario
            </CardTitle>
            <CardDescription>Adjust parameters to simulate different project outcomes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Input Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Project Region</Label>
                  <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Regions</SelectItem>
                      <SelectItem value="north">North India</SelectItem>
                      <SelectItem value="south">South India</SelectItem>
                      <SelectItem value="west">West India</SelectItem>
                      <SelectItem value="east">East India</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Project Type</Label>
                  <Select value={projectType} onValueChange={setProjectType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transmission">Transmission Line</SelectItem>
                      <SelectItem value="substation">Substation</SelectItem>
                      <SelectItem value="hybrid">Hybrid Project</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Timeline</Label>
                  <Select value={timeline} onValueChange={setTimeline}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3months">3 Months</SelectItem>
                      <SelectItem value="6months">6 Months</SelectItem>
                      <SelectItem value="12months">12 Months</SelectItem>
                      <SelectItem value="24months">24 Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Budget Adjustment</Label>
                    <span className="text-sm font-medium">{budgetMultiplier[0]}%</span>
                  </div>
                  <Slider 
                    value={budgetMultiplier} 
                    onValueChange={setBudgetMultiplier}
                    min={50}
                    max={150}
                    step={5}
                    className="py-4"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>-50%</span>
                    <span>Baseline</span>
                    <span>+50%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Demand Projection</Label>
                    <span className="text-sm font-medium">{demandMultiplier[0]}%</span>
                  </div>
                  <Slider 
                    value={demandMultiplier} 
                    onValueChange={setDemandMultiplier}
                    min={50}
                    max={150}
                    step={5}
                    className="py-4"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>-50%</span>
                    <span>Baseline</span>
                    <span>+50%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Material Cost Variance (%)</Label>
                  <Input 
                    type="number" 
                    placeholder="±5" 
                    value={costVariance}
                    onChange={(e) => setCostVariance(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                className="gap-2 flex-1" 
                onClick={handleRunSimulation}
                disabled={isSimulating}
              >
                <Play className={`h-4 w-4 ${isSimulating ? 'animate-spin' : ''}`} />
                {isSimulating ? 'Running Simulation...' : 'Run Simulation'}
              </Button>
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={handleReset}
                disabled={isSimulating}
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>

            {/* Outcome Highlights */}
            {simulationResults && simulationResults.summary && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className={`border rounded-lg p-4 ${
                  simulationResults.summary.risk_label.includes('HIGH') ? 'bg-destructive/10 text-destructive border-destructive/30' :
                  simulationResults.summary.risk_label.includes('MEDIUM') ? 'bg-warning/10 text-warning border-warning/30' :
                  'bg-success/10 text-success border-success/30'
                }`}>
                  <div className="text-xs uppercase tracking-wide opacity-80">Risk Posture</div>
                  <div className="text-xl font-bold mt-1">{simulationResults.summary.risk_label}</div>
                  <div className="text-sm opacity-80 mt-1">{simulationResults.summary.materials_at_risk_scenario} at risk vs {simulationResults.summary.materials_at_risk_baseline} baseline</div>
                </div>
                <div className="border rounded-lg p-4 bg-accent/10 text-accent border-accent/30">
                  <div className="text-xs uppercase tracking-wide opacity-80">Cost Impact</div>
                  <div className="text-xl font-bold mt-1">₹{simulationResults.summary.total_extra_cost_crore.toFixed(2)} Cr</div>
                  <div className="text-sm opacity-80 mt-1">Baseline ₹{simulationResults.summary.baseline_total_cost_crore.toFixed(2)} Cr</div>
                </div>
                <div className="border rounded-lg p-4 bg-success/10 text-success border-success/30">
                  <div className="text-xs uppercase tracking-wide opacity-80">Fulfillment</div>
                  <div className="text-xl font-bold mt-1">{Math.round(simulationResults.summary.fulfillment_scenario)}%</div>
                  <div className="text-sm opacity-80 mt-1">Baseline {Math.round(simulationResults.summary.fulfillment_baseline)}%</div>
                </div>
              </div>
            )}

            {/* Simulation Summary */}
            {simulationResults && (
              <div className="mt-6 p-4 bg-accent/10 border border-accent/20 rounded-lg">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  Simulation Summary
                </h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Additional Cost</div>
                    <div className="text-lg font-bold">₹{simulationResults.summary.additional_cost.toFixed(0)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Demand Factor</div>
                    <div className="text-lg font-bold">{(simulationResults.summary.demand_change_factor * 100).toFixed(0)}%</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Cost Variance</div>
                    <div className="text-lg font-bold">{(simulationResults.summary.cost_variance_factor * 100 - 100).toFixed(1)}%</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Simulation Results */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Projected Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Projected Demand & Supply</CardTitle>
              <CardDescription>6-month forecast with current parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={baselineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="demand" stroke="hsl(221, 83%, 35%)" strokeWidth={2} name="Demand" />
                  <Line type="monotone" dataKey="supply" stroke="hsl(142, 76%, 36%)" strokeWidth={2} name="Supply" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Cost Projection */}
          <Card>
            <CardHeader>
              <CardTitle>Cost Projection</CardTitle>
              <CardDescription>Monthly cost estimates (₹ Crores)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={baselineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="cost" fill="hsl(199, 89%, 48%)" name="Projected Cost" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Scenario Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Scenario Comparison Matrix</CardTitle>
            <CardDescription>Compare key metrics across different scenarios</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="scenario" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="fulfillment" fill="hsl(142, 76%, 36%)" name="Fulfillment %" />
                <Bar dataKey="cost" fill="hsl(221, 83%, 35%)" name="Cost (₹Cr)" />
                <Bar dataKey="efficiency" fill="hsl(199, 89%, 48%)" name="Efficiency %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Simulated Scenarios */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Simulation Results</CardTitle>
            <CardDescription>AI-generated insights from scenario testing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scenarioResults.map((scenario) => (
                <div 
                  key={scenario.id}
                  className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold flex items-center gap-2">
                        {scenario.name}
                        {scenario.status === 'saved' && (
                          <Badge variant="outline" className="gap-1">
                            <Save className="h-3 w-3" />
                            Saved
                          </Badge>
                        )}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">{scenario.description}</p>
                    </div>
                    <Badge className={getRiskColor(scenario.impact.risk)}>
                      {scenario.impact.risk.toUpperCase()} RISK
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Fulfillment Rate</div>
                      <div className={`text-lg font-bold flex items-center gap-1 ${
                        scenario.impact.fulfillmentRate.startsWith('+') ? 'text-success' : 'text-destructive'
                      }`}>
                        {scenario.impact.fulfillmentRate.startsWith('+') ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        {scenario.impact.fulfillmentRate}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Cost Per Unit</div>
                      <div className={`text-lg font-bold flex items-center gap-1 ${
                        scenario.impact.costPerUnit.startsWith('-') ? 'text-success' : 'text-destructive'
                      }`}>
                        {scenario.impact.costPerUnit.startsWith('-') ? (
                          <TrendingDown className="h-4 w-4" />
                        ) : (
                          <TrendingUp className="h-4 w-4" />
                        )}
                        {scenario.impact.costPerUnit}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Efficiency</div>
                      <div className={`text-lg font-bold flex items-center gap-1 ${
                        scenario.impact.efficiency.startsWith('+') ? 'text-success' : 'text-destructive'
                      }`}>
                        {scenario.impact.efficiency.startsWith('+') ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        {scenario.impact.efficiency}
                      </div>
                    </div>

                    <div className="flex items-end">
                      <Button size="sm" variant="outline" className="w-full">
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Saved Scenarios */}
        <Card>
          <CardHeader>
            <CardTitle>Saved Scenarios</CardTitle>
            <CardDescription>Previously saved scenario configurations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {savedScenarios.map((scenario) => (
                <div 
                  key={scenario.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FlaskConical className="h-5 w-5 text-accent" />
                    <div>
                      <div className="font-medium">{scenario.name}</div>
                      <div className="text-sm text-muted-foreground">{scenario.date}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(scenario.status)}>
                      {scenario.status === 'approved' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {scenario.status === 'pending' && <AlertTriangle className="h-3 w-3 mr-1" />}
                      {scenario.status.toUpperCase()}
                    </Badge>
                    <Button size="sm" variant="ghost">Load</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card className="border-accent/20 bg-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-accent" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                <p className="text-sm">Based on historical data, increasing budget by 15-20% yields optimal ROI for transmission projects</p>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                <p className="text-sm">Demand projections suggest a 25% increase in Q4 - consider advanced procurement</p>
              </div>
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
                <p className="text-sm">Current vendor mix shows vulnerability to supply chain disruptions - diversification recommended</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Scenarios;
