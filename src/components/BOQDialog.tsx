import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { boqAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface BOQDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

const BOQDialog = ({ isOpen, onClose, projectId, projectName }: BOQDialogProps) => {
  const [boqData, setBOQData] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const { toast } = useToast();

  const [newItem, setNewItem] = useState({
    itemCode: "",
    itemName: "",
    category: "Steel",
    unit: "MT",
    boqQuantity: 0,
    unitRate: 0,
    specifications: "",
    towerType: "N/A",
    remarks: ""
  });

  useEffect(() => {
    if (isOpen && projectId) {
      fetchBOQ();
    }
  }, [isOpen, projectId]);

  const fetchBOQ = async () => {
    try {
      setIsLoading(true);
      const response = await boqAPI.getByProject(projectId);
      setBOQData(response.data.data);
      setSummary(response.data.summary);
    } catch (error: any) {
      if (error.response?.status === 404) {
        // No BOQ exists yet
        setBOQData(null);
        setSummary(null);
      } else {
        toast({
          title: "Error",
          description: "Failed to load BOQ data",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.itemCode || !newItem.itemName || newItem.boqQuantity <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSaving(true);
      const itemToAdd = {
        ...newItem,
        totalCost: newItem.boqQuantity * newItem.unitRate
      };

      await boqAPI.addItem(projectId, itemToAdd);
      
      toast({
        title: "Success",
        description: "BOQ item added successfully"
      });

      // Reset form
      setNewItem({
        itemCode: "",
        itemName: "",
        category: "Steel",
        unit: "MT",
        boqQuantity: 0,
        unitRate: 0,
        specifications: "",
        towerType: "N/A",
        remarks: ""
      });
      setIsAddingItem(false);
      await fetchBOQ();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add BOQ item",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this BOQ item?")) return;

    try {
      await boqAPI.deleteItem(projectId, itemId);
      toast({
        title: "Success",
        description: "BOQ item deleted successfully"
      });
      await fetchBOQ();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete BOQ item",
        variant: "destructive"
      });
    }
  };

  const handleUpdateConsumption = async (itemId: string, consumedQty: number) => {
    try {
      await boqAPI.updateConsumption(projectId, itemId, consumedQty);
      toast({
        title: "Success",
        description: "Consumption updated successfully"
      });
      await fetchBOQ();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update consumption",
        variant: "destructive"
      });
    }
  };

  const handleApproveBOQ = async () => {
    if (!confirm("Are you sure you want to approve this BOQ?")) return;

    try {
      await boqAPI.approve(projectId);
      toast({
        title: "Success",
        description: "BOQ approved successfully"
      });
      await fetchBOQ();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve BOQ",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Bill of Quantities (BOQ)</DialogTitle>
          <DialogDescription>
            {projectName} - Manage material quantities and track consumption
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            {summary && (
              <div className="grid md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">Total Items</div>
                    <div className="text-2xl font-bold">{summary.totalItems}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">BOQ Value</div>
                    <div className="text-2xl font-bold">₹{(summary.totalBOQValue / 10000000).toFixed(2)}Cr</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">Consumed</div>
                    <div className="text-2xl font-bold">₹{(summary.totalConsumedValue / 10000000).toFixed(2)}Cr</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm text-muted-foreground">Progress</div>
                    <div className="text-2xl font-bold">{summary.overallProgress}%</div>
                    <Progress value={summary.overallProgress} className="mt-2" />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 flex-wrap">
              <Button onClick={() => setIsAddingItem(true)} className="flex-1 min-w-[150px]">
                <Plus className="h-4 w-4 mr-2" />
                Add BOQ Item
              </Button>
              {boqData && boqData.status !== 'Approved' && (
                <Button variant="outline" onClick={handleApproveBOQ} className="flex-1 min-w-[150px]">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve BOQ
                </Button>
              )}
            </div>

            {/* Add Item Form */}
            {isAddingItem && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Add New BOQ Item</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label>Item Code *</Label>
                      <Input
                        value={newItem.itemCode}
                        onChange={(e) => setNewItem({ ...newItem, itemCode: e.target.value })}
                        placeholder="e.g., STEEL-001"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Item Name *</Label>
                      <Input
                        value={newItem.itemName}
                        onChange={(e) => setNewItem({ ...newItem, itemName: e.target.value })}
                        placeholder="e.g., Angle Steel 150x150x12mm"
                      />
                    </div>
                    <div>
                      <Label>Category *</Label>
                      <Select value={newItem.category} onValueChange={(value) => setNewItem({ ...newItem, category: value })}>
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
                          <SelectItem value="Others">Others</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Unit *</Label>
                      <Select value={newItem.unit} onValueChange={(value) => setNewItem({ ...newItem, unit: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MT">MT</SelectItem>
                          <SelectItem value="KM">KM</SelectItem>
                          <SelectItem value="NOS">NOS</SelectItem>
                          <SelectItem value="Bags">Bags</SelectItem>
                          <SelectItem value="Kg">Kg</SelectItem>
                          <SelectItem value="Meters">Meters</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>BOQ Quantity *</Label>
                      <Input
                        type="number"
                        value={newItem.boqQuantity}
                        onChange={(e) => setNewItem({ ...newItem, boqQuantity: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label>Unit Rate (₹)</Label>
                      <Input
                        type="number"
                        value={newItem.unitRate}
                        onChange={(e) => setNewItem({ ...newItem, unitRate: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label>Tower Type</Label>
                      <Select value={newItem.towerType} onValueChange={(value) => setNewItem({ ...newItem, towerType: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="66kV Lattice">66kV Lattice</SelectItem>
                          <SelectItem value="132kV Lattice">132kV Lattice</SelectItem>
                          <SelectItem value="220kV Lattice">220kV Lattice</SelectItem>
                          <SelectItem value="400kV Lattice">400kV Lattice</SelectItem>
                          <SelectItem value="All">All</SelectItem>
                          <SelectItem value="N/A">N/A</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2">
                      <Label>Specifications</Label>
                      <Input
                        value={newItem.specifications}
                        onChange={(e) => setNewItem({ ...newItem, specifications: e.target.value })}
                        placeholder="e.g., IS:2062, Grade FE 540"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <Label>Remarks</Label>
                      <Textarea
                        value={newItem.remarks}
                        onChange={(e) => setNewItem({ ...newItem, remarks: e.target.value })}
                        placeholder="Additional notes..."
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={handleAddItem} disabled={isSaving}>
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Save Item
                    </Button>
                    <Button variant="outline" onClick={() => setIsAddingItem(false)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* BOQ Items Table */}
            {boqData && boqData.items && boqData.items.length > 0 ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>BOQ Items</CardTitle>
                    <Badge variant={boqData.status === 'Approved' ? 'default' : 'secondary'}>
                      {boqData.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item Code</TableHead>
                          <TableHead>Item Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead className="text-right">BOQ Qty</TableHead>
                          <TableHead className="text-right">Consumed</TableHead>
                          <TableHead className="text-right">Remaining</TableHead>
                          <TableHead className="text-right">Progress</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {boqData.items.map((item: any) => {
                          const remaining = item.boqQuantity - item.consumedQuantity;
                          const progress = item.boqQuantity > 0 ? ((item.consumedQuantity / item.boqQuantity) * 100) : 0;
                          
                          return (
                            <TableRow key={item._id}>
                              <TableCell className="font-medium">{item.itemCode}</TableCell>
                              <TableCell>
                                <div>{item.itemName}</div>
                                {item.specifications && (
                                  <div className="text-xs text-muted-foreground">{item.specifications}</div>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{item.category}</Badge>
                              </TableCell>
                              <TableCell>{item.unit}</TableCell>
                              <TableCell className="text-right font-semibold">{item.boqQuantity.toLocaleString()}</TableCell>
                              <TableCell className="text-right">{item.consumedQuantity.toLocaleString()}</TableCell>
                              <TableCell className="text-right">
                                <span className={remaining < item.boqQuantity * 0.2 ? 'text-red-600 font-semibold' : ''}>
                                  {remaining.toLocaleString()}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center gap-2">
                                  <Progress value={progress} className="w-16" />
                                  <span className="text-xs">{progress.toFixed(0)}%</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteItem(item._id)}
                                  disabled={boqData.status === 'Approved'}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No BOQ items added yet. Click "Add BOQ Item" to get started.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BOQDialog;
