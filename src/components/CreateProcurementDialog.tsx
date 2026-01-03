import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TaxCalculator } from '@/components/TaxCalculator';
import { procurementAPI, materialAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Package, FileText, Calculator, Loader2, Save, AlertCircle } from 'lucide-react';

interface CreateProcurementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  prefillData?: {
    material?: string;
    quantity?: number;
    vendor?: string;
  };
}

export const CreateProcurementDialog: React.FC<CreateProcurementDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
  prefillData,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState<any[]>([]);
  const [currentTab, setCurrentTab] = useState('basic');
  const [taxCalculation, setTaxCalculation] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    poNumber: '',
    material: '',
    materialName: '',
    quantity: 1,
    unitPrice: 0,
    vendor: {
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
    },
    priority: 'medium',
    dates: {
      orderDate: new Date().toISOString().split('T')[0],
      expectedDelivery: '',
    },
    originState: '',
    deliveryState: '',
    isImported: false,
    distance: 0,
    weight: 1,
    vehicleType: 'standard',
    additionalCharges: 0,
    notes: '',
  });

  // Fetch materials on mount
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const response = await materialAPI.getAll();
        setMaterials(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch materials:', error);
      }
    };
    fetchMaterials();
  }, []);

  // Prefill form data
  useEffect(() => {
    if (prefillData) {
      setFormData(prev => ({
        ...prev,
        materialName: prefillData.material || prev.materialName,
        quantity: prefillData.quantity || prev.quantity,
        weight: prefillData.quantity || prev.weight,
        vendor: {
          ...prev.vendor,
          name: prefillData.vendor || prev.vendor.name,
        },
      }));
    }
  }, [prefillData]);

  // Generate PO number
  useEffect(() => {
    if (open && !formData.poNumber) {
      const timestamp = Date.now();
      const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      setFormData(prev => ({
        ...prev,
        poNumber: `PO-${timestamp}-${randomSuffix}`,
      }));
    }
  }, [open]);

  const handleMaterialChange = (materialId: string) => {
    const material = materials.find(m => m._id === materialId);
    if (material) {
      setFormData(prev => ({
        ...prev,
        material: materialId,
        materialName: material.name,
        unitPrice: material.costPerUnit || 0,
      }));
    }
  };

  const handleTaxCalculation = (result: any) => {
    setTaxCalculation(result);
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.poNumber || !formData.material || !formData.quantity || !formData.unitPrice) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.vendor.name) {
      toast({
        title: 'Validation Error',
        description: 'Please provide vendor information',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Prepare procurement data
      const procurementData = {
        poNumber: formData.poNumber,
        material: formData.material,
        quantity: formData.quantity,
        unitPrice: formData.unitPrice,
        vendor: formData.vendor,
        priority: formData.priority,
        dates: formData.dates,
        originState: formData.originState,
        deliveryState: formData.deliveryState,
        isImported: formData.isImported,
        distance: formData.distance,
        weight: formData.weight,
        vehicleType: formData.vehicleType,
        additionalCharges: formData.additionalCharges,
        notes: formData.notes,
        pricing: {
          unitPrice: formData.unitPrice,
          totalAmount: formData.unitPrice * formData.quantity,
        },
      };

      const response = await procurementAPI.create(procurementData);

      toast({
        title: 'Procurement Order Created',
        description: `PO ${formData.poNumber} has been created successfully`,
      });

      // Reset form
      setFormData({
        poNumber: '',
        material: '',
        materialName: '',
        quantity: 1,
        unitPrice: 0,
        vendor: {
          name: '',
          contactPerson: '',
          email: '',
          phone: '',
          address: '',
        },
        priority: 'medium',
        dates: {
          orderDate: new Date().toISOString().split('T')[0],
          expectedDelivery: '',
        },
        originState: '',
        deliveryState: '',
        isImported: false,
        distance: 0,
        weight: 1,
        vehicleType: 'standard',
        additionalCharges: 0,
        notes: '',
      });
      setTaxCalculation(null);
      setCurrentTab('basic');
      onOpenChange(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: 'Failed to Create Order',
        description: error.response?.data?.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Create Procurement Order
          </DialogTitle>
          <DialogDescription>
            Create a new purchase order with automatic tax calculation
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">
              <FileText className="h-4 w-4 mr-2" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="vendor">
              <Package className="h-4 w-4 mr-2" />
              Vendor Details
            </TabsTrigger>
            <TabsTrigger value="tax">
              <Calculator className="h-4 w-4 mr-2" />
              Tax Calculation
            </TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* PO Number */}
                  <div className="space-y-2">
                    <Label htmlFor="poNumber">PO Number *</Label>
                    <Input
                      id="poNumber"
                      value={formData.poNumber}
                      onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                      placeholder="PO-XXXXX"
                    />
                  </div>

                  {/* Priority */}
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Material */}
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="material">Material *</Label>
                    <Select value={formData.material} onValueChange={handleMaterialChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select material" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {materials.map((material) => (
                          <SelectItem key={material._id} value={material._id}>
                            {material.name} - {material.category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quantity */}
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        quantity: parseFloat(e.target.value) || 1,
                        weight: parseFloat(e.target.value) || 1
                      })}
                      placeholder="Enter quantity"
                    />
                  </div>

                  {/* Unit Price */}
                  <div className="space-y-2">
                    <Label htmlFor="unitPrice">Unit Price (₹) *</Label>
                    <Input
                      id="unitPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.unitPrice}
                      onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                      placeholder="Enter unit price"
                    />
                  </div>

                  {/* Total Amount (Read-only) */}
                  <div className="col-span-2 space-y-2">
                    <Label>Total Base Amount</Label>
                    <div className="flex items-center h-10 px-3 py-2 rounded-md border border-input bg-muted">
                      <span className="font-semibold text-xl text-primary">
                        ₹{(formData.unitPrice * formData.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Order Date */}
                  <div className="space-y-2">
                    <Label htmlFor="orderDate">Order Date</Label>
                    <Input
                      id="orderDate"
                      type="date"
                      value={formData.dates.orderDate}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        dates: { ...formData.dates, orderDate: e.target.value }
                      })}
                    />
                  </div>

                  {/* Expected Delivery */}
                  <div className="space-y-2">
                    <Label htmlFor="expectedDelivery">Expected Delivery</Label>
                    <Input
                      id="expectedDelivery"
                      type="date"
                      value={formData.dates.expectedDelivery}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        dates: { ...formData.dates, expectedDelivery: e.target.value }
                      })}
                    />
                  </div>

                  {/* Notes */}
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Input
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Additional notes or requirements"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vendor Details Tab */}
          <TabsContent value="vendor" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vendor Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="vendorName">Vendor Name *</Label>
                    <Input
                      id="vendorName"
                      value={formData.vendor.name}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        vendor: { ...formData.vendor, name: e.target.value }
                      })}
                      placeholder="Enter vendor name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPerson">Contact Person</Label>
                    <Input
                      id="contactPerson"
                      value={formData.vendor.contactPerson}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        vendor: { ...formData.vendor, contactPerson: e.target.value }
                      })}
                      placeholder="Contact person name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vendorEmail">Email</Label>
                    <Input
                      id="vendorEmail"
                      type="email"
                      value={formData.vendor.email}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        vendor: { ...formData.vendor, email: e.target.value }
                      })}
                      placeholder="vendor@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vendorPhone">Phone</Label>
                    <Input
                      id="vendorPhone"
                      value={formData.vendor.phone}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        vendor: { ...formData.vendor, phone: e.target.value }
                      })}
                      placeholder="+91-XXXXXXXXXX"
                    />
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="vendorAddress">Address</Label>
                    <Input
                      id="vendorAddress"
                      value={formData.vendor.address}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        vendor: { ...formData.vendor, address: e.target.value }
                      })}
                      placeholder="Complete vendor address"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tax Calculation Tab */}
          <TabsContent value="tax" className="mt-4">
            <TaxCalculator
              materialId={formData.material}
              materialName={formData.materialName}
              quantity={formData.quantity}
              unitPrice={formData.unitPrice}
              onCalculationComplete={handleTaxCalculation}
              showRecommendations={true}
            />

            {taxCalculation && (
              <Card className="mt-4 border-green-500">
                <CardHeader className="bg-green-50">
                  <CardTitle className="text-green-700 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Tax Calculation Ready
                  </CardTitle>
                  <CardDescription>
                    Tax breakdown will be saved with the procurement order
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between text-lg">
                    <span>Order Total (with taxes):</span>
                    <Badge variant="default" className="text-lg px-4 py-2">
                      ₹{taxCalculation.taxCalculation.summary.grandTotal.toLocaleString('en-IN')}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <Separator className="my-4" />

        {/* Footer Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {currentTab !== 'basic' && (
              <Button
                variant="outline"
                onClick={() => {
                  const tabs = ['basic', 'vendor', 'tax'];
                  const currentIndex = tabs.indexOf(currentTab);
                  if (currentIndex > 0) {
                    setCurrentTab(tabs[currentIndex - 1]);
                  }
                }}
              >
                Previous
              </Button>
            )}
            {currentTab !== 'tax' && (
              <Button
                variant="outline"
                onClick={() => {
                  const tabs = ['basic', 'vendor', 'tax'];
                  const currentIndex = tabs.indexOf(currentTab);
                  if (currentIndex < tabs.length - 1) {
                    setCurrentTab(tabs[currentIndex + 1]);
                  }
                }}
              >
                Next
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Order
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
