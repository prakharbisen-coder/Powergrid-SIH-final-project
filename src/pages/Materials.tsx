import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Filter, 
  Download, 
  Package, 
  AlertCircle,
  CheckCircle2,
  TrendingDown,
  Recycle,
  X,
  Plus,
  DollarSign
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { materialAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface Material {
  _id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  location: string;
  status: string;
  reorderLevel: number;
  supplier?: string;
  costPerUnit?: number;
  lastRestocked?: string;
  createdAt?: string;
  updatedAt?: string;
}

const Materials = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '',
    reorderLevel: '',
    location: '',
    unit: 'units',
    supplier: '',
    costPerUnit: ''
  });

  const [materials, setMaterials] = useState<Material[]>([]);

  // Fetch materials from backend
  const fetchMaterials = async () => {
    setIsLoading(true);
    try {
      const response = await materialAPI.getAll();
      setMaterials(response.data.data);
    } catch (error: any) {
      console.error('Error fetching materials:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch materials",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal':
        return 'bg-success/10 text-success border-success/20';
      case 'low':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'critical':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'optimal':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'low':
      case 'critical':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const summary = {
    total: materials.reduce((sum, m) => sum + m.quantity, 0),
    lowStock: materials.filter(m => m.status === 'Low Stock' || m.status === 'Out of Stock').length,
    categories: [...new Set(materials.map(m => m.category))].length,
    totalValue: materials.reduce((sum, m) => sum + (m.quantity * (m.costPerUnit || 0)), 0)
  };

  // Get unique categories, statuses, and locations for filters
  const uniqueCategories = [...new Set(materials.map(m => m.category))].sort();
  const uniqueStatuses = ['optimal', 'low', 'critical'];
  const uniqueLocations = [...new Set(materials.map(m => m.location))].sort();

  // Filter handler functions
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const toggleStatus = (status: string) => {
    setSelectedStatuses(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const toggleLocation = (location: string) => {
    setSelectedLocations(prev =>
      prev.includes(location) ? prev.filter(l => l !== location) : [...prev, location]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedStatuses([]);
    setSelectedLocations([]);
    setShowLowStockOnly(false);
  };

  const isFilterActive = selectedCategories.length > 0 || selectedStatuses.length > 0 || selectedLocations.length > 0 || showLowStockOnly;

  // Filtered materials based on all criteria
  const filteredMaterials = materials.filter(material => {
    const matchesSearch =
      material._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(material.category);
    const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(material.status);
    const matchesLocation = selectedLocations.length === 0 || selectedLocations.includes(material.location);
    const matchesLowStock = !showLowStockOnly || material.status === 'Low Stock' || material.status === 'Out of Stock';

    return matchesSearch && matchesCategory && matchesStatus && matchesLocation && matchesLowStock;
  });

  // Determine status based on quantity vs threshold
  const determineStatus = (quantity: number, threshold: number) => {
    if (quantity <= threshold * 0.3) return 'critical';
    if (quantity <= threshold) return 'low';
    return 'optimal';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      category: value
    }));
  };

  const handleLocationChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      location: value
    }));
  };

  const handleAddMaterial = async () => {
    // Validation
    if (!formData.name.trim() || !formData.category || !formData.location || 
        !formData.quantity || !formData.reorderLevel) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const quantity = parseInt(formData.quantity);
    const reorderLevel = parseInt(formData.reorderLevel);
    const costPerUnit = formData.costPerUnit ? parseFloat(formData.costPerUnit) : undefined;

    if (isNaN(quantity) || isNaN(reorderLevel)) {
      toast({
        title: "Validation Error",
        description: "Please enter valid numbers",
        variant: "destructive"
      });
      return;
    }

    try {
      const materialData = {
        name: formData.name.trim(),
        category: formData.category,
        quantity,
        unit: formData.unit,
        location: formData.location,
        reorderLevel,
        supplier: formData.supplier || undefined,
        costPerUnit
      };

      const response = await materialAPI.create(materialData);
      
      toast({
        title: "Success",
        description: "Material added successfully"
      });
      
      // Refresh materials list
      fetchMaterials();
      
      // Reset form
      setFormData({
        name: '',
        category: '',
        quantity: '',
        reorderLevel: '',
        location: '',
        unit: 'units',
        supplier: '',
        costPerUnit: ''
      });
      
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Error adding material:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to add material",
        variant: "destructive"
      });
    }
  };

  const handleExport = () => {
    // Prepare CSV headers
    const headers = ['Material ID', 'Name', 'Category', 'Quantity', 'Unit', 'Reorder Level', 'Location', 'Status', 'Supplier', 'Cost Per Unit', 'Last Updated'];
    
    // Prepare CSV rows
    const rows = materials.map(material => [
      material._id,
      material.name,
      material.category,
      material.quantity,
      material.unit,
      material.reorderLevel,
      material.location,
      material.status,
      material.supplier || 'N/A',
      material.costPerUnit || 'N/A',
      new Date(material.updatedAt || material.createdAt || '').toLocaleDateString()
    ]);
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `materials-inventory-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Material Tracking & Inventory</h1>
            <p className="text-muted-foreground">Monitor stock levels and optimize material usage</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4" />
                  Add Material
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Material</DialogTitle>
                  <DialogDescription>
                    Fill in the details to add a new material to the inventory
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Material Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="e.g., 220kV Transformer"
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={handleCategoryChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Towers">Towers</SelectItem>
                        <SelectItem value="Conductors">Conductors</SelectItem>
                        <SelectItem value="Substation Parts">Substation Parts</SelectItem>
                        <SelectItem value="Transformers">Transformers</SelectItem>
                        <SelectItem value="Insulators">Insulators</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="quantity">Quantity *</Label>
                      <Input
                        id="quantity"
                        name="quantity"
                        type="number"
                        placeholder="0"
                        value={formData.quantity}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="reorderLevel">Reorder Level *</Label>
                      <Input
                        id="reorderLevel"
                        name="reorderLevel"
                        type="number"
                        placeholder="0"
                        value={formData.reorderLevel}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="unit">Unit</Label>
                      <Select value={formData.unit} onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="units">Units</SelectItem>
                          <SelectItem value="kg">Kilograms</SelectItem>
                          <SelectItem value="tons">Tons</SelectItem>
                          <SelectItem value="meters">Meters</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="costPerUnit">Cost Per Unit (₹)</Label>
                      <Input
                        id="costPerUnit"
                        name="costPerUnit"
                        type="number"
                        placeholder="0"
                        value={formData.costPerUnit}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="location">Location *</Label>
                    <Select value={formData.location} onValueChange={handleLocationChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Delhi Region">Delhi Region</SelectItem>
                        <SelectItem value="UP Region">UP Region</SelectItem>
                        <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                        <SelectItem value="Gujarat">Gujarat</SelectItem>
                        <SelectItem value="Karnataka">Karnataka</SelectItem>
                        <SelectItem value="Rajasthan">Rajasthan</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="supplier">Supplier</Label>
                    <Input
                      id="supplier"
                      name="supplier"
                      placeholder="Supplier name"
                      value={formData.supplier}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-4">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddMaterial} className="bg-green-600 hover:bg-green-700">
                      Add Material
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant={isFilterActive ? "default" : "outline"} className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filter
                  {isFilterActive && <Badge variant="secondary" className="ml-1">{selectedCategories.length + selectedStatuses.length + selectedLocations.length + (showLowStockOnly ? 1 : 0)}</Badge>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
                {/* Low Stock Filter */}
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Quick Filters</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="lowStock"
                        checked={showLowStockOnly}
                        onCheckedChange={(checked) => setShowLowStockOnly(checked as boolean)}
                      />
                      <Label htmlFor="lowStock" className="text-sm font-normal cursor-pointer">
                        Low Stock Items Only
                      </Label>
                    </div>
                  </div>

                  <DropdownMenuSeparator />

                  {/* Category Filter */}
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Categories</Label>
                    <div className="space-y-2">
                      {uniqueCategories.map(category => (
                        <div key={category} className="flex items-center space-x-2">
                          <Checkbox
                            id={`category-${category}`}
                            checked={selectedCategories.includes(category)}
                            onCheckedChange={() => toggleCategory(category)}
                          />
                          <Label htmlFor={`category-${category}`} className="text-sm font-normal cursor-pointer">
                            {category}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <DropdownMenuSeparator />

                  {/* Status Filter */}
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Status</Label>
                    <div className="space-y-2">
                      {uniqueStatuses.map(status => (
                        <div key={status} className="flex items-center space-x-2">
                          <Checkbox
                            id={`status-${status}`}
                            checked={selectedStatuses.includes(status)}
                            onCheckedChange={() => toggleStatus(status)}
                          />
                          <Label htmlFor={`status-${status}`} className="text-sm font-normal cursor-pointer capitalize">
                            {status}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <DropdownMenuSeparator />

                  {/* Location Filter */}
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Locations</Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {uniqueLocations.map(location => (
                        <div key={location} className="flex items-center space-x-2">
                          <Checkbox
                            id={`location-${location}`}
                            checked={selectedLocations.includes(location)}
                            onCheckedChange={() => toggleLocation(location)}
                          />
                          <Label htmlFor={`location-${location}`} className="text-sm font-normal cursor-pointer">
                            {location}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <DropdownMenuSeparator />

                  {/* Clear Filters Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="w-full"
                    disabled={!isFilterActive}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
              <Package className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">units across all categories</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <AlertCircle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.lowStock}</div>
              <p className="text-xs text-muted-foreground">require immediate attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{(summary.totalValue / 10000000).toFixed(2)}Cr</div>
              <p className="text-xs text-muted-foreground">inventory valuation</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <TrendingDown className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.categories}</div>
              <p className="text-xs text-muted-foreground">material types tracked</p>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Material Inventory</CardTitle>
            <CardDescription>Real-time tracking of all materials across regions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search materials, ID, or location..." 
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Materials Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material ID</TableHead>
                    <TableHead>Name & Category</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Stock / Reorder</TableHead>
                    <TableHead className="text-right">Cost/Unit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Loading materials...
                      </TableCell>
                    </TableRow>
                  ) : filteredMaterials.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No materials found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMaterials.map((material) => (
                      <TableRow key={material._id} className="hover:bg-muted/50">
                        <TableCell className="font-mono text-sm">{material._id.substring(material._id.length - 6).toUpperCase()}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{material.name}</div>
                            <div className="text-sm text-muted-foreground">{material.category}</div>
                          </div>
                        </TableCell>
                        <TableCell>{material.location}</TableCell>
                        <TableCell className="text-right">
                          <div className="font-medium">{material.quantity} {material.unit}</div>
                          <div className="text-xs text-muted-foreground">Reorder: {material.reorderLevel}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          {material.costPerUnit ? (
                            <span className="font-medium">₹{material.costPerUnit.toLocaleString()}</span>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(material.status)}>
                            {getStatusIcon(material.status)}
                            <span className="ml-1 capitalize">{material.status}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {material.updatedAt ? new Date(material.updatedAt).toLocaleDateString() : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Materials;
