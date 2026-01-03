import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { Plus, Recycle, AlertTriangle, TrendingDown, Trash2, X } from "lucide-react";
import { materialAPI, warehouseAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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
  updatedAt?: string;
}

interface WarehouseMaterial {
  id: string;
  name: string;
  category: string;
  location: string;
  quantity: number;
  threshold: number;
  status: "Optimal" | "Low" | "Critical";
  reusable: number;
  lastUpdated: string;
}

interface ReuseableMaterial {
  id: number;
  material: string;
  quantity: number;
  source: string;
  condition: string;
  potentialUse: string;
}

const Warehouse = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [materials, setMaterials] = useState<WarehouseMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<string | null>(null);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch materials from backend
  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    setIsLoading(true);
    try {
      const response = await materialAPI.getAll();
      const dbMaterials: Material[] = response.data.data;
      
      // Transform backend materials to warehouse format
      const warehouseMaterials: WarehouseMaterial[] = dbMaterials.map((material: any) => {
        // Map backend status to warehouse display status
        let status: "Optimal" | "Low" | "Critical" = "Optimal";
        if (material.status === "out-of-stock" || material.status === "critical") {
          status = "Critical";
        } else if (material.status === "low") {
          status = "Low";
        } else {
          status = "Optimal";
        }

        return {
          id: material._id,
          name: material.name || material.materialName || "Unknown",
          category: material.category || "Others",
          location: material.location || material.projectSite || "Unknown",
          quantity: material.quantity || material.currentStock || 0,
          threshold: material.reorderLevel || material.threshold || 0,
          status: status,
          reusable: material.reusable || 0,
          lastUpdated: material.updatedAt || material.lastUpdated
            ? new Date(material.updatedAt || material.lastUpdated).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0]
        };
      });

      setMaterials(warehouseMaterials);
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

  // Generate stock level data from materials
  const stockLevelData = materials.slice(0, 8).map(material => ({
    name: material.name.length > 15 ? material.name.substring(0, 15) + '...' : material.name,
    current: material.quantity,
    threshold: material.threshold,
    fill: material.status === "Critical" ? "#ef4444" : 
          material.status === "Low" ? "#f59e0b" : "#10b981"
  }));

  const [reuseableMaterials, setReuseableMaterials] = useState<ReuseableMaterial[]>([
    {
      id: 1,
      material: "Steel Angles",
      quantity: 32,
      source: "Site 14 - Returned",
      condition: "Good",
      potentialUse: "Tower extensions",
    },
    {
      id: 2,
      material: "Insulators",
      quantity: 12,
      source: "Site 8 - Surplus",
      condition: "Excellent",
      potentialUse: "Future projects",
    },
    {
      id: 3,
      material: "Conductors",
      quantity: 45,
      source: "Site 12 - Replaced",
      condition: "Fair",
      potentialUse: "Testing lines",
    },
    {
      id: 4,
      material: "Hardware Kits",
      quantity: 8,
      source: "Stock clearance",
      condition: "Good",
      potentialUse: "Maintenance tasks",
    },
  ]);

  const [newMaterialName, setNewMaterialName] = useState("");
  const [newCategory, setNewCategory] = useState<string | undefined>();
  const [newQuantity, setNewQuantity] = useState<number | "">("");
  const [newLocation, setNewLocation] = useState<string | undefined>();
  const [newThreshold, setNewThreshold] = useState<number | "">("");

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      "Optimal": "bg-green-100 text-green-800",
      "Low": "bg-yellow-100 text-yellow-800",
      "Critical": "bg-red-100 text-red-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getConditionColor = (condition: string) => {
    const colors: Record<string, string> = {
      "Excellent": "bg-green-100 text-green-800",
      "Good": "bg-blue-100 text-blue-800",
      "Fair": "bg-yellow-100 text-yellow-800"
    };
    return colors[condition] || "bg-gray-100 text-gray-800";
  };

  const filteredMaterials = materials.filter((material) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      material.id.toLowerCase().includes(term) ||
      material.name.toLowerCase().includes(term) ||
      material.category.toLowerCase().includes(term) ||
      material.location.toLowerCase().includes(term) ||
      material.status.toLowerCase().includes(term)
    );
  });

  const handleAddMaterial = async () => {
    if (!newMaterialName || !newCategory || !newLocation || !newQuantity || !newThreshold) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const quantityNumber = typeof newQuantity === "number" ? newQuantity : parseInt(String(newQuantity), 10);
      const thresholdNumber = typeof newThreshold === "number" ? newThreshold : parseInt(String(newThreshold), 10);

      // Determine status based on quantity vs threshold (will be auto-calculated by backend)
      const displayCategory =
        newCategory === "structural"
          ? "Steel"
          : newCategory === "electrical"
            ? "Conductors"
            : newCategory === "equipment"
              ? "Earthing"
              : "Nuts/Bolts";

      // Map category to subCategory
      const subCategory =
        displayCategory === "Steel" ? "Angle Steel"
        : displayCategory === "Conductors" ? "ACSR Conductors"
        : displayCategory === "Earthing" ? "Earth Rods"
        : "Foundation Bolts";

      const displayLocation =
        newLocation === "block-a" ? "Block A" : newLocation === "block-b" ? "Block B" : "Block C";

      // Generate unique material ID
      const materialId = `MAT-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

      // Create material in database
      const materialData = {
        materialId: materialId,
        name: newMaterialName,
        category: displayCategory,
        subCategory: subCategory,
        quantity: quantityNumber,
        unit: "units",
        threshold: thresholdNumber,
        location: displayLocation,
        supplier: "Warehouse Stock",
        price: 0,
        reusable: 0
      };

      await materialAPI.create(materialData);
      
      toast({
        title: "✅ Material Added",
        description: `${newMaterialName} has been added to warehouse inventory`,
      });

      // Refresh materials list
      fetchMaterials();

      // Reset form
      setNewMaterialName("");
      setNewCategory(undefined);
      setNewQuantity("");
      setNewLocation(undefined);
      setNewThreshold("");
      setIsAddOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to add material",
        variant: "destructive"
      });
    }
  };

  const handleStockAudit = () => {
    window.alert("Stock audit triggered. Review the inventory table for discrepancies.");
  };

  const handleReuseSuggestions = () => {
    const section = document.getElementById("reuse-section");
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleLowStockAlert = () => {
    const section = document.getElementById("critical-alerts");
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleAllocate = (id: number) => {
    setReuseableMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, quantity: 0 } : m)),
    );
  };

  // Handle single material deletion
  const handleDeleteMaterial = async (materialId: string) => {
    try {
      await materialAPI.delete(materialId);
      
      toast({
        title: "✅ Material Deleted",
        description: "Material has been removed from inventory",
      });
      
      fetchMaterials();
      setIsDeleteDialogOpen(false);
      setMaterialToDelete(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete material",
        variant: "destructive"
      });
    }
  };

  // Handle bulk deletion
  const handleBulkDelete = async () => {
    try {
      await materialAPI.bulkDelete(selectedMaterials);
      
      toast({
        title: "✅ Materials Deleted",
        description: `${selectedMaterials.length} material(s) have been removed from inventory`,
      });
      
      setSelectedMaterials([]);
      fetchMaterials();
      setIsBulkDeleteDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete materials",
        variant: "destructive"
      });
    }
  };

  // Handle select/deselect all
  const handleSelectAll = (checked: boolean | string) => {
    const isChecked = checked === true || checked === 'indeterminate';
    if (isChecked) {
      setSelectedMaterials(filteredMaterials.map(m => m.id));
    } else {
      setSelectedMaterials([]);
    }
  };

  // Handle individual checkbox
  const handleSelectMaterial = (materialId: string, checked: boolean | string) => {
    const isChecked = checked === true || checked === 'indeterminate';
    if (isChecked) {
      setSelectedMaterials(prev => [...prev, materialId]);
    } else {
      setSelectedMaterials(prev => prev.filter(id => id !== materialId));
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Warehouse Management</h1>
            <p className="text-muted-foreground">Track inventory levels and optimize material reuse strategies</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={fetchMaterials}
              disabled={isLoading}
            >
              {isLoading ? "Refreshing..." : "Refresh"}
            </Button>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-accent hover:opacity-90">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Material
                </Button>
              </DialogTrigger>
              <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Material</DialogTitle>
                <DialogDescription>Record new inventory arrival to warehouse</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Material Name</label>
                  <Input
                    placeholder="e.g., Tower Steel"
                    value={newMaterialName}
                    onChange={(e) => setNewMaterialName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select value={newCategory} onValueChange={setNewCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="structural">Structural</SelectItem>
                      <SelectItem value="electrical">Electrical</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="hardware">Hardware</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Quantity</label>
                  <Input
                    type="number"
                    placeholder="Enter quantity"
                    value={newQuantity}
                    onChange={(e) => {
                      const value = e.target.value;
                      setNewQuantity(value === "" ? "" : Number(value));
                    }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Location</label>
                  <Select value={newLocation} onValueChange={setNewLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="block-a">Block A</SelectItem>
                      <SelectItem value="block-b">Block B</SelectItem>
                      <SelectItem value="block-c">Block C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Safety Threshold</label>
                  <Input
                    type="number"
                    placeholder="Minimum stock level"
                    value={newThreshold}
                    onChange={(e) => {
                      const value = e.target.value;
                      setNewThreshold(value === "" ? "" : Number(value));
                    }}
                  />
                </div>
                <Button className="w-full bg-gradient-accent hover:opacity-90" onClick={handleAddMaterial}>
                  Add to Inventory
                </Button>
              </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="p-6 border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Items</p>
                <p className="text-3xl font-bold">{materials.length}</p>
              </div>
              <TrendingDown className="h-10 w-10 text-blue-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-6 border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">At Threshold</p>
                <p className="text-3xl font-bold">{materials.filter(m => m.status !== "Optimal").length}</p>
              </div>
              <AlertTriangle className="h-10 w-10 text-yellow-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-6 border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Reusable Units</p>
                <p className="text-3xl font-bold">{reuseableMaterials.reduce((sum, m) => sum + m.quantity, 0)}</p>
              </div>
              <Recycle className="h-10 w-10 text-green-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-6 border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Storage Utilization</p>
                <p className="text-3xl font-bold">72%</p>
              </div>
              <TrendingDown className="h-10 w-10 text-purple-500 opacity-20" />
            </div>
          </Card>
        </div>

        {/* Stock Level Chart */}
        <Card className="p-6 border-border/50">
          <h2 className="text-xl font-semibold mb-4">Stock Level Overview</h2>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={stockLevelData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis dataKey="name" stroke="rgba(0,0,0,0.5)" />
              <YAxis stroke="rgba(0,0,0,0.5)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #ddd",
                  borderRadius: "8px"
                }}
              />
              <Legend />
              <Bar dataKey="current" fill="#3b82f6" name="Current Stock" />
              <Bar dataKey="threshold" fill="#f59e0b" name="Safety Threshold" />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-muted-foreground mt-4">
            Red zone indicates stock below safety threshold - reorder recommended
          </p>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Inventory Table */}
          <div className="lg:col-span-2" id="inventory-section">
            <Card className="p-6 border-border/50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Inventory Status</h2>
                <div className="flex items-center gap-3">
                  {selectedMaterials.length > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setIsBulkDeleteDialogOpen(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete ({selectedMaterials.length})
                    </Button>
                  )}
                  <Input
                    placeholder="Search materials..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedMaterials.length === filteredMaterials.length && filteredMaterials.length > 0}
                          onCheckedChange={(checked) => handleSelectAll(checked)}
                        />
                      </TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Material</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Reusable</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8">
                          Loading materials from database...
                        </TableCell>
                      </TableRow>
                    ) : filteredMaterials.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                          {searchTerm ? "No materials found matching your search" : "No materials in warehouse"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMaterials.map((material) => (
                        <TableRow key={material.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedMaterials.includes(material.id)}
                              onCheckedChange={(checked) => handleSelectMaterial(material.id, checked)}
                            />
                          </TableCell>
                          <TableCell className="font-medium text-sm">{material.id.substring(material.id.length - 6).toUpperCase()}</TableCell>
                          <TableCell className="font-medium">{material.name}</TableCell>
                          <TableCell className="text-sm">{material.category}</TableCell>
                          <TableCell className="text-sm">{material.location}</TableCell>
                          <TableCell className="font-semibold">
                            {material.quantity}
                            <span className="text-xs text-muted-foreground ml-1">
                              (Threshold: {material.threshold})
                            </span>
                          </TableCell>
                          <TableCell>
                            {material.reusable > 0 ? (
                              <span className="flex items-center gap-1 text-green-700 font-semibold">
                                <Recycle className="h-3 w-3" />
                                {material.reusable} units
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(material.status)}`}>
                              {material.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{material.lastUpdated}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setMaterialToDelete(material.id);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <Card className="p-6 border-border/50">
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={handleStockAudit}>
                  <TrendingDown className="mr-2 h-4 w-4" />
                  Stock Audit
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={handleReuseSuggestions}>
                  <Recycle className="mr-2 h-4 w-4" />
                  Reuse Suggestions
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={handleLowStockAlert}>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Low Stock Alert
                </Button>
              </div>
            </Card>

            {/* Critical Alerts */}
            <Card className="p-6 border-red-200 bg-red-50 border-2" id="critical-alerts">
              <h3 className="font-semibold text-red-900 mb-3">Critical Alerts</h3>
              <div className="space-y-2">
                {materials.filter(m => m.status === "Critical").map((m) => (
                  <div key={m.id} className="p-3 bg-white rounded border border-red-200">
                    <p className="text-sm font-medium text-red-900">{m.name}</p>
                    <p className="text-xs text-red-700">Current: {m.quantity} (Threshold: {m.threshold})</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Reusable Materials Section */}
        <Card className="p-6 border-border/50" id="reuse-section">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Recycle className="h-5 w-5 text-green-600" />
              Leftover Materials - Reuse Suggestions
            </h2>
            <Button variant="outline" size="sm" onClick={handleReuseSuggestions}>
              View Full Reuse Catalog
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Quantity Available</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Potential Use</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reuseableMaterials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell className="font-medium">{material.material}</TableCell>
                    <TableCell className="font-semibold text-green-700">{material.quantity} units</TableCell>
                    <TableCell className="text-sm">{material.source}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(material.condition)}`}>
                        {material.condition}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{material.potentialUse}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 hover:text-green-700"
                        onClick={() => handleAllocate(material.id)}
                        disabled={material.quantity === 0}
                      >
                        {material.quantity === 0 ? "Allocated" : "Allocate"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <p className="text-sm text-muted-foreground mt-4 p-3 bg-blue-50 rounded border border-blue-200">
            💡 <strong>Tip:</strong> Reusing leftover materials can reduce project costs by 15-20% and promote sustainability.
          </p>
        </Card>
      </div>

      {/* Single Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the material from the warehouse inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => materialToDelete && handleDeleteMaterial(materialToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Materials?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to delete <strong>{selectedMaterials.length}</strong> material(s) from the warehouse inventory.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsBulkDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete {selectedMaterials.length} Material(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Warehouse;
