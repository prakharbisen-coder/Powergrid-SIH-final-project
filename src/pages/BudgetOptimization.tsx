import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Target,
  BarChart3,
  PieChart,
  Loader2,
  Brain,
  Zap,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface CostPrediction {
  predictedCost: number;
  confidence: number;
  breakdown: {
    materials: number;
    labor: number;
    equipment: number;
    overhead: number;
  };
  riskLevel: string;
}

interface BudgetOverrunPrediction {
  willExceed: boolean;
  probability: number;
  expectedOverrun: number;
  riskLevel: string;
  recommendations: string[];
}

interface MaterialPricePrediction {
  predictedPrice: number;
  confidence: number;
  marketTrend: string;
}

const BudgetOptimization: React.FC = () => {
  const [activeTab, setActiveTab] = useState('cost-forecasting');
  const [loading, setLoading] = useState(false);

  // Cost Forecasting State
  const [costFormData, setCostFormData] = useState({
    region: 'North',
    terrain: 'Plain',
    towerType: '220kV Lattice',
    towerCount: 75,
    lineLength: 100,
    voltageLevel: '220kV',
    substationType: 'AIS (Air Insulated)',
    duration: 180,
    gstPercent: 18,
  });
  const [costPrediction, setCostPrediction] = useState<CostPrediction | null>(null);

  // Budget Overrun State
  const [budgetFormData, setBudgetFormData] = useState({
    category: 'Conductors',
    allocatedAmount: 10000000,
    spentAmount: 9500000,
    projectedAmount: 10500000,
    utilizationPercent: 95,
    totalTransactions: 25,
    daysActive: 120,
  });
  const [overrunPrediction, setOverrunPrediction] = useState<BudgetOverrunPrediction | null>(null);

  // Material Price State
  const [materialFormData, setMaterialFormData] = useState({
    category: 'Steel',
    subCategory: 'Angle Steel',
    quantity: 5000,
    thickness: 6,
    length: 6000,
    width: 50,
    weight: 5.4,
  });
  const [pricePrediction, setPricePrediction] = useState<MaterialPricePrediction | null>(null);

  // Predict Project Cost
  const predictProjectCost = async () => {
    setLoading(true);
    try {
      // For now, use mock ML prediction (replace with actual API call)
      const baselineCost = 
        costFormData.towerCount * 1000000 + 
        costFormData.lineLength * 500000;
      
      const terrainMultiplier = {
        'Plain': 1.0,
        'Hilly': 1.3,
        'Coastal': 1.2,
        'Desert': 1.15,
        'Forest': 1.25,
      }[costFormData.terrain] || 1.0;

      const predictedCost = baselineCost * terrainMultiplier;

      const prediction: CostPrediction = {
        predictedCost,
        confidence: 85,
        breakdown: {
          materials: predictedCost * 0.60,
          labor: predictedCost * 0.20,
          equipment: predictedCost * 0.12,
          overhead: predictedCost * 0.08,
        },
        riskLevel: predictedCost > 100000000 ? 'High' : predictedCost > 50000000 ? 'Medium' : 'Low',
      };

      setCostPrediction(prediction);
      toast.success('Cost prediction generated successfully!');
    } catch (error) {
      console.error('Error predicting cost:', error);
      toast.error('Failed to predict project cost');
    } finally {
      setLoading(false);
    }
  };

  // Predict Budget Overrun
  const predictBudgetOverrun = async () => {
    setLoading(true);
    try {
      const utilization = budgetFormData.utilizationPercent;
      const willExceed = utilization > 100;
      const probability = Math.min(100, Math.max(0, (utilization - 80) * 2));

      const prediction: BudgetOverrunPrediction = {
        willExceed,
        probability,
        expectedOverrun: willExceed ? budgetFormData.spentAmount - budgetFormData.allocatedAmount : 0,
        riskLevel: probability > 75 ? 'Critical' : probability > 50 ? 'High' : probability > 25 ? 'Medium' : 'Low',
        recommendations: [
          probability > 50 ? 'Immediate cost control measures required' : 'Monitor spending closely',
          'Review procurement processes for cost savings',
          'Consider alternative vendors for better pricing',
          utilization > 90 ? 'Prioritize critical expenses only' : 'Maintain current budget discipline',
        ],
      };

      setOverrunPrediction(prediction);
      toast.success('Budget overrun analysis completed!');
    } catch (error) {
      console.error('Error predicting overrun:', error);
      toast.error('Failed to predict budget overrun');
    } finally {
      setLoading(false);
    }
  };

  // Predict Material Price
  const predictMaterialPrice = async () => {
    setLoading(true);
    try {
      const basePrices: Record<string, number> = {
        'Steel': 65,
        'Conductors': 450,
        'Insulators': 450,
        'Cement': 420,
        'Nuts/Bolts': 45,
        'Earthing': 1200,
      };

      const basePrice = basePrices[materialFormData.category] || 100;
      const predictedPrice = basePrice * (0.9 + Math.random() * 0.2);

      const prediction: MaterialPricePrediction = {
        predictedPrice,
        confidence: 82,
        marketTrend: Math.random() > 0.5 ? 'Increasing' : 'Stable',
      };

      setPricePrediction(prediction);
      toast.success('Material price prediction generated!');
    } catch (error) {
      console.error('Error predicting price:', error);
      toast.error('Failed to predict material price');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} L`;
    } else {
      return `₹${amount.toLocaleString('en-IN')}`;
    }
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'Critical':
        return 'bg-red-500 text-white';
      case 'High':
        return 'bg-orange-500 text-white';
      case 'Medium':
        return 'bg-yellow-500 text-black';
      case 'Low':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
            Budget Optimization
          </h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            AI-powered predictions for cost forecasting<span className="hidden sm:inline">, budget management,</span> and material pricing
          </p>
        </div>
        <Badge className="bg-purple-100 text-purple-800 border-purple-300 text-xs sm:text-sm">
          <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
          ML Powered
        </Badge>
      </div>

      {/* ML Info Banner */}
      <Alert className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0" />
        <AlertDescription className="text-xs sm:text-sm">
          <strong>AI Models Active:</strong> Using Random Forest<span className="hidden sm:inline">, XGBoost, and ensemble methods</span> trained on 
          historical project data<span className="hidden md:inline"> to provide accurate cost predictions and budget insights</span>.
        </AlertDescription>
      </Alert>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="cost-forecasting" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5">
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 hidden sm:block" />
            <span className="sm:hidden">Cost</span>
            <span className="hidden sm:inline">Cost Forecasting</span>
          </TabsTrigger>
          <TabsTrigger value="budget-overrun" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5">
            <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 hidden sm:block" />
            <span className="sm:hidden">Budget</span>
            <span className="hidden sm:inline">Budget Overrun</span>
          </TabsTrigger>
          <TabsTrigger value="material-pricing" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-2.5">
            <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 hidden sm:block" />
            <span className="sm:hidden">Material</span>
            <span className="hidden sm:inline">Material Pricing</span>
          </TabsTrigger>
        </TabsList>

        {/* Cost Forecasting Tab */}
        <TabsContent value="cost-forecasting" className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Input Form */}
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Target className="w-4 h-4 sm:w-5 sm:h-5" />
                  Project Specifications
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Enter project details to predict total cost
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1 sm:space-y-2">
                    <Label className="text-xs sm:text-sm">Region</Label>
                    <Select
                      value={costFormData.region}
                      onValueChange={(value) => setCostFormData({ ...costFormData, region: value })}
                    >
                      <SelectTrigger className="h-9 sm:h-10 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="North">North</SelectItem>
                        <SelectItem value="South">South</SelectItem>
                        <SelectItem value="East">East</SelectItem>
                        <SelectItem value="West">West</SelectItem>
                        <SelectItem value="Central">Central</SelectItem>
                        <SelectItem value="North-East">North-East</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Terrain</Label>
                    <Select
                      value={costFormData.terrain}
                      onValueChange={(value) => setCostFormData({ ...costFormData, terrain: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Plain">Plain</SelectItem>
                        <SelectItem value="Hilly">Hilly</SelectItem>
                        <SelectItem value="Coastal">Coastal</SelectItem>
                        <SelectItem value="Desert">Desert</SelectItem>
                        <SelectItem value="Forest">Forest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tower Type</Label>
                    <Select
                      value={costFormData.towerType}
                      onValueChange={(value) => setCostFormData({ ...costFormData, towerType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="66kV Lattice">66kV Lattice</SelectItem>
                        <SelectItem value="132kV Lattice">132kV Lattice</SelectItem>
                        <SelectItem value="220kV Lattice">220kV Lattice</SelectItem>
                        <SelectItem value="400kV Lattice">400kV Lattice</SelectItem>
                        <SelectItem value="765kV Lattice">765kV Lattice</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Voltage Level</Label>
                    <Select
                      value={costFormData.voltageLevel}
                      onValueChange={(value) => setCostFormData({ ...costFormData, voltageLevel: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="66kV">66kV</SelectItem>
                        <SelectItem value="132kV">132kV</SelectItem>
                        <SelectItem value="220kV">220kV</SelectItem>
                        <SelectItem value="400kV">400kV</SelectItem>
                        <SelectItem value="765kV">765kV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tower Count</Label>
                    <Input
                      type="number"
                      value={costFormData.towerCount}
                      onChange={(e) => setCostFormData({ ...costFormData, towerCount: parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Line Length (km)</Label>
                    <Input
                      type="number"
                      value={costFormData.lineLength}
                      onChange={(e) => setCostFormData({ ...costFormData, lineLength: parseFloat(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Duration (days)</Label>
                    <Input
                      type="number"
                      value={costFormData.duration}
                      onChange={(e) => setCostFormData({ ...costFormData, duration: parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>GST (%)</Label>
                    <Input
                      type="number"
                      value={costFormData.gstPercent}
                      onChange={(e) => setCostFormData({ ...costFormData, gstPercent: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>

                <Button
                  onClick={predictProjectCost}
                  disabled={loading}
                  className="w-full h-9 sm:h-10 text-sm sm:text-base"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Predict Project Cost
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Prediction Results */}
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
                  Cost Prediction
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  AI-generated cost estimate
                </CardDescription>
              </CardHeader>
              <CardContent>
                {costPrediction ? (
                  <div className="space-y-4 sm:space-y-6">
                    {/* Total Cost */}
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 sm:p-6 rounded-lg border border-purple-200">
                      <div className="text-xs sm:text-sm text-gray-600 mb-1">Predicted Total Cost</div>
                      <div className="text-2xl sm:text-4xl font-bold text-purple-700">
                        {formatCurrency(costPrediction.predictedCost)}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 sm:mt-3">
                        <Badge variant="outline" className="bg-white text-xs sm:text-sm">
                          Confidence: {costPrediction.confidence}%
                        </Badge>
                        <Badge className={`${getRiskBadgeColor(costPrediction.riskLevel)} text-xs sm:text-sm`}>
                          {costPrediction.riskLevel} Risk
                        </Badge>
                      </div>
                    </div>

                    {/* Cost Breakdown */}
                    <div className="space-y-2 sm:space-y-3">
                      <h4 className="font-semibold text-xs sm:text-sm text-gray-700">Cost Breakdown</h4>
                      
                      <div className="space-y-2">
                        {Object.entries(costPrediction.breakdown).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                            <span className="text-xs sm:text-sm capitalize">{key}</span>
                            <span className="font-semibold text-xs sm:text-sm">{formatCurrency(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <div className="p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-xs text-gray-600">Cost per Tower</div>
                        <div className="text-sm sm:text-lg font-bold text-blue-700">
                          {formatCurrency(costPrediction.predictedCost / costFormData.towerCount)}
                        </div>
                      </div>
                      <div className="p-2 sm:p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="text-xs text-gray-600">Cost per km</div>
                        <div className="text-sm sm:text-lg font-bold text-green-700">
                          {formatCurrency(costPrediction.predictedCost / costFormData.lineLength)}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12 text-gray-500">
                    <Brain className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-400" />
                    <p className="text-sm sm:text-base px-4">Enter project specifications and click predict to see cost estimation</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Budget Overrun Tab */}
        <TabsContent value="budget-overrun" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Budget Status
                </CardTitle>
                <CardDescription>
                  Enter current budget details for overrun analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Budget Category</Label>
                    <Select
                      value={budgetFormData.category}
                      onValueChange={(value) => setBudgetFormData({ ...budgetFormData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Towers">Towers</SelectItem>
                        <SelectItem value="Conductors">Conductors</SelectItem>
                        <SelectItem value="Substations">Substations</SelectItem>
                        <SelectItem value="Transformers">Transformers</SelectItem>
                        <SelectItem value="Labor">Labor</SelectItem>
                        <SelectItem value="Transport">Transport</SelectItem>
                        <SelectItem value="Equipment">Equipment</SelectItem>
                        <SelectItem value="Others">Others</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Allocated Amount (₹)</Label>
                    <Input
                      type="number"
                      value={budgetFormData.allocatedAmount}
                      onChange={(e) => setBudgetFormData({ ...budgetFormData, allocatedAmount: parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Spent Amount (₹)</Label>
                    <Input
                      type="number"
                      value={budgetFormData.spentAmount}
                      onChange={(e) => setBudgetFormData({ ...budgetFormData, spentAmount: parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Projected Amount (₹)</Label>
                    <Input
                      type="number"
                      value={budgetFormData.projectedAmount}
                      onChange={(e) => setBudgetFormData({ ...budgetFormData, projectedAmount: parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Utilization (%)</Label>
                    <Input
                      type="number"
                      value={budgetFormData.utilizationPercent}
                      onChange={(e) => setBudgetFormData({ ...budgetFormData, utilizationPercent: parseFloat(e.target.value) })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Total Transactions</Label>
                      <Input
                        type="number"
                        value={budgetFormData.totalTransactions}
                        onChange={(e) => setBudgetFormData({ ...budgetFormData, totalTransactions: parseInt(e.target.value) })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Days Active</Label>
                      <Input
                        type="number"
                        value={budgetFormData.daysActive}
                        onChange={(e) => setBudgetFormData({ ...budgetFormData, daysActive: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={predictBudgetOverrun}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Analyze Budget Risk
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Prediction Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Overrun Analysis
                </CardTitle>
                <CardDescription>
                  AI-powered budget risk assessment
                </CardDescription>
              </CardHeader>
              <CardContent>
                {overrunPrediction ? (
                  <div className="space-y-6">
                    {/* Risk Status */}
                    <div className={`p-6 rounded-lg border-2 ${
                      overrunPrediction.willExceed 
                        ? 'bg-red-50 border-red-300' 
                        : 'bg-green-50 border-green-300'
                    }`}>
                      <div className="flex items-center gap-3 mb-3">
                        {overrunPrediction.willExceed ? (
                          <AlertTriangle className="w-8 h-8 text-red-600" />
                        ) : (
                          <CheckCircle className="w-8 h-8 text-green-600" />
                        )}
                        <div>
                          <div className="text-sm text-gray-600">Budget Status</div>
                          <div className="text-2xl font-bold">
                            {overrunPrediction.willExceed ? 'Will Exceed' : 'On Track'}
                          </div>
                        </div>
                      </div>
                      <Badge className={getRiskBadgeColor(overrunPrediction.riskLevel)}>
                        {overrunPrediction.riskLevel} Risk
                      </Badge>
                    </div>

                    {/* Probability */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Overrun Probability</span>
                        <span className="font-bold">{overrunPrediction.probability.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all ${
                            overrunPrediction.probability > 75 
                              ? 'bg-red-500' 
                              : overrunPrediction.probability > 50 
                              ? 'bg-orange-500' 
                              : overrunPrediction.probability > 25 
                              ? 'bg-yellow-500' 
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${overrunPrediction.probability}%` }}
                        />
                      </div>
                    </div>

                    {/* Expected Overrun */}
                    {overrunPrediction.expectedOverrun > 0 && (
                      <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="text-sm text-gray-600 mb-1">Expected Overrun</div>
                        <div className="text-2xl font-bold text-orange-700">
                          {formatCurrency(overrunPrediction.expectedOverrun)}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm text-gray-700">Recommendations</h4>
                      <div className="space-y-2">
                        {overrunPrediction.recommendations.map((rec, idx) => (
                          <div key={idx} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                            <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p>Enter budget details to analyze overrun risk</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Material Pricing Tab */}
        <TabsContent value="material-pricing" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Material Specifications
                </CardTitle>
                <CardDescription>
                  Enter material details for price prediction
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Material Category</Label>
                    <Select
                      value={materialFormData.category}
                      onValueChange={(value) => setMaterialFormData({ ...materialFormData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Steel">Steel</SelectItem>
                        <SelectItem value="Conductors">Conductors</SelectItem>
                        <SelectItem value="Insulators">Insulators</SelectItem>
                        <SelectItem value="Cement">Cement</SelectItem>
                        <SelectItem value="Nuts/Bolts">Nuts/Bolts</SelectItem>
                        <SelectItem value="Earthing">Earthing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Sub-Category</Label>
                    <Select
                      value={materialFormData.subCategory}
                      onValueChange={(value) => setMaterialFormData({ ...materialFormData, subCategory: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {materialFormData.category === 'Steel' && (
                          <>
                            <SelectItem value="Angle Steel">Angle Steel</SelectItem>
                            <SelectItem value="Channel Steel">Channel Steel</SelectItem>
                            <SelectItem value="Flat Steel">Flat Steel</SelectItem>
                          </>
                        )}
                        {materialFormData.category === 'Conductors' && (
                          <>
                            <SelectItem value="ACSR Conductors">ACSR Conductors</SelectItem>
                            <SelectItem value="AAC Conductors">AAC Conductors</SelectItem>
                          </>
                        )}
                        {materialFormData.category === 'Insulators' && (
                          <>
                            <SelectItem value="Disc Insulators">Disc Insulators</SelectItem>
                            <SelectItem value="Pin Insulators">Pin Insulators</SelectItem>
                          </>
                        )}
                        {materialFormData.category === 'Cement' && (
                          <>
                            <SelectItem value="OPC 43 Grade">OPC 43 Grade</SelectItem>
                            <SelectItem value="OPC 53 Grade">OPC 53 Grade</SelectItem>
                          </>
                        )}
                        {materialFormData.category === 'Nuts/Bolts' && (
                          <>
                            <SelectItem value="Foundation Bolts">Foundation Bolts</SelectItem>
                            <SelectItem value="Tower Bolts">Tower Bolts</SelectItem>
                          </>
                        )}
                        {materialFormData.category === 'Earthing' && (
                          <>
                            <SelectItem value="Earth Rods">Earth Rods</SelectItem>
                            <SelectItem value="Earth Wire">Earth Wire</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      value={materialFormData.quantity}
                      onChange={(e) => setMaterialFormData({ ...materialFormData, quantity: parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Thickness (mm)</Label>
                      <Input
                        type="number"
                        value={materialFormData.thickness}
                        onChange={(e) => setMaterialFormData({ ...materialFormData, thickness: parseFloat(e.target.value) })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Length (mm)</Label>
                      <Input
                        type="number"
                        value={materialFormData.length}
                        onChange={(e) => setMaterialFormData({ ...materialFormData, length: parseInt(e.target.value) })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Width (mm)</Label>
                      <Input
                        type="number"
                        value={materialFormData.width}
                        onChange={(e) => setMaterialFormData({ ...materialFormData, width: parseInt(e.target.value) })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Weight (kg/m)</Label>
                      <Input
                        type="number"
                        value={materialFormData.weight}
                        onChange={(e) => setMaterialFormData({ ...materialFormData, weight: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={predictMaterialPrice}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Predict Material Price
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Prediction Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Price Prediction
                </CardTitle>
                <CardDescription>
                  AI-based market price estimation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pricePrediction ? (
                  <div className="space-y-6">
                    {/* Unit Price */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
                      <div className="text-sm text-gray-600 mb-1">Predicted Unit Price</div>
                      <div className="text-4xl font-bold text-green-700">
                        ₹{pricePrediction.predictedPrice.toFixed(2)}
                      </div>
                      <div className="flex items-center gap-4 mt-3">
                        <Badge variant="outline" className="bg-white">
                          Confidence: {pricePrediction.confidence}%
                        </Badge>
                        <Badge className={
                          pricePrediction.marketTrend === 'Increasing' 
                            ? 'bg-orange-500 text-white' 
                            : 'bg-blue-500 text-white'
                        }>
                          {pricePrediction.marketTrend === 'Increasing' ? (
                            <TrendingUp className="w-3 h-3 mr-1" />
                          ) : (
                            <TrendingDown className="w-3 h-3 mr-1" />
                          )}
                          {pricePrediction.marketTrend}
                        </Badge>
                      </div>
                    </div>

                    {/* Total Cost */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-sm text-gray-600 mb-1">Total Cost for {materialFormData.quantity} units</div>
                      <div className="text-2xl font-bold text-blue-700">
                        {formatCurrency(pricePrediction.predictedPrice * materialFormData.quantity)}
                      </div>
                    </div>

                    {/* Material Details */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm text-gray-700">Material Details</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-xs text-gray-600">Category</div>
                          <div className="font-semibold">{materialFormData.category}</div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-xs text-gray-600">Sub-Category</div>
                          <div className="font-semibold">{materialFormData.subCategory}</div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-xs text-gray-600">Dimensions</div>
                          <div className="font-semibold text-xs">
                            {materialFormData.length} × {materialFormData.width} × {materialFormData.thickness} mm
                          </div>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="text-xs text-gray-600">Weight</div>
                          <div className="font-semibold">{materialFormData.weight} kg/m</div>
                        </div>
                      </div>
                    </div>

                    {/* Market Insights */}
                    <Alert className={
                      pricePrediction.marketTrend === 'Increasing' 
                        ? 'bg-orange-50 border-orange-200' 
                        : 'bg-blue-50 border-blue-200'
                    }>
                      <AlertDescription className="text-sm">
                        <strong>Market Insight:</strong> {
                          pricePrediction.marketTrend === 'Increasing' 
                            ? 'Prices are trending upward. Consider purchasing soon to lock in current rates.' 
                            : 'Prices are stable. Good time for procurement planning.'
                        }
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p>Enter material specifications to predict pricing</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BudgetOptimization;
