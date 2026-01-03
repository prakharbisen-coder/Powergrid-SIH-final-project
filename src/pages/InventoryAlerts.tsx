import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, MapPin, Warehouse, Package, Plus, RefreshCw, Navigation } from "lucide-react";
import { inventoryAlertAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface WarehouseLocation {
  _id: string;
  warehouseId: string;
  name: string;
  location: {
    address: string;
    city: string;
    state: string;
    pincode: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  capacity: {
    total: number;
    used: number;
  };
  status: string;
}

interface MaterialStock {
  _id: string;
  warehouseId: string;
  materialName: string;
  qty: number;
  minQty: number;
  unit: string;
  category: string;
  alertStatus: string;
}

interface LowStockAlert {
  warehouse: {
    name: string;
    location: string;
  };
  material: {
    name: string;
    available: number;
    minimum_required: number;
    shortage: number;
    unit: string;
  };
  nearby_warehouses: {
    name: string;
    distance_km: number;
    travel_time: string;
    available_stock: number;
    can_supply: boolean;
  }[];
}

const InventoryAlerts = () => {
  const [warehouses, setWarehouses] = useState<WarehouseLocation[]>([]);
  const [alerts, setAlerts] = useState<LowStockAlert[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [materials, setMaterials] = useState<MaterialStock[]>([]);
  const [allLowStockMaterials, setAllLowStockMaterials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddWarehouseOpen, setIsAddWarehouseOpen] = useState(false);
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);
  const { toast } = useToast();

  // Form states
  const [newWarehouse, setNewWarehouse] = useState({
    warehouseId: '',
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    latitude: '',
    longitude: '',
    totalCapacity: '10000',
    usedCapacity: '0'
  });

  const [newMaterial, setNewMaterial] = useState({
    warehouseId: '',
    materialName: '',
    qty: '',
    minQty: '',
    unit: 'units',
    category: 'Steel'
  });

  useEffect(() => {
    fetchWarehouses();
    fetchAllAlerts();
  }, []);

  useEffect(() => {
    if (selectedWarehouse) {
      fetchWarehouseMaterials(selectedWarehouse);
    }
  }, [selectedWarehouse]);

  const fetchWarehouses = async () => {
    try {
      const data = await inventoryAlertAPI.getAllWarehouses();
      console.log('Warehouses response:', data);
      const warehouseList = data.data || data.warehouses || [];
      setWarehouses(warehouseList);
      if (warehouseList.length > 0 && !selectedWarehouse) {
        setSelectedWarehouse(warehouseList[0].warehouseId);
      }
    } catch (error: any) {
      console.error('Error fetching warehouses:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to load warehouses",
        variant: "destructive"
      });
    }
  };

  const fetchWarehouseMaterials = async (warehouseId: string) => {
    try {
      const data = await inventoryAlertAPI.getWarehouseMaterials(warehouseId);
      console.log('Materials response:', data);
      const materialList = data.materials || data.data || [];
      setMaterials(materialList);
    } catch (error: any) {
      console.error('Error fetching materials:', error);
    }
  };

  const fetchAllAlerts = async () => {
    setIsLoading(true);
    try {
      const data = await inventoryAlertAPI.getAllAlerts();
      console.log('Alerts response:', data);
      
      const lowStockItems = data.low_stock_materials || data.data || [];
      setAllLowStockMaterials(lowStockItems);
      
      if (lowStockItems.length > 0) {
        // Transform to alert format with nearby warehouses
        const alertPromises = lowStockItems.slice(0, 5).map(async (item: any) => {
          try {
            const alertData = await inventoryAlertAPI.testAlert(item.warehouseId, item.materialName);
            return alertData;
          } catch (error) {
            console.error(`Error fetching alert for ${item.materialName}:`, error);
            return null;
          }
        });
        const alertResults = await Promise.all(alertPromises);
        const validAlerts = alertResults.filter((a: any) => a !== null && a.status === 'LOW_STOCK_ALERT');
        console.log('Valid alerts:', validAlerts);
        setAlerts(validAlerts);
      } else {
        setAlerts([]);
      }
    } catch (error: any) {
      console.error('Error fetching alerts:', error);
      toast({
        title: "Error",
        description: "Failed to load inventory alerts",
        variant: "destructive"
      });
      setAlerts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddWarehouse = async () => {
    try {
      await inventoryAlertAPI.addWarehouse({
        warehouseId: newWarehouse.warehouseId,
        name: newWarehouse.name,
        location: {
          address: newWarehouse.address,
          city: newWarehouse.city,
          state: newWarehouse.state,
          pincode: newWarehouse.pincode,
          coordinates: {
            latitude: parseFloat(newWarehouse.latitude),
            longitude: parseFloat(newWarehouse.longitude)
          }
        },
        capacity: {
          total: parseInt(newWarehouse.totalCapacity),
          used: parseInt(newWarehouse.usedCapacity)
        }
      });

      toast({
        title: "Success",
        description: `Warehouse ${newWarehouse.name} added successfully`
      });

      setIsAddWarehouseOpen(false);
      setNewWarehouse({
        warehouseId: '',
        name: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        latitude: '',
        longitude: '',
        totalCapacity: '10000',
        usedCapacity: '0'
      });
      fetchWarehouses();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to add warehouse",
        variant: "destructive"
      });
    }
  };

  const handleAddMaterial = async () => {
    try {
      await inventoryAlertAPI.addMaterial({
        warehouseId: newMaterial.warehouseId,
        materialName: newMaterial.materialName,
        qty: parseInt(newMaterial.qty),
        minQty: parseInt(newMaterial.minQty),
        unit: newMaterial.unit,
        category: newMaterial.category
      });

      toast({
        title: "Success",
        description: `Material ${newMaterial.materialName} added successfully`
      });

      setIsAddMaterialOpen(false);
      setNewMaterial({
        warehouseId: '',
        materialName: '',
        qty: '',
        minQty: '',
        unit: 'units',
        category: 'Steel'
      });
      if (selectedWarehouse) {
        fetchWarehouseMaterials(selectedWarehouse);
      }
      fetchAllAlerts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to add material",
        variant: "destructive"
      });
    }
  };

  const handleRunStockCheck = async () => {
    setIsLoading(true);
    try {
      await inventoryAlertAPI.runStockCheck();
      toast({
        title: "Stock Check Complete",
        description: "Automated stock check completed successfully"
      });
      fetchAllAlerts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to run stock check",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'out-of-stock': return 'bg-red-500';
      case 'critical': return 'bg-orange-500';
      case 'low': return 'bg-yellow-500';
      case 'normal': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStockPercentage = (qty: number, minQty: number) => {
    return minQty > 0 ? Math.round((qty / minQty) * 100) : 0;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold mb-2">Inventory Warehouse Management</h1>
          <p className="text-muted-foreground">
            Geospatial low-stock alerts with nearby warehouse detection
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddWarehouseOpen} onOpenChange={setIsAddWarehouseOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Warehouse className="h-4 w-4 mr-2" />
                Add Warehouse
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Warehouse</DialogTitle>
                <DialogDescription>Enter warehouse details with GPS coordinates</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Warehouse ID</Label>
                  <Input
                    placeholder="WH001"
                    value={newWarehouse.warehouseId}
                    onChange={(e) => setNewWarehouse({ ...newWarehouse, warehouseId: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Warehouse Name</Label>
                  <Input
                    placeholder="Nagpur Central Warehouse"
                    value={newWarehouse.name}
                    onChange={(e) => setNewWarehouse({ ...newWarehouse, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Address</Label>
                  <Input
                    placeholder="MIDC Industrial Area"
                    value={newWarehouse.address}
                    onChange={(e) => setNewWarehouse({ ...newWarehouse, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    placeholder="Nagpur"
                    value={newWarehouse.city}
                    onChange={(e) => setNewWarehouse({ ...newWarehouse, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input
                    placeholder="Maharashtra"
                    value={newWarehouse.state}
                    onChange={(e) => setNewWarehouse({ ...newWarehouse, state: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pincode</Label>
                  <Input
                    placeholder="440016"
                    value={newWarehouse.pincode}
                    onChange={(e) => setNewWarehouse({ ...newWarehouse, pincode: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Latitude (°N)</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    placeholder="21.1458"
                    value={newWarehouse.latitude}
                    onChange={(e) => setNewWarehouse({ ...newWarehouse, latitude: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Longitude (°E)</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    placeholder="79.0882"
                    value={newWarehouse.longitude}
                    onChange={(e) => setNewWarehouse({ ...newWarehouse, longitude: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Total Capacity</Label>
                  <Input
                    type="number"
                    placeholder="10000"
                    value={newWarehouse.totalCapacity}
                    onChange={(e) => setNewWarehouse({ ...newWarehouse, totalCapacity: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleAddWarehouse} className="w-full">
                Add Warehouse
              </Button>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddMaterialOpen} onOpenChange={setIsAddMaterialOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Package className="h-4 w-4 mr-2" />
                Add Material
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Material to Warehouse</DialogTitle>
                <DialogDescription>Add new material inventory</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Warehouse</Label>
                  <select
                    className="w-full p-2 border rounded"
                    value={newMaterial.warehouseId}
                    onChange={(e) => setNewMaterial({ ...newMaterial, warehouseId: e.target.value })}
                  >
                    <option value="">Select Warehouse</option>
                    {warehouses.map((wh) => (
                      <option key={wh.warehouseId} value={wh.warehouseId}>
                        {wh.name} ({wh.location.city})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Material Name</Label>
                  <Input
                    placeholder="Tower Parts"
                    value={newMaterial.materialName}
                    onChange={(e) => setNewMaterial({ ...newMaterial, materialName: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Current Quantity</Label>
                    <Input
                      type="number"
                      placeholder="150"
                      value={newMaterial.qty}
                      onChange={(e) => setNewMaterial({ ...newMaterial, qty: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Minimum Quantity</Label>
                    <Input
                      type="number"
                      placeholder="300"
                      value={newMaterial.minQty}
                      onChange={(e) => setNewMaterial({ ...newMaterial, minQty: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <select
                      className="w-full p-2 border rounded"
                      value={newMaterial.unit}
                      onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}
                    >
                      <option value="units">Units</option>
                      <option value="meters">Meters</option>
                      <option value="kg">Kilograms</option>
                      <option value="tons">Tons</option>
                      <option value="pieces">Pieces</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <select
                      className="w-full p-2 border rounded"
                      value={newMaterial.category}
                      onChange={(e) => setNewMaterial({ ...newMaterial, category: e.target.value })}
                    >
                      <option value="Steel">Steel</option>
                      <option value="Conductors">Conductors</option>
                      <option value="Insulators">Insulators</option>
                      <option value="Transformers">Transformers</option>
                      <option value="Circuit Breakers">Circuit Breakers</option>
                      <option value="Cables">Cables</option>
                      <option value="Hardware">Hardware</option>
                    </select>
                  </div>
                </div>
              </div>
              <Button onClick={handleAddMaterial} className="w-full">
                Add Material
              </Button>
            </DialogContent>
          </Dialog>

          <Button onClick={handleRunStockCheck} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Run Stock Check
          </Button>
        </div>
      </div>

      {/* Quick Low Stock Overview */}
      {allLowStockMaterials.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Low Stock Materials ({allLowStockMaterials.length})
            </CardTitle>
            <CardDescription>Quick overview of all materials below threshold</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Current</TableHead>
                  <TableHead>Required</TableHead>
                  <TableHead>Shortage</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allLowStockMaterials.map((item, idx) => {
                  const warehouse = warehouses.find(w => w.warehouseId === item.warehouseId);
                  const shortage = (item.minQty || item.threshold) - (item.qty || item.quantity);
                  return (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">
                        {warehouse?.name || item.warehouseId || item.location}
                      </TableCell>
                      <TableCell>{item.materialName || item.name}</TableCell>
                      <TableCell>{item.qty || item.quantity} {item.unit}</TableCell>
                      <TableCell>{item.minQty || item.threshold} {item.unit}</TableCell>
                      <TableCell className="text-red-600 font-semibold">{shortage} {item.unit}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            item.alertStatus === 'out-of-stock' || item.status === 'out-of-stock' ? 'destructive' :
                            item.alertStatus === 'critical' || item.status === 'critical' ? 'destructive' : 
                            'default'
                          }
                          className={
                            item.alertStatus === 'out-of-stock' || item.status === 'out-of-stock' ? 'bg-red-500' :
                            item.alertStatus === 'critical' || item.status === 'critical' ? 'bg-orange-500' : 
                            'bg-yellow-500'
                          }
                        >
                          {(item.alertStatus || item.status || 'low').toUpperCase()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Low Stock Alerts with Geospatial Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Detailed Geospatial Alerts ({alerts.length})
          </CardTitle>
          <CardDescription>
            Materials with nearby warehouse suggestions (loading first 5 alerts...)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading detailed alerts...</div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {allLowStockMaterials.length > 0 ? 
                'Loading geospatial data for alerts above...' :
                'No low stock alerts. All warehouses are well-stocked! ✅'
              }
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert, idx) => (
                <Card key={idx} className="border-l-4 border-l-orange-500">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg flex items-center gap-2">
                          <Warehouse className="h-5 w-5" />
                          {alert.warehouse?.name || 'Warehouse'}
                        </h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {(alert.warehouse?.location as any)?.city || alert.warehouse?.location || 'Location'}
                        </p>
                      </div>
                      <Badge variant="destructive" className="text-sm">
                        LOW STOCK
                      </Badge>
                    </div>

                    <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{alert.material.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Available: {alert.material.available} {alert.material.unit}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Required Minimum</p>
                          <p className="font-bold text-orange-600">
                            {alert.material.minimum_required} {alert.material.unit}
                          </p>
                          <p className="text-xs text-red-600">
                            Shortage: {alert.material.shortage} {alert.material.unit}
                          </p>
                        </div>
                      </div>
                    </div>

                    {alert.nearby_warehouses.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Navigation className="h-4 w-4" />
                          Nearby Warehouses with Stock
                        </h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Warehouse</TableHead>
                              <TableHead>Distance</TableHead>
                              <TableHead>Travel Time</TableHead>
                              <TableHead>Available Stock</TableHead>
                              <TableHead>Can Supply</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {alert.nearby_warehouses.map((nearby, nIdx) => (
                              <TableRow key={nIdx}>
                                <TableCell className="font-medium">{nearby.name}</TableCell>
                                <TableCell>{nearby.distance_km.toFixed(1)} km</TableCell>
                                <TableCell>{nearby.travel_time}</TableCell>
                                <TableCell>
                                  {nearby.available_stock} {alert.material.unit}
                                </TableCell>
                                <TableCell>
                                  {nearby.can_supply ? (
                                    <Badge variant="default" className="bg-green-500">
                                      Yes
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary">No</Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Warehouse List */}
      <Card>
        <CardHeader>
          <CardTitle>All Warehouses</CardTitle>
          <CardDescription>Registered warehouse locations with GPS coordinates</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Coordinates</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {warehouses.map((wh) => (
                <TableRow key={wh._id}>
                  <TableCell className="font-mono text-sm">{wh.warehouseId}</TableCell>
                  <TableCell className="font-medium">{wh.name}</TableCell>
                  <TableCell>
                    {wh.location.city}, {wh.location.state}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {wh.location.coordinates.latitude.toFixed(4)}°N,{' '}
                    {wh.location.coordinates.longitude.toFixed(4)}°E
                  </TableCell>
                  <TableCell>
                    {wh.capacity.used} / {wh.capacity.total}
                  </TableCell>
                  <TableCell>
                    <Badge variant={wh.status === 'operational' ? 'default' : 'secondary'}>
                      {wh.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Warehouse Materials */}
      {selectedWarehouse && (
        <Card>
          <CardHeader>
            <CardTitle>
              Materials in {warehouses.find((w) => w.warehouseId === selectedWarehouse)?.name}
            </CardTitle>
            <CardDescription>Current inventory levels and alert status</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Minimum Required</TableHead>
                  <TableHead>Stock Level</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((mat) => (
                  <TableRow key={mat._id}>
                    <TableCell className="font-medium">{mat.materialName}</TableCell>
                    <TableCell>{mat.category}</TableCell>
                    <TableCell>
                      {mat.qty} {mat.unit}
                    </TableCell>
                    <TableCell>
                      {mat.minQty} {mat.unit}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getStatusColor(mat.alertStatus)}`}
                            style={{ width: `${Math.min(getStockPercentage(mat.qty, mat.minQty), 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {getStockPercentage(mat.qty, mat.minQty)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(mat.alertStatus)}>
                        {mat.alertStatus.toUpperCase()}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InventoryAlerts;
