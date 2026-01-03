import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  Zap,
  AlertCircle,
  CheckCircle2,
  Calculator,
  Target,
  Package,
  Users,
  Download,
  Play,
  RefreshCw,
} from 'lucide-react';
import { optimizationAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface Material {
  category: string;
  quantity: number;
}

interface Allocation {
  vendor_id: string;
  vendor_name: string;
  company_name: string;
  location: string;
  material_category: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  reliability_score: number;
  lead_time_days: number;
  rating: number;
}

interface OptimizationResult {
  success: boolean;
  status: string;
  allocations: Allocation[];
  summary: {
    total_cost: number;
    budget: number;
    budget_used_percent: number;
    remaining_budget: number;
    total_vendors_used: number;
    naive_cost: number;
    savings: number;
    savings_percent: number;
    avg_reliability: number;
    max_lead_time: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const VendorOptimization: React.FC = () => {
  const { toast } = useToast();
  
  // Form state
  const [materials, setMaterials] = useState<Material[]>([
    { category: 'Towers', quantity: 50 },
    { category: 'Conductors', quantity: 5000 },
  ]);
  const [budget, setBudget] = useState<number>(5000000);
  const [maxLeadTime, setMaxLeadTime] = useState<number>(20);
  
  // Results state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);
  
  // Simulation state
  const [simulationResults, setSimulationResults] = useState<any>(null);
  const [simulationLoading, setSimulationLoading] = useState(false);

  const materialCategories = [
    'Towers', 'Conductors', 'Insulators', 'Transformers', 
    'Cables', 'Earthing', 'Hardware', 'Switchgear', 'Others'
  ];

  const addMaterial = () => {
    setMaterials([...materials, { category: 'Towers', quantity: 0 }]);
  };

  const removeMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };

  const updateMaterial = (index: number, field: 'category' | 'quantity', value: string | number) => {
    const updated = [...materials];
    updated[index] = { ...updated[index], [field]: value };
    setMaterials(updated);
  };

  const handleOptimize = async () => {
    if (materials.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one material',
        variant: 'destructive',
      });
      return;
    }

    if (budget <= 0) {
      toast({
        title: 'Error',
        description: 'Budget must be greater than 0',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await optimizationAPI.optimize({
        materials,
        budget,
        max_lead_time: maxLeadTime,
      });
      
      setResult(response.data);
      
      if (response.data.success) {
        toast({
          title: 'Optimization Complete!',
          description: `Found optimal allocation with ${response.data.summary.total_vendors_used} vendors. Savings: ₹${response.data.summary.savings.toLocaleString()}`,
        });
      } else {
        toast({
          title: 'Optimization Failed',
          description: response.data.message || 'No optimal solution found',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Optimization failed',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSimulate = async () => {
    setSimulationLoading(true);
    try {
      const budgetScenarios = [
        budget * 0.7,
        budget * 0.85,
        budget,
        budget * 1.15,
        budget * 1.3,
      ];
      
      const response = await optimizationAPI.simulate({
        materials,
        budget_scenarios: budgetScenarios,
        max_lead_time: maxLeadTime,
      });
      
      setSimulationResults(response.data);
      
      toast({
        title: 'Simulation Complete',
        description: `Tested ${budgetScenarios.length} budget scenarios`,
      });
    } catch (error: any) {
      toast({
        title: 'Simulation Error',
        description: error.response?.data?.detail || 'Simulation failed',
        variant: 'destructive',
      });
    } finally {
      setSimulationLoading(false);
    }
  };

  const downloadResults = () => {
    if (!result) return;
    
    const dataStr = JSON.stringify(result, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `optimization_results_${new Date().getTime()}.json`;
    link.click();
  };

  // Prepare chart data
  const vendorDistribution = result?.allocations.reduce((acc: any[], alloc) => {
    const existing = acc.find(item => item.name === alloc.vendor_name);
    if (existing) {
      existing.value += alloc.subtotal;
    } else {
      acc.push({ name: alloc.vendor_name, value: alloc.subtotal });
    }
    return acc;
  }, []) || [];

  const costComparison = result ? [
    { name: 'Before Optimization', cost: result.summary.naive_cost },
    { name: 'After Optimization', cost: result.summary.total_cost },
  ] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Vendor Optimization (LP Solver)
            </h1>
            <p className="text-gray-600 mt-2">
              AI-Powered Linear Programming for Smart Vendor Allocation
            </p>
          </div>
          <div className="flex gap-3">
            <Badge variant="outline" className="text-lg px-4 py-2">
              <Zap className="w-4 h-4 mr-2" />
              PuLP Active
            </Badge>
          </div>
        </div>

        {/* Info Banner */}
        <Alert className="border-blue-200 bg-blue-50">
          <Calculator className="h-5 w-5 text-blue-600" />
          <AlertTitle className="text-blue-900 font-semibold">Linear Programming Optimization</AlertTitle>
          <AlertDescription className="text-blue-800">
            This system uses PuLP optimization engine to minimize costs while maximizing vendor reliability.
            Constraints include budget limits, lead time requirements, and vendor capacity.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="input" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="input">Input & Configuration</TabsTrigger>
            <TabsTrigger value="results" disabled={!result}>Optimization Results</TabsTrigger>
            <TabsTrigger value="simulation">Budget Simulation</TabsTrigger>
          </TabsList>

          {/* INPUT TAB */}
          <TabsContent value="input" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Materials Input */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Material Requirements
                  </CardTitle>
                  <CardDescription>
                    Add materials you need to procure
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {materials.map((material, index) => (
                    <div key={index} className="flex gap-3 items-end">
                      <div className="flex-1">
                        <Label>Category</Label>
                        <select
                          className="w-full mt-1 p-2 border rounded-md"
                          value={material.category}
                          onChange={(e) => updateMaterial(index, 'category', e.target.value)}
                        >
                          {materialCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          value={material.quantity}
                          onChange={(e) => updateMaterial(index, 'quantity', Number(e.target.value))}
                          min="0"
                        />
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeMaterial(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button onClick={addMaterial} variant="outline" className="w-full">
                    + Add Material
                  </Button>
                </CardContent>
              </Card>

              {/* Budget & Constraints */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Budget & Constraints
                  </CardTitle>
                  <CardDescription>
                    Set your optimization parameters
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>Total Budget (₹)</Label>
                    <Input
                      type="number"
                      value={budget}
                      onChange={(e) => setBudget(Number(e.target.value))}
                      min="0"
                      step="10000"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      ₹{budget.toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div>
                    <Label>Max Lead Time (days)</Label>
                    <Input
                      type="number"
                      value={maxLeadTime}
                      onChange={(e) => setMaxLeadTime(Number(e.target.value))}
                      min="1"
                      max="90"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Only vendors with lead time ≤ {maxLeadTime} days will be considered
                    </p>
                  </div>

                  <div className="pt-4 space-y-3">
                    <Button
                      onClick={handleOptimize}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                          Optimizing...
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5 mr-2" />
                          Run Optimization
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats Preview */}
            {materials.length > 0 && (
              <Card className="border-dashed">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-3 gap-6 text-center">
                    <div>
                      <p className="text-sm text-gray-500">Materials</p>
                      <p className="text-2xl font-bold text-blue-600">{materials.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Budget</p>
                      <p className="text-2xl font-bold text-green-600">
                        ₹{(budget / 100000).toFixed(1)}L
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Max Lead Time</p>
                      <p className="text-2xl font-bold text-purple-600">{maxLeadTime} days</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* RESULTS TAB */}
          <TabsContent value="results" className="space-y-6">
            {result && result.success && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Total Cost
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">
                        ₹{result.summary.total_cost.toLocaleString('en-IN')}
                      </div>
                      <Progress 
                        value={result.summary.budget_used_percent} 
                        className="mt-2"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {result.summary.budget_used_percent.toFixed(1)}% of budget used
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Cost Savings
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600 flex items-center gap-2">
                        <TrendingDown className="w-5 h-5" />
                        ₹{result.summary.savings.toLocaleString('en-IN')}
                      </div>
                      <p className="text-sm text-green-700 mt-1">
                        {result.summary.savings_percent.toFixed(1)}% reduction
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Vendors Used
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-600 flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        {result.summary.total_vendors_used}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Optimal allocation
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Avg Reliability
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600">
                        {result.summary.avg_reliability.toFixed(1)}%
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Lead time: {result.summary.max_lead_time} days
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Cost Comparison</CardTitle>
                      <CardDescription>Before vs After Optimization</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={costComparison}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                          <Bar dataKey="cost" fill="#3B82F6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Vendor Cost Distribution</CardTitle>
                      <CardDescription>Allocation by vendor</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={vendorDistribution}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label={(entry) => `₹${(entry.value / 1000).toFixed(0)}K`}
                          >
                            {vendorDistribution.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Allocation Table */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Vendor Allocation Details</CardTitle>
                      <CardDescription>
                        Optimized procurement plan for {result.allocations.length} allocations
                      </CardDescription>
                    </div>
                    <Button onClick={downloadResults} variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Vendor</TableHead>
                            <TableHead>Material</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                            <TableHead className="text-right">Unit Price</TableHead>
                            <TableHead className="text-right">Subtotal</TableHead>
                            <TableHead className="text-center">Reliability</TableHead>
                            <TableHead className="text-center">Lead Time</TableHead>
                            <TableHead className="text-center">Rating</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {result.allocations.map((alloc, idx) => (
                            <TableRow key={idx}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{alloc.vendor_name}</p>
                                  <p className="text-xs text-gray-500">{alloc.location}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{alloc.material_category}</Badge>
                              </TableCell>
                              <TableCell className="text-right">{alloc.quantity.toFixed(2)}</TableCell>
                              <TableCell className="text-right">
                                ₹{alloc.unit_price.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                ₹{alloc.subtotal.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant={alloc.reliability_score >= 90 ? 'default' : 'secondary'}>
                                  {alloc.reliability_score.toFixed(1)}%
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                {alloc.lead_time_days} days
                              </TableCell>
                              <TableCell className="text-center">
                                {alloc.rating.toFixed(1)}⭐
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Raw JSON Toggle */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Raw JSON Results (For Judges)</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowRawJson(!showRawJson)}
                      >
                        {showRawJson ? 'Hide' : 'Show'}
                      </Button>
                    </div>
                  </CardHeader>
                  {showRawJson && (
                    <CardContent>
                      <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-xs">
                        {JSON.stringify(result, null, 2)}
                      </pre>
                    </CardContent>
                  )}
                </Card>
              </>
            )}

            {result && !result.success && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Optimization Failed</AlertTitle>
                <AlertDescription>
                  {result.status}: No feasible solution found. Try increasing budget or relaxing constraints.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* SIMULATION TAB */}
          <TabsContent value="simulation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5" />
                  Budget Scenario Simulation
                </CardTitle>
                <CardDescription>
                  Test different budget levels to find optimal allocation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This will test 5 budget scenarios: 70%, 85%, 100%, 115%, and 130% of your current budget (₹{budget.toLocaleString()})
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={handleSimulate}
                  disabled={simulationLoading || materials.length === 0}
                  className="w-full"
                  size="lg"
                >
                  {simulationLoading ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Running Simulation...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Run Budget Simulation
                    </>
                  )}
                </Button>

                {simulationResults && (
                  <>
                    <div className="mt-6">
                      <h3 className="font-semibold mb-4">Simulation Results</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={simulationResults.scenarios}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="budget" 
                            tickFormatter={(value) => `₹${(value/100000).toFixed(1)}L`}
                          />
                          <YAxis />
                          <Tooltip 
                            formatter={(value: number) => `₹${value.toLocaleString()}`}
                            labelFormatter={(label) => `Budget: ₹${label.toLocaleString()}`}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="total_cost" stroke="#3B82F6" name="Total Cost" />
                          <Line type="monotone" dataKey="savings" stroke="#10B981" name="Savings" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Budget</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Total Cost</TableHead>
                          <TableHead className="text-right">Savings</TableHead>
                          <TableHead className="text-center">Vendors</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {simulationResults.scenarios.map((scenario: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">
                              ₹{scenario.budget.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {scenario.feasible ? (
                                <Badge className="bg-green-500">Feasible</Badge>
                              ) : (
                                <Badge variant="destructive">Infeasible</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              ₹{scenario.total_cost.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right text-green-600">
                              ₹{scenario.savings.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-center">
                              {scenario.vendors_used}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {simulationResults.recommendation && (
                      <Alert className="border-green-200 bg-green-50">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-900">Recommended Budget</AlertTitle>
                        <AlertDescription className="text-green-800">
                          Optimal budget: ₹{simulationResults.recommendation.budget.toLocaleString()} with ₹{simulationResults.recommendation.savings.toLocaleString()} savings
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default VendorOptimization;
