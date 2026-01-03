import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Plus, FileDown, Send, Clock, DollarSign, AlertCircle, Scale } from "lucide-react";
import { CreateProcurementDialog } from "@/components/CreateProcurementDialog";
import { VendorComparison } from "@/components/VendorComparison";

type OrderStatus = "Processing" | "Confirmed" | "Pending";

interface PendingOrder {
  id: string;
  material: string;
  quantity: number;
  vendor: string;
  leadTime: string;
  status: OrderStatus;
  total: string;
}

interface ReorderItem {
  material: string;
  currentStock: number;
  threshold: number;
  deficit: number;
  status: "critical" | "warning" | "optimal";
}

interface SuggestedPurchase {
  material: string;
  needed: number;
  leadTime: string;
  vendor: string;
  cost: string;
  priority: "High" | "Medium";
}

interface VendorInfo {
  id: number;
  name: string;
  leadTime: string;
  cost: string;
  rating: number;
}

const Procurement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [prefillData, setPrefillData] = useState<{ material?: string; quantity?: number; vendor?: string } | undefined>(undefined);
  const [activeTab, setActiveTab] = useState("orders");
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([
    {
      id: "PO-001",
      material: "Tower Steel",
      quantity: 500,
      vendor: "Tata Steel",
      leadTime: "15 days",
      status: "Processing",
      total: "₹25,00,000",
    },
    {
      id: "PO-002",
      material: "Insulators",
      quantity: 120,
      vendor: "Modern Ceramics",
      leadTime: "8 days",
      status: "Confirmed",
      total: "₹4,80,000",
    },
    {
      id: "PO-003",
      material: "Conductors",
      quantity: 200,
      vendor: "Nexwire",
      leadTime: "12 days",
      status: "Pending",
      total: "₹6,00,000",
    },
  ]);

  const [reorderItems] = useState<ReorderItem[]>([
    { material: "Tower Steel", currentStock: 100, threshold: 200, deficit: 100, status: "critical" },
    { material: "Insulators", currentStock: 45, threshold: 100, deficit: 55, status: "warning" },
    { material: "Conductors", currentStock: 150, threshold: 120, deficit: 0, status: "optimal" },
    { material: "Transformers", currentStock: 20, threshold: 50, deficit: 30, status: "warning" },
  ]);

  const [budgetData] = useState([
    { category: "Steel", value: 35, fill: "#3b82f6" },
    { category: "Insulators", value: 25, fill: "#10b981" },
    { category: "Conductors", value: 20, fill: "#f59e0b" },
    { category: "Transformers", value: 20, fill: "#8b5cf6" },
  ]);

  const [suggestedPurchases] = useState<SuggestedPurchase[]>([
    { material: "Tower Steel", needed: 500, leadTime: "15 days", vendor: "Tata Steel", cost: "₹25,00,000", priority: "High" },
    { material: "Insulators", needed: 120, leadTime: "8 days", vendor: "Modern Ceramics", cost: "₹4,80,000", priority: "Medium" },
    { material: "Conductors", needed: 200, leadTime: "12 days", vendor: "Nexwire", cost: "₹6,00,000", priority: "High" },
  ]);

  const [vendors] = useState<VendorInfo[]>([
    { id: 1, name: "Tata Steel", leadTime: "15 days", cost: "₹25,00,000", rating: 4.8 },
    { id: 2, name: "Modern Ceramics", leadTime: "8 days", cost: "₹4,80,000", rating: 4.6 },
    { id: 3, name: "Nexwire", leadTime: "12 days", cost: "₹6,00,000", rating: 4.7 },
  ]);

  const [selectedMaterial, setSelectedMaterial] = useState<string | undefined>();
  const [quantity, setQuantity] = useState<number | "">("");
  const [selectedVendor, setSelectedVendor] = useState<string | undefined>();

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      Processing: "bg-blue-100 text-blue-800",
      Confirmed: "bg-green-100 text-green-800",
      Pending: "bg-yellow-100 text-yellow-800",
      critical: "bg-red-100 text-red-800",
      warning: "bg-yellow-100 text-yellow-800",
      optimal: "bg-green-100 text-green-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const filteredPendingOrders = pendingOrders.filter((order) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      order.id.toLowerCase().includes(term) ||
      order.material.toLowerCase().includes(term) ||
      order.vendor.toLowerCase().includes(term) ||
      order.status.toLowerCase().includes(term)
    );
  });

  const filteredSuggestedPurchases = suggestedPurchases.filter((purchase) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      purchase.material.toLowerCase().includes(term) ||
      purchase.vendor.toLowerCase().includes(term) ||
      purchase.priority.toLowerCase().includes(term)
    );
  });

  const resetCreateForm = () => {
    setSelectedMaterial(undefined);
    setQuantity("");
    setSelectedVendor(undefined);
  };

  const handleGeneratePO = () => {
    if (!selectedMaterial || !selectedVendor || !quantity) {
      // Basic guard: all fields are required for now
      return;
    }

    const nextIndex = pendingOrders.length + 1;
    const id = `PO-${nextIndex.toString().padStart(3, "0")}`;
    const vendorInfo = vendors.find((v) => v.name === selectedVendor);

    const newOrder: PendingOrder = {
      id,
      material: selectedMaterial,
      quantity: typeof quantity === "number" ? quantity : parseInt(quantity, 10),
      vendor: selectedVendor,
      leadTime: vendorInfo?.leadTime ?? "-",
      status: "Pending",
      total: vendorInfo?.cost ?? "-",
    };

    setPendingOrders((prev) => [...prev, newOrder]);
    resetCreateForm();
    setIsCreateOpen(false);
  };

  const handleSuggestionCreatePO = (purchase: SuggestedPurchase) => {
    // Use new dialog with prefilled data
    setPrefillData({
      material: purchase.material,
      quantity: purchase.needed,
      vendor: purchase.vendor,
    });
    setIsNewDialogOpen(true);
  };

  const handleNewDialogSuccess = () => {
    // Refresh orders list (in real app, fetch from backend)
    setPrefillData(undefined);
  };

  const handleExport = () => {
    if (!filteredSuggestedPurchases.length) return;

    const headers = ["Material", "Qty Needed", "Lead-time", "Vendor", "Cost", "Priority"];
    const rows = filteredSuggestedPurchases.map((p) => [
      p.material,
      String(p.needed),
      p.leadTime,
      p.vendor,
      p.cost,
      p.priority,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "suggested-purchases.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Procurement Dashboard</h1>
            <p className="text-muted-foreground">Manage orders, vendors, and optimize purchasing strategies</p>
          </div>
          <Button 
            className="bg-gradient-accent hover:opacity-90"
            onClick={() => {
              setPrefillData(undefined);
              setIsNewDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Purchase Order with Tax Calculator
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="ml-2">
                <Plus className="mr-2 h-4 w-4" />
                Quick Order (Legacy)
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Purchase Order</DialogTitle>
                <DialogDescription>Generate a new PO with recommended quantities and vendors</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Material</label>
                  <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select material" />
                    </SelectTrigger>
                    <SelectContent>
                      {reorderItems.map((item) => (
                        <SelectItem key={item.material} value={item.material}>
                          {item.material}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Quantity</label>
                  <Input
                    type="number"
                    placeholder="Enter quantity"
                    value={quantity}
                    onChange={(e) => {
                      const value = e.target.value;
                      setQuantity(value === "" ? "" : Number(value));
                    }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Vendor</label>
                  <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.name}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full bg-gradient-accent hover:opacity-90" onClick={handleGeneratePO}>
                  <Send className="mr-2 h-4 w-4" />
                  Generate PO
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* KPI Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-6 border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pending POs</p>
                <p className="text-3xl font-bold">{pendingOrders.length}</p>
                <p className="text-3xl font-bold">3</p>
              </div>
              <Clock className="h-10 w-10 text-blue-500 opacity-20" />
            </div>
            <p className="text-xs text-muted-foreground mt-4">₹36,00,000 in procurement</p>
          </Card>

          <Card className="p-6 border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Reorder Items</p>
                <p className="text-3xl font-bold">4</p>
              </div>
              <AlertCircle className="h-10 w-10 text-yellow-500 opacity-20" />
            </div>
            <p className="text-xs text-muted-foreground mt-4">2 items critical</p>
          </Card>

          <Card className="p-6 border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Budget Utilization</p>
                <p className="text-3xl font-bold">68%</p>
              </div>
              <DollarSign className="h-10 w-10 text-green-500 opacity-20" />
            </div>
            <p className="text-xs text-muted-foreground mt-4">₹50,00,000 allocated</p>
          </Card>
        </div>

        {/* Main Content - Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="orders">Orders & Analytics</TabsTrigger>
            <TabsTrigger value="vendors">
              <Scale className="h-4 w-4 mr-2" />
              Vendor Comparison
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-6 mt-6">
            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left Column - Orders and Reorder Items */}
              <div className="lg:col-span-2 space-y-6">
                {/* Pending Orders */}
                <Card className="p-6 border-border/50">
              <div className="flex items-center justify-between mb-4 gap-4">
                <h2 className="text-xl font-semibold">Active Purchase Orders</h2>
                <Input
                  className="max-w-xs"
                  placeholder="Search POs, materials, vendors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PO #</TableHead>
                      <TableHead>Material</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Lead Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPendingOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.id}</TableCell>
                        <TableCell>{order.material}</TableCell>
                        <TableCell>{order.quantity}</TableCell>
                        <TableCell>{order.vendor}</TableCell>
                        <TableCell>{order.leadTime}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(order.status)}`}>
                            {order.status}
                          </span>
                        </TableCell>
                        <TableCell className="font-semibold">{order.total}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>

            {/* Suggested Purchases */}
            <Card className="p-6 border-border/50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Suggested Purchases</h2>
                <Button size="sm" variant="outline" onClick={handleExport}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material</TableHead>
                      <TableHead>Qty Needed</TableHead>
                      <TableHead>Lead-time</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSuggestedPurchases.map((purchase, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{purchase.material}</TableCell>
                        <TableCell>{purchase.needed}</TableCell>
                        <TableCell>{purchase.leadTime}</TableCell>
                        <TableCell>{purchase.vendor}</TableCell>
                        <TableCell className="font-semibold">{purchase.cost}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            purchase.priority === "High" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {purchase.priority}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            className="bg-gradient-accent hover:opacity-90"
                            onClick={() => handleSuggestionCreatePO(purchase)}
                          >
                            Create PO
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>

          {/* Right Column - Charts and Insights */}
          <div className="space-y-6">
            {/* Budget Utilization */}
            <Card className="p-6 border-border/50">
              <h2 className="text-lg font-semibold mb-4">Budget Allocation</h2>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={budgetData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ category, value }) => `${category} ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {budgetData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {budgetData.map((item) => (
                  <div key={item.category} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.fill }}></div>
                      <span>{item.category}</span>
                    </div>
                    <span className="font-semibold">{item.value}%</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Reorder Status */}
            <Card className="p-6 border-border/50">
              <h2 className="text-lg font-semibold mb-4">Stock Alerts</h2>
              <div className="space-y-3">
                {reorderItems.map((item) => (
                  <div key={item.material} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{item.material}</p>
                      <p className="text-xs text-muted-foreground">Stock: {item.currentStock}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(item.status)}`}>
                      {item.deficit > 0 ? `-${item.deficit}` : "OK"}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Top Vendors */}
            <Card className="p-6 border-border/50">
              <h2 className="text-lg font-semibold mb-4">Top Vendors</h2>
              <div className="space-y-3">
                {vendors.map((vendor) => (
                  <div key={vendor.id} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium text-sm">{vendor.name}</p>
                      <span className="text-xs font-semibold text-yellow-600">★ {vendor.rating}</span>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Lead: {vendor.leadTime}</p>
                      <p>Cost: {vendor.cost}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="vendors" className="mt-6">
            <Card className="mb-4 bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-green-900">Real-time Vendor Database</h3>
                    <p className="text-sm text-green-700">
                      Vendors are loaded from the database with live performance metrics, ratings, and pricing. 
                      Filter by material category to find suitable vendors.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <VendorComparison 
              onVendorSelect={(vendor) => {
                // Prefill procurement dialog with selected vendor
                setPrefillData({
                  vendor: vendor.name
                });
                setIsNewDialogOpen(true);
              }}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* New Procurement Dialog with Tax Calculator */}
      <CreateProcurementDialog
        open={isNewDialogOpen}
        onOpenChange={setIsNewDialogOpen}
        onSuccess={handleNewDialogSuccess}
        prefillData={prefillData}
      />
    </div>
  );
};

export default Procurement;
