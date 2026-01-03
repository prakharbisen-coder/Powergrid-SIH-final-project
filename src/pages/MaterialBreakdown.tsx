import { useEffect, useState } from 'react';
import { materialAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Package, 
  Zap, 
  Shield, 
  Construction, 
  Wrench, 
  Cable,
  Search,
  Download,
  TrendingUp,
  TrendingDown,
  AlertTriangle
} from 'lucide-react';

interface Material {
  id: string;
  materialId: string;
  name: string;
  subCategory: string;
  quantity: number;
  unit: string;
  price: number;
  status: string;
  specifications?: any;
}

interface CategoryData {
  _id: string;
  totalQuantity: number;
  totalValue: number;
  materialCount: number;
  lowStock: number;
  materials: Material[];
}

interface SubcategoryData {
  _id: {
    category: string;
    subCategory: string;
  };
  totalQuantity: number;
  totalValue: number;
  materialCount: number;
  avgPrice: number;
}

const categoryIcons: Record<string, any> = {
  Steel: Construction,
  Conductors: Cable,
  Insulators: Shield,
  Cement: Package,
  'Nuts/Bolts': Wrench,
  Earthing: Zap,
  Others: Package,
};

const categoryColors: Record<string, string> = {
  Steel: 'bg-slate-500',
  Conductors: 'bg-amber-500',
  Insulators: 'bg-blue-500',
  Cement: 'bg-gray-500',
  'Nuts/Bolts': 'bg-purple-500',
  Earthing: 'bg-yellow-500',
  Others: 'bg-green-500',
};

const statusColors: Record<string, string> = {
  optimal: 'bg-green-500',
  low: 'bg-yellow-500',
  critical: 'bg-orange-500',
  'out-of-stock': 'bg-red-500',
};

export default function MaterialBreakdown() {
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [subcategoryData, setSubcategoryData] = useState<SubcategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchMaterialBreakdown();
  }, []);

  useEffect(() => {
    if (categoryData.length === 0) return;
    const fallbackId = categoryData[0]._id;
    if (selectedCategory === 'all') {
      setActiveTab((current) => current || fallbackId);
      return;
    }

    const match = categoryData.find((cat) => cat._id === selectedCategory);
    setActiveTab(match?._id || fallbackId);
  }, [categoryData, selectedCategory]);

  const fetchMaterialBreakdown = async () => {
    try {
      setLoading(true);
      const response = await materialAPI.getByCategory();
      setCategoryData(response.data.data.categoryBreakdown);
      setSubcategoryData(response.data.data.subcategoryBreakdown);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch material breakdown',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-IN').format(value);
  };

  const getFilteredMaterials = (materials: Material[]) => {
    if (!searchQuery) return materials;
    return materials.filter(
      (m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.materialId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.subCategory.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getSubcategoriesForCategory = (category: string) => {
    return subcategoryData.filter((sub) => sub._id.category === category);
  };

  const exportToCSV = () => {
    const headers = ['Category', 'Subcategory', 'Material Count', 'Total Quantity', 'Total Value', 'Avg Price'];
    const rows = subcategoryData.map((sub) => [
      sub._id.category,
      sub._id.subCategory,
      sub.materialCount,
      sub.totalQuantity,
      sub.totalValue,
      sub.avgPrice.toFixed(2),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `material-breakdown-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const totalValue = categoryData.reduce((sum, cat) => sum + cat.totalValue, 0);
  const totalMaterials = categoryData.reduce((sum, cat) => sum + cat.materialCount, 0);
  const totalLowStock = categoryData.reduce((sum, cat) => sum + cat.lowStock, 0);

  const displayedCategories = selectedCategory === 'all'
    ? categoryData
    : categoryData.filter((cat) => cat._id === selectedCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Material Type Breakdown</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive categorization of materials by type
          </p>
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoryData.length}</div>
            <p className="text-xs text-muted-foreground">Active material categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Materials</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalMaterials)}</div>
            <p className="text-xs text-muted-foreground">Across all categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground">Inventory worth</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{totalLowStock}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        {displayedCategories.map((category) => {
          const Icon = categoryIcons[category._id] || Package;
          const colorClass = categoryColors[category._id] || 'bg-gray-500';
          const percentage = ((category.totalValue / totalValue) * 100).toFixed(1);

          return (
            <Card key={category._id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10`}>
                    <Icon className={`h-6 w-6 ${colorClass.replace('bg-', 'text-')}`} />
                  </div>
                  {category.lowStock > 0 && (
                    <Badge variant="destructive">{category.lowStock} Low</Badge>
                  )}
                </div>
                <CardTitle className="text-lg mt-2">{category._id}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Materials:</span>
                    <span className="font-semibold">{category.materialCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Value:</span>
                    <span className="font-semibold">{formatCurrency(category.totalValue)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">% of Total:</span>
                    <span className="font-semibold">{percentage}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search materials, IDs, or subcategories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categoryData.map((cat) => (
              <SelectItem key={cat._id} value={cat._id}>
                {cat._id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Detailed Breakdown Tabs */}
      {displayedCategories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No categories match the current filter.
          </CardContent>
        </Card>
      ) : (
        <Tabs 
          value={activeTab || displayedCategories[0]?._id}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-7">
            {displayedCategories.map((cat) => (
              <TabsTrigger key={cat._id} value={cat._id}>
                {cat._id}
              </TabsTrigger>
            ))}
          </TabsList>

          {displayedCategories.map((category) => (
            <TabsContent key={category._id} value={category._id} className="space-y-4">
            {/* Subcategory Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {getSubcategoriesForCategory(category._id).map((sub) => (
                <Card key={`${sub._id.category}-${sub._id.subCategory}`}>
                  <CardHeader>
                    <CardTitle className="text-base">{sub._id.subCategory}</CardTitle>
                    <CardDescription>{sub.materialCount} materials</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Qty:</span>
                        <span className="font-semibold">{formatNumber(sub.totalQuantity)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Value:</span>
                        <span className="font-semibold">{formatCurrency(sub.totalValue)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Avg Price:</span>
                        <span className="font-semibold">{formatCurrency(sub.avgPrice)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Materials Table */}
            <Card>
              <CardHeader>
                <CardTitle>All {category._id} Materials</CardTitle>
                <CardDescription>
                  Complete list of materials in this category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Subcategory</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredMaterials(category.materials).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground">
                          No materials found
                        </TableCell>
                      </TableRow>
                    ) : (
                      getFilteredMaterials(category.materials).map((material) => (
                        <TableRow key={material.id}>
                          <TableCell className="font-medium">{material.materialId}</TableCell>
                          <TableCell>{material.name}</TableCell>
                          <TableCell>{material.subCategory}</TableCell>
                          <TableCell>{formatNumber(material.quantity)}</TableCell>
                          <TableCell>{material.unit}</TableCell>
                          <TableCell>{formatCurrency(material.price)}</TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(material.quantity * material.price)}
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[material.status] || 'bg-gray-500'}>
                              {material.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
        </Tabs>
      )}
    </div>
  );
}
