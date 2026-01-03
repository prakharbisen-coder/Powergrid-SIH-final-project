import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  TrendingDown, 
  TrendingUp,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Target
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const Budget = () => {
  const budgetOverview = {
    totalAllocated: 12500,
    totalSpent: 9340,
    projected: 11800,
    savings: 700
  };

  const categoryBudgets = [
    { category: 'Towers', allocated: 4500, spent: 3890, projected: 4200, status: 'on-track' },
    { category: 'Conductors', allocated: 3200, spent: 2450, projected: 3050, status: 'on-track' },
    { category: 'Substations', allocated: 2800, spent: 2100, projected: 2650, status: 'on-track' },
    { category: 'Transformers', allocated: 1500, spent: 900, projected: 1400, status: 'under-budget' },
    { category: 'Labor', allocated: 500, spent: 520, projected: 580, status: 'over-budget' }
  ];

  const monthlySpend = [
    { month: 'Jan', allocated: 1800, actual: 1650, optimized: 1600 },
    { month: 'Feb', allocated: 2000, actual: 1920, optimized: 1850 },
    { month: 'Mar', allocated: 1900, actual: 1850, optimized: 1800 },
    { month: 'Apr', allocated: 2200, actual: 2100, optimized: 2000 },
    { month: 'May', allocated: 2100, actual: 2050, optimized: 1950 },
    { month: 'Jun', allocated: 2500, actual: 1770, optimized: 1800 }
  ];

  const optimizationSuggestions = [
    {
      id: 1,
      title: 'Bulk Purchase Discount',
      description: 'Buy conductors in bulk from Vendor A to save 12%',
      potentialSaving: 384,
      impact: 'high',
      status: 'pending'
    },
    {
      id: 2,
      title: 'Alternative Supplier',
      description: 'Switch to Vendor B for tower components',
      potentialSaving: 225,
      impact: 'medium',
      status: 'pending'
    },
    {
      id: 3,
      title: 'Material Reuse',
      description: 'Utilize leftover materials from Delhi project',
      potentialSaving: 156,
      impact: 'medium',
      status: 'approved'
    },
    {
      id: 4,
      title: 'Optimize Transport',
      description: 'Consolidate shipments to reduce logistics cost',
      potentialSaving: 89,
      impact: 'low',
      status: 'pending'
    }
  ];

  const spendDistribution = [
    { name: 'Materials', value: 6940, color: 'hsl(221, 83%, 35%)' },
    { name: 'Labor', value: 1520, color: 'hsl(199, 89%, 48%)' },
    { name: 'Equipment', value: 880, color: 'hsl(142, 76%, 36%)' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track':
        return 'bg-success/10 text-success border-success/20';
      case 'under-budget':
        return 'bg-accent/10 text-accent border-accent/20';
      case 'over-budget':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-success/10 text-success';
      case 'medium':
        return 'bg-warning/10 text-warning';
      case 'low':
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
            <h1 className="text-3xl font-bold">Budget Optimization</h1>
            <p className="text-muted-foreground">AI-powered cost efficiency and procurement planning</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Recalculate
            </Button>
            <Button className="gap-2">
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Budget Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Allocated</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{budgetOverview.totalAllocated}Cr</div>
              <p className="text-xs text-muted-foreground">Across all categories</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{budgetOverview.totalSpent}Cr</div>
              <p className="text-xs text-success">
                {((budgetOverview.totalSpent / budgetOverview.totalAllocated) * 100).toFixed(1)}% utilized
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projected Spend</CardTitle>
              <Target className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{budgetOverview.projected}Cr</div>
              <p className="text-xs text-muted-foreground">By year end</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Potential Savings</CardTitle>
              <TrendingDown className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">₹{budgetOverview.savings}Cr</div>
              <p className="text-xs text-muted-foreground">Through optimization</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Spend Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Budget Trend</CardTitle>
              <CardDescription>Allocated vs actual vs AI-optimized (₹ Crores)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlySpend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem'
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="allocated" stroke="hsl(215, 16%, 47%)" name="Allocated" strokeWidth={2} />
                  <Line type="monotone" dataKey="actual" stroke="hsl(221, 83%, 35%)" name="Actual" strokeWidth={2} />
                  <Line type="monotone" dataKey="optimized" stroke="hsl(142, 76%, 36%)" name="AI Optimized" strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Spend Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Spend Distribution</CardTitle>
              <CardDescription>Current spending breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={spendDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ₹${value}Cr`}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {spendDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Budget Comparison */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Category-wise Budget Analysis</CardTitle>
              <CardDescription>Allocated vs spent vs projected (₹ Crores)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryBudgets}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="allocated" fill="hsl(215, 16%, 47%)" name="Allocated" />
                  <Bar dataKey="spent" fill="hsl(221, 83%, 35%)" name="Spent" />
                  <Bar dataKey="projected" fill="hsl(199, 89%, 48%)" name="Projected" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Optimization Suggestions */}
        <Card>
          <CardHeader>
            <CardTitle>AI Optimization Suggestions</CardTitle>
            <CardDescription>Cost-saving recommendations based on historical data and market analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {optimizationSuggestions.map((suggestion) => (
                <div 
                  key={suggestion.id}
                  className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className={`rounded-full p-2 ${getImpactColor(suggestion.impact)}`}>
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-semibold">{suggestion.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{suggestion.description}</p>
                      </div>
                      <Badge className={getImpactColor(suggestion.impact)}>
                        {suggestion.impact.toUpperCase()} IMPACT
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="text-lg font-bold text-success">
                        Save ₹{suggestion.potentialSaving}Cr
                      </div>
                      {suggestion.status === 'approved' ? (
                        <Badge className="bg-success/10 text-success gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Approved
                        </Badge>
                      ) : (
                        <div className="flex gap-2">
                          <Button size="sm">Approve</Button>
                          <Button size="sm" variant="outline">Review</Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Status Table */}
        <Card>
          <CardHeader>
            <CardTitle>Budget Status by Category</CardTitle>
            <CardDescription>Detailed breakdown of budget utilization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Allocated</TableHead>
                    <TableHead className="text-right">Spent</TableHead>
                    <TableHead className="text-right">Projected</TableHead>
                    <TableHead className="text-right">Utilization</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryBudgets.map((item) => (
                    <TableRow key={item.category}>
                      <TableCell className="font-medium">{item.category}</TableCell>
                      <TableCell className="text-right">₹{item.allocated}Cr</TableCell>
                      <TableCell className="text-right">₹{item.spent}Cr</TableCell>
                      <TableCell className="text-right">₹{item.projected}Cr</TableCell>
                      <TableCell className="text-right">
                        {((item.spent / item.allocated) * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(item.status)}>
                          {item.status === 'on-track' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                          {item.status === 'over-budget' && <AlertCircle className="h-3 w-3 mr-1" />}
                          {item.status.replace('-', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Budget;
